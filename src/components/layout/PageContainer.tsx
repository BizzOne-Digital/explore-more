import { cn } from "@/lib/cn";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide";
}

const sizes = {
  default: "max-w-7xl",
  narrow: "max-w-4xl",
  wide: "max-w-[90rem]",
} as const;

/** Standard responsive page wrapper — prevents horizontal overflow on mobile */
export function PageContainer({ children, className, size = "default" }: PageContainerProps) {
  return (
    <div className={cn("mx-auto w-full min-w-0 px-3 sm:px-4", sizes[size], className)}>
      {children}
    </div>
  );
}

export function PageSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("w-full overflow-x-clip py-12 sm:py-16 md:py-20", className)}>
      {children}
    </section>
  );
}
