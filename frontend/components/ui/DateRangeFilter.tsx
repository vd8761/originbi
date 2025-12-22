import React, { useState, useRef, useEffect } from 'react';
import { CalendarIcon, ChevronDownIcon } from '@/components/icons';

export type DateRangeOption = 'All' | 'Today' | 'Yesterday' | 'Last 7 Days' | 'Last 30 Days' | 'This Month' | 'Last Month' | 'Custom Range';

interface DateRangeFilterProps {
    selectedRange: DateRangeOption | string;
    onRangeSelect: (range: DateRangeOption) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ selectedRange, onRangeSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const options: DateRangeOption[] = [
        'All',
        'Today',
        'Yesterday',
        'Last 7 Days',
        'Last 30 Days',
        'This Month',
        'Last Month',
        'Custom Range'
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: DateRangeOption) => {
        onRangeSelect(option);
        setIsOpen(false);
    };

    // Determine if we should show green text (if selected range is not one of the standard text presets, likely a date)
    const isCustom = !options.slice(0, 6).includes(selectedRange as DateRangeOption);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#FFFFFF1F] border border-gray-200 dark:border-[#FFFFFF1F] hover:bg-gray-50 dark:hover:bg-white/30 rounded-lg text-sm font-medium transition-all whitespace-nowrap group shadow-sm cursor-pointer ${isCustom ? 'text-brand-green' : 'text-[#19211C] dark:text-white'}`}
            >
                <CalendarIcon className="w-4 h-4 text-brand-green" />
                <span>{selectedRange}</span>
                <ChevronDownIcon className={`w-3 h-3 ml-1 text-gray-500 group-hover:text-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-brand-light-secondary dark:bg-[#1A1D21] border border-brand-light-tertiary dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                    <div className="py-1">
                        {options.map((option) => (
                            <button
                                key={option}
                                onClick={() => handleSelect(option)}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between group ${selectedRange === option
                                    ? 'text-brand-green font-semibold bg-brand-green/5'
                                    : 'text-brand-text-light-primary dark:text-gray-300 hover:bg-brand-light-tertiary dark:hover:bg-white/5'
                                    } ${option === 'Custom Range' ? 'text-brand-green font-medium' : ''}`}
                            >
                                {option}
                                {selectedRange === option && <div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangeFilter;