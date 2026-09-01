import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import connectDB from "@/lib/db";
import { PortfolioAttendance } from "@/models";
import { resolveParentContext } from "@/lib/parent/context";
import { PortfolioSubNav } from "@/components/parent/ParentNav";
import { StudentYearSelector } from "@/components/parent/StudentYearSelector";
import { AttendanceForm } from "@/components/parent/PortfolioForms";
import { DownloadReportButton } from "@/components/parent/DownloadReportButton";
import { ATTENDANCE_TYPE_LABELS } from "@/lib/portfolio/constants";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent/portfolio/attendance");

  const params = await searchParams;
  const ctx = await resolveParentContext(session.user.id, params);
  if (!ctx.studentId || !ctx.portfolio) redirect("/parent/portfolio");

  await connectDB();
  const records = await PortfolioAttendance.find({ portfolioId: ctx.portfolio._id }).sort({ date: -1 });

  const instructionDays = records.filter((r) =>
    ["present", "instruction", "field_trip", "educational_activity"].includes(r.type)
  ).length;

  const studentName = ctx.students.find((s) => s.id === ctx.studentId)?.name ?? "Student";
  const safeName = studentName.replace(/[^\w.-]+/g, "_");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Attendance & Instruction Log</h2>
          <p className="text-sm text-explore-charcoal/70">
            Days of Instruction recorded: <strong>{instructionDays}</strong>
          </p>
        </div>
        <DownloadReportButton
          href={`/api/parent/portfolio/attendance/export?portfolioId=${ctx.portfolio._id.toString()}`}
          label="Download Instruction Log PDF"
          filename={`instruction-log-${ctx.schoolYear.replace(/[^\d-]/g, "")}-${safeName}.pdf`}
        />
      </div>
      <Suspense fallback={null}>
        <StudentYearSelector students={ctx.students.map((s) => ({ id: s.id, name: s.name }))} selectedStudentId={ctx.studentId} selectedYear={ctx.schoolYear} />
        <PortfolioSubNav />
      </Suspense>
      <AttendanceForm studentId={ctx.studentId} schoolYear={ctx.schoolYear} />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {records.map((r) => (
          <div key={r._id.toString()} className="rounded-lg bg-white p-4 shadow-sm text-sm">
            <p className="font-semibold">{new Date(r.date).toLocaleDateString()}</p>
            <p className="text-explore-teal">{ATTENDANCE_TYPE_LABELS[r.type]}</p>
            {r.notes && <p className="mt-1 text-explore-charcoal/60">{r.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
