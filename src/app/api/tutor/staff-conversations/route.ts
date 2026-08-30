import connectDB from "@/lib/db";
import { jsonOk } from "@/lib/api/response";
import { requireTutorPortal } from "@/lib/tutor/api-auth";
import { StaffInternalConversation, StaffProfile, User } from "@/models";
import { STAFF_PORTAL_ROLES } from "@/lib/constants";

export async function GET() {
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  await connectDB();

  const [conversations, staffUsers] = await Promise.all([
    StaffInternalConversation.find({ participants: sessionResult.user.id })
      .sort({ lastMessageAt: -1 })
      .populate("initiatorId", "name email role tutorId")
      .populate("recipientId", "name email role tutorId")
      .lean(),
    User.find({
      role: { $in: STAFF_PORTAL_ROLES },
      isActive: { $ne: false },
      _id: { $ne: sessionResult.user.id },
    })
      .select("name email role tutorId staffId")
      .lean(),
  ]);

  const profiles = await StaffProfile.find({
    userId: { $in: staffUsers.map((u) => u._id) },
  })
    .select("userId title categories")
    .lean();

  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

  const directory = staffUsers.map((user) => {
    const profile = profileMap.get(user._id.toString());
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      tutorId: user.tutorId,
      staffId: user.staffId,
      title: profile?.title,
      categories: profile?.categories ?? [],
    };
  });

  return jsonOk({ conversations, directory });
}
