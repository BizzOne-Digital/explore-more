import connectDB from "@/lib/db";
import { ActivityLog } from "@/models";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(new Error("Unauthorized"), 401);
    }

    await connectDB();
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return apiError(new Error("Invalid user id"), 400);
    }

    const activities = await ActivityLog.find({
      $or: [{ userId: id }, { entityId: id }],
    })
      .populate("performedBy", "name email role staffId")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return apiSuccess(activities);
  } catch (error) {
    return apiError(error);
  }
}
