import { SchoolsDetailClient } from "@/components/admin/SchoolsDetailClient";

export const metadata = { title: "School | Admin" };

export default async function AdminSchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SchoolsDetailClient schoolId={id} />;
}
