import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/edge";

const publicPaths = [
  "/",
  "/about",
  "/events",
  "/books",
  "/courses",
  "/membership",
  "/programs",
    "/dr-boom",
    "/dr-boom/book",
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
    "/student-portal",
    "/parent/signup",
    "/parent/login",
    "/parent-portal",
  "/portal-login",
  "/tutor-portal",
  "/tutor/login",
  "/staff/login",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/cart",
  "/checkout",
  "/order-success",
  "/membership",
  "/membership/success",
  "/privacy",
  "/terms",
  "/unsubscribe",
  "/resources",
  "/resources/transcript",
  "/resources/certificate",
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

  // Public portal entry pages (must not match /parent/* or /student/* auth gates below)
  if (
    pathname === "/student-portal" ||
    pathname === "/parent-portal" ||
    pathname === "/tutor-portal" ||
    pathname === "/portal-login"
  ) {
    return withPathname(request, pathname);
  }

  // Staff portal (instructor / administrator dashboard at /tutor)
  if (pathname.startsWith("/tutor")) {
    if (pathname === "/tutor/login") {
      if (session?.user?.role && ["instructor", "administrator"].includes(session.user.role)) {
        return NextResponse.redirect(new URL("/tutor", request.url));
      }
      return withPathname(request, pathname);
    }
    if (!session || !["instructor", "administrator"].includes(session.user.role)) {
      return NextResponse.redirect(
        new URL("/tutor/login?callbackUrl=" + encodeURIComponent(pathname), request.url)
      );
    }
    return withPathname(request, pathname);
  }

  // Staff portal
  if (pathname.startsWith("/student")) {
    if (pathname === "/student/signup" || pathname === "/student/login") {
      if (session?.user?.role === "student") {
        return NextResponse.redirect(new URL("/student", request.url));
      }
      return withPathname(request, pathname);
    }
    if (!session || !["student", "administrator"].includes(session.user.role)) {
      const loginUrl = new URL("/student/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return withPathname(request, pathname);
  }

  // Staff portal
  if (pathname.startsWith("/staff")) {
    if (pathname === "/staff/login") {
      if (
        session?.user?.role &&
        ["staff", "instructor", "administrator"].includes(session.user.role)
      ) {
        if (session.user.role === "instructor") {
          return NextResponse.redirect(new URL("/tutor", request.url));
        }
        return NextResponse.redirect(new URL("/staff", request.url));
      }
      return withPathname(request, pathname);
    }
    if (
      !session ||
      !["staff", "instructor", "administrator"].includes(session.user.role)
    ) {
      return NextResponse.redirect(
        new URL("/staff/login?callbackUrl=" + encodeURIComponent(pathname), request.url)
      );
    }
    return withPathname(request, pathname);
  }

  // Parent portal
  if (pathname.startsWith("/parent")) {
    if (pathname === "/parent/signup" || pathname === "/parent/login") {
      if (session?.user?.role === "parent") {
        return NextResponse.redirect(new URL("/parent-portal", request.url));
      }
      return withPathname(request, pathname);
    }
    if (!session || !["parent", "administrator"].includes(session.user.role)) {
      return NextResponse.redirect(new URL("/parent-portal", request.url));
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
    "/((?!_next/static|_next/image|favicon.ico|uploads/|api/uploads/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf)$).*)",
  ],
};
