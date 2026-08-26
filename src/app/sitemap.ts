import type { MetadataRoute } from "next";
import { hrefToPageKey } from "@/lib/navigation";
import { getHiddenPageKeys } from "@/lib/queries/navigation";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.exploremoreacademy.com";
  const hiddenPageKeys = await getHiddenPageKeys();

  const staticPages = [
    "",
    "/about",
    "/events",
    "/books",
    "/courses",
    "/programs",
    "/dr-boom",
    "/dr-boom/book",
    "/sponsor-a-kid",
    "/gallery",
    "/testimonials",
    "/faqs",
    "/contact",
    "/privacy",
    "/terms",
  ];

  const visiblePages = staticPages.filter((path) => {
    const pageKey = hrefToPageKey(path);
    if (!pageKey) return true;
    return !hiddenPageKeys.has(pageKey);
  });

  return visiblePages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
