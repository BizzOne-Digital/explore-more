import connectDB from "@/lib/db";
import { EmailCampaign } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate } from "@/lib/admin/serialize";
import { Mail, Bell } from "lucide-react";

async function getData() {
  await connectDB();
  const items = await EmailCampaign.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

const priorityBadge = (priority: string) => {
  const colors = {
    normal: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    important: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    urgent: "bg-red-500/10 text-red-400 border-red-500/30",
  };
  const icons = { normal: "📢", important: "⚠️", urgent: "🚨" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${colors[priority as keyof typeof colors] || colors.normal}`}>
      {icons[priority as keyof typeof icons]} {priority}
    </span>
  );
};

const deliveryBadge = (method: string) => {
  if (method === "both") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-white/60">
        <Mail className="h-3 w-3" /> + <Bell className="h-3 w-3" />
      </span>
    );
  }
  if (method === "notification") {
    return <Bell className="h-4 w-4 text-white/60" />;
  }
  return <Mail className="h-4 w-4 text-white/60" />;
};

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Email Campaigns"
        description="Create and manage email campaigns and notifications for parents"
        action={{ label: "New Campaign", href: "/admin/email-campaigns/new" }}
      />
      <DataTable
        columns={[
          { key: "subject", header: "Subject" },
          { 
            key: "deliveryMethod", 
            header: "Delivery", 
            render: (row) => deliveryBadge(String(row.deliveryMethod || "email"))
          },
          { 
            key: "priority", 
            header: "Priority", 
            render: (row) => priorityBadge(String(row.priority || "normal"))
          },
          { 
            key: "recipientCount", 
            header: "Recipients",
            render: (row) => (
              <div className="text-sm">
                <div className="font-medium text-white">{row.recipientCount || 0}</div>
                {row.sentCount > 0 && (
                  <div className="text-xs text-white/60">
                    {row.sentCount} sent
                    {row.failedCount > 0 && `, ${row.failedCount} failed`}
                  </div>
                )}
              </div>
            )
          },
          { 
            key: "status", 
            header: "Status", 
            render: (row) => <StatusBadge status={String(row.status)} /> 
          },
          {
            key: "sentAt",
            header: "Sent",
            render: (row) => row.sentAt ? formatDate(String(row.sentAt)) : "-"
          },
        ]}
        data={data}
        rowHref={(row) => "/admin/email-campaigns/" + String(row._id)}
        emptyMessage="No campaigns found. Create your first campaign to get started."
      />
    </div>
  );
}
