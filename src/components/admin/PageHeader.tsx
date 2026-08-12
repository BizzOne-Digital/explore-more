import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  children?: React.ReactNode;
}

export function PageHeader({ title, description, action, children }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-white/50">{description}</p>}
      </div>
      <div className={cn("flex shrink-0 items-center gap-3")}>
        {children}
        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 rounded-lg bg-explore-lime px-4 py-2 text-sm font-semibold text-explore-black transition hover:bg-explore-lime/90"
          >
            <Plus className="h-4 w-4" />
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
