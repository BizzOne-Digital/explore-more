import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StaffProfile, User } from "@/models";
import { STAFF_CATEGORY_LABELS } from "@/lib/portfolio/constants";
import { getAssignedTutorsForGuardian } from "@/lib/parent/tutors";
import { getParentMembershipAccess } from "@/lib/membership/access";
import { AssignedTutorCard } from "@/components/parent/AssignedTutorCard";

export default async function ParentTutorsPage() {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent/tutors");

  await connectDB();

  const [assignedTutors, access] = await Promise.all([
    getAssignedTutorsForGuardian(session.user.id),
    session.user.role === "administrator"
      ? Promise.resolve({
          hasFeature: () => true,
        })
      : getParentMembershipAccess(session.user.id),
  ]);

  const showStaffDirectory =
    session.user.role === "administrator" ||
    access.hasFeature("tutoringSession30") ||
    access.hasFeature("tutoringSession60");

  let directory: Array<{
    id: string;
    name: string;
    title: string;
    bio?: string;
    categories: string[];
    specialties: string[];
    messagingAvailable: boolean;
  }> = [];

  if (showStaffDirectory) {
    const staffUsers = await User.find({
      role: { $in: ["instructor", "administrator"] },
      isActive: true,
    }).select("name email role");

    const profiles = await StaffProfile.find({ isPublished: true });
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

    directory = staffUsers
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
  }

  const assignedByStudent = new Map<string, typeof assignedTutors>();
  for (const tutor of assignedTutors) {
    const list = assignedByStudent.get(tutor.studentId) ?? [];
    list.push(tutor);
    assignedByStudent.set(tutor.studentId, list);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-explore-charcoal">Tutors & Staff</h2>
        <p className="mt-1 text-sm text-explore-charcoal/70">
          View your child&apos;s assigned tutor and contact the academy team.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h3 className="font-display text-lg font-bold text-explore-charcoal">My Child&apos;s Tutors</h3>
          <p className="mt-1 text-sm text-explore-charcoal/60">
            Tutors assigned by the academy to support your linked students.
          </p>
        </div>

        {assignedTutors.length === 0 ? (
          <p className="rounded-2xl border border-explore-charcoal/8 bg-white p-6 text-sm text-explore-charcoal/60 shadow-sm">
            No tutors are assigned to your children yet. When a tutor is linked to your student, their
            profile and schedule details will appear here.
          </p>
        ) : (
          <div className="space-y-6">
            {[...assignedByStudent.entries()].map(([studentId, tutors]) => (
              <div key={studentId} className="space-y-3">
                <h4 className="text-sm font-semibold text-explore-charcoal">{tutors[0]?.studentName}</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  {tutors.map((tutor) => (
                    <AssignedTutorCard key={tutor.assignmentId} tutor={tutor} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showStaffDirectory ? (
        <section className="space-y-4">
          <div>
            <h3 className="font-display text-lg font-bold text-explore-charcoal">Staff Directory</h3>
            <p className="mt-1 text-sm text-explore-charcoal/60">
              Message your portfolio reviewer, tutors, homeschool support staff, or administration.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {directory.map((member) => (
              <article
                key={member.id}
                className="rounded-2xl border border-explore-charcoal/8 bg-white p-6 shadow-sm"
              >
                <h3 className="font-display text-lg font-bold text-explore-charcoal">{member.name}</h3>
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
            <p className="text-sm text-explore-charcoal/60">
              Staff directory will appear as team members are added.
            </p>
          )}
        </section>
      ) : (
        <p className="text-sm text-explore-charcoal/50">
          A tutoring membership unlocks the full staff directory for messaging additional team members.
        </p>
      )}
    </div>
  );
}
