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
    
    const message = await Message.findById(id)
      .populate("senderId", "name email role studentId")
      .populate("recipientId", "name email role")
      .lean();

    if (!message) {
      return apiError(new Error("Message not found"), 404);
    }

    return apiSuccess(message);
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
    if (!session?.user?.id) {
      return apiError(new Error("Unauthorized"), 401);
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    // Only allow marking as read
    const message = await Message.findById(id);
    if (!message) {
      return apiError(new Error("Message not found"), 404);
    }

    // Only recipient can mark as read
    if (message.recipientId.toString() !== session.user.id) {
      return apiError(new Error("Unauthorized"), 403);
    }

    if (body.read !== undefined) {
      message.read = body.read;
      message.readAt = body.read ? new Date() : undefined;
      await message.save();
    }

    return apiSuccess(message);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
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
    
    const message = await Message.findById(id);
    if (!message) {
      return apiError(new Error("Message not found"), 404);
    }

    // Only sender or recipient can delete
    const userId = session.user.id;
    if (
      message.senderId?.toString() !== userId &&
      message.recipientId.toString() !== userId
    ) {
      return apiError(new Error("Unauthorized"), 403);
    }

    await Message.findByIdAndDelete(id);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
