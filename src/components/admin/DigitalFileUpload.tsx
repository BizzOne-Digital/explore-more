"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Upload, CheckCircle, XCircle, Loader } from "lucide-react";

interface DigitalFileUploadProps {
  bookId: string;
  currentFile?: {
    fileName: string;
    fileSizeBytes: number;
    enabled: boolean;
  };
  onUploadSuccess?: () => void;
}

export function DigitalFileUpload({ bookId, currentFile, onUploadSuccess }: DigitalFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      setError("File too large. Maximum 500MB allowed.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess(false);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bookId", bookId);

      const response = await fetch("/api/admin/books/upload-digital", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setSuccess(true);
      setProgress(100);
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Refresh page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this digital file?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/books/upload-digital?bookId=${bookId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Delete failed");
      }

      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Digital Download File</h3>
        
        {currentFile ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">File Uploaded</span>
            </div>
            <p className="text-sm text-gray-700">
              📄 {currentFile.fileName}
            </p>
            <p className="text-sm text-gray-600">
              Size: {formatFileSize(currentFile.fileSizeBytes)}
            </p>
            <p className="text-sm text-gray-600">
              Status: {currentFile.enabled ? "✅ Enabled" : "❌ Disabled"}
            </p>
            <button
              onClick={handleDelete}
              className="mt-3 text-sm text-red-600 hover:text-red-700 underline"
            >
              Delete File
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-600 mb-4">
            No digital file uploaded. Upload a PDF, EPUB, or MOBI file (max 500MB).
          </p>
        )}

        <div className="flex items-center gap-4">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.epub,.mobi,.zip"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {uploading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {currentFile ? "Replace File" : "Upload File"}
                </>
              )}
            </div>
          </label>
        </div>

        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">Uploading to Cloudflare R2...</p>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">Upload successful! Refreshing page...</span>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Important Notes:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Supported formats: PDF, EPUB, MOBI, ZIP</li>
          <li>• Maximum file size: 500MB</li>
          <li>• Files are stored securely in Cloudflare R2</li>
          <li>• Customers get download link after purchase</li>
          <li>• Download links expire after 15 minutes (for security)</li>
        </ul>
      </div>
    </div>
  );
}
