import type { Role } from "@/lib/constants";

export type PublishStatus = "draft" | "published" | "archived" | "cancelled" | "completed";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  emailVerified: boolean;
  image?: string;
}

export interface CartItem {
  bookId: string;
  slug: string;
  title: string;
  coverImage?: string;
  priceCents: number;
  quantity: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}
