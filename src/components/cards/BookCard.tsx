"use client";

import Link from "next/link";
import Image from "next/image";
import { formatCents } from "@/lib/utils";
import { bookCoverPath } from "@/lib/content/books";
import { AddToCartButton } from "@/components/forms/AddToCartButton";

import type { PublicBook } from "@/types/public";

interface BookCardProps {
  book: PublicBook;
}

export function BookCard({ book }: BookCardProps) {
  const price = book.salePriceCents ?? book.priceCents;
  const onSale = book.salePriceCents != null && book.salePriceCents < book.priceCents;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-explore-charcoal/8 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={`/books/${book.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-white">
          <Image
            src={book.coverImage || bookCoverPath(book.slug)}
            alt={book.title}
            fill
            className="object-contain p-2 transition-transform duration-500 hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4 text-center sm:p-5">
        <p className="text-xs text-explore-charcoal/50">Books</p>
        <Link href={`/books/${book.slug}`} className="mt-1 block">
          <h3 className="font-display text-base font-bold leading-snug text-explore-charcoal hover:text-explore-teal sm:text-lg">
            {book.title}
          </h3>
        </Link>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-lg font-bold text-[#e91e8c]">{formatCents(price)}</span>
          {onSale && (
            <span className="text-sm text-explore-charcoal/40 line-through">
              {formatCents(book.priceCents)}
            </span>
          )}
        </div>
        <div className="mt-4">
          <AddToCartButton book={book} variant="storefront" />
        </div>
      </div>
    </article>
  );
}
