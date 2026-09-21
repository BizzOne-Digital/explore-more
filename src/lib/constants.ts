export const COMPANY = {
  name: "Explore More Academy LLC",
  /** Shown on the public site, contact forms, and customer-facing emails */
  email: "hello@exploremoreacademy.com",
  /** Admin inbox for orders, registrations, form submissions, and backend alerts */
  adminEmail: "chris@exploremoreacademy.com",
  phone: "+1 (240) 944-1959",
  address: {
    street: "3890 Smallwood Church Rd",
    cityStateZip: "Indian Head, MD 20640",
    full: "3890 Smallwood Church Rd, Indian Head, MD 20640",
    mapsQuery: "3890 Smallwood Church Rd, Indian Head, MD 20640",
  },
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

/** Roles that can access the staff portal dashboard (instructors & administrators). */
export const TUTOR_PORTAL_ROLES = ["instructor", "administrator"] as const;
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

/** MongoDB-backed admin image folders (serverless-safe). */
export const STORED_UPLOAD_FOLDERS = [
  "products",
  "gallery",
  "pages",
  "misc",
  "certificate-templates",
] as const;
export type StoredUploadFolder = (typeof STORED_UPLOAD_FOLDERS)[number];

/** MongoDB-backed private file folders (auth required to download). */
export const PRIVATE_STORED_FOLDERS = [
  "certificates",
  "assessments",
  "books",
  "sponsors",
  "notifications",
  "user-documents",
  "attendance",
  "resources",
  "portfolio",
  "messages",
] as const;
export type PrivateStoredFolder = (typeof PRIVATE_STORED_FOLDERS)[number];

/** Map legacy upload categories to MongoDB storage folders. */
export const LEGACY_UPLOAD_FOLDER_MAP: Record<keyof typeof UPLOAD_DIRS, StoredUploadFolder> = {
  books: "products",
  courses: "products",
  events: "products",
  programs: "products",
  gallery: "gallery",
  pages: "pages",
  testimonials: "misc",
  campaigns: "misc",
  settings: "pages",
};

export const PLACEHOLDER_IMAGE = "/images/placeholder.svg";
export const MAX_STORED_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB
/** Certificate background images for the public generator. */
export const MAX_CERTIFICATE_TEMPLATE_UPLOAD_SIZE = 50 * 1024 * 1024; // 50MB
export const STORED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB
/** Standard cap for PDF uploads (books, certificates, assessments, tutor resources, etc.). */
export const MAX_PDF_UPLOAD_MB = 50;
export const MAX_PDF_UPLOAD_SIZE = MAX_PDF_UPLOAD_MB * 1024 * 1024;
export const MAX_PORTFOLIO_UPLOAD_SIZE = MAX_PDF_UPLOAD_SIZE;
/** MongoDB BSON document limit — keep a safe margin for metadata. */
export const MAX_MONGO_PRIVATE_UPLOAD_SIZE = 15 * 1024 * 1024; // 15MB
/** Vercel serverless request body limit — larger files use chunked multipart upload to R2 via our API. */
export const VERCEL_SAFE_UPLOAD_SIZE = 4 * 1024 * 1024; // 4MB
/** S3/R2 multipart parts must be ≥5MB (except the last); Vercel bodies are ~4.5MB — large files use presigned PUT from the browser instead. */
export const R2_UPLOAD_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB (legacy multipart routes only)
/** Campaign attachments/images — no practical cap for admin uploads (server memory still applies). */
export const MAX_CAMPAIGN_UPLOAD_SIZE = 1024 * 1024 * 1024; // 1GB
/** Notification attachments stored in MongoDB (16MB BSON document limit). */
export const MAX_NOTIFICATION_UPLOAD_SIZE = 15 * 1024 * 1024; // 15MB
/** Tutor worksheets/resources — large files use direct-to-cloud upload when configured. */
export const MAX_TUTOR_RESOURCE_UPLOAD_SIZE = MAX_PDF_UPLOAD_SIZE;
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
  "dr-boom",
  "sponsor-a-kid",
  "gallery",
  "testimonials",
  "faqs",
  "contact",
  "privacy",
  "terms",
] as const;

export type PageKey = (typeof PAGE_KEYS)[number];
