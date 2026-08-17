import connectDB from "@/lib/db";
import { Course } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const items = await Course.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Courses"
        description="Manage courses and curriculum"
        action={{ label: "New Course", href: "/admin/courses/new" }}
      />
      <DataTable
        columns={[
          { key: "title", header: "Title" },
          { key: "instructor", header: "Instructor" },
          { 
            key: "priceAmount", 
            header: "Price", 
            render: (row) => row.courseType === "free" ? "Free" : `$${Number(row.priceAmount).toFixed(2)}`
          },
          { key: "status", header: "Status", render: (row) => <StatusBadge status={String(row.status)} /> },
          { 
            key: "publishedToWebsite", 
            header: "Website", 
            render: (row) => (
              row.publishedToWebsite ? (
                <span className="text-xs text-green-400">✓ Published</span>
              ) : (
                <span className="text-xs text-white/40">Not published</span>
              )
            )
          },
          { key: "enrollmentStatus", header: "Enrollment", render: (row) => <StatusBadge status={String(row.enrollmentStatus)} /> },
        ]}
        data={data}
        rowHref={(row) => "/admin/courses/" + String(row._id)}
        emptyMessage="No records found."
      />
    </div>
  );
}
