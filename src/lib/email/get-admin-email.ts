import { COMPANY } from "@/lib/constants";

/** Backend / admin notification inbox (orders, forms, registrations, etc.). */
export function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL || COMPANY.adminEmail;
}

/** Public contact email shown on the website and in customer emails. */
export function getPublicContactEmail(): string {
  return process.env.PUBLIC_CONTACT_EMAIL || COMPANY.email;
}
