"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CoinIcon, FlashIcon } from '@/components/icons';
import { ChevronDownIcon, X } from "lucide-react";

interface BuyCreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentBalance: number;
    onBuy: (amount: number, cost: number) => void;
}

const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({
    isOpen,
    onClose,
    currentBalance,
    onBuy,
}) => {
    const [credits, setCredits] = useState<number>(200);
    const [isPricingExpanded, setIsPricingExpanded] = useState(true);

    const PER_CREDIT_COST = Number(process.env.NEXT_PUBLIC_PER_CREDIT_COST) || 200;
    const totalCost = credits * PER_CREDIT_COST;

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setCredits(200);
            setIsPricingExpanded(true);
        }
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    // Constants
    const CONTAINER_WIDTH = 100; // %
    const INPUT_MIN = 10;
    const INPUT_MAX = 1000;
    const quickSelectValues = [100, 200, 300, 400];

    // Calculate position for the thumb
    // We need to map the credit value (MIN-MAX) to a percentage (0-100)
    // However, since we want 5 (MIN) to be at the very start, we treat MIN as 0%
    const rawPercentage = ((credits - INPUT_MIN) / (INPUT_MAX - INPUT_MIN)) * 100;
    const percentage = Math.min(100, Math.max(0, rawPercentage));


    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredits(Number(e.target.value));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        if (!isNaN(val) && val >= INPUT_MIN && val <= INPUT_MAX) {
            setCredits(val);
        }
    };

    const handleQuickSelect = (val: number) => {
        setCredits(val);
    };

    const handleBuy = () => {
        onBuy(credits, totalCost);
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity font-['Haskoy']">
            {/* Backdrop click to close */}
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative bg-white dark:bg-[#19211C] w-full max-w-[550px] rounded-[32px] shadow-2xl flex flex-col max-h-[95vh] mx-4 overflow-hidden font-['Haskoy']">

                {/* Header */}
                <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-white/10 relative min-h-[64px]">
                    <h2 className="text-[17px] sm:text-[18px] font-bold text-[#150089] dark:text-white leading-none tracking-tight truncate max-w-[100px] xs:max-w-none">Buy Credits</h2>

                    {/* Centered Badge - Responsive for mobile and desktop */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 bg-[#F8F9FB] dark:bg-white/10 pl-2 pr-3 py-1.5 rounded-[8px] whitespace-nowrap border border-gray-50 dark:border-white/5">
                        <CoinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#FBC02D] drop-shadow-sm" />
                        <span className="text-[11px] sm:text-[13px] font-medium text-[#19211C] dark:text-white">
                            <span className="text-gray-500 dark:text-gray-400">Current Balance</span> <span className="text-[#1ED36A] font-bold ml-0.5 sm:ml-1">{currentBalance} <span className="hidden xs:inline">Credits</span></span>
                        </span>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-[#1ED36A] hover:bg-[#16b058] flex items-center justify-center transition-all shadow-md group active:scale-95 shrink-0"
                    >
                        <X className="w-4 h-4 text-white transition-transform duration-300 group-hover:rotate-90" strokeWidth={3} />
                    </button>
                </div>

                {/* Price Display */}
                <div className="text-center pt-6 pb-4 px-4">
                    <div className="text-[13px] sm:text-[14px] text-[#19211C] dark:text-gray-400 font-medium mb-1">
                        <span className="font-bold text-[#150089] dark:text-white line-clamp-1">₹{PER_CREDIT_COST} Per Credit (Taxes Extra, If Applicable)</span>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-center gap-x-2 leading-none">
                        <span className="text-[32px] sm:text-[40px] font-bold text-[#150089] dark:text-[#1ED36A] tracking-tight">₹{totalCost.toLocaleString()}</span>
                        <span className="text-[20px] sm:text-[24px] text-[#150089] dark:text-white font-medium whitespace-nowrap">for {credits} Credits</span>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="overflow-y-auto no-scrollbar flex-1 px-4 sm:px-6 pb-2 space-y-3">

                    {/* Main Card: Credits To Purchase */}
                    <div className="bg-[#F8F9FB] dark:bg-white/5 rounded-[24px] p-6">
                        <div className="text-center text-[16px] font-semibold text-[#19211C] dark:text-white mb-8">Credits To Purchase</div>

                        {/* Slider Section */}
                        <div className="px-2 mb-4 relative">
                            {/* Labels */}
                            <div className="flex justify-between text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-4">
                                <span>Select Credits</span>
                            </div>

                            {/* Slider Component */}
                            <div className="relative w-full h-14 flex items-center select-none touch-none group">

                                {/* 1. Inactive Ticks Layer (Gradient Background with Mask) */}
                                <div className="absolute inset-x-0 h-[10px] rounded-full overflow-hidden pointer-events-none opacity-80">
                                    <div
                                        className="w-full h-full"
                                        style={{
                                            background: 'linear-gradient(90deg, #4ADE80 0%, #EAB308 100%)',
                                            maskImage: 'repeating-linear-gradient(90deg, black 0, black 2px, transparent 2px, transparent 8px)',
                                            WebkitMaskImage: 'repeating-linear-gradient(90deg, black 0, black 2px, transparent 2px, transparent 8px)'
                                        }}
                                    />
                                </div>

                                {/* 2. Active Solid Bar Layer (Green) */}
                                <div
                                    className="absolute left-0 h-[16px] bg-[#1ED36A] rounded-l-full pointer-events-none shadow-sm z-10"
                                    style={{
                                        width: `${percentage}%`,
                                        // Slight rounding fix for when it's full width
                                        borderTopRightRadius: percentage > 98 ? '999px' : '0',
                                        borderBottomRightRadius: percentage > 98 ? '999px' : '0',
                                    }}
                                ></div>

                                {/* 3. Thumb Layer */}
                                <div
                                    className="absolute top-1/2 -translate-y-[calc(50%)] -translate-x-1/2 z-20 pointer-events-none"
                                    style={{ left: `${percentage}%` }}
                                >
                                    <div className="bg-[#1ED36A] text-white text-[14px] font-bold py-1 px-3.5 rounded-full shadow-[0_4px_12px_rgba(30,211,106,0.3)] border-[3px] border-white dark:border-[#19211C] min-w-[62px] text-center whitespace-nowrap transform transition-transform group-active:scale-105">
                                        {credits}
                                    </div>
                                </div>

                                {/* 4. Input - Cover full area for functionality */}
                                <input
                                    type="range"
                                    min={INPUT_MIN}
                                    max={INPUT_MAX}
                                    value={credits}
                                    onChange={handleSliderChange}
                                    className="absolute w-full h-full opacity-0 cursor-pointer z-30"
                                />
                            </div>

                            <div className="flex justify-between text-[12px] font-medium text-gray-400 mt-[-4px]">
                                <span>0</span>
                                <span>1000</span>
                            </div>
                        </div>

                        {/* OR Divider - Darkened */}
                        <div className="flex items-center gap-4 my-4">
                            <div className="h-[1px] bg-gray-200 dark:bg-white/20 flex-1"></div>
                            <span className="text-[12px] font-bold text-gray-400 dark:text-gray-500 tracking-wide">OR</span>
                            <div className="h-[1px] bg-gray-200 dark:bg-white/20 flex-1"></div>
                        </div>

                        {/* Quick Select Buttons */}
                        <div className="flex flex-col gap-3">
                            <label className="text-[12px] font-medium text-gray-500 dark:text-gray-400">Quick Select</label>
                            <div className="grid grid-cols-5 gap-2">
                                {quickSelectValues.map((val: number) => (
                                    <button
                                        key={val}
                                        onClick={() => handleQuickSelect(val)}
                                        className={`h-[42px] rounded-[10px] text-[15px] font-bold transition-all border
                                            ${credits === val
                                                ? 'bg-[#E0F8E9] text-[#19211C] border-[#1ED36A] shadow-sm'
                                                : 'bg-[#F3F4F6] dark:bg-white/5 text-[#19211C] dark:text-white border-transparent hover:bg-gray-200 dark:hover:bg-[#2A2D31]'
                                            }`}
                                    >
                                        {val}
                                    </button>
                                ))}
                                {/* Custom Input Button */}
                                <div className="relative col-span-1">
                                    <input
                                        type="number"
                                        placeholder="Enter.."
                                        value={credits === 0 ? '' : (credits > 0 && ![100, 200, 300, 400].includes(credits) ? credits : '')}
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                                            if (!isNaN(val) && val <= INPUT_MAX) {
                                                setCredits(val);
                                            }
                                        }}
                                        className="w-full h-[42px] rounded-[10px] bg-[#F3F4F6] dark:bg-white/5 text-[14px] px-1 text-center font-bold outline-none border-2 border-transparent focus:border-[#1ED36A] focus:bg-white dark:focus:bg-[#24272C] placeholder:text-gray-400 text-[#19211C] dark:text-white transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Summary - Accordion Style */}
                    <div className="bg-[#F8F9FB] dark:bg-white/5 rounded-[16px] px-5 py-4 cursor-pointer transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10" onClick={() => setIsPricingExpanded(!isPricingExpanded)}>
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-[16px] text-[#19211C] dark:text-white">Pricing Summary</h4>
                            <svg
                                className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isPricingExpanded ? '-rotate-180' : ''}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>

                        <div className={`grid transition-all duration-300 ease-in-out ${isPricingExpanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                            <div className="overflow-hidden">
                                <div className="flex flex-col pt-1">
                                    <div className="flex justify-between text-[14px] font-medium text-[#19211C] dark:text-gray-400 py-3 border-t border-gray-200 dark:border-white/10">
                                        <span>Credits</span>
                                        <span className="font-bold text-[#19211C] dark:text-white">{credits}</span>
                                    </div>
                                    <div className="flex justify-between text-[14px] font-medium text-[#19211C] dark:text-gray-400 py-3 border-t border-gray-200 dark:border-white/10">
                                        <span>Price Per Credit</span>
                                        <span className="font-bold text-[#19211C] dark:text-white">₹{PER_CREDIT_COST}</span>
                                    </div>
                                    <div className="flex justify-between text-[14px] font-medium text-[#19211C] dark:text-gray-400 py-3 border-t border-gray-200 dark:border-white/10">
                                        <span>Total Amount</span>
                                        <span className="font-bold text-[#19211C] dark:text-white">₹{totalCost.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Fixed at Bottom */}
                <div className="p-6 pt-3 pb-6 bg-white dark:bg-[#19211C]">
                    <button
                        onClick={handleBuy}
                        className="w-full bg-[#1ED36A] hover:bg-[#16b058] text-white font-bold text-[16px] py-3 rounded-full shadow-[0_8px_20px_rgba(30,211,106,0.3)] hover:shadow-[0_10px_25px_rgba(30,211,106,0.4)] transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 tracking-wide"
                    >
                        <FlashIcon className="w-[18px] h-[20px] text-white" />
                        Buy Credits
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default BuyCreditsModal;
