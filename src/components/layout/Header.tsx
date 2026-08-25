"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  Search,
  ShoppingCart,
  Mail,
  Phone,
  ChevronDown,
  User,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { useCart } from "@/components/providers/CartProvider";
import { COMPANY } from "@/lib/constants";
import { HEADER_NAV, type NavLink, type SiteNavigation } from "@/lib/navigation";
import { cn } from "@/lib/cn";

const defaultNavigation: SiteNavigation = {
  headerLinks: HEADER_NAV,
  footerLinks: {},
  showEventsUtility: true,
  showBooksSearch: true,
  showProgramsCta: true,
};

interface HeaderProps {
  navigation?: SiteNavigation;
}

export function Header({ navigation = defaultNavigation }: HeaderProps) {
  const navLinks: NavLink[] = navigation.headerLinks;
  const pathname = usePathname();
  const { data: session } = useSession();
  const { itemCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isAdmin = session?.user?.role === "administrator";
  const parentPortalHref = isAdmin ? "/parent" : "/membership";
  const studentPortalHref = isAdmin ? "/student" : "/membership";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setMobileOpen(false);
      setUserMenuOpen(false);
    });
  }, [pathname]);

  const isHome = pathname === "/";
  const transparent = isHome && !scrolled;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full overflow-x-clip">
      {/* Utility bar */}
      <div
        className={cn(
          "hidden md:block border-b transition-colors duration-300",
          transparent
            ? "bg-explore-black/40 border-white/10 text-white/80"
            : "bg-explore-charcoal border-explore-charcoal text-white/70"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
          <div className="flex items-center gap-4">
            <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-1 hover:text-explore-lime transition-colors">
              <Mail className="h-3 w-3" />
              {COMPANY.email}
            </a>
            <a href={`tel:${COMPANY.phone.replace(/\D/g, "")}`} className="flex items-center gap-1 hover:text-explore-lime transition-colors">
              <Phone className="h-3 w-3" />
              {COMPANY.phone}
            </a>
          </div>
          <div className="flex items-center gap-4">
            {navigation.showEventsUtility && (
              <Link href="/events" className="hover:text-explore-lime transition-colors">
                Upcoming Events
              </Link>
            )}
            {session ? (
              <>
                <Link href={studentPortalHref} className="hover:text-explore-lime transition-colors">
                  Student Portal
                </Link>
                <Link href={parentPortalHref} className="hover:text-explore-lime transition-colors">
                  Parent Portal
                </Link>
              </>
            ) : (
              <>
                <Link href="/membership" className="hover:text-explore-lime transition-colors">
                  Student Portal
                </Link>
                <Link href="/membership" className="hover:text-explore-lime transition-colors">
                  Parent Portal
                </Link>
                <Link href="/parent/login" className="hover:text-explore-lime transition-colors">
                  Member Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav
        className={cn(
          "transition-all duration-300",
          transparent
            ? "bg-transparent"
            : "bg-explore-cream/95 backdrop-blur-md shadow-sm border-b border-explore-charcoal/5"
        )}
      >
        <div className="mx-auto flex max-w-7xl min-w-0 items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <Logo variant="header" plate={transparent} />

          <div className="hidden min-w-0 lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  pathname === link.href
                    ? transparent
                      ? "text-explore-lime bg-white/10"
                      : "text-explore-teal bg-explore-teal/10"
                    : transparent
                      ? "text-white/90 hover:text-white hover:bg-white/10"
                      : "text-explore-charcoal/80 hover:text-explore-charcoal hover:bg-explore-charcoal/5"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
            {navigation.showBooksSearch && (
              <Link
                href="/books"
                className={cn(
                  "hidden sm:flex p-2 rounded-lg transition-colors",
                  transparent ? "text-white/80 hover:bg-white/10" : "text-explore-charcoal/70 hover:bg-explore-charcoal/5"
                )}
                aria-label="Search books"
              >
                <Search className="h-5 w-5" />
              </Link>
            )}
            <Link
              href="/cart"
              className={cn(
                "relative p-2 rounded-lg transition-colors",
                transparent ? "text-white/80 hover:bg-white/10" : "text-explore-charcoal/70 hover:bg-explore-charcoal/5"
              )}
              aria-label={`Cart with ${itemCount} items`}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-explore-orange text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>

            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={cn(
                    "flex items-center gap-1 p-2 rounded-lg transition-colors",
                    transparent ? "text-white/80 hover:bg-white/10" : "text-explore-charcoal/70 hover:bg-explore-charcoal/5"
                  )}
                  aria-label="User menu"
                >
                  <User className="h-5 w-5" />
                  <ChevronDown className="h-3 w-3" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-white shadow-lg border border-explore-charcoal/10 py-1 z-50">
                    <p className="px-4 py-2 text-xs text-explore-charcoal/60 truncate">{session.user.email}</p>
                    {isAdmin && (
                      <Link href="/admin" className="block px-4 py-2 text-sm hover:bg-explore-cream">
                        Admin Portal
                      </Link>
                    )}
                    <Link href={studentPortalHref} className="block px-4 py-2 text-sm hover:bg-explore-cream">
                      Student Portal
                    </Link>
                    <Link href={parentPortalHref} className="block px-4 py-2 text-sm hover:bg-explore-cream">
                      Parent Portal
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {navigation.showProgramsCta && (
              <Link
                href="/programs"
                className="hidden md:inline-flex items-center gap-1 rounded-full bg-explore-orange px-4 py-2 text-sm font-semibold text-white hover:bg-explore-orange/90 transition-colors shadow-md"
              >
                Start Your Adventure
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(
                "lg:hidden p-2 rounded-lg",
                transparent ? "text-white" : "text-explore-charcoal"
              )}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-explore-charcoal/10 bg-explore-cream px-3 py-4 max-h-[70vh] overflow-y-auto overflow-x-clip sm:px-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block py-3 text-base font-medium border-b border-explore-charcoal/5",
                  pathname === link.href ? "text-explore-teal" : "text-explore-charcoal"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={studentPortalHref}
              className={cn(
                "block py-3 text-base font-medium border-b border-explore-charcoal/5",
                pathname.startsWith("/student") || pathname === "/membership"
                  ? "text-explore-teal"
                  : "text-explore-charcoal"
              )}
            >
              Student Portal
            </Link>
            <Link
              href={parentPortalHref}
              className={cn(
                "block py-3 text-base font-medium border-b border-explore-charcoal/5",
                pathname.startsWith("/parent") || pathname === "/membership"
                  ? "text-explore-teal"
                  : "text-explore-charcoal"
              )}
            >
              Parent Portal
            </Link>
            {navigation.showProgramsCta && (
              <Link
                href="/programs"
                className="mt-4 block w-full text-center rounded-full bg-explore-orange px-4 py-3 text-sm font-semibold text-white"
              >
                Start Your Adventure
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
