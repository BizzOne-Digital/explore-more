"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormField, TextInput, TextArea, SelectInput, FormActions, FormSection } from "@/components/admin/forms";
import { PageHeader } from "@/components/admin/PageHeader";
import { useState } from "react";
import Link from "next/link";
import { gradeSelectOptions } from "@/lib/grades";

const schema = z.object({
  eventId: z.string().min(1, "Event is required"),
  studentName: z.string().min(1, "Student name is required"),
  studentAge: z.coerce.number().optional(),
  studentGrade: z.string().optional(),
  guardianName: z.string().min(1, "Guardian name is required"),
  guardianEmail: z.string().email("Valid email is required"),
  guardianPhone: z.string().min(1, "Phone number is required"),
  guardianRelationship: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  medicalConditions: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  registrationType: z.enum(["free", "paid"]),
  paymentAmount: z.coerce.number().optional(),
  paymentStatus: z.enum(["free", "pending", "paid", "failed", "refunded"]),
  status: z.enum(["pending", "confirmed", "cancelled", "waitlist"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Event {
  _id: string;
  title: string;
  startDate?: string;
}

export function EventRegistrationForm({
  initialData,
  isNew = false,
  events,
  grade,
  defaultEventId,
}: {
  initialData?: Record<string, unknown> & { _id?: string };
  isNew?: boolean;
  events: Event[];
  grade?: string;
  defaultEventId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      eventId: (initialData?.eventId as string) ?? defaultEventId ?? "",
      studentName: (initialData?.studentName as string) ?? "",
      studentAge: initialData?.studentAge as number | undefined,
      studentGrade: (initialData?.studentGrade as string) ?? grade ?? "",
      guardianName: (initialData?.guardianName as string) ?? "",
      guardianEmail: (initialData?.guardianEmail as string) ?? "",
      guardianPhone: (initialData?.guardianPhone as string) ?? "",
      guardianRelationship: (initialData?.guardianRelationship as string) ?? "",
      emergencyContactName: (initialData?.emergencyContactName as string) ?? "",
      emergencyContactPhone: (initialData?.emergencyContactPhone as string) ?? "",
      emergencyContactRelationship: (initialData?.emergencyContactRelationship as string) ?? "",
      medicalConditions: (initialData?.medicalConditions as string) ?? "",
      allergies: (initialData?.allergies as string) ?? "",
      medications: (initialData?.medications as string) ?? "",
      registrationType: (initialData?.registrationType as FormData["registrationType"]) ?? "free",
      paymentAmount: initialData?.paymentAmount as number | undefined,
      paymentStatus: (initialData?.paymentStatus as FormData["paymentStatus"]) ?? "free",
      status: (initialData?.status as FormData["status"]) ?? "confirmed",
      notes: (initialData?.notes as string) ?? "",
    },
  });

  const registrationType = watch("registrationType");

  async function onSubmit(data: FormData) {
    setError(null);
    const url = isNew ? "/api/admin/event-registrations" : `/api/admin/event-registrations/${initialData?._id}`;
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
    router.push(
      grade && defaultEventId
        ? `/admin/event-registrations?grade=${encodeURIComponent(grade)}&event=${encodeURIComponent(defaultEventId)}`
        : grade
          ? `/admin/event-registrations?grade=${encodeURIComponent(grade)}`
          : "/admin/event-registrations"
    );
    router.refresh();
  }

  async function handleDelete() {
    if (!initialData?._id) return;
    if (!confirm("Are you sure you want to delete this registration?")) return;

    try {
      const res = await fetch(`/api/admin/event-registrations/${initialData._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Delete failed");
        return;
      }
      router.push(
      grade && defaultEventId
        ? `/admin/event-registrations?grade=${encodeURIComponent(grade)}&event=${encodeURIComponent(defaultEventId)}`
        : grade
          ? `/admin/event-registrations?grade=${encodeURIComponent(grade)}`
          : "/admin/event-registrations"
    );
      router.refresh();
    } catch (err) {
      setError("Delete failed");
    }
  }

  return (
    <div>
      <PageHeader title={isNew ? "New Registration" : "Edit Registration"} />
      {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Event Selection">
          {grade && (
            <FormField label="Grade" className="sm:col-span-2">
              <SelectInput
                registration={register("studentGrade")}
                options={gradeSelectOptions(false).filter((o) => o.value === grade)}
                disabled
              />
            </FormField>
          )}
          <FormField label="Event" error={errors.eventId} required className="sm:col-span-2">
            <SelectInput
              registration={register("eventId")}
              error={errors.eventId}
              options={[
                { value: "", label: "Select an event..." },
                ...events.map((event) => ({
                  value: event._id,
                  label: `${event.title}${event.startDate ? ` (${new Date(event.startDate).toLocaleDateString()})` : ""}`,
                })),
              ]}
            />
          </FormField>
        </FormSection>

        <FormSection title="Student Information">
          <FormField label="Student Name" error={errors.studentName} required className="sm:col-span-2">
            <TextInput registration={register("studentName")} error={errors.studentName} />
          </FormField>
          <FormField label="Age" error={errors.studentAge}>
            <TextInput registration={register("studentAge")} error={errors.studentAge} type="number" />
          </FormField>
          {!grade && (
            <FormField label="Grade" error={errors.studentGrade}>
              <SelectInput
                registration={register("studentGrade")}
                error={errors.studentGrade}
                options={gradeSelectOptions()}
              />
            </FormField>
          )}
        </FormSection>

        <FormSection title="Parent/Guardian Information">
          <FormField label="Guardian Name" error={errors.guardianName} required className="sm:col-span-2">
            <TextInput registration={register("guardianName")} error={errors.guardianName} />
          </FormField>
          <FormField label="Email" error={errors.guardianEmail} required>
            <TextInput registration={register("guardianEmail")} error={errors.guardianEmail} type="email" />
          </FormField>
          <FormField label="Phone" error={errors.guardianPhone} required>
            <TextInput registration={register("guardianPhone")} error={errors.guardianPhone} type="tel" />
          </FormField>
          <FormField label="Relationship" error={errors.guardianRelationship} className="sm:col-span-2">
            <TextInput registration={register("guardianRelationship")} error={errors.guardianRelationship} placeholder="e.g., Mother, Father, Guardian" />
          </FormField>
        </FormSection>

        <FormSection title="Emergency Contact">
          <FormField label="Emergency Contact Name" error={errors.emergencyContactName}>
            <TextInput registration={register("emergencyContactName")} error={errors.emergencyContactName} />
          </FormField>
          <FormField label="Emergency Contact Phone" error={errors.emergencyContactPhone}>
            <TextInput registration={register("emergencyContactPhone")} error={errors.emergencyContactPhone} type="tel" />
          </FormField>
          <FormField label="Relationship to Student" error={errors.emergencyContactRelationship} className="sm:col-span-2">
            <TextInput registration={register("emergencyContactRelationship")} error={errors.emergencyContactRelationship} />
          </FormField>
        </FormSection>

        <FormSection title="Medical Information">
          <FormField label="Medical Conditions" error={errors.medicalConditions} className="sm:col-span-2">
            <TextArea registration={register("medicalConditions")} error={errors.medicalConditions} rows={3} placeholder="List any medical conditions..." />
          </FormField>
          <FormField label="Allergies" error={errors.allergies} className="sm:col-span-2">
            <TextArea registration={register("allergies")} error={errors.allergies} rows={2} placeholder="List any allergies..." />
          </FormField>
          <FormField label="Medications" error={errors.medications} className="sm:col-span-2">
            <TextArea registration={register("medications")} error={errors.medications} rows={2} placeholder="List any medications..." />
          </FormField>
        </FormSection>

        <FormSection title="Payment Information">
          <FormField label="Registration Type" error={errors.registrationType} required>
            <SelectInput
              registration={register("registrationType")}
              error={errors.registrationType}
              options={[
                { value: "free", label: "Free" },
                { value: "paid", label: "Paid" },
              ]}
            />
          </FormField>
          {registrationType === "paid" && (
            <FormField label="Payment Amount (USD)" error={errors.paymentAmount}>
              <TextInput registration={register("paymentAmount")} error={errors.paymentAmount} type="number" step="0.01" />
            </FormField>
          )}
          <FormField label="Payment Status" error={errors.paymentStatus}>
            <SelectInput
              registration={register("paymentStatus")}
              error={errors.paymentStatus}
              options={[
                { value: "free", label: "Free" },
                { value: "pending", label: "Pending" },
                { value: "paid", label: "Paid" },
                { value: "failed", label: "Failed" },
                { value: "refunded", label: "Refunded" },
              ]}
            />
          </FormField>
          <FormField label="Registration Status" error={errors.status}>
            <SelectInput
              registration={register("status")}
              error={errors.status}
              options={[
                { value: "pending", label: "Pending" },
                { value: "confirmed", label: "Confirmed" },
                { value: "cancelled", label: "Cancelled" },
                { value: "waitlist", label: "Waitlist" },
              ]}
            />
          </FormField>
        </FormSection>

        <FormSection title="Admin Notes">
          <FormField label="Notes" error={errors.notes} className="sm:col-span-2">
            <TextArea registration={register("notes")} error={errors.notes} rows={4} placeholder="Internal notes..." />
          </FormField>
        </FormSection>

        <div className="flex items-center gap-3 border-t border-white/10 pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-explore-lime px-5 py-2 text-sm font-semibold text-explore-black transition hover:bg-explore-lime/90 disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : "Save"}
          </button>

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
            href={
              grade && defaultEventId
                ? `/admin/event-registrations?grade=${encodeURIComponent(grade)}&event=${encodeURIComponent(defaultEventId)}`
                : grade
                  ? `/admin/event-registrations?grade=${encodeURIComponent(grade)}`
                  : "/admin/event-registrations"
            }
            className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-white/60 transition hover:text-white"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
