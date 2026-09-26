import connectDB from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireTutorPortal } from "@/lib/tutor/api-auth";
import { StaffInternalConversation, StaffInternalMessage, User } from "@/models";
import { STAFF_PORTAL_ROLES } from "@/lib/constants";
import { STAFF_MESSAGE_CATEGORIES } from "@/lib/tutor/constants";
import { z } from "zod";
import { collectMessageAttachmentsFromFormData } from "@/lib/messaging/attachments";

const postSchema = z.object({
  recipientId: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  category: z.enum(STAFF_MESSAGE_CATEGORIES).optional(),
});

export async function GET(request: Request) {
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId) return jsonError("conversationId required", 400);

  await connectDB();
  const conversation = await StaffInternalConversation.findOne({
    _id: conversationId,
    participants: sessionResult.user.id,
  }).lean();

  if (!conversation) return jsonError("Conversation not found", 404);

  const messages = await StaffInternalMessage.find({ conversationId })
    .sort({ createdAt: 1 })
    .lean();

  const unreadKey = `unreadCounts.${sessionResult.user.id}`;
  await StaffInternalConversation.updateOne({ _id: conversationId }, { $set: { [unreadKey]: 0 } });

  return jsonOk({ conversation, messages });
}

export async function POST(request: Request) {
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const contentType = request.headers.get("content-type") ?? "";
  let recipientId: string;
  let subject: string;
  let body: string;
  let category: (typeof STAFF_MESSAGE_CATEGORIES)[number] | undefined;
  let attachments: Awaited<ReturnType<typeof collectMessageAttachmentsFromFormData>> = [];

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    recipientId = String(formData.get("recipientId") ?? "");
    subject = String(formData.get("subject") ?? "");
    body = String(formData.get("body") ?? "");
    const rawCategory = String(formData.get("category") ?? "");
    category = STAFF_MESSAGE_CATEGORIES.includes(rawCategory as (typeof STAFF_MESSAGE_CATEGORIES)[number])
      ? (rawCategory as (typeof STAFF_MESSAGE_CATEGORIES)[number])
      : undefined;
    attachments = await collectMessageAttachmentsFromFormData(formData);
  } else {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return jsonError("Invalid JSON", 400);
    }
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) return jsonError("Invalid message data", 400);
    recipientId = parsed.data.recipientId;
    subject = parsed.data.subject;
    body = parsed.data.body;
    category = parsed.data.category;
  }

  if (!recipientId || !subject.trim() || !body.trim()) {
    return jsonError("recipientId, subject, and body are required", 400);
  }

  await connectDB();

  const recipient = await User.findOne({
    _id: recipientId,
    role: { $in: STAFF_PORTAL_ROLES },
    isActive: { $ne: false },
  }).lean();

  if (!recipient) return jsonError("Recipient not found", 404);

  let conversation = await StaffInternalConversation.findOne({
    participants: { $all: [sessionResult.user.id, recipientId] },
    subject: subject.trim(),
  });

  if (!conversation) {
    conversation = await StaffInternalConversation.create({
      participants: [sessionResult.user.id, recipientId],
      initiatorId: sessionResult.user.id,
      recipientId,
      category: category ?? "administration",
      subject: subject.trim(),
      lastMessageAt: new Date(),
      unreadCounts: new Map([[recipientId, 1]]),
    });
  } else {
    const current = conversation.unreadCounts?.get(recipientId) ?? 0;
    conversation.unreadCounts.set(recipientId, current + 1);
    conversation.lastMessageAt = new Date();
    await conversation.save();
  }

  const message = await StaffInternalMessage.create({
    conversationId: conversation._id,
    senderId: sessionResult.user.id,
    body: body.trim(),
    attachments,
  });

  return jsonOk({ conversationId: conversation._id.toString(), message }, 201);
}
