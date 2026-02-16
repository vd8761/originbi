"use client";

import React, { useState } from "react";

// --- Types ---
interface Referral {
    id: string;
    name: string;
    email: string;
    status: 'pending' | 'converted'; // Simplified as per request: Pending Assessment / Completed Assessment
    registeredOn: string;
    studentBoard: string;
    schoolLevel: string;
    schoolStream: string;
    commissionPercentage: number;
    totalEarnedCommission: number;
}

// --- Sub Components ---
const StatCard = ({ label, value, subtext, color }: { label: string; value: string; subtext?: string; color: string }) => (
    <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] p-8 border border-[#E0E0E0] dark:border-white/10 font-['Haskoy'] shadow-sm flex flex-col gap-3">
        <div className="flex justify-between items-start">
            <span className="text-[clamp(14px,1vw,16px)] text-[#19211C] dark:text-white font-normal">{label}</span>
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color }}>
                <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
        </div>
        <div className="flex flex-row items-baseline gap-3">
            <span className="text-[clamp(32px,2.5vw,48px)] font-medium text-[#150089] dark:text-white leading-none">{value}</span>
            {subtext && <span className="text-[clamp(12px,0.8vw,14px)] font-normal text-[#19211C] dark:text-white opacity-80">{subtext}</span>}
        </div>
    </div>
);

const statusBadge = (status: string) => {
    switch (status) {
        case 'converted':
            return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1ED36A]/10 text-[#1ED36A] border border-[#1ED36A]/20">Completed</span>;
        case 'pending':
            return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">Pending</span>;
        default:
            return null;
    }
};

// --- Main Component ---
const AffiliateReferrals: React.FC = () => {
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [copied, setCopied] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const referralLink = "https://originbi.com/ref/aff_001";

    const allReferrals: Referral[] = [
        {
            id: '1',
            name: 'Aarav Gupta',
            email: 'aarav.g@example.com',
            status: 'pending',
            registeredOn: '16 Feb 2026',
            studentBoard: 'CBSE',
            schoolLevel: 'Grade 12',
            schoolStream: 'Science (PCM)',
            commissionPercentage: 10,
            totalEarnedCommission: 0
        },
        {
            id: '2',
            name: 'Ishita Sharma',
            email: 'ishita.s@example.com',
            status: 'converted',
            registeredOn: '15 Feb 2026',
            studentBoard: 'ICSE',
            schoolLevel: 'Grade 10',
            schoolStream: 'N/A',
            commissionPercentage: 15,
            totalEarnedCommission: 1500
        },
        {
            id: '3',
            name: 'Rohan Mehta',
            email: 'rohan.m@example.com',
            status: 'pending',
            registeredOn: '14 Feb 2026',
            studentBoard: 'State Board',
            schoolLevel: 'Grade 11',
            schoolStream: 'Commerce',
            commissionPercentage: 10,
            totalEarnedCommission: 0
        },
        {
            id: '4',
            name: 'Sneha Patel',
            email: 'sneha.p@example.com',
            status: 'converted',
            registeredOn: '12 Feb 2026',
            studentBoard: 'CBSE',
            schoolLevel: 'Grade 12',
            schoolStream: 'Humanities',
            commissionPercentage: 12,
            totalEarnedCommission: 1200
        },
        {
            id: '5',
            name: 'Vivaan Singh',
            email: 'vivaan.s@example.com',
            status: 'converted',
            registeredOn: '10 Feb 2026',
            studentBoard: 'IGCSE',
            schoolLevel: 'Grade 9',
            schoolStream: 'N/A',
            commissionPercentage: 15,
            totalEarnedCommission: 2500
        },
    ];

    const filteredReferrals = allReferrals.filter(r => {
        const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
        const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const totalReferrals = allReferrals.length;
    const totalCompleted = allReferrals.filter(r => r.status === 'converted').length;
    const totalPending = allReferrals.filter(r => r.status === 'pending').length;

    // Pagination Logic
    const totalPages = Math.ceil(filteredReferrals.length / itemsPerPage);
    const paginatedReferrals = filteredReferrals.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative min-h-screen bg-transparent font-['Haskoy'] transition-colors duration-300 overflow-hidden p-4 sm:p-6 lg:p-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-[clamp(24px,2vw,36px)] font-bold text-[#150089] dark:text-white leading-tight">Referrals</h1>
                    <p className="text-[clamp(14px,1vw,16px)] text-[#19211C] dark:text-white opacity-80 mt-1 font-normal">Track and manage all your referrals</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#19211C]/40 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                        <input
                            type="text"
                            placeholder="Search referrals..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2.5 rounded-full bg-white/60 dark:bg-white/5 border border-[#E0E0E0] dark:border-white/10 text-[clamp(14px,1vw,16px)] text-[#19211C] dark:text-white placeholder:text-[#19211C]/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#1ED36A]/30 focus:border-[#1ED36A] transition-all w-[200px] sm:w-[280px] font-normal"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard label="Total Referrals" value={totalReferrals.toString()} subtext="All time" color="#150089" />
                <StatCard label="Completed Assessment" value={totalCompleted.toString()} subtext="Converted users" color="#1ED36A" />
                <StatCard label="Pending Assessment" value={totalPending.toString()} subtext="Yet to complete" color="#F59E0B" />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
                {[
                    { label: 'All', value: 'all' },
                    { label: 'Pending Assessment', value: 'pending' },
                    { label: 'Completed Assessment', value: 'converted' },
                ].map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => { setFilterStatus(tab.value); setCurrentPage(1); }}
                        className={`px-5 py-2 rounded-full text-[clamp(13px,0.9vw,15px)] font-medium transition-all ${filterStatus === tab.value
                            ? 'bg-[#150089] text-white shadow-md'
                            : 'bg-white/60 dark:bg-white/5 text-[#19211C] dark:text-white border border-[#E0E0E0] dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
                <span className="ml-2 text-[clamp(13px,1vw,15px)] text-[#19211C] dark:text-white opacity-70 font-normal">{filteredReferrals.length} results</span>
            </div>

            <div className="flex justify-end mb-4">
                <button
                    onClick={() => {
                        const headers = ["Name", "Email", "Registered On", "Student Board", "School Level", "School Stream", "Commission (%)", "Total Earned Commission"];
                        const csvContent = [
                            headers.join(","),
                            ...filteredReferrals.map(row => [
                                `"${row.name}"`,
                                row.email,
                                row.registeredOn,
                                row.studentBoard,
                                row.schoolLevel,
                                row.schoolStream,
                                `${row.commissionPercentage}%`,
                                row.totalEarnedCommission
                            ].join(","))
                        ].join("\n");

                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement("a");
                        const url = URL.createObjectURL(blob);
                        link.setAttribute("href", url);
                        link.setAttribute("download", `referrals_${new Date().toISOString().split('T')[0]}.csv`);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#1ED36A]/30 text-[#1ED36A] text-sm font-medium hover:bg-[#1ED36A]/5 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export CSV
                </button>
            </div>

            {/* Referrals Table */}
            <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] border border-[#E0E0E0] dark:border-white/10 overflow-hidden font-['Haskoy'] shadow-sm mb-8">
                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[1200px]">
                        <thead>
                            <tr className="bg-[#EAEAEA] dark:bg-white/5">
                                <th className="text-left py-3 pl-6 pr-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[12%]">Name</th>
                                <th className="text-left py-3 px-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[15%]">Email</th>
                                <th className="text-left py-3 px-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[10%]">Registered On</th>
                                <th className="text-left py-3 px-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[10%]">Student Board</th>
                                <th className="text-left py-3 px-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[10%]">School Level</th>
                                <th className="text-left py-3 px-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[12%]">School Stream</th>
                                <th className="text-center py-3 px-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[10%]">Commission (%)</th>
                                <th className="text-right py-3 pl-4 pr-6 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[15%]">Total Earned Commission</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5F5F5] dark:divide-white/5">
                            {paginatedReferrals.map((row) => (
                                <tr key={row.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="py-3.5 pl-6 pr-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-[#150089]/10 dark:bg-[#1ED36A]/10 flex items-center justify-center text-[#150089] dark:text-[#1ED36A] font-bold text-sm shrink-0">
                                                {row.name.charAt(0)}
                                            </div>
                                            <span className="font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">{row.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4 font-medium text-[clamp(13px,0.9vw,15px)] text-brand-text-light-secondary dark:text-brand-text-secondary leading-none">{row.email}</td>
                                    <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">{row.registeredOn}</td>
                                    <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">{row.studentBoard}</td>
                                    <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">{row.schoolLevel}</td>
                                    <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">{row.schoolStream}</td>
                                    <td className="py-3.5 px-4 text-center font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">{row.commissionPercentage}%</td>
                                    <td className="py-3.5 pl-4 pr-6 text-right font-semibold text-[clamp(14px,1.1vw,17px)] text-[#1ED36A] leading-none">
                                        {row.totalEarnedCommission > 0 ? `₹${row.totalEarnedCommission.toLocaleString('en-IN')}` : '—'}
                                    </td>
                                </tr>
                            ))}
                            {filteredReferrals.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-[#19211C] dark:text-white opacity-50 text-[clamp(14px,1vw,16px)]">No referrals found matching your criteria</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {filteredReferrals.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-brand-text-light-secondary dark:text-brand-text-secondary mb-8">
                    <div className="w-full sm:w-1/3 order-2 sm:order-1"></div>
                    <div className="flex justify-center w-full sm:w-1/3 order-1 sm:order-2">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 flex items-center justify-center text-[#19211C] dark:text-white hover:text-[#1ED36A] dark:hover:text-[#1ED36A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                            </button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let page = i + 1;
                                if (totalPages > 5 && currentPage > 3) {
                                    let start = Math.max(1, currentPage - 2);
                                    if (start + 4 > totalPages) start = Math.max(1, totalPages - 4);
                                    page = start + i;
                                }

                                if (page > totalPages) return null;

                                return (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`min-w-[32px] h-8 px-1 rounded-md font-medium text-sm flex items-center justify-center transition-all border cursor-pointer ${currentPage === page
                                            ? "bg-[#150089] border-[#150089] text-white shadow-md"
                                            : "bg-transparent border-[#E0E0E0] dark:border-white/10 text-[#19211C] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 flex items-center justify-center text-[#19211C] dark:text-white hover:text-[#1ED36A] dark:hover:text-[#1ED36A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                    <div className="text-center sm:text-right w-full sm:w-1/3 order-3 font-medium text-[#19211C] dark:text-white">
                        Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredReferrals.length)} of {filteredReferrals.length} referrals
                    </div>
                </div>
            )}

            {/* Referral Link Quick Banner */}
            <div className="bg-gradient-to-r from-[#150089] to-[#1ED36A] rounded-[32px] p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
                    </div>
                    <div>
                        <p className="text-white font-semibold text-[clamp(16px,1.1vw,20px)]">Share your referral link to earn more</p>
                        <p className="text-white/80 text-[clamp(14px,1vw,16px)] font-normal mt-0.5">{referralLink}</p>
                    </div>
                </div>
                <button
                    onClick={handleCopy}
                    className="px-10 py-3.5 rounded-full bg-white text-[#150089] font-semibold text-[clamp(14px,1vw,16px)] hover:bg-white/90 transition-all shadow-md shrink-0"
                >
                    {copied ? '✓ Copied!' : 'Copy Link'}
                </button>
            </div>

            {/* Footer */}
            <div className="mt-12 border-t border-gray-200 dark:border-white/5 pt-6 flex flex-col sm:flex-row justify-between text-[clamp(13px,1vw,15px)] font-medium items-center gap-4">
                <div className="flex items-center gap-4">
                    <span className="text-[#1ED36A] underline decoration-solid cursor-pointer">Privacy Policy</span>
                    <span className="h-4 w-px bg-gray-300 dark:bg-white/20"></span>
                    <span className="text-[#1ED36A] underline decoration-solid cursor-pointer">Terms &amp; Conditions</span>
                </div>
                <div className="text-[#19211C] dark:text-white">
                    © 2026 Origin BI, Made with ❤️ by <span className="text-[#1ED36A] underline decoration-solid cursor-pointer">Touchmark Descience Pvt. Ltd.</span>
                </div>
            </div>
        </div>
    );
};

export default AffiliateReferrals;
