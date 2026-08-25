import connectDB from "@/lib/db";
import { PendingMembership, ParentSubscription, User } from "@/models";
import { getParentMembershipAccess } from "@/lib/membership/access";

async function hasActiveSubscriptionForUserId(userId: string): Promise<boolean> {
  const sub = await ParentSubscription.findOne({
    userId,
    status: { $in: ["active", "trialing"] },
  }).lean();
  return !!sub;
}

async function hasPendingMembershipForEmail(email: string): Promise<boolean> {
  const pending = await PendingMembership.findOne({ email: email.toLowerCase().trim() }).lean();
  return !!pending;
}

export async function canOpenParentSignup(email?: string | null, userId?: string | null): Promise<boolean> {
  await connectDB();

  if (userId) {
    const access = await getParentMembershipAccess(userId);
    if (access.hasActiveMembership) return true;
    if (await hasActiveSubscriptionForUserId(userId)) return true;
  }

  if (email) {
    if (await hasPendingMembershipForEmail(email)) return true;

    const user = await User.findOne({ email: email.toLowerCase().trim(), role: "parent" }).lean();
    if (user && (await hasActiveSubscriptionForUserId(user._id.toString()))) {
      return true;
    }
  }

  return false;
}

export async function canOpenStudentSignup(options?: {
  parentEmail?: string | null;
  parentUserId?: string | null;
}): Promise<boolean> {
  await connectDB();

  if (options?.parentUserId) {
    const access = await getParentMembershipAccess(options.parentUserId);
    if (access.hasActiveMembership) return true;
  }

  if (options?.parentEmail) {
    if (await hasPendingMembershipForEmail(options.parentEmail)) return true;

    const parent = await User.findOne({
      email: options.parentEmail.toLowerCase().trim(),
      role: "parent",
    }).lean();
    if (parent && (await hasActiveSubscriptionForUserId(parent._id.toString()))) {
      return true;
    }
  }

  return false;
}
