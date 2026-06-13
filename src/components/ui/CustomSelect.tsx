import * as React from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option<T> {
  value: T;
  label: string;
}

interface CustomSelectProps<T> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}

export function CustomSelect<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className = "",
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-2xl bg-gray-100 px-5 py-4 text-sm font-bold text-gray-900 transition-all hover:bg-gray-200 focus:ring-2 focus:ring-primary/20"
      >
        <span className="truncate">{selectedOption?.label || "Select..."}</span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-[100] mt-2 max-h-60 overflow-auto rounded-3xl bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-bold transition-colors ${
                  option.value === value
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {option.label}
                {option.value === value && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
