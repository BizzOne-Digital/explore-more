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
import { gradeSelectOptions, ALL_GRADES_VALUE } from "@/lib/grades";

const schema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  tagline: z.string().min(1),
  shortDescription: z.string().min(1),
  overview: z.string().min(1),
  grade: z.string().min(1, "Grade is required"),
  ageRange: z.string().optional(),
  schedule: z.string().optional(),
  listingOrder: z.coerce.number(),
  featured: z.boolean(),
  sponsorshipEnabled: z.boolean(),
  sponsorshipAmount: z.coerce.number().min(0),
  status: z.enum(["draft", "published", "archived"]),
});

type FormData = z.infer<typeof schema>;

export function ProgramForm({
  initialData,
  isNew = false,
  defaultGrade,
}: {
  initialData?: Record<string, unknown> & { _id?: string };
  isNew?: boolean;
  defaultGrade?: string;
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
      tagline: (initialData?.tagline as string) ?? "",
      shortDescription: (initialData?.shortDescription as string) ?? "",
      overview: (initialData?.overview as string) ?? "",
      ageRange: (initialData?.ageRange as string) ?? "",
      grade: (initialData?.grade as string) ?? defaultGrade ?? "",
      schedule: (initialData?.schedule as string) ?? "",
      listingOrder: (initialData?.listingOrder as number) ?? 0,
      featured: (initialData?.featured as boolean) ?? false,
      sponsorshipEnabled: (initialData?.sponsorshipEnabled as boolean) ?? false,
      sponsorshipAmount: (initialData?.sponsorshipAmount as number) ?? 0,
      status: (initialData?.status as FormData["status"]) ?? "draft",
    },
  });

  const title = watch("title");
  useEffect(() => {
    if (isNew && title) setValue("slug", safeSlug(title));
  }, [isNew, title, setValue]);

  async function onSubmit(data: FormData) {
    setError(null);
    const url = isNew ? "/api/admin/programs" : `/api/admin/programs/${initialData?._id}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, benefits: [], activities: [], faqs: [], detailSections: [], gallery: [] }),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.error ?? "Save failed");
      return;
    }
    router.push(
      data.grade && data.grade !== ALL_GRADES_VALUE
        ? `/admin/programs?grade=${encodeURIComponent(data.grade)}`
        : "/admin/programs"
    );
    router.refresh();
  }

  return (
    <div>
      <PageHeader title={isNew ? "New Program" : "Edit Program"} />
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Program Details">
          <FormField label="Title" error={errors.title} required className="sm:col-span-2">
            <TextInput registration={register("title")} error={errors.title} />
          </FormField>
          <FormField label="Slug" error={errors.slug} required>
            <TextInput registration={register("slug")} error={errors.slug} />
          </FormField>
          <FormField label="Listing Order" error={errors.listingOrder}>
            <TextInput registration={register("listingOrder")} type="number" error={errors.listingOrder} />
          </FormField>
          <FormField label="Tagline" error={errors.tagline} required className="sm:col-span-2">
            <TextInput registration={register("tagline")} error={errors.tagline} />
          </FormField>
          <FormField label="Short Description" error={errors.shortDescription} required className="sm:col-span-2">
            <TextArea registration={register("shortDescription")} error={errors.shortDescription} />
          </FormField>
          <FormField label="Overview" error={errors.overview} required className="sm:col-span-2">
            <TextArea registration={register("overview")} error={errors.overview} rows={6} />
          </FormField>
          <FormField label="Age Range" error={errors.ageRange}>
            <TextInput registration={register("ageRange")} error={errors.ageRange} />
          </FormField>
          <FormField label="Grade" error={errors.grade} required>
            <SelectInput
              registration={register("grade")}
              error={errors.grade}
              options={gradeSelectOptions(false, true)}
              disabled={Boolean(defaultGrade && isNew)}
            />
          </FormField>
          <FormField label="Schedule" error={errors.schedule}>
            <TextInput registration={register("schedule")} error={errors.schedule} />
          </FormField>
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
          <div className="sm:col-span-2">
            <CheckboxInput registration={register("featured")} label="Featured" />
          </div>
        </FormSection>
        <FormSection title="Sponsorship">
          <div className="sm:col-span-2">
            <CheckboxInput
              registration={register("sponsorshipEnabled")}
              label="Available on Sponsor a Kid page"
            />
          </div>
          <FormField label="Suggested sponsorship ($)" error={errors.sponsorshipAmount}>
            <TextInput
              registration={register("sponsorshipAmount")}
              type="number"
              min={0}
              step="0.01"
              error={errors.sponsorshipAmount}
            />
          </FormField>
        </FormSection>
        <FormActions isSubmitting={isSubmitting} cancelHref="/admin/programs" />
      </form>
    </div>
  );
}
