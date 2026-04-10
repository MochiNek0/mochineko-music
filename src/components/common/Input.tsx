import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, icon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5 group">
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-4 text-text-muted transition-colors group-focus-within:text-brand-primary">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full h-11 px-4 bg-black/3 border border-transparent rounded-xl text-[13px] font-semibold text-text-main placeholder:text-text-muted/40",
              "focus:outline-none focus:bg-white focus:border-black/5 transition-all duration-300",
              icon && "pl-11",
              error && "border-error focus:border-error focus:ring-error/20",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-[11px] font-bold text-error pl-1 animate-in fade-in slide-in-from-top-1 duration-200">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
