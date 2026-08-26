import type { Metadata } from "next";
import connectDB from "@/lib/db";
import { Book } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { BooksTable, type BookRow } from "@/components/admin/BooksTable";
import { serialize } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const items = await Book.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Books"
        description="Manage bookstore inventory"
        action={{ label: "New Book", href: "/admin/books/new" }}
      />
      <BooksTable data={data as unknown as BookRow[]} />
    </div>
  );
}
