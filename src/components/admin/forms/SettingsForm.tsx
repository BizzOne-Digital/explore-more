"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import {
  FormField,
  TextInput,
  CheckboxInput,
  FormActions,
  FormSection,
} from "@/components/admin/forms";
import { PageHeader } from "@/components/admin/PageHeader";
import { COMPANY } from "@/lib/constants";
import { centsToDollars, dollarsToCents } from "@/lib/utils";

const schema = z.object({
  companyName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().optional(),
  operatingHours: z.string().optional(),
  stripeEnabled: z.boolean(),
  manualOrderMode: z.boolean(),
  taxRatePercent: z.coerce.number(),
  shippingFlatAmount: z.coerce.number().min(0),
  freeShippingThresholdAmount: z.coerce.number().min(0),
  introEnabled: z.boolean(),
  showStats: z.boolean(),
  students: z.coerce.number().optional(),
  adventures: z.coerce.number().optional(),
  partners: z.coerce.number().optional(),
});

type FormData = z.infer<typeof schema>;

export function SettingsForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: COMPANY.name,
      email: COMPANY.email,
      phone: COMPANY.phone,
      stripeEnabled: false,
      manualOrderMode: false,
      taxRatePercent: 0,
      shippingFlatAmount: 0,
      freeShippingThresholdAmount: 0,
      introEnabled: true,
      showStats: false,
    },
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const s = json.data;
          reset({
            companyName: s.companyName,
            email: s.email,
            phone: s.phone,
            address: s.address ?? "",
            operatingHours: s.operatingHours ?? "",
            stripeEnabled: s.stripeEnabled ?? false,
            manualOrderMode: s.manualOrderMode ?? false,
            taxRatePercent: s.taxRatePercent ?? 0,
            shippingFlatAmount: centsToDollars(s.shippingFlatCents ?? 0),
            freeShippingThresholdAmount: centsToDollars(s.freeShippingThresholdCents ?? 0),
            introEnabled: s.introEnabled ?? true,
            showStats: s.verifiedStats?.showStats ?? false,
            students: s.verifiedStats?.students,
            adventures: s.verifiedStats?.adventures,
            partners: s.verifiedStats?.partners,
          });
        }
        setLoading(false);
      });
  }, [reset]);

  async function onSubmit(data: FormData) {
    setError(null);
    const payload = {
      companyName: data.companyName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      operatingHours: data.operatingHours,
      stripeEnabled: data.stripeEnabled,
      manualOrderMode: data.manualOrderMode,
      taxRatePercent: data.taxRatePercent,
      shippingFlatCents: dollarsToCents(data.shippingFlatAmount),
      freeShippingThresholdCents: dollarsToCents(data.freeShippingThresholdAmount),
      introEnabled: data.introEnabled,
      verifiedStats: {
        showStats: data.showStats,
        students: data.students,
        adventures: data.adventures,
        partners: data.partners,
      },
    };
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.error ?? "Save failed");
      return;
    }
    router.refresh();
  }

  if (loading) {
    return <p className="text-white/50">Loading settings…</p>;
  }

  return (
    <div>
      <PageHeader title="Site Settings" description="Configure global site settings" />
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Company">
          <FormField label="Company Name" error={errors.companyName} required className="sm:col-span-2">
            <TextInput registration={register("companyName")} error={errors.companyName} />
          </FormField>
          <FormField label="Email" error={errors.email} required>
            <TextInput registration={register("email")} type="email" error={errors.email} />
          </FormField>
          <FormField label="Phone" error={errors.phone} required>
            <TextInput registration={register("phone")} error={errors.phone} />
          </FormField>
          <FormField label="Address" error={errors.address} className="sm:col-span-2">
            <TextInput registration={register("address")} error={errors.address} />
          </FormField>
          <FormField label="Operating Hours" error={errors.operatingHours} className="sm:col-span-2">
            <TextInput registration={register("operatingHours")} error={errors.operatingHours} />
          </FormField>
        </FormSection>

        <FormSection title="Commerce">
          <FormField label="Tax Rate (%)" error={errors.taxRatePercent}>
            <TextInput registration={register("taxRatePercent")} type="number" step="0.01" error={errors.taxRatePercent} />
          </FormField>
          <FormField label="Shipping Flat (USD)" error={errors.shippingFlatAmount} hint="e.g. 5.99">
            <TextInput
              registration={register("shippingFlatAmount")}
              type="number"
              step="0.01"
              error={errors.shippingFlatAmount}
            />
          </FormField>
          <FormField label="Free Shipping Threshold (USD)" error={errors.freeShippingThresholdAmount} hint="e.g. 50.00">
            <TextInput
              registration={register("freeShippingThresholdAmount")}
              type="number"
              step="0.01"
              error={errors.freeShippingThresholdAmount}
            />
          </FormField>
          <div className="flex flex-col gap-3 sm:col-span-2">
            <CheckboxInput registration={register("stripeEnabled")} label="Stripe enabled" />
            <CheckboxInput registration={register("manualOrderMode")} label="Manual order mode" />
          </div>
        </FormSection>

        <FormSection title="Display">
          <CheckboxInput registration={register("introEnabled")} label="Cinematic intro enabled" />
          <CheckboxInput registration={register("showStats")} label="Show verified stats" />
          <FormField label="Students Count" error={errors.students}>
            <TextInput registration={register("students")} type="number" error={errors.students} />
          </FormField>
          <FormField label="Adventures Count" error={errors.adventures}>
            <TextInput registration={register("adventures")} type="number" error={errors.adventures} />
          </FormField>
          <FormField label="Partners Count" error={errors.partners}>
            <TextInput registration={register("partners")} type="number" error={errors.partners} />
          </FormField>
        </FormSection>

        <FormActions isSubmitting={isSubmitting} submitLabel="Save Settings" />
      </form>
    </div>
  );
}
