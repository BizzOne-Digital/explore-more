"use client";

import { useState, useMemo } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate } from "@/lib/admin/serialize";
import { Download, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Registration {
  _id: string;
  registrationId: string;
  studentName: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  paymentStatus: string;
  status: string;
  eventId: { _id: string; title: string; startDate: string } | null;
  createdAt: string;
}

interface Props {
  registrations: Registration[];
  events: { _id: string; title: string }[];
  initialEventFilter?: string;
  initialSearch?: string;
}

export function EventRegistrationsTable({ registrations, events, initialEventFilter, initialSearch }: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(initialSearch || "");
  const [eventFilter, setEventFilter] = useState(initialEventFilter || "");
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const matchesSearch =
        !searchTerm ||
        reg.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.guardianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.guardianEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.guardianPhone.includes(searchTerm) ||
        reg.registrationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reg.eventId?.title || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEvent = !eventFilter || reg.eventId?._id === eventFilter;

      return matchesSearch && matchesEvent;
    });
  }, [registrations, searchTerm, eventFilter]);

  async function handleDeleteAll() {
    if (!eventFilter) {
      alert("Please select an event first before deleting all registrations.");
      return;
    }

    const event = events.find((e) => e._id === eventFilter);
    const count = filteredRegistrations.length;

    if (!confirm(`Are you sure you want to delete ALL ${count} registrations for "${event?.title}"?\n\nThis action cannot be undone!`)) {
      return;
    }

    if (!confirm(`This will PERMANENTLY delete ${count} registrations. Type the number ${count} to confirm.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/event-registrations/bulk-delete?eventId=${eventFilter}`, {
        method: "DELETE",
      });
      const json = await res.json();
      
      if (json.success) {
        router.refresh();
        alert(`Successfully deleted ${json.data.deletedCount} registrations.`);
      } else {
        alert(json.error || "Failed to delete registrations");
      }
    } catch (error) {
      alert("Failed to delete registrations");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleExportCSV() {
    const csv = convertToCSV(filteredRegistrations);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `event-registrations-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function handleResendConfirmation(registrationId: string) {
    if (!confirm("Resend confirmation email to this registrant?")) return;

    try {
      const res = await fetch(`/api/admin/event-registrations/${registrationId}/resend-confirmation`, {
        method: "POST",
      });
      const json = await res.json();
      
      if (json.success) {
        alert("Confirmation email sent successfully!");
      } else {
        alert(json.error || "Failed to send email");
      }
    } catch (error) {
      alert("Failed to send email");
    }
  }

  function convertToCSV(data: Registration[]): string {
    const headers = [
      "Registration ID",
      "Event",
      "Student Name",
      "Guardian Name",
      "Guardian Email",
      "Guardian Phone",
      "Payment Status",
      "Status",
      "Registration Date",
    ];

    const rows = data.map((reg) => [
      reg.registrationId,
      reg.eventId?.title || "N/A",
      reg.studentName,
      reg.guardianName,
      reg.guardianEmail,
      reg.guardianPhone,
      reg.paymentStatus,
      reg.status,
      new Date(reg.createdAt).toLocaleString(),
    ]);

    return [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by name, email, phone, ID, or event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
          />
        </div>

        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
        >
          <option value="">All Events</option>
          {events.map((event) => (
            <option key={event._id} value={event._id} className="bg-explore-charcoal">
              {event.title}
            </option>
          ))}
        </select>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:text-white"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>

        {eventFilter && (
          <button
            onClick={handleDeleteAll}
            disabled={isDeleting}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete All"}
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-white/60">
        Showing {filteredRegistrations.length} of {registrations.length} registrations
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Reg ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Event</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Student</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Guardian</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Payment</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredRegistrations.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-white/40">
                  No registrations found
                </td>
              </tr>
            ) : (
              filteredRegistrations.map((reg) => (
                <tr key={reg._id} className="transition hover:bg-white/5">
                  <td className="px-4 py-3 text-sm">
                    <Link href={`/admin/event-registrations/${reg._id}`} className="font-mono text-explore-teal hover:underline">
                      {reg.registrationId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/80">{reg.eventId?.title || "N/A"}</td>
                  <td className="px-4 py-3 text-sm">
                    <Link href={`/admin/event-registrations/${reg._id}`} className="font-medium text-white hover:text-explore-teal">
                      {reg.studentName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/80">{reg.guardianName}</td>
                  <td className="px-4 py-3 text-sm text-white/60">
                    <div>{reg.guardianEmail}</div>
                    <div className="text-xs">{reg.guardianPhone}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge status={reg.paymentStatus} />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge status={reg.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60">{formatDate(reg.createdAt)}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleResendConfirmation(reg._id)}
                      className="text-explore-teal hover:underline"
                    >
                      Resend Email
                    </button>
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
