import connectDB from "@/lib/db";
import { Message } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const items = await Message.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Messages"
        description="User messages and announcements"
        
      />
      <DataTable
        columns={[
    { key: "subject", header: "Subject" },
    { key: "isAnnouncement", header: "Announcement", render: (row) => row.isAnnouncement ? "Yes" : "No" },
    { key: "read", header: "Read", render: (row) => row.read ? "Yes" : "No" },
    { key: "createdAt", header: "Sent", render: (row) => formatDate(row.createdAt) },
        ]}
        data={data}
        
        emptyMessage="No records found."
      />
    </div>
  );
}
