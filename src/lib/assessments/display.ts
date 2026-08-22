export function getAssessmentFileUrl(filePath: string): string {
  const trimmed = filePath.trim();
  if (!trimmed) return "#";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `/api/files/private/${trimmed.replace(/^\/+/, "")}`;
}
