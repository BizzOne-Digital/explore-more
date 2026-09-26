import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { Conversation, ConversationMessage, User } from "@/models";
import { STAFF_PORTAL_ROLES } from "@/lib/constants";
import { collectMessageAttachmentsFromFormData } from "@/lib/messaging/attachments";

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole([...STAFF_PORTAL_ROLES]);
    if ("error" in sessionResult) return sessionResult.error;

    const contentType = request.headers.get("content-type") ?? "";
    let conversationId: string | undefined;
    let parentId: string | undefined;
    let subject: string | undefined;
    let body: string;
    let studentId: string | undefined;
    let attachments: Awaited<ReturnType<typeof collectMessageAttachmentsFromFormData>> = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      conversationId = (formData.get("conversationId") as string) || undefined;
      parentId = (formData.get("parentId") as string) || undefined;
      subject = (formData.get("subject") as string) || undefined;
      body = (formData.get("body") as string) || "";
      studentId = (formData.get("studentId") as string) || undefined;
      attachments = await collectMessageAttachmentsFromFormData(formData);
    } else {
      const json = await request.json();
      conversationId = json.conversationId;
      parentId = json.parentId;
      subject = json.subject;
      body = json.body;
      studentId = json.studentId;
    }

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
      attachments,
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
