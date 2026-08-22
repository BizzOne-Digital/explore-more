import { COMPANY } from "@/lib/constants";

export function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL || COMPANY.email;
}
