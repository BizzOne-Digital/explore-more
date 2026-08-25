"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  HeartHandshake,
  DollarSign,
  Users,
  CalendarClock,
  Download,
  RefreshCw,
} from "lucide-react";
import { formatCents } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface SponsorRow {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  status: string;
  type: string;
  totalDonatedCents: number;
  donationCount: number;
  lastDonationAt?: string;
  nextFollowUpAt?: string;
}

interface SponsorStats {
  total: number;
  active: number;
  major: number;
  leads: number;
  followUpsDue: number;
  totalRaisedCents: number;
}

const STATUS_STYLES: Record<string, string> = {
  lead: "bg-slate-500/10 text-slate-300",
  prospect: "bg-blue-500/10 text-blue-300",
  active: "bg-green-500/10 text-green-400",
  major: "bg-amber-500/10 text-amber-300",
  lapsed: "bg-orange-500/10 text-orange-300",
  inactive: "bg-red-500/10 text-red-400",
};

export function SponsorCrmClient() {
  const [sponsors, setSponsors] = useState<SponsorRow[]>([]);
  const [stats, setStats] = useState<SponsorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function load(sync = false) {
    try {
      if (sync) setSyncing(true);
      else setLoading(true);

      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      if (sync) params.set("sync", "1");

      const res = await fetch(`/api/admin/sponsors?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setSponsors(json.data.sponsors ?? []);
        setStats(json.data.stats ?? null);
      }
    } catch (error) {
      console.error("Failed to load sponsors:", error);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }

  useEffect(() => {
    load(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(false), 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const filtered = useMemo(() => sponsors, [sponsors]);

  function exportCsv() {
    const rows = [
      ["Name", "Email", "Organization", "Status", "Total Given", "Donations", "Last Gift"].join(","),
      ...filtered.map((s) =>
        [
          `"${s.name.replace(/"/g, '""')}"`,
          s.email,
          `"${(s.organization ?? "").replace(/"/g, '""')}"`,
          s.status,
          (s.totalDonatedCents / 100).toFixed(2),
          s.donationCount,
          s.lastDonationAt ? new Date(s.lastDonationAt).toLocaleDateString() : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sponsors-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading && !stats) {
    return <div className="flex h-96 items-center justify-center text-white/60">Loading sponsor CRM...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Sponsor CRM</h1>
          <p className="mt-1 text-white/60">
            Track sponsors, donations, follow-ups, and relationships
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => load(true)}
            disabled={syncing}
            className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            Sync Donations
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <Link
            href="/admin/sponsors/new"
            className="flex items-center gap-2 rounded-lg bg-explore-teal px-4 py-2 text-sm font-medium text-white transition hover:bg-explore-teal/90"
          >
            <Plus className="h-4 w-4" />
            Add Sponsor
          </Link>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard icon={Users} label="Total Sponsors" value={stats.total} />
          <StatCard icon={HeartHandshake} label="Active" value={stats.active} />
          <StatCard icon={DollarSign} label="Major Donors" value={stats.major} />
          <StatCard icon={Users} label="Leads / Prospects" value={stats.leads} />
          <StatCard
            icon={CalendarClock}
            label="Follow-ups Due"
            value={stats.followUpsDue}
            highlight={stats.followUpsDue > 0}
          />
        </div>
      )}

      {stats && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/80">
          Lifetime sponsor giving tracked in CRM:{" "}
          <strong className="text-white">{formatCents(stats.totalRaisedCents)}</strong>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[280px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or organization..."
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-explore-teal focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="lead">Lead</option>
          <option value="prospect">Prospect</option>
          <option value="active">Active</option>
          <option value="major">Major</option>
          <option value="lapsed">Lapsed</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              {["Sponsor", "Organization", "Status", "Total Given", "Gifts", "Last Gift", "Follow-up"].map(
                (header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60"
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-white/40">
                  No sponsors found. Click &quot;Sync Donations&quot; to import from existing gifts.
                </td>
              </tr>
            ) : (
              filtered.map((sponsor) => (
                <tr key={sponsor._id} className="transition hover:bg-white/5">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/sponsors/${sponsor._id}`}
                      className="block text-sm font-medium text-white hover:text-explore-teal"
                    >
                      {sponsor.name}
                    </Link>
                    <p className="text-xs text-white/50">{sponsor.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/70">{sponsor.organization || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${STATUS_STYLES[sponsor.status] ?? STATUS_STYLES.lead}`}
                    >
                      {sponsor.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-white">
                    {formatCents(sponsor.totalDonatedCents)}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/70">{sponsor.donationCount}</td>
                  <td className="px-4 py-3 text-xs text-white/60">
                    {sponsor.lastDonationAt
                      ? formatDistanceToNow(new Date(sponsor.lastDonationAt), { addSuffix: true })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {sponsor.nextFollowUpAt ? (
                      <span
                        className={
                          new Date(sponsor.nextFollowUpAt) <= new Date()
                            ? "text-amber-300"
                            : "text-white/60"
                        }
                      >
                        {new Date(sponsor.nextFollowUpAt).toLocaleDateString()}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg p-4 ${highlight ? "bg-amber-500/10" : "bg-white/5"}`}>
      <div className="flex items-center gap-3">
        <Icon className={`h-8 w-8 ${highlight ? "text-amber-300" : "text-white/40"}`} />
        <div>
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-sm text-white/60">{label}</div>
        </div>
      </div>
    </div>
  );
}
