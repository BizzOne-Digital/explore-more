import { cn } from "@/lib/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || props.name;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-explore-charcoal">
          {label}
          {props.required && <span className="text-explore-orange ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full rounded-xl border border-explore-charcoal/15 bg-white px-4 py-2.5 text-sm text-explore-charcoal placeholder:text-explore-charcoal/40 transition-colors focus:border-explore-teal focus:outline-none focus:ring-2 focus:ring-explore-teal/20 disabled:opacity-50",
          error && "border-red-400 focus:border-red-400 focus:ring-red-200",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
