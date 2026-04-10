import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  active?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", active, ...props }, ref) => {
    const variants = {
      primary:
        "bg-brand-primary text-white hover:bg-black",
      secondary:
        "bg-white text-text-title border border-black/5 hover:bg-black/2",
      outline:
        "bg-transparent text-text-main border border-black/5 hover:bg-black/3",
      ghost:
        "bg-transparent text-text-muted hover:text-text-main hover:bg-black/4",
      danger: "bg-error text-white hover:bg-error/90",
    };

    const sizes = {
      sm: "h-8 px-4 rounded-lg text-[11px] font-black uppercase tracking-widest",
      md: "h-10 px-6 rounded-xl text-[13px] font-bold",
      lg: "h-12 px-8 rounded-2xl text-[14px] font-extrabold tracking-tight",
      icon: "h-10 w-10 rounded-xl flex items-center justify-center p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-bold transition-all btn-premium disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer",
          variants[variant],
          sizes[size],
          active && "bg-black/5 text-text-main ring-1 ring-black/5",
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
