import { z } from "zod";
import connectDB from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireTutorPortal } from "@/lib/tutor/api-auth";
import {
  StaffInternalConversation,
  StaffInternalMessage,
  User,
} from "@/models";
import { STAFF_PORTAL_ROLES } from "@/lib/constants";
import { STAFF_MESSAGE_CATEGORIES } from "@/lib/tutor/constants";

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid message data", 400);

  await connectDB();

  const recipient = await User.findOne({
    _id: parsed.data.recipientId,
    role: { $in: STAFF_PORTAL_ROLES },
    isActive: { $ne: false },
  }).lean();

  if (!recipient) return jsonError("Recipient not found", 404);

  let conversation = await StaffInternalConversation.findOne({
    participants: { $all: [sessionResult.user.id, parsed.data.recipientId] },
    subject: parsed.data.subject,
  });

  if (!conversation) {
    conversation = await StaffInternalConversation.create({
      participants: [sessionResult.user.id, parsed.data.recipientId],
      initiatorId: sessionResult.user.id,
      recipientId: parsed.data.recipientId,
      category: parsed.data.category ?? "administration",
      subject: parsed.data.subject,
      lastMessageAt: new Date(),
      unreadCounts: new Map([[parsed.data.recipientId, 1]]),
    });
  } else {
    const current = conversation.unreadCounts?.get(parsed.data.recipientId) ?? 0;
    conversation.unreadCounts.set(parsed.data.recipientId, current + 1);
    conversation.lastMessageAt = new Date();
    await conversation.save();
  }

  const message = await StaffInternalMessage.create({
    conversationId: conversation._id,
    senderId: sessionResult.user.id,
    body: parsed.data.body,
  });

  return jsonOk({ conversationId: conversation._id.toString(), message }, 201);
}
