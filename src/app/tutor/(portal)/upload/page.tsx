import { TutorUploadResourceForm } from "@/components/tutor/TutorUploadResourceForm";

export default function TutorUploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Upload Student Resource</h2>
        <p className="mt-1 text-sm text-gray-500">
          Select a student, choose a resource type, and publish worksheets, homework, PDFs, or
          links to their account and parent portal.
        </p>
      </div>
      <TutorUploadResourceForm />
    </div>
  );
}
