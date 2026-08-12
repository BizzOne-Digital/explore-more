import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  dark?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  dark = false,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl min-w-0 break-anywhere",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "mb-2 text-xs font-semibold uppercase tracking-[0.12em] sm:tracking-[0.2em]",
            dark ? "text-explore-lime" : "text-explore-teal"
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl",
          dark ? "text-white" : "text-explore-charcoal"
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 text-lg leading-relaxed",
            dark ? "text-white/70" : "text-explore-charcoal/70"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
