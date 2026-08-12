import Link from "next/link";
import { cn } from "@/lib/cn";

const variants = {
  primary: "bg-explore-orange text-white hover:bg-explore-orange/90 shadow-md",
  secondary: "bg-explore-teal text-white hover:bg-explore-teal/90 shadow-md",
  lime: "bg-explore-lime text-explore-black hover:bg-explore-lime/90 shadow-md",
  outline:
    "border-2 border-explore-charcoal/20 text-explore-charcoal hover:border-explore-teal hover:text-explore-teal bg-transparent",
  ghost: "text-explore-charcoal hover:bg-explore-charcoal/5 bg-transparent",
  dark: "bg-explore-charcoal text-white hover:bg-explore-black shadow-md",
} as const;

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-base",
} as const;

type ButtonVariant = keyof typeof variants;
type ButtonSize = keyof typeof sizes;

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

interface ButtonAsButton extends ButtonBaseProps {
  href?: undefined;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
}

interface ButtonAsLink extends ButtonBaseProps {
  href: string;
  type?: never;
  disabled?: never;
  onClick?: never;
}

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex max-w-full items-center justify-center gap-2 whitespace-normal rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-explore-teal focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  );

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const { type = "button", disabled, onClick } = props as ButtonAsButton;
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
