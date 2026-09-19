export function describeUploadError(error: unknown, fallback = "Upload failed"): string {
  if (!(error instanceof Error)) return fallback;
  const message = error.message.trim();
  if (!message) return fallback;

  const lower = message.toLowerCase();
  if (
    lower === "load failed" ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network request failed")
  ) {
    return "Upload could not reach the server. Check your internet connection, refresh the page, and try again. Large files need cloud storage enabled on the live site.";
  }

  return message;
}
