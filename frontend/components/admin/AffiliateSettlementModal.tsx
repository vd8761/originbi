"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { XIcon, CalendarIcon, ArrowLeftWithoutLineIcon, ArrowRightWithoutLineIcon } from '../icons';

const API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "";

/* ==================== Settlement Date Picker ==================== */

function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const AffiliateSettlementDatePicker: React.FC<{
    value: string;
    onChange: (dateStr: string) => void;
}> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const TODAY = startOfDay(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(
        () => new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)
    );
    const pickerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const selectedDate = value ? startOfDay(new Date(value)) : null;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const calendarHeight = 320; // approximate height of calendar
            const spaceBelow = window.innerHeight - rect.bottom;
            const showAbove = spaceBelow < calendarHeight && rect.top > calendarHeight;

            setCoords({
                top: (showAbove ? rect.top - calendarHeight - 8 : rect.bottom + 8) + window.scrollY,
                left: Math.max(10, Math.min(rect.left + window.scrollX, window.innerWidth - 290)),
                width: rect.width
            });
        }
    }, [isOpen]);

    const handleDateClick = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        onChange(`${y}-${m}-${d}`);
        setIsOpen(false);
    };

    const renderCalendar = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const startOffset = firstDay === 0 ? 6 : firstDay - 1;

        const today = new Date();
        const isTodayInView = today.getFullYear() === year && today.getMonth() === month;
        const todayDate = today.getDate();

        const days = [];
        for (let i = 0; i < startOffset; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const dateTime = startOfDay(date).getTime();
            const isSelected = selectedDate && dateTime === selectedDate.getTime();
            const isCurrentDate = isTodayInView && d === todayDate;

            days.push(
                <button
                    key={d}
                    type="button"
                    onClick={() => handleDateClick(date)}
                    className={`
                        h-8 w-8 text-[11px] font-bold flex flex-col items-center justify-center rounded-full transition-all relative cursor-pointer
                        ${isSelected
                            ? "bg-brand-green text-white shadow-lg shadow-green-900/20 z-10"
                            : "text-gray-600 dark:text-gray-400 hover:text-brand-text-light-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                        }
                    `}
                >
                    <span className="leading-none">{d}</span>
                    {isCurrentDate && !isSelected && (
                        <div className="w-1 h-1 bg-brand-green rounded-full mt-0.5" />
                    )}
                </button>
            );
        }
        return days;
    };

    const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

    const displayValue = value
        ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "";

    const CalendarOverlay = () => {
        if (!isOpen) return null;
        return createPortal(
            <div
                ref={pickerRef}
                style={{
                    position: 'absolute',
                    top: `${coords.top}px`,
                    left: `${coords.left}px`,
                    zIndex: 99999,
                }}
                className="bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 w-[280px] animate-fade-in shadow-green-900/10"
            >
                <div className="flex justify-between items-center mb-4 bg-gray-50 dark:bg-[#24272B] p-2 rounded-xl border border-gray-200 dark:border-white/5 text-brand-text-light-primary dark:text-white">
                    <button
                        type="button"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400 hover:text-brand-text-light-primary dark:hover:text-white transition-colors w-8 h-8 flex items-center justify-center cursor-pointer"
                    >
                        <ArrowLeftWithoutLineIcon className="w-2.5 h-3.5" />
                    </button>
                    <span className="text-[13px] font-bold tracking-tight">
                        {monthName}
                    </span>
                    <button
                        type="button"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400 hover:text-brand-text-light-primary dark:hover:text-white transition-colors w-8 h-8 flex items-center justify-center cursor-pointer"
                    >
                        <ArrowRightWithoutLineIcon className="w-2.5 h-3.5" />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                    {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                        <div key={d} className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                            {d}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-y-1 gap-x-1 place-items-center">
                    {renderCalendar()}
                </div>
            </div>,
            document.body
        );
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-[50px] flex items-center gap-3 bg-gray-50 dark:bg-white/10 border border-transparent dark:border-transparent rounded-xl px-4 text-sm text-brand-text-light-primary dark:text-white hover:border-brand-green focus:outline-none transition-all cursor-pointer"
            >
                <CalendarIcon className="w-4 h-4 text-brand-green shrink-0" />
                <span className={`font-medium ${value ? '' : 'text-black/40 dark:text-white/60'}`}>
                    {displayValue || "Select date"}
                </span>
            </button>
            <CalendarOverlay />
        </div>
    );
};

/* ==================== Settlement Modal ==================== */

interface AffiliateSettlementModalProps {
    affiliate: any;
    onClose: () => void;
    onSuccess: () => void;
}

export const AffiliateSettlementModal: React.FC<AffiliateSettlementModalProps> = ({ affiliate, onClose, onSuccess }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [settleAmount, setSettleAmount] = useState("");
    const [transactionMode, setTransactionMode] = useState("");
    const [transactionId, setTransactionId] = useState("");
    const [paymentDate, setPaymentDate] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const maxAmount = parseFloat(affiliate.ready_to_process_commission) || 0;

    const formatCurrency = (amount: any) => {
        const num = parseFloat(amount) || 0;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2,
        }).format(num);
    };

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !submitting) onClose();
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [submitting, onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        const amount = parseFloat(settleAmount);
        if (!amount || amount <= 0) {
            setErrorMsg("Please enter a valid settlement amount");
            return;
        }
        if (amount > maxAmount) {
            setErrorMsg(`Amount cannot exceed ready to payment amount (${formatCurrency(maxAmount)})`);
            return;
        }
        if (!transactionMode) {
            setErrorMsg("Please select a payment mode");
            return;
        }
        if (!transactionId.trim()) {
            setErrorMsg("Please enter a transaction ID");
            return;
        }
        if (!paymentDate) {
            setErrorMsg("Please select a payment date");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/admin/affiliates/${affiliate.id}/settle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    settleAmount: amount,
                    transactionMode,
                    transactionId: transactionId.trim(),
                    paymentDate,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Settlement failed (${res.status})`);
            }

            setSuccessMsg("Settlement completed successfully!");
            setTimeout(() => {
                onSuccess();
            }, 1200);
        } catch (err: any) {
            setErrorMsg(err.message || "Settlement failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const paymentModes = [
        { value: "UPI_ID", label: "UPI ID" },
        { value: "UPI_NUMBER", label: "UPI Number" },
        { value: "BANK_TRANSFER", label: "Bank Transfer" },
    ];

    const inputClasses = "w-full h-[50px] bg-gray-50 dark:bg-white/10 border border-transparent dark:border-transparent rounded-xl px-4 text-sm text-brand-text-light-primary dark:text-white placeholder-black/40 dark:placeholder-white/60 focus:border-brand-green focus:outline-none transition-all";
    const labelClasses = "text-xs text-black/70 dark:text-white font-semibold ml-1 mb-1.5 block";

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <div
                ref={modalRef}
                className="relative w-full max-w-[95%] sm:max-w-[480px] lg:max-w-[520px] min-h-[620px] bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]"
            >
                {/* Header Section */}
                <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100 dark:border-white/5 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-brand-text-light-primary dark:text-white">
                                Settle Commission
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                    {affiliate.name}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    {/* Amount Highlight Section */}
                    <div className="px-8 pt-4">
                        <div className="bg-[#1A56DB] dark:bg-blue-600/20 border border-blue-500/20 rounded-2xl p-3 flex items-center justify-between group">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-blue-100 dark:text-blue-400 tracking-wider">
                                    Available for Settlement
                                </p>
                                <p className="text-xl font-black text-white dark:text-blue-300">
                                    {formatCurrency(maxAmount)}
                                </p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-blue-500/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="px-8 py-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="sm:col-span-2">
                                <label className={labelClasses}>
                                    Settlement Amount <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 dark:text-white/30 group-focus-within:text-brand-green transition-colors">₹</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={maxAmount}
                                        value={settleAmount}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const numVal = parseFloat(val);
                                            if (val === "") {
                                                setSettleAmount("");
                                            } else if (!isNaN(numVal)) {
                                                setSettleAmount(Math.min(numVal, maxAmount).toString());
                                            }
                                            setErrorMsg("");
                                        }}
                                        placeholder={`Max ${formatCurrency(maxAmount)}`}
                                        className={`${inputClasses} pl-8`}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label className={labelClasses}>
                                    Payment Method <span className="text-red-500">*</span>
                                </label>
                                <div className="p-1.5 bg-gray-50 dark:bg-white/5 rounded-2xl flex gap-1 border border-gray-100 dark:border-white/5">
                                    {paymentModes.map((mode) => (
                                        <button
                                            key={mode.value}
                                            type="button"
                                            onClick={() => {
                                                setTransactionMode(mode.value);
                                                setErrorMsg("");
                                            }}
                                            className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${transactionMode === mode.value
                                                ? "bg-brand-green text-white shadow-lg shadow-green-900/20"
                                                : "text-gray-500 dark:text-gray-400 hover:text-brand-text-light-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                                                }`}
                                        >
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label className={labelClasses}>
                                    Transaction ID / UTR <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={transactionId}
                                    onChange={(e) => {
                                        setTransactionId(e.target.value);
                                        setErrorMsg("");
                                    }}
                                    placeholder="Ref number"
                                    className={inputClasses}
                                    required
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className={labelClasses}>
                                    Settlement Date <span className="text-red-500">*</span>
                                </label>
                                <AffiliateSettlementDatePicker value={paymentDate} onChange={setPaymentDate} />
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl px-5 py-3 text-sm text-red-600 dark:text-red-400 animate-shake">
                                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span className="font-semibold text-xs">{errorMsg}</span>
                            </div>
                        )}

                        {successMsg && (
                            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-brand-green/10 border border-emerald-100 dark:border-brand-green/20 rounded-2xl px-5 py-3 text-sm text-brand-green font-bold animate-fade-in justify-center">
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-xs">{successMsg}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="px-6 py-3 text-xs font-bold text-gray-500 dark:text-white/70 hover:text-brand-text-light-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !!successMsg || maxAmount <= 0}
                                className="px-8 py-3 bg-brand-green text-white text-xs font-bold rounded-full hover:bg-brand-green/90 transition-all cursor-pointer shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                        <span>Settle Payment</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
