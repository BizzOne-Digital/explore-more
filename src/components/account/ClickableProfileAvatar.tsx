"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader } from "lucide-react";

const sizeClasses = {
  sm: "h-9 w-9 text-sm",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-lg",
} as const;

export function ClickableProfileAvatar({
  name,
  initialAvatar,
  size = "md",
  className = "",
}: {
  name: string;
  initialAvatar?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(initialAvatar ?? "");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  async function onFileSelected(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
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

  return (
    <div className={className}>
      <button
        type="button"
        disabled={uploading}
        title="Click or drop a photo to update your profile picture"
        aria-label="Update profile picture"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void onFileSelected(file);
        }}
        className={`relative block shrink-0 overflow-hidden rounded-full bg-explore-charcoal/10 ring-offset-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-explore-teal disabled:cursor-wait ${sizeClasses[size]} ${
          dragOver ? "ring-2 ring-explore-teal" : "hover:ring-2 hover:ring-explore-teal/40"
        }`}
      >
        {avatar ? (
          <Image src={avatar} alt="" fill className="object-cover" unoptimized />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-semibold text-explore-charcoal/60">
            {initials || "?"}
          </span>
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader className="h-5 w-5 animate-spin text-white" />
          </span>
        )}
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
      {error ? <p className="mt-1 max-w-[11rem] text-[10px] leading-tight text-red-600">{error}</p> : null}
    </div>
  );
}
