import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { Conversation, ConversationMessage } from "@/models";
import { STAFF_PORTAL_ROLES } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const sessionResult = await requireRole([...STAFF_PORTAL_ROLES]);
    if ("error" in sessionResult) return sessionResult.error;

    const conversationId = new URL(request.url).searchParams.get("conversationId");
    if (!conversationId) return apiError(new Error("conversationId is required"), 400);

    await connectDB();
    const conversation = await Conversation.findOne({
      _id: conversationId,
      staffId: sessionResult.user.id,
    });
    if (!conversation) return apiError(new Error("Conversation not found"), 404);

    const messages = await ConversationMessage.find({ conversationId })
      .populate("senderId", "name role")
      .sort({ createdAt: 1 });

    conversation.staffUnread = 0;
    await conversation.save();
    await ConversationMessage.updateMany(
      { conversationId, senderId: { $ne: sessionResult.user.id } },
      { read: true }
    );

    return apiSuccess({ conversation, messages });
  } catch (error) {
    return apiError(error);
  }
}
