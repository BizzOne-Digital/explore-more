import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

const LOGO_HEADER = "/uploads/settings/logo-header.png";
const LOGO_FOOTER = "/uploads/settings/logo-footer.png";

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
      ? { width: 180, height: 180, className: "h-24 w-auto max-w-[200px] sm:h-32 sm:max-w-[240px]" }
      : {
          width: 160,
          height: 56,
          className: "h-9 w-auto max-w-[118px] sm:h-11 sm:max-w-[150px] md:h-12 md:max-w-[168px]",
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
      />
    </span>
  );

  if (!href) return image;

  return (
    <Link
      href={href}
      className="inline-flex min-w-0 max-w-[46vw] shrink items-center sm:max-w-none"
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
