import { z } from "zod";
import connectDB from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireTeacherPortal } from "@/lib/teacher/api-auth";
import {
  getPrimarySchoolForTeacher,
  listColleaguesInSchool,
  assertSameSchool,
} from "@/lib/teacher/school";
import { SchoolTeacherConversation, SchoolTeacherMessage, User } from "@/models";

const postSchema = z.object({
  recipientId: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  resourcePath: z.string().optional(),
  resourceName: z.string().optional(),
});

export async function GET(request: Request) {
  const sessionResult = await requireTeacherPortal();
  if ("error" in sessionResult) return sessionResult.error;

  await connectDB();
  const schoolCtx = await getPrimarySchoolForTeacher(sessionResult.user.id);
  if (!schoolCtx) {
    return jsonOk({
      school: null,
      colleagues: [],
      conversations: [],
      message:
        "Your account is not linked to a school yet. Contact your administrator to register you at your school.",
    });
  }

  const schoolId = schoolCtx.school._id.toString();
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  if (conversationId) {
    const conversation = await SchoolTeacherConversation.findOne({
      _id: conversationId,
      schoolId,
      participants: sessionResult.user.id,
    }).lean();
    if (!conversation) return jsonError("Conversation not found", 404);

    const messages = await SchoolTeacherMessage.find({ conversationId, schoolId })
      .sort({ createdAt: 1 })
      .lean();

    const unreadKey = `unreadCounts.${sessionResult.user.id}`;
    await SchoolTeacherConversation.updateOne(
      { _id: conversationId },
      { $set: { [unreadKey]: 0 } }
    );

    return jsonOk({ conversation, messages });
  }

  const [colleagues, conversations] = await Promise.all([
    listColleaguesInSchool(schoolId, sessionResult.user.id),
    SchoolTeacherConversation.find({ schoolId, participants: sessionResult.user.id })
      .sort({ lastMessageAt: -1 })
      .populate("initiatorId", "name")
      .populate("recipientId", "name")
      .lean(),
  ]);

  return jsonOk({
    school: { id: schoolId, name: schoolCtx.school.name },
    colleagues,
    conversations,
  });
}

export async function POST(request: Request) {
  const sessionResult = await requireTeacherPortal();
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
  const schoolCtx = await getPrimarySchoolForTeacher(sessionResult.user.id);
  if (!schoolCtx) return jsonError("School registration required", 403);

  const schoolId = schoolCtx.school._id;

  const sameSchool = await assertSameSchool(sessionResult.user.id, parsed.data.recipientId);
  if (!sameSchool) {
    return jsonError("You can only message colleagues at your registered school", 403);
  }

  const recipient = await User.findOne({
    _id: parsed.data.recipientId,
    role: { $in: ["teacher", "administrator"] },
    isActive: { $ne: false },
  }).lean();
  if (!recipient) return jsonError("Recipient not found", 404);

  let conversation = await SchoolTeacherConversation.findOne({
    schoolId,
    participants: { $all: [sessionResult.user.id, parsed.data.recipientId] },
    subject: parsed.data.subject,
  });

  if (!conversation) {
    conversation = await SchoolTeacherConversation.create({
      schoolId,
      participants: [sessionResult.user.id, parsed.data.recipientId],
      initiatorId: sessionResult.user.id,
      recipientId: parsed.data.recipientId,
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

  const message = await SchoolTeacherMessage.create({
    conversationId: conversation._id,
    schoolId,
    senderId: sessionResult.user.id,
    body: parsed.data.body,
    resourcePath: parsed.data.resourcePath,
    resourceName: parsed.data.resourceName,
  });

  return jsonOk({ conversationId: conversation._id.toString(), message }, 201);
}
