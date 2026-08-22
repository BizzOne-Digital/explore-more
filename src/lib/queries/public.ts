import connectDB from "@/lib/db";
import { serialize } from "@/lib/serialize";
import {
  Event,
  Course,
  Book,
  Program,
  DonationCampaign,
  GalleryImage,
  Testimonial,
  FAQ,
} from "@/models";
import type {
  PublicEvent,
  PublicCourse,
  PublicBook,
  PublicProgram,
  PublicCampaign,
  PublicGalleryImage,
  PublicTestimonial,
  PublicFAQ,
} from "@/types/public";
import { mapPublicEvent, mapPublicEvents } from "@/lib/content/public-event";

async function withDb<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    await connectDB();
    return await fn();
  } catch {
    return fallback;
  }
}

export async function getUpcomingEvents(limit = 6): Promise<PublicEvent[]> {
  return withDb(async () => {
    const now = new Date();
    const events = await Event.find({
      status: "published",
      startDate: { $gt: now },
    })
      .sort({ startDate: 1 })
      .limit(limit)
      .lean();
    return mapPublicEvents(serialize(events) as unknown as Record<string, unknown>[]);
  }, []);
}

export async function getFeaturedCourses(limit = 4): Promise<PublicCourse[]> {
  return withDb(async () => {
    const courses = await Course.find({
      status: "published",
      featured: true,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return serialize(courses) as unknown as PublicCourse[];
  }, []);
}

export async function getFeaturedBooks(limit = 4): Promise<PublicBook[]> {
  return withDb(async () => {
    const books = await Book.find({ published: true, featured: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return serialize(books) as unknown as PublicBook[];
  }, []);
}

export async function getPublishedPrograms(): Promise<PublicProgram[]> {
  return withDb(async () => {
    const programs = await Program.find({ status: "published" })
      .sort({ listingOrder: 1, createdAt: -1 })
      .lean();
    return serialize(programs) as unknown as PublicProgram[];
  }, []);
}

export async function getProgramBySlug(slug: string): Promise<PublicProgram | null> {
  return withDb(async () => {
    const program = await Program.findOne({ slug, status: "published" }).lean();
    return program ? (serialize(program) as unknown as PublicProgram) : null;
  }, null);
}

export async function getEventBySlug(slug: string): Promise<PublicEvent | null> {
  return withDb(async () => {
    const event = await Event.findOne({ slug, status: "published" }).lean();
    return event ? mapPublicEvent(serialize(event) as unknown as Record<string, unknown>) : null;
  }, null);
}

export async function getAllPublishedEvents(): Promise<PublicEvent[]> {
  return withDb(async () => {
    const now = new Date();
    const events = await Event.find({
      status: "published",
      startDate: { $gt: now },
    })
      .sort({ startDate: 1 })
      .lean();
    return mapPublicEvents(serialize(events) as unknown as Record<string, unknown>[]);
  }, []);
}

export async function getAllPublishedCourses(): Promise<PublicCourse[]> {
  return withDb(async () => {
    const courses = await Course.find({ status: "published" })
      .sort({ featured: -1, createdAt: -1 })
      .lean();
    return serialize(courses) as unknown as PublicCourse[];
  }, []);
}

export async function getCourseBySlug(slug: string): Promise<PublicCourse | null> {
  return withDb(async () => {
    const course = await Course.findOne({ slug, status: "published" }).lean();
    return course ? (serialize(course) as unknown as PublicCourse) : null;
  }, null);
}

export async function getAllPublishedBooks(): Promise<PublicBook[]> {
  return withDb(async () => {
    const books = await Book.find({ published: true })
      .sort({ featured: -1, title: 1 })
      .lean();
    return serialize(books) as unknown as PublicBook[];
  }, []);
}

export async function getBookBySlug(slug: string): Promise<PublicBook | null> {
  return withDb(async () => {
    const book = await Book.findOne({ slug, published: true }).lean();
    return book ? (serialize(book) as unknown as PublicBook) : null;
  }, null);
}

export async function getFeaturedGalleryImages(limit = 8): Promise<PublicGalleryImage[]> {
  return withDb(async () => {
    const images = await GalleryImage.find({ status: "published" })
      .sort({ featured: -1, order: 1 })
      .limit(limit)
      .lean();
    return serialize(images) as unknown as PublicGalleryImage[];
  }, []);
}

export async function getAllGalleryImages(): Promise<PublicGalleryImage[]> {
  return withDb(async () => {
    const images = await GalleryImage.find({ status: "published" })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    return serialize(images) as unknown as PublicGalleryImage[];
  }, []);
}

export async function getFeaturedTestimonials(limit = 3): Promise<PublicTestimonial[]> {
  return withDb(async () => {
    const testimonials = await Testimonial.find({ status: "published", featured: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return serialize(testimonials) as unknown as PublicTestimonial[];
  }, []);
}

export async function getAllTestimonials(): Promise<PublicTestimonial[]> {
  return withDb(async () => {
    const testimonials = await Testimonial.find({ status: "published" })
      .sort({ featured: -1, createdAt: -1 })
      .lean();
    return serialize(testimonials) as unknown as PublicTestimonial[];
  }, []);
}

export async function getFeaturedFAQs(limit = 5): Promise<PublicFAQ[]> {
  return withDb(async () => {
    const faqs = await FAQ.find({ status: "published" })
      .sort({ order: 1 })
      .limit(limit)
      .lean();
    return serialize(faqs) as unknown as PublicFAQ[];
  }, []);
}

export async function getAllFAQs(): Promise<PublicFAQ[]> {
  return withDb(async () => {
    const faqs = await FAQ.find({ status: "published" }).sort({ order: 1, category: 1 }).lean();
    return serialize(faqs) as unknown as PublicFAQ[];
  }, []);
}

export async function getPublishedCampaigns(): Promise<PublicCampaign[]> {
  return withDb(async () => {
    const campaigns = await DonationCampaign.find({ status: "published" })
      .sort({ featured: -1, createdAt: -1 })
      .lean();
    return serialize(campaigns) as unknown as PublicCampaign[];
  }, []);
}

export async function getCampaignBySlug(slug: string): Promise<PublicCampaign | null> {
  return withDb(async () => {
    const campaign = await DonationCampaign.findOne({ slug, status: "published" }).lean();
    return campaign ? (serialize(campaign) as unknown as PublicCampaign) : null;
  }, null);
}
