import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

const LOGO_SRC = "/learning-assistant/explore-search-logo.jpg";

/** Logo shipped on black — `mix-blend-screen` hides the dark plate on scenic backgrounds. */
export function ExploreSearchLogo({
  size = "hero",
  href,
  className,
}: {
  size?: "header" | "hero";
  href?: string;
  className?: string;
}) {
  const dimensions =
    size === "header"
      ? { width: 140, height: 56, imgClass: "h-10 w-auto sm:h-11" }
      : { width: 560, height: 300, imgClass: "h-auto w-full max-w-[min(100%,26rem)] sm:max-w-md md:max-w-xl" };

  const image = (
    <span className={cn("relative inline-flex max-w-full items-center justify-center", className)}>
      <Image
        src={LOGO_SRC}
        alt="Explore Search — educational search for brighter minds"
        width={dimensions.width}
        height={dimensions.height}
        className={cn(dimensions.imgClass, "mix-blend-screen")}
        priority={size === "hero"}
        unoptimized
      />
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-explore-lime">
        {image}
      </Link>
    );
  }

  return image;
}
