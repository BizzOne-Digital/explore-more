import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import connectDB from "@/lib/db";
import { getLinkedStudents, getPendingLinkRequests } from "@/lib/parent/students";
import { resolveParentContext } from "@/lib/parent/context";
import {
  PortfolioProgressCard,
  QuickActionButtons,
  SubjectProgressGrid,
} from "@/components/parent/PortfolioCards";
import { StudentYearSelector } from "@/components/parent/StudentYearSelector";
import { SubmitPortfolioButton } from "@/components/parent/PortfolioForms";
import { QuickStartGuide } from "@/components/parent/QuickStartGuide";
import { LinkChildForm } from "@/components/parent/LinkChildForm";
import { Conversation, Enrollment, Order, Attendance } from "@/models";
import { startOfMonth, endOfMonth } from "date-fns";

export default async function ParentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent");

  const params = await searchParams;
  const ctx = await resolveParentContext(session.user.id, params);
  const { students, studentId, schoolYear, portfolio, stats, readiness, canSubmit } = ctx;
  const pendingLinks = await getPendingLinkRequests(session.user.id);

  await connectDB();
  const unreadMessages = await Conversation.countDocuments({
    parentId: session.user.id,
    parentUnread: { $gt: 0 },
  });

  let enrollmentCount = 0;
  let attendanceSummary = { rate: 0, present: 0, absent: 0, late: 0 };
  if (studentId) {
    enrollmentCount = await Enrollment.countDocuments({ userId: studentId, status: { $ne: "cancelled" } });

    const now = new Date();
    const monthRecords = await Attendance.find({
      studentId,
      sessionDate: { $gte: startOfMonth(now), $lte: endOfMonth(now) },
    }).lean();
    const present = monthRecords.filter((r) => r.status === "present" || r.status === "excused").length;
    attendanceSummary = {
      rate: monthRecords.length ? Math.round((present / monthRecords.length) * 100) : 0,
      present: monthRecords.filter((r) => r.status === "present").length,
      absent: monthRecords.filter((r) => r.status === "absent").length,
      late: monthRecords.filter((r) => r.status === "late").length,
    };
  }

  const orderCount = await Order.countDocuments({
    $or: [{ userId: session.user.id }, { customerEmail: session.user.email }],
    paymentStatus: "paid",
  });

  const selectedStudent = students.find((s) => s.id === studentId);

  return (
    <div className="space-y-8">
      {students.length === 0 ? (
        <>
          <QuickStartGuide />
          <LinkChildForm />
        </>
      ) : (
        <>
          <Suspense fallback={null}>
            <StudentYearSelector
              students={students.map((s) => ({ id: s.id, name: s.name }))}
              selectedStudentId={studentId ?? undefined}
              selectedYear={schoolYear}
              showAllOption
            />
          </Suspense>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-explore-charcoal">My Children</h3>
              <Link
                href="/parent/students"
                className="text-sm font-semibold text-explore-teal hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {students.map((student) => (
                <div key={student.id} className="rounded-2xl bg-white p-5 shadow-sm border border-explore-charcoal/8">
                  <h4 className="font-display text-lg font-bold">{student.name}</h4>
                  {student.studentId && (
                    <p className="text-xs font-mono text-explore-charcoal/60 mt-1">Student ID: {student.studentId}</p>
                  )}
                  {student.grade && <p className="text-sm text-explore-charcoal/60">Grade: {student.grade}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/parent/students/${student.id}`} className="rounded-lg bg-explore-sand px-3 py-1.5 text-xs font-semibold">
                      Student Dashboard
                    </Link>
                    <Link href={`/parent/portfolio?student=${student.id}`} className="rounded-lg bg-explore-teal px-3 py-1.5 text-xs font-semibold text-white">
                      Portfolio
                    </Link>
                    <Link href={`/parent/attendance?student=${student.id}`} className="rounded-lg border border-explore-charcoal/15 px-3 py-1.5 text-xs font-semibold">
                      Attendance
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {pendingLinks.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {pendingLinks.length} child link request{pendingLinks.length === 1 ? "" : "s"} pending staff approval.
            </div>
          )}

          {selectedStudent && (
            <Link
              href={`/parent/attendance?student=${studentId}`}
              className="block rounded-2xl bg-white p-5 shadow-sm border border-explore-charcoal/8 hover:shadow-md transition"
            >
              <p className="text-sm text-explore-charcoal/60">Attendance — {selectedStudent.name}</p>
              <p className="font-display text-3xl font-bold text-explore-teal">{attendanceSummary.rate}% Attendance</p>
              <p className="text-sm text-explore-charcoal/70 mt-1">
                Present: {attendanceSummary.present} | Absent: {attendanceSummary.absent} | Late: {attendanceSummary.late}
              </p>
              <p className="mt-2 text-sm font-semibold text-explore-teal">View Full Attendance Record →</p>
            </Link>
          )}

          {portfolio && stats && readiness && studentId && (
            <>
              <PortfolioProgressCard
                studentName={selectedStudent?.name ?? "Student"}
                schoolYear={schoolYear}
                status={portfolio.status}
                stats={stats}
                readiness={readiness}
              />
              <section>
                <h3 className="font-display text-lg font-bold text-explore-charcoal mb-4">Quick Actions</h3>
                <QuickActionButtons studentId={studentId} year={schoolYear} />
                <div className="mt-3 flex flex-wrap gap-2">
                  <QuickLink href="/parent/students">My Children</QuickLink>
                  <QuickLink href="/parent/account">Update My Information</QuickLink>
                  <QuickLink href="/parent/messages">Message Staff</QuickLink>
                  <QuickLink href="/parent/receipts">Payments &amp; Receipts</QuickLink>
                </div>
              </section>
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="font-display text-lg font-bold mb-4">Subject Documentation</h3>
                <SubjectProgressGrid subjectCounts={stats.subjectCounts} />
              </section>
              <SubmitPortfolioButton portfolioId={portfolio._id.toString()} canSubmit={canSubmit} />
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <DashStat label="Linked Students" value={students.length} href="/parent/students" />
            <DashStat label="Course Enrollments" value={enrollmentCount} href={studentId ? `/parent/students/${studentId}` : "/parent/students"} />
            <DashStat label="Receipts on File" value={orderCount} href="/parent/receipts" />
          </div>

          <LinkChildForm />
        </>
      )}
    </div>
  );
}

function DashStat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition">
      <p className="font-display text-3xl font-bold text-explore-teal">{value}</p>
      <p className="mt-1 text-sm text-explore-charcoal/70">{label}</p>
    </Link>
  );
}

function QuickLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-lg border border-explore-charcoal/15 bg-white px-3 py-2 text-xs font-semibold hover:bg-explore-sand">
      {children}
    </Link>
  );
}
