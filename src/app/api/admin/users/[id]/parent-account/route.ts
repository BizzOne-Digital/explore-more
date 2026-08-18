import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";
import { User, ParentProfile } from "@/models";
import { getParentFamilyData, getParentProfileBundle } from "@/lib/admin/parent-family";
import { logActivity, extractChanges, getIpAddress, getUserAgent } from "@/lib/admin/audit-log";
import { buildPartialUpdate } from "@/lib/billing/utils";

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

    const user = await User.findById(id).select("role").lean();
    if (!user) return apiError(new Error("User not found"), 404);
    if (user.role !== "parent") return apiError(new Error("Not a parent account"), 400);

    const [profileBundle, family] = await Promise.all([
      getParentProfileBundle(id),
      getParentFamilyData(id),
    ]);

    return apiSuccess({ ...profileBundle, family });
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

    const prevUser = user.toObject();
    const currentProfile = await ParentProfile.findOne({ userId: id }).lean();

    if (typeof body.name === "string" && body.name.trim()) user.name = body.name.trim();
    if (typeof body.email === "string" && body.email.trim()) {
      user.email = body.email.trim().toLowerCase();
    }
    if (body.phone !== undefined) user.phone = String(body.phone);
    if (typeof body.isActive === "boolean") user.isActive = body.isActive;

    await user.save();

    const profileUpdate = buildPartialUpdate(body, [
      "firstName",
      "lastName",
      "mailingAddress",
      "emergencyContact",
      "preferredCommunication",
      "billingName",
      "billingEmail",
      "billingPhone",
      "billingAddress",
    ]);

    let profile = currentProfile;
    if (Object.keys(profileUpdate).length > 0) {
      profile = await ParentProfile.findOneAndUpdate(
        { userId: id },
        profileUpdate,
        { upsert: true, new: true, lean: true }
      );
    }

    const userChanges = extractChanges(
      prevUser as unknown as Record<string, unknown>,
      user.toObject() as unknown as Record<string, unknown>,
      ["passwordHash", "__v", "updatedAt", "_id", "createdAt"]
    );
    const profileChanges =
      currentProfile && profile
        ? extractChanges(
            currentProfile as unknown as Record<string, unknown>,
            profile as unknown as Record<string, unknown>
          )
        : profile
          ? { profile: { old: null, new: "created" } }
          : {};

    const changes = { ...userChanges, ...profileChanges };
    if (Object.keys(changes).length > 0) {
      await logActivity({
        performedBy: session.user.id,
        action: "update",
        entity: "parent_account",
        entityId: id,
        userId: id,
        changes,
        details: `Updated parent account profile for ${user.name}`,
        ipAddress: getIpAddress(request),
        userAgent: getUserAgent(request),
      });
    }

    const bundle = await getParentProfileBundle(id);
    return apiSuccess(bundle);
  } catch (error) {
    return apiError(error);
  }
}
