import type { Metadata } from "next";
import Image from "next/image";
import connectDB from "@/lib/db";
import { Book } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize } from "@/lib/admin/serialize";
import { formatCents } from "@/lib/utils";

async function getData() {
  await connectDB();
  const items = await Book.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Books"
        description="Manage bookstore inventory"
        action={{ label: "New Book", href: "/admin/books/new" }}
      />
      <DataTable
        columns={[
          {
            key: "coverImage",
            header: "Cover",
            render: (row) =>
              row.coverImage ? (
                <Image
                  src={String(row.coverImage)}
                  alt=""
                  width={36}
                  height={48}
                  className="h-12 w-9 rounded object-cover bg-explore-sand"
                />
              ) : (
                "—"
              ),
          },
          { key: "title", header: "Title" },
          { key: "author", header: "Author" },
          { key: "priceCents", header: "Price", render: (row) => formatCents(row.priceCents as number) },
          {
            key: "published",
            header: "Status",
            render: (row) => (
              <StatusBadge status={row.published ? "published" : "draft"} />
            ),
          },
          { key: "stockStatus", header: "Stock", render: (row) => <StatusBadge status={String(row.stockStatus)} /> },
          { key: "inventory", header: "Qty" },
        ]}
        data={data}
        rowHref={(row) => "/admin/books/" + String(row._id)}
        emptyMessage="No records found."
      />
    </div>
  );
}
