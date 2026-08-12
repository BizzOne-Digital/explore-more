import connectDB from "@/lib/db";
import { Program } from "@/models";
import { ProgramForm } from "@/components/admin/forms/ProgramForm";
import { toAdminRecord } from "@/lib/admin/serialize";
import { notFound } from "next/navigation";

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const program = await Program.findById(id).lean();
  if (!program) notFound();
  return <ProgramForm initialData={toAdminRecord(program)} />;
}
