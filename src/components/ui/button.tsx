import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "success"
    | "warning";
  size?: "default" | "sm" | "lg" | "icon" | "xs";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none";

    const variantStyles = {
      default:
        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs",
      outline:
        "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-2xs",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost:
        "hover:bg-accent hover:text-accent-foreground",
      link:
        "text-primary underline-offset-4 hover:underline",
      success:
        "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs",
      warning:
        "bg-amber-500 text-white hover:bg-amber-600 shadow-xs",
    };

    const sizeStyles = {
      default: "h-9 px-4 py-2",
      xs: "h-7 px-2.5 text-xs rounded-md",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-lg px-6 text-base",
      icon: "h-9 w-9",
    };

    return (
      <button
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
