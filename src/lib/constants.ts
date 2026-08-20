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

export const ROLES = ["student", "parent", "staff", "instructor", "administrator"] as const;

/** Roles that can access the staff portal (messages, parent calls). */
export const STAFF_PORTAL_ROLES = ["staff", "instructor", "administrator"] as const;
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
export const MAX_PORTFOLIO_UPLOAD_SIZE = 50 * 1024 * 1024; // 50MB
/** Campaign attachments/images — no practical cap for admin uploads (server memory still applies). */
export const MAX_CAMPAIGN_UPLOAD_SIZE = 1024 * 1024 * 1024; // 1GB
export const ALLOWED_CAMPAIGN_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".txt", ".csv", ".zip", ".mp4", ".mov", ".mp3", ".wav",
];
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ALLOWED_PORTFOLIO_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
  ".mp4", ".mov", ".mp3", ".wav", ".zip",
];

export const PAGE_KEYS = [
  "home",
  "about",
  "events",
  "books",
  "courses",
  "membership",
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
