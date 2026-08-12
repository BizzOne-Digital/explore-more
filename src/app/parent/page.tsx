import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GuardianStudentLink, User } from "@/models";

export default async function ParentDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/parent");

  await connectDB();

  const links = await GuardianStudentLink.find({
    guardianId: session.user.id,
  })
    .populate("studentId", "name email")
    .sort({ status: 1, createdAt: -1 });

  const approvedLinks = links.filter((l) => l.status === "approved");
  const pendingLinks = links.filter((l) => l.status === "pending");

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-explore-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-explore-charcoal">Parent Dashboard</h2>
        <p className="mt-2 text-explore-charcoal/70">
          View your linked students&apos; courses, results, events, and certificates.
        </p>
      </section>

      {approvedLinks.length === 0 && pendingLinks.length === 0 && (
        <div className="rounded-2xl bg-explore-white p-8 text-center shadow-sm">
          <p className="text-explore-charcoal/60">
            No linked students yet. Contact the academy to link your account to your child.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-block rounded-lg bg-explore-teal px-5 py-2.5 text-sm font-semibold text-white"
          >
            Contact Us
          </Link>
        </div>
      )}

      {approvedLinks.length > 0 && (
        <section>
          <h3 className="font-display text-lg text-explore-charcoal">Your Students</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {approvedLinks.map((link) => {
              const student = link.studentId as unknown as InstanceType<typeof User> | null;
              if (!student) return null;

              return (
                <Link
                  key={link._id.toString()}
                  href={`/parent/students/${student._id.toString()}`}
                  className="rounded-2xl bg-explore-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-explore-teal/20 text-explore-teal font-semibold">
                    {student.name.charAt(0)}
                  </div>
                  <h4 className="mt-3 font-semibold text-explore-charcoal">{student.name}</h4>
                  <p className="text-sm text-explore-charcoal/60">{link.relationship}</p>
                  <p className="mt-2 text-sm text-explore-teal">View details →</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {pendingLinks.length > 0 && (
        <section className="rounded-2xl border border-explore-sand bg-explore-cream p-5">
          <h3 className="font-semibold text-explore-charcoal">Pending Links</h3>
          <ul className="mt-3 space-y-2">
            {pendingLinks.map((link) => {
              const student = link.studentId as unknown as InstanceType<typeof User> | null;
              return (
                <li key={link._id.toString()} className="text-sm text-explore-charcoal/70">
                  {student?.name ?? "Student"} — awaiting admin approval
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
