"use client";

import { parseStoredUploadUrl } from "@/lib/uploads/stored-url";

/** Client-side helper: delete a MongoDB-stored upload by its public URL. */
export async function deleteStoredUploadByUrl(url: string): Promise<boolean> {
  if (!parseStoredUploadUrl(url)) return false;

  try {
    const res = await fetch("/api/upload/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const json = await res.json();
    return Boolean(json.success);
  } catch {
    return false;
  }
}
