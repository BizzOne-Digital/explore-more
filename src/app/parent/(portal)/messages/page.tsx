import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Conversation, StaffProfile, User } from "@/models";
import { ParentMessagesClient } from "@/components/parent/ParentMessagesClient";
import { STAFF_CATEGORY_LABELS } from "@/lib/portfolio/constants";

export default async function ParentMessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent/messages");

  await connectDB();

  const conversations = await Conversation.find({ parentId: session.user.id })
    .populate("staffId", "name")
    .sort({ lastMessageAt: -1 })
    .lean();

  const staffUsers = await User.find({
    role: { $in: ["staff", "instructor", "administrator"] },
    isActive: true,
  }).select("name email role");

  const profiles = await StaffProfile.find({ isPublished: true, messagingAvailable: true });
  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

  const staff = staffUsers.map((user) => {
    const profile = profileMap.get(user._id.toString());
    const categories = profile?.categories?.length
      ? profile.categories
      : user.role === "administrator"
        ? (["administration"] as const)
        : (["tutor"] as const);
    return {
      _id: user._id.toString(),
      name: user.name,
      title: profile?.title ?? (user.role === "administrator" ? "Administration" : "Staff"),
      categories: categories.map((c) => ({ id: c, label: STAFF_CATEGORY_LABELS[c] })),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Messages</h2>
        <p className="mt-1 text-sm text-explore-charcoal/70">
          Communicate with portfolio reviewers, tutors, homeschool support, and administration.
        </p>
      </div>
      <ParentMessagesClient
        conversations={JSON.parse(JSON.stringify(conversations))}
        staff={staff}
      />
    </div>
  );
}
