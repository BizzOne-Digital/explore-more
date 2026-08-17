import connectDB from "@/lib/db";
import { User } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { auth } from "@/lib/auth";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/admin/audit-log";

export async function POST(
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
    const body = await request.json();

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: body.isActive ?? false },
      { new: true }
    );

    if (!user) {
      return apiError(new Error("User not found"), 404);
    }

    // Log the activity
    await logActivity({
      performedBy: session.user.id,
      action: body.isActive ? "restore" : "deactivate",
      entity: "user",
      entityId: id,
      userId: id,
      details: `${body.isActive ? "Restored" : "Deactivated"} user: ${user.name}`,
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return apiSuccess(user);
  } catch (error) {
    return apiError(error);
  }
}
