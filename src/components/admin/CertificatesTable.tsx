"use client";

import { useState, useMemo } from "react";
import { formatDate } from "@/lib/admin/serialize";
import { Search, Download, Bell } from "lucide-react";
import Link from "next/link";
import { getCertificateFileUrl } from "@/lib/certificates/display";

interface Certificate {
  _id: string;
  title: string;
  studentId: { _id: string; name: string; studentId?: string } | null;
  issueDate: string;
  filePath: string;
  fileType: string;
  publishedToStudent?: boolean;
  notificationSent: boolean;
  createdAt: string;
}

interface Student {
  _id: string;
  name: string;
  studentId?: string;
}

interface Props {
  certificates: Certificate[];
  students: Student[];
}

export function CertificatesTable({ certificates, students }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [studentFilter, setStudentFilter] = useState("");

  const filteredCertificates = useMemo(() => {
    return certificates.filter((cert) => {
      const matchesSearch =
        !searchTerm ||
        cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cert.studentId?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cert.studentId?.studentId || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStudent = !studentFilter || cert.studentId?._id === studentFilter;

      return matchesSearch && matchesStudent;
    });
  }, [certificates, searchTerm, studentFilter]);

  async function handleResendNotification(certificateId: string) {
    if (!confirm("Resend certificate notification to parent?")) return;

    try {
      const res = await fetch(`/api/admin/certificates/${certificateId}/notify`, {
        method: "POST",
      });
      const json = await res.json();

      if (json.success) {
        alert("Notification sent successfully!");
      } else {
        alert(json.error || "Failed to send notification");
      }
    } catch (error) {
      alert("Failed to send notification");
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by title or student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
          />
        </div>

        <select
          value={studentFilter}
          onChange={(e) => setStudentFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
        >
          <option value="">All Students</option>
          {students.map((student) => (
            <option key={student._id} value={student._id} className="bg-explore-charcoal">
              {student.name} {student.studentId ? `(${student.studentId})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-white/60">
        Showing {filteredCertificates.length} of {certificates.length} certificates
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Certificate</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Student</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Issue Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Published</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Notification</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredCertificates.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-white/40">
                  No certificates found
                </td>
              </tr>
            ) : (
              filteredCertificates.map((cert) => (
                <tr key={cert._id} className="transition hover:bg-white/5">
                  <td className="px-4 py-3 text-sm">
                    <Link href={`/admin/certificates/${cert._id}`} className="font-medium text-white hover:text-explore-teal">
                      {cert.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/80">
                    {cert.studentId ? (
                      <div>
                        <div className="font-medium">{cert.studentId.name}</div>
                        {cert.studentId.studentId && (
                          <div className="text-xs text-white/40">{cert.studentId.studentId}</div>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60">{formatDate(cert.issueDate)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs uppercase">
                      {cert.fileType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {cert.publishedToStudent ? (
                      <span className="text-green-400">✓ Published</span>
                    ) : (
                      <span className="text-yellow-400">Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {cert.notificationSent ? (
                      <span className="text-green-400">✓ Sent</span>
                    ) : (
                      <span className="text-yellow-400">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <a
                        href={getCertificateFileUrl(cert.filePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-explore-teal hover:underline"
                        title="View Certificate"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleResendNotification(cert._id)}
                        className="text-explore-teal hover:underline"
                        title="Resend Notification"
                      >
                        <Bell className="h-4 w-4" />
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
