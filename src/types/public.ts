/** Plain JSON shapes returned from server-side MongoDB queries after serialize(). */

export interface PublicEvent {
  _id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  coverImage?: string;
  gallery?: string[];
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  location: string;
  mapLink?: string;
  isOnline?: boolean;
  capacity?: number;
  registrationDeadline?: string;
  ageRange?: string;
  parentRequired?: boolean;
  whatToBring?: string;
  instructions?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  eventType: "free" | "paid";
  priceAmount: number;
  priceCents: number;
  registrationEnabled?: boolean;
  featured?: boolean;
  category?: string;
  status: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface PublicCourse {
  _id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  coverImage?: string;
  category?: string;
  ageRange?: string;
  difficulty?: string;
  instructor?: string;
  isFree?: boolean;
  priceCents: number;
  enrollmentStatus: string;
  learningOutcomes?: string[];
  schedule?: string;
  deliveryFormat?: string;
  prerequisites?: string;
  modules?: {
    _id?: string;
    title: string;
    description?: string;
    order: number;
    lessons: { title: string; description?: string }[];
  }[];
  metaTitle?: string;
  metaDescription?: string;
}

export interface PublicBook {
  _id: string;
  slug: string;
  title: string;
  author: string;
  subtitle?: string;
  shortDescription: string;
  fullDescription: string;
  coverImage?: string;
  priceCents: number;
  salePriceCents?: number;
  category?: string;
  format?: string;
  pageCount?: number;
  ageRange?: string;
  isbn?: string;
  stockStatus?: string;
  featured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface PublicProgram {
  _id: string;
  slug: string;
  title: string;
  tagline: string;
  shortDescription: string;
  heroImage?: string;
  overview: string;
  benefits: string[];
  activities: string[];
  ageRange?: string;
  schedule?: string;
  featured?: boolean;
  faqs: { question: string; answer: string }[];
  detailSections: { _id?: string; title: string; content: string; order: number }[];
  metaTitle?: string;
  metaDescription?: string;
}

export interface PublicCampaign {
  _id: string;
  slug: string;
  title: string;
  description: string;
  coverImage?: string;
  goalCents: number;
  raisedCents: number;
  suggestedAmounts?: number[];
  customAmountEnabled: boolean;
  allowAnonymous: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface PublicGalleryImage {
  _id: string;
  title: string;
  caption?: string;
  imageUrl: string;
  altText?: string;
}

export interface PublicTestimonial {
  _id: string;
  authorName: string;
  authorRole?: string;
  content: string;
  rating?: number;
  imageUrl?: string;
}

export interface PublicFAQ {
  _id: string;
  question: string;
  answer: string;
  category?: string;
}
