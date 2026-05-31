import React, { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "../icons";

interface Option {
  value: string;
  label: string;
}

interface CreatableComboboxProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

const CreatableCombobox: React.FC<CreatableComboboxProps> = ({
  options,
  value,
  onChange,
  onOpenChange,
  placeholder = "Type or select",
  label,
  required,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();

  const filtered = trimmed
    ? options.filter((o) => o.label.toLowerCase().includes(lower))
    : options;

  const exactMatch = options.some((o) => o.label.toLowerCase() === lower);
  const showCreate = trimmed.length > 0 && !exactMatch;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        if (isOpen) {
          setIsOpen(false);
          onOpenChange?.(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onOpenChange]);

  const setOpen = (next: boolean) => {
    if (disabled) return;
    setIsOpen(next);
    onOpenChange?.(next);
  };

  const handleSelect = (label: string) => {
    onChange(label);
    setOpen(false);
  };

  return (
    <div className="space-y-2 w-full relative" ref={containerRef}>
      {label && (
        <label className="text-xs text-black/70 dark:text-white font-semibold ml-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setOpen(true);
          }}
          placeholder={placeholder}
          className="w-full h-[50px] bg-gray-50 dark:bg-white/10 border border-transparent dark:border-transparent rounded-xl px-4 pr-10 text-sm text-black dark:text-white placeholder-black/40 dark:placeholder-white/70 focus:border-brand-green focus:outline-none transition-all"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen(!isOpen)}
          disabled={disabled}
          className="absolute inset-y-0 right-3 flex items-center"
        >
          <ChevronDownIcon
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-[#2D312E] backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden animate-fade-in max-h-60 overflow-y-auto custom-scrollbar">
            {showCreate && (
              <button
                type="button"
                onClick={() => handleSelect(trimmed)}
                className="w-full text-left px-4 py-3 text-sm font-medium text-brand-green hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/5"
              >
                + Create &quot;{trimmed}&quot;
              </button>
            )}
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.label)}
                className={`w-full text-left px-4 py-3 text-sm transition-colors font-medium border-b border-gray-100 dark:border-white/5 last:border-0 ${
                  value.trim().toLowerCase() === option.label.toLowerCase()
                    ? "bg-brand-green text-white"
                    : "text-brand-text-light-primary dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                {option.label}
              </button>
            ))}
            {filtered.length === 0 && !showCreate && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No groups yet — start typing to create one
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatableCombobox;
