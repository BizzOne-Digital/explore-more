import { NextResponse } from "next/server";
import {
  getStoredUpload,
  isStoredUploadFolder,
  readStoredUploadBody,
} from "@/lib/services/stored-upload";

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
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await readStoredUploadBody(doc);
  if (!body) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(body.buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": body.mimeType,
      "Content-Length": String(body.buffer.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
