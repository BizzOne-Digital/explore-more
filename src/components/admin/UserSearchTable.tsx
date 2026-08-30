"use client";

import { useState, useMemo } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate } from "@/lib/admin/serialize";
import { Search, Filter } from "lucide-react";
import Link from "next/link";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  studentId?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

interface Props {
  users: User[];
}

export function UserSearchTable({ users }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const term = searchTerm.toLowerCase();
      
      const matchesSearch =
        !searchTerm ||
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.phone && user.phone.includes(term)) ||
        (user.studentId && user.studentId.toLowerCase().includes(term)) ||
        user._id.toLowerCase().includes(term);

      const matchesRole = !roleFilter || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: users.length,
      student: 0,
      parent: 0,
      staff: 0,
      instructor: 0,
      administrator: 0,
    };
    users.forEach((user) => {
      if (counts[user.role] !== undefined) {
        counts[user.role]++;
      }
    });
    return counts;
  }, [users]);

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by name, email, phone, Student ID, or User ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-white/40" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
          >
            <option value="">All Roles ({roleCounts.all})</option>
            <option value="student" className="bg-explore-charcoal">
              Students ({roleCounts.student})
            </option>
            <option value="parent" className="bg-explore-charcoal">
              Parents ({roleCounts.parent})
            </option>
            <option value="staff" className="bg-explore-charcoal">
              Staff ({roleCounts.staff})
            </option>
            <option value="instructor" className="bg-explore-charcoal">
              Instructors ({roleCounts.instructor})
            </option>
            <option value="administrator" className="bg-explore-charcoal">
              Administrators ({roleCounts.administrator})
            </option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-white/60">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-white/60">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-white/40">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id} className="transition hover:bg-white/5">
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={
                        user.role === "student"
                          ? `/admin/students/${user._id}`
                          : `/admin/users/${user._id}`
                      }
                      className="font-medium text-white hover:text-explore-teal"
                    >
                      {user.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/80">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-white/60">{user.phone || "—"}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-1 text-xs capitalize">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {user.studentId ? (
                      <Link
                        href={`/admin/students/${user._id}`}
                        className="font-mono text-xs text-explore-teal hover:underline"
                      >
                        {user.studentId}
                      </Link>
                    ) : (
                      <span className="font-mono text-xs text-white/40">{user._id.slice(-8)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {user.isActive ? (
                      <StatusBadge status="active" />
                    ) : (
                      <StatusBadge status="inactive" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60">{formatDate(user.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
