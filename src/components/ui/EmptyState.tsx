import { Compass } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-explore-charcoal/15 bg-white/50 px-8 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-explore-teal/10">
        <Compass className="h-7 w-7 text-explore-teal" />
      </div>
      <h3 className="font-display text-xl font-bold text-explore-charcoal">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-explore-charcoal/60">{description}</p>}
      {actionLabel && actionHref && (
        <div className="mt-6">
          <Button href={actionHref} variant="secondary">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
