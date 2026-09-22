import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { getTrafficSummary } from "@/lib/analytics/traffic";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days } = await searchParams;
  const period =
    days === "7" || days === "30" || days === "90" ? (Number(days) as 7 | 30 | 90) : 30;
  const summary = await getTrafficSummary(period);

  const maxViews = Math.max(...summary.rows.map((r) => r.views), 1);

  return (
    <div>
      <PageHeader
        title="Site traffic"
        description="Public page visits on the marketing site (one count per browser session per page)."
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {([7, 30, 90] as const).map((d) => (
          <Link
            key={d}
            href={`/admin/analytics?days=${d}`}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              period === d
                ? "bg-explore-lime text-explore-black"
                : "border border-white/15 text-white/70 hover:text-white"
            }`}
          >
            Last {d} days
          </Link>
        ))}
      </div>

      <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-white/60">Total page visits</p>
        <p className="mt-1 font-display text-4xl font-bold text-white">{summary.totalViews}</p>
        {summary.trackingSince ? (
          <p className="mt-2 text-xs text-white/45">
            Tracking since {new Date(summary.trackingSince).toLocaleDateString("en-US")} (UTC days).
            Portal logins and admin routes are not included.
          </p>
        ) : (
          <p className="mt-2 text-xs text-white/45">
            No visits recorded yet. Browse the public site to start collecting data.
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-white/50">
            <tr>
              <th className="px-4 py-3">Page / section</th>
              <th className="px-4 py-3">Path</th>
              <th className="px-4 py-3 text-right">Visits</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {summary.rows.map((row) => (
              <tr key={row.path} className="hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-medium text-white">{row.label}</td>
                <td className="px-4 py-3 font-mono text-xs text-white/50">{row.path}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-white/10 sm:block">
                      <div
                        className="h-full rounded-full bg-explore-teal"
                        style={{ width: `${Math.round((row.views / maxViews) * 100)}%` }}
                      />
                    </div>
                    <span className="font-semibold tabular-nums text-white">{row.views}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-white/40">
        For deeper analytics (referrers, devices, funnels), you can also connect Google Analytics or
        Vercel Analytics later. This report is a simple first-party count for key academy pages.
      </p>
    </div>
  );
}
