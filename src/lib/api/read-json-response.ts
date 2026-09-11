type JsonRecord = { error?: string; message?: string };

export async function readJsonResponse<T extends JsonRecord>(
  res: Response,
  fallbackError = "Request failed"
): Promise<{ ok: boolean; data: T | null; error: string }> {
  const text = await res.text();

  if (!text.trim()) {
    if (res.status === 413) {
      return {
        ok: false,
        data: null,
        error: "File is too large for a direct upload. Try again or use a smaller file.",
      };
    }
    return {
      ok: false,
      data: null,
      error: res.ok ? fallbackError : res.statusText || fallbackError,
    };
  }

  try {
    const data = JSON.parse(text) as T;
    if (!res.ok) {
      return {
        ok: false,
        data,
        error: data.error || data.message || fallbackError,
      };
    }
    return { ok: true, data, error: "" };
  } catch {
    if (res.status === 413) {
      return {
        ok: false,
        data: null,
        error: "File is too large for a direct upload. Try again or use a smaller file.",
      };
    }
    return {
      ok: false,
      data: null,
      error:
        "Upload failed — the server returned an unexpected response. Please try again or use a PDF.",
    };
  }
}
