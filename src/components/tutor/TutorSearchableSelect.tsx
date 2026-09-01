"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface TutorSearchableOption {
  value: string;
  label: string;
  sublabel?: string;
  searchText: string;
}

interface TutorSearchableSelectProps {
  label: string;
  placeholder: string;
  searchHint?: string;
  value: string;
  onChange: (value: string) => void;
  options: TutorSearchableOption[];
  disabled?: boolean;
}

export function TutorSearchableSelect({
  label,
  placeholder,
  searchHint,
  value,
  onChange,
  options,
  disabled = false,
}: TutorSearchableSelectProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 50);
    return options.filter((option) => option.searchText.includes(q)).slice(0, 50);
  }, [options, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        if (selected) setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected]);

  function handleSelect(option: TutorSearchableOption) {
    onChange(option.value);
    setQuery("");
    setOpen(false);
  }

  function handleClear() {
    onChange("");
    setQuery("");
    setOpen(true);
  }

  const displayValue = open ? query : (selected?.label ?? "");

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-sm font-medium text-explore-charcoal/70">{label}</label>
      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          disabled={disabled}
          value={displayValue}
          placeholder={selected ? selected.label : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange("");
          }}
          onFocus={() => !disabled && setOpen(true)}
          className="w-full rounded-lg border border-explore-charcoal/20 py-2 pl-3 pr-16 text-sm disabled:bg-gray-50 disabled:text-gray-400"
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-0.5 text-gray-400 hover:text-gray-600"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      {searchHint && <p className="mt-1 text-xs text-explore-charcoal/50">{searchHint}</p>}
      {open && !disabled && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-explore-charcoal/15 bg-white shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-gray-500">No matches found</li>
          ) : (
            filtered.map((option) => (
              <li key={option.value} role="option" aria-selected={option.value === value}>
                <button
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "w-full px-3 py-2.5 text-left text-sm transition hover:bg-violet-50",
                    option.value === value && "bg-violet-100"
                  )}
                >
                  <span className="block font-medium text-explore-charcoal">{option.label}</span>
                  {option.sublabel && (
                    <span className="mt-0.5 block text-xs text-gray-500">{option.sublabel}</span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
