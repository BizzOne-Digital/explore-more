import { TutorStaffMessagesClient } from "@/components/tutor/TutorStaffMessagesClient";

export default function TutorStaffMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Staff Messages</h2>
        <p className="mt-1 text-sm text-gray-500">
          Contact Explore More Academy staff for support.
        </p>
      </div>
      <TutorStaffMessagesClient />
    </div>
  );
}
