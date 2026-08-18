import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StaffProfile, User } from "@/models";
import { STAFF_CATEGORY_LABELS } from "@/lib/portfolio/constants";

export default async function ParentTutorsPage() {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent/tutors");

  await connectDB();

  const staffUsers = await User.find({
    role: { $in: ["instructor", "administrator"] },
    isActive: true,
  }).select("name email role");

  const profiles = await StaffProfile.find({ isPublished: true });
  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

  const directory = staffUsers
    .map((user) => {
      const profile = profileMap.get(user._id.toString());
      const categories = profile?.categories?.length
        ? profile.categories
        : user.role === "administrator"
          ? (["administration"] as const)
          : (["tutor"] as const);

      return {
        id: user._id.toString(),
        name: user.name,
        title: profile?.title ?? (user.role === "administrator" ? "Administration" : "Staff"),
        bio: profile?.bio,
        categories: categories.map((c) => STAFF_CATEGORY_LABELS[c]),
        specialties: profile?.specialties ?? [],
        messagingAvailable: profile?.messagingAvailable !== false,
      };
    })
    .filter((s) => s.messagingAvailable);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Tutors & Staff Directory</h2>
        <p className="mt-1 text-sm text-explore-charcoal/70">
          Message your assigned portfolio reviewer, tutors, homeschool support staff, or administration.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {directory.map((member) => (
          <article key={member.id} className="rounded-2xl bg-white p-6 shadow-sm border border-explore-charcoal/8">
            <h3 className="font-display text-lg font-bold">{member.name}</h3>
            <p className="text-sm text-explore-teal">{member.title}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {member.categories.map((c) => (
                <span key={c} className="rounded-full bg-explore-sand px-2 py-0.5 text-xs font-semibold">
                  {c}
                </span>
              ))}
            </div>
            {member.bio && <p className="mt-3 text-sm text-explore-charcoal/70">{member.bio}</p>}
            {member.specialties.length > 0 && (
              <p className="mt-2 text-xs text-explore-charcoal/50">
                Specialties: {member.specialties.join(", ")}
              </p>
            )}
            <a
              href={`/parent/messages?staff=${member.id}`}
              className="mt-4 inline-block rounded-lg bg-explore-teal px-4 py-2 text-xs font-semibold text-white"
            >
              Send Message
            </a>
          </article>
        ))}
      </div>

      {directory.length === 0 && (
        <p className="text-sm text-explore-charcoal/60">Staff directory will appear as team members are added.</p>
      )}
    </div>
  );
}
