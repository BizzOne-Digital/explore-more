import { PAGE_KEYS, type PageKey } from "@/lib/constants";

export interface NavLink {
  href: string;
  label: string;
  pageKey?: PageKey;
}

export function pageKeyToHref(key: PageKey | string): string {
  return key === "home" ? "/" : `/${key}`;
}

/** Map a public site path to its CMS page key (e.g. `/dr-boom/book` → `dr-boom`). */
export function hrefToPageKey(href: string): PageKey | null {
  const normalized = href === "" ? "/" : href.startsWith("/") ? href : `/${href}`;
  if (normalized === "/") return "home";
  const segment = normalized.slice(1).split("/")[0];
  if ((PAGE_KEYS as readonly string[]).includes(segment)) {
    return segment as PageKey;
  }
  return null;
}

/** Main header navigation (left-to-right). */
export const HEADER_NAV: NavLink[] = [
  { pageKey: "home", href: "/", label: "Home" },
  { pageKey: "about", href: "/about", label: "About" },
  { pageKey: "events", href: "/events", label: "Events" },
  { pageKey: "books", href: "/books", label: "Books" },
  { pageKey: "courses", href: "/courses", label: "Courses" },
  { pageKey: "membership", href: "/membership", label: "Membership" },
  { pageKey: "programs", href: "/programs", label: "Programs" },
  { pageKey: "dr-boom", href: "/dr-boom", label: "Dr. Boom" },
  { pageKey: "sponsor-a-kid", href: "/sponsor-a-kid", label: "Become a Sponsor" },
  { pageKey: "contact", href: "/contact", label: "Contact" },
];

/** Footer link groups keyed by column title. */
export const FOOTER_NAV: Record<string, NavLink[]> = {
  Explore: [
    { pageKey: "about", href: "/about", label: "About Us" },
    { pageKey: "programs", href: "/programs", label: "Programs" },
    { pageKey: "events", href: "/events", label: "Events" },
    { pageKey: "courses", href: "/courses", label: "Courses" },
    { pageKey: "gallery", href: "/gallery", label: "Gallery" },
  ],
  Resources: [
    { pageKey: "books", href: "/books", label: "Bookstore" },
    { pageKey: "membership", href: "/membership", label: "Membership" },
    { pageKey: "faqs", href: "/faqs", label: "FAQs" },
    { pageKey: "dr-boom", href: "/dr-boom", label: "Book Dr. Boom" },
    { pageKey: "testimonials", href: "/testimonials", label: "Testimonials" },
    { pageKey: "sponsor-a-kid", href: "/sponsor-a-kid", label: "Become a Sponsor" },
    { pageKey: "contact", href: "/contact", label: "Contact" },
  ],
  Account: [
    { href: "/login", label: "Login" },
    { href: "/register", label: "Register" },
    { href: "/student-portal", label: "Student Portal" },
    { href: "/parent-portal", label: "Parent Portal" },
    { pageKey: "privacy", href: "/privacy", label: "Privacy Policy" },
    { pageKey: "terms", href: "/terms", label: "Terms of Service" },
  ],
};

export interface SiteNavigation {
  headerLinks: NavLink[];
  footerLinks: Record<string, NavLink[]>;
  showEventsUtility: boolean;
  showBooksSearch: boolean;
  showProgramsCta: boolean;
}

export function filterNavigation(hiddenPageKeys: Set<string>): SiteNavigation {
  const isVisible = (link: NavLink) => !link.pageKey || !hiddenPageKeys.has(link.pageKey);

  const headerLinks = HEADER_NAV.filter(isVisible);

  const footerLinks = Object.fromEntries(
    Object.entries(FOOTER_NAV).map(([title, links]) => [title, links.filter(isVisible)])
  );

  return {
    headerLinks,
    footerLinks,
    showEventsUtility: !hiddenPageKeys.has("events"),
    showBooksSearch: !hiddenPageKeys.has("books"),
    showProgramsCta: !hiddenPageKeys.has("programs"),
  };
}
