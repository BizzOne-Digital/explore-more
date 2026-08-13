"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
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

const schema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  status: z.enum(["draft", "published"]),
  navVisible: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function PageForm({
  initialData,
  pageKey,
  sections = [],
}: {
  initialData?: Partial<FormData>;
  pageKey: string;
  sections?: unknown[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      key: initialData?.key ?? pageKey,
      title: initialData?.title ?? "",
      slug: initialData?.slug ?? pageKey,
      metaTitle: initialData?.metaTitle ?? "",
      metaDescription: initialData?.metaDescription ?? "",
      status: initialData?.status ?? "draft",
      navVisible: initialData?.navVisible !== false,
    },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const res = await fetch(`/api/admin/pages/${pageKey}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, sections }),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.error ?? "Save failed");
      return;
    }
    router.push("/admin/pages");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title={`Edit Page: ${pageKey}`} />
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Page Settings">
          <FormField label="Key" error={errors.key} required>
            <TextInput registration={register("key")} error={errors.key} readOnly />
          </FormField>
          <FormField label="Slug" error={errors.slug} required>
            <TextInput registration={register("slug")} error={errors.slug} />
          </FormField>
          <FormField label="Title" error={errors.title} required className="sm:col-span-2">
            <TextInput registration={register("title")} error={errors.title} />
          </FormField>
          <FormField label="Meta Title" error={errors.metaTitle} className="sm:col-span-2">
            <TextInput registration={register("metaTitle")} error={errors.metaTitle} />
          </FormField>
          <FormField label="Meta Description" error={errors.metaDescription} className="sm:col-span-2">
            <TextArea registration={register("metaDescription")} error={errors.metaDescription} />
          </FormField>
          <FormField label="Status" error={errors.status}>
            <SelectInput
              registration={register("status")}
              error={errors.status}
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
              ]}
            />
          </FormField>
          <div className="sm:col-span-2">
            <CheckboxInput
              registration={register("navVisible")}
              label="Show in header and footer navigation"
            />
          </div>
        </FormSection>
        <FormActions isSubmitting={isSubmitting} cancelHref="/admin/pages" />
      </form>
    </div>
  );
}
