import { EDUCATIONAL_CHAT_SYSTEM_PROMPT } from "@/lib/grok/educational-system-prompt";

export type GrokChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function getApiKey(): string {
  const key = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  if (!key?.trim()) {
    throw new Error("Chat is not configured. Please add XAI_API_KEY or GROK_API_KEY.");
  }
  return key.trim();
}

function getModel(): string {
  return process.env.XAI_CHAT_MODEL?.trim() || "grok-3-mini";
}

export async function createEducationalChatReply(messages: GrokChatMessage[]): Promise<string> {
  const apiKey = getApiKey();
  const model = getModel();

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 1024,
      messages: [
        { role: "system", content: EDUCATIONAL_CHAT_SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  const json = (await res.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!res.ok) {
    const detail = json.error?.message || res.statusText || "Request failed";
    throw new Error(detail);
  }

  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("No response from assistant");
  }
  return text;
}
