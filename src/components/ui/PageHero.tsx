import Image from "next/image";
import { cn } from "@/lib/cn";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  image?: string;
  align?: "left" | "center";
  size?: "default" | "large";
  children?: React.ReactNode;
}

export function PageHero({
  title,
  subtitle,
  eyebrow,
  image,
  align = "left",
  size = "default",
  children,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative w-full overflow-x-clip bg-explore-charcoal text-white",
        size === "large" ? "min-h-[85vh]" : "min-h-[40vh]"
      )}
    >
      {image && (
        <>
          <Image src={image} alt="" fill priority className="object-cover opacity-40" sizes="100vw" />
          <div
            className={cn(
              "absolute inset-0",
              align === "center"
                ? "bg-gradient-to-b from-explore-black/75 via-explore-black/45 to-explore-black/70"
                : "bg-gradient-to-r from-explore-black/80 via-explore-black/50 to-transparent"
            )}
          />
        </>
      )}
      {!image && <div className="absolute inset-0 topo-bg opacity-30" />}

      <div
        className={cn(
          "relative mx-auto flex w-full min-w-0 max-w-7xl flex-col justify-center px-3 sm:px-4",
          size === "large" ? "min-h-[85vh] pt-32 pb-20" : "min-h-[40vh] pt-28 pb-16",
          align === "center" ? "items-center text-center" : "items-start text-left"
        )}
      >
        {eyebrow && (
          <p
            className={cn(
            "mb-3 text-xs font-semibold uppercase tracking-[0.12em] sm:tracking-[0.25em] text-explore-lime break-anywhere",
              align === "center" && "w-full"
            )}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className={cn(
            "font-display font-bold tracking-tight text-white break-anywhere",
            size === "large"
              ? "text-3xl sm:text-5xl lg:text-7xl max-w-4xl"
              : "text-2xl sm:text-4xl lg:text-5xl max-w-3xl",
            align === "center" && "w-full"
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className={cn(
              "mt-5 text-lg sm:text-xl text-white/80 leading-relaxed",
              size === "large" ? "max-w-2xl" : "max-w-xl",
              align === "center" && "mx-auto"
            )}
          >
            {subtitle}
          </p>
        )}
        {children && (
          <div className={cn("mt-8 flex flex-wrap gap-4", align === "center" && "justify-center")}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
