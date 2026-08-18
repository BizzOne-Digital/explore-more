/**
 * Explore More Academy — Database Seed Script
 *
 * Usage:
 *   npm run seed
 *
 * Destructive reseed (drops all collections):
 *   RESET_DB=true npm run seed
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { COMPANY, PAGE_KEYS } from "../src/lib/constants";
import { getPageSectionCatalog } from "../src/lib/content/page-sections";

const MONGODB_URI = process.env.MONGODB_URI;
const RESET_DB = process.env.RESET_DB === "true";

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set. Copy .env.example to .env.local and configure it.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);

  if (RESET_DB) {
    console.warn("RESET_DB=true — dropping all collections...");
    const collections = await mongoose.connection.db!.collections();
    for (const col of collections) {
      await col.drop().catch(() => {});
    }
  }

  // Dynamic imports after connection
  const {
    User,
    StudentProfile,
    Page,
    SiteSettings,
    Program,
    Event,
    Book,
    Course,
    DonationCampaign,
    FAQ,
    GalleryCategory,
  } = await import("../src/models");

  // ── Site Settings ──
  await SiteSettings.deleteMany({});
  await SiteSettings.create({
    companyName: COMPANY.name,
    email: COMPANY.email,
    phone: COMPANY.phone,
    logoUrl: "/uploads/settings/logo-header.png",
    logoDarkUrl: "/uploads/settings/logo-header.png",
    faviconUrl: "/favicon.png",
    address: "123 Adventure Trail, Natureville, NV 89012",
    operatingHours: "Mon–Fri 9am–5pm, Sat by appointment",
    socialLinks: [
      { platform: "Facebook", url: "https://facebook.com/exploremoreacademy" },
      { platform: "Instagram", url: "https://instagram.com/exploremoreacademy" },
    ],
    stripeEnabled: false,
    manualOrderMode: false,
    taxRatePercent: 0,
    shippingFlatCents: 599,
    freeShippingThresholdCents: 5000,
    smtpConfigured: false,
    introEnabled: true,
    verifiedStats: { showStats: false },
  });
  console.log("✓ Site settings");

  // ── Admin User ──
  const adminEmail = (process.env.ADMIN_EMAIL ?? "chris@exploremoreacademy.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const adminHash = await hashPassword(adminPassword);

  await User.deleteMany({ email: adminEmail });
  await User.create({
    name: "Academy Administrator",
    email: adminEmail,
    passwordHash: adminHash,
    role: "administrator",
    emailVerified: true,
    isActive: true,
    notificationPreferences: {
      events: true,
      courses: true,
      newsletter: false,
      announcements: true,
    },
  });
  console.log(`✓ Admin user (${adminEmail})`);

  // ── Demo Parent User ──
  const parentEmail = (process.env.PARENT_EMAIL ?? "parent@exploremoreacademy.com").toLowerCase();
  const parentPassword = process.env.PARENT_PASSWORD ?? "ChangeMe123!";
  const parentHash = await hashPassword(parentPassword);

  await User.deleteMany({ email: parentEmail });
  await User.create({
    name: "Demo Parent",
    email: parentEmail,
    passwordHash: parentHash,
    role: "parent",
    emailVerified: true,
    isActive: true,
    notificationPreferences: {
      events: true,
      courses: true,
      newsletter: false,
      announcements: true,
    },
  });
  console.log(`✓ Demo parent user (${parentEmail})`);

  // ── Six Programs ──
  await Program.deleteMany({});
  const programs = [
    {
      title: "Academic Tutoring",
      slug: "academic-tutoring",
      tagline: "Personalized support for every learner",
      shortDescription:
        "Personalized support in Math, Reading, Science, Social Studies, and more.",
      overview:
        "Our Academic Tutoring program provides one-on-one and small-group support tailored to each student's learning style and goals.",
      benefits: [
        "Personalized learning plans",
        "Experienced educators",
        "Flexible scheduling",
        "Progress tracking for families",
      ],
      ageRange: "5–14",
      activities: ["Math", "Reading", "Science", "Social Studies", "Writing"],
      listingOrder: 1,
      featured: true,
      status: "published",
      detailSections: [
        { title: "Subjects", content: "Math, Reading, Science, Social Studies, and more.", order: 1 },
        { title: "Session Options", content: "Individual and small-group sessions available.", order: 2 },
      ],
    },
    {
      title: "Homeschool Hub",
      slug: "homeschool-hub",
      tagline: "A welcoming community for homeschool families",
      shortDescription:
        "Resources, portfolio reviews, field trips, graduation support, and a welcoming homeschool community.",
      overview:
        "Homeschool Hub connects families with resources, community activities, and expert support for their educational journey.",
      benefits: [
        "Portfolio review support",
        "Field trip coordination",
        "Graduation planning",
        "Community activities",
      ],
      ageRange: "5–14",
      activities: ["Portfolio reviews", "Field trips", "Group learning", "Graduation support"],
      listingOrder: 2,
      featured: true,
      status: "published",
      detailSections: [
        { title: "Family Support", content: "Guidance and resources for homeschool families.", order: 1 },
        { title: "Community Activities", content: "Regular meetups and collaborative learning events.", order: 2 },
      ],
    },
    {
      title: "Passport Adventure",
      slug: "passport-adventure",
      tagline: "Explore the community, collect stamps, earn rewards",
      shortDescription:
        "Explore the community through educational visits to businesses, museums, parks, and local landmarks while collecting passport stamps and earning rewards.",
      overview:
        "Passport Adventure turns the community into a classroom with stamp-collecting visits to local destinations.",
      benefits: [
        "Community exploration",
        "Stamp collection rewards",
        "Real-world learning",
        "Family participation welcome",
      ],
      ageRange: "5–14",
      activities: ["Museum visits", "Business tours", "Park exploration", "Landmark discovery"],
      listingOrder: 3,
      featured: true,
      status: "published",
      detailSections: [
        { title: "How the Passport Works", content: "Collect stamps at each destination to earn milestones and rewards.", order: 1 },
        { title: "Destinations", content: "Businesses, museums, parks, and local landmarks.", order: 2 },
      ],
    },
    {
      title: "Outdoor Adventures",
      slug: "outdoor-adventures",
      tagline: "Unforgettable experiences in nature",
      shortDescription:
        "Camping, hiking, fishing, survival skills, nature exploration, wildlife education, and unforgettable outdoor experiences.",
      overview:
        "Outdoor Adventures connects youth with nature through hands-on exploration, skill-building, and team experiences.",
      benefits: [
        "Nature exploration",
        "Survival skills",
        "Wildlife education",
        "Team building",
      ],
      ageRange: "5–14",
      activities: ["Camping", "Hiking", "Fishing", "Survival skills", "Wildlife education"],
      listingOrder: 4,
      featured: true,
      status: "published",
      detailSections: [
        { title: "Adventure Types", content: "Camping, hiking, fishing, and nature exploration.", order: 1 },
        { title: "Seasonal Availability", content: "Programs available spring through fall.", order: 2 },
      ],
    },
    {
      title: "Career Readiness",
      slug: "career-readiness",
      tagline: "Prepare for a bold future",
      shortDescription:
        "Prepare for the future through résumé writing, mock interviews, leadership training, financial literacy, and entrepreneurship workshops.",
      overview:
        "Career Readiness equips youth with practical skills for the workforce and entrepreneurship.",
      benefits: [
        "Résumé writing",
        "Interview preparation",
        "Leadership training",
        "Financial literacy",
      ],
      ageRange: "10–14",
      activities: ["Résumé workshops", "Mock interviews", "Leadership sessions", "Entrepreneurship"],
      listingOrder: 5,
      featured: false,
      status: "published",
      detailSections: [
        { title: "Workshops", content: "Hands-on workshops in résumé writing, interviews, and financial literacy.", order: 1 },
      ],
    },
    {
      title: "STEM & Innovation",
      slug: "stem-innovation",
      tagline: "Hands-on science, robotics, and coding",
      shortDescription:
        "Hands-on science experiments, robotics, engineering challenges, coding, and creative problem-solving.",
      overview:
        "STEM & Innovation sparks curiosity through experiments, robotics, engineering challenges, and coding.",
      benefits: [
        "Science experiments",
        "Robotics",
        "Engineering challenges",
        "Coding fundamentals",
      ],
      ageRange: "5–14",
      activities: ["Science labs", "Robotics", "Engineering", "Coding", "Innovation challenges"],
      listingOrder: 6,
      featured: true,
      status: "published",
      detailSections: [
        { title: "Learning Outcomes", content: "Critical thinking, problem-solving, and creative innovation.", order: 1 },
      ],
    },
  ];

  await Program.insertMany(programs);
  console.log("✓ 6 programs");

  // ── Pages ──
  await Page.deleteMany({});
  const pageRecords = PAGE_KEYS.map((key) => ({
    key,
    title: key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, " "),
    slug: key === "home" ? "home" : key,
    status: "draft" as const,
    navVisible: true,
    sections: getPageSectionCatalog(key).map((section) => ({
      internalName: section.internalName,
      heading: section.label,
      visible: true,
      order: section.order,
      status: "published" as const,
    })),
  }));
  await Page.insertMany(pageRecords);
  console.log(`✓ ${PAGE_KEYS.length} pages`);

  // ── FAQs ──
  await FAQ.deleteMany({});
  await FAQ.insertMany([
    {
      question: "What age groups do you serve?",
      answer: "Our programs typically serve youth ages 5–14. Specific age ranges vary by program.",
      category: "General",
      order: 1,
      status: "published",
    },
    {
      question: "Do you support homeschool families?",
      answer:
        "Yes! Our Homeschool Hub provides resources, portfolio reviews, field trips, and community support for homeschool families.",
      category: "Programs",
      order: 2,
      status: "published",
    },
    {
      question: "How do I register for an event?",
      answer:
        "Create a free account, browse our Events page, and click Register on any upcoming event. Some events may require a guardian consent form.",
      category: "Events",
      order: 3,
      status: "published",
    },
    {
      question: "Are donations tax-deductible?",
      answer:
        "Please contact us directly to confirm tax-deductibility status for specific campaigns before donating.",
      category: "Donations",
      order: 4,
      status: "draft",
    },
  ]);
  console.log("✓ FAQs");

  // ── Gallery Categories ──
  await GalleryCategory.deleteMany({});
  await GalleryCategory.insertMany([
    { name: "Exploring Nature", slug: "exploring-nature", order: 1 },
    { name: "Camp Adventure", slug: "camp-adventure", order: 2 },
    { name: "Science in the Wild", slug: "science-in-the-wild", order: 3 },
    { name: "Community Impact", slug: "community-impact", order: 4 },
  ]);
  console.log("✓ Gallery categories");

  // ── Bookstore ──
  await Book.deleteMany({});
  const { BOOK_CATALOG, BOOK_AUTHOR } = await import("../src/lib/content/books");
  await Book.insertMany(
    BOOK_CATALOG.map((book) => ({
      title: book.title,
      slug: book.slug,
      author: BOOK_AUTHOR,
      shortDescription: book.shortDescription,
      fullDescription: book.fullDescription,
      priceAmount: book.priceCents / 100,
      coverImage: book.coverImage,
      images: [book.coverImage],
      format: "Paperback",
      stockStatus: "in_stock" as const,
      inventory: 100,
      featured: book.featured ?? false,
      status: "published" as const,
      publishedToWebsite: true,
    }))
  );
  console.log(`✓ ${BOOK_CATALOG.length} books`);

  // ── Draft Course ──
  await Course.deleteMany({});
  await Course.create({
    title: "Introduction to Nature Science",
    slug: "introduction-to-nature-science",
    shortDescription: "A draft course exploring basic nature science concepts.",
    fullDescription:
      "This draft course covers foundational nature science topics through hands-on activities. Pending content verification before publication.",
    category: "STEM",
    ageRange: "8–12",
    difficulty: "beginner",
    priceAmount: 0,
    isFree: true,
    learningOutcomes: ["Observe nature", "Record findings", "Ask scientific questions"],
    modules: [
      {
        title: "Getting Started",
        order: 0,
        lessons: [
          { title: "Welcome & Overview", order: 0, duration: 10 },
          { title: "Your Nature Journal", order: 1, duration: 15 },
        ],
      },
    ],
    featured: false,
    enrollmentStatus: "open",
    status: "draft",
  });
  console.log("✓ Draft course");

  // ── Archived 2025 Events (draft/archived — NOT upcoming) ──
  await Event.deleteMany({});
  const archivedEvents = [
    {
      title: "Nature Walk",
      slug: "nature-walk-may-2025",
      shortDescription: "A guided nature walk exploring local flora and fauna.",
      fullDescription: "Archived 2025 event — imported as draft for reference only.",
      startDate: new Date("2025-05-25T10:00:00"),
      endDate: new Date("2025-05-25T12:00:00"),
      startTime: "10:00",
      endTime: "12:00",
      location: "Local Nature Trail",
      eventType: "free" as const,
      priceAmount: 0,
      registrationEnabled: false,
      featured: false,
      status: "archived" as const,
      publishedToWebsite: false,
    },
    {
      title: "Kings Dominion Family Fun Day",
      slug: "kings-dominion-family-fun-day-2025",
      shortDescription: "A family fun day at Kings Dominion.",
      fullDescription: "Archived 2025 event — imported as draft for reference only.",
      startDate: new Date("2025-06-15T09:00:00"),
      endDate: new Date("2025-06-15T18:00:00"),
      startTime: "09:00",
      endTime: "18:00",
      location: "Kings Dominion, VA",
      eventType: "paid" as const,
      priceAmount: 45,
      registrationEnabled: false,
      featured: false,
      status: "archived" as const,
      publishedToWebsite: false,
    },
    {
      title: "DC Zoo Adventure",
      slug: "dc-zoo-adventure-2025",
      shortDescription: "An educational adventure at the DC Zoo.",
      fullDescription: "Archived 2025 event — imported as draft for reference only.",
      startDate: new Date("2025-07-12T09:00:00"),
      endDate: new Date("2025-07-12T15:00:00"),
      startTime: "09:00",
      endTime: "15:00",
      location: "Smithsonian National Zoo, Washington DC",
      eventType: "paid" as const,
      priceAmount: 25,
      registrationEnabled: false,
      featured: false,
      status: "archived" as const,
      publishedToWebsite: false,
    },
    {
      title: "New Event",
      slug: "new-event-summer-2025",
      shortDescription: "Summer 2025 program event — status pending verification.",
      fullDescription: "Archived 2025 event (July 24 – September 25, 2025) — pending verification.",
      startDate: new Date("2025-07-24T09:00:00"),
      endDate: new Date("2025-09-25T17:00:00"),
      startTime: "09:00",
      endTime: "17:00",
      location: "TBD",
      eventType: "free" as const,
      priceAmount: 0,
      registrationEnabled: false,
      featured: false,
      status: "archived" as const,
      publishedToWebsite: false,
    },
  ];
  await Event.insertMany(archivedEvents);
  console.log("✓ 4 archived 2025 events");

  // ── Draft Donation Campaigns ──
  await DonationCampaign.deleteMany({});
  await DonationCampaign.insertMany([
    {
      title: "Annual Picnic",
      slug: "annual-picnic",
      description:
        "Support our annual community picnic bringing families together for food, games, and adventure. Campaign details pending verification.",
      goalAmount: 5000,
      raisedAmount: 0,
      suggestedAmounts: [25, 50, 100, 250],
      customAmountEnabled: true,
      status: "draft",
      featured: false,
      showDonorCount: true,
      allowAnonymous: true,
      publishedToWebsite: false,
    },
    {
      title: "Flood Donation",
      slug: "flood-donation",
      description:
        "Help families affected by recent flooding. Purpose and beneficiary details pending verification.",
      goalAmount: 10000,
      raisedAmount: 0,
      suggestedAmounts: [50, 100, 250, 500],
      customAmountEnabled: true,
      status: "draft",
      featured: false,
      showDonorCount: true,
      allowAnonymous: true,
      publishedToWebsite: false,
    },
    {
      title: "Become a Sponsor",
      slug: "sponsor-a-kid",
      description:
        "Help a young explorer access programs, field trips, and learning adventures. Legal wording and tax-deductibility pending verification.",
      goalAmount: 25000,
      raisedAmount: 0,
      suggestedAmounts: [25, 50, 100, 500],
      customAmountEnabled: true,
      status: "draft",
      featured: true,
      showDonorCount: false,
      allowAnonymous: true,
      publishedToWebsite: false,
    },
  ]);
  console.log("✓ 3 draft donation campaigns");

  console.log("\nSeed complete!");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log(`Parent login: ${parentEmail} / ${parentPassword}`);
  if (!RESET_DB) {
    console.log("Note: Run with RESET_DB=true to drop and fully reseed.");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
