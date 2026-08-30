import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Conversation } from "@/models";
import { TUTOR_PORTAL_ROLES } from "@/lib/constants";
import { StaffMessagesClient } from "@/components/staff/StaffMessagesClient";

export const dynamic = "force-dynamic";

export default async function TutorParentMessagesPage() {
  const session = await auth();
  if (
    !session?.user ||
    !TUTOR_PORTAL_ROLES.includes(session.user.role as (typeof TUTOR_PORTAL_ROLES)[number])
  ) {
    redirect("/tutor/login");
  }

  await connectDB();
  const conversations = await Conversation.find({ staffId: session.user.id })
    .populate("parentId", "name email")
    .populate("studentId", "name")
    .sort({ lastMessageAt: -1 })
    .lean();

  const items = conversations.map((c) => {
    const parent = c.parentId as { name?: string; email?: string } | null;
    const student = c.studentId as { name?: string } | null;
    return {
      _id: c._id.toString(),
      subject: c.subject,
      parentId: parent ? { name: parent.name, email: parent.email } : null,
      studentId: student ? { name: student.name } : null,
      staffUnread: c.staffUnread,
      lastMessageAt: c.lastMessageAt ? new Date(c.lastMessageAt).toISOString() : undefined,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Parent Messages</h2>
        <p className="mt-1 text-sm text-gray-500">
          Communicate with parents and guardians of your assigned students.
        </p>
      </div>
      <StaffMessagesClient conversations={items} />
    </div>
  );
}
