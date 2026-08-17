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
import { ImageUpload } from "@/components/admin/ImageUpload";
import { safeSlug } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1),
  description: z.string().min(1, "Description is required"),
  coverImage: z.string().optional(),
  goalAmount: z.coerce.number().min(0, "Goal must be 0 or greater"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  callToAction: z.string().optional(),
  campaignInfo: z.string().optional(),
  suggestedAmounts: z.string().optional(),
  customAmountEnabled: z.boolean(),
  featured: z.boolean(),
  showDonorCount: z.boolean(),
  allowAnonymous: z.boolean(),
  status: z.enum(["draft", "published", "completed", "archived"]),
  publishedToWebsite: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function CampaignForm({
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
      description: (initialData?.description as string) ?? "",
      coverImage: (initialData?.coverImage as string) ?? "",
      goalAmount: (initialData?.goalAmount as number) ?? 0,
      startDate: initialData?.startDate ? new Date(initialData.startDate as string).toISOString().slice(0, 10) : "",
      endDate: initialData?.endDate ? new Date(initialData.endDate as string).toISOString().slice(0, 10) : "",
      callToAction: (initialData?.callToAction as string) ?? "",
      campaignInfo: (initialData?.campaignInfo as string) ?? "",
      suggestedAmounts: Array.isArray(initialData?.suggestedAmounts)
        ? (initialData.suggestedAmounts as number[]).join(", ")
        : "",
      customAmountEnabled: (initialData?.customAmountEnabled as boolean) ?? true,
      featured: (initialData?.featured as boolean) ?? false,
      showDonorCount: (initialData?.showDonorCount as boolean) ?? true,
      allowAnonymous: (initialData?.allowAnonymous as boolean) ?? true,
      status: (initialData?.status as FormData["status"]) ?? "draft",
      publishedToWebsite: (initialData?.publishedToWebsite as boolean) ?? false,
    },
  });

  const title = watch("title");
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
      suggestedAmounts: data.suggestedAmounts
        ? data.suggestedAmounts.split(",").map((s) => parseFloat(s.trim())).filter(Boolean)
        : [],
      raisedAmount: isNew ? 0 : undefined,
      gallery: [],
      updates: [],
    };

    // Handle publish/unpublish actions
    if (action === "publish") {
      finalData.status = "published";
      finalData.publishedToWebsite = true;
    } else if (action === "unpublish") {
      finalData.publishedToWebsite = false;
    }

    const url = isNew ? "/api/admin/campaigns" : `/api/admin/campaigns/${initialData?._id}`;
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
    router.push("/admin/campaigns");
    router.refresh();
  }

  async function handleDelete() {
    if (!initialData?._id) return;
    if (!confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/campaigns/${initialData._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Delete failed");
        return;
      }
      router.push("/admin/campaigns");
      router.refresh();
    } catch (err) {
      setError("Delete failed");
    }
  }

  return (
    <div>
      <PageHeader title={isNew ? "New Campaign" : "Edit Campaign"} />
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit((data) => onSubmit(data, "save"))} className="space-y-6">
        <FormSection title="Campaign Details">
          <FormField label="Campaign Title" error={errors.title} required className="sm:col-span-2">
            <TextInput registration={register("title")} error={errors.title} />
          </FormField>
          <FormField label="Slug" error={errors.slug} required>
            <TextInput registration={register("slug")} error={errors.slug} />
          </FormField>
          <FormField label="Status" error={errors.status}>
            <SelectInput
              registration={register("status")}
              error={errors.status}
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
                { value: "completed", label: "Completed" },
                { value: "archived", label: "Archived" },
              ]}
            />
          </FormField>
          <FormField label="Description" error={errors.description} required className="sm:col-span-2">
            <TextArea registration={register("description")} error={errors.description} rows={6} />
          </FormField>
          <FormField label="Campaign Information" error={errors.campaignInfo} hint="Additional details about the campaign" className="sm:col-span-2">
            <TextArea registration={register("campaignInfo")} error={errors.campaignInfo} rows={4} />
          </FormField>
        </FormSection>

        <FormSection title="Campaign Image">
          <div className="sm:col-span-2">
            <ImageUpload
              label="Campaign Cover Image"
              value={watch("coverImage") || ""}
              onChange={(url) => setValue("coverImage", url)}
              folder="campaigns"
            />
          </div>
        </FormSection>

        <FormSection title="Goals & Dates">
          <FormField label="Fundraising Goal (USD)" error={errors.goalAmount} required>
            <TextInput registration={register("goalAmount")} type="number" step="0.01" error={errors.goalAmount} placeholder="10000.00" />
          </FormField>
          <FormField label="Amount Raised (USD)" hint="This is auto-calculated from donations">
            <TextInput value={`$${Number(initialData?.raisedAmount || 0).toFixed(2)}`} disabled />
          </FormField>
          <FormField label="Start Date" error={errors.startDate}>
            <TextInput registration={register("startDate")} error={errors.startDate} type="date" />
          </FormField>
          <FormField label="End Date" error={errors.endDate}>
            <TextInput registration={register("endDate")} error={errors.endDate} type="date" />
          </FormField>
          <FormField label="Call to Action" error={errors.callToAction} hint="e.g., 'Donate Now', 'Support Our Cause'" className="sm:col-span-2">
            <TextInput registration={register("callToAction")} error={errors.callToAction} placeholder="Donate Now" />
          </FormField>
        </FormSection>

        <FormSection title="Donation Settings">
          <FormField label="Suggested Amounts (USD, comma-separated)" error={errors.suggestedAmounts} className="sm:col-span-2" hint="e.g., 25, 50, 100, 250">
            <TextInput registration={register("suggestedAmounts")} error={errors.suggestedAmounts} placeholder="25, 50, 100, 250" />
          </FormField>
          <div className="flex flex-col gap-3 sm:col-span-2">
            <CheckboxInput registration={register("customAmountEnabled")} label="Allow custom donation amounts" />
            <CheckboxInput registration={register("showDonorCount")} label="Show donor count publicly" />
            <CheckboxInput registration={register("allowAnonymous")} label="Allow anonymous donations" />
            <CheckboxInput registration={register("featured")} label="Featured campaign" />
          </div>
        </FormSection>

        <FormSection title="Website Publishing">
          <div className="sm:col-span-2">
            <CheckboxInput registration={register("publishedToWebsite")} label="Published to Website" />
            <p className="mt-2 text-xs text-white/40">
              When checked, this campaign will be visible on the public website.
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
              onClick={handleDelete}
              className="rounded-lg border border-red-500/30 px-5 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
            >
              Delete
            </button>
          )}

          <Link
            href="/admin/campaigns"
            className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-white/60 transition hover:text-white"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
