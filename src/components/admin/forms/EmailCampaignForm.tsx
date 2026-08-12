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
  FormActions,
  FormSection,
} from "@/components/admin/forms";
import { PageHeader } from "@/components/admin/PageHeader";

const schema = z.object({
  type: z.enum(["event", "course", "announcement", "custom"]),
  subject: z.string().min(1),
  htmlBody: z.string().min(1),
  textBody: z.string().optional(),
  status: z.enum(["draft", "queued", "sending", "sent", "failed"]),
});

type FormData = z.infer<typeof schema>;

export function EmailCampaignForm({
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
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: (initialData?.type as FormData["type"]) ?? "announcement",
      subject: (initialData?.subject as string) ?? "",
      htmlBody: (initialData?.htmlBody as string) ?? "",
      textBody: (initialData?.textBody as string) ?? "",
      status: (initialData?.status as FormData["status"]) ?? "draft",
    },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const url = isNew ? "/api/admin/email-campaigns" : `/api/admin/email-campaigns/${initialData?._id}`;
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
    router.push("/admin/email-campaigns");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title={isNew ? "New Email Campaign" : "Edit Email Campaign"} />
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Campaign">
          <FormField label="Type" error={errors.type}>
            <SelectInput
              registration={register("type")}
              error={errors.type}
              options={[
                { value: "event", label: "Event" },
                { value: "course", label: "Course" },
                { value: "announcement", label: "Announcement" },
                { value: "custom", label: "Custom" },
              ]}
            />
          </FormField>
          <FormField label="Status" error={errors.status}>
            <SelectInput
              registration={register("status")}
              error={errors.status}
              options={[
                { value: "draft", label: "Draft" },
                { value: "queued", label: "Queued" },
                { value: "sent", label: "Sent" },
              ]}
            />
          </FormField>
          <FormField label="Subject" error={errors.subject} required className="sm:col-span-2">
            <TextInput registration={register("subject")} error={errors.subject} />
          </FormField>
          <FormField label="HTML Body" error={errors.htmlBody} required className="sm:col-span-2">
            <TextArea registration={register("htmlBody")} error={errors.htmlBody} rows={8} />
          </FormField>
          <FormField label="Plain Text Body" error={errors.textBody} className="sm:col-span-2">
            <TextArea registration={register("textBody")} error={errors.textBody} rows={4} />
          </FormField>
        </FormSection>
        <FormActions isSubmitting={isSubmitting} cancelHref="/admin/email-campaigns" />
      </form>
    </div>
  );
}
