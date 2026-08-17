import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Book } from "@/models";
import { uploadToR2, generateBookKey } from "@/lib/services/r2-storage";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_TYPES = ["application/pdf", "application/epub+zip", "application/x-mobipocket-ebook", "application/zip"];

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const session = await auth();
    if (!session?.user || session.user.role !== "administrator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bookId = formData.get("bookId") as string;

    if (!file || !bookId) {
      return NextResponse.json({ error: "File and bookId are required" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, EPUB, MOBI, ZIP" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Generate unique key for R2 storage
    const r2Key = generateBookKey(bookId, file.name);

    // Upload to R2
    const uploadResult = await uploadToR2(file, r2Key);

    // Determine file type from MIME type
    let fileType = "pdf";
    if (file.type.includes("epub")) fileType = "epub";
    else if (file.type.includes("mobi")) fileType = "mobi";
    else if (file.type.includes("zip")) fileType = "zip";

    // Update book with digital file information
    book.digitalFile = {
      enabled: true,
      r2Key: uploadResult.key,
      fileName: file.name,
      fileSizeBytes: uploadResult.size,
      fileType,
      uploadedAt: new Date(),
    };

    await book.save();

    return NextResponse.json({
      success: true,
      message: "Digital file uploaded successfully",
      digitalFile: book.digitalFile,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

// Delete digital file
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "administrator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get("bookId");

    if (!bookId) {
      return NextResponse.json({ error: "bookId is required" }, { status: 400 });
    }

    await connectDB();
    const book = await Book.findById(bookId);

    if (!book || !book.digitalFile) {
      return NextResponse.json({ error: "Book or digital file not found" }, { status: 404 });
    }

    // Delete from R2 (optional - you might want to keep files)
    // await deleteFromR2(book.digitalFile.r2Key);

    // Remove digital file info from book
    book.digitalFile = undefined;
    await book.save();

    return NextResponse.json({ success: true, message: "Digital file removed" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
