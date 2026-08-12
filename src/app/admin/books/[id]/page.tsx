import connectDB from "@/lib/db";
import { Book } from "@/models";
import { BookForm } from "@/components/admin/forms/BookForm";
import { serialize, toAdminRecord } from "@/lib/admin/serialize";
import { notFound } from "next/navigation";

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const book = await Book.findById(id).lean();
  if (!book) notFound();
  return <BookForm initialData={toAdminRecord(book)} />;
}
