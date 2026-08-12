import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.exploremoreacademy.com";

  const staticPages = [
    "",
    "/about",
    "/events",
    "/books",
    "/courses",
    "/programs",
    "/sponsor-a-kid",
    "/gallery",
    "/testimonials",
    "/faqs",
    "/contact",
    "/privacy",
    "/terms",
  ];

  return staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
