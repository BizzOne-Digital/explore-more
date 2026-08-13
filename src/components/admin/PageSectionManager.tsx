"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PAGE_KEYS, type PageKey } from "@/lib/constants";
import {
  formatPageTitle,
  getPageSectionCatalog,
  mergeSectionStates,
} from "@/lib/content/page-sections";
import { cn } from "@/lib/cn";

interface PageRecord {
  key: string;
  sections?: Array<{ internalName: string; visible?: boolean }>;
}

export function PageSectionManager({ pageKey }: { pageKey?: PageKey }) {
  const router = useRouter();
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedPage, setExpandedPage] = useState<PageKey | null>(pageKey ?? null);

  useEffect(() => {
    fetch("/api/admin/pages")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setPages(json.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const pageKeys = useMemo(() => (pageKey ? [pageKey] : PAGE_KEYS), [pageKey]);

  async function toggleSection(key: PageKey, internalName: string, visible: boolean) {
    setSavingKey(`${key}:${internalName}`);
    setError(null);

    try {
      const res = await fetch(`/api/admin/pages/${key}/sections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalName, visible }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to update section");

      setPages((current) => {
        const next = [...current];
        const pageIndex = next.findIndex((item) => item.key === key);
        const section = { internalName, visible };

        if (pageIndex >= 0) {
          const sections = [...(next[pageIndex].sections ?? [])];
          const sectionIndex = sections.findIndex((item) => item.internalName === internalName);
          if (sectionIndex >= 0) sections[sectionIndex] = { ...sections[sectionIndex], visible };
          else sections.push(section);
          next[pageIndex] = { ...next[pageIndex], sections };
        } else {
          next.push({ key, sections: [section] });
        }

        return next;
      });

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update section");
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-white/50">Loading section settings…</p>;
  }

  return (
    <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold text-white">Page section visibility</h2>
        <p className="mt-1 text-sm text-white/50">
          Hide individual sections on any page. Hidden sections won&apos;t appear on the public site.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {pageKeys.map((key) => {
          const page = pages.find((item) => item.key === key);
          const sections = mergeSectionStates(key, page?.sections ?? []);
          const isExpanded = pageKey ? true : expandedPage === key;

          return (
            <div key={key} className="rounded-lg border border-white/10 bg-explore-black/30">
              {!pageKey && (
                <button
                  type="button"
                  onClick={() => setExpandedPage(isExpanded ? null : key)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="font-medium text-white">{formatPageTitle(key)}</span>
                  <span className="text-xs text-white/40">
                    {sections.filter((section) => section.visible).length}/{sections.length} visible
                  </span>
                </button>
              )}

              {(pageKey || isExpanded) && (
                <ul className={cn("space-y-2 px-3 pb-3", !pageKey && "border-t border-white/10 pt-3")}>
                  {sections.map((section) => {
                    const busy = savingKey === `${key}:${section.internalName}`;
                    return (
                      <li
                        key={section.internalName}
                        className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                      >
                        <span className="text-sm text-white/80">{section.label}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={section.visible}
                          aria-label={`${section.visible ? "Hide" : "Show"} ${section.label}`}
                          disabled={busy}
                          onClick={() => toggleSection(key, section.internalName, !section.visible)}
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-explore-lime/60 disabled:opacity-50",
                            section.visible ? "bg-explore-teal" : "bg-white/20"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 rounded-full bg-white transition-transform",
                              section.visible ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
