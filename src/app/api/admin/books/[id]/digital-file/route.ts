import connectDB from "@/lib/db";
import { Book } from "@/models";
import { requireRole } from "@/lib/api/auth-helpers";
import { jsonError } from "@/lib/api/response";
import { getR2DownloadUrl } from "@/lib/services/r2-storage";
import { readBookDigitalFile } from "@/lib/services/book-digital-storage";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const sessionResult = await requireRole(["administrator"]);
  if ("error" in sessionResult) return sessionResult.error;

  const { id } = await params;

  await connectDB();
  const book = await Book.findById(id).lean();
  if (!book?.digitalFile?.enabled) {
    return jsonError("Digital file not found", 404);
  }

  if (
    (book.digitalFile.storage === "local" || book.digitalFile.storage === "mongo") &&
    book.digitalFile.localPath
  ) {
    try {
      const { buffer, mimeType } = await readBookDigitalFile(book.digitalFile);
      const filename = book.digitalFile.fileName || "book.pdf";
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch {
      return jsonError("File not found on server", 404);
    }
  }

  if (book.digitalFile.r2Key) {
    try {
      const downloadUrl = await getR2DownloadUrl(book.digitalFile.r2Key, 900);
      return Response.redirect(downloadUrl, 302);
    } catch {
      return jsonError("Unable to generate download link", 500);
    }
  }

  return jsonError("Digital file storage path missing", 404);
}
