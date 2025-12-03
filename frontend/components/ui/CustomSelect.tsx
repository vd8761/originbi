
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@/components/icons';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    required?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, placeholder = "Select", label, required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
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
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between bg-gray-50 dark:bg-[#24272B] border border-transparent rounded-xl px-4 py-3.5 text-sm transition-all duration-200 focus:outline-none ${isOpen ? 'border-brand-green ring-1 ring-brand-green/20' : ''}`}
                >
                    <span className={selectedOption ? "text-brand-text-light-primary dark:text-white font-medium" : "text-gray-400 dark:text-gray-500"}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-[#24272B] border border-gray-200 dark:border-white/5 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in max-h-60 overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={`w-full text-left px-4 py-3 text-sm transition-colors font-medium border-b border-gray-100 dark:border-white/5 last:border-0 ${
                                    value === option.value 
                                        ? 'bg-brand-green text-white' 
                                        : 'text-brand-text-light-primary dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                        {options.length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">No options available</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomSelect;
