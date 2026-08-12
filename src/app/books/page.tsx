import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAllPublishedBooks } from "@/lib/queries/public";
import { BOOK_CATALOG, BOOK_AUTHOR } from "@/lib/content/books";
import { PageHero } from "@/components/ui/PageHero";
import { HERO_IMAGES } from "@/lib/content/home";
import { BookCard } from "@/components/cards/BookCard";

import type { PublicBook } from "@/types/public";

export const metadata: Metadata = {
  title: "Bookstore",
  description: "Curated books for young explorers from Explore More Academy.",
};

function catalogFallbackBooks(): PublicBook[] {
  return BOOK_CATALOG.map((book, index) => ({
    _id: `catalog-${book.slug}`,
    slug: book.slug,
    title: book.title,
    author: BOOK_AUTHOR,
    shortDescription: book.shortDescription,
    fullDescription: book.fullDescription,
    coverImage: book.coverImage,
    priceCents: book.priceCents,
    stockStatus: "in_stock",
    featured: book.featured,
  }));
}

export default async function BooksPage() {
  const dbBooks = await getAllPublishedBooks().catch((): PublicBook[] => []);
  const books = dbBooks.length > 0 ? dbBooks : catalogFallbackBooks();

  return (
    <>
      <PageHero
        title="Bookstore"
        subtitle="Stories, field guides, and resources that inspire wild minds and bold hearts."
        eyebrow="Shop"
        image={HERO_IMAGES.books}
        align="center"
      />
      <section className="w-full overflow-x-clip py-16 bg-explore-cream min-h-[50vh]">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {books.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
