export const DR_BOOM_CONTACT = {
  email: "drboom@exploremoreacademy.com",
  phone: "240-944-1959",
  phoneTel: "+12409441959",
  website: "https://www.exploremoreacademy.com",
} as const;

export const DR_BOOM_IMAGES = {
  logo: "/images/dr-boom/logo.png",
  stage: "/images/dr-boom/stage.png",
  spectacular: "/images/dr-boom/spectacular.png",
} as const;

export const DR_BOOM_SHOW_MARQUEE =
  "⚛ ATOMS • H₂O • CO₂ • FORCE = MASS × ACCELERATION • ΔT • ENERGY • REACTION • PRESSURE • VOLUME • GRAVITY • E = mc² • ⚗ SCIENCE IS AWESOME! •";

export const DR_BOOM_DISCOVERY_STEPS = [
  { emoji: "🤔", title: "Ask Questions", desc: "Curiosity starts every great discovery." },
  { emoji: "🔬", title: "Experiment", desc: "Students see science concepts come alive." },
  { emoji: "👀", title: "Observe", desc: "Watch carefully, notice changes, and think." },
  { emoji: "💡", title: "Discover", desc: "Every experiment leads to a new question." },
] as const;

export const DR_BOOM_VENUES = [
  { emoji: "🏫", title: "Schools", desc: "Assemblies, STEM Week, PBIS celebrations, and science nights." },
  { emoji: "📚", title: "Libraries", desc: "High-energy educational programming for young explorers." },
  { emoji: "⛺", title: "Camps", desc: "Perfect for summer programs and youth organizations." },
  { emoji: "🎪", title: "Community Events", desc: "Festivals, churches, homeschool groups, and family events." },
] as const;

export const DR_BOOM_DEMONSTRATIONS = [
  { emoji: "🫧", title: "Elephant Toothpaste", desc: "An incredible foamy chemical reaction erupts before your eyes." },
  { emoji: "🎈", title: "Balloon Chemistry", desc: "Can chemistry inflate a balloon without anyone blowing into it?" },
  { emoji: "❄️", title: "Instant Snow", desc: "Explore super-absorbent materials by creating fluffy “snow.”" },
  { emoji: "💨", title: "Smoke Rings", desc: "See powerful vortex rings travel across the room." },
  { emoji: "🏓", title: "Floating Ping-Pong Ball", desc: "Discover how moving air can make an object float." },
  { emoji: "🏖️", title: "Floating Beach Ball", desc: "Investigate airflow, pressure, and stability." },
  { emoji: "🌫️", title: "Dry Ice Fog", desc: "Explore temperature, states of matter, and sublimation." },
  { emoji: "💥", title: "Air Pressure", desc: "Discover how powerful the invisible air around us can be." },
] as const;

export const DR_BOOM_SCIENCE_TOPICS = [
  "The Scientific Method",
  "Chemistry",
  "Physics",
  "Air Pressure",
  "States of Matter",
  "Forces & Motion",
  "Energy",
  "Chemical Reactions",
  "Observation",
  "Problem Solving",
  "Prediction",
  "STEM Careers",
] as const;

export const DR_BOOM_JUNIOR_SCIENTIST = [
  { emoji: "🙋", title: "Participate", desc: "Students can help with selected demonstrations and science challenges." },
  { emoji: "📣", title: "Count It Down", desc: "Get the whole audience involved with Dr. Boom’s famous 3…2…1… BOOM!" },
  { emoji: "🏅", title: "Become a Junior Scientist", desc: "Optional certificates and activities extend the experience beyond the stage." },
] as const;

export const DR_BOOM_EXPERIENCE_ADDONS = [
  { emoji: "📜", title: "Certificates", desc: "Junior Scientist certificates for participating students." },
  { emoji: "📸", title: "Meet & Greet", desc: "Photo opportunities and interaction with Dr. Boom." },
  { emoji: "🧪", title: "Activity Stations", desc: "Hands-on STEM stations for an extended science experience." },
  { emoji: "📖", title: "Books & Activities", desc: "Experiment books, coloring books, and classroom extensions." },
] as const;

export const DR_BOOM_SHOW_FAQS = [
  {
    question: "What ages is the program designed for?",
    answer:
      "Dr. Boom Science Spectacular is designed for elementary and middle school audiences, typically ages 5–14. Content is energetic and accessible for younger students while still engaging older explorers.",
  },
  {
    question: "How long is the show?",
    answer:
      "The Science Spectacular runs 45–60 minutes. Booking packages also include shorter meet-and-greet appearances from 15 minutes up to a full hour for festivals and large events.",
  },
  {
    question: "Does Dr. Boom need a stage?",
    answer:
      "A stage or raised area is helpful but not always required. Dr. Boom can perform in gyms, cafeterias, auditoriums, classrooms, libraries, and outdoor event spaces. We’ll discuss your venue when you request a show.",
  },
  {
    question: "Are students involved?",
    answer:
      "Yes! Audience participation is a core part of the experience. Students help with demonstrations, make predictions, and join Dr. Boom’s famous countdown to BOOM!",
  },
  {
    question: "Is the show educational?",
    answer:
      "Absolutely. Every demonstration connects to real science concepts — chemistry, physics, air pressure, states of matter, forces, and the scientific method — wrapped in wild, memorable fun.",
  },
  {
    question: "Can a business sponsor a performance?",
    answer:
      "Yes. Community partners and businesses can sponsor a Dr. Boom Science Spectacular for local schools and organizations. Visit our Become a Sponsor page or contact the Dr. Boom team to learn more.",
  },
] as const;

export interface DrBoomPackage {
  id: string;
  duration: string;
  emoji: string;
  name: string;
  price: string;
  priceNote?: string;
  description: string[];
  featured?: boolean;
  cta: string;
  variant: "standard" | "featured" | "premium" | "custom";
}

export const DR_BOOM_PACKAGES: DrBoomPackage[] = [
  {
    id: "pop-in",
    duration: "15 Minutes",
    emoji: "💥",
    name: "Boom Pop-In",
    price: "$125",
    description: [
      "Quick Dr. Boom appearance",
      "High-energy guest interaction",
      "Great for short event appearances",
      "Photo opportunity as time allows",
    ],
    cta: "Choose Package",
    variant: "standard",
  },
  {
    id: "wacky-meet",
    duration: "30 Minutes",
    emoji: "🧪",
    name: "Wacky Meet & Greet",
    price: "$195",
    description: [
      "Dr. Boom character appearance",
      "Meet & greet interaction",
      "Photos with guests",
      "Wacky science personality & crowd engagement",
    ],
    cta: "Choose Package",
    variant: "standard",
  },
  {
    id: "experience",
    duration: "45 Minutes",
    emoji: "⚗",
    name: "Dr. Boom Experience",
    price: "$250",
    description: [
      "Extended character appearance",
      "Audience interaction",
      "Meet & greet",
      "Photo opportunities",
      "Ideal for schools and community events",
    ],
    cta: "Choose Package",
    variant: "standard",
  },
  {
    id: "ultimate",
    duration: "60 Minutes",
    emoji: "🚀",
    name: "Ultimate Meet & Greet",
    price: "$300",
    featured: true,
    description: [
      "Full one-hour Dr. Boom appearance",
      "Maximum guest interaction",
      "Meet & greet",
      "Photos",
      "Great for schools, festivals, libraries & major events",
    ],
    cta: "Book the Best Value",
    variant: "featured",
  },
  {
    id: "corporate",
    duration: "60 Minutes",
    emoji: "🎪",
    name: "Corporate / Festival Appearance",
    price: "$400+",
    description: [
      "Large-event Dr. Boom appearance",
      "Corporate, festival & promotional events",
      "Crowd engagement",
      "Photo opportunities",
      "Custom event needs considered",
    ],
    cta: "Request Quote",
    variant: "premium",
  },
  {
    id: "custom",
    duration: "Custom",
    emoji: "🧬",
    name: "Need Something Wackier?",
    price: "Let's Talk",
    description: [
      "Custom event timing",
      "Special school programs",
      "Multiple appearances",
      "Unique community or promotional events",
    ],
    cta: "Build a Custom Booking",
    variant: "custom",
  },
];

export const DR_BOOM_EVENT_TYPES = [
  { value: "", label: "Choose one" },
  { value: "school", label: "School" },
  { value: "library", label: "Library" },
  { value: "camp", label: "Camp" },
  { value: "festival", label: "Festival / Fair" },
  { value: "community", label: "Community Event" },
  { value: "birthday", label: "Birthday Celebration" },
  { value: "corporate", label: "Corporate Event" },
  { value: "other", label: "Other" },
] as const;

export const DR_BOOM_MARQUEE =
  "⚛ ATOMS • H₂O • CO₂ • FORCE • ENERGY • PRESSURE • MOTION • CHEMISTRY • PHYSICS • EXPERIMENT • DISCOVERY • BOOM! •";

export const DR_BOOM_FAQS = [
  {
    question: "Does submitting the form confirm my date?",
    answer:
      "No. Submitting a booking request does not automatically confirm your date. The Dr. Boom team reviews availability and will contact you with confirmation, travel details, and any custom-event charges.",
  },
  {
    question: "Is travel included?",
    answer:
      "Travel fees are quoted separately based on your event location. If your event may require Dr. Boom to travel outside the local service area, note that in your request and the team will include travel in your quote.",
  },
  {
    question: "Can schools and organizations request a custom appearance?",
    answer:
      "Yes! Choose the custom package or describe your needs in the booking form. Dr. Boom can tailor timing, multiple appearances, and special school or community programs.",
  },
  {
    question: "Which package is the featured option?",
    answer:
      "The 60-minute Ultimate Meet & Greet ($300) is our featured package — maximum guest interaction, meet & greet, and photos for schools, festivals, libraries, and major events.",
  },
] as const;

export function formatDrBoomPackageLabel(pkg: DrBoomPackage): string {
  return `${pkg.name} — ${pkg.duration} — ${pkg.price}`;
}

export const DEFAULT_DR_BOOM_PACKAGE_ID = "ultimate";
