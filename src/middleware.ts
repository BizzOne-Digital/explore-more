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
  "/student/signup",
  "/student/login",
  "/parent/signup",
  "/parent/login",
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

function withPathname(request: NextRequest, pathname: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await auth();

  // Admin routes
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      if (session?.user?.role === "administrator") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return withPathname(request, pathname);
    }
    if (!session || session.user.role !== "administrator") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return withPathname(request, pathname);
  }

  // Student portal
  if (pathname.startsWith("/student")) {
    // Allow public access to signup and login pages
    if (pathname === "/student/signup" || pathname === "/student/login") {
      // If already logged in as student, redirect to student portal
      if (session?.user?.role === "student") {
        return NextResponse.redirect(new URL("/student", request.url));
      }
      return withPathname(request, pathname);
    }
    if (!session || !["student", "administrator"].includes(session.user.role)) {
      return NextResponse.redirect(new URL("/student/login?callbackUrl=" + encodeURIComponent(pathname), request.url));
    }
    return withPathname(request, pathname);
  }

  // Parent portal
  if (pathname.startsWith("/parent")) {
    // Allow public access to signup and login pages
    if (pathname === "/parent/signup" || pathname === "/parent/login") {
      // If already logged in as parent, redirect to parent portal
      if (session?.user?.role === "parent") {
        return NextResponse.redirect(new URL("/parent", request.url));
      }
      return withPathname(request, pathname);
    }
    if (!session || !["parent", "administrator"].includes(session.user.role)) {
      return NextResponse.redirect(new URL("/parent/login?callbackUrl=" + encodeURIComponent(pathname), request.url));
    }
    return withPathname(request, pathname);
  }

  // API admin protection
  if (pathname.startsWith("/api/admin")) {
    if (!session || session.user.role !== "administrator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return withPathname(request, pathname);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
