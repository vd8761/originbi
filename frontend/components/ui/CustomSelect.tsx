
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDownIcon } from '../icons';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    onOpenChange?: (isOpen: boolean) => void;
    placeholder?: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, onOpenChange, placeholder = "Select", label, required, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const updatePosition = () => {
        const trigger = triggerRef.current;
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        const gap = 8;
        const spaceBelow = window.innerHeight - rect.bottom - gap - 12;
        const spaceAbove = rect.top - gap - 12;
        const openUp = spaceBelow < 180 && spaceAbove > spaceBelow;
        const maxHeight = Math.min(260, Math.max(160, openUp ? spaceAbove : spaceBelow));

        setMenuStyle({
            position: 'fixed',
            left: rect.left,
            top: openUp ? undefined : rect.bottom + gap,
            bottom: openUp ? window.innerHeight - rect.top + gap : undefined,
            width: rect.width,
            maxHeight,
            zIndex: 9999,
        });
    };

    useEffect(() => {
        if (!isOpen) return;
        updatePosition();

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
            setIsOpen(false);
            onOpenChange?.(false);
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                onOpenChange?.(false);
            }
        };
        const handleViewportChange = () => updatePosition();

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleViewportChange);
        window.addEventListener('scroll', handleViewportChange, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleViewportChange);
            window.removeEventListener('scroll', handleViewportChange, true);
        };
    }, [isOpen, onOpenChange]);

    const handleSelect = (val: string) => {
        if (disabled) return;
        onChange(val);
        setIsOpen(false);
        onOpenChange?.(false);
    };

    const toggleOpen = () => {
        if (disabled) return;
        const next = !isOpen;
        setIsOpen(next);
        onOpenChange?.(next);
    };

    return (
        <div className="space-y-2 w-full" ref={containerRef}>
            {label && (
                <label className="text-xs text-brand-text-light-secondary dark:text-gray-400 font-semibold ml-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                <button
                    ref={triggerRef}
                    type="button"
                    disabled={disabled}
                    onClick={toggleOpen}
                    className={`w-full flex items-center justify-between bg-gray-50 dark:bg-white/10 border border-transparent rounded-xl px-4 py-3.5 text-sm transition-all duration-200 focus:outline-none ${isOpen ? 'border-brand-green ring-1 ring-brand-green/20' : ''} ${disabled ? 'opacity-80 cursor-not-allowed' : ''}`}
                >
                    <span className={selectedOption ? "text-brand-text-light-primary dark:text-white font-medium" : "text-gray-400 dark:text-white/70"}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && ReactDOM.createPortal(
                    <div
                        ref={menuRef}
                        style={menuStyle}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5 animate-fade-in dark:border-white/10 dark:bg-[#2D312E] dark:ring-white/10"
                    >
                        <div className="max-h-[inherit] overflow-y-auto custom-scrollbar">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`w-full text-left px-4 py-3 text-sm transition-colors font-medium border-b border-gray-100 dark:border-white/5 last:border-0 ${value === option.value
                                        ? 'bg-brand-green text-white'
                                        : 'text-brand-text-light-primary dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                            {options.length === 0 && (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center dark:text-gray-400">No options available</div>
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
            </div>
        </div>
    );
};

export default CustomSelect;
