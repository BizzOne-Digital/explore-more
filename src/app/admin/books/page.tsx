import type { Metadata } from "next";
import connectDB from "@/lib/db";
import { Book } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { BooksTable, type BookRow } from "@/components/admin/BooksTable";
import { serialize } from "@/lib/admin/serialize";

export const metadata: Metadata = {
  title: "Books",
};

async function getData() {
  await connectDB();
  const items = await Book.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

function mapBookRows(raw: Array<Record<string, unknown>>): BookRow[] {
  return raw.map((item) => ({
    _id: String(item._id),
    title: item.title as string | undefined,
    coverImage: item.coverImage as string | undefined,
    author: item.author as string | undefined,
    priceAmount: item.priceAmount as number | undefined,
    status: item.status as string | undefined,
    publishedToWebsite: item.publishedToWebsite as boolean | undefined,
    stockStatus: item.stockStatus as string | undefined,
    inventory: item.inventory as number | undefined,
  }));
}

export default async function Page() {
  let data: BookRow[] = [];
  let loadError: string | null = null;

  try {
    data = mapBookRows((await getData()) as unknown as Array<Record<string, unknown>>);
  } catch (error) {
    console.error("[admin/books]", error);
    loadError = "Could not load books. Check database connection and try again.";
  }

  return (
    <div>
      <PageHeader
        title="Books"
        description="Manage bookstore inventory"
        action={{ label: "New Book", href: "/admin/books/new" }}
      />
      {loadError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {loadError}
        </div>
      ) : (
        <BooksTable data={data} />
      )}
    </div>
  );
}
