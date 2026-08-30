import { TutorStudentDetailClient } from "@/components/tutor/TutorStudentDetailClient";

export default async function TutorStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TutorStudentDetailClient studentId={id} />;
}
