import { EDUCATIONAL_CHAT_SYSTEM_PROMPT } from "@/lib/grok/educational-system-prompt";
import {
  fetchGroqChatModelIds,
  isGroqModelAccessError,
  rankGroqChatModels,
} from "@/lib/grok/groq-models";

export type GrokChatMessage = {
  role: "user" | "assistant";
  content: string;
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

type CompletionJson = {
  error?: { message?: string };
  choices?: Array<{ message?: { content?: string } }>;
};

async function requestChatCompletion(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: GrokChatMessage[]
): Promise<{ ok: true; text: string } | { ok: false; status: number; message: string }> {
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

  const json = (await res.json()) as CompletionJson;
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      message: json.error?.message?.trim() || res.statusText || "Request failed",
    };
  }

  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) {
    return { ok: false, status: 500, message: "No response from assistant" };
  }
  return { ok: true, text };
}

async function createGroqReply(apiKey: string, messages: GrokChatMessage[]): Promise<string> {
  const baseUrl = "https://api.groq.com/openai/v1";
  const available = await fetchGroqChatModelIds(apiKey);
  const models = rankGroqChatModels(available, trimEnv(process.env.GROQ_CHAT_MODEL));

  let lastError = "Groq chat failed.";
  for (const model of models) {
    const result = await requestChatCompletion(baseUrl, apiKey, model, messages);
    if (result.ok) {
      return result.text;
    }
    lastError = result.message;
    if (result.status === 401 || result.status === 403) {
      throw new Error("Invalid Groq API key. Create a new key at console.groq.com and set GROQ_API_KEY.");
    }
    if (!isGroqModelAccessError(result.message)) {
      throw new Error(result.message);
    }
  }

  throw new Error(
    `${lastError} Check GROQ_API_KEY at console.groq.com — your account may need a new API key or enabled models.`
  );
}

async function createXaiReply(apiKey: string, messages: GrokChatMessage[]): Promise<string> {
  const baseUrl = "https://api.x.ai/v1";
  const model = trimEnv(process.env.XAI_CHAT_MODEL) || "grok-2-1212";
  const result = await requestChatCompletion(baseUrl, apiKey, model, messages);
  if (result.ok) return result.text;

  if (result.status === 401 || result.status === 403) {
    throw new Error("Invalid xAI API key. Use a key from console.x.ai or set GROQ_API_KEY for Groq.");
  }
  throw new Error(
    result.message ||
      "xAI rejected the request. Use a valid key from console.x.ai, or set GROQ_API_KEY for Groq."
  );
}

export async function createEducationalChatReply(messages: GrokChatMessage[]): Promise<string> {
  const { apiKey, provider } = getCredentials();
  if (provider === "groq") {
    return createGroqReply(apiKey, messages);
  }
  return createXaiReply(apiKey, messages);
}
