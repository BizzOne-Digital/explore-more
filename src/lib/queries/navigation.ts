import connectDB from "@/lib/db";
import { Page } from "@/models";
import type { PageKey } from "@/lib/constants";
import { filterNavigation, type SiteNavigation } from "@/lib/navigation";

const defaultNavigation = filterNavigation(new Set());

export async function getHiddenPageKeys(): Promise<Set<string>> {
  try {
    await connectDB();
    const pages = await Page.find({ navVisible: false }).select("key").lean();
    return new Set(pages.map((page) => page.key));
  } catch {
    return new Set();
  }
}

export async function getSiteNavigation(): Promise<SiteNavigation> {
  try {
    const hiddenPageKeys = await getHiddenPageKeys();
    return filterNavigation(hiddenPageKeys);
  } catch {
    return defaultNavigation;
  }
}

/** False when admin has hidden the page from the public site (nav + direct URL). */
export async function isPageNavVisible(pageKey: PageKey): Promise<boolean> {
  const hiddenPageKeys = await getHiddenPageKeys();
  return !hiddenPageKeys.has(pageKey);
}
