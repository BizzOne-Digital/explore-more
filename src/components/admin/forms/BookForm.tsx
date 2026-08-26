"use client";

import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FormField,
  TextInput,
  TextArea,
  SelectInput,
  CheckboxInput,
  FormActions,
  FormSection,
} from "@/components/admin/forms";
import { PageHeader } from "@/components/admin/PageHeader";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { DigitalFileUpload } from "@/components/admin/DigitalFileUpload";
import { safeSlug } from "@/lib/utils";

const optionalUsdAmount = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const n = Number(val);
    return Number.isFinite(n) ? n : undefined;
  },
  z.number().min(0).optional()
);

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1),
  author: z.string().min(1, "Author is required"),
  subtitle: z.string().optional(),
  coverImage: z.string().optional(),
  shortDescription: z.string().min(1, "Short description is required"),
  fullDescription: z.string().min(1, "Full description is required"),
  priceAmount: z.coerce.number().min(0, "Price must be 0 or greater"),
  salePriceAmount: optionalUsdAmount,
  isbn: z.string().optional(),
  format: z.string().optional(),
  pageCount: z.coerce.number().optional(),
  ageRange: z.string().optional(),
  category: z.string().optional(),
  inventory: z.coerce.number().min(0),
  stockStatus: z.enum(["in_stock", "low_stock", "out_of_stock"]),
  status: z.enum(["draft", "published", "archived"]),
  publishedToWebsite: z.boolean(),
  featured: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function BookForm({
  initialData,
  isNew = false,
}: {
  initialData?: Record<string, unknown> & { _id?: string };
  isNew?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingDigitalFile, setPendingDigitalFile] = useState<File | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      title: (initialData?.title as string) ?? "",
      slug: (initialData?.slug as string) ?? "",
      author: (initialData?.author as string) ?? "",
      subtitle: (initialData?.subtitle as string) ?? "",
      coverImage: (initialData?.coverImage as string) ?? "",
      shortDescription: (initialData?.shortDescription as string) ?? "",
      fullDescription: (initialData?.fullDescription as string) ?? "",
      priceAmount: (initialData?.priceAmount as number) ?? 0,
      salePriceAmount:
        initialData?.salePriceAmount != null && Number(initialData.salePriceAmount) > 0
          ? Number(initialData.salePriceAmount)
          : undefined,
      isbn: (initialData?.isbn as string) ?? "",
      format: (initialData?.format as string) ?? "",
      pageCount: initialData?.pageCount as number | undefined,
      ageRange: (initialData?.ageRange as string) ?? "",
      category: (initialData?.category as string) ?? "",
      inventory: (initialData?.inventory as number) ?? 0,
      stockStatus: (initialData?.stockStatus as FormData["stockStatus"]) ?? "in_stock",
      status: (initialData?.status as FormData["status"]) ?? "draft",
      publishedToWebsite: (initialData?.publishedToWebsite as boolean) ?? false,
      featured: (initialData?.featured as boolean) ?? false,
    },
  });

  const title = watch("title");
  const status = watch("status");

  useEffect(() => {
    if (isNew && title) setValue("slug", safeSlug(title));
  }, [isNew, title, setValue]);

  async function uploadDigitalFile(bookId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bookId", bookId);

    const response = await fetch("/api/admin/books/upload-digital", {
      method: "POST",
      body: formData,
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error ?? "PDF upload failed");
    }
  }

  async function onSubmit(data: FormData, action: "save" | "publish" | "unpublish" = "save") {
    setError(null);
    
    const finalData = { ...data };

    // Handle publish/unpublish actions
    if (action === "publish") {
      finalData.status = "published";
      finalData.publishedToWebsite = true;
    } else if (action === "unpublish") {
      finalData.publishedToWebsite = false;
    }

    if (
      finalData.salePriceAmount == null ||
      finalData.salePriceAmount <= 0 ||
      finalData.salePriceAmount >= finalData.priceAmount
    ) {
      delete finalData.salePriceAmount;
    }

    const url = isNew ? "/api/admin/books" : `/api/admin/books/${initialData?._id}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalData),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.error ?? "Save failed");
      return;
    }

    const savedBookId = isNew
      ? String((json.data as { _id?: string })?._id ?? "")
      : String(initialData?._id ?? "");

    if (isNew && pendingDigitalFile && savedBookId) {
      try {
        await uploadDigitalFile(savedBookId, pendingDigitalFile);
      } catch (err) {
        setError(
          err instanceof Error
            ? `Book saved but PDF upload failed: ${err.message}`
            : "Book saved but PDF upload failed"
        );
        router.push(`/admin/books/${savedBookId}`);
        router.refresh();
        return;
      }
    }

    router.push(savedBookId && isNew && pendingDigitalFile ? `/admin/books/${savedBookId}` : "/admin/books");
    router.refresh();
  }

  async function handleDelete() {
    if (!initialData?._id) return;
    if (!confirm("Are you sure you want to delete this book? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/books/${initialData._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Delete failed");
        return;
      }
      router.push("/admin/books");
      router.refresh();
    } catch (err) {
      setError("Delete failed");
    }
  }

  return (
    <div>
      <PageHeader title={isNew ? "New Book" : "Edit Book"} />
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit((data) => onSubmit(data, "save"))} className="space-y-6">
        <FormSection title="Book Details">
          <FormField label="Title" error={errors.title} required className="sm:col-span-2">
            <TextInput registration={register("title")} error={errors.title} />
          </FormField>
          <FormField label="Slug" error={errors.slug} required>
            <TextInput registration={register("slug")} error={errors.slug} />
          </FormField>
          <FormField label="Author" error={errors.author} required>
            <TextInput registration={register("author")} error={errors.author} />
          </FormField>
          <FormField label="Subtitle" error={errors.subtitle} className="sm:col-span-2">
            <TextInput registration={register("subtitle")} error={errors.subtitle} />
          </FormField>
          <FormField label="Short Description" error={errors.shortDescription} required className="sm:col-span-2">
            <TextArea registration={register("shortDescription")} error={errors.shortDescription} rows={3} />
          </FormField>
          <FormField label="Full Description" error={errors.fullDescription} required className="sm:col-span-2">
            <TextArea registration={register("fullDescription")} error={errors.fullDescription} rows={6} />
          </FormField>
        </FormSection>

        <FormSection title="Cover Image">
          <div className="sm:col-span-2">
            <ImageUpload
              label="Book Cover"
              value={watch("coverImage") || ""}
              onChange={(url) => setValue("coverImage", url)}
              folder="books"
            />
          </div>
        </FormSection>

        <FormSection title="Book Information">
          <FormField label="ISBN" error={errors.isbn}>
            <TextInput registration={register("isbn")} error={errors.isbn} placeholder="978-3-16-148410-0" />
          </FormField>
          <FormField label="Format" error={errors.format}>
            <TextInput registration={register("format")} error={errors.format} placeholder="e.g., Hardcover, Paperback" />
          </FormField>
          <FormField label="Page Count" error={errors.pageCount}>
            <TextInput registration={register("pageCount")} error={errors.pageCount} type="number" />
          </FormField>
          <FormField label="Age Range" error={errors.ageRange}>
            <TextInput registration={register("ageRange")} error={errors.ageRange} placeholder="e.g., 8-12 years" />
          </FormField>
          <FormField label="Category" error={errors.category} className="sm:col-span-2">
            <TextInput registration={register("category")} error={errors.category} placeholder="e.g., Fiction, Non-fiction, Educational" />
          </FormField>
        </FormSection>

        <FormSection title="Pricing & Inventory">
          <FormField
            label="Regular Price (USD)"
            error={errors.priceAmount}
            required
            hint="Original list price shown with strikethrough when on sale"
          >
            <TextInput registration={register("priceAmount")} type="number" step="0.01" error={errors.priceAmount} placeholder="19.99" />
          </FormField>
          <FormField
            label="Sale Price (USD)"
            error={errors.salePriceAmount}
            hint="Optional. Must be lower than regular price. Leave empty if not on sale."
          >
            <TextInput registration={register("salePriceAmount")} type="number" step="0.01" error={errors.salePriceAmount} placeholder="14.99" />
          </FormField>
          <FormField label="Inventory" error={errors.inventory} required>
            <TextInput registration={register("inventory")} type="number" error={errors.inventory} />
          </FormField>
          <FormField label="Stock Status" error={errors.stockStatus}>
            <SelectInput
              registration={register("stockStatus")}
              error={errors.stockStatus}
              options={[
                { value: "in_stock", label: "In Stock" },
                { value: "low_stock", label: "Low Stock" },
                { value: "out_of_stock", label: "Out of Stock" },
              ]}
            />
          </FormField>
        </FormSection>

        <FormSection title="Publishing">
          <FormField label="Status" error={errors.status}>
            <SelectInput
              registration={register("status")}
              error={errors.status}
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
                { value: "archived", label: "Archived" },
              ]}
            />
          </FormField>
          <div className="flex flex-col gap-3 sm:col-span-2">
            <CheckboxInput registration={register("publishedToWebsite")} label="Published to Website" />
            <CheckboxInput registration={register("featured")} label="Featured Book" />
          </div>
        </FormSection>

        <FormSection title="Digital Download (PDF)">
          <div className="sm:col-span-2">
            {isNew ? (
              <DigitalFileUpload
                pendingFile={pendingDigitalFile}
                onPendingFileChange={setPendingDigitalFile}
              />
            ) : (
              <DigitalFileUpload
                bookId={initialData?._id as string}
                currentFile={
                  initialData?.digitalFile as
                    | { fileName: string; fileSizeBytes: number; enabled: boolean }
                    | undefined
                }
              />
            )}
          </div>
        </FormSection>

        <div className="flex items-center gap-3 border-t border-white/10 pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-explore-lime px-5 py-2 text-sm font-semibold text-explore-black transition hover:bg-explore-lime/90 disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : "Save as Draft"}
          </button>

          <button
            type="button"
            onClick={() => handleSubmit((data) => onSubmit(data, "publish"))()}
            disabled={isSubmitting}
            className="rounded-lg bg-explore-teal px-5 py-2 text-sm font-semibold text-white transition hover:bg-explore-teal/90 disabled:opacity-50"
          >
            {isSubmitting ? "Publishing…" : "Publish to Website"}
          </button>

          {!isNew && status === "published" && (
            <button
              type="button"
              onClick={() => handleSubmit((data) => onSubmit(data, "unpublish"))()}
              disabled={isSubmitting}
              className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"
            >
              {isSubmitting ? "Unpublishing…" : "Unpublish"}
            </button>
          )}

          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg border border-red-500/30 px-5 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
            >
              Delete
            </button>
          )}

          <Link
            href="/admin/books"
            className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-white/60 transition hover:text-white"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
