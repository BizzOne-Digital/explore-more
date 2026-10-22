/**
 * Deeper local audit: MongoDB + optional Groq key (no secrets logged).
 * node scripts/audit-deep.mjs
 * AUDIT_AI=1 node scripts/audit-deep.mjs  — also pings Groq/xAI chat API
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import mongoose from "mongoose";

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

const uri = process.env.MONGODB_URI?.trim();
if (!uri) {
  console.error("MONGODB_URI missing");
  process.exit(1);
}

async function auditMongo() {
  await mongoose.connect(uri, { bufferCommands: false });
  const collections = [
    "teacherlessonplans",
    "teacherproductfeedbacks",
    "teacherplannerentries",
  ];
  const db = mongoose.connection.db;
  for (const name of collections) {
    const exists = (await db.listCollections({ name }).toArray()).length > 0;
    console.log(`  collection ${name}: ${exists ? "present" : "will be created on first write"}`);
  }
  const feedbackCount = await db.collection("teacherproductfeedbacks").countDocuments().catch(() => 0);
  const planCount = await db.collection("teacherlessonplans").countDocuments().catch(() => 0);
  console.log(`  teacherproductfeedbacks count: ${feedbackCount}`);
  console.log(`  teacherlessonplans count: ${planCount}`);

  const sharedSample = await db
    .collection("teacherlessonplans")
    .findOne({ shareEnabled: true, shareToken: { $exists: true } }, { projection: { shareToken: 1 } });
  if (sharedSample?.shareToken) {
    const base = process.env.AUDIT_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/public/lesson-plans/${sharedSample.shareToken}`);
    console.log(`  public share API (real token): ${res.status} ${res.ok ? "OK" : "check"}`);
  } else {
    console.log("  public share API: skipped (no shareEnabled plan in DB)");
  }
}

async function auditAi() {
  const { createEducationalChatReply } = await import("../src/lib/grok/chat.ts");
  const reply = await createEducationalChatReply([
    { role: "user", content: "Reply with exactly: OK" },
  ]);
  const ok = typeof reply === "string" && reply.length > 0;
  console.log(`  chat API: ${ok ? "OK" : "empty response"}`);
  if (!ok) process.exitCode = 1;
}

console.log("=== MongoDB ===\n");
try {
  await auditMongo();
  console.log("  MongoDB: OK\n");
} catch (e) {
  console.error("  MongoDB: FAIL", e.message);
  process.exit(1);
} finally {
  await mongoose.disconnect();
}

if (process.env.AUDIT_AI === "1") {
  console.log("=== Chat API (GROQ / xAI) ===\n");
  try {
    await auditAi();
  } catch (e) {
    console.error("  chat API: FAIL", e.message);
    process.exit(1);
  }
} else {
  console.log("(Set AUDIT_AI=1 to verify GROQ_API_KEY / XAI_API_KEY against the provider.)\n");
}

console.log("Deep audit finished.");
