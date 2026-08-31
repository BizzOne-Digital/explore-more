import type { ComponentProps } from "react";
import connectDB from "@/lib/db";
import { User } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { UserSearchTable } from "@/components/admin/UserSearchTable";
import { serializeAdmin } from "@/lib/admin/serialize";
import { ensureAllTutorIds } from "@/lib/tutor/tutor-id";

async function getData() {
  await connectDB();
  await ensureAllTutorIds();
  const items = await User.find().sort({ createdAt: -1 }).lean();
  return serializeAdmin(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Users"
        description="Search and manage all user accounts"
        action={{ label: "Create User", href: "/admin/users/new" }}
      />
      <UserSearchTable users={data as unknown as ComponentProps<typeof UserSearchTable>["users"]} />
    </div>
  );
}
