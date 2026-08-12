import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { COMPANY } from "@/lib/constants";

const footerLinks = {
  Explore: [
    { href: "/about", label: "About Us" },
    { href: "/programs", label: "Programs" },
    { href: "/events", label: "Events" },
    { href: "/courses", label: "Courses" },
    { href: "/gallery", label: "Gallery" },
  ],
  Resources: [
    { href: "/books", label: "Bookstore" },
    { href: "/faqs", label: "FAQs" },
    { href: "/testimonials", label: "Testimonials" },
    { href: "/sponsor-a-kid", label: "Sponsor a Kid" },
    { href: "/contact", label: "Contact" },
  ],
  Account: [
    { href: "/login", label: "Login" },
    { href: "/register", label: "Register" },
    { href: "/student", label: "Student Portal" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
};

export function Footer() {
  return (
    <footer className="w-full overflow-x-clip bg-explore-charcoal text-white border-t border-white/10">
      <div className="mx-auto w-full min-w-0 max-w-7xl px-3 py-10 sm:px-4 sm:py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 lg:gap-6 items-start">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-2">
            <Logo variant="footer" className="mb-4" />
            <p className="text-sm text-white/60 leading-relaxed">{COMPANY.motto}</p>
            <p className="mt-2 text-sm text-white/50 italic">
              &ldquo;Learn Wild.&rdquo;
              <br />
              &ldquo;Live Big.&rdquo;
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-explore-lime mb-3">
                {title}
              </h3>
              <ul className="space-y-1.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div className="md:col-span-1 lg:col-span-1">
            <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-explore-lime mb-3">
              Contact
            </h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 shrink-0 text-explore-teal" />
                <a href={`mailto:${COMPANY.email}`} className="hover:text-white transition-colors break-all">
                  {COMPANY.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 shrink-0 text-explore-teal" />
                <a href={`tel:${COMPANY.phone.replace(/\D/g, "")}`} className="hover:text-white transition-colors">
                  {COMPANY.phone}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-explore-teal" />
                <span className="text-white/50">Address pending verification</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40 text-center sm:text-left">
            &copy; {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
          </p>
          <p className="text-xs text-white/30 text-center sm:text-right">
            {COMPANY.supportingLine}
          </p>
        </div>
      </div>
    </footer>
  );
}
