import React, { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "../icons";

interface Option {
  value: string;
  label: string;
  /** When true, the option is shown greyed-out and cannot be selected. */
  disabled?: boolean;
  /** Explanation shown via the info button when the option is disabled. */
  infoText?: string;
}

interface CreatableComboboxProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  /** Fired (in addition to onChange) when an existing option is picked. */
  onSelectOption?: (option: Option) => void;
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
  onSelectOption,
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

  const handleCreate = (label: string) => {
    onChange(label);
    setOpen(false);
  };

  const handleSelectOption = (option: Option) => {
    if (option.disabled) return;
    onChange(option.label);
    onSelectOption?.(option);
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
                onClick={() => handleCreate(trimmed)}
                className="w-full text-left px-4 py-3 text-sm font-medium text-brand-green hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/5"
              >
                + Create &quot;{trimmed}&quot;
              </button>
            )}
            {filtered.map((option) =>
              option.disabled ? (
                <div
                  key={option.value}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium border-b border-gray-100 dark:border-white/5 last:border-0 text-gray-400 dark:text-gray-500 cursor-not-allowed select-none"
                >
                  <span className="truncate">{option.label}</span>
                  <div className="relative shrink-0 group/info">
                    <span
                      aria-label="Why is this group disabled?"
                      className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 5a1.25 1.25 0 110 2.5A1.25 1.25 0 0112 7zm1.25 10h-2.5v-6.5h2.5V17z" />
                      </svg>
                    </span>
                    {option.infoText && (
                      <div className="pointer-events-none absolute right-0 top-7 z-[110] w-60 p-2.5 rounded-lg bg-gray-900 text-white text-[11px] leading-snug shadow-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-opacity duration-150">
                        {option.infoText}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors font-medium border-b border-gray-100 dark:border-white/5 last:border-0 ${
                    value.trim().toLowerCase() === option.label.toLowerCase()
                      ? "bg-brand-green text-white"
                      : "text-brand-text-light-primary dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  {option.label}
                </button>
              )
            )}
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
