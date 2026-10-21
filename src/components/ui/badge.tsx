import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const VARIANTS: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  destructive: "border-transparent bg-destructive text-destructive-foreground",
  outline: "text-foreground",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge({ className, variant = "default", ...props }, ref) {
  return (
    <span
      ref={ref}
      className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", VARIANTS[variant], className)}
      {...props}
    />
  );
});
