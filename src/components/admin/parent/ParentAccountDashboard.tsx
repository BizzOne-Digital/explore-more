"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  ExternalLink,
  History,
  Loader,
  Plus,
  Save,
  StickyNote,
  User,
  X,
} from "lucide-react";
import { formatCents } from "@/lib/utils";
import {
  formatInterval,
  formatPaymentMethod,
  formatSubscriptionStatus,
} from "@/lib/billing/format";

import {
  OverviewProfileTab,
  CoursesResourcesTab,
  AttendanceTab,
  MessagesTab,
  DocumentsTab,
  ChildrenTab,
  type FamilyData,
  type ParentProfile,
} from "@/components/admin/parent/ParentFamilyTabs";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "children", label: "Children" },
  { id: "courses", label: "Courses & Resources" },
  { id: "billing", label: "Billing" },
  { id: "subscription", label: "Subscription" },
  { id: "payments", label: "Payments & Receipts" },
  { id: "attendance", label: "Attendance" },
  { id: "notes", label: "Notes" },
  { id: "messages", label: "Messages" },
  { id: "documents", label: "Documents" },
  { id: "activity", label: "Activity Log" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type UserData = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  guardianId?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
};

type StudentLink = {
  _id: string;
  relationship: string;
  status: string;
  studentId?: { name: string; email: string; studentId?: string };
};

type Plan = {
  _id: string;
  name: string;
  slug: string;
  priceCents: number;
  interval: "month" | "year";
  features: string[];
};

type Note = {
  _id: string;
  staffName: string;
  subject: string;
  reasonForCall: string;
  noteContent: string;
  callerName: string;
  createdAt: string;
  isEdited: boolean;
  editedAt?: string;
  editedBy?: { name?: string; staffId?: string } | string;
  isVisibleToParent: boolean;
};

type Activity = {
  _id: string;
  action: string;
  details?: string;
  createdAt: string;
  performedBy?: { name: string };
};

type BillingSummary = {
  billing: {
    billingName: string;
    billingEmail: string;
    billingPhone?: string;
    billingAddress: { street?: string; city?: string; state?: string; zip?: string };
  };
  paymentMethod: { brand: string; last4: string } | null;
  subscription: {
    planId?: string;
    status: string;
    planName: string;
    priceCents: number;
    interval: "month" | "year";
    currentPeriodEnd?: string;
    cancelAtPeriodEnd: boolean;
    discountPercent: number;
    creditCents: number;
    features: string[];
  };
  paymentHistory: {
    id: string;
    date: string;
    description: string;
    amountCents: number;
    status: string;
    reference?: string;
  }[];
  plans: Plan[];
  stripeConfigured: boolean;
};

export function ParentAccountDashboard({ userId }: { userId: string }) {
  const [tab, setTab] = useState<TabId>("overview");
  const [user, setUser] = useState<UserData | null>(null);
  const [studentLinks, setStudentLinks] = useState<StudentLink[]>([]);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [family, setFamily] = useState<FamilyData | null>(null);
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelationship: "",
    preferredCommunication: "email",
    isActive: true,
  });
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteForm, setNoteForm] = useState({
    subject: "",
    reasonForCall: "General",
    noteContent: "",
    callerName: "",
  });
  const [billingForm, setBillingForm] = useState({
    billingName: "",
    billingEmail: "",
    billingPhone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
  });
  const [subForm, setSubForm] = useState({
    planId: "",
    status: "none",
    discountPercent: 0,
    creditCents: 0,
    currentPeriodEnd: "",
    cancelAtPeriodEnd: false,
  });

  function applyBillingData(data: BillingSummary & { subscription: { planId?: string } }) {
    setBilling(data);
    const b = data.billing;
    setBillingForm({
      billingName: b.billingName ?? "",
      billingEmail: b.billingEmail ?? "",
      billingPhone: b.billingPhone ?? "",
      street: b.billingAddress?.street ?? "",
      city: b.billingAddress?.city ?? "",
      state: b.billingAddress?.state ?? "",
      zip: b.billingAddress?.zip ?? "",
    });
    const sub = data.subscription;
    setSubForm({
      planId: sub.planId ?? "",
      status: sub.status,
      discountPercent: sub.discountPercent ?? 0,
      creditCents: sub.creditCents ?? 0,
      currentPeriodEnd: sub.currentPeriodEnd
        ? new Date(sub.currentPeriodEnd).toISOString().slice(0, 10)
        : "",
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
    });
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setError("");
      setSuccess("");
      try {
        const [userRes, billingRes, notesRes, activityRes, accountRes] = await Promise.all([
          fetch(`/api/admin/users/${userId}`),
          fetch(`/api/admin/users/${userId}/billing`),
          fetch(`/api/admin/users/${userId}/notes`),
          fetch(`/api/admin/users/${userId}/activity`),
          fetch(`/api/admin/users/${userId}/parent-account`),
        ]);

        if (cancelled) return;

        const failures: string[] = [];

        const userJson = await userRes.json().catch(() => null);
        if (userJson?.success) {
          setUser(userJson.data.user);
          setStudentLinks(userJson.data.studentLinks ?? []);
        } else {
          failures.push(userJson?.error || "Failed to load user profile");
        }

        const billingJson = await billingRes.json().catch(() => null);
        if (billingJson?.success) {
          applyBillingData(billingJson.data);
        } else {
          failures.push(billingJson?.error || "Failed to load billing data");
        }

        const notesJson = await notesRes.json().catch(() => null);
        if (notesJson?.success) {
          setNotes(notesJson.data);
        } else {
          failures.push(notesJson?.error || "Failed to load notes");
        }

        const activityJson = await activityRes.json().catch(() => null);
        if (activityJson?.success) {
          setActivities(activityJson.data);
        } else {
          failures.push(activityJson?.error || "Failed to load activity log");
        }

        const accountJson = await accountRes.json().catch(() => null);
        if (accountJson?.success) {
          const u = accountJson.data.user;
          const p = accountJson.data.profile as ParentProfile | null;
          setProfile(p);
          setFamily(accountJson.data.family);
          setProfileForm({
            name: u.name ?? "",
            email: u.email ?? "",
            phone: u.phone ?? "",
            firstName: p?.firstName ?? "",
            lastName: p?.lastName ?? "",
            street: p?.mailingAddress?.street ?? "",
            city: p?.mailingAddress?.city ?? "",
            state: p?.mailingAddress?.state ?? "",
            zip: p?.mailingAddress?.zip ?? "",
            emergencyName: p?.emergencyContact?.name ?? "",
            emergencyPhone: p?.emergencyContact?.phone ?? "",
            emergencyRelationship: p?.emergencyContact?.relationship ?? "",
            preferredCommunication: p?.preferredCommunication ?? "email",
            isActive: u.isActive ?? true,
          });
        }

        if (failures.length > 0) {
          setError(failures.join(" · "));
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load parent account. Please refresh and try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function saveProfile() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/parent-account`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone,
          isActive: profileForm.isActive,
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          mailingAddress: {
            street: profileForm.street,
            city: profileForm.city,
            state: profileForm.state,
            zip: profileForm.zip,
          },
          emergencyContact: {
            name: profileForm.emergencyName,
            phone: profileForm.emergencyPhone,
            relationship: profileForm.emergencyRelationship,
          },
          preferredCommunication: profileForm.preferredCommunication,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Failed to save profile");
        return;
      }
      setUser(json.data.user);
      setProfile(json.data.profile);
      setSuccess("Profile saved.");
      const activityRes = await fetch(`/api/admin/users/${userId}/activity`);
      const activityJson = await activityRes.json();
      if (activityJson.success) setActivities(activityJson.data);
    } catch {
      setError("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function sendPasswordReset() {
    setResetLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: "POST" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Failed to send reset email");
        return;
      }
      setSuccess(json.data?.message || "Password reset email sent.");
    } catch {
      setError("Failed to send password reset.");
    } finally {
      setResetLoading(false);
    }
  }

  async function openNoteDetail(note: Note) {
    try {
      const res = await fetch(`/api/admin/users/${userId}/notes/${note._id}`);
      const json = await res.json();
      if (json.success) setSelectedNote(json.data);
      else setSelectedNote(note);
    } catch {
      setSelectedNote(note);
    }
  }

  async function saveBilling() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/billing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingName: billingForm.billingName,
          billingEmail: billingForm.billingEmail,
          billingPhone: billingForm.billingPhone,
          billingAddress: {
            street: billingForm.street,
            city: billingForm.city,
            state: billingForm.state,
            zip: billingForm.zip,
          },
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Failed to save billing");
        return;
      }
      applyBillingData(json.data);
      setSuccess("Billing information saved.");
      const activityRes = await fetch(`/api/admin/users/${userId}/activity`);
      const activityJson = await activityRes.json();
      if (activityJson.success) setActivities(activityJson.data);
    } catch {
      setError("Failed to save billing. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function saveSubscription() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/billing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            planId: subForm.planId || null,
            status: subForm.status,
            discountPercent: subForm.discountPercent,
            creditCents: subForm.creditCents,
            currentPeriodEnd: subForm.currentPeriodEnd || null,
            cancelAtPeriodEnd: subForm.cancelAtPeriodEnd,
          },
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Failed to save subscription");
        return;
      }
      applyBillingData(json.data);
      setSuccess("Subscription updated.");
      const activityRes = await fetch(`/api/admin/users/${userId}/activity`);
      const activityJson = await activityRes.json();
      if (activityJson.success) setActivities(activityJson.data);
    } catch {
      setError("Failed to save subscription. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function openBillingPortal() {
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/billing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "billing_portal" }),
      });
      const json = await res.json();
      if (json.success && json.data.url) {
        window.open(json.data.url, "_blank");
      } else {
        setError(json.error || "Billing portal unavailable");
      }
    } catch {
      setError("Unable to open billing portal.");
    }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteForm),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Failed to add note");
        return;
      }
      setShowAddNote(false);
      setNoteForm({ subject: "", reasonForCall: "General", noteContent: "", callerName: "" });
      setNotes((prev) => [json.data, ...prev]);
      setSuccess("Note added.");
      const activityRes = await fetch(`/api/admin/users/${userId}/activity`);
      const activityJson = await activityRes.json();
      if (activityJson.success) setActivities(activityJson.data);
    } catch {
      setError("Failed to add note. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function formatNoteDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatActivityLine(a: Activity) {
    const d = new Date(a.createdAt);
    const date = d.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const who = a.performedBy?.name ?? "Staff";
    const what = a.details ?? a.action;
    return { date, who, what };
  }

  if (loading && !user) {
    return (
      <div className="flex h-96 items-center justify-center text-white/60">
        <Loader className="mr-2 h-5 w-5 animate-spin" />
        Loading parent account…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <User className="h-12 w-12 text-white/40" />
        <p className="mt-4 text-white/60">Parent not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-0.5 text-xs font-medium text-green-400">
                Parent
              </span>
              {user.guardianId && (
                <span className="font-mono text-explore-teal">{user.guardianId}</span>
              )}
              <span className="text-white/50">{user.email}</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {success}
        </div>
      )}

      <div className="flex flex-wrap gap-1 border-b border-white/10 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-t-lg px-3 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-white/10 text-white"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && user && (
        <OverviewProfileTab
          user={user}
          profile={profile}
          profileForm={profileForm}
          setProfileForm={setProfileForm}
          billingPlanName={billing?.subscription.planName}
          billingStatus={billing?.subscription.status}
          paymentMethod={billing?.paymentMethod ?? null}
          saving={saving}
          resetLoading={resetLoading}
          onSave={saveProfile}
          onPasswordReset={sendPasswordReset}
        />
      )}

      {tab === "children" && (
        <ChildrenTab family={family} studentLinks={studentLinks} />
      )}

      {tab === "courses" && <CoursesResourcesTab family={family} />}

      {tab === "attendance" && <AttendanceTab family={family} />}

      {tab === "messages" && <MessagesTab family={family} userId={userId} />}

      {tab === "documents" && <DocumentsTab family={family} />}

      {tab === "billing" && (
        billing ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </h3>
                <p className="mt-2 text-sm text-white/80">
                  {formatPaymentMethod(billing.paymentMethod)}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  Full card numbers are never stored or displayed.
                </p>
              </div>
              {billing.stripeConfigured && (
                <button
                  type="button"
                  onClick={openBillingPortal}
                  className="inline-flex items-center gap-2 rounded-lg bg-explore-teal px-3 py-2 text-sm text-white hover:bg-explore-teal/90"
                >
                  <ExternalLink className="h-4 w-4" />
                  Stripe portal
                </button>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Billing Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {(
                [
                  ["billingName", "Billing name"],
                  ["billingEmail", "Billing email"],
                  ["billingPhone", "Phone"],
                  ["street", "Street"],
                  ["city", "City"],
                  ["state", "State"],
                  ["zip", "ZIP"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs text-white/60">{label}</label>
                  <input
                    value={billingForm[key]}
                    onChange={(e) => setBillingForm({ ...billingForm, [key]: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={saveBilling}
              disabled={saving}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-explore-teal px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save billing"}
            </button>
          </div>
        </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-sm text-white/60">
            Billing data could not be loaded. Please refresh the page or check your connection.
          </div>
        )
      )}

      {tab === "subscription" && (
        billing ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Subscription Management</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-white/60">Plan</label>
              <select
                value={subForm.planId}
                onChange={(e) => setSubForm({ ...subForm, planId: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="">No plan</option>
                {billing.plans.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — {formatCents(p.priceCents)}/{p.interval}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Status</label>
              <select
                value={subForm.status}
                onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                {["active", "trialing", "past_due", "canceled", "paused", "none"].map((s) => (
                  <option key={s} value={s}>
                    {formatSubscriptionStatus(s)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Discount (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={subForm.discountPercent}
                onChange={(e) =>
                  setSubForm({ ...subForm, discountPercent: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Account credit (¢)</label>
              <input
                type="number"
                min={0}
                value={subForm.creditCents}
                onChange={(e) => setSubForm({ ...subForm, creditCents: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">Renewal / period end</label>
              <input
                type="date"
                value={subForm.currentPeriodEnd}
                onChange={(e) => setSubForm({ ...subForm, currentPeriodEnd: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={subForm.cancelAtPeriodEnd}
                  onChange={(e) =>
                    setSubForm({ ...subForm, cancelAtPeriodEnd: e.target.checked })
                  }
                  className="rounded"
                />
                Cancel at period end
              </label>
            </div>
          </div>
          <button
            type="button"
            onClick={saveSubscription}
            disabled={saving}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-explore-teal px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save subscription"}
          </button>
        </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-sm text-white/60">
            Subscription data could not be loaded. Please refresh the page.
          </div>
        )
      )}

      {tab === "payments" && (
        billing ? (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-left text-white/60">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {billing.paymentHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/40">
                    No payment history.
                  </td>
                </tr>
              ) : (
                billing.paymentHistory.map((p) => (
                  <tr key={p.id} className="border-t border-white/10">
                    <td className="px-4 py-3 text-white">
                      {new Date(p.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-white">{p.description}</td>
                    <td className="px-4 py-3 font-mono text-xs text-explore-teal">
                      {p.reference ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-white">{formatCents(p.amountCents)}</td>
                    <td className="px-4 py-3 capitalize text-white/70">{p.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-sm text-white/60">
            Payment history could not be loaded. Please refresh the page.
          </div>
        )
      )}

      {tab === "notes" && (
        <div className="space-y-4">
          <div className="flex justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <StickyNote className="h-5 w-5" />
              Admin Notes
            </h3>
            <button
              type="button"
              onClick={() => setShowAddNote(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-explore-teal px-3 py-2 text-sm text-white"
            >
              <Plus className="h-4 w-4" />
              Add Note
            </button>
          </div>
          <p className="text-xs text-white/40">Internal only — not visible to parents unless marked.</p>

          {showAddNote && (
            <form
              onSubmit={addNote}
              className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  placeholder="Note title / type"
                  value={noteForm.subject}
                  onChange={(e) => setNoteForm({ ...noteForm, subject: e.target.value })}
                  required
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                />
                <input
                  placeholder="Category (e.g. Billing Question)"
                  value={noteForm.reasonForCall}
                  onChange={(e) => setNoteForm({ ...noteForm, reasonForCall: e.target.value })}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                />
              </div>
              <textarea
                placeholder="Note content"
                value={noteForm.noteContent}
                onChange={(e) => setNoteForm({ ...noteForm, noteContent: e.target.value })}
                required
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-explore-teal px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  Save note
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddNote(false)}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {notes.length === 0 ? (
              <p className="text-sm text-white/50">No notes yet.</p>
            ) : (
              notes.map((note) => (
                <div
                  key={note._id}
                  className="rounded-lg border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-sm text-white/70">
                    {formatNoteDate(note.createdAt)} — {note.staffName}
                  </p>
                  <p className="mt-1 font-medium text-white">{note.subject}</p>
                  {note.reasonForCall && note.reasonForCall !== "General" && (
                    <p className="text-xs text-white/50">{note.reasonForCall}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => void openNoteDetail(note)}
                    className="mt-2 text-sm text-explore-teal hover:underline"
                  >
                    View Note →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "activity" && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <History className="h-5 w-5" />
            Activity Log
          </h3>
          <p className="mb-4 text-xs text-white/40">
            Immutable audit trail — changes cannot be deleted by administrators.
          </p>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-white/50">No activity recorded.</p>
            ) : (
              activities.map((a) => {
                const line = formatActivityLine(a);
                return (
                  <div key={a._id} className="border-l-2 border-explore-teal/40 pl-4">
                    <p className="text-sm text-white/50">{line.date}</p>
                    <p className="text-sm text-white">
                      <span className="font-medium">{line.who}</span> {line.what}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#1a2332] p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-white">{selectedNote.subject}</h3>
              <button
                type="button"
                onClick={() => setSelectedNote(null)}
                className="text-white/60 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-white/50">Created by</dt>
                <dd className="text-white">{selectedNote.staffName}</dd>
              </div>
              <div>
                <dt className="text-white/50">Date</dt>
                <dd className="text-white">{formatNoteDate(selectedNote.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-white/50">Category</dt>
                <dd className="text-white">{selectedNote.reasonForCall}</dd>
              </div>
              {selectedNote.isEdited && selectedNote.editedAt && (
                <div>
                  <dt className="text-white/50">Edited</dt>
                  <dd className="text-white">
                    {formatNoteDate(selectedNote.editedAt)}
                    {typeof selectedNote.editedBy === "object" && selectedNote.editedBy?.name
                      ? ` by ${selectedNote.editedBy.name}`
                      : ""}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-white/50">Note</dt>
                <dd className="mt-1 whitespace-pre-wrap text-white">{selectedNote.noteContent}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
