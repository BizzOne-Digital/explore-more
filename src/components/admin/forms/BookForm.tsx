"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
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
import { safeSlug } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  author: z.string().min(1),
  shortDescription: z.string().min(1),
  fullDescription: z.string().min(1),
  priceCents: z.coerce.number().min(0),
  salePriceCents: z.coerce.number().optional(),
  inventory: z.coerce.number().min(0),
  stockStatus: z.enum(["in_stock", "low_stock", "out_of_stock"]),
  published: z.boolean(),
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
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: (initialData?.title as string) ?? "",
      slug: (initialData?.slug as string) ?? "",
      author: (initialData?.author as string) ?? "",
      shortDescription: (initialData?.shortDescription as string) ?? "",
      fullDescription: (initialData?.fullDescription as string) ?? "",
      priceCents: (initialData?.priceCents as number) ?? 0,
      salePriceCents: initialData?.salePriceCents as number | undefined,
      inventory: (initialData?.inventory as number) ?? 0,
      stockStatus: (initialData?.stockStatus as FormData["stockStatus"]) ?? "in_stock",
      published: (initialData?.published as boolean) ?? false,
      featured: (initialData?.featured as boolean) ?? false,
    },
  });

  const title = watch("title");
  useEffect(() => {
    if (isNew && title) setValue("slug", safeSlug(title));
  }, [isNew, title, setValue]);

  async function onSubmit(data: FormData) {
    setError(null);
    const url = isNew ? "/api/admin/books" : `/api/admin/books/${initialData?._id}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.error ?? "Save failed");
      return;
    }
    router.push("/admin/books");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title={isNew ? "New Book" : "Edit Book"} />
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          <FormField label="Price (cents)" error={errors.priceCents}>
            <TextInput registration={register("priceCents")} type="number" error={errors.priceCents} />
          </FormField>
          <FormField label="Sale Price (cents)" error={errors.salePriceCents}>
            <TextInput registration={register("salePriceCents")} type="number" error={errors.salePriceCents} />
          </FormField>
          <FormField label="Inventory" error={errors.inventory}>
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
          <FormField label="Short Description" error={errors.shortDescription} required className="sm:col-span-2">
            <TextArea registration={register("shortDescription")} error={errors.shortDescription} />
          </FormField>
          <FormField label="Full Description" error={errors.fullDescription} required className="sm:col-span-2">
            <TextArea registration={register("fullDescription")} error={errors.fullDescription} rows={6} />
          </FormField>
          <div className="flex flex-col gap-3 sm:col-span-2">
            <CheckboxInput registration={register("published")} label="Published" />
            <CheckboxInput registration={register("featured")} label="Featured" />
          </div>
        </FormSection>
        <FormActions isSubmitting={isSubmitting} cancelHref="/admin/books" />
      </form>
    </div>
  );
}
