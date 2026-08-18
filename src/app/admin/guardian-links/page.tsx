import connectDB from "@/lib/db";
import { AdminGuardianLinksManager } from "@/components/admin/GuardianLinksManager";
import { ensureAllStudentIds } from "@/lib/students/id";

export default async function AdminGuardianLinksPage() {
  await connectDB();
  await ensureAllStudentIds();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white mb-2">Guardian Links</h1>
      <p className="text-sm text-white/50 mb-6">Approve parent–student links so families can access the Parent Portal.</p>
      <AdminGuardianLinksManager />
    </div>
  );
}
