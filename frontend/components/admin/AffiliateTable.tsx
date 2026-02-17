"use client";

import React, { useState, useEffect, useRef } from "react";
import { EyeVisibleIcon, XIcon, EditIcon } from '../icons';
import { COUNTRY_CODES } from '../../lib/countryCodes';

const getCountryInfo = (dial: string | undefined) => {
    const finalDial = dial || "+91";
    return (
        COUNTRY_CODES.find((c) => c.dial_code === finalDial) ?? {
            code: "IN",
            dial_code: "+91",
            flag: "🇮�",
            name: "India",
            maxLength: 10,
        }
    );
};

interface AffiliateTableProps {
    affiliates: any[];
    loading: boolean;
    error: string | null;
    onEdit?: (affiliate: any) => void;
    onView?: (affiliate: any) => void;
}

const REFERRAL_BASE_URL = (process.env.NEXT_PUBLIC_REFERAL_BASE_URL || "") + "?ref=";

// QR Code generator using Google Charts API (no dependency needed)
const getQrCodeUrl = (data: string, size: number = 200) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&bgcolor=ffffff&color=000000&margin=8`;
};

const AffiliateTable: React.FC<AffiliateTableProps> = ({
    affiliates,
    loading,
    error,
    onEdit,
    onView,
}) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedAffiliate, setSelectedAffiliate] = useState<any | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);
    const [shareToast, setShareToast] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    const formatCurrency = (amount: any) => {
        const num = parseFloat(amount) || 0;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(num);
    };

    const openReferralModal = (affiliate: any) => {
        setSelectedAffiliate(affiliate);
        setModalOpen(true);
        setLinkCopied(false);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedAffiliate(null);
        setLinkCopied(false);
    };

    const copyReferralLink = async (link: string) => {
        try {
            await navigator.clipboard.writeText(link);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2500);
        } catch {
            const textarea = document.createElement("textarea");
            textarea.value = link;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2500);
        }
    };

    const downloadQrCode = async (affiliate: any) => {
        const link = `${REFERRAL_BASE_URL}${affiliate.referral_code}`;
        const qrUrl = getQrCodeUrl(link, 400);
        try {
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `referral-qr-${affiliate.referral_code}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            window.open(qrUrl, "_blank");
        }
    };

    const shareReferralLink = async (affiliate: any) => {
        const link = `${REFERRAL_BASE_URL}${affiliate.referral_code}`;
        const shareData = {
            title: `Referral Link - ${affiliate.name}`,
            text: `Register using ${affiliate.name}'s referral link:`,
            url: link,
        };

        try {
            if (navigator.share && navigator.canShare?.(shareData)) {
                await navigator.share(shareData);
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(link);
                setShareToast(true);
                setTimeout(() => setShareToast(false), 2500);
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                try {
                    await navigator.clipboard.writeText(link);
                    setShareToast(true);
                    setTimeout(() => setShareToast(false), 2500);
                } catch {
                    const textarea = document.createElement("textarea");
                    textarea.value = link;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand("copy");
                    document.body.removeChild(textarea);
                    setShareToast(true);
                    setTimeout(() => setShareToast(false), 2500);
                }
            }
        }
    };

    // Close modal on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                closeModal();
            }
        };
        if (modalOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.body.style.overflow = "";
        };
    }, [modalOpen]);

    // Close modal on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeModal();
        };
        if (modalOpen) document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [modalOpen]);

    const referralLink = selectedAffiliate
        ? `${REFERRAL_BASE_URL}${selectedAffiliate.referral_code}`
        : "";

    return (
        <>
            {/* Share toast notification */}
            {shareToast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-fade-in">
                    <div className="bg-brand-green text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg shadow-brand-green/30 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        Referral link copied!
                    </div>
                </div>
            )}
            <div className="w-[calc(100%+2px)] -ml-px h-full flex flex-col rounded-xl border border-brand-light-tertiary dark:border-white/10 bg-white dark:bg-[#19211C]/90 backdrop-blur-sm shadow-xl relative transition-all duration-300 overflow-hidden">
                {loading && affiliates.length > 0 && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center backdrop-blur-sm rounded-xl">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
                    </div>
                )}

                <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                    <table className="w-full border-collapse relative">
                        <thead className="sticky top-0 z-20 bg-[#19211C]/4 dark:bg-[#FFFFFF1F] shadow-sm">
                            <tr className="text-left">
                                <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider">
                                    Name
                                </th>
                                <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider">
                                    Mobile
                                </th>
                                <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider">
                                    Commission %
                                </th>
                                <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider">
                                    Total Referrals
                                </th>
                                <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider">
                                    Total Earned
                                </th>
                                <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider">
                                    Total Settled
                                </th>
                                <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider">
                                    Ready to Payment
                                </th>
                                <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider">
                                    Total Pending
                                </th>
                                <th className="p-4 text-xs font-normal text-[#19211C] dark:text-brand-text-secondary tracking-wider text-right">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-light-tertiary dark:divide-brand-dark-tertiary">
                            {loading && affiliates.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse bg-white dark:bg-transparent border-b border-brand-light-tertiary dark:border-white/5">
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                        <td className="p-4 align-middle"><div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                        <td className="p-4 align-middle"><div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                        <td className="p-4 align-middle"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                        <td className="p-4 align-middle"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                        <td className="p-4 align-middle"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                        <td className="p-4 align-middle"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                        <td className="p-4 text-right align-middle"><div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : affiliates.length > 0 ? (
                                affiliates.map((affiliate, index) => (
                                    <tr
                                        key={affiliate.id || index}
                                        className="bg-white dark:bg-transparent border-b border-brand-light-tertiary dark:border-white/5 hover:bg-brand-light-secondary dark:hover:bg-white/5 transition-colors"
                                    >
                                        {/* Name */}
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(affiliate.name || 'User')}&background=random`}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full object-cover border border-brand-light-tertiary dark:border-brand-dark-tertiary"
                                                />
                                                <span className="text-sm font-medium text-brand-text-light-primary dark:text-white">
                                                    {affiliate.name || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        {/* Mobile */}
                                        <td className="p-4 text-sm text-brand-text-light-primary dark:text-white align-middle">
                                            <div className="flex items-center gap-2">
                                                {(() => {
                                                    const info = getCountryInfo(affiliate.country_code);

                                                    return (
                                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-light-secondary dark:bg-[#24272B] border border-brand-light-tertiary/60 dark:border-brand-dark-tertiary/60">
                                                            {/* Flag */}
                                                            {info ? (
                                                                <img
                                                                    src={`https://flagcdn.com/w40/${info.code.toLowerCase()}.png`}
                                                                    srcSet={`https://flagcdn.com/w80/${info.code.toLowerCase()}.png 2x`}
                                                                    width={20}
                                                                    height={14}
                                                                    alt={info.name}
                                                                    className="rounded-[2px] object-cover w-5 h-3.5 xs:w-5 xs:h-3.5 sm:w-5 sm:h-3.5 shrink-0"
                                                                />
                                                            ) : (
                                                                <span className="text-xs">🌐</span>
                                                            )}

                                                            {/* Dial code */}
                                                            <span className="text-[14px] text-gray-600 dark:text-gray-300">
                                                                {info?.dial_code ?? affiliate.country_code}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Phone number */}
                                                <span>{affiliate.mobile_number}</span>
                                            </div>
                                        </td>
                                        {/* Commission % */}
                                        <td className="p-4 text-sm text-brand-text-light-primary dark:text-white align-middle font-semibold">
                                            {affiliate.commission_percentage}%
                                        </td>
                                        {/* Total Referrals */}
                                        <td className="p-4 text-sm text-brand-text-light-primary dark:text-white align-middle font-semibold">
                                            {affiliate.referral_count || 0}
                                        </td>
                                        {/* Total Earned */}
                                        <td className="p-4 text-sm align-middle">
                                            <span className="font-medium text-brand-green">
                                                {formatCurrency(affiliate.total_earned_commission)}
                                            </span>
                                        </td>
                                        {/* Total Settled */}
                                        <td className="p-4 text-sm align-middle">
                                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(affiliate.total_settled_commission)}
                                            </span>
                                        </td>
                                        {/* Ready to Payment */}
                                        <td className="p-4 text-sm align-middle">
                                            <span className="font-medium text-blue-600 dark:text-blue-400">
                                                {formatCurrency(affiliate.ready_to_process_commission)}
                                            </span>
                                        </td>
                                        {/* Total Pending */}
                                        <td className="p-4 text-sm align-middle">
                                            <span className="font-medium text-amber-600 dark:text-amber-400">
                                                {formatCurrency(affiliate.total_pending_commission)}
                                            </span>
                                        </td>
                                        {/* Action */}
                                        <td className="p-4 text-right align-middle">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => shareReferralLink(affiliate)}
                                                    className="p-2 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors cursor-pointer"
                                                    title="Share referral link"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => onEdit?.(affiliate)}
                                                    className="p-2 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors cursor-pointer"
                                                    title="Edit Affiliate"
                                                >
                                                    <EditIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onView?.(affiliate)}
                                                    className="p-2 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors cursor-pointer"
                                                    title="View Details"
                                                >
                                                    <EyeVisibleIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="p-8 text-center text-brand-text-light-secondary dark:text-gray-500"
                                    >
                                        No affiliates found.
                                        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Referral Link & QR Code Modal */}
            {modalOpen && selectedAffiliate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    {/* Modal Content */}
                    <div
                        ref={modalRef}
                        className="relative w-full max-w-md bg-white dark:bg-[#1A1F23] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl dark:shadow-black/50 overflow-hidden animate-fade-in"
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
                            <div>
                                <h3 className="text-lg font-semibold text-brand-text-light-primary dark:text-white">
                                    Referral Link
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {selectedAffiliate.name} &bull; {selectedAffiliate.referral_code}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-gray-500 dark:text-gray-400"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* QR Code Section */}
                        <div className="px-6 py-6 flex flex-col items-center">
                            <div className="bg-white rounded-2xl p-4 shadow-inner border border-gray-100 mb-4">
                                <img
                                    src={getQrCodeUrl(referralLink, 200)}
                                    alt={`QR Code for ${selectedAffiliate.referral_code}`}
                                    className="w-[200px] h-[200px]"
                                    loading="eager"
                                />
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
                                Scan this QR to open the referral registration page
                            </p>

                            {/* Referral Link with Copy */}
                            <div className="w-full bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-3">
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                                        Referral Link
                                    </label>
                                    <button
                                        onClick={() => copyReferralLink(referralLink)}
                                        className={`flex items-center gap-1.5 transition-all cursor-pointer text-[11px] font-bold ${linkCopied
                                            ? "text-brand-green"
                                            : "text-brand-green hover:text-brand-green/80"
                                            }`}
                                    >
                                        {linkCopied ? (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                </svg>
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                </svg>
                                                Copy
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="bg-white dark:bg-white/10 rounded-lg px-3 py-2.5 border border-gray-100 dark:border-white/10">
                                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate select-all font-mono">
                                        {referralLink}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                            <button
                                onClick={() => downloadQrCode(selectedAffiliate)}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-brand-text-light-primary dark:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download QR
                            </button>
                            <button
                                onClick={closeModal}
                                className="px-6 py-2 bg-brand-green text-white text-xs font-semibold rounded-lg hover:bg-brand-green/90 transition-colors cursor-pointer shadow-md shadow-brand-green/20"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AffiliateTable;
