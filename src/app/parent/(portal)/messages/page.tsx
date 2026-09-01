import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Conversation, StaffProfile, User } from "@/models";
import { ParentMessagesClient } from "@/components/parent/ParentMessagesClient";
import { STAFF_CATEGORY_LABELS } from "@/lib/portfolio/constants";

export default async function ParentMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ staff?: string; student?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();

  if (!session?.user) {
    const callback = new URLSearchParams();
    if (params.staff) callback.set("staff", params.staff);
    if (params.student) callback.set("student", params.student);
    const suffix = callback.toString() ? `?${callback}` : "";
    redirect(`/parent/login?callbackUrl=${encodeURIComponent(`/parent/messages${suffix}`)}`);
  }

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

  const staffById = new Map<string, {
    _id: string;
    name: string;
    title: string;
    categories: Array<{ id: string; label: string }>;
  }>();

  for (const user of staffUsers) {
    staffById.set(user._id.toString(), {
      _id: user._id.toString(),
      name: user.name,
      title:
        profileMap.get(user._id.toString())?.title ??
        (user.role === "administrator" ? "Administration" : "Staff"),
      categories: (profileMap.get(user._id.toString())?.categories?.length
        ? profileMap.get(user._id.toString())!.categories
        : user.role === "administrator"
          ? (["administration"] as const)
          : (["tutor"] as const)
      ).map((c) => ({ id: c, label: STAFF_CATEGORY_LABELS[c] })),
    });
  }

  if (params.staff && !staffById.has(params.staff)) {
    const linkedStaff = await User.findOne({
      _id: params.staff,
      role: { $in: ["staff", "instructor", "administrator"] },
      isActive: true,
    }).select("name email role");
    if (linkedStaff) {
      const profile = await StaffProfile.findOne({ userId: linkedStaff._id });
      staffById.set(linkedStaff._id.toString(), {
        _id: linkedStaff._id.toString(),
        name: linkedStaff.name,
        title: profile?.title ?? (linkedStaff.role === "administrator" ? "Administration" : "Tutor"),
        categories: (profile?.categories?.length
          ? profile.categories
          : linkedStaff.role === "administrator"
            ? (["administration"] as const)
            : (["tutor"] as const)
        ).map((c) => ({ id: c, label: STAFF_CATEGORY_LABELS[c] })),
      });
    }
  }

  const staff = [...staffById.values()].sort((a, b) => a.name.localeCompare(b.name));

  let initialSubject: string | undefined;
  if (params.student) {
    const student = await User.findById(params.student).select("name").lean();
    if (student?.name) {
      initialSubject = `Tutoring – ${student.name}`;
    }
  }

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
        initialStaffId={params.staff}
        initialStudentId={params.student}
        initialSubject={initialSubject}
      />
    </div>
  );
}
