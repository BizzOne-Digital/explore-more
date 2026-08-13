import connectDB from "@/lib/db";
import { Page } from "@/models";
import type { PageKey } from "@/lib/constants";
import {
  getPageSectionCatalog,
  type SectionVisibilityMap,
} from "@/lib/content/page-sections";

export { createSectionChecker, type SectionVisibilityMap } from "@/lib/content/page-sections";
export { mergeSectionStates } from "@/lib/content/page-sections";

export async function getPageSectionVisibility(pageKey: PageKey): Promise<SectionVisibilityMap> {
  const catalog = getPageSectionCatalog(pageKey);
  const visibility = Object.fromEntries(
    catalog.map((section) => [section.internalName, true])
  ) as SectionVisibilityMap;

  try {
    await connectDB();
    const page = await Page.findOne({ key: pageKey }).select("sections").lean();
    if (!page?.sections?.length) return visibility;

    for (const section of page.sections) {
      if (section.internalName in visibility) {
        visibility[section.internalName] = section.visible !== false;
      }
    }
  } catch {
    return visibility;
  }

  return visibility;
}

export async function setPageSectionVisibility(
  pageKey: PageKey,
  internalName: string,
  visible: boolean
) {
  const definition = getPageSectionCatalog(pageKey).find(
    (section) => section.internalName === internalName
  );
  if (!definition) {
    throw new Error("Invalid section");
  }

  await connectDB();

  const page = await Page.findOne({ key: pageKey });
  if (!page) {
    await Page.create({
      key: pageKey,
      title: pageKey.charAt(0).toUpperCase() + pageKey.slice(1).replace(/-/g, " "),
      slug: pageKey === "home" ? "home" : pageKey,
      status: "draft",
      navVisible: true,
      sections: [
        {
          internalName: definition.internalName,
          heading: definition.label,
          visible,
          order: definition.order,
          status: "published",
        },
      ],
    });
    return;
  }

  const index = page.sections.findIndex((section) => section.internalName === internalName);
  if (index >= 0) {
    page.sections[index].visible = visible;
  } else {
    page.sections.push({
      internalName: definition.internalName,
      heading: definition.label,
      visible,
      order: definition.order,
      status: "published",
    });
  }

  await page.save();
}
