/**
 * Static check: teacher nav routes vs workspace page files vs WORKSPACE_PAGE_CONFIG keys.
 * node scripts/audit-teacher-pages.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const root = process.cwd();
const navFile = readFileSync(resolve(root, "src/lib/teacher/workspace-nav.ts"), "utf8");
const configFile = readFileSync(resolve(root, "src/lib/tutor/workspace-pages.ts"), "utf8");

const hrefs = [...navFile.matchAll(/href: "\/teacher\/([^"]+)"/g)].map((m) => m[1]);
const configKeys = [...configFile.matchAll(/^\s{2}"?([a-z0-9-]+)"?:\s*\{/gm)].map((m) => m[1]);

const special = new Set(["", "lesson-plans", "students", "messages", "profile", "import-export", "feedback", "templates", "archive", "progress"]);

let failed = false;

console.log("=== Teacher portal route audit ===\n");

for (const key of hrefs) {
  if (key.includes("[")) continue;
  const pagePath = resolve(root, `src/app/teacher/(portal)/${key}/page.tsx`);
  const exists = existsSync(pagePath);
  const inConfig = configKeys.includes(key);
  const ok = exists || special.has(key);
  if (!ok) {
    failed = true;
    console.log(`[FAIL] /teacher/${key} — missing page.tsx`);
  } else if (!inConfig && !special.has(key)) {
    console.log(`[WARN] /teacher/${key} — page exists but not in WORKSPACE_PAGE_CONFIG (custom page?)`);
  } else {
    console.log(`[OK]   /teacher/${key}`);
  }
}

console.log(failed ? "\nSome routes failed." : "\nAll nav routes have pages.");
process.exit(failed ? 1 : 0);
