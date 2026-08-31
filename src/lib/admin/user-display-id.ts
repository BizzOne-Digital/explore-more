export interface AdminUserIdFields {
  _id: string;
  role: string;
  studentId?: string | null;
  tutorId?: string | null;
  guardianId?: string | null;
  staffId?: string | null;
}

export function getAdminUserProfileHref(user: Pick<AdminUserIdFields, "_id" | "role">): string {
  return user.role === "student" ? `/admin/students/${user._id}` : `/admin/users/${user._id}`;
}

/** Primary ID shown in admin lists — matches what staff use for linking (Student ID, Tutor ID, etc.). */
export function getAdminUserDisplayId(
  user: AdminUserIdFields
): { label: string; value: string } {
  if (user.studentId) {
    return { label: "Student ID", value: user.studentId };
  }

  if ((user.role === "instructor" || user.role === "administrator") && user.tutorId) {
    return { label: "Tutor ID", value: user.tutorId };
  }

  if (user.role === "parent" && user.guardianId) {
    return { label: "Guardian ID", value: user.guardianId };
  }

  if (user.role === "staff" && user.staffId) {
    return { label: "Staff ID", value: user.staffId };
  }

  return { label: "Internal reference", value: user._id.slice(-8) };
}
