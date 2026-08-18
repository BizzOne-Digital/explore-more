"use client";

import { useRef, useCallback, useState } from "react";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  Image as ImageIcon,
  List,
  ListOrdered,
  Heading2,
  Code,
  Eye,
  Edit3,
  Upload,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: { message?: string };
  placeholder?: string;
  minHeight?: string;
  enableImageUpload?: boolean;
  imageUploadEndpoint?: string;
}

async function uploadEditorImage(file: File, endpoint: string): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(endpoint, { method: "POST", body: formData });
  const json = await res.json();
  if (!res.ok) return null;
  return json.data?.url ?? json.url ?? null;
}

export function RichTextEditor({
  value,
  onChange,
  label,
  error,
  placeholder,
  minHeight = "300px",
  enableImageUpload = false,
  imageUploadEndpoint = "/api/admin/email-campaigns/upload",
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragging, setDragging] = useState(false);

  const insertText = useCallback(
    (before: string, after: string = "", placeholderText: string = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const textToInsert = selectedText || placeholderText;
      const newText =
        value.substring(0, start) + before + textToInsert + after + value.substring(end);

      onChange(newText);

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + before.length + textToInsert.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [value, onChange]
  );

  const wrapSelection = useCallback(
    (tag: string, placeholderText: string = "") => {
      insertText(`<${tag}>`, `</${tag}>`, placeholderText);
    },
    [insertText]
  );

  const insertLink = useCallback(() => {
    const url = prompt("Enter URL:");
    if (!url) return;
    const text = prompt("Enter link text:") || url;
    insertText(`<a href="${url}" style="color: #0c8991; text-decoration: underline;">`, `</a>`, text);
  }, [insertText]);

  const insertImageHtml = useCallback(
    (url: string, alt: string) => {
      insertText(
        `<img src="${url}" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" />`,
        ""
      );
    },
    [insertText]
  );

  const insertImage = useCallback(() => {
    if (enableImageUpload) {
      imageInputRef.current?.click();
      return;
    }
    const url = prompt("Enter image URL:");
    if (!url) return;
    const alt = prompt("Enter image description (alt text):") || "Image";
    insertImageHtml(url, alt);
  }, [enableImageUpload, insertImageHtml]);

  const handleImageFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setUploadingImage(true);
      try {
        const url = await uploadEditorImage(file, imageUploadEndpoint);
        if (url) {
          insertImageHtml(url, file.name);
        }
      } finally {
        setUploadingImage(false);
      }
    },
    [imageUploadEndpoint, insertImageHtml]
  );

  const insertButton = useCallback(() => {
    const text = prompt("Enter button text:") || "Click Here";
    const url = prompt("Enter button URL:") || "#";
    insertText(
      `<a href="${url}" style="display: inline-block; background: #0c8991; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 10px 0;">`,
      `</a>`,
      text
    );
  }, [insertText]);

  const insertHeading = useCallback(() => {
    wrapSelection("h2", "Heading");
  }, [wrapSelection]);

  const insertList = useCallback(() => {
    insertText("<ul>\n  <li>", "</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>", "Item 1");
  }, [insertText]);

  const insertOrderedList = useCallback(() => {
    insertText("<ol>\n  <li>", "</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ol>", "Item 1");
  }, [insertText]);

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-white/80">{label}</label>}

      <div className="flex flex-wrap gap-1 rounded-t-lg border border-b-0 border-white/10 bg-white/5 p-2">
        <button type="button" onClick={() => wrapSelection("strong", "bold text")} className="rounded p-2 text-white/60 transition hover:bg-white/10 hover:text-white" title="Bold">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => wrapSelection("em", "italic text")} className="rounded p-2 text-white/60 transition hover:bg-white/10 hover:text-white" title="Italic">
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" onClick={insertHeading} className="rounded p-2 text-white/60 transition hover:bg-white/10 hover:text-white" title="Heading">
          <Heading2 className="h-4 w-4" />
        </button>
        <div className="mx-1 w-px bg-white/10" />
        <button type="button" onClick={insertLink} className="rounded p-2 text-white/60 transition hover:bg-white/10 hover:text-white" title="Insert Link">
          <LinkIcon className="h-4 w-4" />
        </button>
        <button type="button" onClick={insertImage} disabled={uploadingImage} className="rounded p-2 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-50" title={enableImageUpload ? "Upload Image" : "Insert Image"}>
          {uploadingImage ? <Upload className="h-4 w-4 animate-pulse" /> : <ImageIcon className="h-4 w-4" />}
        </button>
        <button type="button" onClick={insertButton} className="rounded bg-explore-teal/20 px-3 py-1 text-xs font-medium text-explore-teal transition hover:bg-explore-teal/30" title="Insert Button">
          Button
        </button>
        <div className="mx-1 w-px bg-white/10" />
        <button type="button" onClick={insertList} className="rounded p-2 text-white/60 transition hover:bg-white/10 hover:text-white" title="Bullet List">
          <List className="h-4 w-4" />
        </button>
        <button type="button" onClick={insertOrderedList} className="rounded p-2 text-white/60 transition hover:bg-white/10 hover:text-white" title="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => wrapSelection("code", "code")} className="rounded p-2 text-white/60 transition hover:bg-white/10 hover:text-white" title="Code">
          <Code className="h-4 w-4" />
        </button>
        <div className="flex-1" />
        <button type="button" onClick={() => setShowPreview(!showPreview)} className={`rounded p-2 transition ${showPreview ? "bg-explore-teal/20 text-explore-teal" : "text-white/60 hover:bg-white/10 hover:text-white"}`} title={showPreview ? "Edit" : "Preview"}>
          {showPreview ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {showPreview ? (
        <div className="min-h-[300px] rounded-b-lg border border-white/10 bg-white/5 p-4 text-white" style={{ minHeight }} dangerouslySetInnerHTML={{ __html: value }} />
      ) : (
        <div
          className={`relative rounded-b-lg border border-white/10 ${dragging ? "ring-2 ring-explore-teal" : ""}`}
          onDragOver={(e) => {
            if (!enableImageUpload) return;
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            if (!enableImageUpload) return;
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleImageFile(file);
          }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Enter your message here..."}
            className="w-full rounded-b-lg bg-white/5 p-4 font-mono text-sm text-white placeholder:text-white/30 focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
            style={{ minHeight }}
          />
          {enableImageUpload && dragging && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-b-lg bg-explore-teal/10 text-sm font-medium text-explore-teal">
              Drop image to upload
            </div>
          )}
        </div>
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageFile(file);
          e.target.value = "";
        }}
      />

      {error?.message && <p className="text-xs text-red-400">{error.message}</p>}

      <p className="text-xs text-white/40">
        Use the toolbar to format your message.
        {enableImageUpload ? " Drag and drop images into the editor or use the image button to upload." : ""}
      </p>
    </div>
  );
}
