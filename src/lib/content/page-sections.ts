import type { PageKey } from "@/lib/constants";

export interface PageSectionDefinition {
  internalName: string;
  label: string;
  order: number;
}

export const PAGE_SECTION_CATALOG: Record<PageKey, PageSectionDefinition[]> = {
  home: [
    { internalName: "hero", label: "Hero", order: 0 },
    { internalName: "pathways", label: "Program Pathways", order: 1 },
    { internalName: "mission", label: "Mission", order: 2 },
    { internalName: "core-programs", label: "Six Core Programs", order: 3 },
    { internalName: "events", label: "Upcoming Events", order: 4 },
    { internalName: "courses", label: "Featured Courses", order: 5 },
    { internalName: "books", label: "Bookstore", order: 6 },
    { internalName: "adventure-feed", label: "Adventure Feed", order: 7 },
    { internalName: "differentiators", label: "What Makes Us Different", order: 8 },
    { internalName: "testimonials", label: "Testimonials", order: 9 },
    { internalName: "sponsor-cta", label: "Become a Sponsor CTA", order: 10 },
    { internalName: "faqs", label: "FAQs Preview", order: 11 },
    { internalName: "newsletter", label: "Newsletter", order: 12 },
    { internalName: "final-cta", label: "Final CTA", order: 13 },
  ],
  about: [
    { internalName: "hero", label: "Hero", order: 0 },
    { internalName: "story", label: "Our Story", order: 1 },
    { internalName: "tagline", label: "Tagline Banner", order: 2 },
    { internalName: "values", label: "Our Values", order: 3 },
    { internalName: "pillars", label: "Explore · Educate · Empower", order: 4 },
    { internalName: "cta", label: "Join the Adventure CTA", order: 5 },
  ],
  events: [
    { internalName: "hero", label: "Hero", order: 0 },
    { internalName: "listings", label: "Event Listings", order: 1 },
  ],
  books: [
    { internalName: "hero", label: "Hero", order: 0 },
    { internalName: "catalog", label: "Book Catalog", order: 1 },
  ],
  courses: [
    { internalName: "hero", label: "Hero", order: 0 },
    { internalName: "listings", label: "Course Listings", order: 1 },
  ],
  membership: [
    { internalName: "hero", label: "Hero", order: 0 },
    { internalName: "plans", label: "Membership Plans", order: 1 },
  ],
  programs: [
    { internalName: "hero", label: "Hero", order: 0 },
    { internalName: "listings", label: "Program Listings", order: 1 },
  ],
  "dr-boom": [
    { internalName: "hero", label: "Hero", order: 0 },
    { internalName: "packages", label: "Booking Packages", order: 1 },
    { internalName: "booking-form", label: "Booking Form", order: 2 },
    { internalName: "faq", label: "FAQ", order: 3 },
  ],
  "sponsor-a-kid": [
    { internalName: "hero", label: "Hero", order: 0 },
    { internalName: "why-sponsor", label: "Why Sponsor", order: 1 },
    { internalName: "campaigns", label: "Active Campaigns", order: 2 },
  ],
  gallery: [
    { internalName: "hero", label: "Hero", order: 0 },
    { internalName: "grid", label: "Photo Grid", order: 1 },
  ],
  testimonials: [
    { internalName: "hero", label: "Hero", order: 0 },
    { internalName: "list", label: "Testimonial Grid", order: 1 },
  ],
  faqs: [
    { internalName: "hero", label: "Hero", order: 0 },
    { internalName: "faq-list", label: "FAQ Accordion", order: 1 },
    { internalName: "contact-cta", label: "Still Have Questions", order: 2 },
  ],
  contact: [
    { internalName: "hero", label: "Hero", order: 0 },
    { internalName: "contact-info", label: "Contact Information", order: 1 },
    { internalName: "contact-form", label: "Contact Form", order: 2 },
  ],
  privacy: [
    { internalName: "hero", label: "Hero", order: 0 },
    { internalName: "content", label: "Policy Content", order: 1 },
  ],
  terms: [
    { internalName: "hero", label: "Hero", order: 0 },
    { internalName: "content", label: "Terms Content", order: 1 },
  ],
};

export function getPageSectionCatalog(pageKey: PageKey): PageSectionDefinition[] {
  return PAGE_SECTION_CATALOG[pageKey] ?? [];
}

export type SectionVisibilityMap = Record<string, boolean>;

export function createSectionChecker(visibility: SectionVisibilityMap) {
  return (internalName: string) => visibility[internalName] !== false;
}

export function mergeSectionStates(
  pageKey: PageKey,
  storedSections: Array<{ internalName: string; visible?: boolean }> = []
): Array<PageSectionDefinition & { visible: boolean }> {
  const catalog = getPageSectionCatalog(pageKey);
  const stored = new Map(storedSections.map((section) => [section.internalName, section]));

  return catalog.map((definition) => ({
    ...definition,
    visible: stored.get(definition.internalName)?.visible !== false,
  }));
}

export function formatPageTitle(pageKey: PageKey): string {
  if (pageKey === "home") return "Home";
  return pageKey.charAt(0).toUpperCase() + pageKey.slice(1).replace(/-/g, " ");
}
