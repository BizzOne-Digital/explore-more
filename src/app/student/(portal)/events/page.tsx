import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { EventRegistration, Event } from "@/models";
import {
  getStudentGrade,
  getPublishedEventsForGrade,
} from "@/lib/grades/queries";
import { formatGradeLabel, matchesStudentGrade } from "@/lib/grades";

export default async function StudentEventsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student/events");

  await connectDB();

  const studentGrade = await getStudentGrade(session.user.id);

  const [registrations, availableEvents] = await Promise.all([
    EventRegistration.find({ userId: session.user.id })
      .populate("eventId")
      .sort({ createdAt: -1 }),
    studentGrade ? getPublishedEventsForGrade(studentGrade) : Promise.resolve([]),
  ]);

  const now = new Date();
  const gradeFiltered = registrations.filter((r) => {
    const event = r.eventId as unknown as InstanceType<typeof Event> | null;
    if (!event) return false;
    if (!studentGrade) return true;
    return matchesStudentGrade(event.grade, studentGrade);
  });

  const upcoming = gradeFiltered.filter((r) => {
    const event = r.eventId as unknown as InstanceType<typeof Event> | null;
    return event && new Date(event.startDate) >= now;
  });
  const past = gradeFiltered.filter((r) => {
    const event = r.eventId as unknown as InstanceType<typeof Event> | null;
    return event && new Date(event.startDate) < now;
  });

  const registeredEventIds = new Set(
    registrations
      .map((r) => {
        const event = r.eventId as { _id?: { toString(): string } } | null;
        return event?._id?.toString();
      })
      .filter(Boolean)
  );

  const browseEvents = availableEvents.filter(
    (e) => !registeredEventIds.has(e._id.toString()) && new Date(e.startDate) >= now
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl text-explore-charcoal">My Events</h2>
        <p className="mt-1 text-explore-charcoal/70">
          Your event registrations
          {studentGrade ? ` · ${formatGradeLabel(studentGrade)}` : ""}.
        </p>
      </div>

      <EventSection title="Upcoming Events" registrations={upcoming} emptyMessage="No upcoming events." />
      <EventSection title="Past Events" registrations={past} emptyMessage="No past events." />

      {studentGrade && browseEvents.length > 0 && (
        <section>
          <h3 className="font-display text-lg text-explore-charcoal">
            Upcoming for {formatGradeLabel(studentGrade)}
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {browseEvents.map((event) => (
              <Link
                key={event._id.toString()}
                href={`/events/${event.slug}`}
                className="rounded-xl border border-explore-sand bg-explore-white p-4 shadow-sm transition hover:border-explore-teal/40"
              >
                <p className="font-semibold text-explore-charcoal">{event.title}</p>
                <p className="mt-1 text-sm text-explore-charcoal/60">
                  {new Date(event.startDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {event.location ? ` · ${event.location}` : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EventSection({
  title,
  registrations,
  emptyMessage,
}: {
  title: string;
  registrations: InstanceType<typeof EventRegistration>[];
  emptyMessage: string;
}) {
  return (
    <section>
      <h3 className="font-display text-lg text-explore-charcoal">{title}</h3>
      {registrations.length === 0 ? (
        <p className="mt-2 text-sm text-explore-charcoal/60">{emptyMessage}</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {registrations.map((reg) => {
            const event = reg.eventId as unknown as InstanceType<typeof Event> | null;
            if (!event) return null;

            return (
              <article
                key={reg._id.toString()}
                className="rounded-2xl bg-explore-white p-5 shadow-sm"
              >
                <h4 className="font-semibold text-explore-charcoal">{event.title}</h4>
                <p className="mt-1 text-sm text-explore-charcoal/60">
                  {new Date(event.startDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-1 text-sm text-explore-charcoal/60">{event.location}</p>
                <p className="mt-2 text-xs font-mono text-explore-charcoal/50">
                  Confirmation: {reg.registrationId}
                </p>
                <div className="mt-3 flex items-center gap-3 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      reg.paymentStatus === "paid" || reg.paymentStatus === "free"
                        ? "bg-explore-lime/30 text-explore-forest"
                        : "bg-explore-sand text-explore-charcoal/60"
                    }`}
                  >
                    {reg.paymentStatus}
                  </span>
                  {reg.checkedIn && (
                    <span className="text-explore-teal">Checked in</span>
                  )}
                </div>
                <Link
                  href={`/events/${event.slug}`}
                  className="mt-3 inline-block text-sm text-explore-teal hover:underline"
                >
                  View event
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
