/**
 * Create or refresh a demo student linked to the demo parent.
 *
 * Usage:
 *   npm run create-demo-student
 *
 * Env (from .env.local):
 *   STUDENT_EMAIL   default: student@exploremoreacademy.com
 *   STUDENT_PASSWORD default: ChangeMe123!
 *   PARENT_EMAIL    default: parent@exploremoreacademy.com
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { buildSubscriptionPlanSeedRows } from "../src/lib/membership/plans";

const MONGODB_URI = process.env.MONGODB_URI;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function ensureDemoParent(parentEmail: string, parentPassword: string) {
  const { User, ParentProfile, ParentSubscription, SubscriptionPlan } = await import(
    "../src/models"
  );

  let parent = await User.findOne({ email: parentEmail, role: "parent" });
  if (!parent) {
    parent = await User.create({
      name: "Demo Parent",
      email: parentEmail,
      passwordHash: await hashPassword(parentPassword),
      role: "parent",
      emailVerified: true,
      isActive: true,
      notificationPreferences: {
        events: true,
        courses: true,
        newsletter: false,
        announcements: true,
      },
    });
    await ParentProfile.findOneAndUpdate(
      { userId: parent._id },
      { billingName: "Demo Parent", billingEmail: parentEmail },
      { upsert: true }
    );
    console.log(`Created demo parent (${parentEmail})`);
  }

  let plan = await SubscriptionPlan.findOne({ slug: "explorer-monthly" });
  if (!plan) {
    const [row] = buildSubscriptionPlanSeedRows().filter((p) => p.slug === "explorer-monthly");
    if (row) {
      plan = await SubscriptionPlan.create(row);
      console.log("Created explorer-monthly plan");
    }
  }

  if (plan) {
    await ParentSubscription.findOneAndUpdate(
      { userId: parent._id },
      {
        userId: parent._id,
        planId: plan._id,
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      { upsert: true, new: true }
    );
  }

  return parent;
}

async function main() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set in .env.local");
    process.exit(1);
  }

  const studentEmail = (process.env.STUDENT_EMAIL ?? "student@exploremoreacademy.com").toLowerCase();
  const studentPassword = process.env.STUDENT_PASSWORD ?? "ChangeMe123!";
  const parentEmail = (process.env.PARENT_EMAIL ?? "parent@exploremoreacademy.com").toLowerCase();
  const parentPassword = process.env.PARENT_PASSWORD ?? "ChangeMe123!";

  await mongoose.connect(MONGODB_URI);

  const { User, StudentProfile, GuardianStudentLink } = await import("../src/models");

  const parent = await ensureDemoParent(parentEmail, parentPassword);

  const passwordHash = await hashPassword(studentPassword);
  let student = await User.findOne({ email: studentEmail });

  if (student) {
    student.name = "Demo Student";
    student.role = "student";
    student.passwordHash = passwordHash;
    student.isActive = true;
    student.emailVerified = true;
    await student.save();
    console.log(`Updated demo student (${studentEmail})`);
  } else {
    student = await User.create({
      name: "Demo Student",
      email: studentEmail,
      passwordHash,
      role: "student",
      emailVerified: true,
      isActive: true,
      notificationPreferences: {
        events: true,
        courses: true,
        newsletter: false,
        announcements: true,
      },
    });
    console.log(`Created demo student (${studentEmail})`);
  }

  await StudentProfile.findOneAndUpdate(
    { userId: student._id },
    {
      grade: "5th",
      schoolStatus: "homeschool",
      profileComplete: 40,
    },
    { upsert: true, new: true }
  );

  await GuardianStudentLink.findOneAndUpdate(
    { guardianId: parent._id, studentId: student._id },
    {
      guardianId: parent._id,
      studentId: student._id,
      relationship: "Parent",
      status: "approved",
      consentGiven: true,
      consentDate: new Date(),
    },
    { upsert: true, new: true }
  );

  const refreshed = await User.findById(student._id).select("studentId email name");
  await mongoose.disconnect();

  console.log("\n── Demo student ready ──");
  console.log(`Name:       ${refreshed?.name}`);
  console.log(`Email:      ${studentEmail}`);
  console.log(`Password:   ${studentPassword}`);
  console.log(`Student ID: ${refreshed?.studentId ?? "(generating on next save)"}`);
  console.log(`Parent:     ${parentEmail}`);
  console.log(`Login:      /student/login`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
