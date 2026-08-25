import type { PublicBook } from "@/types/public";

export const BOOK_AUTHOR = "Explore More Academy LLC";

export type BookCatalogEntry = {
  slug: string;
  title: string;
  priceCents: number;
  shortDescription: string;
  fullDescription: string;
  coverImage: string;
  featured?: boolean;
};

/** Cover images in `public/books/` — `book-1.png` … `book-25.png` (catalog order) */
const BOOK_COVER_BY_SLUG: Record<string, string> = {
  "50-states-and-capitals": "/books/book-1.png",
  "attendance-tracker": "/books/book-2.png",
  "bonnie-and-clyde": "/books/book-3.png",
  "camping-adventure-guide": "/books/book-4.png",
  "career-prep-workbook": "/books/book-5.png",
  "dance-music-stem-adventures": "/books/book-6.png",
  "educational-expense-tracker": "/books/book-7.png",
  "environmental-adventures-book-1": "/books/book-8.png",
  "explore-more-science-book": "/books/book-9.png",
  "feelings-journal-explore-your-day": "/books/book-10.png",
  "field-trip-log": "/books/book-11.png",
  "fun-science-experiments": "/books/book-12.png",
  "general-william-smallwood": "/books/book-13.png",
  "george-washington": "/books/book-14.png",
  "grade-tracker": "/books/book-15.png",
  "high-school-financial-literacy-workbook-1": "/books/book-16.png",
  "high-school-financial-literacy-workbook-2": "/books/book-17.png",
  "how-to-start-homeschooling": "/books/book-18.png",
  "kindergarten-math-adventures": "/books/book-19.png",
  "presidential-facts": "/books/book-20.png",
  "reading-log": "/books/book-21.png",
  "30-60-day-summer-garden-adventure": "/books/book-22.png",
  "seven-greatest-mountains-of-the-world": "/books/book-23.png",
  "united-states-monuments-national-parks": "/books/book-24.png",
  "united-states-vice-presidents": "/books/book-25.png",
};

export function bookCoverPath(slug: string) {
  return BOOK_COVER_BY_SLUG[slug] ?? `/books/${slug}.png`;
}

export function getCatalogBook(slug: string): PublicBook | null {
  const book = BOOK_CATALOG.find((entry) => entry.slug === slug);
  if (!book) return null;
  return catalogEntryToPublicBook(book);
}

function catalogEntryToPublicBook(book: BookCatalogEntry): PublicBook {
  return {
    _id: `catalog-${book.slug}`,
    slug: book.slug,
    title: book.title,
    author: BOOK_AUTHOR,
    shortDescription: book.shortDescription,
    fullDescription: book.fullDescription,
    coverImage: book.coverImage,
    priceCents: book.priceCents,
    stockStatus: "in_stock",
    featured: book.featured,
    format: "Paperback",
  };
}

/** Fallback storefront books when no published DB books exist yet. */
export function getCatalogBooksForHomepage(limit = 4): PublicBook[] {
  const featured = BOOK_CATALOG.filter((book) => book.featured).map(catalogEntryToPublicBook);
  if (featured.length >= limit) return featured.slice(0, limit);

  const featuredSlugs = new Set(featured.map((book) => book.slug));
  const rest = BOOK_CATALOG.filter((book) => !featuredSlugs.has(book.slug)).map(
    catalogEntryToPublicBook
  );

  return [...featured, ...rest].slice(0, limit);
}

export const BOOK_CATALOG: BookCatalogEntry[] = [
  {
    slug: "50-states-and-capitals",
    title: "50 States & Capitals",
    priceCents: 1499,
    shortDescription: "Learn every U.S. state and capital through maps, facts, and engaging activities.",
    fullDescription:
      "A colorful guide to all 50 states and their capitals — perfect for homeschoolers and classroom learners building geography confidence.",
    coverImage: bookCoverPath("50-states-and-capitals"),
    featured: true,
  },
  {
    slug: "attendance-tracker",
    title: "Attendance Tracker",
    priceCents: 899,
    shortDescription: "Track school days with an adventure-ready attendance log.",
    fullDescription:
      "Be present. Be prepared. Be ready for adventure. A practical attendance tracker designed for homeschool and outdoor-learning families.",
    coverImage: bookCoverPath("attendance-tracker"),
    featured: true,
  },
  {
    slug: "bonnie-and-clyde",
    title: "Bonnie & Clyde: America's Most Famous Outlaw Couple",
    priceCents: 2499,
    shortDescription: "The true story behind the legend — love, crime, betrayal, and legacy.",
    fullDescription:
      "An engaging historical narrative exploring one of America's most infamous outlaw couples, written for curious teen and young adult readers.",
    coverImage: bookCoverPath("bonnie-and-clyde"),
  },
  {
    slug: "camping-adventure-guide",
    title: "Camping Adventure Guide",
    priceCents: 1599,
    shortDescription: "Camping basics, outdoor skills, fun activities, and wildlife discovery.",
    fullDescription:
      "Everything young explorers need for safe, fun camping adventures — from gear checklists to nature activities under the stars.",
    coverImage: bookCoverPath("camping-adventure-guide"),
    featured: true,
  },
  {
    slug: "career-prep-workbook",
    title: "Career Prep WorkBook",
    priceCents: 1499,
    shortDescription: "Career exploration and planning workbook for high schoolers.",
    fullDescription:
      "Help teens discover interests, explore career paths, and build skills for life after graduation with guided prompts and planning pages.",
    coverImage: bookCoverPath("career-prep-workbook"),
  },
  {
    slug: "dance-music-stem-adventures",
    title: "Dance, Music & STEM Adventures",
    priceCents: 1899,
    shortDescription: "Creative movement, music, and hands-on STEM in one adventure book.",
    fullDescription:
      "Blend art, rhythm, and science through activities that get kids moving, creating, and problem-solving outdoors and in the classroom.",
    coverImage: bookCoverPath("dance-music-stem-adventures"),
  },
  {
    slug: "educational-expense-tracker",
    title: "Educational Expense Tracker",
    priceCents: 899,
    shortDescription: "Organize homeschool and learning expenses in one place.",
    fullDescription:
      "Track curriculum, supplies, field trips, and program costs so families can stay organized and plan wisely for the year ahead.",
    coverImage: bookCoverPath("educational-expense-tracker"),
  },
  {
    slug: "environmental-adventures-book-1",
    title: "Environmental Adventures – Book 1",
    priceCents: 1299,
    shortDescription: "Explore our planet, protect ecosystems, and preserve our home.",
    fullDescription:
      "Book 1 in the Environmental Adventures series — hands-on lessons in ecology, conservation, and caring for the natural world.",
    coverImage: bookCoverPath("environmental-adventures-book-1"),
  },
  {
    slug: "explore-more-science-book",
    title: "Explore More Science Book",
    priceCents: 1599,
    shortDescription: "Discover, learn, and explore the world around you.",
    fullDescription:
      "A field-friendly science resource packed with observation prompts, experiments, and wonder-driven learning for young explorers.",
    coverImage: bookCoverPath("explore-more-science-book"),
    featured: true,
  },
  {
    slug: "feelings-journal-explore-your-day",
    title: "Feelings Journal: Explore Your Day",
    priceCents: 1499,
    shortDescription: "Explore your day and understand your feelings.",
    fullDescription:
      "A guided journal helping youth reflect on emotions, build self-awareness, and grow resilience through daily prompts and check-ins.",
    coverImage: bookCoverPath("feelings-journal-explore-your-day"),
  },
  {
    slug: "field-trip-log",
    title: "Field Trip Log",
    priceCents: 899,
    shortDescription: "Record every adventure — every page is a new discovery.",
    fullDescription:
      "Capture field trip memories, learning highlights, and reflections with a log built for homeschoolers and outdoor educators.",
    coverImage: bookCoverPath("field-trip-log"),
  },
  {
    slug: "fun-science-experiments",
    title: "Fun Science Experiments",
    priceCents: 1599,
    shortDescription: "Explore, experiment, and discover with hands-on science.",
    fullDescription:
      "Simple, safe experiments using everyday materials — perfect for kitchen-table labs and outdoor science adventures.",
    coverImage: bookCoverPath("fun-science-experiments"),
  },
  {
    slug: "general-william-smallwood",
    title: "General William Smallwood",
    priceCents: 1499,
    shortDescription: "Soldier, leader, governor, patriot — a hero from Charles County, Maryland.",
    fullDescription:
      "Discover the life and legacy of General William Smallwood through an accessible biography for young history learners.",
    coverImage: bookCoverPath("general-william-smallwood"),
  },
  {
    slug: "george-washington",
    title: "George Washington",
    priceCents: 1299,
    shortDescription: "Soldier, leader, statesman — Father of a Nation.",
    fullDescription:
      "An inspiring introduction to George Washington's leadership, character, and role in shaping the United States.",
    coverImage: bookCoverPath("george-washington"),
  },
  {
    slug: "grade-tracker",
    title: "Grade Tracker",
    priceCents: 899,
    shortDescription: "Track today, achieve tomorrow — explore limitless possibilities.",
    fullDescription:
      "A clear, adventure-themed grade tracker to help students and families monitor progress across subjects all year long.",
    coverImage: bookCoverPath("grade-tracker"),
  },
  {
    slug: "high-school-financial-literacy-workbook-1",
    title: "High School Financial Literacy Workbook 1",
    priceCents: 2599,
    shortDescription: "Money smart: building wealth for life — Grades 9–12.",
    fullDescription:
      "Workbook 1 covers budgeting, banking, credit, and investing fundamentals to help teens build real-world money skills.",
    coverImage: bookCoverPath("high-school-financial-literacy-workbook-1"),
  },
  {
    slug: "high-school-financial-literacy-workbook-2",
    title: "High School Financial Literacy Workbook 2",
    priceCents: 2599,
    shortDescription: "Money smart: building wealth for life — Grades 9–12.",
    fullDescription:
      "Workbook 2 continues the financial literacy journey with deeper lessons on investing, credit, and long-term planning.",
    coverImage: bookCoverPath("high-school-financial-literacy-workbook-2"),
  },
  {
    slug: "how-to-start-homeschooling",
    title: "How to Start Homeschooling",
    priceCents: 2999,
    shortDescription: "A complete beginner's guide for families.",
    fullDescription:
      "Step-by-step guidance on getting started with homeschooling — laws, planning, curriculum choices, and building community.",
    coverImage: bookCoverPath("how-to-start-homeschooling"),
  },
  {
    slug: "kindergarten-math-adventures",
    title: "Kindergarten Math Adventures",
    priceCents: 3999,
    shortDescription: "Explore, count, and discover with early math outdoors.",
    fullDescription:
      "Playful math activities for kindergarten learners — counting, shapes, patterns, and problem-solving on the trail and at home.",
    coverImage: bookCoverPath("kindergarten-math-adventures"),
  },
  {
    slug: "presidential-facts",
    title: "Presidential Facts",
    priceCents: 1499,
    shortDescription: "Amazing stories, facts, and trivia about America's presidents.",
    fullDescription:
      "Fun presidential history packed with surprising facts and stories that bring America's leaders to life for young readers.",
    coverImage: bookCoverPath("presidential-facts"),
  },
  {
    slug: "reading-log",
    title: "Reading Log",
    priceCents: 899,
    shortDescription: "Every page is a new adventure — track books you've read.",
    fullDescription:
      "Motivate young readers to log titles, minutes, and reflections with a camping-themed reading tracker.",
    coverImage: bookCoverPath("reading-log"),
  },
  {
    slug: "30-60-day-summer-garden-adventure",
    title: "The 30–60 Day Summer Garden Adventure",
    priceCents: 1499,
    shortDescription: "Grow fast foods, flowers, and herbs in one or two months.",
    fullDescription:
      "A family-friendly garden guide for short growing seasons — plan, plant, and harvest together all summer long.",
    coverImage: bookCoverPath("30-60-day-summer-garden-adventure"),
  },
  {
    slug: "seven-greatest-mountains-of-the-world",
    title: "The Seven Greatest Mountains of the World",
    priceCents: 2299,
    shortDescription: "An adventure to Earth's most amazing peaks.",
    fullDescription:
      "Explore geography, culture, and mountaineering history through seven of the world's most iconic mountains.",
    coverImage: bookCoverPath("seven-greatest-mountains-of-the-world"),
  },
  {
    slug: "united-states-monuments-national-parks",
    title: "The United States Monuments & National Parks",
    priceCents: 1499,
    shortDescription: "Celebrating the landmarks and natural treasures that define our nation.",
    fullDescription:
      "A visual journey through America's monuments and national parks — perfect for geography, history, and travel-inspired learning.",
    coverImage: bookCoverPath("united-states-monuments-national-parks"),
  },
  {
    slug: "united-states-vice-presidents",
    title: "The United States Vice Presidents",
    priceCents: 1699,
    shortDescription: "Leadership, loyalty, impact — purpose, partnership, and power to shape the nation.",
    fullDescription:
      "Advice, history, perspective, and legacy — an engaging guide to America's vice presidents and their role in our democracy.",
    coverImage: bookCoverPath("united-states-vice-presidents"),
  },
];
