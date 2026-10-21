import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

/** Native <label>; pass htmlFor to bind it to a control by id. */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label({ className, ...props }, ref) {
  return <label ref={ref} className={cn("text-sm font-medium leading-none", className)} {...props} />;
});
