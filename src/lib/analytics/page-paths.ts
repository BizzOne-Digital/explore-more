/** Canonical paths we highlight in admin traffic reports. */
export const ANALYTICS_PAGE_SECTIONS: { path: string; label: string }[] = [
  { path: "/", label: "Home" },
  { path: "/books", label: "Bookstore" },
  { path: "/membership", label: "Membership" },
  { path: "/courses", label: "Courses" },
  { path: "/programs", label: "Programs" },
  { path: "/events", label: "Events" },
  { path: "/donate", label: "Donate / Sponsor" },
  { path: "/contact", label: "Contact" },
  { path: "/about", label: "About" },
  { path: "/cart", label: "Cart" },
  { path: "/checkout", label: "Checkout" },
  { path: "/parent-portal", label: "Parent portal (entry)" },
  { path: "/student-portal", label: "Student portal (entry)" },
  { path: "/portal-login", label: "Portal login" },
];

const SECTION_PATHS = new Set(ANALYTICS_PAGE_SECTIONS.map((s) => s.path));

export function labelForAnalyticsPath(path: string): string {
  const exact = ANALYTICS_PAGE_SECTIONS.find((s) => s.path === path);
  if (exact) return exact.label;
  if (path === "/other") return "Other pages";
  return path;
}

/** Group detail URLs into section buckets for reporting. */
export function normalizeAnalyticsPath(raw: string): string | null {
  let path = raw.trim();
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.split("?")[0].split("#")[0];
  if (!path || path.includes("..")) return null;
  if (path.startsWith("/api") || path.startsWith("/_next")) return null;
  if (/\.[a-z0-9]{2,5}$/i.test(path)) return null;

  if (path === "/") return "/";

  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return "/";

  const root = `/${segments[0]}`;
  if (SECTION_PATHS.has(root)) return root;

  const portalRoots = ["/parent", "/student", "/admin", "/tutor", "/staff"];
  if (portalRoots.some((p) => path === p || path.startsWith(`${p}/`))) {
    return null;
  }

  return "/other";
}

export function shouldRecordPublicPageView(pathname: string): boolean {
  return normalizeAnalyticsPath(pathname) !== null;
}
