import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Book } from "@/models";
import { uploadBookDigitalFile } from "@/lib/services/book-digital-storage";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "administrator") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file");
    const bookId = formData.get("bookId");

    if (!(file instanceof File) || typeof bookId !== "string" || !bookId.trim()) {
      return NextResponse.json({ success: false, error: "File and bookId are required" }, { status: 400 });
    }

    await connectDB();

    const book = await Book.findById(bookId);
    if (!book) {
      return NextResponse.json({ success: false, error: "Book not found" }, { status: 404 });
    }

    const uploaded = await uploadBookDigitalFile(file, bookId);

    book.digitalFile = {
      enabled: true,
      storage: uploaded.storage,
      r2Key: uploaded.r2Key,
      localPath: uploaded.localPath,
      fileName: uploaded.fileName,
      fileSizeBytes: uploaded.fileSizeBytes,
      fileType: uploaded.fileType,
      uploadedAt: new Date(),
    };

    await book.save();

    return NextResponse.json({
      success: true,
      message:
        uploaded.storage === "r2"
          ? "Digital file uploaded to cloud storage"
          : uploaded.storage === "mongo"
            ? "Digital file saved to database storage"
            : "Digital file uploaded locally",
      digitalFile: book.digitalFile,
    });
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "PDF upload failed. Please try again.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "administrator") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get("bookId");

    if (!bookId) {
      return NextResponse.json({ success: false, error: "bookId is required" }, { status: 400 });
    }

    await connectDB();
    const book = await Book.findById(bookId);

    if (!book || !book.digitalFile) {
      return NextResponse.json({ success: false, error: "Book or digital file not found" }, { status: 404 });
    }

    book.digitalFile = undefined;
    await book.save();

    return NextResponse.json({ success: true, message: "Digital file removed" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ success: false, error: "Delete failed" }, { status: 500 });
  }
}
