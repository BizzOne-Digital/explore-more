import type { PortfolioReadiness, PortfolioStats } from "@/lib/queries/portfolio";
import { PORTFOLIO_STATUS_LABELS, type PortfolioStatus } from "@/lib/portfolio/constants";
import { cn } from "@/lib/cn";

export function PortfolioProgressCard({
  studentName,
  schoolYear,
  status,
  stats,
  readiness,
}: {
  studentName: string;
  schoolYear: string;
  status: PortfolioStatus;
  stats: PortfolioStats;
  readiness: PortfolioReadiness;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-explore-charcoal/8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-explore-teal">Homeschool Portfolio</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-explore-charcoal">{studentName}</h2>
          <p className="text-sm text-explore-charcoal/60">{schoolYear} School Year</p>
        </div>
        <span className="rounded-full bg-explore-sand px-3 py-1 text-xs font-semibold text-explore-charcoal">
          {PORTFOLIO_STATUS_LABELS[status]}
        </span>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-explore-charcoal">Portfolio Review Progress</span>
          <span className="font-bold text-explore-teal">{readiness.percentComplete}% Complete</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-explore-charcoal/10">
          <div
            className="h-full rounded-full bg-explore-teal transition-all"
            style={{ width: `${readiness.percentComplete}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Days of Instruction" value={stats.instructionDays} />
        <Stat label="Activities Recorded" value={stats.activityCount} />
        <Stat label="Portfolio Items" value={stats.workSampleCount} />
      </div>

      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {readiness.checks.map((check) => (
          <li
            key={check.label}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
              check.complete ? "bg-explore-teal/10 text-explore-forest" : "bg-explore-orange/10 text-explore-charcoal"
            )}
          >
            <span>{check.complete ? "✓" : check.warning ? "⚠" : "○"}</span>
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-explore-cream p-4 text-center">
      <p className="font-display text-2xl font-bold text-explore-teal">{value}</p>
      <p className="mt-1 text-xs text-explore-charcoal/60">{label}</p>
    </div>
  );
}

export function SubjectProgressGrid({ subjectCounts }: { subjectCounts: Record<string, number> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Object.entries(subjectCounts).map(([subject, count]) => (
        <div key={subject} className="flex items-center justify-between rounded-lg border border-explore-charcoal/10 px-4 py-3">
          <span className="text-sm text-explore-charcoal">{subject}</span>
          <span className="text-sm font-semibold text-explore-teal">
            {count} {count === 1 ? "item" : "items"} {count >= 2 ? "✓" : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

export function QuickActionButtons({ studentId, year }: { studentId: string; year: string }) {
  const q = `?student=${studentId}&year=${encodeURIComponent(year)}`;
  const actions = [
    { href: `/parent/portfolio/work-samples${q}`, label: "Upload Work Sample" },
    { href: `/parent/portfolio/reading${q}`, label: "Add Reading Material" },
    { href: `/parent/portfolio/activities${q}`, label: "Log Activity" },
    { href: `/parent/portfolio/attendance${q}`, label: "Record Attendance" },
    { href: `/parent/messages${q}`, label: "Message Staff" },
    { href: `/parent/portfolio${q}`, label: "View Portfolio" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {actions.map((action) => (
        <a
          key={action.href}
          href={action.href}
          className="rounded-xl border border-explore-teal/20 bg-explore-teal/5 px-4 py-4 text-center text-sm font-semibold text-explore-teal hover:bg-explore-teal/10 transition"
        >
          {action.label}
        </a>
      ))}
    </div>
  );
}
