"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { safeSlug } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1),
  shortDescription: z.string().min(1, "Short description is required"),
  fullDescription: z.string().min(1, "Full description is required"),
  instructor: z.string().optional(),
  category: z.string().optional(),
  ageRange: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  deliveryFormat: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  schedule: z.string().optional(),
  capacity: z.coerce.number().optional(),
  materials: z.string().optional(),
  courseType: z.enum(["free", "paid"]),
  priceAmount: z.coerce.number().min(0),
  isFree: z.boolean(),
  featured: z.boolean(),
  enrollmentStatus: z.enum(["open", "closed", "waitlist"]),
  status: z.enum(["draft", "published", "archived"]),
  publishedToWebsite: z.boolean(),
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
      deliveryFormat: (initialData?.deliveryFormat as string) ?? "",
      startDate: initialData?.startDate ? new Date(initialData.startDate as string).toISOString().slice(0, 10) : "",
      endDate: initialData?.endDate ? new Date(initialData.endDate as string).toISOString().slice(0, 10) : "",
      schedule: (initialData?.schedule as string) ?? "",
      capacity: initialData?.capacity as number | undefined,
      materials: (initialData?.materials as string) ?? "",
      courseType: (initialData?.courseType as FormData["courseType"]) ?? "free",
      priceAmount: (initialData?.priceAmount as number) ?? 0,
      isFree: (initialData?.isFree as boolean) ?? false,
      featured: (initialData?.featured as boolean) ?? false,
      enrollmentStatus: (initialData?.enrollmentStatus as FormData["enrollmentStatus"]) ?? "open",
      status: (initialData?.status as FormData["status"]) ?? "draft",
      publishedToWebsite: (initialData?.publishedToWebsite as boolean) ?? false,
    },
  });

  const title = watch("title");
  const courseType = watch("courseType");
  const status = watch("status");

  useEffect(() => {
    if (isNew && title) setValue("slug", safeSlug(title));
  }, [isNew, title, setValue]);

  async function onSubmit(data: FormData, action: "save" | "publish" | "unpublish" = "save") {
    setError(null);
    
    const finalData = { 
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    };

    // Handle publish/unpublish actions
    if (action === "publish") {
      finalData.status = "published";
      finalData.publishedToWebsite = true;
    } else if (action === "unpublish") {
      finalData.publishedToWebsite = false;
    }

    const url = isNew ? "/api/admin/courses" : `/api/admin/courses/${initialData?._id}`;
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
    router.push("/admin/courses");
    router.refresh();
  }

  async function handleDelete() {
    if (!initialData?._id) return;
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/courses/${initialData._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Delete failed");
        return;
      }
      router.push("/admin/courses");
      router.refresh();
    } catch (err) {
      setError("Delete failed");
    }
  }

  return (
    <div>
      <PageHeader title={isNew ? "New Course" : "Edit Course"} />
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit((data) => onSubmit(data, "save"))} className="space-y-6">
        <FormSection title="Course Details">
          <FormField label="Course Title" error={errors.title} required className="sm:col-span-2">
            <TextInput registration={register("title")} error={errors.title} />
          </FormField>
          <FormField label="Slug" error={errors.slug} required>
            <TextInput registration={register("slug")} error={errors.slug} />
          </FormField>
          <FormField label="Instructor" error={errors.instructor}>
            <TextInput registration={register("instructor")} error={errors.instructor} />
          </FormField>
          <FormField label="Category" error={errors.category}>
            <TextInput registration={register("category")} error={errors.category} placeholder="e.g., Science, Art, Technology" />
          </FormField>
          <FormField label="Age Range" error={errors.ageRange}>
            <TextInput registration={register("ageRange")} error={errors.ageRange} placeholder="e.g., 10-14 years" />
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
          <FormField label="Short Description" error={errors.shortDescription} required className="sm:col-span-2">
            <TextArea registration={register("shortDescription")} error={errors.shortDescription} rows={3} />
          </FormField>
          <FormField label="Full Description" error={errors.fullDescription} required className="sm:col-span-2">
            <TextArea registration={register("fullDescription")} error={errors.fullDescription} rows={6} />
          </FormField>
        </FormSection>

        <FormSection title="Course Schedule & Logistics">
          <FormField label="Start Date" error={errors.startDate}>
            <TextInput registration={register("startDate")} error={errors.startDate} type="date" />
          </FormField>
          <FormField label="End Date" error={errors.endDate}>
            <TextInput registration={register("endDate")} error={errors.endDate} type="date" />
          </FormField>
          <FormField label="Schedule" error={errors.schedule} className="sm:col-span-2" hint="e.g., Mondays & Wednesdays, 3-5 PM">
            <TextInput registration={register("schedule")} error={errors.schedule} placeholder="Days and times" />
          </FormField>
          <FormField label="Delivery Format" error={errors.deliveryFormat}>
            <TextInput registration={register("deliveryFormat")} error={errors.deliveryFormat} placeholder="e.g., In-person, Online, Hybrid" />
          </FormField>
          <FormField label="Capacity" error={errors.capacity} hint="Maximum number of students">
            <TextInput registration={register("capacity")} error={errors.capacity} type="number" />
          </FormField>
          <FormField label="Materials" error={errors.materials} className="sm:col-span-2" hint="What students need to bring or have">
            <TextArea registration={register("materials")} error={errors.materials} rows={3} placeholder="List required materials..." />
          </FormField>
        </FormSection>

        <FormSection title="Pricing">
          <FormField label="Course Type" error={errors.courseType} required>
            <SelectInput
              registration={register("courseType")}
              error={errors.courseType}
              options={[
                { value: "free", label: "Free Course" },
                { value: "paid", label: "Paid Course" },
              ]}
            />
          </FormField>
          {courseType === "paid" && (
            <FormField label="Price (USD)" error={errors.priceAmount} required>
              <TextInput registration={register("priceAmount")} type="number" step="0.01" error={errors.priceAmount} placeholder="99.00" />
            </FormField>
          )}
        </FormSection>

        <FormSection title="Enrollment & Publishing">
          <FormField label="Enrollment Status" error={errors.enrollmentStatus}>
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
          <div className="flex flex-col gap-3 sm:col-span-2">
            <CheckboxInput registration={register("isFree")} label="Free course" />
            <CheckboxInput registration={register("featured")} label="Featured course" />
            <CheckboxInput registration={register("publishedToWebsite")} label="Published to Website" />
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
            href="/admin/courses"
            className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-white/60 transition hover:text-white"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
