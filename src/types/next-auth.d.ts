import type { Role } from "@/lib/constants";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      emailVerified: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    role: Role;
    emailVerified: boolean;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    emailVerified: boolean;
  }
}
