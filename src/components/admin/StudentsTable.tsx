"use client";

import { useState, useMemo } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate } from "@/lib/admin/serialize";
import { Search } from "lucide-react";
import Link from "next/link";

interface Student {
  _id: string;
  name: string;
  email: string;
  studentId?: string;
  phone?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

interface GuardianLink {
  studentId: string;
  guardianId: { name: string; email: string };
}

interface Props {
  students: Student[];
  guardianLinks: GuardianLink[];
  initialSearch?: string;
}

export function StudentsTable({ students, guardianLinks, initialSearch }: Props) {
  const [searchTerm, setSearchTerm] = useState(initialSearch || "");

  // Create a map of student ID to guardian info
  const guardianMap = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>();
    guardianLinks.forEach((link) => {
      const studentIdStr = String(link.studentId);
      if (link.guardianId) {
        map.set(studentIdStr, link.guardianId);
      }
    });
    return map;
  }, [guardianLinks]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;

    const term = searchTerm.toLowerCase();
    return students.filter((student) => {
      const studentIdStr = String(student._id);
      const guardian = guardianMap.get(studentIdStr);
      
      return (
        student.name.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term) ||
        (student.studentId && student.studentId.toLowerCase().includes(term)) ||
        (student.phone && student.phone.includes(term)) ||
        (guardian && (
          guardian.name.toLowerCase().includes(term) ||
          guardian.email.toLowerCase().includes(term)
        ))
      );
    });
  }, [students, searchTerm, guardianMap]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Search by student name, Student ID, parent/guardian, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
        />
      </div>

      {/* Results Count */}
      <div className="text-sm text-white/60">
        Showing {filteredStudents.length} of {students.length} students
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Student ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Parent/Guardian</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-white/40">
                  No students found
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
                const guardian = guardianMap.get(String(student._id));
                return (
                  <tr key={student._id} className="transition hover:bg-white/5">
                    <td className="px-4 py-3 text-sm">
                      <Link 
                        href={`/admin/students/${student._id}`} 
                        className="font-mono text-explore-teal hover:underline"
                      >
                        {student.studentId || "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link 
                        href={`/admin/students/${student._id}`} 
                        className="font-medium text-white hover:text-explore-teal"
                      >
                        {student.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/80">{student.email}</td>
                    <td className="px-4 py-3 text-sm text-white/60">{student.phone || "—"}</td>
                    <td className="px-4 py-3 text-sm text-white/60">
                      {guardian ? (
                        <div>
                          <div className="font-medium text-white/80">{guardian.name}</div>
                          <div className="text-xs text-white/40">{guardian.email}</div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {student.isActive ? (
                        <StatusBadge status="active" />
                      ) : (
                        <StatusBadge status="inactive" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/60">{formatDate(student.createdAt)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
