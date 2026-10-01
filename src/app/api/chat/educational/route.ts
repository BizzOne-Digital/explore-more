import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createEducationalChatReply } from "@/lib/grok/chat";

export const runtime = "nodejs";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      })
    )
    .min(1)
    .max(24),
});

export async function POST(request: Request) {
  try {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return jsonError("Invalid message format", 400);
    }

    const messages = parsed.data.messages.slice(-20);
    const last = messages[messages.length - 1];
    if (last.role !== "user") {
      return jsonError("Last message must be from the user", 400);
    }

    const reply = await createEducationalChatReply(messages);
    return jsonOk({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat failed";
    const status = message.includes("not configured") ? 503 : 500;
    console.error("[educational-chat]", message);
    return jsonError(message, status);
  }
}
