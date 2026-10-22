import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireTeacherPortal } from "@/lib/teacher/api-auth";
import { createEducationalChatReply } from "@/lib/grok/chat";

export const runtime = "nodejs";

const bodySchema = z.object({
  prompt: z.string().trim().min(10).max(4000),
  planMode: z.enum(["quick", "detailed"]).optional(),
});

export async function POST(request: Request) {
  const sessionResult = await requireTeacherPortal();
  if ("error" in sessionResult) return sessionResult.error;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return jsonError("Invalid request", 400);

  const mode = parsed.data.planMode ?? "quick";
  const systemHint =
    mode === "detailed"
      ? "Respond with a detailed lesson plan. Use clear section headings: Learning objective, Essential question, Materials, Warm-up, Instruction, Assessment, Homework, Differentiation."
      : "Respond with a concise quick lesson plan. Use headings: Learning objective, Materials, Instruction, Assessment, Homework.";

  try {
    const reply = await createEducationalChatReply([
      {
        role: "user",
        content: `${systemHint}\n\nTeacher request:\n${parsed.data.prompt}`,
      },
    ]);
    return jsonOk({ suggestion: reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI assist failed";
    const status = message.includes("not configured") ? 503 : 500;
    return jsonError(message, status);
  }
}
