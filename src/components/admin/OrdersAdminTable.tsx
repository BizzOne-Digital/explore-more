"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate } from "@/lib/admin/serialize";
import { formatCents } from "@/lib/utils";

export type OrderRow = {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  totalCents: number;
  paymentStatus: string;
  createdAt: string;
};

export function OrdersAdminTable({ orders, initialSearch = "" }: { orders: OrderRow[]; initialSearch?: string }) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((order) => {
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        (order.customerEmail ?? "").toLowerCase().includes(q)
      );
    });
  }, [orders, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by email, name, or order #…"
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-white/40 focus:border-explore-teal/50 focus:outline-none focus:ring-1 focus:ring-explore-teal/40"
          aria-label="Search orders"
        />
      </div>

      <DataTable
        columns={[
          { key: "orderNumber", header: "Order #" },
          { key: "customerName", header: "Customer" },
          {
            key: "customerEmail",
            header: "Email",
            render: (row) => (
              <a
                href={`mailto:${row.customerEmail ?? ""}`}
                className="text-explore-lime hover:underline"
              >
                {row.customerEmail || "—"}
              </a>
            ),
          },
          {
            key: "totalCents",
            header: "Total",
            render: (row) => formatCents(row.totalCents),
          },
          {
            key: "paymentStatus",
            header: "Status",
            render: (row) => <StatusBadge status={String(row.paymentStatus)} />,
          },
          {
            key: "createdAt",
            header: "Date",
            render: (row) => formatDate(row.createdAt),
          },
        ]}
        data={filtered}
        rowHref={(row) => `/admin/orders/${row._id}`}
        emptyMessage={searchTerm ? "No orders match your search." : "No records found."}
      />

      {searchTerm && (
        <p className="text-xs text-white/50">
          Showing {filtered.length} of {orders.length} orders.{" "}
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="text-explore-lime hover:underline"
          >
            Clear search
          </button>
        </p>
      )}
    </div>
  );
}
