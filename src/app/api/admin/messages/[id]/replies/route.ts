import connectDB from "@/lib/db";
import { Message } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
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

    const replies = await Message.find({ replyToId: id })
      .populate("senderId", "name email role studentId")
      .populate("recipientId", "name email role")
      .sort({ createdAt: 1 })
      .lean();

    return apiSuccess(replies);
  } catch (error) {
    return apiError(error);
  }
}
