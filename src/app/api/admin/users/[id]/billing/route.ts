import connectDB from "@/lib/db";

import { auth } from "@/lib/auth";

import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";

import {

  User,

  ParentProfile,

  SubscriptionPlan,

} from "@/models";

import {

  ensureParentSubscription,

  getParentBillingSummary,

  listActivePlans,

} from "@/lib/billing/parent-billing";

import { createBillingPortalSession } from "@/lib/billing/stripe-customer";

import { logActivity, extractChanges, getIpAddress, getUserAgent } from "@/lib/admin/audit-log";

import { buildPartialUpdate } from "@/lib/billing/utils";

import mongoose from "mongoose";



export async function GET(

  _request: Request,

  { params }: { params: Promise<{ id: string }> }

) {

  try {

    const session = await auth();

    if (!session?.user?.id) return apiError(new Error("Unauthorized"), 401);



    await connectDB();

    const { id } = await params;



    if (!isValidObjectId(id)) return apiError(new Error("Invalid user id"), 400);



    const user = await User.findById(id).lean();

    if (!user) return apiError(new Error("User not found"), 404);

    if (user.role !== "parent") return apiError(new Error("Not a parent account"), 400);



    await ensureParentSubscription(id);



    const [summary, plans] = await Promise.all([

      getParentBillingSummary(id),

      listActivePlans(),

    ]);



    return apiSuccess({ ...summary, plans });

  } catch (error) {

    return apiError(error);

  }

}



export async function PATCH(

  request: Request,

  { params }: { params: Promise<{ id: string }> }

) {

  try {

    const session = await auth();

    if (!session?.user?.id) return apiError(new Error("Unauthorized"), 401);



    await connectDB();

    const { id } = await params;



    if (!isValidObjectId(id)) return apiError(new Error("Invalid user id"), 400);



    let body: Record<string, unknown>;

    try {

      body = await request.json();

    } catch {

      return apiError(new Error("Invalid request body"), 400);

    }



    const user = await User.findById(id);

    if (!user) return apiError(new Error("User not found"), 404);

    if (user.role !== "parent") return apiError(new Error("Not a parent account"), 400);



    const profileUpdate = buildPartialUpdate(body, [

      "billingName",

      "billingEmail",

      "billingPhone",

      "billingAddress",

      "firstName",

      "lastName",

      "mailingAddress",

      "emergencyContact",

      "preferredCommunication",

    ]);



    let profile = await ParentProfile.findOne({ userId: id }).lean();

    const currentProfile = profile;



    if (Object.keys(profileUpdate).length > 0) {

      profile = await ParentProfile.findOneAndUpdate(

        { userId: id },

        profileUpdate,

        { upsert: true, new: true, lean: true }

      );

    }



    if (body.phone !== undefined && typeof body.phone === "string") {

      user.phone = body.phone;

      await user.save();

    }



    const subscription = await ensureParentSubscription(id);

    const prevSub = subscription.toObject();



    if (body.subscription && typeof body.subscription === "object") {

      const subBody = body.subscription as Record<string, unknown>;



      if (subBody.planId !== undefined) {

        const rawPlanId = subBody.planId;

        if (!rawPlanId) {

          subscription.planId = undefined;

        } else if (isValidObjectId(String(rawPlanId))) {

          const planExists = await SubscriptionPlan.findById(rawPlanId).select("_id").lean();

          if (!planExists) {

            return apiError(new Error("Subscription plan not found"), 400);

          }

          subscription.planId = new mongoose.Types.ObjectId(String(rawPlanId));

        } else {

          return apiError(new Error("Invalid subscription plan id"), 400);

        }

      }



      if (typeof subBody.status === "string") {

        const validStatuses = ["active", "trialing", "past_due", "canceled", "paused", "none"];

        if (!validStatuses.includes(subBody.status)) {

          return apiError(new Error("Invalid subscription status"), 400);

        }

        subscription.status = subBody.status as typeof subscription.status;

      }



      if (subBody.discountPercent !== undefined) {

        const discount = Number(subBody.discountPercent);

        if (Number.isNaN(discount) || discount < 0 || discount > 100) {

          return apiError(new Error("Discount must be between 0 and 100"), 400);

        }

        subscription.discountPercent = discount;

      }



      if (subBody.creditCents !== undefined) {

        const credit = Number(subBody.creditCents);

        if (Number.isNaN(credit) || credit < 0) {

          return apiError(new Error("Credit must be a non-negative number"), 400);

        }

        subscription.creditCents = credit;

      }



      if (subBody.cancelAtPeriodEnd !== undefined) {

        subscription.cancelAtPeriodEnd = Boolean(subBody.cancelAtPeriodEnd);

      }



      if (subBody.currentPeriodEnd !== undefined) {

        subscription.currentPeriodEnd = subBody.currentPeriodEnd

          ? new Date(String(subBody.currentPeriodEnd))

          : undefined;

      }



      await subscription.save();

    }



    const profileChanges =

      currentProfile && profile

        ? extractChanges(

            currentProfile as unknown as Record<string, unknown>,

            profile as unknown as Record<string, unknown>

          )

        : profile

          ? { profile: { old: null, new: "created" } }

          : {};



    const subChanges = extractChanges(

      prevSub as unknown as Record<string, unknown>,

      subscription.toObject() as unknown as Record<string, unknown>,

      ["__v", "updatedAt", "_id", "userId", "createdAt"]

    );



    const changes = { ...profileChanges, ...subChanges };



    if (Object.keys(changes).length > 0) {

      const details: string[] = [];

      if (subChanges.planId || subChanges.status) {

        const oldPlan = prevSub.planId

          ? await SubscriptionPlan.findById(prevSub.planId).select("name").lean()

          : null;

        const newPlan = subscription.planId

          ? await SubscriptionPlan.findById(subscription.planId).select("name").lean()

          : null;

        if (oldPlan?.name !== newPlan?.name || subChanges.status) {

          details.push(

            `changed subscription from ${oldPlan?.name ?? "None"} to ${newPlan?.name ?? "None"} (${subscription.status})`

          );

        }

      }

      if (subChanges.discountPercent || subChanges.creditCents) {

        details.push("updated billing adjustments");

      }

      if (profileChanges.billingAddress || profileChanges.billingName) {

        details.push("updated billing address");

      }



      await logActivity({

        performedBy: session.user.id,

        action: "update",

        entity: "parent_billing",

        entityId: id,

        userId: id,

        changes,

        details: details.length ? details.join("; ") : `Updated billing for ${user.name}`,

        ipAddress: getIpAddress(request),

        userAgent: getUserAgent(request),

      });

    }



    const summary = await getParentBillingSummary(id);

    const plans = await listActivePlans();

    return apiSuccess({ ...summary, plans });

  } catch (error) {

    return apiError(error);

  }

}



export async function POST(

  request: Request,

  { params }: { params: Promise<{ id: string }> }

) {

  try {

    const session = await auth();

    if (!session?.user?.id) return apiError(new Error("Unauthorized"), 401);



    await connectDB();

    const { id } = await params;



    if (!isValidObjectId(id)) return apiError(new Error("Invalid user id"), 400);



    let body: { action?: string };

    try {

      body = await request.json();

    } catch {

      return apiError(new Error("Invalid request body"), 400);

    }



    const user = await User.findById(id).select("role").lean();

    if (!user) return apiError(new Error("User not found"), 404);

    if (user.role !== "parent") return apiError(new Error("Not a parent account"), 400);



    if (body.action === "billing_portal") {

      const url = await createBillingPortalSession(id, `/admin/users/${id}`);

      if (!url) return apiError(new Error("Stripe billing portal is not configured"), 503);

      return apiSuccess({ url });

    }



    return apiError(new Error("Unknown action"), 400);

  } catch (error) {

    return apiError(error);

  }

}

