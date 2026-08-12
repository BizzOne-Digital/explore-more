import { cn } from "@/lib/cn";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const inputId = id || props.name;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-explore-charcoal">
          {label}
          {props.required && <span className="text-explore-orange ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          "w-full rounded-xl border border-explore-charcoal/15 bg-white px-4 py-2.5 text-sm text-explore-charcoal placeholder:text-explore-charcoal/40 transition-colors focus:border-explore-teal focus:outline-none focus:ring-2 focus:ring-explore-teal/20 disabled:opacity-50 min-h-[120px] resize-y",
          error && "border-red-400 focus:border-red-400 focus:ring-red-200",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
