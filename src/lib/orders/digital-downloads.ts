import { Book } from "@/models";
import type { IOrder } from "@/models/Book";
import {
  getDigitalFileName,
  getDigitalFileType,
  hasDownloadableDigitalFile,
} from "@/lib/books/digital-file";
import { isBookDigital } from "@/lib/books/is-digital";

export interface DigitalDownloadItem {
  bookId: string;
  title: string;
  fileName: string;
  fileType: string;
}

export interface OrderBookDeliveryInfo {
  bookId: string;
  title: string;
  isDigital: boolean;
  downloadable: boolean;
  fileName?: string;
  fileType?: string;
}

export async function getDigitalDownloadsForOrder(
  order: Pick<IOrder, "items">
): Promise<DigitalDownloadItem[]> {
  const delivery = await getOrderBookDeliveryInfo(order);
  return delivery
    .filter((item) => item.downloadable)
    .map((item) => ({
      bookId: item.bookId,
      title: item.title,
      fileName: item.fileName || `${item.title}.pdf`,
      fileType: item.fileType || "pdf",
    }));
}

export async function getOrderBookDeliveryInfo(
  order: Pick<IOrder, "items">
): Promise<OrderBookDeliveryInfo[]> {
  const bookIds = order.items.map((item) => item.bookId);
  const books = await Book.find({ _id: { $in: bookIds } })
    .select("title digitalFile format")
    .lean();

  const bookMap = new Map(books.map((book) => [book._id.toString(), book]));

  return order.items.map((item) => {
    const bookId = item.bookId.toString();
    const book = bookMap.get(bookId);
    if (!book) {
      return {
        bookId,
        title: item.title,
        isDigital: false,
        downloadable: false,
      };
    }

    const downloadable = hasDownloadableDigitalFile(book);
    return {
      bookId,
      title: item.title || book.title,
      isDigital: isBookDigital(book),
      downloadable,
      fileName: downloadable ? getDigitalFileName(book) : undefined,
      fileType: downloadable ? getDigitalFileType(book) : undefined,
    };
  });
}

export function filterPendingDigitalItems(delivery: OrderBookDeliveryInfo[]): OrderBookDeliveryInfo[] {
  return delivery.filter((item) => item.isDigital && !item.downloadable);
}

export function filterPhysicalItems(delivery: OrderBookDeliveryInfo[]): OrderBookDeliveryInfo[] {
  return delivery.filter((item) => !item.isDigital);
}
