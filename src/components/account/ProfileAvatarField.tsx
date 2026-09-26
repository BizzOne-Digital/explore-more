"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader, Upload } from "lucide-react";

export function ProfileAvatarField({
  initialAvatar,
  name,
}: {
  initialAvatar?: string | null;
  name: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(initialAvatar ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function onFileSelected(file: File) {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/account/avatar", { method: "POST", body: formData });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Upload failed");
        return;
      }
      setAvatar(json.data.avatar);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative h-20 w-20 overflow-hidden rounded-full bg-explore-charcoal/10">
        {avatar ? (
          <Image src={avatar} alt="" fill className="object-cover" unoptimized />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-explore-charcoal/60">
            {initials || "?"}
          </span>
        )}
      </div>
      <div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-explore-charcoal/15 px-3 py-2 text-sm font-medium hover:bg-explore-sand disabled:opacity-50"
        >
          {uploading ? <Loader className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Upload photo (optional)"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onFileSelected(file);
          }}
        />
        <p className="mt-1 text-xs text-explore-charcoal/50">JPG or PNG. Shown in your portal where supported.</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
