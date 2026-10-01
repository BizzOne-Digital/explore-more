const GROQ_PREFERRED_CHAT_MODELS = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
  "allam-2-7b",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
  "llama-3.3-70b-versatile",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "qwen/qwen3-32b",
] as const;

const GROQ_EXCLUDED_MODEL_PATTERNS = [
  /whisper/i,
  /distil-whisper/i,
  /guard/i,
  /embed/i,
  /tts/i,
  /orpheus/i,
];

let cachedModelIds: string[] | null = null;
let cacheExpiresAt = 0;

function isChatModelId(id: string): boolean {
  return !GROQ_EXCLUDED_MODEL_PATTERNS.some((re) => re.test(id));
}

export function rankGroqChatModels(availableIds: string[], preferredFromEnv?: string): string[] {
  const available = new Set(availableIds.filter(isChatModelId));
  const ordered: string[] = [];

  if (preferredFromEnv && available.has(preferredFromEnv)) {
    ordered.push(preferredFromEnv);
  }

  for (const id of GROQ_PREFERRED_CHAT_MODELS) {
    if (available.has(id) && !ordered.includes(id)) {
      ordered.push(id);
    }
  }

  for (const id of availableIds) {
    if (isChatModelId(id) && !ordered.includes(id)) {
      ordered.push(id);
    }
  }

  return ordered;
}

export async function fetchGroqChatModelIds(apiKey: string): Promise<string[]> {
  const now = Date.now();
  if (cachedModelIds && cacheExpiresAt > now) {
    return cachedModelIds;
  }

  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    return [...GROQ_PREFERRED_CHAT_MODELS];
  }

  const json = (await res.json()) as { data?: Array<{ id?: string }> };
  const ids = (json.data ?? []).map((m) => m.id).filter((id): id is string => Boolean(id));

  cachedModelIds = ids.length > 0 ? ids : [...GROQ_PREFERRED_CHAT_MODELS];
  cacheExpiresAt = now + 10 * 60 * 1000;
  return cachedModelIds;
}

export function isGroqModelAccessError(message: string): boolean {
  return /does not exist|do not have access/i.test(message);
}
