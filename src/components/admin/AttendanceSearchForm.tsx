"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function AttendanceSearchForm() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = studentId.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setError("Enter a valid 6-digit Student ID.");
      return;
    }
    setError("");
    router.push(`/admin/attendance/student/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-white/20 bg-white/10 p-4"
    >
      <label htmlFor="attendance-student-search" className="block text-sm font-medium text-white/70 mb-2">
        Search by Student ID
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="attendance-student-search"
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={studentId}
          onChange={(e) => {
            setStudentId(e.target.value.replace(/\D/g, "").slice(0, 6));
            setError("");
          }}
          placeholder="6-digit Student ID"
          className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 font-mono text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-explore-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-explore-teal/90"
        >
          <Search className="h-4 w-4" />
          View history
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </form>
  );
}
