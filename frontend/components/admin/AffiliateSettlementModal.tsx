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

    // Preview state
    const [preview, setPreview] = useState<SettlementPreview | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Safety: ensure maxAmount is a valid number
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

    // Fetch settlement preview (debounced)
    const fetchPreview = useCallback(async (amount: number) => {
        if (!affiliate?.id || amount <= 0) {
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
                // Ensure numbers are numbers
                const sanitized: SettlementPreview = {
                    ...data,
                    fullySettledCount: Number(data.fullySettledCount) || 0,
                    suggestedLower: data.suggestedLower ? Number(data.suggestedLower) : null,
                    suggestedUpper: data.suggestedUpper ? Number(data.suggestedUpper) : null,
                    transactions: (data.transactions || []).map((t: any) => ({
                        ...t,
                        amount: Number(t.amount) || 0,
                        coveredAmount: Number(t.coveredAmount) || 0,
                        remainingAmount: Number(t.remainingAmount) || 0,
                    }))
                };
                setPreview(sanitized);
            } else {
                setPreview(null);
            }
        } catch (err) {
            console.error("Preview fetch error:", err);
            setPreview(null);
        } finally {
            setPreviewLoading(false);
        }
    }, [affiliate?.id, maxAmount]);

    // Debounced amount change handler
    const handleAmountChange = (val: string) => {
        setSettleAmount(val); // Allow raw typing, validate later
        setErrorMsg("");

        if (previewTimerRef.current) clearTimeout(previewTimerRef.current);

        const numVal = parseFloat(val);
        if (!isNaN(numVal) && numVal > 0) {
            const clampedVal = Math.min(numVal, maxAmount);
            previewTimerRef.current = setTimeout(() => {
                fetchPreview(clampedVal);
            }, 300);
        } else {
            setPreview(null);
        }
    };

    // Apply suggested amount
    const applySuggestedAmount = (amount: number) => {
        const val = amount.toFixed(2);
        setSettleAmount(val);
        setErrorMsg("");
        if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
        fetchPreview(amount);
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
        if (amount > maxAmount + 0.1) {
            setErrorMsg(`Amount cannot exceed ${formatCurrency(maxAmount)}`);
            return;
        }
        if (!transactionMode) {
            setErrorMsg("Select a payment method");
            return;
        }
        if (!transactionId.trim()) {
            setErrorMsg("Enter Transaction ID");
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

            setSuccessMsg("Settled successfully!");
            setTimeout(() => onSuccess(), 1000);
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const enteredAmount = parseFloat(settleAmount) || 0;
    const showPreview = enteredAmount > 0 && preview !== null && !previewLoading;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <div
                ref={modalRef}
                className="relative w-full max-w-[500px] bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-6 border-b border-gray-100 dark:border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center">
                            <svg className="w-4 h-4 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-brand-text-light-primary dark:text-white">Settle Commission</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XIcon className="w-5 h-5" /></button>
                </div>

                <div className="overflow-y-auto custom-scrollbar flex-1 p-6 space-y-6">
                    {/* Summary */}
                    <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Available</p>
                            <p className="text-xl font-black dark:text-blue-300">{formatCurrency(maxAmount)}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => applySuggestedAmount(maxAmount)}
                            className="text-[10px] font-bold px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                        >
                            MAX
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className={labelClasses}>Settlement Amount *</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={settleAmount}
                                    onChange={(e) => handleAmountChange(e.target.value)}
                                    className={`${inputClasses} pl-8`}
                                    placeholder="Enter amount..."
                                    required
                                />
                            </div>

                            {/* PREVIEW BOX */}
                            {showPreview && preview && (
                                <div className="mt-4 space-y-4 animate-fade-in">
                                    {/* Suggestions */}
                                    {!preview.isCleanBoundary && (
                                        <div className="flex gap-2">
                                            {preview.suggestedLower !== null && (
                                                <button
                                                    type="button"
                                                    onClick={() => applySuggestedAmount(preview.suggestedLower!)}
                                                    className="flex-1 p-2 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[10px] text-amber-500 font-bold"
                                                >
                                                    Set to ₹{preview.suggestedLower.toFixed(2)}
                                                </button>
                                            )}
                                            {preview.suggestedUpper !== null && preview.suggestedUpper <= maxAmount && (
                                                <button
                                                    type="button"
                                                    onClick={() => applySuggestedAmount(preview.suggestedUpper!)}
                                                    className="flex-1 p-2 bg-brand-green/5 border border-brand-green/20 rounded-xl text-[10px] text-brand-green font-bold"
                                                >
                                                    Set to ₹{preview.suggestedUpper.toFixed(2)}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Breakdown */}
                                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 divide-y divide-gray-100 dark:divide-white/5">
                                        <div className="p-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider bg-gray-100/30 dark:bg-white/5">Breakdown</div>
                                        {preview.transactions.map((txn) => (
                                            <div key={txn.id} className="p-4 space-y-2">
                                                <div className="flex justify-between text-[11px] font-bold">
                                                    <span className="uppercase text-gray-500">{txn.studentName}</span>
                                                    <span>₹{safeToFixed(txn.amount)}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-brand-green" style={{ width: `${Math.min(100, (txn.coveredAmount / txn.amount) * 100)}%` }} />
                                                    </div>
                                                    <span className="text-[11px] font-black text-brand-green">
                                                        + ₹{safeToFixed(txn.coveredAmount)}
                                                    </span>
                                                </div>
                                                {txn.remainingAmount > 0 && (
                                                    <p className="text-[9px] font-bold text-amber-500 text-right">
                                                        PENDING: ₹{safeToFixed(txn.remainingAmount)}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className={labelClasses}>Payment Method *</label>
                            <div className="flex gap-2">
                                {["UPI_ID", "BANK_TRANSFER"].map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setTransactionMode(m)}
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-bold border transition-all ${transactionMode === m
                                                ? "bg-brand-green border-brand-green text-white"
                                                : "border-gray-100 dark:border-white/10 text-gray-500"
                                            }`}
                                    >
                                        {m.replace("_", " ")}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>Transaction ID / UTR *</label>
                            <input
                                type="text"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                className={inputClasses}
                                placeholder="Ref number..."
                                required
                            />
                        </div>

                        {errorMsg && <div className="p-3 bg-red-500/10 text-red-500 text-[11px] font-bold rounded-xl text-center">{errorMsg}</div>}
                        {successMsg && <div className="p-3 bg-brand-green/10 text-brand-green text-[11px] font-bold rounded-xl text-center">{successMsg}</div>}

                        <button
                            type="submit"
                            disabled={submitting || !!successMsg}
                            className="w-full py-4 bg-brand-green text-white text-[11px] font-black uppercase rounded-xl shadow-lg shadow-green-900/20 disabled:opacity-50"
                        >
                            {submitting ? "Processing..." : "Confirm Settlement"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
