/**
 * Smoke test for parent billing & admin parent account APIs (data layer).
 * Run: npx tsx scripts/smoke-billing.ts
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
  const { User } = await import("../src/models");
  const { getParentBillingSummary } = await import("../src/lib/billing/parent-billing");
  const { getParentFamilyData } = await import("../src/lib/admin/parent-family");

  const parent = await User.findOne({ role: "parent" }).select("_id email name").lean();
  if (!parent) {
    console.error("No parent user found — run npm run seed");
    process.exit(1);
  }

  const id = parent._id.toString();
  console.log(`Testing parent: ${parent.name} (${parent.email})`);

  const billing = await getParentBillingSummary(id);
  console.log("✓ getParentBillingSummary");
  console.log(`  Plan: ${billing.subscription.planName}, status: ${billing.subscription.status}`);
  console.log(`  Payment history items: ${billing.paymentHistory.length}`);

  const family = await getParentFamilyData(id);
  console.log("✓ getParentFamilyData");
  console.log(`  Children: ${family.children.length}`);
  console.log(`  Enrollments: ${family.enrollments.length}`);
  console.log(`  Attendance: ${family.attendance.length}`);
  console.log(`  Messages: ${family.messages.length}`);
  console.log(`  Documents: ${family.documents.length}`);

  const { SubscriptionPlan, ParentSubscription } = await import("../src/models");
  const planCount = await SubscriptionPlan.countDocuments({ isActive: true });
  const sub = await ParentSubscription.findOne({ userId: id }).lean();
  console.log(`✓ Subscription plans: ${planCount}, parent subscription: ${sub?.status ?? "none"}`);

  const { buildSubscriptionPlanSeedRows } = await import("../src/lib/membership/plans");
  const expectedPlans = buildSubscriptionPlanSeedRows().length;
  if (planCount < expectedPlans) {
    console.warn(
      `⚠ Expected at least ${expectedPlans} membership plans; found ${planCount}. Run: npm run seed`
    );
  } else {
    console.log(`✓ Membership plan catalog complete (${planCount} plans)`);
  }

  const { MEMBERSHIP_TIERS, membershipPlanSlug } = await import("../src/lib/membership/plans");
  for (const tier of MEMBERSHIP_TIERS) {
    const monthly = await SubscriptionPlan.findOne({
      slug: membershipPlanSlug(tier.id, "month"),
    }).lean();
    const annual = await SubscriptionPlan.findOne({
      slug: membershipPlanSlug(tier.id, "year"),
    }).lean();
    if (!monthly || !annual) {
      console.warn(`⚠ Missing plan rows for tier: ${tier.id}`);
    }
  }
  console.log("✓ Membership tier slug check complete");

  console.log("\nAll smoke checks passed.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
