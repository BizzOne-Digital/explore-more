import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getBookBySlug } from "@/lib/queries/public";
import { getCatalogBook, bookCoverPath } from "@/lib/content/books";
import { formatCents } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { AddToCartButton } from "@/components/forms/AddToCartButton";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = (await getBookBySlug(slug)) ?? getCatalogBook(slug);
  if (!book) return { title: "Book Not Found" };
  return {
    title: book.metaTitle || book.title,
    description: book.metaDescription || book.shortDescription,
  };
}

export default async function BookDetailPage({ params }: Props) {
  const { slug } = await params;
  const book = (await getBookBySlug(slug)) ?? getCatalogBook(slug);
  if (!book) notFound();

  const price = book.salePriceCents ?? book.priceCents;
  const onSale = book.salePriceCents != null && book.salePriceCents < book.priceCents;
  const cover = book.coverImage || bookCoverPath(book.slug);

  return (
    <section className="w-full overflow-x-clip py-28 bg-explore-cream min-h-screen">
      <div className="mx-auto w-full min-w-0 max-w-6xl px-3 sm:px-4">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="relative mx-auto aspect-[3/4] max-w-md overflow-hidden rounded-2xl bg-white shadow-xl lg:mx-0">
            <Image src={cover} alt={book.title} fill className="object-contain p-3" priority sizes="400px" />
          </div>
          <div>
            <h1 className="break-anywhere font-display text-3xl font-bold text-explore-charcoal sm:text-4xl">{book.title}</h1>
            {book.subtitle && <p className="mt-1 text-lg text-explore-charcoal/60">{book.subtitle}</p>}
            <p className="mt-2 text-explore-teal font-semibold">by {book.author}</p>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold text-[#e91e8c]">{formatCents(price)}</span>
              {onSale && (
                <span className="text-lg text-explore-charcoal/40 line-through">{formatCents(book.priceCents)}</span>
              )}
            </div>

            {book.stockStatus === "out_of_stock" && (
              <Badge variant="orange" className="mt-3">Out of Stock</Badge>
            )}
            {book.stockStatus === "low_stock" && (
              <Badge variant="orange" className="mt-3">Low Stock</Badge>
            )}

            <p className="mt-6 text-explore-charcoal/70 leading-relaxed">{book.shortDescription}</p>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-explore-charcoal/60">
              {book.format && <div><span className="font-medium text-explore-charcoal">Format:</span> {book.format}</div>}
              {book.pageCount && <div><span className="font-medium text-explore-charcoal">Pages:</span> {book.pageCount}</div>}
              {book.ageRange && <div><span className="font-medium text-explore-charcoal">Ages:</span> {book.ageRange}</div>}
              {book.isbn && <div><span className="font-medium text-explore-charcoal">ISBN:</span> {book.isbn}</div>}
            </div>

            <div className="mt-8">
              <AddToCartButton book={book} />
            </div>

            <div className="mt-10 pt-8 border-t border-explore-charcoal/10">
              <h2 className="font-display text-xl font-bold mb-4">About This Book</h2>
              <div className="text-explore-charcoal/70 leading-relaxed whitespace-pre-wrap">{book.fullDescription}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
