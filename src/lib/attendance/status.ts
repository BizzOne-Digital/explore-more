export const ATTENDANCE_STATUSES = [
  "present",
  "late",
  "excused",
  "absent",
  "early_dismissal",
  "other",
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const PARENT_DAILY_STATUS_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "late", label: "Tardy" },
  { value: "excused", label: "Excused" },
  { value: "absent", label: "Absent" },
  { value: "other", label: "Other (type your own)" },
] as const;

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  late: "Tardy",
  excused: "Excused",
  absent: "Absent",
  early_dismissal: "Early Dismissal",
  other: "Other",
};

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-green-100 text-green-800 border-green-200",
  absent: "bg-red-100 text-red-800 border-red-200",
  late: "bg-yellow-100 text-yellow-800 border-yellow-200",
  excused: "bg-blue-100 text-blue-800 border-blue-200",
  early_dismissal: "bg-purple-100 text-purple-800 border-purple-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
};

export function formatAttendanceStatus(status: string, notes?: string | null): string {
  if (status === "other" && notes?.trim()) return notes.trim();
  return ATTENDANCE_STATUS_LABELS[status as AttendanceStatus] ?? status.replace(/_/g, " ");
}

export function dayBounds(dateInput: string | Date) {
  const date = typeof dateInput === "string" ? new Date(`${dateInput}T12:00:00`) : new Date(dateInput);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return { date, startOfDay, endOfDay };
}
