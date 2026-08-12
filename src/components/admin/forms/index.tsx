"use client";

import { cn } from "@/lib/cn";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface FormFieldProps {
  label: string;
  error?: FieldError;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, error, hint, required, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-sm font-medium text-white/80">
        {label}
        {required && <span className="ml-1 text-explore-orange">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-white/40">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error.message}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  registration: UseFormRegisterReturn;
  error?: FieldError;
}

export function TextInput({ registration, error, className, ...props }: TextInputProps) {
  return (
    <input
      {...registration}
      {...props}
      className={cn(inputClass, error && "border-red-500/50", className)}
    />
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  registration: UseFormRegisterReturn;
  error?: FieldError;
}

export function TextArea({ registration, error, className, ...props }: TextAreaProps) {
  return (
    <textarea
      {...registration}
      {...props}
      className={cn(inputClass, "min-h-[100px] resize-y", error && "border-red-500/50", className)}
    />
  );
}

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  registration: UseFormRegisterReturn;
  error?: FieldError;
  options: { value: string; label: string }[];
}

export function SelectInput({ registration, error, options, className, ...props }: SelectInputProps) {
  return (
    <select
      {...registration}
      {...props}
      className={cn(inputClass, error && "border-red-500/50", className)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-explore-charcoal">
          {opt.label}
        </option>
      ))}
    </select>
  );
}

interface CheckboxInputProps {
  registration: UseFormRegisterReturn;
  label: string;
}

export function CheckboxInput({ registration, label }: CheckboxInputProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
      <input
        type="checkbox"
        {...registration}
        className="h-4 w-4 rounded border-white/20 bg-white/5 text-explore-teal focus:ring-explore-teal"
      />
      {label}
    </label>
  );
}

interface FormActionsProps {
  isSubmitting?: boolean;
  cancelHref?: string;
  submitLabel?: string;
}

export function FormActions({
  isSubmitting,
  cancelHref,
  submitLabel = "Save",
}: FormActionsProps) {
  return (
    <div className="flex items-center gap-3 border-t border-white/10 pt-6">
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-explore-lime px-5 py-2 text-sm font-semibold text-explore-black transition hover:bg-explore-lime/90 disabled:opacity-50"
      >
        {isSubmitting ? "Saving…" : submitLabel}
      </button>
      {cancelHref && (
        <a
          href={cancelHref}
          className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-white/60 transition hover:text-white"
        >
          Cancel
        </a>
      )}
    </div>
  );
}

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5">
      <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
