import { EDUCATIONAL_CHAT_SYSTEM_PROMPT } from "@/lib/grok/educational-system-prompt";

export type GrokChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatProvider = {
  baseUrl: string;
  model: string;
  label: string;
};

function getApiKey(): string {
  const key =
    process.env.XAI_API_KEY ||
    process.env.GROK_API_KEY ||
    process.env.GROQ_API_KEY;
  if (!key?.trim()) {
    throw new Error(
      "Chat is not configured. Add XAI_API_KEY (Grok at console.x.ai) or GROQ_API_KEY (console.groq.com)."
    );
  }
  return key.trim();
}

function resolveProvider(apiKey: string): ChatProvider {
  // Groq keys start with gsk_ — OpenAI-compatible API (not the same as xAI Grok).
  if (apiKey.startsWith("gsk_")) {
    return {
      baseUrl: "https://api.groq.com/openai/v1",
      model: process.env.GROQ_CHAT_MODEL?.trim() || "llama-3.3-70b-versatile",
      label: "Groq",
    };
  }

  return {
    baseUrl: "https://api.x.ai/v1",
    model: process.env.XAI_CHAT_MODEL?.trim() || "grok-2-1212",
    label: "xAI Grok",
  };
}

export async function createEducationalChatReply(messages: GrokChatMessage[]): Promise<string> {
  const apiKey = getApiKey();
  const { baseUrl, model } = resolveProvider(apiKey);

  const res = await fetch(`${baseUrl}/chat/completions`, {
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
    error?: { message?: string; code?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!res.ok) {
    const detail = json.error?.message?.trim();
    if (res.status === 401 || res.status === 403) {
      throw new Error("Invalid API key. Check XAI_API_KEY or GROQ_API_KEY in your environment.");
    }
    if (res.status === 400 && apiKey.startsWith("gsk_")) {
      throw new Error(detail || "Groq rejected the request. Check GROQ_API_KEY and model name.");
    }
    if (res.status === 400 && !apiKey.startsWith("gsk_")) {
      throw new Error(
        detail ||
          "xAI rejected the request. Use a key from console.x.ai (not Groq gsk_ keys) or set GROQ_API_KEY for Groq."
      );
    }
    throw new Error(detail || res.statusText || "Request failed");
  }

  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("No response from assistant");
  }
  return text;
}
