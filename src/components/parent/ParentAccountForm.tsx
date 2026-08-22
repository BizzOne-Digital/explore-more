"use client";

import { useEffect, useState } from "react";
import { Loader, Save } from "lucide-react";
import { CopyIdButton } from "@/components/parent/CopyIdButton";
import { GRADE_LEVELS, formatGradeLabel } from "@/lib/grades";

type ProfileData = {
  user: {
    name: string;
    email: string;
    phone?: string;
    guardianId?: string;
    notificationPreferences?: {
      events: boolean;
      courses: boolean;
      announcements: boolean;
    };
  };
  profile?: {
    firstName?: string;
    lastName?: string;
    mailingAddress?: { street?: string; city?: string; state?: string; zip?: string };
    emergencyContact?: { name?: string; phone?: string; relationship?: string };
    preferredCommunication?: string;
    childGrade?: string;
  };
};

export function ParentAccountForm() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
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
    events: true,
    courses: true,
    announcements: true,
    childGrade: "",
    currentPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    fetch("/api/parent/profile")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
          const { user, profile } = json.data;
          const [firstName = "", ...rest] = (user.name ?? "").split(" ");
          setForm({
            name: user.name ?? "",
            email: user.email ?? "",
            phone: user.phone ?? "",
            firstName: profile?.firstName ?? firstName,
            lastName: profile?.lastName ?? rest.join(" "),
            street: profile?.mailingAddress?.street ?? "",
            city: profile?.mailingAddress?.city ?? "",
            state: profile?.mailingAddress?.state ?? "",
            zip: profile?.mailingAddress?.zip ?? "",
            emergencyName: profile?.emergencyContact?.name ?? "",
            emergencyPhone: profile?.emergencyContact?.phone ?? "",
            emergencyRelationship: profile?.emergencyContact?.relationship ?? "",
            preferredCommunication: profile?.preferredCommunication ?? "email",
            childGrade: profile?.childGrade ?? "",
            events: user.notificationPreferences?.events ?? true,
            courses: user.notificationPreferences?.courses ?? true,
            announcements: user.notificationPreferences?.announcements ?? true,
            currentPassword: "",
            newPassword: "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/parent/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`.trim() || form.name,
          email: form.email,
          phone: form.phone,
          firstName: form.firstName,
          lastName: form.lastName,
          mailingAddress: {
            street: form.street,
            city: form.city,
            state: form.state,
            zip: form.zip,
          },
          emergencyContact: {
            name: form.emergencyName,
            phone: form.emergencyPhone,
            relationship: form.emergencyRelationship,
          },
          preferredCommunication: form.preferredCommunication,
          childGrade: form.childGrade || undefined,
          notificationPreferences: {
            events: form.events,
            courses: form.courses,
            announcements: form.announcements,
          },
          currentPassword: form.currentPassword || undefined,
          newPassword: form.newPassword || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Save failed");
      setSuccess("Profile updated successfully.");
      setForm((f) => ({ ...f, currentPassword: "", newPassword: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-explore-charcoal/60">Loading profile...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {data?.user.guardianId && (
        <div className="rounded-2xl bg-white p-6 shadow-sm flex flex-wrap items-center gap-3">
          <span className="text-sm text-explore-charcoal/70">
            Parent/Guardian ID:{" "}
            <span className="font-mono font-semibold">{data.user.guardianId}</span>
          </span>
          <CopyIdButton value={data.user.guardianId} />
        </div>
      )}

      <section className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
        <h3 className="font-display text-lg font-bold">Personal Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First Name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
          <Field label="Last Name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
          <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} className="sm:col-span-2" />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <div>
            <label className="mb-1 block text-sm font-medium text-explore-charcoal/70">
              Child&apos;s Grade
            </label>
            <select
              value={form.childGrade}
              onChange={(e) => setForm({ ...form, childGrade: e.target.value })}
              className="w-full rounded-lg border border-explore-charcoal/20 px-4 py-2"
            >
              <option value="">Select grade...</option>
              {GRADE_LEVELS.map((grade) => (
                <option key={grade} value={grade}>
                  {formatGradeLabel(grade)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-explore-charcoal/50">
              Used to show grade-specific assessments in your portal.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-explore-charcoal/70 mb-1">Preferred Communication</label>
            <select
              value={form.preferredCommunication}
              onChange={(e) => setForm({ ...form, preferredCommunication: e.target.value })}
              className="w-full rounded-lg border border-explore-charcoal/20 px-4 py-2"
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="text">Text</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
        <h3 className="font-display text-lg font-bold">Mailing Address</h3>
        <Field label="Street" value={form.street} onChange={(v) => setForm({ ...form, street: v })} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <Field label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
          <Field label="ZIP" value={form.zip} onChange={(v) => setForm({ ...form, zip: v })} />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
        <h3 className="font-display text-lg font-bold">Emergency Contact</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={form.emergencyName} onChange={(v) => setForm({ ...form, emergencyName: v })} />
          <Field label="Phone" value={form.emergencyPhone} onChange={(v) => setForm({ ...form, emergencyPhone: v })} />
          <Field label="Relationship" value={form.emergencyRelationship} onChange={(v) => setForm({ ...form, emergencyRelationship: v })} className="sm:col-span-2" />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
        <h3 className="font-display text-lg font-bold">Notification Preferences</h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.events} onChange={(e) => setForm({ ...form, events: e.target.checked })} />
          Event notifications
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.courses} onChange={(e) => setForm({ ...form, courses: e.target.checked })} />
          Course notifications
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.announcements} onChange={(e) => setForm({ ...form, announcements: e.target.checked })} />
          Announcements
        </label>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
        <h3 className="font-display text-lg font-bold">Change Password</h3>
        <Field label="Current Password" type="password" value={form.currentPassword} onChange={(v) => setForm({ ...form, currentPassword: v })} />
        <Field label="New Password" type="password" value={form.newPassword} onChange={(v) => setForm({ ...form, newPassword: v })} />
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-explore-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-explore-teal/90 disabled:opacity-50"
      >
        {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Changes
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-explore-charcoal/70 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-explore-charcoal/20 px-4 py-2"
      />
    </div>
  );
}
