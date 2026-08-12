import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  accent?: "lime" | "teal" | "orange";
}

export function StatCard({ label, value, icon: Icon, trend, accent = "lime" }: StatCardProps) {
  const accentClasses = {
    lime: "bg-explore-lime/15 text-explore-lime",
    teal: "bg-explore-teal/15 text-explore-teal",
    orange: "bg-explore-orange/15 text-explore-orange",
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white/60">{label}</p>
          <p className="mt-1 font-display text-3xl font-semibold text-white">{value}</p>
          {trend && <p className="mt-1 text-xs text-white/45">{trend}</p>}
        </div>
        <div className={cn("rounded-lg p-2.5", accentClasses[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
