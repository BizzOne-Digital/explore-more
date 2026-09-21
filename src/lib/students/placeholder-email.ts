const PLACEHOLDER_DOMAIN = "students.exploremoreacademy.com";

/** Internal email for students without their own inbox (login uses Student ID). */
export function studentPlaceholderEmail(studentId: string): string {
  return `student.${studentId}@${PLACEHOLDER_DOMAIN}`;
}

export function isStudentPlaceholderEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${PLACEHOLDER_DOMAIN}`);
}
