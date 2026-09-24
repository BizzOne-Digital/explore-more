import type { Role } from "@/lib/constants";

/** Where Staff Portal sign-in should land based on account role. */
export function staffPortalHomePath(role: string | undefined): string {
  switch (role) {
    case "teacher":
      return "/teacher";
    case "instructor":
      return "/tutor";
    case "administrator":
      return "/admin";
    case "staff":
      return "/staff";
    default:
      return "/tutor/login";
  }
}

export function canAccessTutorPortal(role: string | undefined): boolean {
  return role === "instructor" || role === "administrator";
}

export function canAccessTeacherPortal(role: string | undefined): boolean {
  return role === "teacher" || role === "administrator";
}

export function isStaffPortalRole(role: string | undefined): role is Role {
  return (
    role === "staff" ||
    role === "instructor" ||
    role === "teacher" ||
    role === "administrator"
  );
}
