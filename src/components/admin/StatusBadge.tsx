"use client";

import { cn } from "@/lib/cn";

const statusStyles: Record<string, string> = {
  draft: "bg-white/10 text-white/70",
  published: "bg-explore-teal/20 text-explore-teal",
  active: "bg-explore-teal/20 text-explore-teal",
  open: "bg-explore-teal/20 text-explore-teal",
  paid: "bg-explore-lime/20 text-explore-lime",
  free: "bg-explore-sky/20 text-explore-sky",
  pending: "bg-explore-orange/20 text-explore-orange",
  new: "bg-explore-orange/20 text-explore-orange",
  cancelled: "bg-red-500/20 text-red-400",
  failed: "bg-red-500/20 text-red-400",
  archived: "bg-white/10 text-white/50",
  completed: "bg-explore-lime/20 text-explore-lime",
  sent: "bg-explore-lime/20 text-explore-lime",
  read: "bg-white/10 text-white/60",
  in_stock: "bg-explore-lime/20 text-explore-lime",
  low_stock: "bg-explore-orange/20 text-explore-orange",
  out_of_stock: "bg-red-500/20 text-red-400",
  visible: "bg-explore-lime/20 text-explore-lime",
  hidden: "bg-white/10 text-white/50",
};

export function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] ?? "bg-white/10 text-white/60";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        style
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
