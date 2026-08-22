import { NextResponse } from "next/server";
import { getStoredUpload, isStoredUploadFolder } from "@/lib/services/stored-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ folder: string; filename: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { folder, filename } = await params;

  if (!isStoredUploadFolder(folder)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const doc = await getStoredUpload(folder, filename);
  if (!doc?.data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const raw = doc.data as Buffer | { buffer: ArrayBuffer } | Uint8Array;
  const buffer = Buffer.isBuffer(raw)
    ? raw
    : raw instanceof Uint8Array
      ? Buffer.from(raw)
      : Buffer.from(new Uint8Array(raw.buffer));

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(doc.size),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
