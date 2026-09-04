import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

const LOGO_VERSION = "3";

const LOGO_HEADER = `/uploads/settings/logo-header.png?v=${LOGO_VERSION}`;
const LOGO_FOOTER = `/uploads/settings/logo-footer.png?v=${LOGO_VERSION}`;

interface LogoProps {
  variant?: "header" | "footer";
  className?: string;
  href?: string;
  /** Light backdrop behind logo on transparent hero */
  plate?: boolean;
}

export function Logo({ variant = "header", className, href = "/", plate = false }: LogoProps) {
  const src = variant === "footer" ? LOGO_FOOTER : LOGO_HEADER;
  const sizes =
    variant === "footer"
      ? { width: 360, height: 160, className: "h-20 w-auto max-w-[280px] sm:h-28 sm:max-w-[340px]" }
      : {
          width: 320,
          height: 80,
          className:
            "h-8 w-auto max-w-[108px] sm:h-10 sm:max-w-[150px] md:h-12 md:max-w-[200px] lg:h-14 lg:max-w-[260px]",
        };

  const image = (
    <span
      className={cn(
        "relative inline-flex max-w-full items-center",
        plate && "rounded-lg bg-white/95 px-1.5 py-0.5 shadow-sm ring-1 ring-black/5 sm:rounded-xl sm:px-2 sm:py-1",
        className
      )}
    >
      <Image
        src={src}
        alt="Explore More Academy LLC"
        width={sizes.width}
        height={sizes.height}
        className={cn(sizes.className, "object-contain object-left")}
        priority={variant === "header"}
        unoptimized
      />
    </span>
  );

  if (!href) return image;

  return (
    <Link
      href={href}
      className="inline-flex min-w-0 max-w-[34vw] shrink items-center sm:max-w-none"
      aria-label="Explore More Academy home"
    >
      {image}
    </Link>
  );
}

export const LOGO_PATHS = {
  full: "/uploads/settings/logo.png",
  header: LOGO_HEADER,
  footer: LOGO_FOOTER,
  favicon: "/favicon.png",
} as const;
