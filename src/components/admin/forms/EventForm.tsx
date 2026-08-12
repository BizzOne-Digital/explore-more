"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormField, TextInput, TextArea, SelectInput, CheckboxInput, FormActions, FormSection } from "@/components/admin/forms";
import { PageHeader } from "@/components/admin/PageHeader";
import { safeSlug } from "@/lib/utils";
import { useEffect, useState } from "react";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1),
  shortDescription: z.string().min(1),
  fullDescription: z.string().min(1),
  location: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  timezone: z.string(),
  priceCents: z.coerce.number().min(0),
  capacity: z.coerce.number().optional(),
  isOnline: z.boolean(),
  parentRequired: z.boolean(),
  registrationEnabled: z.boolean(),
  featured: z.boolean(),
  status: z.enum(["draft", "published", "cancelled", "completed", "archived"]),
});

type FormData = z.infer<typeof schema>;

export function EventForm({ initialData, isNew = false }: { initialData?: Record<string, unknown> & { _id?: string }; isNew?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: (initialData?.title as string) ?? "",
      slug: (initialData?.slug as string) ?? "",
      shortDescription: (initialData?.shortDescription as string) ?? "",
      fullDescription: (initialData?.fullDescription as string) ?? "",
      location: (initialData?.location as string) ?? "",
      startDate: initialData?.startDate ? new Date(initialData.startDate as string).toISOString().slice(0, 16) : "",
      endDate: initialData?.endDate ? new Date(initialData.endDate as string).toISOString().slice(0, 16) : "",
      timezone: (initialData?.timezone as string) ?? "America/New_York",
      priceCents: (initialData?.priceCents as number) ?? 0,
      capacity: initialData?.capacity as number | undefined,
      isOnline: (initialData?.isOnline as boolean) ?? false,
      parentRequired: (initialData?.parentRequired as boolean) ?? false,
      registrationEnabled: (initialData?.registrationEnabled as boolean) ?? true,
      featured: (initialData?.featured as boolean) ?? false,
      status: (initialData?.status as FormData["status"]) ?? "draft",
    },
  });

  const title = watch("title");
  useEffect(() => {
    if (isNew && title) setValue("slug", safeSlug(title));
  }, [isNew, title, setValue]);

  async function onSubmit(data: FormData) {
    setError(null);
    const payload = { ...data, startDate: new Date(data.startDate), endDate: new Date(data.endDate) };
    const url = isNew ? "/api/admin/events" : `/api/admin/events/${initialData?._id}`;
    const res = await fetch(url, { method: isNew ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (!json.success) { setError(json.error ?? "Save failed"); return; }
    router.push("/admin/events");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title={isNew ? "New Event" : "Edit Event"} />
      {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Event Details">
          <FormField label="Title" error={errors.title} required className="sm:col-span-2">
            <TextInput registration={register("title")} error={errors.title} />
          </FormField>
          <FormField label="Slug" error={errors.slug} required>
            <TextInput registration={register("slug")} error={errors.slug} />
          </FormField>
          <FormField label="Status" error={errors.status}>
            <SelectInput registration={register("status")} error={errors.status} options={[
              { value: "draft", label: "Draft" }, { value: "published", label: "Published" },
              { value: "cancelled", label: "Cancelled" }, { value: "completed", label: "Completed" }, { value: "archived", label: "Archived" },
            ]} />
          </FormField>
          <FormField label="Short Description" error={errors.shortDescription} required className="sm:col-span-2">
            <TextArea registration={register("shortDescription")} error={errors.shortDescription} />
          </FormField>
          <FormField label="Full Description" error={errors.fullDescription} required className="sm:col-span-2">
            <TextArea registration={register("fullDescription")} error={errors.fullDescription} rows={6} />
          </FormField>
          <FormField label="Location" error={errors.location} required>
            <TextInput registration={register("location")} error={errors.location} />
          </FormField>
          <FormField label="Timezone" error={errors.timezone}>
            <TextInput registration={register("timezone")} error={errors.timezone} />
          </FormField>
          <FormField label="Start Date" error={errors.startDate} required>
            <TextInput registration={register("startDate")} error={errors.startDate} type="datetime-local" />
          </FormField>
          <FormField label="End Date" error={errors.endDate} required>
            <TextInput registration={register("endDate")} error={errors.endDate} type="datetime-local" />
          </FormField>
          <FormField label="Price (cents)" error={errors.priceCents}>
            <TextInput registration={register("priceCents")} error={errors.priceCents} type="number" />
          </FormField>
          <FormField label="Capacity" error={errors.capacity}>
            <TextInput registration={register("capacity")} error={errors.capacity} type="number" />
          </FormField>
          <div className="flex flex-col gap-3 sm:col-span-2">
            <CheckboxInput registration={register("isOnline")} label="Online event" />
            <CheckboxInput registration={register("parentRequired")} label="Parent required" />
            <CheckboxInput registration={register("registrationEnabled")} label="Registration enabled" />
            <CheckboxInput registration={register("featured")} label="Featured" />
          </div>
        </FormSection>
        <FormActions isSubmitting={isSubmitting} cancelHref="/admin/events" />
      </form>
    </div>
  );
}
