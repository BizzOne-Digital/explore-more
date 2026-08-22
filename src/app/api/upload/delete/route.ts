import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { deleteStoredUploadByUrl as deleteStoredUpload } from "@/lib/services/stored-upload";
import { parseStoredUploadUrl } from "@/lib/uploads/stored-url";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  url: z.string().min(1),
});

export async function POST(request: Request) {
  const authResult = await requireRole(["administrator"]);
  if ("error" in authResult) return authResult.error;

  try {
    const body = bodySchema.parse(await request.json());
    if (!parseStoredUploadUrl(body.url)) {
      return NextResponse.json({ success: false, error: "Not a stored upload URL" }, { status: 400 });
    }

    await connectDB();
    const deleted = await deleteStoredUpload(body.url);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Delete failed" }, { status: 500 });
  }
}
