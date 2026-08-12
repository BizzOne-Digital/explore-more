import connectDB from "@/lib/db";
import { User } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate } from "@/lib/admin/serialize";
import { notFound } from "next/navigation";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();

  const user = await User.findById(id).select("-passwordHash").lean();
  if (!user) notFound();

  const data = serialize(user);

  return (
    <div>
      <PageHeader title={data.name} description={data.email} />

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-white/50">Role</dt>
            <dd className="mt-1">
              <StatusBadge status={data.role} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-white/50">Active</dt>
            <dd className="mt-1 text-white">{data.isActive ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-xs text-white/50">Email Verified</dt>
            <dd className="mt-1 text-white">{data.emailVerified ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-xs text-white/50">Phone</dt>
            <dd className="mt-1 text-white">{data.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-white/50">Joined</dt>
            <dd className="mt-1 text-white">{formatDate(data.createdAt)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
