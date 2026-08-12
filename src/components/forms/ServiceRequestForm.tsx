"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  parentName: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(7, "Phone is required"),
  studentName: z.string().min(2, "Student name is required"),
  studentAge: z.string().optional(),
  preferredSchedule: z.string().optional(),
  requestType: z.enum(["individual", "group"]),
  schoolStatus: z.enum(["homeschool", "traditional", "other", ""]).optional(),
  goals: z.string().optional(),
  accessibilityNeeds: z.string().optional(),
  additionalNotes: z.string().optional(),
  consentGiven: z.boolean().refine((v) => v === true, { message: "Consent is required" }),
});

type FormData = z.infer<typeof schema>;

interface ServiceRequestFormProps {
  programId: string;
  programSlug: string;
  programTitle: string;
}

export function ServiceRequestForm({ programId, programSlug, programTitle }: ServiceRequestFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { requestType: "individual", consentGiven: false },
  });

  async function onSubmit(data: FormData) {
    setStatus("loading");
    setServerError("");

    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, programId, programSlug }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to submit request");
      setStatus("success");
      reset();
    } catch (err) {
      setStatus("error");
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-explore-teal/10 border border-explore-teal/20 p-8 text-center">
        <p className="font-display text-xl font-bold text-explore-teal">Request received!</p>
        <p className="mt-2 text-sm text-explore-charcoal/70">
          Thank you for your interest in {programTitle}. Our team will contact you within 2 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Parent/Guardian Name" {...register("parentName")} error={errors.parentName?.message} required />
        <Input label="Email" type="email" {...register("email")} error={errors.email?.message} required />
        <Input label="Phone" type="tel" {...register("phone")} error={errors.phone?.message} required />
        <Input label="Student Name" {...register("studentName")} error={errors.studentName?.message} required />
        <Input label="Student Age" {...register("studentAge")} />
        <Select
          label="Request Type"
          options={[
            { value: "individual", label: "Individual" },
            { value: "group", label: "Group" },
          ]}
          {...register("requestType")}
        />
        <Select
          label="School Status"
          options={[
            { value: "", label: "Select..." },
            { value: "homeschool", label: "Homeschool" },
            { value: "traditional", label: "Traditional School" },
            { value: "other", label: "Other" },
          ]}
          {...register("schoolStatus")}
        />
        <Input label="Preferred Schedule" {...register("preferredSchedule")} placeholder="Weekday mornings, etc." />
      </div>
      <Textarea label="Goals & Interests" {...register("goals")} rows={3} />
      <Textarea label="Accessibility Needs" {...register("accessibilityNeeds")} rows={2} />
      <Textarea label="Additional Notes" {...register("additionalNotes")} rows={2} />
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" {...register("consentGiven")} className="mt-1 rounded border-explore-charcoal/30" />
        <span className="text-sm text-explore-charcoal/70">
          I consent to Explore More Academy contacting me about this program request. *
        </span>
      </label>
      {errors.consentGiven && <p className="text-xs text-red-600">{errors.consentGiven.message}</p>}
      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      <Button type="submit" size="lg" disabled={status === "loading"}>
        {status === "loading" ? "Submitting..." : "Submit Request"}
      </Button>
    </form>
  );
}
