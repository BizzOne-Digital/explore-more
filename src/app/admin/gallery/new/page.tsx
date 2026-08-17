"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X, Save } from "lucide-react";
import Link from "next/link";

interface GalleryCategory {
  _id: string;
  name: string;
  slug: string;
}

interface ImagePreview {
  file: File;
  preview: string;
  title: string;
  caption: string;
  description: string;
  altText: string;
}

export default function NewGalleryPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [publishedToWebsite, setPublishedToWebsite] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/admin/gallery/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    }

    fetchCategories();
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not an image file`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is larger than 10MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImages((prev) => [
          ...prev,
          {
            file,
            preview: e.target?.result as string,
            title: file.name.replace(/\.[^/.]+$/, ""),
            caption: "",
            description: "",
            altText: file.name.replace(/\.[^/.]+$/, ""),
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index));
  }

  function updateImage(index: number, field: keyof ImagePreview, value: string) {
    setImages(
      images.map((img, i) => (i === index ? { ...img, [field]: value } : img))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (images.length === 0) {
      alert("Please select at least one image");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      let successCount = 0;

      for (let i = 0; i < images.length; i++) {
        const image = images[i];

        // Upload image file
        const formData = new FormData();
        formData.append("file", image.file);
        formData.append("folder", "gallery");

        const uploadRes = await fetch("/api/upload/public", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadData.success) {
          console.error(`Failed to upload ${image.title}:`, uploadData.error);
          continue;
        }

        // Create gallery image record
        const imageData = {
          title: image.title,
          caption: image.caption || undefined,
          description: image.description || undefined,
          imageUrl: uploadData.data.url,
          altText: image.altText || image.title,
          categoryId: categoryId || undefined,
          featured,
          status,
          publishedToWebsite,
          order: i,
        };

        const res = await fetch("/api/admin/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(imageData),
        });

        if (res.ok) {
          successCount++;
        }

        setUploadProgress(Math.round(((i + 1) / images.length) * 100));
      }

      if (successCount > 0) {
        alert(`Successfully uploaded ${successCount} of ${images.length} images`);
        router.push("/admin/gallery");
      } else {
        alert("Failed to upload images");
        setUploading(false);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload images");
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/gallery"
          className="rounded-lg border border-white/10 bg-white/5 p-2 transition hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Upload Photos</h1>
          <p className="mt-1 text-white/60">
            Upload individual or multiple photos to the gallery
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <label className="mb-4 block text-lg font-medium text-white">
            Select Photos
          </label>
          
          <div className="space-y-4">
            <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-white/5 transition hover:border-white/30 hover:bg-white/10">
              <Upload className="h-12 w-12 text-white/40" />
              <p className="mt-4 text-white/60">Click to select photos</p>
              <p className="mt-2 text-sm text-white/40">
                PNG, JPG, GIF up to 10MB each (multiple files supported)
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </label>

            {images.length > 0 && (
              <div className="text-sm text-white/60">
                {images.length} photo{images.length > 1 ? "s" : ""} selected
              </div>
            )}
          </div>
        </div>

        {/* Image Previews & Details */}
        {images.length > 0 && (
          <div className="space-y-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="rounded-lg border border-white/10 bg-white/5 p-6"
              >
                <div className="flex items-start gap-6">
                  {/* Preview */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={image.preview}
                      alt="Preview"
                      className="h-32 w-32 rounded-lg border border-white/10 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white transition hover:bg-red-600"
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={image.title}
                        onChange={(e) =>
                          updateImage(index, "title", e.target.value)
                        }
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                        disabled={uploading}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">
                        Caption (optional)
                      </label>
                      <input
                        type="text"
                        value={image.caption}
                        onChange={(e) =>
                          updateImage(index, "caption", e.target.value)
                        }
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Short caption for the photo"
                        disabled={uploading}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80">
                        Description (optional)
                      </label>
                      <textarea
                        value={image.description}
                        onChange={(e) =>
                          updateImage(index, "description", e.target.value)
                        }
                        rows={3}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Detailed description (optional)"
                        disabled={uploading}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Common Settings */}
        {images.length > 0 && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h3 className="mb-4 text-lg font-medium text-white">
              Common Settings
            </h3>
            <p className="mb-4 text-sm text-white/60">
              These settings will apply to all uploaded photos
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Category (optional)
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={uploading}
                >
                  <option value="">No Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={uploading}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                />
                <label htmlFor="featured" className="text-sm text-white/80">
                  Mark as featured
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="publishedToWebsite"
                  checked={publishedToWebsite}
                  onChange={(e) => setPublishedToWebsite(e.target.checked)}
                  className="h-4 w-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                />
                <label htmlFor="publishedToWebsite" className="text-sm text-white/80">
                  Publish to Website
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <div className="mb-2 flex items-center justify-between text-sm text-white/80">
              <span>Uploading photos...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href="/admin/gallery"
            className="rounded-lg border border-white/10 bg-white/5 px-6 py-2 text-white transition hover:bg-white/10"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={images.length === 0 || uploading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {uploading ? "Uploading..." : `Upload ${images.length} Photo${images.length > 1 ? "s" : ""}`}
          </button>
        </div>
      </form>
    </div>
  );
}
