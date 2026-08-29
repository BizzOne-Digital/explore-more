"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
  searchText: string;
}

interface AdminSearchableSelectProps {
  label: string;
  placeholder: string;
  searchHint?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
}

export function AdminSearchableSelect({
  label,
  placeholder,
  searchHint,
  value,
  onChange,
  options,
}: AdminSearchableSelectProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 50);
    return options
      .filter((option) => option.searchText.includes(q))
      .slice(0, 50);
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

  function handleSelect(option: SearchableOption) {
    onChange(option.value);
    setQuery("");
    setOpen(false);
  }

  function handleClear() {
    onChange("");
    setQuery("");
    setOpen(true);
  }

  const displayValue = open ? query : selected?.label ?? "";

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-xs text-white/60">{label}</label>
      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={displayValue}
          placeholder={selected ? selected.label : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange("");
          }}
          onFocus={() => setOpen(true)}
          className="w-full rounded-lg border border-white/10 bg-black/20 py-2 pl-3 pr-16 text-sm text-white placeholder:text-white/30 focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-0.5 text-white/40 hover:text-white"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown className="h-4 w-4 text-white/40" />
        </div>
      </div>
      {searchHint && (
        <p className="mt-1 text-[11px] text-white/35">{searchHint}</p>
      )}
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-white/10 bg-explore-charcoal shadow-xl"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-white/40">No matches found</li>
          ) : (
            filtered.map((option) => (
              <li key={option.value} role="option" aria-selected={option.value === value}>
                <button
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "w-full px-3 py-2.5 text-left text-sm transition hover:bg-white/10",
                    option.value === value && "bg-explore-teal/15"
                  )}
                >
                  <span className="block font-medium text-white">{option.label}</span>
                  {option.sublabel && (
                    <span className="mt-0.5 block text-xs text-white/45">{option.sublabel}</span>
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
