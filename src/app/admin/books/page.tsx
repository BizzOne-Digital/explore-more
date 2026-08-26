import type { Metadata } from "next";
import Image from "next/image";
import connectDB from "@/lib/db";
import { Book } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DeletableDataTable } from "@/components/admin/DeletableDataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize } from "@/lib/admin/serialize";

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
      <DeletableDataTable
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
          { key: "priceAmount", header: "Price", render: (row) => `$${Number(row.priceAmount).toFixed(2)}` },
          {
            key: "status",
            header: "Status",
            render: (row) => <StatusBadge status={String(row.status)} />,
          },
          {
            key: "publishedToWebsite",
            header: "Website",
            render: (row) =>
              row.publishedToWebsite ? (
                <span className="text-xs text-green-400">✓ Published</span>
              ) : (
                <span className="text-xs text-white/40">Not published</span>
              ),
          },
          { key: "stockStatus", header: "Stock", render: (row) => <StatusBadge status={String(row.stockStatus)} /> },
          { key: "inventory", header: "Qty" },
        ]}
        data={data as unknown as { _id: string; title?: string; coverImage?: string; author?: string; priceAmount?: number; status?: string; publishedToWebsite?: boolean; stockStatus?: string; inventory?: number }[]}
        rowHref={(row) => "/admin/books/" + String(row._id)}
        deleteUrl={(row) => `/api/admin/books/${row._id}`}
        itemLabel={(row) => String(row.title ?? "this book")}
        emptyMessage="No records found."
      />
    </div>
  );
}
