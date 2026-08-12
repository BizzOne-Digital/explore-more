import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Enrollment,
  Course,
  EventRegistration,
  Event,
  Result,
  Certificate,
  Resource,
  Message,
  StudentProfile,
} from "@/models";

export default async function StudentDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student");

  await connectDB();
  const userId = session.user.id;

  const [
    enrollments,
    registrations,
    results,
    certificates,
    resources,
    unreadMessages,
    profile,
  ] = await Promise.all([
    Enrollment.find({ userId, status: { $ne: "cancelled" } })
      .populate("courseId", "title slug")
      .sort({ enrolledAt: -1 })
      .limit(5),
    EventRegistration.find({ userId })
      .populate("eventId", "title slug startDate")
      .sort({ createdAt: -1 })
      .limit(5),
    Result.find({ studentId: userId, publishedToStudent: true })
      .sort({ date: -1 })
      .limit(5),
    Certificate.find({ studentId: userId }).sort({ issueDate: -1 }).limit(3),
    Resource.find({
      $or: [{ isPublic: true }, { assignedStudentIds: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(5),
    Message.countDocuments({ recipientId: userId, read: false }),
    StudentProfile.findOne({ userId }),
  ]);

  const upcomingEvents = registrations.filter((r) => {
    const event = r.eventId as { startDate?: Date } | null;
    return event?.startDate && new Date(event.startDate) > new Date();
  });

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-explore-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-explore-charcoal">Dashboard</h2>
        <p className="mt-2 text-explore-charcoal/70">
          Track your courses, events, results, and resources in one place.
        </p>
        {profile && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span>Profile completion</span>
              <span className="font-semibold">{profile.profileComplete}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-explore-sand">
              <div
                className="h-full rounded-full bg-explore-teal transition-all"
                style={{ width: `${profile.profileComplete}%` }}
              />
            </div>
            {profile.profileComplete < 100 && (
              <Link
                href="/student/profile"
                className="mt-2 inline-block text-sm text-explore-teal hover:underline"
              >
                Complete your profile →
              </Link>
            )}
          </div>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enrolled Courses" value={enrollments.length} href="/student/courses" />
        <StatCard label="Upcoming Events" value={upcomingEvents.length} href="/student/events" />
        <StatCard label="Results" value={results.length} href="/student/results" />
        <StatCard
          label="Unread Messages"
          value={unreadMessages}
          href="/student/messages"
          highlight={unreadMessages > 0}
        />
      </div>

      <DashboardSection title="My Courses" href="/student/courses">
        {enrollments.length === 0 ? (
          <EmptyState message="No enrolled courses yet." linkHref="/courses" linkLabel="Browse courses" />
        ) : (
          <ul className="space-y-3">
            {enrollments.map((e) => {
              const course = e.courseId as { title?: string; slug?: string } | null;
              return (
                <li
                  key={e._id.toString()}
                  className="flex items-center justify-between rounded-xl bg-explore-cream px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{course?.title ?? "Course"}</p>
                    <p className="text-sm text-explore-charcoal/60">{e.progress}% complete</p>
                  </div>
                  {course?.slug && (
                    <Link href={`/courses/${course.slug}`} className="text-sm text-explore-teal">
                      View
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DashboardSection>

      <DashboardSection title="Upcoming Events" href="/student/events">
        {upcomingEvents.length === 0 ? (
          <EmptyState message="No upcoming events." linkHref="/events" linkLabel="Browse events" />
        ) : (
          <ul className="space-y-3">
            {upcomingEvents.map((r) => {
              const event = r.eventId as { title?: string; startDate?: Date } | null;
              return (
                <li key={r._id.toString()} className="rounded-xl bg-explore-cream px-4 py-3">
                  <p className="font-medium">{event?.title}</p>
                  <p className="text-sm text-explore-charcoal/60">
                    {event?.startDate
                      ? new Date(event.startDate).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Date TBD"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </DashboardSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection title="Recent Results" href="/student/results">
          {results.length === 0 ? (
            <p className="text-sm text-explore-charcoal/60">No published results yet.</p>
          ) : (
            <ul className="space-y-2">
              {results.map((r) => (
                <li key={r._id.toString()} className="text-sm">
                  <span className="font-medium">{r.subject}</span> — {r.assessment}
                  {r.grade && <span className="ml-2 text-explore-teal">({r.grade})</span>}
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>

        <DashboardSection title="Certificates" href="/student/certificates">
          {certificates.length === 0 ? (
            <p className="text-sm text-explore-charcoal/60">No certificates yet.</p>
          ) : (
            <ul className="space-y-2">
              {certificates.map((c) => (
                <li key={c._id.toString()} className="text-sm font-medium">
                  {c.title}
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>
      </div>

      <DashboardSection title="Resources" href="/student/resources">
        {resources.length === 0 ? (
          <p className="text-sm text-explore-charcoal/60">No resources available.</p>
        ) : (
          <ul className="space-y-2">
            {resources.map((r) => (
              <li key={r._id.toString()} className="text-sm">
                {r.title}
                <span className="ml-2 text-explore-charcoal/50">({r.type})</span>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  highlight,
}: {
  label: string;
  value: number;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl p-5 shadow-sm transition hover:shadow-md ${
        highlight ? "bg-explore-orange text-white" : "bg-explore-white"
      }`}
    >
      <p className={`text-sm ${highlight ? "text-white/80" : "text-explore-charcoal/60"}`}>
        {label}
      </p>
      <p className={`mt-1 font-display text-3xl ${highlight ? "text-white" : "text-explore-charcoal"}`}>
        {value}
      </p>
    </Link>
  );
}

function DashboardSection({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-explore-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg text-explore-charcoal">{title}</h3>
        <Link href={href} className="text-sm text-explore-teal hover:underline">
          View all
        </Link>
      </div>
      {children}
    </section>
  );
}

function EmptyState({
  message,
  linkHref,
  linkLabel,
}: {
  message: string;
  linkHref: string;
  linkLabel: string;
}) {
  return (
    <p className="text-sm text-explore-charcoal/60">
      {message}{" "}
      <Link href={linkHref} className="text-explore-teal hover:underline">
        {linkLabel}
      </Link>
    </p>
  );
}
