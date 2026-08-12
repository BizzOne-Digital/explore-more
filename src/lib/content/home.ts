export const BRAND_IMAGES = {
  outdoorEducation: "/outdoor-education.png",
  outdoorEducationSquare: "/outdoor-education-2.png",
  creativeWild: "/Creative-Wild.png",
  creativeWildCard: "/Creative-Wild-2.png",
  leadershipTrails: "/leadership-trails.png",
  leadershipTrailsCard: "/leadership-trails-2.png",
} as const;

export const ADVENTURE_FEED_FALLBACK = [
  { src: BRAND_IMAGES.outdoorEducationSquare, alt: "Outdoor classroom moment in the forest" },
  { src: BRAND_IMAGES.creativeWildCard, alt: "Creative Wild — art meets adventure" },
  { src: BRAND_IMAGES.leadershipTrailsCard, alt: "Leadership Trails — teamwork on the trail" },
  { src: BRAND_IMAGES.outdoorEducation, alt: "Outdoor education adventure" },
  { src: BRAND_IMAGES.creativeWild, alt: "Nature journaling and creative exploration" },
  { src: BRAND_IMAGES.leadershipTrails, alt: "Youth leadership trail challenge" },
] as const;

export const PROGRAM_PATHWAYS = [
  {
    title: "Wild Explorers",
    description: "Outdoor discovery for curious young adventurers ages 6–10.",
    href: "/programs",
    color: "bg-explore-forest",
    icon: "🌲",
  },
  {
    title: "Trail Scholars",
    description: "Project-based learning that connects classroom concepts to real trails.",
    href: "/courses",
    color: "bg-explore-teal",
    icon: "📚",
  },
  {
    title: "Summit Leaders",
    description: "Leadership, teamwork, and resilience for teens ready to step up.",
    href: "/programs",
    color: "bg-explore-orange",
    icon: "⛰️",
  },
] as const;

export type CoreProgram = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  image: string;
  heroImage?: string;
};

export const CORE_PROGRAMS: CoreProgram[] = [
  {
    slug: "nature-lab",
    title: "Nature Lab",
    tagline: "Science in the wild",
    description: "Hands-on ecology, wildlife tracking, and field science adventures.",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
  },
  {
    slug: "trail-academy",
    title: "Trail Academy",
    tagline: "Learn while you move",
    description: "Hiking-based lessons in geography, history, and outdoor skills.",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
  },
  {
    slug: "creative-wild",
    title: "Creative Wild",
    tagline: "Art meets adventure",
    description: "Nature journaling, photography, and storytelling in the outdoors.",
    image: BRAND_IMAGES.creativeWildCard,
    heroImage: BRAND_IMAGES.creativeWild,
  },
  {
    slug: "stem-outdoors",
    title: "STEM Outdoors",
    tagline: "Build. Test. Explore.",
    description: "Engineering challenges, coding camps, and maker projects under open skies.",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
  },
  {
    slug: "leadership-trails",
    title: "Leadership Trails",
    tagline: "Grow bold hearts",
    description: "Team challenges, mentorship, and service projects that build confidence.",
    image: BRAND_IMAGES.leadershipTrailsCard,
    heroImage: BRAND_IMAGES.leadershipTrails,
  },
  {
    slug: "family-adventures",
    title: "Family Adventures",
    tagline: "Explore together",
    description: "Weekend workshops and seasonal events for families who learn as a team.",
    image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
  },
];

export const DIFFERENTIATORS = [
  {
    title: "Real-World Learning",
    description: "Every program connects lessons to trails, forests, waterways, and community spaces—not just desks.",
    icon: "🌍",
  },
  {
    title: "Small Groups",
    description: "Intentionally sized cohorts so every explorer gets attention, encouragement, and room to grow.",
    icon: "👥",
  },
  {
    title: "Expert Guides",
    description: "Educators, naturalists, and mentors who bring passion and safety to every adventure.",
    icon: "🧭",
  },
  {
    title: "Inclusive Community",
    description: "Programs designed for homeschoolers, traditional students, and families from all backgrounds.",
    icon: "🤝",
  },
  {
    title: "Flexible Formats",
    description: "Single-day events, multi-week courses, and custom program requests to fit your schedule.",
    icon: "📅",
  },
  {
    title: "Sponsor-A-Kid Impact",
    description: "Donations directly fund scholarships so cost never blocks a child from exploring more.",
    icon: "💚",
  },
] as const;

export const HERO_IMAGES = {
  home: BRAND_IMAGES.outdoorEducation,
  about: BRAND_IMAGES.outdoorEducation,
  events: "https://images.unsplash.com/photo-1478131143081-80f7f84b84c7?w=1920&q=80",
  books: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&q=80",
  courses: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80",
  programs: BRAND_IMAGES.leadershipTrails,
  gallery: BRAND_IMAGES.outdoorEducationSquare,
  contact: "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1920&q=80",
  sponsor: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1920&q=80",
} as const;
