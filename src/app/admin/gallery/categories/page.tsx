"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader, Trash2 } from "lucide-react";

interface GalleryCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
}

export default function GalleryCategoriesPage() {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/gallery/categories");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load categories");
      }
      setCategories(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/gallery/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create category");
      }
      setName("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? Photos will keep their data but lose this category link.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/gallery/categories/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Delete failed");
      }
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/gallery"
          className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
          aria-label="Back to gallery"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Gallery Categories</h1>
          <p className="mt-1 text-white/60">Organize photos by category when uploading gallery images.</p>
        </div>
      </div>

      <form
        onSubmit={handleCreate}
        className="max-w-xl space-y-4 rounded-xl border border-white/10 bg-white/5 p-6"
      >
        <h2 className="font-semibold text-white">Add category</h2>
        <div>
          <label htmlFor="category-name" className="mb-1 block text-sm text-white/70">Name</label>
          <input
            id="category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-white"
            placeholder="e.g. Field trips"
          />
        </div>
        <div>
          <label htmlFor="category-description" className="mb-1 block text-sm text-white/70">
            Description (optional)
          </label>
          <input
            id="category-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-white"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add category"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="rounded-xl border border-white/10 bg-white/5">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-white/60">
            <Loader className="h-5 w-5 animate-spin" />
            Loading categories…
          </div>
        ) : categories.length === 0 ? (
          <p className="py-12 text-center text-white/50">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {categories.map((category) => (
              <li
                key={category._id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">{category.name}</p>
                  <p className="text-xs text-white/40">/{category.slug}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(category._id)}
                  className="rounded-lg p-2 text-red-300 hover:bg-white/10"
                  aria-label={`Delete ${category.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
