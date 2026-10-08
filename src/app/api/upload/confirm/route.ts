import { z } from "zod";
import { requireRole } from "@/lib/api/auth-helpers";
import { STORED_UPLOAD_FOLDERS } from "@/lib/constants";
import { isStoredUploadFolder, registerStoredUploadFromR2 } from "@/lib/services/stored-upload";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const confirmSchema = z.object({
  folder: z.string().min(1),
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  size: z.number().int().positive(),
  r2Key: z.string().min(1).max(512),
});

export async function POST(request: Request) {
  const authResult = await requireRole(["administrator"]);
  if ("error" in authResult) return authResult.error;

  try {
    const body = confirmSchema.parse(await request.json());
    if (!isStoredUploadFolder(body.folder)) {
      return NextResponse.json(
        { success: false, error: `Invalid folder. Allowed: ${STORED_UPLOAD_FOLDERS.join(", ")}` },
        { status: 400 }
      );
    }

    if (!body.r2Key.startsWith(`site/${body.folder}/`)) {
      return NextResponse.json({ success: false, error: "Invalid storage key" }, { status: 400 });
    }

    const result = await registerStoredUploadFromR2({
      folder: body.folder,
      filename: body.filename,
      mimeType: body.mimeType,
      size: body.size,
      r2Key: body.r2Key,
    });

    return NextResponse.json(
      {
        success: true,
        url: result.url,
        filename: result.filename,
        folder: result.folder,
        size: result.size,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Confirm failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
