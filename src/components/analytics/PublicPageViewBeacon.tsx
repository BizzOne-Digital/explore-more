"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { shouldRecordPublicPageView } from "@/lib/analytics/page-paths";

export function PublicPageViewBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !shouldRecordPublicPageView(pathname)) return;

    const storageKey = `ema-pv:${pathname}`;
    try {
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // sessionStorage unavailable — still attempt one record
    }

    void fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    });
  }, [pathname]);

  return null;
}
