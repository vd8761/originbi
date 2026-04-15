import React, { useEffect, useState } from 'react';
import { ArrowLeftWithoutLineIcon, ArrowRightWithoutLineIcon } from '../icons';

type DatePreset =
    | 'All'
    | 'Today'
    | 'Yesterday'
    | 'Last 7 Days'
    | 'Last 30 Days'
    | 'This Month'
    | 'Last Month'
    | 'Custom Range';

interface DateRangePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (start: Date, end: Date, label: string) => void;
    initialRange?: { start: Date | null; end: Date | null; label: string };
    placement?: 'center' | 'under-filter';
}

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
const adjustDayIndex = (day: number) => (day === 0 ? 6 : day - 1);
const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

const textPresets: DatePreset[] = [
    'All',
    'Today',
    'Yesterday',
    'Last 7 Days',
    'Last 30 Days',
    'This Month',
    'Last Month',
];

const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const DateRangePickerModal: React.FC<DateRangePickerModalProps> = ({
    isOpen,
    onClose,
    onApply,
    initialRange,
    placement = 'center',
}) => {
    const [activePreset, setActivePreset] = useState<DatePreset>('Today');
    const [currentMonthLeft, setCurrentMonthLeft] = useState(new Date());
    const [currentMonthRight, setCurrentMonthRight] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        return d;
    });
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const updateCalendarView = (date: Date) => {
        setCurrentMonthLeft(new Date(date.getFullYear(), date.getMonth(), 1));
        setCurrentMonthRight(new Date(date.getFullYear(), date.getMonth() + 1, 1));
    };

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const label = initialRange?.label ?? 'Today';

        if (label === 'All') {
            setStartDate(null);
            setEndDate(null);
            setActivePreset('All');
            updateCalendarView(new Date());
            return;
        }

        const start = initialRange?.start ?? new Date();
        const end = initialRange?.end ?? start;

        setStartDate(start);
        setEndDate(end);

        if (textPresets.includes(label as DatePreset) || label === 'Custom Range') {
            setActivePreset(label as DatePreset);
        } else {
            setActivePreset('Custom Range');
        }

        updateCalendarView(start);
    }, [isOpen, initialRange]);

    const handleMonthChange = (offset: number) => {
        setCurrentMonthLeft((prev) => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() + offset);
            return d;
        });

        setCurrentMonthRight((prev) => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() + offset);
            return d;
        });
    };

    const handleDateClick = (date: Date) => {
        setActivePreset('Custom Range');
        const clickedDate = new Date(date);
        clickedDate.setHours(0, 0, 0, 0);

        if (!startDate || (startDate && endDate)) {
            setStartDate(clickedDate);
            setEndDate(null);
            return;
        }

        if (clickedDate < startDate) {
            setStartDate(clickedDate);
            setEndDate(null);
            return;
        }

        setEndDate(clickedDate);
    };

    const handlePresetClick = (preset: DatePreset) => {
        setActivePreset(preset);

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (preset === 'All') {
            setStartDate(null);
            setEndDate(null);
            return;
        }

        if (preset === 'Today') {
            setStartDate(now);
            setEndDate(now);
            updateCalendarView(now);
            return;
        }

        if (preset === 'Yesterday') {
            const yest = new Date(now);
            yest.setDate(now.getDate() - 1);
            setStartDate(yest);
            setEndDate(yest);
            updateCalendarView(yest);
            return;
        }

        if (preset === 'Last 7 Days') {
            const start = new Date(now);
            start.setDate(now.getDate() - 6);
            setStartDate(start);
            setEndDate(now);
            updateCalendarView(start);
            return;
        }

        if (preset === 'Last 30 Days') {
            const start = new Date(now);
            start.setDate(now.getDate() - 29);
            setStartDate(start);
            setEndDate(now);
            updateCalendarView(start);
            return;
        }

        if (preset === 'This Month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            setStartDate(start);
            setEndDate(now);
            updateCalendarView(start);
            return;
        }

        if (preset === 'Last Month') {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            setStartDate(start);
            setEndDate(end);
            updateCalendarView(start);
        }
    };

    const formatDate = (d: Date | null) => (d ? d.toLocaleDateString('en-GB') : '--/--/--');

    const renderCalendar = (baseDate: Date) => {
        const year = baseDate.getFullYear();
        const month = baseDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = adjustDayIndex(getFirstDayOfMonth(year, month));
        const monthName = baseDate.toLocaleString('default', { month: 'long', year: 'numeric' });

        const todayTime = normalizeDate(new Date());
        const startTime = startDate ? normalizeDate(startDate) : null;
        const endTime = endDate ? normalizeDate(endDate) : null;

        const days: React.ReactNode[] = [];

        for (let i = 0; i < firstDay; i += 1) {
            days.push(<div key={`empty-${year}-${month}-${i}`} className="h-9 w-9" />);
        }

        for (let d = 1; d <= daysInMonth; d += 1) {
            const date = new Date(year, month, d);
            const time = normalizeDate(date);
            const isFuture = time > todayTime;
            const isToday = time === todayTime;

            const isSelectedStart = startTime !== null && time === startTime;
            const isSelectedEnd = endTime !== null && time === endTime;
            const isSelected = isSelectedStart || isSelectedEnd;

            const rangeMin =
                startTime !== null && endTime !== null ? Math.min(startTime, endTime) : null;
            const rangeMax =
                startTime !== null && endTime !== null ? Math.max(startTime, endTime) : null;

            const isInRange =
                rangeMin !== null && rangeMax !== null && time > rangeMin && time < rangeMax;

            days.push(
                <div key={`${year}-${month}-${d}`} className="h-9 w-9 relative flex items-center justify-center">
                    {isInRange && (
                        <span className="absolute inset-y-[6px] left-0 right-0 bg-brand-green/20" />
                    )}
                    <button
                        type="button"
                        disabled={isFuture}
                        onClick={() => !isFuture && handleDateClick(date)}
                        className={`relative z-10 h-9 w-9 text-xs font-medium rounded-full flex items-center justify-center transition-all ${
                            isFuture ? 'text-gray-400 dark:text-gray-700 cursor-not-allowed opacity-30' : ''
                        } ${
                            !isFuture && isSelected
                                ? 'bg-brand-green text-white shadow-lg shadow-brand-green/30 font-bold'
                                : ''
                        } ${
                            !isFuture && !isSelected && isInRange
                                ? 'text-brand-green dark:text-white rounded-none'
                                : ''
                        } ${
                            !isFuture && !isSelected && !isInRange
                                ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                                : ''
                        } ${
                            !isFuture && isToday && !isSelected && !isInRange
                                ? 'border border-brand-green text-brand-green font-bold'
                                : ''
                        } ${isInRange && !isSelected ? 'rounded-none' : ''}`}
                    >
                        {d}
                    </button>
                </div>
            );
        }

        return (
            <div className="w-full">
                <div className="flex justify-between items-center mb-6 px-2">
                    {baseDate.getTime() === currentMonthLeft.getTime() ? (
                        <button
                            className="text-gray-500 hover:text-brand-text-light-primary dark:hover:text-white transition-colors p-1 flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
                            onClick={() => handleMonthChange(-1)}
                            type="button"
                        >
                            <ArrowLeftWithoutLineIcon className="w-2.5 h-3" />
                        </button>
                    ) : (
                        <div className="w-8" />
                    )}

                    <span className="text-sm font-bold text-brand-text-light-primary dark:text-white tracking-wide capitalize">
                        {monthName}
                    </span>

                    {baseDate.getTime() === currentMonthRight.getTime() ? (
                        <button
                            className="text-gray-500 hover:text-brand-text-light-primary dark:hover:text-white transition-colors p-1 flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
                            onClick={() => handleMonthChange(1)}
                            type="button"
                        >
                            <ArrowRightWithoutLineIcon className="w-2.5 h-3" />
                        </button>
                    ) : (
                        <div className="w-8" />
                    )}
                </div>

                <div className="grid grid-cols-7 mb-3">
                    {weekDays.map((d) => (
                        <div
                            key={`${baseDate.getMonth()}-${d}`}
                            className="h-8 w-8 flex items-center justify-center text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider"
                        >
                            {d}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-y-1">{days}</div>
            </div>
        );
    };

    if (!isOpen) {
        return null;
    }

    const placementClass =
        placement === 'under-filter'
            ? 'items-start justify-center pt-[118px] sm:pt-[132px]'
            : 'items-center justify-center';

    return (
        <div className={`fixed inset-0 z-[100] flex px-4 ${placementClass}`}>
            <div
                className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fade-in flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-white/5 shrink-0">
                    <h2 className="text-lg font-bold text-brand-text-light-primary dark:text-white">
                        Select Date Range
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-brand-text-light-primary dark:hover:text-white transition-colors bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 p-1.5 rounded-full"
                        type="button"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-col md:flex-row overflow-y-auto custom-scrollbar flex-1">
                    <div className="w-full md:w-56 bg-brand-light-secondary dark:bg-[#15171A] border-r border-gray-200 dark:border-white/5 p-4 flex flex-col justify-between shrink-0">
                        <div className="flex flex-col gap-1">
                            {textPresets.map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => handlePresetClick(preset)}
                                    className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                                        activePreset === preset
                                            ? 'bg-white dark:bg-[#24272B] text-brand-text-light-primary dark:text-white shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-brand-text-light-primary dark:hover:text-white hover:bg-white dark:hover:bg-white/5'
                                    }`}
                                    type="button"
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-white/5 mt-2">
                            <button
                                onClick={() => setActivePreset('Custom Range')}
                                className={`w-full text-center px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                                    activePreset === 'Custom Range'
                                        ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20'
                                        : 'bg-brand-green/10 text-brand-green hover:bg-brand-green/20'
                                }`}
                                type="button"
                            >
                                Custom Range
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 p-6 bg-white dark:bg-[#19211C]">
                        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                            <div className="flex-1">{renderCalendar(currentMonthLeft)}</div>
                            <div className="flex-1 hidden md:block">{renderCalendar(currentMonthRight)}</div>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-gray-200 dark:border-white/5 bg-brand-light-secondary dark:bg-[#15171A] flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Selected Range :
                        <span className="text-brand-text-light-primary dark:text-white font-bold ml-2">
                            {formatDate(startDate)} - {formatDate(endDate)}
                        </span>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-6 py-2.5 rounded-full border border-gray-300 dark:border-white/10 text-brand-text-light-primary dark:text-white text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            type="button"
                        >
                            Clear
                        </button>
                        <button
                            onClick={() => {
                                if (!startDate) {
                                    return;
                                }

                                let finalStart = startDate;
                                let finalEnd = endDate || startDate;

                                if (finalEnd < finalStart) {
                                    const temp = finalStart;
                                    finalStart = finalEnd;
                                    finalEnd = temp;
                                }

                                onApply(finalStart, finalEnd, activePreset);
                                onClose();
                            }}
                            disabled={!startDate}
                            className={`flex-1 sm:flex-none px-8 py-2.5 rounded-full text-white text-sm font-bold shadow-lg transition-colors ${
                                startDate
                                    ? 'bg-brand-green hover:bg-brand-green/90 shadow-brand-green/20'
                                    : 'bg-brand-green/50 cursor-not-allowed opacity-50'
                            }`}
                            type="button"
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
