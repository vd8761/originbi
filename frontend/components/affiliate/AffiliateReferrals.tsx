"use client";

import React, { useState } from "react";

// --- Types ---
interface Referral {
    id: string;
    name: string;
    email: string;
    status: 'active' | 'pending' | 'converted';
    signUpDate: string;
    commission: number;
    lastActivity: string;

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
            return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1ED36A]/10 text-[#1ED36A] border border-[#1ED36A]/20">Converted</span>;
        case 'active':
            return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">Active</span>;
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

    const referralLink = "https://originbi.com/ref/aff_001";

    const allReferrals: Referral[] = [
        { id: '1', name: 'Pinnacle HR', email: 'info@pinnaclehr.com', status: 'active', signUpDate: '16 Feb 2026', commission: 2000, lastActivity: '2 hours ago' },
        { id: '2', name: 'Nova Tech Labs', email: 'hello@novalabs.io', status: 'pending', signUpDate: '15 Feb 2026', commission: 0, lastActivity: '1 day ago' },
        { id: '3', name: 'Global Edu Services', email: 'contact@globaledu.com', status: 'converted', signUpDate: '14 Feb 2026', commission: 7500, lastActivity: '3 days ago' },
        { id: '4', name: 'StartUp Hub', email: 'team@startuphub.io', status: 'pending', signUpDate: '12 Feb 2026', commission: 0, lastActivity: '5 days ago' },
        { id: '5', name: 'Digital Academy', email: 'admin@digitala.com', status: 'active', signUpDate: '10 Feb 2026', commission: 3500, lastActivity: '1 week ago' },
        { id: '6', name: 'TechCorp Solutions', email: 'hr@techcorp.com', status: 'converted', signUpDate: '08 Feb 2026', commission: 5000, lastActivity: '1 week ago' },
        { id: '7', name: 'Bright Minds Edu', email: 'admin@brightminds.in', status: 'converted', signUpDate: '05 Feb 2026', commission: 4200, lastActivity: '2 weeks ago' },
        { id: '8', name: 'Apex Recruiters', email: 'ops@apexhr.com', status: 'active', signUpDate: '02 Feb 2026', commission: 1800, lastActivity: '2 weeks ago' },
        { id: '9', name: 'Skyline Analytics', email: 'team@skylinean.com', status: 'pending', signUpDate: '28 Jan 2026', commission: 0, lastActivity: '3 weeks ago' },
        { id: '10', name: 'CloudBridge Inc', email: 'hello@cloudbridge.io', status: 'converted', signUpDate: '25 Jan 2026', commission: 6000, lastActivity: '3 weeks ago' },
    ];

    const filteredReferrals = allReferrals.filter(r => {
        const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
        const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const totalActive = allReferrals.filter(r => r.status === 'active').length;
    const totalPending = allReferrals.filter(r => r.status === 'pending').length;
    const totalConverted = allReferrals.filter(r => r.status === 'converted').length;

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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Referrals" value={allReferrals.length.toString()} subtext="+3 this month" color="#150089" />
                <StatCard label="Active" value={totalActive.toString()} subtext="Currently subscribed" color="#0EA5E9" />
                <StatCard label="Pending" value={totalPending.toString()} subtext="Awaiting sign-up" color="#F59E0B" />
                <StatCard label="Converted" value={totalConverted.toString()} subtext="Completed purchase" color="#1ED36A" />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6">
                {[
                    { label: 'All', value: 'all' },
                    { label: 'Active', value: 'active' },
                    { label: 'Pending', value: 'pending' },
                    { label: 'Converted', value: 'converted' },
                ].map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setFilterStatus(tab.value)}
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

            {/* Referrals Table */}
            <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] border border-[#E0E0E0] dark:border-white/10 overflow-hidden font-['Haskoy'] shadow-sm mb-8">
                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="bg-[#EAEAEA] dark:bg-white/5">
                                <th className="text-left py-3 pl-6 pr-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[18%]">Organization</th>
                                <th className="text-left py-3 px-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[18%]">Email</th>
                                <th className="text-center py-3 px-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[10%]">Status</th>
                                <th className="text-left py-3 px-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[14%]">Sign-up Date</th>

                                <th className="text-left py-3 px-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[14%]">Last Activity</th>
                                <th className="text-right py-3 pl-4 pr-6 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[12%]">Commission</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5F5F5] dark:divide-white/5">
                            {filteredReferrals.map((row) => (
                                <tr key={row.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="py-3.5 pl-6 pr-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-[#150089]/10 dark:bg-[#1ED36A]/10 flex items-center justify-center text-[#150089] dark:text-[#1ED36A] font-bold text-sm shrink-0">
                                                {row.name.charAt(0)}
                                            </div>
                                            <span className="font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">{row.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">{row.email}</td>
                                    <td className="py-3.5 px-4 text-center">{statusBadge(row.status)}</td>
                                    <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">{row.signUpDate}</td>

                                    <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">{row.lastActivity}</td>
                                    <td className="py-3.5 pl-4 pr-6 text-right font-semibold text-[clamp(14px,1.1vw,17px)] text-[#1ED36A] leading-none">
                                        {row.commission > 0 ? `₹${row.commission.toLocaleString('en-IN')}` : '—'}
                                    </td>
                                </tr>
                            ))}
                            {filteredReferrals.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-[#19211C] dark:text-white opacity-50 text-[clamp(14px,1vw,16px)]">No referrals found matching your criteria</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
