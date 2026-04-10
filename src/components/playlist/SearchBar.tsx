import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-64 group focus-within:w-72 transition-all duration-500 cubic-bezier-spring">
      <Search
        size={16}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-brand-primary"
        strokeWidth={2.5}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索曲目、艺术家或专辑..."
        className={cn(
          "w-full h-11 pl-11 pr-11 bg-black/3 border border-transparent rounded-xl text-[13px] font-semibold text-text-main placeholder:text-text-muted/40",
          "focus:outline-none focus:bg-white focus:border-black/5 transition-all duration-300"
        )}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-all btn-premium"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

