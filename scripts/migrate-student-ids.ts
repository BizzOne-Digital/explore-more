/**
 * Migrate all student accounts to 6-digit Student IDs (100000–999999).
 * Run: npx tsx scripts/migrate-student-ids.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import mongoose from "mongoose";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const { ensureAllStudentIds } = await import("../src/lib/students/id");
  const count = await ensureAllStudentIds();
  console.log(`Updated ${count} student account(s) with 6-digit Student IDs.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
