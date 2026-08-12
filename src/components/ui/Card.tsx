import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";

interface CardProps {
  href?: string;
  className?: string;
  children: React.ReactNode;
}

export function Card({ href, className, children }: CardProps) {
  const base = cn(
    "group overflow-hidden rounded-2xl bg-white border border-explore-charcoal/8 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
    className
  );

  if (href) {
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    );
  }

  return <article className={base}>{children}</article>;
}

interface CardImageProps {
  src: string;
  alt: string;
  aspect?: "video" | "square" | "portrait";
  priority?: boolean;
}

export function CardImage({ src, alt, aspect = "video", priority }: CardImageProps) {
  const aspectClass =
    aspect === "square" ? "aspect-square" : aspect === "portrait" ? "aspect-[3/4]" : "aspect-video";

  return (
    <div className={cn("relative overflow-hidden bg-explore-sand", aspectClass)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-5 sm:p-6", className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h3
      className={cn(
        "font-display text-xl font-bold text-explore-charcoal group-hover:text-explore-teal transition-colors",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn("mt-2 text-sm text-explore-charcoal/70 line-clamp-3", className)}>{children}</p>;
}
