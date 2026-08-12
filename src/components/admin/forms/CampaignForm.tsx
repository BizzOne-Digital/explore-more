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
  description: z.string().min(1),
  goalCents: z.coerce.number().min(0),
  suggestedAmounts: z.string().optional(),
  customAmountEnabled: z.boolean(),
  featured: z.boolean(),
  showDonorCount: z.boolean(),
  allowAnonymous: z.boolean(),
  status: z.enum(["draft", "published", "completed", "archived"]),
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
      goalCents: (initialData?.goalCents as number) ?? 0,
      suggestedAmounts: Array.isArray(initialData?.suggestedAmounts)
        ? (initialData.suggestedAmounts as number[]).join(", ")
        : "",
      customAmountEnabled: (initialData?.customAmountEnabled as boolean) ?? true,
      featured: (initialData?.featured as boolean) ?? false,
      showDonorCount: (initialData?.showDonorCount as boolean) ?? true,
      allowAnonymous: (initialData?.allowAnonymous as boolean) ?? true,
      status: (initialData?.status as FormData["status"]) ?? "draft",
    },
  });

  const title = watch("title");
  useEffect(() => {
    if (isNew && title) setValue("slug", safeSlug(title));
  }, [isNew, title, setValue]);

  async function onSubmit(data: FormData) {
    setError(null);
    const payload = {
      ...data,
      suggestedAmounts: data.suggestedAmounts
        ? data.suggestedAmounts.split(",").map((s) => parseInt(s.trim(), 10)).filter(Boolean)
        : [],
      raisedCents: isNew ? 0 : undefined,
      gallery: [],
      updates: [],
    };
    const url = isNew ? "/api/admin/campaigns" : `/api/admin/campaigns/${initialData?._id}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.error ?? "Save failed");
      return;
    }
    router.push("/admin/campaigns");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title={isNew ? "New Campaign" : "Edit Campaign"} />
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Campaign Details">
          <FormField label="Title" error={errors.title} required className="sm:col-span-2">
            <TextInput registration={register("title")} error={errors.title} />
          </FormField>
          <FormField label="Slug" error={errors.slug} required>
            <TextInput registration={register("slug")} error={errors.slug} />
          </FormField>
          <FormField label="Goal (cents)" error={errors.goalCents}>
            <TextInput registration={register("goalCents")} type="number" error={errors.goalCents} />
          </FormField>
          <FormField label="Suggested Amounts (cents, comma-separated)" error={errors.suggestedAmounts} className="sm:col-span-2">
            <TextInput registration={register("suggestedAmounts")} error={errors.suggestedAmounts} placeholder="2500, 5000, 10000" />
          </FormField>
          <FormField label="Description" error={errors.description} required className="sm:col-span-2">
            <TextArea registration={register("description")} error={errors.description} rows={6} />
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
          <div className="flex flex-col gap-3 sm:col-span-2">
            <CheckboxInput registration={register("customAmountEnabled")} label="Allow custom amounts" />
            <CheckboxInput registration={register("showDonorCount")} label="Show donor count" />
            <CheckboxInput registration={register("allowAnonymous")} label="Allow anonymous donations" />
            <CheckboxInput registration={register("featured")} label="Featured" />
          </div>
        </FormSection>
        <FormActions isSubmitting={isSubmitting} cancelHref="/admin/campaigns" />
      </form>
    </div>
  );
}
