import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { Conversation, ConversationMessage, StaffProfile, User } from "@/models";
import { uploadPrivateFile } from "@/lib/services/upload";
import { MAX_PORTFOLIO_UPLOAD_SIZE } from "@/lib/constants";

export async function GET() {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    await connectDB();
    const conversations = await Conversation.find({ parentId: sessionResult.user.id })
      .populate("staffId", "name email role")
      .populate("studentId", "name")
      .sort({ lastMessageAt: -1 });

    return apiSuccess(conversations);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    const contentType = request.headers.get("content-type") ?? "";
    let staffId: string;
    let subject: string;
    let body: string;
    let studentId: string | undefined;
    let staffCategory: string | undefined;
    let conversationId: string | undefined;
    const attachments: Array<{ path: string; filename: string; originalName: string; mimeType: string; size: number }> = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      staffId = formData.get("staffId") as string;
      subject = formData.get("subject") as string;
      body = formData.get("body") as string;
      studentId = (formData.get("studentId") as string) || undefined;
      staffCategory = (formData.get("staffCategory") as string) || undefined;
      conversationId = (formData.get("conversationId") as string) || undefined;

      for (const file of formData.getAll("files")) {
        if (file instanceof File && file.size > 0) {
          attachments.push(await uploadPrivateFile(file, "messages", MAX_PORTFOLIO_UPLOAD_SIZE));
        }
      }
    } else {
      const json = await request.json();
      staffId = json.staffId;
      subject = json.subject;
      body = json.body;
      studentId = json.studentId;
      staffCategory = json.staffCategory;
      conversationId = json.conversationId;
    }

    if (!body?.trim()) return apiError(new Error("Message body is required"), 400);

    await connectDB();

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        parentId: sessionResult.user.id,
      });
      if (!conversation) return apiError(new Error("Conversation not found"), 404);
    } else {
      if (!staffId || !subject?.trim()) {
        return apiError(new Error("staffId and subject are required for new conversations"), 400);
      }

      const staff = await User.findById(staffId);
      if (!staff || !["staff", "instructor", "administrator"].includes(staff.role)) {
        return apiError(new Error("Invalid staff member"), 400);
      }

      conversation = await Conversation.findOne({
        parentId: sessionResult.user.id,
        staffId,
        subject: subject.trim(),
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [sessionResult.user.id, staffId],
          parentId: sessionResult.user.id,
          staffId,
          studentId,
          staffCategory: staffCategory as "portfolio_reviewer" | "tutor" | "homeschool_support" | "administration" | undefined,
          subject: subject.trim(),
          lastMessageAt: new Date(),
          parentUnread: 0,
          staffUnread: 1,
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
    conversation.staffUnread += 1;
    await conversation.save();

    return apiSuccess({ conversation, message }, 201);
  } catch (error) {
    return apiError(error);
  }
}
