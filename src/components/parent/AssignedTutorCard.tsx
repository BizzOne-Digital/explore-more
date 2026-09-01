import Link from "next/link";
import type { ParentAssignedTutor } from "@/lib/parent/tutors";

type AssignedTutorCardProps = {
  tutor: ParentAssignedTutor;
  showStudent?: boolean;
};

export function AssignedTutorCard({ tutor, showStudent = false }: AssignedTutorCardProps) {
  const statusLabel =
    tutor.status === "paused" ? "On pause" : tutor.status === "ended" ? "Ended" : "Active";

  return (
    <article className="rounded-2xl border border-explore-charcoal/8 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-bold text-explore-charcoal">{tutor.tutorName}</h3>
          <p className="text-sm text-explore-teal">{tutor.title}</p>
          {tutor.tutorIdCode && (
            <p className="mt-1 font-mono text-xs text-explore-charcoal/50">Tutor ID: {tutor.tutorIdCode}</p>
          )}
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            tutor.status === "active"
              ? "bg-explore-forest/10 text-explore-forest"
              : "bg-explore-orange/10 text-explore-orange"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      {showStudent && (
        <p className="mt-2 text-sm text-explore-charcoal/70">
          Assigned to <span className="font-medium">{tutor.studentName}</span>
        </p>
      )}

      {tutor.subjects.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {tutor.subjects.map((subject) => (
            <span
              key={subject}
              className="rounded-full bg-explore-sand px-2 py-0.5 text-xs font-semibold text-explore-charcoal"
            >
              {subject}
            </span>
          ))}
        </div>
      )}

      {tutor.bio && <p className="mt-3 text-sm text-explore-charcoal/70">{tutor.bio}</p>}

      {tutor.specialties.length > 0 && (
        <p className="mt-2 text-xs text-explore-charcoal/50">
          Specialties: {tutor.specialties.join(", ")}
        </p>
      )}

      {tutor.scheduleNotes && (
        <div className="mt-3 rounded-lg bg-explore-cream px-3 py-2 text-sm text-explore-charcoal/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-explore-charcoal/50">Schedule</p>
          <p className="mt-1 whitespace-pre-wrap">{tutor.scheduleNotes}</p>
        </div>
      )}

      {tutor.learningGoals && (
        <div className="mt-3 rounded-lg bg-explore-cream px-3 py-2 text-sm text-explore-charcoal/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-explore-charcoal/50">
            Learning goals
          </p>
          <p className="mt-1 whitespace-pre-wrap">{tutor.learningGoals}</p>
        </div>
      )}

      {tutor.messagingAvailable && (
        <Link
          href={`/parent/messages?staff=${tutor.tutorUserId}&student=${tutor.studentId}`}
          className="mt-4 inline-block rounded-lg bg-explore-teal px-4 py-2 text-xs font-semibold text-white"
        >
          Message Tutor
        </Link>
      )}
    </article>
  );
}
