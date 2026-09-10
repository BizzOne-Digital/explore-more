import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { Conversation, ConversationMessage, User } from "@/models";
import { STAFF_PORTAL_ROLES } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole([...STAFF_PORTAL_ROLES]);
    if ("error" in sessionResult) return sessionResult.error;

    const { conversationId, parentId, subject, body, studentId } = await request.json();
    if (!body?.trim()) {
      return apiError(new Error("Message body is required"), 400);
    }

    await connectDB();

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        staffId: sessionResult.user.id,
      });
      if (!conversation) return apiError(new Error("Conversation not found"), 404);
    } else {
      if (!parentId || !subject?.trim()) {
        return apiError(new Error("parentId and subject are required for new messages"), 400);
      }

      const parent = await User.findById(parentId).select("role").lean();
      if (!parent || parent.role !== "parent") {
        return apiError(new Error("Invalid parent"), 400);
      }

      conversation = await Conversation.findOne({
        parentId,
        staffId: sessionResult.user.id,
        subject: subject.trim(),
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [parentId, sessionResult.user.id],
          parentId,
          staffId: sessionResult.user.id,
          studentId: studentId || undefined,
          staffCategory: "homeschool_support",
          subject: subject.trim(),
          lastMessageAt: new Date(),
          parentUnread: 0,
          staffUnread: 0,
        });
      }
    }

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
