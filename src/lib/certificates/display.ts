/** Build a human-readable "associated with" label from certificate fields. */
export function getCertificateAssociation(cert: {
  associatedCourse?: string | null;
  associatedProgram?: string | null;
  associatedEvent?: string | null;
  courseId?: unknown;
  programId?: unknown;
  eventId?: unknown;
}): string | null {
  const parts: string[] = [];

  if (cert.associatedCourse?.trim()) parts.push(cert.associatedCourse.trim());
  else if (cert.courseId && typeof cert.courseId === "object" && cert.courseId !== null && "title" in cert.courseId) {
    const title = (cert.courseId as { title?: string }).title;
    if (title) parts.push(title);
  }

  if (cert.associatedProgram?.trim()) parts.push(cert.associatedProgram.trim());
  else if (cert.programId && typeof cert.programId === "object" && cert.programId !== null && "title" in cert.programId) {
    const title = (cert.programId as { title?: string }).title;
    if (title) parts.push(title);
  }

  if (cert.associatedEvent?.trim()) parts.push(cert.associatedEvent.trim());
  else if (cert.eventId && typeof cert.eventId === "object" && cert.eventId !== null && "title" in cert.eventId) {
    const title = (cert.eventId as { title?: string }).title;
    if (title) parts.push(title);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

/** Authenticated download/view URL for certificate files stored privately. */
export function getCertificateFileUrl(filePath: string): string {
  const trimmed = filePath.trim();
  if (!trimmed) return "#";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("/api/")) return trimmed;
  return `/api/files/private/${trimmed.replace(/^\/+/, "")}`;
}
