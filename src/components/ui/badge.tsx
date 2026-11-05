import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "info";
  children?: React.ReactNode;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default:
      "border-transparent bg-primary text-primary-foreground shadow-2xs hover:bg-primary/80",
    secondary:
      "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive:
      "border-transparent bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
    outline:
      "text-foreground border-border",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80",
    warning:
      "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100/80",
    info:
      "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100/80",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
