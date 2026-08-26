"use client";

import Link from "next/link";
import { Key, Loader, Save } from "lucide-react";
import { UserAccountDocuments } from "@/components/admin/UserAccountDocuments";
import { formatCents } from "@/lib/utils";
import { formatPaymentMethod, formatSubscriptionStatus } from "@/lib/billing/format";

export type ParentProfile = {
  firstName?: string;
  lastName?: string;
  mailingAddress?: { street?: string; city?: string; state?: string; zip?: string };
  emergencyContact?: { name?: string; phone?: string; relationship?: string };
  preferredCommunication?: string;
};

export type FamilyData = {
  children: Array<{
    linkId: string;
    relationship: string;
    status: string;
    student: { id: string; name: string; email: string; studentId?: string; isActive?: boolean } | null;
  }>;
  enrollments: Array<{
    id: string;
    studentId: string;
    courseTitle: string;
    paymentStatus: string;
    status: string;
    progress: number;
    enrolledAt: string;
  }>;
  serviceRequests: Array<{
    id: string;
    programTitle: string;
    studentName: string;
    status: string;
    createdAt: string;
  }>;
  attendance: Array<{
    id: string;
    studentId: string;
    sessionDate: string;
    status: string;
    title: string;
    excuseNote?: string;
  }>;
  messages: Array<{
    id: string;
    subject: string;
    staffName: string;
    studentName?: string;
    lastMessageAt: string;
  }>;
  documents: Array<{
    id: string;
    studentId: string;
    assignmentName: string;
    subject: string;
    dateCompleted: string;
    fileCount: number;
  }>;
  portfolios: Array<{ id: string; studentId: string; schoolYear: string; status: string }>;
};

type OverviewProps = {
  user: {
    name: string;
    email: string;
    phone?: string;
    isActive: boolean;
    emailVerified: boolean;
    createdAt: string;
  };
  profile?: ParentProfile | null;
  profileForm: {
    name: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    emergencyName: string;
    emergencyPhone: string;
    emergencyRelationship: string;
    preferredCommunication: string;
    isActive: boolean;
  };
  setProfileForm: React.Dispatch<React.SetStateAction<OverviewProps["profileForm"]>>;
  billingPlanName?: string;
  billingStatus?: string;
  paymentMethod: { brand: string; last4: string } | null;
  saving: boolean;
  resetLoading: boolean;
  onSave: () => void;
  onPasswordReset: () => void;
};

export function OverviewProfileTab({
  user,
  profileForm,
  setProfileForm,
  billingPlanName,
  billingStatus,
  paymentMethod,
  saving,
  resetLoading,
  onSave,
  onPasswordReset,
}: OverviewProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/50">Subscription</p>
          <p className="mt-1 font-semibold text-white">{billingPlanName ?? "—"}</p>
          <p className="text-sm text-white/60">{billingStatus ? formatSubscriptionStatus(billingStatus) : "—"}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/50">Payment method</p>
          <p className="mt-1 text-sm text-white">{formatPaymentMethod(paymentMethod)}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/50">Member since</p>
          <p className="mt-1 text-sm text-white">{new Date(user.createdAt).toLocaleDateString()}</p>
          <p className="text-xs text-white/50">
            Email {user.emailVerified ? "verified" : "unverified"}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Contact & Profile</h3>
          <button
            type="button"
            onClick={onPasswordReset}
            disabled={resetLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
          >
            {resetLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
            Send password reset
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["name", "Full name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["firstName", "First name"],
              ["lastName", "Last name"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block text-xs text-white/60">{label}</label>
              <input
                value={profileForm[key]}
                onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
            </div>
          ))}
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-white/60">Mailing street</label>
            <input
              value={profileForm.street}
              onChange={(e) => setProfileForm({ ...profileForm, street: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
          </div>
          {(
            [
              ["city", "City"],
              ["state", "State"],
              ["zip", "ZIP"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block text-xs text-white/60">{label}</label>
              <input
                value={profileForm[key]}
                onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
            </div>
          ))}
          <div className="md:col-span-2 border-t border-white/10 pt-4">
            <p className="mb-3 text-sm font-medium text-white/80">Emergency contact</p>
            <div className="grid gap-4 md:grid-cols-3">
              <input
                placeholder="Name"
                value={profileForm.emergencyName}
                onChange={(e) => setProfileForm({ ...profileForm, emergencyName: e.target.value })}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
              <input
                placeholder="Phone"
                value={profileForm.emergencyPhone}
                onChange={(e) => setProfileForm({ ...profileForm, emergencyPhone: e.target.value })}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
              <input
                placeholder="Relationship"
                value={profileForm.emergencyRelationship}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, emergencyRelationship: e.target.value })
                }
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">Preferred communication</label>
            <select
              value={profileForm.preferredCommunication}
              onChange={(e) =>
                setProfileForm({ ...profileForm, preferredCommunication: e.target.value })
              }
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="text">Text</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={profileForm.isActive}
                onChange={(e) => setProfileForm({ ...profileForm, isActive: e.target.checked })}
              />
              Account active
            </label>
          </div>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-explore-teal px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>
    </div>
  );
}

export function CoursesResourcesTab({ family }: { family: FamilyData | null }) {
  if (!family) {
    return <p className="text-sm text-white/50">Loading family resources…</p>;
  }
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Course Enrollments</h3>
        {family.enrollments.length === 0 ? (
          <p className="text-sm text-white/50">No course enrollments for linked children.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-white/50">
                <tr>
                  <th className="pb-2 pr-4">Course</th>
                  <th className="pb-2 pr-4">Progress</th>
                  <th className="pb-2 pr-4">Payment</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {family.enrollments.map((e) => (
                  <tr key={e.id} className="border-t border-white/10">
                    <td className="py-2 pr-4 text-white">{e.courseTitle}</td>
                    <td className="py-2 pr-4 text-white/70">{e.progress}%</td>
                    <td className="py-2 pr-4 capitalize text-white/70">{e.paymentStatus}</td>
                    <td className="py-2 capitalize text-white/70">{e.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Program & Service Requests</h3>
        {family.serviceRequests.length === 0 ? (
          <p className="text-sm text-white/50">No program requests on file.</p>
        ) : (
          <ul className="space-y-2">
            {family.serviceRequests.map((r) => (
              <li key={r.id} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                <span className="font-medium text-white">{r.programTitle}</span>
                <span className="text-white/50"> — {r.studentName}</span>
                <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs capitalize text-white/70">
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h3 className="mb-2 text-lg font-semibold text-white">Homeschool Portfolios</h3>
        {family.portfolios.length === 0 ? (
          <p className="text-sm text-white/50">No portfolios yet.</p>
        ) : (
          <ul className="space-y-1 text-sm text-white/80">
            {family.portfolios.map((p) => (
              <li key={p.id}>
                School year {p.schoolYear} — <span className="capitalize">{p.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function AttendanceTab({ family }: { family: FamilyData | null }) {
  if (!family) return <p className="text-sm text-white/50">Loading attendance…</p>;
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
      <table className="min-w-full text-sm">
        <thead className="bg-white/5 text-left text-white/60">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Session</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Note</th>
          </tr>
        </thead>
        <tbody>
          {family.attendance.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-white/40">
                No attendance records.
              </td>
            </tr>
          ) : (
            family.attendance.map((a) => (
              <tr key={a.id} className="border-t border-white/10">
                <td className="px-4 py-3 text-white">
                  {new Date(a.sessionDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-white">{a.title}</td>
                <td className="px-4 py-3 capitalize text-white/70">{a.status}</td>
                <td className="px-4 py-3 text-white/60">{a.excuseNote || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function MessagesTab({ family, userId }: { family: FamilyData | null; userId: string }) {
  if (!family) return <p className="text-sm text-white/50">Loading messages…</p>;
  return (
    <div className="space-y-4">
      <Link
        href={`/admin/messages/new?parentId=${userId}`}
        className="inline-block text-sm text-explore-teal hover:underline"
      >
        Compose new message →
      </Link>
      {family.messages.length === 0 ? (
        <p className="text-sm text-white/50">No conversations yet.</p>
      ) : (
        <ul className="space-y-2">
          {family.messages.map((m) => (
            <li key={m.id}>
              <Link
                href={`/admin/messages/${m.id}`}
                className="block rounded-lg border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
              >
                <p className="font-medium text-white">{m.subject}</p>
                <p className="text-sm text-white/50">
                  With {m.staffName}
                  {m.studentName ? ` · re: ${m.studentName}` : ""} ·{" "}
                  {new Date(m.lastMessageAt).toLocaleString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DocumentsTab({ family, userId }: { family: FamilyData | null; userId: string }) {
  return (
    <div className="space-y-8">
      <UserAccountDocuments userId={userId} />

      <div>
        <h3 className="mb-3 text-lg font-semibold text-white">Portfolio Work Samples</h3>
        {!family ? (
          <p className="text-sm text-white/50">Loading portfolio documents…</p>
        ) : (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
      <table className="min-w-full text-sm">
        <thead className="bg-white/5 text-left text-white/60">
          <tr>
            <th className="px-4 py-3">Assignment</th>
            <th className="px-4 py-3">Subject</th>
            <th className="px-4 py-3">Completed</th>
            <th className="px-4 py-3">Files</th>
          </tr>
        </thead>
        <tbody>
          {family.documents.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-white/40">
                No portfolio documents on file.
              </td>
            </tr>
          ) : (
            family.documents.map((d) => (
              <tr key={d.id} className="border-t border-white/10">
                <td className="px-4 py-3 text-white">{d.assignmentName}</td>
                <td className="px-4 py-3 text-white/70">{d.subject}</td>
                <td className="px-4 py-3 text-white/70">
                  {new Date(d.dateCompleted).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-white/70">{d.fileCount}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
        </div>
        )}
      </div>
    </div>
  );
}

export function ChildrenTab({
  family,
  studentLinks,
}: {
  family: FamilyData | null;
  studentLinks: Array<{
    _id: string;
    relationship: string;
    status: string;
    studentId?: { name: string; email: string; studentId?: string; _id?: string };
  }>;
}) {
  const links = family?.children?.length ? family.children : studentLinks.map((l) => ({
    linkId: l._id,
    relationship: l.relationship,
    status: l.status,
    student: l.studentId
      ? {
          id: (l.studentId as { _id?: string })._id ?? "",
          name: l.studentId.name,
          email: l.studentId.email,
          studentId: l.studentId.studentId,
        }
      : null,
  }));

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6">
      {links.length === 0 ? (
        <p className="text-sm text-white/50">No linked students.</p>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <div
              key={link.linkId}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4"
            >
              <div>
                <p className="font-medium text-white">{link.student?.name ?? "Unknown"}</p>
                <p className="text-sm text-white/60">
                  {link.relationship}
                  {link.student?.studentId && (
                    <span className="ml-2 font-mono text-explore-teal">{link.student.studentId}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    link.status === "approved"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-yellow-500/10 text-yellow-400"
                  }`}
                >
                  {link.status}
                </span>
                {link.student?.id && (
                  <Link
                    href={`/admin/students/${link.student.id}`}
                    className="text-xs text-explore-teal hover:underline"
                  >
                    View student →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Link
        href="/admin/guardian-links"
        className="mt-4 inline-block text-sm text-explore-teal hover:underline"
      >
        Manage guardian links →
      </Link>
    </div>
  );
}
