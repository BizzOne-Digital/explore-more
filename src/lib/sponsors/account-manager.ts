import connectDB from "@/lib/db";
import { STAFF_PORTAL_ROLES, type Role } from "@/lib/constants";
import { User } from "@/models";

export interface AccountManagerFields {
  accountManagerId?: string;
  accountManagerName?: string;
  accountManagerStaffId?: string;
}

export function isStaffAssignableRole(role: string): boolean {
  return (STAFF_PORTAL_ROLES as readonly string[]).includes(role);
}

export async function resolveAccountManagerFields(
  userId: string
): Promise<AccountManagerFields | null> {
  await connectDB();
  const user = await User.findById(userId).select("name staffId role isActive").lean();
  if (!user || !user.isActive || !isStaffAssignableRole(user.role)) {
    return null;
  }

  return {
    accountManagerId: String(user._id),
    accountManagerName: user.name,
    accountManagerStaffId: user.staffId ?? undefined,
  };
}

export async function resolveAccountManagerFromSession(
  sessionUser: { id: string; role: Role }
): Promise<AccountManagerFields | null> {
  if (!isStaffAssignableRole(sessionUser.role)) return null;
  return resolveAccountManagerFields(sessionUser.id);
}
