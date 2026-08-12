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
  shortDescription: z.string().min(1),
  fullDescription: z.string().min(1),
  instructor: z.string().optional(),
  category: z.string().optional(),
  ageRange: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  priceCents: z.coerce.number().min(0),
  isFree: z.boolean(),
  featured: z.boolean(),
  enrollmentStatus: z.enum(["open", "closed", "waitlist"]),
  status: z.enum(["draft", "published", "archived"]),
});

type FormData = z.infer<typeof schema>;

export function CourseForm({
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
      shortDescription: (initialData?.shortDescription as string) ?? "",
      fullDescription: (initialData?.fullDescription as string) ?? "",
      instructor: (initialData?.instructor as string) ?? "",
      category: (initialData?.category as string) ?? "",
      ageRange: (initialData?.ageRange as string) ?? "",
      difficulty: initialData?.difficulty as FormData["difficulty"],
      priceCents: (initialData?.priceCents as number) ?? 0,
      isFree: (initialData?.isFree as boolean) ?? false,
      featured: (initialData?.featured as boolean) ?? false,
      enrollmentStatus: (initialData?.enrollmentStatus as FormData["enrollmentStatus"]) ?? "open",
      status: (initialData?.status as FormData["status"]) ?? "draft",
    },
  });

  const title = watch("title");
  useEffect(() => {
    if (isNew && title) setValue("slug", safeSlug(title));
  }, [isNew, title, setValue]);

  async function onSubmit(data: FormData) {
    setError(null);
    const url = isNew ? "/api/admin/courses" : `/api/admin/courses/${initialData?._id}`;
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
    router.push("/admin/courses");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title={isNew ? "New Course" : "Edit Course"} />
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Course Details">
          <FormField label="Title" error={errors.title} required className="sm:col-span-2">
            <TextInput registration={register("title")} error={errors.title} />
          </FormField>
          <FormField label="Slug" error={errors.slug} required>
            <TextInput registration={register("slug")} error={errors.slug} />
          </FormField>
          <FormField label="Instructor" error={errors.instructor}>
            <TextInput registration={register("instructor")} error={errors.instructor} />
          </FormField>
          <FormField label="Category" error={errors.category}>
            <TextInput registration={register("category")} error={errors.category} />
          </FormField>
          <FormField label="Age Range" error={errors.ageRange}>
            <TextInput registration={register("ageRange")} error={errors.ageRange} />
          </FormField>
          <FormField label="Difficulty" error={errors.difficulty}>
            <SelectInput
              registration={register("difficulty")}
              error={errors.difficulty}
              options={[
                { value: "", label: "—" },
                { value: "beginner", label: "Beginner" },
                { value: "intermediate", label: "Intermediate" },
                { value: "advanced", label: "Advanced" },
              ]}
            />
          </FormField>
          <FormField label="Price (cents)" error={errors.priceCents}>
            <TextInput registration={register("priceCents")} type="number" error={errors.priceCents} />
          </FormField>
          <FormField label="Enrollment" error={errors.enrollmentStatus}>
            <SelectInput
              registration={register("enrollmentStatus")}
              error={errors.enrollmentStatus}
              options={[
                { value: "open", label: "Open" },
                { value: "closed", label: "Closed" },
                { value: "waitlist", label: "Waitlist" },
              ]}
            />
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
          <FormField label="Short Description" error={errors.shortDescription} required className="sm:col-span-2">
            <TextArea registration={register("shortDescription")} error={errors.shortDescription} />
          </FormField>
          <FormField label="Full Description" error={errors.fullDescription} required className="sm:col-span-2">
            <TextArea registration={register("fullDescription")} error={errors.fullDescription} rows={6} />
          </FormField>
          <div className="flex flex-col gap-3 sm:col-span-2">
            <CheckboxInput registration={register("isFree")} label="Free course" />
            <CheckboxInput registration={register("featured")} label="Featured" />
          </div>
        </FormSection>
        <FormActions isSubmitting={isSubmitting} cancelHref="/admin/courses" />
      </form>
    </div>
  );
}
