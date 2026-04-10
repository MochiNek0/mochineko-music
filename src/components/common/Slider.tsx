import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "../../lib/utils";

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
  max?: number;
  step?: number;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function Slider({
  value,
  onValueChange,
  onValueCommit,
  max = 100,
  step = 1,
  className,
  variant = 'primary'
}: SliderProps) {
  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex items-center select-none touch-none w-full h-5 cursor-pointer group/slider",
        className
      )}
      value={value}
      max={max}
      step={step}
      onValueChange={onValueChange}
      onValueCommit={onValueCommit}
    >
      <SliderPrimitive.Track className="bg-black/5 relative grow rounded-full h-1.5 overflow-hidden">
        <SliderPrimitive.Range className={cn(
          "absolute h-full rounded-full transition-colors duration-300",
          variant === 'primary' ? "bg-brand-primary" : "bg-text-muted group-hover/slider:bg-brand-primary"
        )} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block w-4 h-4 bg-white rounded-full border border-black/10 transition-transform duration-200 scale-0 group-hover/slider:scale-100 focus:scale-100 outline-none hover:scale-110 active:scale-95"
        aria-label="Slider"
      />
    </SliderPrimitive.Root>
  );
}
