"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PAGE_KEYS } from "@/lib/constants";
import { pageKeyToHref } from "@/lib/navigation";
import { cn } from "@/lib/cn";

interface PageRecord {
  key: string;
  title: string;
  navVisible?: boolean;
}

function formatPageLabel(key: string, title?: string) {
  if (title && title.trim()) return title;
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, " ");
}

export function PageNavManager() {
  const router = useRouter();
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/pages")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setPages(json.data ?? []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function toggleNavVisible(pageKey: string, navVisible: boolean) {
    setSavingKey(pageKey);
    setError(null);

    try {
      const res = await fetch(`/api/admin/pages/${pageKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ navVisible }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error ?? "Failed to update page visibility");
      }

      setPages((current) => {
        const existing = current.find((page) => page.key === pageKey);
        if (existing) {
          return current.map((page) =>
            page.key === pageKey ? { ...page, navVisible } : page
          );
        }
        return [...current, { key: pageKey, title: formatPageLabel(pageKey), navVisible }];
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update page visibility");
    } finally {
      setSavingKey(null);
    }
  }

  function isVisible(pageKey: string) {
    const page = pages.find((item) => item.key === pageKey);
    return page?.navVisible !== false;
  }

  if (loading) {
    return <p className="text-sm text-white/50">Loading navigation settings…</p>;
  }

  return (
    <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold text-white">Navigation visibility</h2>
        <p className="mt-1 text-sm text-white/50">
          Turn off a page to remove it from the site header and footer menus. The page URL still works if someone has the link.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {PAGE_KEYS.map((pageKey) => {
          const page = pages.find((item) => item.key === pageKey);
          const visible = isVisible(pageKey);
          const busy = savingKey === pageKey;

          return (
            <li
              key={pageKey}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-explore-black/40 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {formatPageLabel(pageKey, page?.title)}
                </p>
                <p className="truncate text-xs text-white/40">{pageKeyToHref(pageKey)}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={visible}
                aria-label={`${visible ? "Hide" : "Show"} ${formatPageLabel(pageKey, page?.title)} in navigation`}
                disabled={busy}
                onClick={() => toggleNavVisible(pageKey, !visible)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-explore-lime/60 disabled:opacity-50",
                  visible ? "bg-explore-teal" : "bg-white/20"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 rounded-full bg-white transition-transform",
                    visible ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
