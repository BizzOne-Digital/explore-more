import { EDUCATIONAL_CHAT_SYSTEM_PROMPT } from "@/lib/grok/educational-system-prompt";

export type GrokChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatProvider = {
  baseUrl: string;
  model: string;
};

function trimEnv(value: string | undefined): string {
  return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

type Credentials = { apiKey: string; provider: "groq" | "xai" };

function getCredentials(): Credentials {
  const groqKey = trimEnv(process.env.GROQ_API_KEY);
  if (groqKey) {
    const apiKey = groqKey.startsWith("gsk_") ? groqKey : `gsk_${groqKey}`;
    return { apiKey, provider: "groq" };
  }

  const chatProvider = trimEnv(process.env.CHAT_PROVIDER).toLowerCase();
  const xaiKey = trimEnv(process.env.XAI_API_KEY) || trimEnv(process.env.GROK_API_KEY);

  if (!xaiKey) {
    throw new Error(
      "Chat is not configured. Set GROQ_API_KEY (Groq, gsk_…) or XAI_API_KEY (Grok at console.x.ai)."
    );
  }

  if (chatProvider === "groq" || xaiKey.startsWith("gsk_")) {
    const apiKey = xaiKey.startsWith("gsk_") ? xaiKey : `gsk_${xaiKey}`;
    return { apiKey, provider: "groq" };
  }

  return { apiKey: xaiKey, provider: "xai" };
}

function resolveProvider(provider: "groq" | "xai"): ChatProvider {
  if (provider === "groq") {
    return {
      baseUrl: "https://api.groq.com/openai/v1",
      model: trimEnv(process.env.GROQ_CHAT_MODEL) || "llama-3.1-8b-instant",
    };
  }
  return {
    baseUrl: "https://api.x.ai/v1",
    model: trimEnv(process.env.XAI_CHAT_MODEL) || "grok-2-1212",
  };
}

export async function createEducationalChatReply(messages: GrokChatMessage[]): Promise<string> {
  const { apiKey, provider } = getCredentials();
  const { baseUrl, model } = resolveProvider(provider);

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
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!res.ok) {
    const detail = json.error?.message?.trim();
    if (res.status === 401 || res.status === 403) {
      throw new Error("Invalid API key. Check GROQ_API_KEY or XAI_API_KEY in your environment.");
    }
    if (provider === "groq") {
      throw new Error(detail || "Groq rejected the request. Use a full gsk_ key from console.groq.com.");
    }
    throw new Error(
      detail ||
        "xAI rejected the request. Use a valid key from console.x.ai, or set GROQ_API_KEY for Groq."
    );
  }

  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("No response from assistant");
  }
  return text;
}
