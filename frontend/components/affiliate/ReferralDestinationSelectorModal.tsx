"use client";

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import {
    AFFILIATE_REFERRAL_DESTINATIONS,
    AffiliateReferralAudience,
} from "../../lib/affiliateReferralLinks";

interface ReferralDestinationSelectorModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (audience: AffiliateReferralAudience) => void;
    selectedAudience: AffiliateReferralAudience;
    actionLabel: string;
    busy?: boolean;
}

const ReferralDestinationSelectorModal: React.FC<ReferralDestinationSelectorModalProps> = ({
    open,
    onClose,
    onSelect,
    selectedAudience,
    actionLabel,
    busy = false,
}) => {
    const [pendingAudience, setPendingAudience] = useState<AffiliateReferralAudience>(selectedAudience);

    useEffect(() => {
        if (open) {
            setPendingAudience(selectedAudience);
        }
    }, [open, selectedAudience]);

    if (!open || typeof document === "undefined") {
        return null;
    }

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
            <div
                className="relative bg-white dark:bg-[#1a1a2e] rounded-[28px] shadow-2xl max-w-md w-full p-6 border border-white/10"
                onClick={(event) => event.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    disabled={busy}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white dark:bg-[#2a2a40] shadow border border-gray-100 dark:border-white/10 flex items-center justify-center text-[#19211C] dark:text-white hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="mb-5 pr-10">
                    <h3 className="font-['Haskoy'] font-bold text-lg text-[#150089] dark:text-white">Choose Destination</h3>
                    <p className="text-sm text-[#19211C]/65 dark:text-white/60 mt-1">
                        Select your audience, then click {actionLabel.toLowerCase()}.
                    </p>
                </div>

                <div className="space-y-3">
                    {AFFILIATE_REFERRAL_DESTINATIONS.map((destination) => {
                        const isSelected = destination.key === pendingAudience;

                        return (
                            <button
                                key={destination.key}
                                onClick={() => setPendingAudience(destination.key)}
                                disabled={busy}
                                className={`w-full text-left px-4 py-3 rounded-2xl border transition-all ${isSelected
                                    ? "border-[#1ED36A] bg-[#1ED36A]/10"
                                    : "border-[#E0E0E0] dark:border-white/10 bg-white dark:bg-white/5 hover:border-[#1ED36A]/60"
                                    } disabled:opacity-50`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-[#19211C] dark:text-white">{destination.label}</p>
                                        <p className="text-xs text-[#19211C]/60 dark:text-white/60">{destination.description}</p>
                                    </div>
                                    {isSelected && (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#1ED36A] text-white text-xs font-semibold">
                                            Selected
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-5 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={busy}
                        className="px-4 py-2.5 rounded-xl border border-[#E0E0E0] dark:border-white/15 text-[#19211C] dark:text-white font-medium hover:bg-[#F6F7FA] dark:hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSelect(pendingAudience)}
                        disabled={busy}
                        className="px-5 py-2.5 rounded-xl bg-[#1ED36A] text-white font-semibold hover:bg-[#16b058] transition-all disabled:opacity-50"
                    >
                        {actionLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ReferralDestinationSelectorModal;
