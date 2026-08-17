import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import { Order, Book } from "@/models";
import { formatCents } from "@/lib/utils";
import { format } from "date-fns";
import { Download, BookOpen, Package } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getPurchasedBooks(userId: string) {
  await connectDB();
  
  // Find all paid orders for this user
  const orders = await Order.find({
    userId,
    paymentStatus: "paid",
  })
    .sort({ createdAt: -1 })
    .lean();

  // Extract unique book IDs
  const bookIds = [...new Set(orders.flatMap((order) => 
    order.items.map((item) => item.bookId.toString())
  ))];

  // Get book details
  const books = await Book.find({
    _id: { $in: bookIds },
  }).lean();

  // Map books with purchase info
  return books.map((book) => {
    const order = orders.find((o) =>
      o.items.some((item) => item.bookId.toString() === book._id.toString())
    );
    
    return {
      ...book,
      orderId: order?._id,
      purchaseDate: order?.createdAt,
      orderNumber: order?.orderNumber,
    };
  });
}

export default async function ParentBooksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/parent/books");

  const purchasedBooks = await getPurchasedBooks(session.user.id);

  // Separate physical and digital books
  const digitalBooks = purchasedBooks.filter((book) => book.digitalFile?.enabled);
  const physicalBooks = purchasedBooks.filter((book) => !book.digitalFile?.enabled);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-explore-charcoal">
          My Books
        </h1>
        <p className="mt-2 text-explore-charcoal/60">
          Access your purchased books and digital downloads
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-explore-teal/20 p-3">
              <BookOpen className="h-6 w-6 text-explore-teal" />
            </div>
            <div>
              <p className="text-sm text-explore-charcoal/60">Total Books</p>
              <p className="font-display text-2xl font-bold text-explore-charcoal">
                {purchasedBooks.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/20 p-3">
              <Download className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-explore-charcoal/60">Digital Books</p>
              <p className="font-display text-2xl font-bold text-explore-charcoal">
                {digitalBooks.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/20 p-3">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-explore-charcoal/60">Physical Books</p>
              <p className="font-display text-2xl font-bold text-explore-charcoal">
                {physicalBooks.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* No Books */}
      {purchasedBooks.length === 0 && (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <BookOpen className="h-16 w-16 mx-auto text-explore-charcoal/30 mb-4" />
          <h3 className="font-display text-xl font-semibold text-explore-charcoal mb-2">
            No Books Yet
          </h3>
          <p className="text-explore-charcoal/60 mb-6">
            You haven&apos;t purchased any books yet. Browse our collection to get started!
          </p>
          <Link
            href="/books"
            className="inline-block rounded-full bg-explore-teal px-6 py-3 text-sm font-semibold text-white hover:bg-explore-teal/90 transition-colors"
          >
            Browse Books
          </Link>
        </div>
      )}

      {/* Digital Books Section */}
      {digitalBooks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold text-explore-charcoal">
              📥 Digital Downloads
            </h2>
            <span className="text-sm text-explore-charcoal/60">
              {digitalBooks.length} {digitalBooks.length === 1 ? "book" : "books"}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {digitalBooks.map((book) => (
              <div
                key={book._id.toString()}
                className="group rounded-xl bg-white shadow-sm hover:shadow-lg transition-all overflow-hidden"
              >
                {/* Book Cover */}
                {book.coverImage && (
                  <div className="aspect-[3/4] overflow-hidden bg-explore-sand">
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="p-4">
                  {/* Book Info */}
                  <h3 className="font-semibold text-explore-charcoal line-clamp-2 mb-1">
                    {book.title}
                  </h3>
                  <p className="text-sm text-explore-charcoal/60 mb-3">
                    by {book.author}
                  </p>

                  {/* Digital File Info */}
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-3">
                    <div className="flex items-center gap-2 text-blue-700 text-sm">
                      <Download className="h-4 w-4" />
                      <span className="font-medium">
                        {book.digitalFile?.fileType.toUpperCase()} •{" "}
                        {((book.digitalFile?.fileSizeBytes ?? 0) / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>
                  </div>

                  {/* Purchase Info */}
                  <p className="text-xs text-explore-charcoal/50 mb-3">
                    Purchased: {book.purchaseDate ? format(new Date(book.purchaseDate), "MMM dd, yyyy") : "—"}
                  </p>

                  {/* Download Button */}
                  <a
                    href={`/api/books/download/${book._id}?orderId=${book.orderId}`}
                    className="flex items-center justify-center gap-2 w-full rounded-lg bg-explore-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-explore-teal/90 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Book
                  </a>

                  {/* Order Link */}
                  <Link
                    href={`/parent/receipts?order=${book.orderNumber}`}
                    className="block mt-2 text-center text-xs text-explore-charcoal/60 hover:text-explore-teal transition-colors"
                  >
                    View Order #{book.orderNumber}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Physical Books Section */}
      {physicalBooks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold text-explore-charcoal">
              📦 Physical Books
            </h2>
            <span className="text-sm text-explore-charcoal/60">
              {physicalBooks.length} {physicalBooks.length === 1 ? "book" : "books"}
            </span>
          </div>

          <div className="rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-explore-cream border-b border-explore-charcoal/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-explore-charcoal">
                      Book
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-explore-charcoal">
                      Author
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-explore-charcoal">
                      Purchased
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-explore-charcoal">
                      Order
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-explore-charcoal/5">
                  {physicalBooks.map((book) => (
                    <tr key={book._id.toString()} className="hover:bg-explore-cream transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {book.coverImage && (
                            <img
                              src={book.coverImage}
                              alt={book.title}
                              className="h-16 w-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium text-explore-charcoal">
                              {book.title}
                            </p>
                            {book.subtitle && (
                              <p className="text-sm text-explore-charcoal/60">
                                {book.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-explore-charcoal">
                        {book.author}
                      </td>
                      <td className="px-4 py-3 text-sm text-explore-charcoal/60">
                        {book.purchaseDate ? format(new Date(book.purchaseDate), "MMM dd, yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/parent/receipts?order=${book.orderNumber}`}
                          className="text-sm text-explore-teal hover:underline"
                        >
                          #{book.orderNumber}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      {purchasedBooks.length > 0 && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
          <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Download Information</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Digital books can be downloaded anytime from this page</li>
            <li>• Download links are valid for 15 minutes for security</li>
            <li>• You can download your books multiple times</li>
            <li>• Physical books are shipped to your registered address</li>
            <li>• Check your email for shipping confirmation</li>
          </ul>
        </div>
      )}
    </div>
  );
}
