"use client";

import { useRef } from "react";
import { Paperclip, X } from "lucide-react";

export function MessageAttachmentField({
  files,
  onChange,
  disabled,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    onChange([...files, ...Array.from(list)]);
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-current/20 px-3 py-1.5 text-xs font-medium opacity-80 hover:opacity-100 disabled:opacity-40"
        >
          <Paperclip className="h-3.5 w-3.5" />
          Attach files (optional)
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-2 rounded-md bg-black/5 px-2 py-1 text-xs"
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="shrink-0 rounded p-0.5 hover:bg-black/10"
                aria-label="Remove attachment"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MessageAttachmentLinks({
  attachments,
}: {
  attachments?: Array<{ path: string; originalName: string }>;
}) {
  if (!attachments?.length) return null;
  return (
    <div className="mt-2 space-y-1">
      {attachments.map((file) => (
        <a
          key={file.path}
          href={`/api/files/private/${file.path}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs font-semibold text-explore-teal hover:underline"
        >
          📎 {file.originalName}
        </a>
      ))}
    </div>
  );
}
