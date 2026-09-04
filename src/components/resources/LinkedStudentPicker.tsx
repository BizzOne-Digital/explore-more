type LinkedStudentOption = {
  id: string;
  name: string;
  grade?: string;
};

type LinkedStudentPickerProps = {
  students: LinkedStudentOption[];
  onSelect: (student: LinkedStudentOption) => void;
};

export function LinkedStudentPicker({ students, onSelect }: LinkedStudentPickerProps) {
  if (students.length === 0) return null;

  return (
    <div className="rounded-xl border border-explore-teal/20 bg-explore-teal/5 p-4">
      <p className="text-sm font-medium text-explore-charcoal">Fill from a linked child</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {students.map((student) => (
          <button
            key={student.id}
            type="button"
            onClick={() => onSelect(student)}
            className="rounded-full border border-explore-teal/30 bg-white px-3 py-1.5 text-sm font-medium text-explore-teal hover:bg-explore-teal hover:text-white"
          >
            {student.name}
            {student.grade ? ` · ${student.grade}` : ""}
          </button>
        ))}
      </div>
    </div>
  );
}

export type { LinkedStudentOption };
