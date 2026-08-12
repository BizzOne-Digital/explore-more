import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/edge";

const publicPaths = [
  "/",
  "/about",
  "/events",
  "/books",
  "/courses",
  "/programs",
  "/sponsor-a-kid",
  "/donate",
  "/gallery",
  "/testimonials",
  "/faqs",
  "/contact",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/cart",
  "/checkout",
  "/order-success",
  "/privacy",
  "/terms",
  "/unsubscribe",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await auth();

  // Admin routes
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      if (session?.user?.role === "administrator") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }
    if (!session || session.user.role !== "administrator") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // Student portal
  if (pathname.startsWith("/student")) {
    if (!session || !["student", "administrator"].includes(session.user.role)) {
      return NextResponse.redirect(new URL("/login?callbackUrl=" + encodeURIComponent(pathname), request.url));
    }
    return NextResponse.next();
  }

  // Parent portal
  if (pathname.startsWith("/parent")) {
    if (!session || !["parent", "administrator"].includes(session.user.role)) {
      return NextResponse.redirect(new URL("/login?callbackUrl=" + encodeURIComponent(pathname), request.url));
    }
    return NextResponse.next();
  }

  // API admin protection
  if (pathname.startsWith("/api/admin")) {
    if (!session || session.user.role !== "administrator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/student/:path*", "/parent/:path*", "/api/admin/:path*"],
};
