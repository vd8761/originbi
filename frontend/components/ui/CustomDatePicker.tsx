
import React, { useState } from 'react';
import {CalendarIcon,ChevronDownIcon } from '@/components/icons';

interface CustomDatePickerProps {
    value?: { start: string; end: string };
    onChange: (start: string, end: string) => void;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    // Hardcoded dates matching the design for demo purposes
    // Ideally this would use a real date logic library like date-fns
    const [selectedRange, setSelectedRange] = useState(value || { start: 'Oct 31 2025 10:45 AM', end: 'Nov 04 2025 11:45 AM' });

    const toggleOpen = () => setIsOpen(!isOpen);

    const handleApply = () => {
        onChange(selectedRange.start, selectedRange.end);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full">
            {/* Input Trigger */}
            <button 
                type="button"
                onClick={toggleOpen}
                className="w-full flex items-center justify-between bg-[#24272B] border border-transparent rounded-lg px-4 py-3 text-sm text-gray-300 hover:border-[#303438] focus:border-brand-green transition-colors"
            >
                <div className="flex items-center gap-3">
                    <CalendarIcon className="w-4 h-4 text-brand-green" />
                    <span className="font-medium">{selectedRange.start} - {selectedRange.end}</span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full sm:w-[500px] bg-[#1A1D21] border border-white/10 rounded-2xl shadow-2xl z-50 p-4 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="text-white font-semibold">Select Date and Time</h3>
                         <button type="button" onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">✕</button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        {/* From Date */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">From <span className="text-red-500">*</span></label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-[#24272B] rounded px-3 py-2 text-sm text-white border border-white/5 flex justify-between items-center">
                                    31/10/2025 <ChevronDownIcon className="w-3 h-3 text-gray-500"/>
                                </div>
                                <div className="bg-[#24272B] rounded px-2 py-2 text-sm text-white border border-white/5 flex gap-1 items-center">
                                    10 <div className="flex flex-col text-[8px] text-gray-500 leading-none"><span>▲</span><span>▼</span></div>
                                </div>
                                <div className="bg-[#24272B] rounded px-2 py-2 text-sm text-white border border-white/5 flex gap-1 items-center">
                                    45 <div className="flex flex-col text-[8px] text-gray-500 leading-none"><span>▲</span><span>▼</span></div>
                                </div>
                                <div className="bg-brand-green rounded px-2 py-2 text-sm text-white font-bold">AM</div>
                            </div>
                        </div>

                         {/* To Date */}
                         <div className="space-y-2">
                            <label className="text-xs text-gray-400">To <span className="text-red-500">*</span></label>
                             <div className="flex gap-2">
                                <div className="flex-1 bg-[#24272B] rounded px-3 py-2 text-sm text-white border border-white/5 flex justify-between items-center">
                                    04/11/2025 <ChevronDownIcon className="w-3 h-3 text-gray-500"/>
                                </div>
                                <div className="bg-[#24272B] rounded px-2 py-2 text-sm text-white border border-white/5 flex gap-1 items-center">
                                    11 <div className="flex flex-col text-[8px] text-gray-500 leading-none"><span>▲</span><span>▼</span></div>
                                </div>
                                <div className="bg-[#24272B] rounded px-2 py-2 text-sm text-white border border-white/5 flex gap-1 items-center">
                                    45 <div className="flex flex-col text-[8px] text-gray-500 leading-none"><span>▲</span><span>▼</span></div>
                                </div>
                                <div className="bg-brand-green rounded px-2 py-2 text-sm text-white font-bold">AM</div>
                            </div>
                        </div>
                    </div>

                    {/* Calendar Visual (Static for UI Demo) */}
                    <div className="bg-[#24272B] rounded-xl p-4 mb-4 border border-white/5">
                        <div className="flex justify-between items-center mb-4 px-2">
                            <button className="text-gray-400 hover:text-white">{'<'}</button>
                            <span className="text-white font-semibold">October 2025</span>
                            <button className="text-gray-400 hover:text-white">{'>'}</button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-gray-500">
                             <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-sm text-white">
                            <div className="text-gray-600">29</div><div className="text-gray-600">30</div>
                            <div className="p-1">1</div><div className="p-1">2</div><div className="p-1">3</div><div className="p-1">4</div><div className="p-1">5</div>
                            <div className="p-1">6</div><div className="p-1">7</div><div className="p-1">8</div><div className="p-1">9</div><div className="p-1">10</div><div className="p-1">11</div><div className="p-1">12</div>
                            <div className="p-1">13</div><div className="p-1">14</div><div className="p-1">15</div><div className="p-1">16</div><div className="p-1">17</div><div className="p-1">18</div><div className="p-1">19</div>
                            <div className="p-1">20</div><div className="p-1">21</div><div className="p-1">22</div><div className="p-1">23</div><div className="p-1">24</div><div className="p-1">25</div><div className="p-1">26</div>
                            <div className="p-1">27</div><div className="p-1">28</div><div className="p-1">29</div><div className="p-1">30</div>
                            <div className="bg-brand-green rounded-full w-7 h-7 flex items-center justify-center mx-auto shadow-lg shadow-brand-green/30">31</div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                        <span className="text-brand-green">Duration: 34 Days</span>
                        <div className="flex gap-2">
                            <button onClick={() => setIsOpen(false)} className="px-4 py-2 border border-white/10 rounded-full text-white hover:bg-white/5">Clear</button>
                            <button onClick={handleApply} className="px-4 py-2 bg-brand-green rounded-full text-white font-bold hover:bg-brand-green/90 shadow-lg shadow-brand-green/20">Apply changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomDatePicker;
