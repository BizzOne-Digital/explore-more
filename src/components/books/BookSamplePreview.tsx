"use client";

import Image from "next/image";
import { useState } from "react";
import { resolveImageUrl } from "@/lib/images/resolve";
import { cn } from "@/lib/cn";

export function BookSamplePreview({
  pages,
  bookTitle,
}: {
  pages: string[];
  bookTitle: string;
}) {
  const samples = pages.filter(Boolean);
  const [active, setActive] = useState(0);

  if (samples.length === 0) return null;

  const safeIndex = Math.min(active, samples.length - 1);
  const mainSrc = resolveImageUrl(samples[safeIndex]);

  return (
    <section className="mt-10 border-t border-explore-charcoal/10 pt-8">
      <h2 className="font-display text-xl font-bold text-explore-charcoal">Look inside</h2>
      <p className="mt-1 text-sm text-explore-charcoal/55">
        Sample pages from <span className="font-medium text-explore-charcoal/75">{bookTitle}</span>
      </p>

      <div className="mt-5 overflow-hidden rounded-2xl border border-explore-charcoal/10 bg-white shadow-md">
        <div className="relative aspect-[3/4] w-full max-h-[min(70vh,520px)] bg-explore-cream">
          <Image
            src={mainSrc}
            alt={`${bookTitle} sample page ${safeIndex + 1}`}
            fill
            className="object-contain p-2 sm:p-4"
            sizes="(max-width: 1024px) 100vw, 50vw"
            unoptimized
          />
        </div>
      </div>

      {samples.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Sample pages">
          {samples.map((url, index) => {
            const thumb = resolveImageUrl(url);
            return (
              <button
                key={`${url}-${index}`}
                type="button"
                role="tab"
                aria-selected={index === safeIndex}
                onClick={() => setActive(index)}
                className={cn(
                  "relative block h-20 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition",
                  index === safeIndex
                    ? "border-explore-teal ring-2 ring-explore-teal/30"
                    : "border-explore-charcoal/15 opacity-80 hover:opacity-100"
                )}
              >
                <Image
                  src={thumb}
                  alt={`Sample ${index + 1}`}
                  fill
                  className="object-cover object-top"
                  sizes="56px"
                  unoptimized
                />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
