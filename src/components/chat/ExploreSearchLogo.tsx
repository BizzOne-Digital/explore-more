import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

const LOGO_SRC = "/learning-assistant/explore-search-logo.png";
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
      ? { width: 100, height: 40, imgClass: "h-8 w-auto sm:h-9" }
      : { width: 400, height: 220, imgClass: "h-auto w-full max-w-[14rem] sm:max-w-[16rem] md:max-w-[18rem]" };

  const image = (
    <span
      className={cn(
        "relative inline-flex max-w-full items-center justify-center",
        size === "hero" && "my-5 py-3 sm:my-6 sm:py-4",
        className
      )}
    >
      <Image
        src={LOGO_SRC}
        alt="Explore Search — educational search for brighter minds"
        width={dimensions.width}
        height={dimensions.height}
        className={cn(dimensions.imgClass, "drop-shadow-[0_4px_28px_rgba(0,0,0,0.55)]")}
        priority={size === "hero"}
        unoptimized
      />
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-explore-lime"
      >
        {image}
      </Link>
    );
  }

  return image;
}
