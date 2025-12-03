import React, { useState, useEffect } from 'react';
import { ArrowLeftWithoutLineIcon, ArrowRightWithoutLineIcon} from '@/components/icons';

type DatePreset = 'All' | 'Today' | 'Yesterday' | 'Last 7 Days' | 'Last 30 Days' | 'This Month' | 'Last Month' | 'Custom Range';

interface DateRangePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (start: Date, end: Date, label: string) => void;
    initialRange?: { start: Date | null; end: Date | null; label: string };
}

// Helper to generate calendar days
const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 = Sunday
};

const DateRangePickerModal: React.FC<DateRangePickerModalProps> = ({ isOpen, onClose, onApply, initialRange }) => {
    if (!isOpen) return null;

    const [activePreset, setActivePreset] = useState<DatePreset>('Today');
    
    // Defaulting to current month for left calendar
    const [currentMonthLeft, setCurrentMonthLeft] = useState(new Date()); 
    // Right calendar is always next month
    const [currentMonthRight, setCurrentMonthRight] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        return d;
    });
    
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    // List of text presets (excluding Custom Range which is a button)
    const textPresets: DatePreset[] = ['All', 'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month'];
    const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    // Update state when modal opens
    useEffect(() => {
        if (isOpen) {
            const start = initialRange?.start || new Date();
            const end = initialRange?.end || new Date();
            const label = initialRange?.label || 'Today';

            setStartDate(start);
            setEndDate(end);

            // Determine if the label matches a known preset
            if (textPresets.includes(label as DatePreset) || label === 'Custom Range') {
                setActivePreset(label as DatePreset);
            } else {
                setActivePreset('Custom Range');
            }

            // Reset calendars to show the selection or today
            const viewDate = start || new Date();
            updateCalendarView(viewDate);
        }
    }, [isOpen, initialRange]);

    const updateCalendarView = (date: Date) => {
        setCurrentMonthLeft(new Date(date.getFullYear(), date.getMonth(), 1));
        setCurrentMonthRight(new Date(date.getFullYear(), date.getMonth() + 1, 1));
    };

    // Adjust JS getDay (0=Sun) to (0=Mon) for UI
    const adjustDayIndex = (day: number) => (day === 0 ? 6 : day - 1);

    const renderCalendar = (baseDate: Date) => {
        const year = baseDate.getFullYear();
        const month = baseDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = adjustDayIndex(getFirstDayOfMonth(year, month));
        const monthName = baseDate.toLocaleString('default', { month: 'long', year: 'numeric' });

        // Calculate "Today" normalized to midnight for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const days = [];
        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
        }

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const dateTimestamp = date.getTime();
            
            // Logic for restrictions and highlighting
            const isFuture = dateTimestamp > today.getTime();
            const isToday = dateTimestamp === today.getTime();

            const isSelectedStart = startDate && dateTimestamp === startDate.getTime();
            const isSelectedEnd = endDate && dateTimestamp === endDate.getTime();
            // Check range: start < date < end
            const isInRange = startDate && endDate && date > startDate && date < endDate;
            const isSelected = isSelectedStart || isSelectedEnd;

            days.push(
                <button
                    key={d}
                    disabled={isFuture}
                    onClick={() => !isFuture && handleDateClick(date)}
                    className={`
                        h-9 w-9 text-xs font-medium rounded-full flex items-center justify-center transition-all relative
                        ${isFuture ? 'text-gray-400 dark:text-gray-700 cursor-not-allowed opacity-30' : ''}
                        
                        ${/* Selected State (Start or End) */ ''}
                        ${!isFuture && isSelected ? 'bg-brand-green text-white z-10 shadow-lg shadow-brand-green/30 font-bold' : ''}
                        
                        ${/* In Range State */ ''}
                        ${!isFuture && isInRange ? 'bg-brand-green/20 text-brand-green dark:text-white rounded-none' : ''}
                        
                        ${/* Default State */ ''}
                        ${!isFuture && !isSelected && !isInRange ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10' : ''}
                        
                        ${/* Today Highlight (Only if not selected) */ ''}
                        ${!isFuture && isToday && !isSelected && !isInRange ? 'border border-brand-green text-brand-green font-bold' : ''}
                        
                        ${/* Range Endpoints rounding corrections */ ''}
                        ${isInRange && !isSelected ? 'rounded-none' : ''}
                        ${isSelectedStart && endDate && endDate.getTime() !== startDate?.getTime() ? 'rounded-r-none' : ''}
                        ${isSelectedEnd && startDate && endDate.getTime() !== startDate.getTime() ? 'rounded-l-none' : ''}
                    `}
                >
                    {d}
                </button>
            );
        }

        return (
            <div className="w-full">
                <div className="flex justify-between items-center mb-6 px-2">
                    {/* Only show Left Arrow on Left Calendar */}
                    {baseDate.getTime() === currentMonthLeft.getTime() ? (
                        <button className="text-gray-500 hover:text-brand-text-light-primary dark:hover:text-white transition-colors p-1 flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => handleMonthChange(-1)}>
                            <ArrowLeftWithoutLineIcon className="w-2.5 h-3" />
                        </button>
                    ) : <div className="w-8"></div>}

                    <span className="text-sm font-bold text-brand-text-light-primary dark:text-white tracking-wide capitalize">{monthName}</span>

                    {/* Only show Right Arrow on Right Calendar */}
                    {baseDate.getTime() === currentMonthRight.getTime() ? (
                        <button className="text-gray-500 hover:text-brand-text-light-primary dark:hover:text-white transition-colors p-1 flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => handleMonthChange(1)}>
                            <ArrowRightWithoutLineIcon className="w-2.5 h-3" />
                        </button>
                    ) : <div className="w-8"></div>}
                </div>
                
                <div className="grid grid-cols-7 mb-3">
                    {weekDays.map(d => (
                        <div key={d} className="h-8 w-8 flex items-center justify-center text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider">
                            {d}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                    {days}
                </div>
            </div>
        );
    };

    const handleMonthChange = (offset: number) => {
        const newLeft = new Date(currentMonthLeft);
        newLeft.setMonth(newLeft.getMonth() + offset);
        setCurrentMonthLeft(newLeft);

        const newRight = new Date(currentMonthRight);
        newRight.setMonth(newRight.getMonth() + offset);
        setCurrentMonthRight(newRight);
    };

    const handleDateClick = (date: Date) => {
        setActivePreset('Custom Range');
        
        // Normalize date to midnight
        const clickedDate = new Date(date);
        clickedDate.setHours(0,0,0,0);

        if (!startDate || (startDate && endDate)) {
            // New selection start
            setStartDate(clickedDate);
            setEndDate(null);
        } else if (startDate && !endDate) {
            // Completing the selection
            if (clickedDate < startDate) {
                // User clicked a date before start date -> Reset start date
                setStartDate(clickedDate);
                setEndDate(null);
            } else {
                setEndDate(clickedDate);
            }
        }
    };

    const handlePresetClick = (preset: DatePreset) => {
        setActivePreset(preset);
        const now = new Date();
        now.setHours(0,0,0,0);

        if (preset === 'Today') {
            setStartDate(now);
            setEndDate(now);
            updateCalendarView(now);
        } else if (preset === 'Yesterday') {
            const yest = new Date(now);
            yest.setDate(now.getDate() - 1);
            setStartDate(yest);
            setEndDate(yest);
            updateCalendarView(yest);
        } else if (preset === 'Last 7 Days') {
            const prev = new Date(now);
            prev.setDate(now.getDate() - 6); // 7 days inclusive
            setStartDate(prev);
            setEndDate(now);
            updateCalendarView(prev);
        } else if (preset === 'Last 30 Days') {
            const prev = new Date(now);
            prev.setDate(now.getDate() - 29); // 30 days inclusive
            setStartDate(prev);
            setEndDate(now);
            updateCalendarView(prev);
        } else if (preset === 'This Month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            setStartDate(start);
            setEndDate(now); // Cap at today for future restriction
            updateCalendarView(start);
        } else if (preset === 'Last Month') {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            setStartDate(start);
            setEndDate(end);
            updateCalendarView(start);
        } else if (preset === 'All') {
            setStartDate(null);
            setEndDate(null);
        }
    };

    const formatDate = (d: Date | null) => d ? d.toLocaleDateString('en-GB') : '--/--/--';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fade-in flex flex-col">
                {/* Header - Fixed */}
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-white/5 shrink-0">
                    <h2 className="text-lg font-bold text-brand-text-light-primary dark:text-white">Select Date Range</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-brand-text-light-primary dark:hover:text-white transition-colors bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 p-1.5 rounded-full">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex flex-col md:flex-row overflow-y-auto custom-scrollbar flex-1">
                    {/* Sidebar Presets */}
                    <div className="w-full md:w-56 bg-brand-light-secondary dark:bg-[#15171A] border-r border-gray-200 dark:border-white/5 p-4 flex flex-col justify-between shrink-0">
                        <div className="flex flex-col gap-1">
                            {textPresets.map(preset => (
                                <button
                                    key={preset}
                                    onClick={() => handlePresetClick(preset)}
                                    className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                                        activePreset === preset
                                        ? 'bg-white dark:bg-[#24272B] text-brand-text-light-primary dark:text-white shadow-sm' 
                                        : 'text-gray-500 dark:text-gray-400 hover:text-brand-text-light-primary dark:hover:text-white hover:bg-white dark:hover:bg-white/5'
                                    }`}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                        
                        {/* Custom Range Button at Bottom */}
                        <div className="pt-4 border-t border-gray-200 dark:border-white/5 mt-2">
                            <button
                                onClick={() => setActivePreset('Custom Range')}
                                className={`w-full text-center px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                                    activePreset === 'Custom Range'
                                    ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' 
                                    : 'bg-brand-green/10 text-brand-green hover:bg-brand-green/20'
                                }`}
                            >
                                Custom Range
                            </button>
                        </div>
                    </div>

                    {/* Calendars Area */}
                    <div className="flex-1 p-6 bg-white dark:bg-[#1A1D21]">
                        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                            <div className="flex-1">
                                {renderCalendar(currentMonthLeft)}
                            </div>
                            <div className="flex-1 hidden md:block">
                                {renderCalendar(currentMonthRight)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Fixed */}
                <div className="p-5 border-t border-gray-200 dark:border-white/5 bg-brand-light-secondary dark:bg-[#15171A] flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Selected Range : <span className="text-brand-text-light-primary dark:text-white font-bold ml-2">{formatDate(startDate)} - {formatDate(endDate)}</span>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button onClick={onClose} className="flex-1 sm:flex-none px-6 py-2.5 rounded-full border border-gray-300 dark:border-white/10 text-brand-text-light-primary dark:text-white text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                            Clear
                        </button>
                        <button 
                            onClick={() => {
                                if (startDate) {
                                    let finalStart = startDate;
                                    let finalEnd = endDate || startDate; 
                                    
                                    if (finalEnd < finalStart) {
                                        const temp = finalStart;
                                        finalStart = finalEnd;
                                        finalEnd = temp;
                                    }
                                    
                                    onApply(finalStart, finalEnd, activePreset);
                                    onClose();
                                }
                            }}
                            disabled={!startDate}
                            className={`flex-1 sm:flex-none px-8 py-2.5 rounded-full text-white text-sm font-bold shadow-lg transition-colors ${
                                startDate 
                                ? 'bg-brand-green hover:bg-brand-green/90 shadow-brand-green/20' 
                                : 'bg-brand-green/50 cursor-not-allowed opacity-50'
                            }`}
                        >
                            Apply changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DateRangePickerModal;