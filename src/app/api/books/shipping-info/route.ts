import { z } from "zod";
import connectDB from "@/lib/db";
import { Book } from "@/models";
import { jsonOk, jsonError } from "@/lib/api/response";
import { isBookPublished } from "@/lib/pricing";
import { isBookDigital } from "@/lib/books/is-digital";

const schema = z.object({
  bookIds: z.array(z.string()).min(1).max(50),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid request", 400);
  }

  await connectDB();
  const books = await Book.find({ _id: { $in: parsed.data.bookIds } })
    .select("digitalFile format publishedToWebsite status")
    .lean();

  const info: Record<string, { isDigital: boolean }> = {};
  for (const book of books) {
    if (!isBookPublished(book)) continue;
    info[String(book._id)] = { isDigital: isBookDigital(book) };
  }

  return jsonOk({ books: info });
}
