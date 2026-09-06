"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Trash2, Upload } from "lucide-react";
import { DragDropZone } from "@/components/admin/DragDropZone";

interface CertificateDesign {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageType: "jpg" | "png";
  isActive: boolean;
  createdAt: string;
}

export default function CertificateDesignsPage() {
  const [designs, setDesigns] = useState<CertificateDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const loadDesigns = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/certificate-designs");
      const json = await res.json();
      if (json.success) {
        setDesigns(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load certificate designs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDesigns();
  }, [loadDesigns]);

  function handleFileSelect(files: File[]) {
    const selected = files[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      alert("Please upload a JPG or PNG image.");
      return;
    }

    if (selected.size > 8 * 1024 * 1024) {
      alert("Image must be 8MB or smaller.");
      return;
    }

    setFile(selected);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selected);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !name.trim()) {
      alert("Please add a name and image.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name.trim());
      formData.append("description", description.trim());

      const res = await fetch("/api/admin/certificate-designs", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Upload failed");
      }

      setName("");
      setDescription("");
      setFile(null);
      setPreview(null);
      await loadDesigns();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function toggleActive(design: CertificateDesign) {
    const res = await fetch(`/api/admin/certificate-designs/${design._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !design.isActive }),
    });
    const json = await res.json();
    if (json.success) {
      setDesigns((prev) =>
        prev.map((item) =>
          item._id === design._id ? { ...item, isActive: !design.isActive } : item
        )
      );
    }
  }

  async function deleteDesign(design: CertificateDesign) {
    if (!confirm(`Delete "${design.name}"? This cannot be undone.`)) return;

    const res = await fetch(`/api/admin/certificate-designs/${design._id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.success) {
      setDesigns((prev) => prev.filter((item) => item._id !== design._id));
    } else {
      alert(json.error || "Could not delete design");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="rounded-lg border border-white/10 bg-white/5 p-2 transition hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Certificate Designs</h1>
          <p className="mt-1 text-white/60">
            Upload new certificate backgrounds for the public certificate generator
          </p>
        </div>
      </div>

      <form onSubmit={handleUpload} className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-medium text-white">Upload a new design</h2>
        <p className="mt-1 text-sm text-white/60">
          Use a blank certificate image (landscape, roughly 4:3). Parents can drag text into place
          after choosing your design.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <DragDropZone
            disabled={uploading}
            accept="image/jpeg,image/png,image/jpg"
            onFiles={handleFileSelect}
            className="flex h-56 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-white/5 transition hover:border-white/30 hover:bg-white/10"
            dragActiveClassName="border-explore-teal bg-explore-teal/10"
          >
            {({ dragOver }) =>
              preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-full max-w-full rounded-lg object-contain p-2"
                />
              ) : (
                <>
                  <Upload className={`h-10 w-10 ${dragOver ? "text-explore-teal" : "text-white/40"}`} />
                  <p className="mt-3 text-sm font-medium text-white/80">
                    Drag & drop or click to select
                  </p>
                  <p className="mt-1 text-xs text-white/50">JPG or PNG, up to 8MB</p>
                </>
              )
            }
          </DragDropZone>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Design name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Summer Adventure 2026"
                required
                disabled={uploading}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Short description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Shown when parents pick a certificate style"
                disabled={uploading}
              />
            </div>
            <button
              type="submit"
              disabled={uploading || !file || !name.trim()}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Add certificate design"}
            </button>
          </div>
        </div>
      </form>

      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-medium text-white">Uploaded designs</h2>
        {loading ? (
          <p className="mt-4 text-sm text-white/60">Loading…</p>
        ) : designs.length === 0 ? (
          <p className="mt-4 text-sm text-white/60">No custom designs yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {designs.map((design) => (
              <div
                key={design._id}
                className="overflow-hidden rounded-lg border border-white/10 bg-white/5"
              >
                <div className="relative aspect-[4/3] bg-black/20">
                  <img
                    src={design.imageUrl}
                    alt={design.name}
                    className="h-full w-full object-cover"
                  />
                  {!design.isActive && (
                    <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                      Hidden
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-medium text-white">{design.name}</p>
                  {design.description && (
                    <p className="mt-1 text-xs text-white/60 line-clamp-2">{design.description}</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleActive(design)}
                      className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
                    >
                      {design.isActive ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" /> Hide
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" /> Show
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDesign(design)}
                      className="inline-flex items-center gap-1 rounded border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
