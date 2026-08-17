"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  User,
  Save,
  Trash2,
  Calendar,
  CheckCircle,
  XCircle,
  MailCheck,
  MailX,
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

export default function EditSubscriberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriber();
  }, [resolvedParams.id]);

  async function fetchSubscriber() {
    try {
      const res = await fetch(`/api/admin/subscribers/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setSubscriber(data.data);
        setEmail(data.data.email);
        setName(data.data.name || "");
        setVerified(data.data.verified);
      }
    } catch (error) {
      console.error("Failed to fetch subscriber:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/admin/subscribers/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          verified,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to update subscriber");
        setSaving(false);
        return;
      }

      router.push("/admin/subscribers");
      router.refresh();
    } catch (err) {
      setError("Failed to update subscriber");
      setSaving(false);
    }
  }

  async function handleUnsubscribe(unsubscribe: boolean) {
    const action = unsubscribe ? "unsubscribe" : "resubscribe";
    if (
      !confirm(
        `Are you sure you want to ${action} this subscriber? ${
          unsubscribe
            ? "They will no longer receive newsletters."
            : "They will start receiving newsletters again."
        }`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/subscribers/${resolvedParams.id}/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unsubscribed: unsubscribe }),
      });

      if (res.ok) {
        fetchSubscriber();
      } else {
        alert("Failed to update subscription status");
      }
    } catch (error) {
      alert("Failed to update subscription status");
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `Are you sure you want to permanently delete this subscriber? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/subscribers/${resolvedParams.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/subscribers");
        router.refresh();
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

  function formatFullDate(dateString: string) {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-white/60">Loading subscriber...</div>
      </div>
    );
  }

  if (!subscriber) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Mail className="h-12 w-12 text-white/40" />
        <p className="mt-4 text-white/60">Subscriber not found</p>
        <Link
          href="/admin/subscribers"
          className="mt-4 text-sm text-explore-teal hover:text-explore-teal/80"
        >
          Back to subscribers
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/subscribers"
            className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Subscriber Details</h1>
            <p className="mt-1 text-sm text-white/60">{subscriber.email}</p>
          </div>
        </div>

        <button
          onClick={handleDelete}
          className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/60">Subscription Status</h3>
            {subscriber.unsubscribed ? (
              <XCircle className="h-5 w-5 text-red-400" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-400" />
            )}
          </div>
          {subscriber.unsubscribed ? (
            <div>
              <p className="text-lg font-semibold text-red-400">Unsubscribed</p>
              {subscriber.unsubscribedAt && (
                <p className="mt-1 text-sm text-white/60">
                  Left {formatDate(subscriber.unsubscribedAt)}
                </p>
              )}
              <button
                onClick={() => handleUnsubscribe(false)}
                className="mt-4 flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400 transition hover:bg-green-500/20"
              >
                <MailCheck className="h-4 w-4" />
                Resubscribe
              </button>
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold text-green-400">Active</p>
              <p className="mt-1 text-sm text-white/60">
                Subscribed {formatDate(subscriber.createdAt)}
              </p>
              <button
                onClick={() => handleUnsubscribe(true)}
                className="mt-4 flex items-center gap-2 rounded-lg bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-400 transition hover:bg-yellow-500/20"
              >
                <MailX className="h-4 w-4" />
                Unsubscribe
              </button>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/60">Verification Status</h3>
            {subscriber.verified ? (
              <CheckCircle className="h-5 w-5 text-blue-400" />
            ) : (
              <XCircle className="h-5 w-5 text-yellow-400" />
            )}
          </div>
          {subscriber.verified ? (
            <div>
              <p className="text-lg font-semibold text-blue-400">Verified</p>
              <p className="mt-1 text-sm text-white/60">Email address is confirmed</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold text-yellow-400">Unverified</p>
              <p className="mt-1 text-sm text-white/60">Email address needs confirmation</p>
            </div>
          )}
        </div>
      </div>

      {/* Subscriber Information */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Subscriber Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-white/60">Email Address</p>
            <p className="mt-1 font-medium text-white">{subscriber.email}</p>
          </div>
          <div>
            <p className="text-sm text-white/60">Name</p>
            <p className="mt-1 font-medium text-white">{subscriber.name || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-white/60">Subscribed Date</p>
            <p className="mt-1 font-medium text-white">
              {formatFullDate(subscriber.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-sm text-white/60">Last Updated</p>
            <p className="mt-1 font-medium text-white">
              {formatFullDate(subscriber.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Edit Details</h3>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="subscriber@example.com"
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-white placeholder:text-white/30 focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
                  required
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Name <span className="text-white/40">(Optional)</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-white placeholder:text-white/30 focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
                />
              </div>
            </div>

            {/* Verified Status */}
            <div>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-explore-teal focus:ring-explore-teal"
                />
                <div className="flex-1">
                  <span className="block text-sm font-medium text-white/80">
                    Mark as Verified
                  </span>
                  <p className="mt-1 text-xs text-white/40">
                    Verified subscribers have confirmed their email address
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 rounded-lg border border-white/10 bg-white/5 p-6">
          <Link
            href="/admin/subscribers"
            className="rounded-lg border border-white/20 bg-white/10 px-6 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-explore-teal px-6 py-2 text-sm font-medium text-white transition hover:bg-explore-teal/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
