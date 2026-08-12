import type { Role } from "@/lib/constants";
import type { SessionUser } from "@/types";

export function hasRole(user: SessionUser | null | undefined, roles: Role[]): boolean {
  return !!user && roles.includes(user.role);
}

export function isAdmin(user: SessionUser | null | undefined): boolean {
  return hasRole(user, ["administrator"]);
}

export function isInstructor(user: SessionUser | null | undefined): boolean {
  return hasRole(user, ["instructor", "administrator"]);
}

export function isStudent(user: SessionUser | null | undefined): boolean {
  return hasRole(user, ["student"]);
}

export function isParent(user: SessionUser | null | undefined): boolean {
  return hasRole(user, ["parent"]);
}

export function canAccessAdmin(user: SessionUser | null | undefined): boolean {
  return isAdmin(user);
}

export function canAccessStudentPortal(user: SessionUser | null | undefined): boolean {
  return hasRole(user, ["student", "administrator"]);
}

export function canAccessParentPortal(user: SessionUser | null | undefined): boolean {
  return hasRole(user, ["parent", "administrator"]);
}
