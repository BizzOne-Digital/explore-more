"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormField, TextInput, TextArea, SelectInput, CheckboxInput, FormActions, FormSection } from "@/components/admin/forms";
import { PageHeader } from "@/components/admin/PageHeader";
import { safeSlug } from "@/lib/utils";
import { useEffect, useState } from "react";
import Link from "next/link";
import { gradeSelectOptions, ALL_GRADES_VALUE } from "@/lib/grades";
import { EventPackagesEditor } from "@/components/admin/EventPackagesEditor";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { deleteStoredUploadByUrl } from "@/lib/services/stored-upload-client";
import { resolveImageUrl } from "@/lib/images/resolve";
import { normalizeEventPackages, type EventPackage } from "@/lib/events/packages";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1),
  grade: z.string().min(1, "Grade is required"),
  shortDescription: z.string().min(1, "Short description is required"),
  fullDescription: z.string().min(1, "Full description is required"),
  coverImage: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  timezone: z.string(),
  eventType: z.enum(["free", "paid"]),
  priceAmount: z.coerce.number().min(0),
  capacity: z.coerce.number().optional(),
  registrationDeadline: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  instructions: z.string().optional(),
  isOnline: z.boolean(),
  parentRequired: z.boolean(),
  registrationEnabled: z.boolean(),
  featured: z.boolean(),
  status: z.enum(["draft", "published", "cancelled", "completed", "archived"]),
  publishedToWebsite: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function EventForm({
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
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [packages, setPackages] = useState<EventPackage[]>(
    () => normalizeEventPackages(initialData?.packages)
  );
  const [gallery, setGallery] = useState<string[]>(
    () => (Array.isArray(initialData?.gallery) ? (initialData.gallery as string[]) : [])
  );
  const [galleryUploadKey, setGalleryUploadKey] = useState(0);
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: (initialData?.title as string) ?? "",
      slug: (initialData?.slug as string) ?? "",
      shortDescription: (initialData?.shortDescription as string) ?? "",
      fullDescription: (initialData?.fullDescription as string) ?? "",
      coverImage: (initialData?.coverImage as string) ?? "",
      location: (initialData?.location as string) ?? "",
      startDate: initialData?.startDate ? new Date(initialData.startDate as string).toISOString().slice(0, 10) : "",
      endDate: initialData?.endDate ? new Date(initialData.endDate as string).toISOString().slice(0, 10) : "",
      startTime: (initialData?.startTime as string) ?? "",
      endTime: (initialData?.endTime as string) ?? "",
      timezone: (initialData?.timezone as string) ?? "America/New_York",
      grade: (initialData?.grade as string) ?? defaultGrade ?? "",
      eventType: (initialData?.eventType as FormData["eventType"]) ?? "free",
      priceAmount: (initialData?.priceAmount as number) ?? 0,
      capacity: initialData?.capacity as number | undefined,
      registrationDeadline: initialData?.registrationDeadline ? new Date(initialData.registrationDeadline as string).toISOString().slice(0, 10) : "",
      contactName: (initialData?.contactName as string) ?? "",
      contactEmail: (initialData?.contactEmail as string) ?? "",
      contactPhone: (initialData?.contactPhone as string) ?? "",
      instructions: (initialData?.instructions as string) ?? "",
      isOnline: (initialData?.isOnline as boolean) ?? false,
      parentRequired: (initialData?.parentRequired as boolean) ?? false,
      registrationEnabled: (initialData?.registrationEnabled as boolean) ?? true,
      featured: (initialData?.featured as boolean) ?? false,
      status: (initialData?.status as FormData["status"]) ?? "draft",
      publishedToWebsite: (initialData?.publishedToWebsite as boolean) ?? false,
    },
  });

  const title = watch("title");
  const eventType = watch("eventType");
  const status = watch("status");

  useEffect(() => {
    if (isNew && title) setValue("slug", safeSlug(title));
  }, [isNew, title, setValue]);

  async function onSubmit(data: FormData, action: "save" | "publish" | "unpublish" = "save") {
    setError(null);
    
    const finalData = { 
      ...data, 
      coverImage: data.coverImage?.trim() || undefined,
      startDate: new Date(data.startDate), 
      endDate: new Date(data.endDate),
      registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : undefined,
    };

    // Handle publish/unpublish actions
    if (action === "publish") {
      finalData.status = "published";
      finalData.publishedToWebsite = true;
    } else if (action === "unpublish") {
      finalData.publishedToWebsite = false;
    }

    if (packages.some((pkg) => !pkg.name.trim())) {
      setError("Each package or add-on needs a name.");
      return;
    }

    const url = isNew ? "/api/admin/events" : `/api/admin/events/${initialData?._id}`;
    const res = await fetch(url, { 
      method: isNew ? "POST" : "PUT", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ ...finalData, packages, gallery }) 
    });
    const json = await res.json();
    if (!json.success) { 
      setError(json.error ?? "Save failed"); 
      return; 
    }
    router.push(
      finalData.grade && finalData.grade !== ALL_GRADES_VALUE
        ? `/admin/events?grade=${encodeURIComponent(String(finalData.grade))}`
        : "/admin/events"
    );
    router.refresh();
  }

  async function handleDuplicate() {
    if (!initialData?._id) return;
    setIsDuplicating(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/admin/events/${initialData._id}/duplicate`, { method: "POST" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Duplicate failed");
        setIsDuplicating(false);
        return;
      }
      router.push(`/admin/events/${json.data._id}`);
      router.refresh();
    } catch (err) {
      setError("Duplicate failed");
      setIsDuplicating(false);
    }
  }

  async function handleDelete() {
    if (!initialData?._id) return;
    if (!confirm("Are you sure you want to delete this event? This permanently removes it from admin and the public website. This cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/admin/events/${initialData._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Delete failed");
        return;
      }
      router.push("/admin/events");
      router.refresh();
    } catch (err) {
      setError("Delete failed");
    }
  }

  return (
    <div>
      <PageHeader title={isNew ? "New Event" : "Edit Event"} />
      {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      <form onSubmit={handleSubmit((data) => onSubmit(data, "save"))} className="space-y-6">
        
        <FormSection title="Event Details">
          <FormField label="Event Name" error={errors.title} required className="sm:col-span-2">
            <TextInput registration={register("title")} error={errors.title} />
          </FormField>
          <FormField label="Slug" error={errors.slug} required>
            <TextInput registration={register("slug")} error={errors.slug} />
          </FormField>
          <FormField label="Status" error={errors.status}>
            <SelectInput registration={register("status")} error={errors.status} options={[
              { value: "draft", label: "Draft" }, 
              { value: "published", label: "Published" },
              { value: "cancelled", label: "Cancelled" }, 
              { value: "completed", label: "Completed" }, 
              { value: "archived", label: "Archived" },
            ]} />
          </FormField>
          <FormField label="Short Description" error={errors.shortDescription} required className="sm:col-span-2">
            <TextArea registration={register("shortDescription")} error={errors.shortDescription} rows={3} />
          </FormField>
          <FormField label="Full Description" error={errors.fullDescription} required className="sm:col-span-2">
            <TextArea registration={register("fullDescription")} error={errors.fullDescription} rows={6} />
          </FormField>
          <FormField label="Grade" error={errors.grade} required className="sm:col-span-2">
            <SelectInput
              registration={register("grade")}
              error={errors.grade}
              options={gradeSelectOptions(false, true)}
              disabled={Boolean(defaultGrade && isNew)}
            />
          </FormField>
        </FormSection>

        <FormSection title="Event Images">
          <div className="sm:col-span-2">
            <ImageUpload
              label="Cover image"
              value={watch("coverImage") || ""}
              onChange={(url) => setValue("coverImage", url)}
              folder="events"
            />
            <p className="mt-2 text-xs text-white/50">
              Shown on the Events list and at the top of the event detail page.
            </p>
          </div>

          <div className="sm:col-span-2 space-y-3">
            <p className="text-sm font-medium text-white/80">Gallery photos (optional)</p>
            {gallery.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gallery.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative overflow-hidden rounded-lg border border-white/10">
                    <img
                      src={resolveImageUrl(url)}
                      alt={`Gallery photo ${index + 1}`}
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteStoredUploadByUrl(url);
                        setGallery((prev) => prev.filter((_, i) => i !== index));
                      }}
                      className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <ImageUpload
              key={galleryUploadKey}
              label="Add gallery photo"
              value=""
              onChange={(url) => {
                if (url) {
                  setGallery((prev) => [...prev, url]);
                  setGalleryUploadKey((k) => k + 1);
                }
              }}
              folder="events"
            />
            <p className="text-xs text-white/50">
              Extra photos appear in a gallery section on the event page.
            </p>
          </div>
        </FormSection>

        <FormSection title="Date & Time">
          <FormField label="Start Date" error={errors.startDate} required>
            <TextInput registration={register("startDate")} error={errors.startDate} type="date" />
          </FormField>
          <FormField label="End Date" error={errors.endDate} required>
            <TextInput registration={register("endDate")} error={errors.endDate} type="date" />
          </FormField>
          <FormField label="Start Time" error={errors.startTime} required>
            <TextInput registration={register("startTime")} error={errors.startTime} type="time" placeholder="09:00" />
          </FormField>
          <FormField label="End Time" error={errors.endTime} required>
            <TextInput registration={register("endTime")} error={errors.endTime} type="time" placeholder="17:00" />
          </FormField>
          <FormField label="Timezone" error={errors.timezone} className="sm:col-span-2">
            <TextInput registration={register("timezone")} error={errors.timezone} placeholder="America/New_York" />
          </FormField>
        </FormSection>

        <FormSection title="Location">
          <FormField label="Location" error={errors.location} required className="sm:col-span-2">
            <TextInput registration={register("location")} error={errors.location} placeholder="123 Main St, City, State 12345" />
          </FormField>
          <div className="sm:col-span-2">
            <CheckboxInput registration={register("isOnline")} label="This is an online event" />
          </div>
        </FormSection>

        <FormSection title="Pricing">
          <FormField label="Event Type" error={errors.eventType} required>
            <SelectInput registration={register("eventType")} error={errors.eventType} options={[
              { value: "free", label: "Free Event" },
              { value: "paid", label: "Paid Event" },
            ]} />
          </FormField>
          {eventType === "paid" && packages.length === 0 && (
            <FormField label="Price (USD)" error={errors.priceAmount} required>
              <TextInput registration={register("priceAmount")} error={errors.priceAmount} type="number" step="0.01" placeholder="25.00" />
            </FormField>
          )}
          <EventPackagesEditor value={packages} onChange={setPackages} />
          {packages.length > 0 && (
            <p className="sm:col-span-2 text-xs text-white/50">
              When packages are added, customers choose packages/add-ons instead of the single event price.
            </p>
          )}
        </FormSection>

        <FormSection title="Registration">
          <FormField label="Capacity" error={errors.capacity} hint="Leave empty for unlimited">
            <TextInput registration={register("capacity")} error={errors.capacity} type="number" placeholder="50" />
          </FormField>
          <FormField label="Registration Deadline" error={errors.registrationDeadline}>
            <TextInput registration={register("registrationDeadline")} error={errors.registrationDeadline} type="date" />
          </FormField>
          <FormField label="Instructions" error={errors.instructions} hint="Special instructions for attendees" className="sm:col-span-2">
            <TextArea registration={register("instructions")} error={errors.instructions} rows={4} placeholder="What to bring, how to prepare, etc." />
          </FormField>
          <div className="flex flex-col gap-3 sm:col-span-2">
            <CheckboxInput registration={register("registrationEnabled")} label="Registration enabled" />
            <CheckboxInput registration={register("parentRequired")} label="Parent/Guardian required" />
            <CheckboxInput registration={register("featured")} label="Featured event" />
          </div>
        </FormSection>

        <FormSection title="Contact Information">
          <FormField label="Contact Name" error={errors.contactName}>
            <TextInput registration={register("contactName")} error={errors.contactName} placeholder="John Doe" />
          </FormField>
          <FormField label="Contact Email" error={errors.contactEmail}>
            <TextInput registration={register("contactEmail")} error={errors.contactEmail} type="email" placeholder="contact@example.com" />
          </FormField>
          <FormField label="Contact Phone" error={errors.contactPhone} className="sm:col-span-2">
            <TextInput registration={register("contactPhone")} error={errors.contactPhone} type="tel" placeholder="+1 (555) 123-4567" />
          </FormField>
        </FormSection>

        <FormSection title="Website Publishing">
          <div className="sm:col-span-2">
            <CheckboxInput registration={register("publishedToWebsite")} label="Published to Website" />
            <p className="mt-2 text-xs text-white/40">
              When checked, this event will be visible on the public website. Unchecking will hide it without deleting.
            </p>
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
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-white/80 transition hover:text-white disabled:opacity-50"
            >
              {isDuplicating ? "Duplicating…" : "Duplicate"}
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
            href="/admin/events"
            className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-white/60 transition hover:text-white"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
