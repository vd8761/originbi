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

    // Calculate position for the thumb
    // We need to map the credit value (MIN-MAX) to a percentage (0-100)
    // However, since we want 5 (MIN) to be at the very start, we treat MIN as 0%
    const percentage = ((credits - INPUT_MIN) / (INPUT_MAX - INPUT_MIN)) * 100;


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
            <div className="relative bg-white dark:bg-[#1A1D21] w-full max-w-[420px] rounded-[32px] shadow-2xl flex flex-col max-h-[95vh] mx-4 overflow-hidden font-['Haskoy']">

                {/* Header */}
                <div className="px-6 pt-5 pb-0 flex items-center justify-between">
                    <h2 className="text-[22px] font-bold text-[#150089] dark:text-white leading-none tracking-tight">Buy Credits</h2>

                    <div className="flex items-center gap-3">
                        {/* Badge */}
                        <div className="flex items-center gap-1.5 bg-[#FFF8E6] dark:bg-yellow-500/10 px-3 py-1.5 rounded-[8px] border border-[#FBEFCA] dark:border-yellow-500/20">
                            <div className="w-1.5 h-1.5 bg-[#FBC02D] rounded-full"></div>
                            <span className="text-[12px] font-medium text-[#19211C] dark:text-white whitespace-nowrap">
                                <span className="text-gray-500 dark:text-gray-400">Current Balance</span> <span className="text-[#1ED36A] font-bold">{currentBalance} Credits</span>
                            </span>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-[#1ED36A] flex items-center justify-center hover:bg-[#16b058] transition-colors shadow-none group"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:rotate-90 transition-transform duration-300">
                                <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Price Display */}
                <div className="text-center pt-3 pb-2">
                    <div className="text-[13px] text-[#19211C] dark:text-gray-400 font-medium mb-0.5">
                        <span className="font-bold">₹{PER_CREDIT_COST}</span> Per Credit (Taxes Extra, If Applicable)
                    </div>
                    <div className="text-[34px] font-bold text-[#150089] dark:text-[#1ED36A] leading-none tracking-tight">
                        ₹{totalCost.toLocaleString()} <span className="text-[22px] text-[#150089] dark:text-white font-medium">for {credits} Credits</span>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="overflow-y-auto no-scrollbar flex-1 px-6 pb-2 space-y-3">

                    {/* Main Card: Credits To Purchase */}
                    <div className="bg-[#F8F9FB] dark:bg-white/5 rounded-[24px] p-4 pt-5">
                        <div className="text-center text-[15px] font-semibold text-[#19211C] dark:text-white mb-6">Credits To Purchase</div>

                        {/* Slider Section */}
                        <div className="mb-8 px-1">
                            <div className="flex justify-between text-[11px] font-medium text-[#19211C] dark:text-gray-400 mb-5">
                                <span>Select Credits</span>
                            </div>

                            <div className="relative w-full h-10 flex items-center mb-1 select-none">
                                {/* SVG Track Background (Unfilled Gradient Ticks) */}
                                <svg className="absolute w-full h-full pointer-events-none z-0" height="40" width="100%">
                                    <defs>
                                        <linearGradient id="tickGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#22C55E" /> {/* Green */}
                                            <stop offset="100%" stopColor="#4ADE80" /> {/* Lighter Green */}
                                        </linearGradient>
                                    </defs>

                                    {/* Generate ticks */}
                                    {Array.from({ length: 50 }).map((_, i) => {
                                        const x = `${(i / 49) * 100}%`;
                                        return (
                                            <rect
                                                key={i}
                                                x={x}
                                                y="12"
                                                width="2"
                                                height="8"
                                                rx="1"
                                                fill="url(#tickGradient)"
                                            />
                                        );
                                    })}
                                </svg>

                                {/* Active Fill Line (Solid Green Overlay covers the ticks) */}
                                <div
                                    className="absolute h-[10px] bg-[#1ED36A] rounded-full left-0 top-1/2 -translate-y-[calc(50%-2px)] pointer-events-none z-10"
                                    style={{ width: `${percentage}%` }}
                                ></div>

                                {/* Thumb */}
                                <div
                                    className="absolute top-1/2 -translate-y-[calc(50%-2px)] -translate-x-1/2 z-20 pointer-events-none"
                                    style={{ left: `${percentage}%` }}
                                >
                                    <div className="bg-[#1ED36A] text-white text-[14px] font-bold py-1.5 px-4 rounded-full shadow-[0_4px_15px_rgba(30,211,106,0.6)] border-[4px] border-white dark:border-[#1A1D21] min-w-[60px] text-center whitespace-nowrap transform scale-110">
                                        {credits}
                                    </div>
                                </div>

                                {/* Input */}
                                <input
                                    type="range"
                                    min={INPUT_MIN}
                                    max={INPUT_MAX}
                                    value={credits}
                                    onChange={handleSliderChange}
                                    className="absolute w-full h-full opacity-0 cursor-pointer z-30"
                                />
                            </div>
                            <div className="flex justify-between text-[11px] font-medium text-[#19211C] dark:text-gray-400 mt-2">
                                <span>0</span>
                                <span>1000</span>
                            </div>
                        </div>

                        {/* OR Divider */}
                        <div className="flex items-center gap-4 my-5 opacity-40">
                            <div className="h-[1px] bg-gray-400 dark:bg-white/20 flex-1"></div>
                            <span className="text-[12px] font-medium text-[#19211C] dark:text-gray-400">OR</span>
                            <div className="h-[1px] bg-gray-400 dark:bg-white/20 flex-1"></div>
                        </div>

                        {/* Quick Select Buttons */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] text-[#19211C] dark:text-gray-400 font-medium">Quick Select</label>
                            <div className="grid grid-cols-5 gap-2">
                                {[100, 200, 300, 400].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => handleQuickSelect(val)}
                                        className={`h-[36px] rounded-[8px] text-[14px] font-medium transition-all
                                            ${credits === val
                                                ? 'bg-[#E0F8E9] text-[#19211C] border border-[#1ED36A] shadow-sm'
                                                : 'bg-[#EAECEF] dark:bg-white/10 text-[#19211C] dark:text-white border border-transparent hover:bg-gray-200'
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
                                        value={credits > 400 && credits <= 1000 ? credits : (credits > 0 && ![100, 200, 300, 400].includes(credits) ? credits : '')}
                                        onChange={handleInputChange}
                                        onFocus={() => { if (credits < 100) setCredits(100); }}
                                        className="w-full h-[36px] rounded-[8px] bg-[#EAECEF] dark:bg-white/10 text-[13px] px-1 text-center font-medium outline-none focus:ring-1 focus:ring-[#1ED36A] placeholder:text-gray-500 text-[#19211C] dark:text-white transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Summary - Accordion Style */}
                    <div className="bg-[#F8F9FB] dark:bg-white/5 rounded-[16px] px-5 py-3 cursor-pointer transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10" onClick={() => setIsPricingExpanded(!isPricingExpanded)}>
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium text-[14px] text-[#19211C] dark:text-white">Pricing Summary</h4>
                            <svg
                                className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isPricingExpanded ? '-rotate-180' : ''}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>

                        <div className={`grid transition-all duration-300 ease-in-out ${isPricingExpanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                            <div className="overflow-hidden">
                                <div className="space-y-2 border-t border-dashed border-gray-300 dark:border-white/10 pt-3">
                                    <div className="flex justify-between text-[12px] text-[#19211C] dark:text-gray-300">
                                        <span>Credits</span>
                                        <span className="font-semibold">{credits}</span>
                                    </div>
                                    <div className="flex justify-between text-[12px] text-[#19211C] dark:text-gray-300">
                                        <span>Price Per Credit</span>
                                        <span className="font-semibold">₹{PER_CREDIT_COST}</span>
                                    </div>
                                    <div className="flex justify-between text-[14px] text-[#19211C] dark:text-white font-bold pt-1">
                                        <span>Total Amount</span>
                                        <span>₹{totalCost.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Fixed at Bottom */}
                <div className="p-6 pt-3 pb-6 bg-white dark:bg-[#1A1D21]">
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
