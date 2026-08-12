import connectDB from "@/lib/db";
import { User, StudentProfile, Enrollment, Result, Certificate } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate, type AdminRecord } from "@/lib/admin/serialize";
import { notFound } from "next/navigation";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();

  const student = await User.findOne({ _id: id, role: "student" }).select("-passwordHash").lean();
  if (!student) notFound();

  const [profile, enrollments, results, certificates] = await Promise.all([
    StudentProfile.findOne({ userId: id }).lean(),
    Enrollment.find({ userId: id }).populate("courseId", "title").lean(),
    Result.find({ studentId: id }).sort({ date: -1 }).limit(10).lean(),
    Certificate.find({ studentId: id }).lean(),
  ]);

  const data = serialize({ student, profile, enrollments, results, certificates });

  return (
    <div>
      <PageHeader title={data.student.name} description={data.student.email} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/50">Status</p>
          <div className="mt-1">
            <StatusBadge status={data.student.isActive ? "active" : "archived"} />
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/50">Email Verified</p>
          <p className="mt-1 text-white">{data.student.emailVerified ? "Yes" : "No"}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/50">Joined</p>
          <p className="mt-1 text-white">{formatDate(data.student.createdAt)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 font-display text-lg font-semibold text-white">Enrollments</h2>
          {data.enrollments.length === 0 ? (
            <p className="text-sm text-white/40">No enrollments.</p>
          ) : (
            <ul className="space-y-2">
              {(data.enrollments as unknown as AdminRecord[]).map((e) => (
                <li key={String(e._id)} className="flex justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                  <span className="text-white">{(e.courseId as { title?: string })?.title ?? "Course"}</span>
                  <StatusBadge status={String(e.status)} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 font-display text-lg font-semibold text-white">Recent Results</h2>
          {data.results.length === 0 ? (
            <p className="text-sm text-white/40">No results.</p>
          ) : (
            <ul className="space-y-2">
              {(data.results as unknown as AdminRecord[]).map((r) => (
                <li key={String(r._id)} className="flex justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                  <span className="text-white">{String(r.subject)}</span>
                  <span className="text-white/60">{String(r.grade ?? formatDate(r.date))}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
