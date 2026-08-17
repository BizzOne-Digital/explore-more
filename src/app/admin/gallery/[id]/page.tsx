"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface GalleryCategory {
  _id: string;
  name: string;
  slug: string;
}

interface GalleryImage {
  _id: string;
  title: string;
  caption?: string;
  description?: string;
  imageUrl: string;
  altText?: string;
  categoryId?: string;
  featured: boolean;
  order: number;
  status: "draft" | "published";
  publishedToWebsite: boolean;
}

export default function EditGalleryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<GalleryImage>>({
    title: "",
    caption: "",
    description: "",
    imageUrl: "",
    altText: "",
    categoryId: "",
    featured: false,
    status: "draft",
    publishedToWebsite: false,
    order: 0,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [imageRes, categoriesRes] = await Promise.all([
          fetch(`/api/admin/gallery/${id}`),
          fetch("/api/admin/gallery/categories"),
        ]);

        if (imageRes.ok) {
          const imageData = await imageRes.json();
          setFormData(imageData.data);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  function handleChange(field: keyof GalleryImage, value: GalleryImage[keyof GalleryImage]) {
    setFormData({ ...formData, [field]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/admin/gallery");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update photo");
        setSaving(false);
      }
    } catch (error) {
      alert("Failed to update photo");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this photo? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/gallery");
      } else {
        alert("Failed to delete photo");
      }
    } catch (error) {
      alert("Failed to delete photo");
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/gallery"
            className="rounded-lg border border-white/10 bg-white/5 p-2 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Photo</h1>
            <p className="mt-1 text-white/60">Update photo details and settings</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-red-400 transition hover:bg-red-500/20"
        >
          <Trash2 className="h-4 w-4" />
          Delete Photo
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <ImageUpload
            label="Photo"
            value={formData.imageUrl || ""}
            onChange={(url) => handleChange("imageUrl", url)}
            folder="gallery"
          />
        </div>

        {/* Basic Details */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-medium text-white">Photo Details</h3>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Caption (optional)
              </label>
              <input
                type="text"
                value={formData.caption || ""}
                onChange={(e) => handleChange("caption", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Short caption displayed with the photo"
              />
              <p className="mt-1 text-xs text-white/40">
                Captions are optional and not required
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Description (optional)
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Detailed description (optional)"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Alt Text (for accessibility)
              </label>
              <input
                type="text"
                value={formData.altText || ""}
                onChange={(e) => handleChange("altText", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Describe the image for screen readers"
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 text-lg font-medium text-white">Settings</h3>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Category
              </label>
              <select
                value={formData.categoryId || ""}
                onChange={(e) => handleChange("categoryId", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Display Order
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => handleChange("order", parseInt(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                min="0"
              />
              <p className="mt-1 text-xs text-white/40">
                Lower numbers appear first
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => handleChange("featured", e.target.checked)}
                  className="h-4 w-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="featured" className="text-sm text-white/80">
                  Mark as featured
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="publishedToWebsite"
                  checked={formData.publishedToWebsite}
                  onChange={(e) =>
                    handleChange("publishedToWebsite", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="publishedToWebsite" className="text-sm text-white/80">
                  Publish to Website
                </label>
              </div>
            </div>
          </div>
        </div>

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
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
