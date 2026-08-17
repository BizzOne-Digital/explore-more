import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Book, Order } from "@/models";
import { getR2DownloadUrl } from "@/lib/services/r2-storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params;
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    // Get authenticated user (optional - can allow guest downloads with orderId)
    const session = await auth();

    await connectDB();

    // Get the book
    const book = await Book.findById(bookId);
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Check if digital file exists
    if (!book.digitalFile || !book.digitalFile.enabled) {
      return NextResponse.json({ error: "Digital download not available for this book" }, { status: 404 });
    }

    // Verify purchase
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if order is paid
    if (order.paymentStatus !== "paid") {
      return NextResponse.json({ error: "Order not paid" }, { status: 403 });
    }

    // Check if this book is in the order
    const orderedBook = order.items.find(
      (item) => item.bookId.toString() === bookId
    );

    if (!orderedBook) {
      return NextResponse.json({ error: "Book not found in order" }, { status: 403 });
    }

    // Optional: Check if user owns the order (if logged in)
    if (session?.user?.id && order.userId?.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate signed download URL (valid for 15 minutes)
    const downloadUrl = await getR2DownloadUrl(book.digitalFile.r2Key, 900);

    // Log the download (optional)
    console.log(`Download requested: Book ${bookId}, Order ${orderId}, User ${session?.user?.email || "Guest"}`);

    // Return the signed URL
    return NextResponse.json({
      success: true,
      downloadUrl,
      fileName: book.digitalFile.fileName,
      fileSize: book.digitalFile.fileSizeBytes,
      expiresIn: 900, // seconds
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Download failed" },
      { status: 500 }
    );
  }
}
