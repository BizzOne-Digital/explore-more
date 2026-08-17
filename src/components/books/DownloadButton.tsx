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
      // Get the signed download URL from API
      const response = await fetch(`/api/books/download/${bookId}?orderId=${orderId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Download failed");
      }

      // Redirect to the signed URL (browser will start download)
      window.location.href = data.downloadUrl;

      // Show success message
      setTimeout(() => {
        setDownloading(false);
      }, 2000);
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
            <Loader className="h-4 w-4 animate-spin mr-2" />
            Preparing Download...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download {fileName}
          </>
        )}
      </Button>
      
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
