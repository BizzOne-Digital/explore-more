import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  User,
  StudentProfile,
  Enrollment,
  Course,
  EventRegistration,
  Event,
  Result,
  Certificate,
  Attendance,
  GuardianStudentLink,
} from "@/models";
import { canAccessStudentData } from "@/lib/auth/access";
import { CertificateListItem } from "@/components/parent/CertificateListItem";

type PageProps = { params: Promise<{ studentId: string }> };

export default async function ParentStudentPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent");

  const { studentId } = await params;

  const allowed = await canAccessStudentData(
    {
      id: session.user.id,
      email: session.user.email ?? "",
      name: session.user.name ?? "",
      role: session.user.role,
      emailVerified: session.user.emailVerified,
    },
    studentId
  );

  if (!allowed) notFound();

  await connectDB();

  const [student, profile, link, enrollments, registrations, results, certificates, attendance] =
    await Promise.all([
      User.findById(studentId),
      StudentProfile.findOne({ userId: studentId }),
      GuardianStudentLink.findOne({ guardianId: session.user.id, studentId, status: "approved" }),
      Enrollment.find({ userId: studentId, status: { $ne: "cancelled" } })
        .populate("courseId", "title slug")
        .sort({ enrolledAt: -1 }),
      EventRegistration.find({ userId: studentId })
        .populate("eventId", "title startDate location slug")
        .sort({ createdAt: -1 }),
      Result.find({ studentId, publishedToStudent: true }).sort({ date: -1 }),
      Certificate.find({ studentId, publishedToStudent: { $ne: false } }).sort({ issueDate: -1 }),
      Attendance.find({ studentId }).sort({ sessionDate: -1 }).limit(10),
    ]);

  if (!student) notFound();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/parent" className="text-sm text-explore-teal hover:underline">
            ← Back to dashboard
          </Link>
          <h2 className="mt-2 font-display text-2xl text-explore-charcoal">{student.name}</h2>
          {link && (
            <p className="text-sm text-explore-charcoal/60">Relationship: {link.relationship}</p>
          )}
        </div>
        {profile && (
          <div className="text-right text-sm">
            <p className="text-explore-charcoal/60">Profile</p>
            <p className="font-semibold">{profile.profileComplete}% complete</p>
          </div>
        )}
      </div>

      <ParentSection title="Enrolled Courses">
        {enrollments.length === 0 ? (
          <p className="text-sm text-explore-charcoal/60">No enrolled courses.</p>
        ) : (
          <ul className="space-y-2">
            {enrollments.map((e) => {
              const course = e.courseId as unknown as InstanceType<typeof Course> | null;
              return (
                <li
                  key={e._id.toString()}
                  className="flex justify-between rounded-lg bg-explore-white px-4 py-3 text-sm shadow-sm"
                >
                  <span className="font-medium">{course?.title ?? "Course"}</span>
                  <span className="text-explore-charcoal/60">{e.progress}% complete</span>
                </li>
              );
            })}
          </ul>
        )}
      </ParentSection>

      <ParentSection title="Event Registrations">
        {registrations.length === 0 ? (
          <p className="text-sm text-explore-charcoal/60">No event registrations.</p>
        ) : (
          <ul className="space-y-2">
            {registrations.map((r) => {
              const event = r.eventId as unknown as InstanceType<typeof Event> | null;
              return (
                <li
                  key={r._id.toString()}
                  className="rounded-lg bg-explore-white px-4 py-3 text-sm shadow-sm"
                >
                  <p className="font-medium">{event?.title}</p>
                  <p className="text-explore-charcoal/60">
                    {event?.startDate
                      ? new Date(event.startDate).toLocaleDateString("en-US")
                      : "Date TBD"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </ParentSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <ParentSection title="Published Results">
          {results.length === 0 ? (
            <p className="text-sm text-explore-charcoal/60">No published results.</p>
          ) : (
            <ul className="space-y-2">
              {results.map((r) => (
                <li key={r._id.toString()} className="text-sm">
                  <span className="font-medium">{r.subject}</span> — {r.assessment}
                  {r.grade && <span className="ml-1 text-explore-teal">({r.grade})</span>}
                </li>
              ))}
            </ul>
          )}
        </ParentSection>

        <ParentSection title="Achievements & Certificates">
          {certificates.length === 0 ? (
            <p className="text-sm text-explore-charcoal/60">No certificates.</p>
          ) : (
            <ul className="space-y-3">
              {certificates.map((c) => (
                  <CertificateListItem
                    key={c._id.toString()}
                    cert={{
                      _id: c._id.toString(),
                      title: c.title,
                      description: c.description,
                      issueDate: c.issueDate,
                      filePath: c.filePath,
                      fileType: c.fileType,
                      associatedCourse: c.associatedCourse,
                      associatedProgram: c.associatedProgram,
                      associatedEvent: c.associatedEvent,
                    }}
                  />
                ))}
            </ul>
          )}
        </ParentSection>
      </div>

      <ParentSection title="Recent Attendance">
        {attendance.length === 0 ? (
          <p className="text-sm text-explore-charcoal/60">No attendance records.</p>
        ) : (
          <ul className="space-y-2">
            {attendance.map((a) => (
              <li
                key={a._id.toString()}
                className="flex justify-between rounded-lg bg-explore-white px-4 py-2 text-sm shadow-sm"
              >
                <span>{new Date(a.sessionDate).toLocaleDateString("en-US")}</span>
                <span
                  className={`capitalize ${
                    a.status === "present"
                      ? "text-explore-forest"
                      : a.status === "absent"
                        ? "text-explore-orange"
                        : "text-explore-charcoal/60"
                  }`}
                >
                  {a.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ParentSection>
    </div>
  );
}

function ParentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-explore-cream p-5">
      <h3 className="mb-4 font-display text-lg text-explore-charcoal">{title}</h3>
      {children}
    </section>
  );
}
