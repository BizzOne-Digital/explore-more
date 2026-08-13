import type { Metadata } from "next";
import Image from "next/image";
import { HERO_IMAGES, BRAND_IMAGES } from "@/lib/content/home";
import { getAllGalleryImages } from "@/lib/queries/public";
import { createSectionChecker, getPageSectionVisibility } from "@/lib/queries/pages";
import type { PublicGalleryImage } from "@/types/public";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from Explore More Academy adventures and programs.",
};

const FALLBACK_IMAGES: PublicGalleryImage[] = [
  { _id: "1", title: "Outdoor Classroom", imageUrl: BRAND_IMAGES.outdoorEducationSquare },
  { _id: "2", title: "Creative Wild", imageUrl: BRAND_IMAGES.creativeWild },
  { _id: "3", title: "Leadership Trails", imageUrl: BRAND_IMAGES.leadershipTrails },
  { _id: "4", title: "Forest Discovery", imageUrl: BRAND_IMAGES.outdoorEducation },
  { _id: "5", title: "Art Meets Adventure", imageUrl: BRAND_IMAGES.creativeWildCard },
  { _id: "6", title: "Trail Teamwork", imageUrl: BRAND_IMAGES.leadershipTrailsCard },
];

export default async function GalleryPage() {
  const show = createSectionChecker(await getPageSectionVisibility("gallery"));
  const dbImages = await getAllGalleryImages().catch((): PublicGalleryImage[] => []);
  const images = dbImages.length > 0 ? dbImages : FALLBACK_IMAGES;

  return (
    <>
      {show("hero") && (
        <PageHero
          title="Adventure Gallery"
          subtitle="Moments from the field — real places, real learning, real joy."
          eyebrow="Photos"
          image={HERO_IMAGES.gallery}
        />
      )}
      {show("grid") && (
        <section className="w-full overflow-x-clip py-16 bg-explore-charcoal min-h-[50vh]">
          <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {images.map((img) => (
                <div key={String(img._id)} className="break-inside-avoid relative rounded-xl overflow-hidden group">
                  <Image
                    src={img.imageUrl}
                    alt={img.altText || img.title}
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-explore-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <div>
                      <p className="text-white font-medium text-sm">{img.title}</p>
                      {img.caption && <p className="text-white/70 text-xs mt-0.5">{img.caption}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
