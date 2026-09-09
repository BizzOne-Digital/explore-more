/** Display + marketing copy for the no-cost parent account tier. */
export const FREE_ACCOUNT_PLAN = {
  id: "free" as const,
  emoji: "📚",
  name: "Free Account",
  tagline: "Purchase books and courses without a monthly membership.",
  features: [
    "Parent portal access",
    "My Books — view and download purchases",
    "My Courses — access enrolled courses",
    "Message Explore More Academy staff",
    "Profile — name, address, phone, password",
    "Billing — payment info & receipts",
    "Upgrade to a full membership anytime",
  ],
  bestFor:
    "Families who only want to buy from the bookstore or enroll in individual courses — no monthly fee.",
  signupHref: "/parent/signup",
  loginHref: "/parent/login",
};
