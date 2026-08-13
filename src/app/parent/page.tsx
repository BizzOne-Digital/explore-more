import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import connectDB from "@/lib/db";
import { getLinkedStudents } from "@/lib/parent/students";
import { resolveParentContext } from "@/lib/parent/context";
import {
  PortfolioProgressCard,
  QuickActionButtons,
  SubjectProgressGrid,
} from "@/components/parent/PortfolioCards";
import { StudentYearSelector } from "@/components/parent/StudentYearSelector";
import { SubmitPortfolioButton } from "@/components/parent/PortfolioForms";
import { Conversation, Enrollment, EventRegistration, Order } from "@/models";

export default async function ParentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/parent");

  const params = await searchParams;
  const ctx = await resolveParentContext(session.user.id, params);
  const { students, studentId, schoolYear, portfolio, stats, readiness, canSubmit } = ctx;

  await connectDB();
  const unreadMessages = await Conversation.countDocuments({
    parentId: session.user.id,
    parentUnread: { $gt: 0 },
  });

  let enrollmentCount = 0;
  let eventCount = 0;
  if (studentId) {
    [enrollmentCount, eventCount] = await Promise.all([
      Enrollment.countDocuments({ studentId }),
      EventRegistration.countDocuments({ studentId }),
    ]);
  }

  const orderCount = await Order.countDocuments({
    $or: [{ userId: session.user.id }, { customerEmail: session.user.email }],
    paymentStatus: "paid",
  });

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-explore-forest to-explore-teal p-6 text-white shadow-sm">
        <h2 className="font-display text-2xl font-bold">Welcome Back!</h2>
        <p className="mt-2 text-white/80">
          Manage homeschool portfolios, message staff, track purchases, and stay connected with Explore More Academy.
        </p>
        {unreadMessages > 0 && (
          <p className="mt-3 text-sm font-semibold text-explore-lime">
            You have {unreadMessages} unread message{unreadMessages === 1 ? "" : "s"}
          </p>
        )}
      </section>

      {students.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-explore-charcoal/60">No linked students yet. Contact the academy to link your account.</p>
          <Link href="/contact" className="mt-4 inline-block rounded-lg bg-explore-teal px-5 py-2.5 text-sm font-semibold text-white">
            Contact Us
          </Link>
        </div>
      ) : (
        <>
          <Suspense fallback={null}>
            <StudentYearSelector
              students={students.map((s) => ({ id: s.id, name: s.name }))}
              selectedStudentId={studentId ?? undefined}
              selectedYear={schoolYear}
            />
          </Suspense>

          {portfolio && stats && readiness && (
            <>
              <PortfolioProgressCard
                studentName={students.find((s) => s.id === studentId)?.name ?? "Student"}
                schoolYear={schoolYear}
                status={portfolio.status}
                stats={stats}
                readiness={readiness}
              />

              <section>
                <h3 className="font-display text-lg font-bold text-explore-charcoal mb-4">Quick Actions</h3>
                <QuickActionButtons studentId={studentId!} year={schoolYear} />
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
