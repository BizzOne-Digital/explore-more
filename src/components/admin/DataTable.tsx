"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T extends object = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  rowHref?: (row: T) => string | undefined;
  keyField?: string;
}

export function DataTable<T extends object = Record<string, unknown>>({
  columns,
  data,
  emptyMessage = "No records found.",
  rowHref,
  keyField = "_id",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-12 text-center text-white/50">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/50",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((row) => {
              const href = rowHref?.(row);
              const rowKey = String((row as Record<string, unknown>)[keyField] ?? JSON.stringify(row));

              return (
                <tr
                  key={rowKey}
                  className={cn("transition-colors", href && "hover:bg-white/5")}
                >
                  {columns.map((col, colIndex) => {
                    const content = col.render
                      ? col.render(row)
                      : ((row as Record<string, unknown>)[col.key] as React.ReactNode) ?? "—";

                    return (
                      <td
                        key={col.key}
                        className={cn("px-4 py-3 text-white/80", col.className)}
                      >
                        {href && colIndex === 0 ? (
                          <Link href={href} className="block font-medium text-white hover:text-explore-lime">
                            {content}
                          </Link>
                        ) : (
                          content
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
