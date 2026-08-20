import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Conversation } from "@/models";
import { STAFF_PORTAL_ROLES } from "@/lib/constants";
import { StaffMessagesClient } from "@/components/staff/StaffMessagesClient";

export const dynamic = "force-dynamic";

export default async function StaffMessagesPage() {
  const session = await auth();
  if (!session?.user || !STAFF_PORTAL_ROLES.includes(session.user.role as (typeof STAFF_PORTAL_ROLES)[number])) {
    redirect("/staff/login");
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
        <p className="mt-1 text-sm text-explore-charcoal/70">
          Reply to parent inquiries and messages from calls or the portal.
        </p>
      </div>
      <StaffMessagesClient conversations={items} />
    </div>
  );
}
