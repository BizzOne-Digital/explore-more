"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { adminNavGroups } from "@/lib/admin/nav";

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/admin" className="block" onClick={() => setOpen(false)}>
          <span className="font-display text-lg font-semibold text-white">
            Explore More
          </span>
          <span className="mt-0.5 block text-xs font-medium uppercase tracking-widest text-explore-lime">
            Admin Portal
          </span>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-4" data-lenis-prevent>
        {adminNavGroups.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/35">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                        active
                          ? "bg-explore-teal/20 text-explore-lime"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <Link
          href="/"
          className="text-xs text-white/40 transition hover:text-explore-lime"
        >
          ← Back to website
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed left-3 top-3 z-[120] rounded-lg bg-explore-charcoal p-2 text-white shadow-lg lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[130] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <aside className="relative h-full w-72 max-w-[85vw] bg-explore-charcoal shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {navContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden h-full min-h-0 w-64 shrink-0 border-r border-white/10 bg-explore-charcoal lg:block">
        {navContent}
      </aside>
    </>
  );
}
