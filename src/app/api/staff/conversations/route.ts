import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { Conversation } from "@/models";
import { STAFF_PORTAL_ROLES } from "@/lib/constants";

export async function GET() {
  try {
    const sessionResult = await requireRole([...STAFF_PORTAL_ROLES]);
    if ("error" in sessionResult) return sessionResult.error;

    await connectDB();
    const conversations = await Conversation.find({ staffId: sessionResult.user.id })
      .populate("parentId", "name email")
      .populate("studentId", "name")
      .sort({ lastMessageAt: -1 });

    return apiSuccess(conversations);
  } catch (error) {
    return apiError(error);
  }
}
