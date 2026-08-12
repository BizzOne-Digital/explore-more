import { cn } from "@/lib/cn";

const variants = {
  default: "bg-explore-charcoal/8 text-explore-charcoal",
  teal: "bg-explore-teal/15 text-explore-teal",
  lime: "bg-explore-lime/30 text-explore-forest",
  orange: "bg-explore-orange/15 text-explore-orange",
  forest: "bg-explore-forest/15 text-explore-forest",
} as const;

interface BadgeProps {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
