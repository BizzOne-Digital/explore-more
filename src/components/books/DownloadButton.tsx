"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Download, Loader } from "lucide-react";

interface DownloadButtonProps {
  bookId: string;
  orderId: string;
  fileName: string;
  className?: string;
}

export function DownloadButton({ bookId, orderId, fileName, className }: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    setDownloading(true);
    setError("");

    try {
      const response = await fetch(`/api/books/download/${bookId}?orderId=${orderId}`);
      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string" ? data.error : "Download failed"
        );
      }

      if (contentType.includes("application/json")) {
        const data = await response.json();
        if (!data.downloadUrl) {
          throw new Error("Download link not available");
        }
        window.location.href = data.downloadUrl;
      } else {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName || "book.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }

      setTimeout(() => {
        setDownloading(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
      setDownloading(false);
    }
  }

  return (
    <div>
      <Button
        onClick={handleDownload}
        disabled={downloading}
        className={className}
        size="lg"
      >
        {downloading ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Preparing Download...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Download {fileName}
          </>
        )}
      </Button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
