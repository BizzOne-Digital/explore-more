/**
 * Local smoke audit: env presence + HTTP status codes (no secrets logged).
 * Run while `npm run dev` is up: node scripts/audit-teacher-apis.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const BASE = process.env.AUDIT_BASE_URL || "http://localhost:3000";

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

const ENV_CHECKS = [
  { key: "MONGODB_URI", required: true },
  { key: "AUTH_SECRET", required: true },
  { key: "GROQ_API_KEY", required: false, alt: ["XAI_API_KEY", "GROK_API_KEY"] },
];

const ROUTES = [
  { name: "public lesson API (bad token)", method: "GET", path: "/api/public/lesson-plans/aaaaaaaaaaaaaaaaaaaaaaaa", expect: [404] },
  { name: "admin teacher-feedback (no auth)", method: "GET", path: "/api/admin/teacher-feedback", expect: [401] },
  { name: "teacher feedback POST (no auth)", method: "POST", path: "/api/teacher/feedback", body: {}, expect: [401] },
  { name: "teacher roster (no auth)", method: "GET", path: "/api/teacher/roster", expect: [401] },
  { name: "students overview (no auth)", method: "GET", path: "/api/teacher/students/overview", expect: [401] },
  { name: "student sync-hub (no auth)", method: "GET", path: "/api/teacher/students/507f1f77bcf86cd799439011/sync-hub", expect: [401] },
  { name: "lesson import (no auth)", method: "POST", path: "/api/teacher/lesson-plans/import", body: { lessonPlans: [] }, expect: [401, 400] },
  { name: "lesson share (no auth)", method: "POST", path: "/api/teacher/lesson-plans/507f1f77bcf86cd799439011/share", body: { enable: true }, expect: [401] },
  { name: "workspace lesson-plans (no auth)", method: "GET", path: "/api/teacher/workspace/lesson-plans", expect: [401] },
  { name: "lesson AI (no auth)", method: "POST", path: "/api/teacher/lesson-plans/ai", body: { prompt: "test lesson plan for grade 3 math" }, expect: [401] },
  { name: "shared lesson page (bad token)", method: "GET", path: "/lesson-plans/shared/aaaaaaaaaaaaaaaaaaaaaaaa", expect: [404] },
  {
    name: "educational chat (Groq via Next env)",
    method: "POST",
    path: "/api/chat/educational",
    body: { messages: [{ role: "user", content: "Reply with exactly: OK" }] },
    expect: [200],
  },
];

async function hit(route) {
  const url = `${BASE}${route.path}`;
  const init = { method: route.method, headers: {} };
  if (route.body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(route.body);
  }
  const res = await fetch(url, init);
  let snippet = "";
  try {
    const text = await res.text();
    snippet = text.slice(0, 120).replace(/\s+/g, " ");
  } catch {
    snippet = "";
  }
  return { status: res.status, snippet };
}

console.log("=== Env (presence only) ===\n");
let envOk = true;
for (const check of ENV_CHECKS) {
  const val = process.env[check.key]?.trim();
  const altSet = check.alt?.some((k) => process.env[k]?.trim());
  const ok = !!val || altSet;
  if (check.required && !ok) envOk = false;
  const label = ok ? "OK" : check.required ? "MISSING" : "optional missing";
  console.log(`  ${check.key}: ${label}`);
  if (check.alt && !val) {
    for (const k of check.alt) {
      if (process.env[k]?.trim()) console.log(`    (using ${k})`);
    }
  }
}

console.log(`\n=== HTTP smoke (${BASE}) ===\n`);
let httpOk = true;
for (const route of ROUTES) {
  try {
    const { status, snippet } = await hit(route);
    const ok = route.expect.includes(status);
    if (!ok) httpOk = false;
    const flag = ok ? "PASS" : "FAIL";
    console.log(`  [${flag}] ${status} ${route.method} ${route.name}`);
    if (!ok) {
      console.log(`         expected ${route.expect.join("|")}, body: ${snippet}`);
    } else if (status >= 500) {
      httpOk = false;
      console.log(`         server error body: ${snippet}`);
    }
  } catch (e) {
    httpOk = false;
    console.log(`  [FAIL] ${route.name}: ${e.message}`);
  }
}

console.log("\n=== Summary ===");
console.log(envOk && httpOk ? "All checks passed." : "Some checks failed — see above.");
process.exit(envOk && httpOk ? 0 : 1);
