import { TutorUploadResourceForm } from "@/components/tutor/TutorUploadResourceForm";

export default function TutorUploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Upload Student Resource</h2>
        <p className="mt-1 text-sm text-gray-500">
          Search for a student by name or Student ID, or publish to all students at once.
          Worksheets, homework, PDFs, and links appear in the student and parent portals.
        </p>
      </div>
      <TutorUploadResourceForm />
    </div>
  );
}
