export const COMPANY = {
  name: "Explore More Academy LLC",
  email: "chris@exploremoreacademy.com",
  phone: "+1 (240) 944-1959",
  website: "https://www.exploremoreacademy.com",
  tagline: "Learn Wild. Live Big.",
  supportingLine: "Hands-on learning. Real-world adventures. Limitless futures.",
  motto: "Wild Minds • Bold Hearts • Limitless Futures",
  mission:
    "Empowering youth through exploration, education, and real-world experiences. We inspire wild minds, build bold hearts, and create limitless futures.",
} as const;

export const ROLES = ["student", "parent", "instructor", "administrator"] as const;
export type Role = (typeof ROLES)[number];

export const UPLOAD_DIRS = {
  pages: "pages",
  events: "events",
  books: "books",
  courses: "courses",
  programs: "programs",
  gallery: "gallery",
  testimonials: "testimonials",
  campaigns: "campaigns",
  settings: "settings",
} as const;

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const PAGE_KEYS = [
  "home",
  "about",
  "events",
  "books",
  "courses",
  "programs",
  "sponsor-a-kid",
  "gallery",
  "testimonials",
  "faqs",
  "contact",
  "privacy",
  "terms",
] as const;

export type PageKey = (typeof PAGE_KEYS)[number];
