"use client";

import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface DragDropZoneState {
  dragOver: boolean;
  openFilePicker: () => void;
}

interface DragDropZoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  accept?: string;
  className?: string;
  dragActiveClassName?: string;
  clickToOpen?: boolean;
  children: ReactNode | ((state: DragDropZoneState) => ReactNode);
}

export function DragDropZone({
  onFiles,
  disabled,
  multiple,
  accept,
  className,
  dragActiveClassName = "border-explore-teal bg-explore-teal/10",
  clickToOpen = true,
  children,
}: DragDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function openFilePicker() {
    if (!disabled) inputRef.current?.click();
  }

  function ingest(fileList: FileList | null) {
    if (!fileList?.length || disabled) return;
    const files = multiple ? Array.from(fileList) : [fileList[0]];
    onFiles(files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    ingest(e.dataTransfer.files);
  }

  const rendered =
    typeof children === "function"
      ? children({ dragOver, openFilePicker })
      : children;

  return (
    <>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={clickToOpen && !disabled ? () => openFilePicker() : undefined}
        className={cn(
          className,
          dragOver && dragActiveClassName,
          disabled && "pointer-events-none opacity-60"
        )}
      >
        {rendered}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          ingest(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />
    </>
  );
}
