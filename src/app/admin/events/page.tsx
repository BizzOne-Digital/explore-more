import connectDB from "@/lib/db";
import { Event } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const items = await Event.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Events"
        description="Manage events and workshops"
        action={{ label: "New Event", href: "/admin/events/new" }}
      />
      <DataTable
        columns={[
    { key: "title", header: "Title" },
    { key: "startDate", header: "Start", render: (row) => formatDate(row.startDate) },
    { key: "location", header: "Location" },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={String(row.status)} /> },
        ]}
        data={data}
        rowHref={(row) => "/admin/events/" + String(row._id)}
        emptyMessage="No records found."
      />
    </div>
  );
}
