import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

import { createEducationalChatReply } from "@/lib/grok/chat";

async function main() {
  const reply = await createEducationalChatReply([
    { role: "user", content: "Reply with exactly the word OK and nothing else." },
  ]);
  if (!reply?.trim()) {
    console.error("chat API: empty response");
    process.exit(1);
  }
  console.log("chat API: OK (provider responded)");
}

main().catch((e) => {
  console.error("chat API: FAIL", e instanceof Error ? e.message : e);
  process.exit(1);
});
