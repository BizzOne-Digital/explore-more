"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  ArrowUp,
  ArrowDown,
  Filter,
  Image as ImageIcon,
} from "lucide-react";

interface GalleryImage {
  _id: string;
  title: string;
  caption?: string;
  description?: string;
  imageUrl: string;
  altText?: string;
  categoryId?: string;
  categoryName?: string;
  featured: boolean;
  order: number;
  status: "draft" | "published";
  publishedToWebsite: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GalleryCategory {
  _id: string;
  name: string;
  slug: string;
}

export default function GalleryPage() {
  const router = useRouter();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [publishedFilter, setPublishedFilter] = useState<"all" | "yes" | "no">("all");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [imagesRes, categoriesRes] = await Promise.all([
        fetch("/api/admin/gallery"),
        fetch("/api/admin/gallery/categories"),
      ]);

      if (imagesRes.ok) {
        const imagesData = await imagesRes.json();
        setImages(imagesData.data || []);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setImages(images.filter((img) => img._id !== id));
      } else {
        alert("Failed to delete image");
      }
    } catch (error) {
      alert("Failed to delete image");
    }
  }

  async function togglePublish(id: string, currentState: boolean) {
    try {
      const res = await fetch(`/api/admin/gallery/${id}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishedToWebsite: !currentState }),
      });

      if (res.ok) {
        setImages(
          images.map((img) =>
            img._id === id ? { ...img, publishedToWebsite: !currentState } : img
          )
        );
      } else {
        alert("Failed to update publish status");
      }
    } catch (error) {
      alert("Failed to update publish status");
    }
  }

  async function handleReorder(id: string, direction: "up" | "down") {
    const index = images.findIndex((img) => img._id === id);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === images.length - 1) return;

    const newImages = [...images];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    
    // Swap order values
    const tempOrder = newImages[index].order;
    newImages[index].order = newImages[swapIndex].order;
    newImages[swapIndex].order = tempOrder;

    // Swap positions
    [newImages[index], newImages[swapIndex]] = [newImages[swapIndex], newImages[index]];

    setImages(newImages);

    // Update on server
    try {
      await fetch(`/api/admin/gallery/${id}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newImages.find(img => img._id === id)?.order }),
      });
    } catch (error) {
      console.error("Failed to update order:", error);
      fetchData(); // Revert on error
    }
  }

  const filteredImages = useMemo(() => {
    return images.filter((image) => {
      const matchesSearch =
        searchTerm === "" ||
        image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || image.status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" || image.categoryId === categoryFilter;

      const matchesPublished =
        publishedFilter === "all" ||
        (publishedFilter === "yes" && image.publishedToWebsite) ||
        (publishedFilter === "no" && !image.publishedToWebsite);

      return matchesSearch && matchesStatus && matchesCategory && matchesPublished;
    });
  }, [images, searchTerm, statusFilter, categoryFilter, publishedFilter]);

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
        <div>
          <h1 className="text-3xl font-bold text-white">Gallery Management</h1>
          <p className="mt-1 text-white/60">
            Upload and manage photos for your website gallery
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/gallery/categories"
            className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            <Filter className="h-4 w-4" />
            Manage Categories
          </Link>
          <Link
            href="/admin/gallery/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Upload Photos
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-4 rounded-lg bg-white/5 p-4 md:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search photos..."
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-white placeholder-white/40 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "draft" | "published")}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">
            Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white/80">
            Published to Website
          </label>
          <select
            value={publishedFilter}
            onChange={(e) => setPublishedFilter(e.target.value as "all" | "yes" | "no")}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="yes">Published</option>
            <option value="no">Not Published</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white/5 p-4">
          <div className="text-2xl font-bold text-white">{images.length}</div>
          <div className="text-sm text-white/60">Total Images</div>
        </div>
        <div className="rounded-lg bg-white/5 p-4">
          <div className="text-2xl font-bold text-white">
            {images.filter((img) => img.publishedToWebsite).length}
          </div>
          <div className="text-sm text-white/60">Published</div>
        </div>
        <div className="rounded-lg bg-white/5 p-4">
          <div className="text-2xl font-bold text-white">
            {images.filter((img) => img.status === "draft").length}
          </div>
          <div className="text-sm text-white/60">Drafts</div>
        </div>
        <div className="rounded-lg bg-white/5 p-4">
          <div className="text-2xl font-bold text-white">
            {images.filter((img) => img.featured).length}
          </div>
          <div className="text-sm text-white/60">Featured</div>
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredImages.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-white/5">
          <ImageIcon className="h-12 w-12 text-white/40" />
          <p className="mt-4 text-white/60">No photos found</p>
          <Link
            href="/admin/gallery/new"
            className="mt-4 text-sm text-blue-400 hover:text-blue-300"
          >
            Upload your first photo
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredImages.map((image, index) => (
            <div
              key={image._id}
              className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/5 transition hover:border-white/20"
            >
              {/* Image */}
              <div className="aspect-square overflow-hidden bg-white/10">
                <img
                  src={image.imageUrl}
                  alt={image.altText || image.title}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="truncate font-medium text-white">{image.title}</h3>
                {image.caption && (
                  <p className="mt-1 line-clamp-2 text-xs text-white/60">
                    {image.caption}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap gap-2">
                  {image.featured && (
                    <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400">
                      Featured
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      image.status === "published"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {image.status}
                  </span>
                  {image.publishedToWebsite && (
                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                      On Website
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => router.push(`/admin/gallery/${image._id}`)}
                  className="rounded-lg bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => togglePublish(image._id, image.publishedToWebsite)}
                  className="rounded-lg bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70"
                  title={image.publishedToWebsite ? "Unpublish" : "Publish"}
                >
                  {image.publishedToWebsite ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(image._id)}
                  className="rounded-lg bg-black/50 p-2 text-red-400 backdrop-blur-sm transition hover:bg-black/70"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Reorder Buttons */}
              <div className="absolute bottom-16 right-2 flex flex-col gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => handleReorder(image._id, "up")}
                  disabled={index === 0}
                  className="rounded-lg bg-black/50 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/70 disabled:opacity-30"
                  title="Move Up"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleReorder(image._id, "down")}
                  disabled={index === filteredImages.length - 1}
                  className="rounded-lg bg-black/50 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/70 disabled:opacity-30"
                  title="Move Down"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
              </div>

              {/* Order Number */}
              <div className="absolute left-2 top-2 rounded-lg bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
                #{image.order}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
