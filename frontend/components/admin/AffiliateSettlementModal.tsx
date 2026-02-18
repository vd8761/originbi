"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { XIcon } from '../icons';

const API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "";

/* ==================== Types ==================== */

interface SettlementPreview {
    fullySettledCount: number;
    isCleanBoundary: boolean;
    transactions: Array<{
        id: number;
        studentName: string;
        amount: number;
        coveredAmount: number;
        remainingAmount: number;
        status: 'fully_settled' | 'partial' | 'not_settled';
    }>;
    suggestedLower: number | null;
    suggestedUpper: number | null;
}

/* ==================== Settlement Modal ==================== */

interface AffiliateSettlementModalProps {
    affiliate: any;
    onClose: () => void;
    onSuccess: () => void;
}

export const AffiliateSettlementModal: React.FC<AffiliateSettlementModalProps> = ({ affiliate, onClose, onSuccess }) => {
    if (!affiliate) return null;

    const modalRef = useRef<HTMLDivElement>(null);
    const [settleAmount, setSettleAmount] = useState("");
    const [transactionMode, setTransactionMode] = useState("");
    const [transactionId, setTransactionId] = useState("");
    const [paymentDate, setPaymentDate] = useState(() => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    });

    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const [preview, setPreview] = useState<SettlementPreview | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const maxAmount = parseFloat(affiliate?.ready_to_process_commission) || 0;

    const formatCurrency = (amount: any) => {
        const num = parseFloat(amount) || 0;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2,
        }).format(num);
    };

    const safeToFixed = (val: any) => {
        const num = parseFloat(val);
        return isNaN(num) ? "0.00" : num.toFixed(2);
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

    const fetchPreview = useCallback(async (amount: number) => {
        if (!affiliate?.id || isNaN(amount) || amount <= 0) {
            setPreview(null);
            return;
        }

        setPreviewLoading(true);
        try {
            const res = await fetch(
                `${API_BASE}/admin/affiliates/${affiliate.id}/settle-preview?amount=${amount}`
            );
            if (res.ok) {
                const data = await res.json();
                if (!data) return;
                const sanitized: SettlementPreview = {
                    fullySettledCount: Number(data.fullySettledCount) || 0,
                    isCleanBoundary: !!data.isCleanBoundary,
                    suggestedLower: data.suggestedLower ? Number(data.suggestedLower) : null,
                    suggestedUpper: data.suggestedUpper ? Number(data.suggestedUpper) : null,
                    transactions: Array.isArray(data.transactions) ? data.transactions.map((t: any) => ({
                        id: Number(t.id) || 0,
                        studentName: String(t.studentName || 'Unknown'),
                        amount: Number(t.amount) || 0,
                        coveredAmount: Number(t.coveredAmount) || 0,
                        remainingAmount: Number(t.remainingAmount) || 0,
                        status: t.status || 'not_settled'
                    })) : []
                };
                setPreview(sanitized);
            } else {
                setPreview(null);
            }
        } catch (err) {
            setPreview(null);
        } finally {
            setPreviewLoading(false);
        }
    }, [affiliate?.id]);

    const handleAmountChange = (val: string) => {
        const numVal = parseFloat(val);
        if (val === "") {
            setSettleAmount("");
            setPreview(null);
        } else if (!isNaN(numVal)) {
            const clamped = Math.min(numVal, maxAmount);
            setSettleAmount(clamped.toString());

            if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
            previewTimerRef.current = setTimeout(() => {
                fetchPreview(clamped);
            }, 300);
        }
        setErrorMsg("");
    };

    const applySuggestedAmount = (amount: number) => {
        const clamped = Math.min(amount, maxAmount);
        setSettleAmount(clamped.toFixed(2));
        setErrorMsg("");
        if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
        fetchPreview(clamped);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        const amount = parseFloat(settleAmount);
        if (isNaN(amount) || amount <= 0) {
            setErrorMsg("Please enter a valid amount");
            return;
        }
        if (!transactionMode) {
            setErrorMsg("Please select a payment method");
            return;
        }
        if (!transactionId.trim()) {
            setErrorMsg("Please enter a transaction ID");
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
                throw new Error(errData.message || "Settlement failed");
            }

            setSuccessMsg("Settlement completed successfully!");
            setTimeout(() => onSuccess(), 1200);
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const paymentModes = [
        { value: "UPI_ID", label: "UPI ID" },
        { value: "UPI_NUMBER", label: "UPI Number" },
        { value: "BANK_TRANSFER", label: "Bank Transfer" },
    ];

    const inputClasses = "w-full h-11 bg-gray-50 dark:bg-white/10 border border-transparent dark:border-transparent rounded-xl px-4 text-sm text-brand-text-light-primary dark:text-white placeholder-black/40 dark:placeholder-white/60 focus:border-brand-green focus:outline-none transition-all";
    const labelClasses = "text-xs text-black/70 dark:text-white font-semibold ml-1 mb-1.5 block";

    const enteredAmount = parseFloat(settleAmount) || 0;
    const showPreview = enteredAmount > 0 && preview !== null && !previewLoading;

    // FIND THE PARTIAL TRANSACTION (if any)
    const partialTxn = preview?.transactions.find(t => t.status === 'partial');

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <div
                ref={modalRef}
                className="relative w-full max-w-[460px] bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]"
            >
                {/* Header - More Compact */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-green/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-brand-text-light-primary dark:text-white leading-tight">Settle Commission</h3>
                            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mt-0.5">{affiliate.name}</span>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={submitting} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all text-gray-400 hover:text-gray-600 disabled:opacity-50">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="overflow-y-auto custom-scrollbar flex-1 px-6 py-5">
                    {/* Ready Balance - More Compact */}
                    <div className="bg-[#1A56DB] dark:bg-blue-600/20 border border-blue-500/20 rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-blue-100 dark:text-blue-400">Ready for Payment</p>
                            <p className="text-lg font-black text-white dark:text-blue-300 leading-tight">{formatCurrency(maxAmount)}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => applySuggestedAmount(maxAmount)}
                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold rounded-lg border border-white/20 transition-all"
                        >
                            Maximize
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                        {/* Amount Input */}
                        <div>
                            <label className={labelClasses}>Settlement Amount *</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 group-focus-within:text-brand-green transition-colors">₹</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    max={maxAmount}
                                    value={settleAmount}
                                    onChange={(e) => handleAmountChange(e.target.value)}
                                    placeholder={`Max ${formatCurrency(maxAmount)}`}
                                    className={`${inputClasses} pl-8 font-bold`}
                                    required
                                />
                            </div>

                            {/* Dynamic Message Box - More Compact */}
                            {showPreview && preview && (
                                <div className="mt-3 animate-fade-in space-y-2.5">
                                    <div className="p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl">
                                        <p className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                                            {preview.fullySettledCount > 0 ? (
                                                <>
                                                    Settling <span className="text-brand-green font-black">{preview.fullySettledCount} referral{preview.fullySettledCount !== 1 ? 's' : ''}</span> fully.
                                                </>
                                            ) : (
                                                "Payment doesn't cover a full referral yet."
                                            )}
                                        </p>

                                        {partialTxn && (
                                            <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-white/5">
                                                <div className="flex justify-between items-center text-[10px] font-bold mb-1.5">
                                                    <span className="text-gray-400">Next referral:</span>
                                                    <span className="text-amber-500">₹{safeToFixed(partialTxn.coveredAmount)} Paid</span>
                                                </div>
                                                <div className="w-full h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-amber-500" style={{ width: `${(partialTxn.coveredAmount / partialTxn.amount) * 100}%` }} />
                                                </div>
                                                <p className="text-[9px] font-bold text-amber-500 mt-1 text-right italic">
                                                    ₹{safeToFixed(partialTxn.remainingAmount)} balance left locally
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Shortcuts - Smaller */}
                                    {!preview.isCleanBoundary && (
                                        <div className="flex gap-2">
                                            {preview.suggestedLower !== null && (
                                                <button type="button" onClick={() => applySuggestedAmount(preview.suggestedLower!)} className="flex-1 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg text-[10px] font-bold text-amber-600 hover:scale-[0.98] transition-all">
                                                    Set to ₹{safeToFixed(preview.suggestedLower)} (Full)
                                                </button>
                                            )}
                                            {preview.suggestedUpper !== null && preview.suggestedUpper <= maxAmount && (
                                                <button type="button" onClick={() => applySuggestedAmount(preview.suggestedUpper!)} className="flex-1 py-1.5 bg-emerald-50 dark:bg-brand-green/10 border border-emerald-200 dark:border-brand-green/20 rounded-lg text-[10px] font-bold text-brand-green hover:scale-[0.98] transition-all">
                                                    Set to ₹{safeToFixed(preview.suggestedUpper)} (+1)
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Payment Toggle - More Compact */}
                        <div>
                            <label className={labelClasses}>Payment Method *</label>
                            <div className="p-1 bg-gray-100/50 dark:bg-white/5 rounded-xl flex gap-1 border border-gray-100 dark:border-white/5">
                                {paymentModes.map((mode) => (
                                    <button
                                        key={mode.value}
                                        type="button"
                                        onClick={() => setTransactionMode(mode.value)}
                                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold transition-all ${transactionMode === mode.value
                                            ? "bg-brand-green text-white shadow-md shadow-green-900/10"
                                            : "text-gray-500 hover:text-brand-text-light-primary dark:hover:text-white"
                                            }`}
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ID Input */}
                        <div>
                            <label className={labelClasses}>Transaction ID / UTR *</label>
                            <input
                                type="text"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                placeholder="Reference number"
                                className={inputClasses}
                                required
                            />
                        </div>

                        {errorMsg && (
                            <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/10 rounded-xl py-2.5 text-[10px] text-red-600 dark:text-red-400 font-bold text-center">
                                {errorMsg}
                            </div>
                        )}

                        {successMsg && (
                            <div className="bg-emerald-50 dark:bg-brand-green/10 border border-emerald-100 dark:border-brand-green/10 rounded-xl py-2.5 text-[10px] text-brand-green font-bold text-center">
                                {successMsg}
                            </div>
                        )}

                        {/* Footer - More Compact */}
                        <div className="flex items-center justify-end gap-5 pt-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="text-[11px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !!successMsg || maxAmount <= 0}
                                className="px-8 py-2.5 bg-brand-green text-white text-[11px] font-bold rounded-full hover:bg-brand-green/90 transition-all shadow-lg shadow-green-900/10 disabled:opacity-50"
                            >
                                {submitting ? "Processing..." : "Settle Payment"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
