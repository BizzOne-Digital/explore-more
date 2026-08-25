import { Book } from "@/models";
import type { IOrder } from "@/models/Book";

export interface DigitalDownloadItem {
  bookId: string;
  title: string;
  fileName: string;
  fileType: string;
}

export async function getDigitalDownloadsForOrder(
  order: Pick<IOrder, "items">
): Promise<DigitalDownloadItem[]> {
  const bookIds = order.items.map((item) => item.bookId);
  const books = await Book.find({
    _id: { $in: bookIds },
    "digitalFile.enabled": true,
  })
    .select("title digitalFile")
    .lean();

  return books.map((book) => ({
    bookId: book._id.toString(),
    title: book.title,
    fileName: book.digitalFile?.fileName || `${book.title}.pdf`,
    fileType: book.digitalFile?.fileType || "pdf",
  }));
}
