"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, Building2, Save, Trash2, Plus, FileText, Upload, Download } from "lucide-react";
import { DragDropZone } from "@/components/admin/DragDropZone";
import { formatCents } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface SponsorData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  status: string;
  type: string;
  source: string;
  tags: string[];
  adminNotes?: string;
  nextFollowUpAt?: string;
  totalDonatedCents: number;
  donationCount: number;
  firstDonationAt?: string;
  lastDonationAt?: string;
  contractNotes?: string;
  contract?: {
    path: string;
    fileName: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
    uploadedByName?: string;
  };
}

interface DonationRow {
  _id: string;
  amountCents: number;
  paymentStatus: string;
  createdAt: string;
  message?: string;
  campaignId?: { title?: string; slug?: string } | null;
  programId?: { title?: string; slug?: string } | null;
}

interface ContributionRow {
  _id: string;
  amountCents: number;
  paymentMethod: string;
  paymentStatus: string;
  programTitle?: string;
  notes?: string;
  recordedByName: string;
  contributionDate: string;
  createdAt: string;
}

interface ProgramOption {
  _id: string;
  title: string;
}

interface NoteRow {
  _id: string;
  type: string;
  subject: string;
  content: string;
  staffName: string;
  followUpDate?: string;
  followUpCompleted: boolean;
  createdAt: string;
}

export default function SponsorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [sponsor, setSponsor] = useState<SponsorData | null>(null);
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [contributions, setContributions] = useState<ContributionRow[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingContract, setUploadingContract] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [contributionForm, setContributionForm] = useState({
    amountDollars: "",
    paymentMethod: "card_phone",
    programId: "",
    notes: "",
    contributionDate: "",
  });
  const [noteForm, setNoteForm] = useState({
    type: "note",
    subject: "",
    content: "",
    followUpDate: "",
  });

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/sponsors/${id}`);
      const json = await res.json();
      if (res.ok) {
        setSponsor(json.data.sponsor);
        setDonations(json.data.donations ?? []);
        setContributions(json.data.contributions ?? []);
        setNotes(json.data.notes ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadPrograms() {
    const res = await fetch("/api/admin/programs");
    const json = await res.json();
    if (res.ok && Array.isArray(json.data)) {
      setPrograms(
        json.data.map((p: { _id: string; title: string }) => ({
          _id: p._id,
          title: p.title,
        }))
      );
    }
  }

  useEffect(() => {
    load();
    loadPrograms();
  }, [id]);

  async function saveSponsor() {
    if (!sponsor) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/sponsors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sponsor),
      });
      if (res.ok) {
        const json = await res.json();
        setSponsor(json.data);
      } else {
        alert("Failed to save sponsor");
      }
    } finally {
      setSaving(false);
    }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteForm.content.trim()) return;

    const res = await fetch(`/api/admin/sponsors/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noteForm),
    });

    if (res.ok) {
      setNoteForm({ type: "note", subject: "", content: "", followUpDate: "" });
      load();
    } else {
      alert("Failed to add note");
    }
  }

  async function deleteSponsor() {
    if (!confirm("Delete this sponsor record? Notes will also be removed.")) return;
    const res = await fetch(`/api/admin/sponsors/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/sponsors");
    else alert("Failed to delete sponsor");
  }

  async function uploadContract(file: File) {
    setUploadingContract(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/admin/sponsors/${id}/contract`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const json = await res.json();
        alert(json.error || "Contract upload failed");
        return;
      }
      await load();
    } finally {
      setUploadingContract(false);
    }
  }

  async function removeContract() {
    if (!confirm("Remove the contract file from this sponsor?")) return;
    const res = await fetch(`/api/admin/sponsors/${id}/contract`, { method: "DELETE" });
    if (res.ok) await load();
    else alert("Failed to remove contract");
  }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    const dollars = parseFloat(contributionForm.amountDollars);
    if (!Number.isFinite(dollars) || dollars < 1) {
      alert("Enter an amount of at least $1.00");
      return;
    }

    setRecordingPayment(true);
    try {
      const res = await fetch(`/api/admin/sponsors/${id}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents: Math.round(dollars * 100),
          paymentMethod: contributionForm.paymentMethod,
          programId: contributionForm.programId || undefined,
          notes: contributionForm.notes || undefined,
          contributionDate: contributionForm.contributionDate || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed to record payment");
        return;
      }
      if (json.data?.sponsor) setSponsor(json.data.sponsor);
      setContributionForm({
        amountDollars: "",
        paymentMethod: "card_phone",
        programId: "",
        notes: "",
        contributionDate: "",
      });
      await load();
    } finally {
      setRecordingPayment(false);
    }
  }

  const givingHistory = [
    ...donations.map((d) => ({
      id: `donation-${d._id}`,
      title:
        d.programId?.title
          ? `Program: ${d.programId.title}`
          : d.campaignId?.title ?? "Online donation",
      amountCents: d.amountCents,
      date: d.createdAt,
      kind: "online" as const,
    })),
    ...contributions.map((c) => ({
      id: `contribution-${c._id}`,
      title: c.programTitle ? `Program: ${c.programTitle}` : "Manual payment",
      subtitle: `${c.paymentMethod.replace("_", " ")} · ${c.recordedByName}`,
      amountCents: c.amountCents,
      date: c.contributionDate || c.createdAt,
      kind: "manual" as const,
      notes: c.notes,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loading) {
    return <div className="flex h-96 items-center justify-center text-white/60">Loading sponsor...</div>;
  }

  if (!sponsor) {
    return <div className="text-white/60">Sponsor not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/sponsors" className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{sponsor.name}</h1>
            <p className="text-sm text-white/60">{sponsor.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={saveSponsor}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-explore-teal px-4 py-2 text-sm font-medium text-white hover:bg-explore-teal/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={deleteSponsor}
            className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">Sponsor Profile</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input
                  value={sponsor.name}
                  onChange={(e) => setSponsor({ ...sponsor, name: e.target.value })}
                  className="input-admin"
                />
              </Field>
              <Field label="Email">
                <input
                  value={sponsor.email}
                  onChange={(e) => setSponsor({ ...sponsor, email: e.target.value })}
                  className="input-admin"
                />
              </Field>
              <Field label="Phone">
                <input
                  value={sponsor.phone ?? ""}
                  onChange={(e) => setSponsor({ ...sponsor, phone: e.target.value })}
                  className="input-admin"
                />
              </Field>
              <Field label="Organization">
                <input
                  value={sponsor.organization ?? ""}
                  onChange={(e) => setSponsor({ ...sponsor, organization: e.target.value })}
                  className="input-admin"
                />
              </Field>
              <Field label="Status">
                <select
                  value={sponsor.status}
                  onChange={(e) => setSponsor({ ...sponsor, status: e.target.value })}
                  className="input-admin"
                >
                  {["lead", "prospect", "active", "major", "lapsed", "inactive"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Type">
                <select
                  value={sponsor.type}
                  onChange={(e) => setSponsor({ ...sponsor, type: e.target.value })}
                  className="input-admin"
                >
                  {["individual", "business", "foundation", "church", "other"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Next follow-up">
                <input
                  type="date"
                  value={sponsor.nextFollowUpAt ? sponsor.nextFollowUpAt.split("T")[0] : ""}
                  onChange={(e) =>
                    setSponsor({
                      ...sponsor,
                      nextFollowUpAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                    })
                  }
                  className="input-admin"
                />
              </Field>
              <Field label="Source">
                <select
                  value={sponsor.source}
                  onChange={(e) => setSponsor({ ...sponsor, source: e.target.value })}
                  className="input-admin"
                >
                  {["website", "referral", "event", "manual", "other"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Internal notes">
              <textarea
                rows={4}
                value={sponsor.adminNotes ?? ""}
                onChange={(e) => setSponsor({ ...sponsor, adminNotes: e.target.value })}
                className="input-admin mt-4 w-full"
                placeholder="Private notes about this sponsor relationship..."
              />
            </Field>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">Contract</h2>
            {sponsor.contract ? (
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-explore-teal" />
                    <div>
                      <p className="text-sm font-medium text-white">{sponsor.contract.fileName}</p>
                      <p className="mt-1 text-xs text-white/50">
                        {(sponsor.contract.size / 1024).toFixed(1)} KB · uploaded{" "}
                        {formatDistanceToNow(new Date(sponsor.contract.uploadedAt), { addSuffix: true })}
                        {sponsor.contract.uploadedByName ? ` by ${sponsor.contract.uploadedByName}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/api/files/private/${sponsor.contract.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                    <button
                      onClick={removeContract}
                      className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mb-3 text-sm text-white/50">No contract uploaded yet.</p>
            )}
            <DragDropZone
              disabled={uploadingContract}
              accept=".pdf,.doc,.docx,application/pdf,application/msword"
              onFiles={(files) => {
                if (files[0]) uploadContract(files[0]);
              }}
              className="rounded-lg border border-dashed border-white/20 bg-black/20 p-6 text-center"
            >
              {({ dragOver, openFilePicker }) => (
                <div
                  className={dragOver ? "text-explore-teal" : "text-white/60"}
                  onClick={openFilePicker}
                >
                  <Upload className="mx-auto h-8 w-8 mb-2 opacity-60" />
                  <p className="text-sm">
                    {uploadingContract
                      ? "Uploading..."
                      : "Drag & drop contract (PDF or Word) or click to browse"}
                  </p>
                </div>
              )}
            </DragDropZone>
            <Field label="Contract notes" className="mt-4">
              <textarea
                rows={2}
                value={sponsor.contractNotes ?? ""}
                onChange={(e) => setSponsor({ ...sponsor, contractNotes: e.target.value })}
                className="input-admin w-full"
                placeholder="Contract terms, renewal date, special arrangements..."
              />
            </Field>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">Record Payment</h2>
            <p className="mb-4 text-sm text-white/50">
              Log a check, cash, or phone payment and attach it to this sponsor&apos;s account.
            </p>
            <form onSubmit={recordPayment} className="grid gap-3 sm:grid-cols-2">
              <Field label="Amount ($)">
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={contributionForm.amountDollars}
                  onChange={(e) =>
                    setContributionForm({ ...contributionForm, amountDollars: e.target.value })
                  }
                  className="input-admin"
                  placeholder="100.00"
                />
              </Field>
              <Field label="Payment method">
                <select
                  value={contributionForm.paymentMethod}
                  onChange={(e) =>
                    setContributionForm({ ...contributionForm, paymentMethod: e.target.value })
                  }
                  className="input-admin"
                >
                  <option value="card_phone">Card (phone)</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                  <option value="ach">ACH</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Program (optional)">
                <select
                  value={contributionForm.programId}
                  onChange={(e) =>
                    setContributionForm({ ...contributionForm, programId: e.target.value })
                  }
                  className="input-admin"
                >
                  <option value="">General sponsorship</option>
                  {programs.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Payment date">
                <input
                  type="date"
                  value={contributionForm.contributionDate}
                  onChange={(e) =>
                    setContributionForm({ ...contributionForm, contributionDate: e.target.value })
                  }
                  className="input-admin"
                />
              </Field>
              <Field label="Notes" className="sm:col-span-2">
                <textarea
                  rows={2}
                  value={contributionForm.notes}
                  onChange={(e) =>
                    setContributionForm({ ...contributionForm, notes: e.target.value })
                  }
                  className="input-admin w-full"
                  placeholder="Check #, reference, etc."
                />
              </Field>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={recordingPayment}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-explore-lime px-4 py-2 text-sm font-semibold text-explore-black disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {recordingPayment ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">Giving History</h2>
            {givingHistory.length === 0 ? (
              <p className="text-sm text-white/50">No gifts recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {givingHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="text-xs text-white/50">
                        {item.kind === "manual" && "subtitle" in item && item.subtitle
                          ? `${item.subtitle} · `
                          : ""}
                        {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                      </p>
                      {"notes" in item && item.notes && (
                        <p className="mt-1 text-xs text-white/40">{item.notes}</p>
                      )}
                    </div>
                    <p className="font-semibold text-explore-lime">{formatCents(item.amountCents)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-3 text-lg font-semibold text-white">Giving Summary</h2>
            <p className="text-3xl font-bold text-white">{formatCents(sponsor.totalDonatedCents)}</p>
            <p className="mt-1 text-sm text-white/60">{sponsor.donationCount} gift(s)</p>
            {sponsor.firstDonationAt && (
              <p className="mt-3 text-xs text-white/50">
                First gift: {new Date(sponsor.firstDonationAt).toLocaleDateString()}
              </p>
            )}
            <div className="mt-4 space-y-2 text-sm text-white/70">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${sponsor.email}`} className="hover:text-explore-teal">
                  {sponsor.email}
                </a>
              </p>
              {sponsor.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {sponsor.phone}
                </p>
              )}
              {sponsor.organization && (
                <p className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {sponsor.organization}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-lg font-semibold text-white">Activity & Notes</h2>
            <form onSubmit={addNote} className="mb-4 space-y-3">
              <select
                value={noteForm.type}
                onChange={(e) => setNoteForm({ ...noteForm, type: e.target.value })}
                className="input-admin w-full"
              >
                <option value="note">Note</option>
                <option value="call">Phone call</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
                <option value="follow_up">Follow-up</option>
              </select>
              <input
                value={noteForm.subject}
                onChange={(e) => setNoteForm({ ...noteForm, subject: e.target.value })}
                placeholder="Subject (optional)"
                className="input-admin w-full"
              />
              <textarea
                rows={3}
                value={noteForm.content}
                onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                placeholder="What happened? Next steps?"
                className="input-admin w-full"
                required
              />
              <input
                type="date"
                value={noteForm.followUpDate}
                onChange={(e) => setNoteForm({ ...noteForm, followUpDate: e.target.value })}
                className="input-admin w-full"
              />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-explore-lime px-4 py-2 text-sm font-semibold text-explore-black"
              >
                <Plus className="h-4 w-4" />
                Add Note
              </button>
            </form>
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-sm text-white/50">No activity logged yet.</p>
              ) : (
                notes.map((note) => (
                  <div key={note._id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{note.subject}</p>
                      <span className="text-xs capitalize text-white/40">{note.type}</span>
                    </div>
                    <p className="mt-1 text-sm text-white/70">{note.content}</p>
                    <p className="mt-2 text-xs text-white/40">
                      {note.staffName} · {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <style jsx global>{`
        .input-admin {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: white;
        }
        .input-admin:focus {
          outline: none;
          border-color: #0c8991;
          box-shadow: 0 0 0 1px #0c8991;
        }
        .input-admin option {
          color: #101315;
          background-color: #ffffff;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className ?? "block"}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/50">
        {label}
      </span>
      {children}
    </label>
  );
}
