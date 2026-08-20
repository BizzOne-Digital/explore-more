import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { Conversation, ConversationMessage } from "@/models";
import { STAFF_PORTAL_ROLES } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole([...STAFF_PORTAL_ROLES]);
    if ("error" in sessionResult) return sessionResult.error;

    const { conversationId, body } = await request.json();
    if (!conversationId || !body?.trim()) {
      return apiError(new Error("conversationId and body are required"), 400);
    }

    await connectDB();
    const conversation = await Conversation.findOne({
      _id: conversationId,
      staffId: sessionResult.user.id,
    });
    if (!conversation) return apiError(new Error("Conversation not found"), 404);

    const message = await ConversationMessage.create({
      conversationId: conversation._id,
      senderId: sessionResult.user.id,
      body: body.trim(),
      attachments: [],
      read: false,
    });

    conversation.lastMessageAt = new Date();
    conversation.parentUnread += 1;
    await conversation.save();

    return apiSuccess({ conversation, message }, 201);
  } catch (error) {
    return apiError(error);
  }
}
