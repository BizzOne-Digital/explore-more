import { TeacherColleagueMessagesClient } from "@/components/teacher/TeacherColleagueMessagesClient";

export const dynamic = "force-dynamic";

export default function TeacherColleagueMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Colleague Messages</h2>
        <p className="mt-1 text-sm text-gray-500">
          Message and share resources with teachers at your registered school only.
        </p>
      </div>
      <TeacherColleagueMessagesClient />
    </div>
  );
}
