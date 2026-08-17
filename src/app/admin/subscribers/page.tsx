"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Mail,
  MailCheck,
  MailX,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Filter,
  Download,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface Subscriber {
  _id: string;
  email: string;
  name?: string;
  verified: boolean;
  verificationToken?: string;
  unsubscribed: boolean;
  unsubscribedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SubscribersPage() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "subscribed" | "unsubscribed" | "verified" | "unverified"
  >("all");

  useEffect(() => {
    fetchSubscribers();
  }, [statusFilter]);

  async function fetchSubscribers() {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/subscribers?status=${statusFilter}${
          searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ""
        }`
      );
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch subscribers:", error);
    } finally {
      setLoading(false);
    }
  }

  // Refetch when search changes (with debounce effect would be better in production)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchSubscribers();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        sub.email.toLowerCase().includes(term) ||
        (sub.name && sub.name.toLowerCase().includes(term))
      );
    });
  }, [subscribers, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: subscribers.length,
      subscribed: subscribers.filter((s) => !s.unsubscribed).length,
      unsubscribed: subscribers.filter((s) => s.unsubscribed).length,
      verified: subscribers.filter((s) => s.verified && !s.unsubscribed).length,
    };
  }, [subscribers]);

  async function handleUnsubscribe(id: string, currentStatus: boolean) {
    const action = currentStatus ? "resubscribe" : "unsubscribe";
    if (
      !confirm(
        `Are you sure you want to ${action} this subscriber? ${
          !currentStatus
            ? "They will no longer receive newsletters."
            : "They will start receiving newsletters again."
        }`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/subscribers/${id}/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unsubscribed: !currentStatus }),
      });

      if (res.ok) {
        fetchSubscribers();
      } else {
        alert("Failed to update subscriber status");
      }
    } catch (error) {
      alert("Failed to update subscriber status");
    }
  }

  async function handleDelete(id: string, email: string) {
    if (
      !confirm(
        `Are you sure you want to permanently delete subscriber "${email}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/subscribers/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSubscribers(subscribers.filter((s) => s._id !== id));
      } else {
        alert("Failed to delete subscriber");
      }
    } catch (error) {
      alert("Failed to delete subscriber");
    }
  }

  function formatDate(dateString: string) {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  }

  async function exportSubscribers() {
    const csv = [
      ["Email", "Name", "Verified", "Status", "Subscribed Date", "Unsubscribed Date"].join(","),
      ...filteredSubscribers.map((sub) =>
        [
          sub.email,
          sub.name || "",
          sub.verified ? "Yes" : "No",
          sub.unsubscribed ? "Unsubscribed" : "Subscribed",
          new Date(sub.createdAt).toLocaleDateString(),
          sub.unsubscribedAt ? new Date(sub.unsubscribedAt).toLocaleDateString() : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-white/60">Loading subscribers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Newsletter Subscribers</h1>
          <p className="mt-1 text-white/60">
            Manage newsletter subscriptions and subscriber information
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportSubscribers}
            className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <Link
            href="/admin/subscribers/new"
            className="flex items-center gap-2 rounded-lg bg-explore-teal px-4 py-2 text-sm font-medium text-white transition hover:bg-explore-teal/90"
          >
            <Plus className="h-4 w-4" />
            Add Subscriber
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <Mail className="h-8 w-8 text-white/40" />
            <div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-white/60">Total Subscribers</div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <MailCheck className="h-8 w-8 text-green-400" />
            <div>
              <div className="text-2xl font-bold text-white">{stats.subscribed}</div>
              <div className="text-sm text-white/60">Active</div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <UserCheck className="h-8 w-8 text-blue-400" />
            <div>
              <div className="text-2xl font-bold text-white">{stats.verified}</div>
              <div className="text-sm text-white/60">Verified</div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <MailX className="h-8 w-8 text-red-400" />
            <div>
              <div className="text-2xl font-bold text-white">{stats.unsubscribed}</div>
              <div className="text-sm text-white/60">Unsubscribed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-white/40" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
          >
            <option value="all">All Subscribers</option>
            <option value="subscribed">Active Only</option>
            <option value="unsubscribed">Unsubscribed Only</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified Only</option>
          </select>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">
                Verified
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">
                Subscribed
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-white/60">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredSubscribers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-white/40">
                  No subscribers found
                </td>
              </tr>
            ) : (
              filteredSubscribers.map((subscriber) => (
                <tr key={subscriber._id} className="transition hover:bg-white/5">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/subscribers/${subscriber._id}`}
                      className="text-sm font-medium text-white hover:text-explore-teal"
                    >
                      {subscriber.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/80">
                    {subscriber.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {subscriber.unsubscribed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400">
                        <UserX className="h-3 w-3" />
                        Unsubscribed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400">
                        <UserCheck className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {subscriber.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400">
                        <MailCheck className="h-3 w-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-400">
                        <Mail className="h-3 w-3" />
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-white/60">
                      <Clock className="h-3 w-3" />
                      {formatDate(subscriber.createdAt)}
                    </div>
                    {subscriber.unsubscribed && subscriber.unsubscribedAt && (
                      <div className="mt-1 text-xs text-red-400">
                        Left {formatDate(subscriber.unsubscribedAt)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/subscribers/${subscriber._id}`}
                        className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() =>
                          handleUnsubscribe(subscriber._id, subscriber.unsubscribed)
                        }
                        className={`rounded-lg p-2 transition ${
                          subscriber.unsubscribed
                            ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                            : "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                        }`}
                        title={subscriber.unsubscribed ? "Resubscribe" : "Unsubscribe"}
                      >
                        {subscriber.unsubscribed ? (
                          <MailCheck className="h-4 w-4" />
                        ) : (
                          <MailX className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(subscriber._id, subscriber.email)}
                        className="rounded-lg bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
