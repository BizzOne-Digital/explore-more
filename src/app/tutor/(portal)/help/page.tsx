import Link from "next/link";
import { COMPANY } from "@/lib/constants";

export default function TutorHelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Help & Support</h2>
        <p className="mt-1 text-sm text-gray-500">Get assistance using the Staff Portal.</p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4 text-sm text-gray-600">
        <p>
          For technical issues, use{" "}
          <Link href="/tutor/staff-messages" className="text-violet-600 hover:underline">
            Staff Messages
          </Link>{" "}
          and choose <strong>Technical Support</strong>.
        </p>
        <p>
          To reach administration, email{" "}
          <a href={`mailto:${COMPANY.email}`} className="text-violet-600 hover:underline">
            {COMPANY.email}
          </a>
          .
        </p>
        <p>
          Student assignments are managed by administrators using your 6-digit Staff ID. Parents
          are only visible when assigned to your students.
        </p>
      </div>
    </div>
  );
}
