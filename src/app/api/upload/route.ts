import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { storeUploadedImage, isStoredUploadFolder } from "@/lib/services/stored-upload";
import { STORED_UPLOAD_FOLDERS } from "@/lib/constants";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authResult = await requireRole(["administrator"]);
  if ("error" in authResult) return authResult.error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const folder = String(formData.get("folder") ?? formData.get("category") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
  }

  if (!folder || !isStoredUploadFolder(folder)) {
    return NextResponse.json(
      { success: false, error: `Invalid folder. Allowed: ${STORED_UPLOAD_FOLDERS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const result = await storeUploadedImage(file, folder);
    return NextResponse.json(
      {
        success: true,
        url: result.url,
        filename: result.filename,
        size: result.size,
        folder: result.folder,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
