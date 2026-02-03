import { CorporateAccount, CorporateCreditLedger } from '@/lib/types';
import { corporateRegistrationService } from '@/lib/services';
import React, { useEffect, useState } from 'react';
import TopUpModal from './TopUpModal';

import Link from 'next/link';

interface ExtendedCorporateAccount extends Omit<CorporateAccount, 'is_active' | 'is_blocked'> {
    full_name?: string;
    email?: string;
    is_active?: boolean; // Make optional or match type
    is_blocked?: boolean;
}

interface CorporateDetailsViewProps {
    data: ExtendedCorporateAccount;
    onBack: () => void;
}

const CorporateDetailsView: React.FC<CorporateDetailsViewProps> = ({ data: initialData, onBack }) => {
    const [data, setData] = useState(initialData);
    const [ledger, setLedger] = useState<CorporateCreditLedger[]>([]);
    const [loadingLedger, setLoadingLedger] = useState(false);
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Server-side pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const itemsPerPage = 10;

    useEffect(() => {
        if (data.id) {
            fetchLedger(currentPage);
        }
    }, [data.id, currentPage]);

    const fetchLedger = async (page: number) => {
        setLoadingLedger(true);
        try {
            const res = await corporateRegistrationService.getLedger(data.id, page, itemsPerPage);
            setLedger(res.data);
            setTotalEntries(res.total);
        } catch (err) {
            console.error("Failed to fetch ledger", err);
        } finally {
            setLoadingLedger(false);
        }
    };

    const handleTopUp = async (amount: number, reasonStr: string) => {
        setSubmitting(true);
        try {
            const res = await corporateRegistrationService.topUpCredits(data.id, amount, reasonStr);
            // res returns { success, newAvailable, newTotal }
            // Update local state
            setData(prev => ({
                ...prev,
                available_credits: res.newAvailable,
                total_credits: res.newTotal
            }));
            // Refresh ledger (reset to page 1 to see new entry)
            setCurrentPage(1);
            fetchLedger(1);
            setIsTopUpOpen(false);
        } catch (err) {
            console.error("Top up failed", err);
            alert("Failed to add credits");
        } finally {
            setSubmitting(false);
        }
    };

    // Pagination calculations
    const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
    // Client-side slicing not needed anymore since we get paginated data
    const paginatedLedger = ledger; // Just use ledger directly

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-brand-light-tertiary dark:border-brand-dark-tertiary">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
                        <Link href="/admin/dashboard" className="hover:underline hover:text-brand-green transition-colors">
                            Dashboard
                        </Link>
                        <span className="mx-2 text-gray-400 dark:text-gray-600">
                            {/* Simple chevron right SVG */}
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </span>
                        <button
                            onClick={onBack}
                            className="hover:underline hover:text-brand-green transition-colors focus:outline-none"
                        >
                            Corporate Access
                        </button>
                        <span className="mx-2 text-gray-400 dark:text-gray-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </span>
                        <span className="text-brand-green font-semibold">Preview</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-brand-light-secondary dark:hover:bg-brand-dark-secondary rounded-lg transition-colors"
                            title="Back to List"
                        >
                            <svg className="w-5 h-5 text-brand-text-light-secondary dark:text-brand-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h2 className="text-2xl font-bold text-brand-text-light-primary dark:text-white">
                            Corporate Registration Preview
                        </h2>
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${data.is_active
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                        {data.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    {data.is_blocked && (
                        <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                            BANNED
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Avatar & Quick Info */}
                <div className="lg:col-span-1">
                    <div className="bg-brand-light-primary dark:bg-brand-dark-primary p-6 rounded-xl border border-brand-light-tertiary dark:border-brand-dark-tertiary flex flex-col items-center text-center h-full">
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name || 'User')}&background=random&size=128`}
                            alt="Profile"
                            className="w-32 h-32 rounded-full mb-4 border-4 border-brand-light-tertiary dark:border-brand-dark-tertiary"
                        />
                        <h3 className="text-xl font-bold text-brand-text-light-primary dark:text-white mb-1">
                            {data.full_name}
                        </h3>
                        <p className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary mb-4">
                            {data.job_title || 'No Job Title'}
                        </p>

                        <div className="w-full pt-4 border-t border-brand-light-tertiary dark:border-brand-dark-tertiary grid grid-cols-2 gap-4 mt-auto">
                            <div className="text-center">
                                <p className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary mb-1">Credits</p>
                                <p className="text-lg font-bold text-brand-green">{data.available_credits ?? 0}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary mb-1">Total Allocated</p>
                                <p className="text-lg font-bold text-brand-text-light-primary dark:text-white">{data.total_credits ?? 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Combined Details */}
                <div className="lg:col-span-2">
                    <div className="bg-brand-light-primary dark:bg-brand-dark-primary p-6 rounded-xl border border-brand-light-tertiary dark:border-brand-dark-tertiary h-full">
                        <h4 className="text-lg font-semibold text-brand-text-light-primary dark:text-white mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Registration Details
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <DetailItem label="Company Name" value={data.company_name} />
                            <DetailItem label="Sector" value={data.sector_code} />
                            <DetailItem label="Employee Ref / Code" value={data.employee_ref_id} />
                            <DetailItem label="Job Title" value={data.job_title} />
                            <DetailItem label="Gender" value={data.gender} />
                            <DetailItem label="Email Address" value={data.email} />
                            <DetailItem label="Mobile Number" value={`${data.country_code} ${data.mobile_number}`} />
                            {data.linkedin_url && (
                                <div className="md:col-span-2">
                                    <label className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary block mb-1 font-medium uppercase tracking-wide opacity-70">LinkedIn Profile</label>
                                    <a href={data.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-500 hover:underline break-all">
                                        {data.linkedin_url}
                                    </a>
                                </div>
                            )}

                            <div className="md:col-span-2">
                                <label className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary block mb-1 font-medium uppercase tracking-wide opacity-70">Business Locations</label>
                                <div className="flex flex-wrap gap-2">
                                    {data.business_locations?.split(',').map((loc, idx) => (
                                        <span key={idx} className="px-3 py-1 rounded-md bg-brand-light-secondary dark:bg-brand-dark-secondary text-xs text-brand-text-light-primary dark:text-white border border-brand-light-tertiary dark:border-brand-dark-tertiary">
                                            {loc.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Credit Ledger Section */}
            <div className="bg-brand-light-primary dark:bg-brand-dark-primary p-6 rounded-xl border border-brand-light-tertiary dark:border-brand-dark-tertiary">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xl font-semibold text-brand-text-light-primary dark:text-white">
                        Credit/Debit Ledger
                    </h4>
                    <button
                        onClick={() => setIsTopUpOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] hover:bg-[#2d3a52] text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <span>+ Top-up Credit</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-brand-light-secondary dark:bg-[#2a2a2a] text-xs uppercase text-brand-text-light-secondary dark:text-brand-text-secondary font-semibold">
                                <th className="p-4 rounded-tl-lg">SI No</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Remarks</th>
                                <th className="p-4">Count</th>
                                <th className="p-4 rounded-tr-lg">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-light-tertiary dark:divide-gray-800 text-sm">
                            {loadingLedger ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">Loading history...</td>
                                </tr>
                            ) : ledger.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">No data available in table</td>
                                </tr>
                            ) : (
                                paginatedLedger.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-brand-light-secondary/50 dark:hover:bg-[#2a2a2a]/50">
                                        <td className="p-4 text-brand-text-light-primary dark:text-white">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${item.ledger_type === 'CREDIT' || (!item.ledger_type && item.credit_delta > 0)
                                                ? 'bg-green-500/10 text-green-500'
                                                : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                {item.ledger_type || (item.credit_delta > 0 ? 'CREDIT' : 'DEBIT')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-brand-text-light-secondary dark:text-brand-text-secondary max-w-xs truncate" title={item.reason}>
                                            {item.reason || '-'}
                                        </td>
                                        <td className="p-4 font-mono font-medium text-brand-text-light-primary dark:text-white">
                                            {Math.abs(item.credit_delta)}
                                        </td>
                                        <td className="p-4 text-brand-text-light-secondary dark:text-brand-text-secondary">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalEntries > itemsPerPage && (
                    <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                        <span>Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} entries</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 rounded bg-gray-100 dark:bg-[#333] disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-[#444]"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 rounded bg-gray-100 dark:bg-[#333] disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-[#444]"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <TopUpModal
                isOpen={isTopUpOpen}
                onClose={() => setIsTopUpOpen(false)}
                onSubmit={(amount, reason) => handleTopUp(amount, reason)}
                loading={submitting}
            />
        </div>
    );
};

const DetailItem = ({ label, value }: { label: string, value?: string | number }) => (
    <div>
        <label className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary block mb-1 font-medium uppercase tracking-wide opacity-70">
            {label}
        </label>
        <p className="text-base font-medium text-brand-text-light-primary dark:text-white">
            {value || '-'}
        </p>
    </div>
);

export default CorporateDetailsView;
