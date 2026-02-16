"use client";

import React, { useState } from "react";
import { TrendUpIcon, TrendDownIcon } from '../icons';

// --- Types ---
interface Transaction {
    id: string;
    date: string;
    description: string;
    paymentMode: string;
    amount: number;
}

// --- Sub Components ---
const EarningStat = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
    <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] p-8 border border-[#E0E0E0] dark:border-white/10 font-['Haskoy'] shadow-sm">
        <div className="flex justify-between items-start mb-4">
            <span className="text-[clamp(14px,1vw,16px)] text-[#19211C] dark:text-white font-normal">{label}</span>
            <div className="w-10 h-10 rounded-xl bg-[#150089]/10 dark:bg-[#1ED36A]/10 flex items-center justify-center">
                {icon}
            </div>
        </div>
        <div className="flex flex-row items-baseline gap-3">
            <span className="text-[clamp(32px,2.5vw,48px)] font-medium text-[#150089] dark:text-white leading-none">{value}</span>
        </div>
    </div>
);

// --- Earnings Chart (Large version) ---
const LargeEarningsChart = () => {
    const chartData = [
        { label: 'Mar', earned: 9000, pending: 2000 },
        { label: 'Apr', earned: 11000, pending: 2500 },
        { label: 'May', earned: 10000, pending: 2200 },
        { label: 'Jun', earned: 13000, pending: 3000 },
        { label: 'Jul', earned: 14000, pending: 3100 },
        { label: 'Aug', earned: 8000, pending: 2000 },
        { label: 'Sep', earned: 12000, pending: 3000 },
        { label: 'Oct', earned: 18000, pending: 5000 },
        { label: 'Nov', earned: 15000, pending: 4000 },
        { label: 'Dec', earned: 22000, pending: 6000 },
        { label: 'Jan', earned: 28000, pending: 8000 },
        { label: 'Feb', earned: 24000, pending: 5000 },
    ];
    const max = 35000;

    return (
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] p-8 border border-[#E0E0E0] dark:border-white/10 font-['Haskoy'] shadow-sm h-full flex flex-col overflow-visible">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-[clamp(18px,1.2vw,22px)] font-semibold text-[#19211C] dark:text-white leading-none">Earnings Trend</h3>
                <div className="flex gap-4 text-[clamp(12px,0.8vw,14px)] font-medium text-[#19211C] dark:text-white">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#150089] dark:bg-white"></span> Earned</div>
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#1ED36A]"></span> Pending</div>
                </div>
            </div>

            <div className="flex-1 flex gap-4 h-[280px]">
                {/* Y Axis */}
                <div className="flex flex-col justify-between text-[#19211C] dark:text-white font-light text-[clamp(14px,1vw,17px)] pb-8 pt-2">
                    <span>35K</span><span>25K</span><span>15K</span><span>5K</span>
                </div>

                {/* Chart */}
                <div className="flex-1 flex justify-between items-end pb-1 relative">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-4">
                        {[0, 1, 2, 3].map(i => <div key={i} className="border-b border-dashed border-gray-200 dark:border-white/5 w-full h-0"></div>)}
                    </div>

                    {chartData.map((d, i) => (
                        <div key={i} className="relative flex flex-col items-center justify-end h-full gap-4 flex-1 group z-10 w-full cursor-pointer">
                            <div className="flex items-end gap-1 sm:gap-2 h-full relative justify-center w-full">
                                <div className="w-[clamp(14px,1.5vw,28px)] bg-[#150089] dark:bg-white rounded-full transition-all duration-500 hover:opacity-90 relative" style={{ height: `${(d.earned / max) * 100}%` }}>
                                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#19211C] dark:bg-white border-2 border-white dark:border-[#19211C] rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-40"></div>
                                </div>
                                <div className="w-[clamp(14px,1.5vw,28px)] bg-[#1ED36A] rounded-full transition-all duration-500 hover:opacity-90 relative" style={{ height: `${(d.pending / max) * 100}%` }}>
                                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#19211C] dark:bg-[#1ED36A] border-2 border-white dark:border-[#111111] rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-40"></div>
                                </div>

                                {/* Tooltip */}
                                <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/4 hidden group-hover:block z-50 pointer-events-none origin-bottom transition-all">
                                    <div className="relative backdrop-blur-[40px] bg-white/95 dark:bg-[#19211C]/80 border border-[#19211C]/10 dark:border-[#FFFFFF]/[0.08] rounded-2xl shadow-[0_8px_13.4px_-2px_rgba(0,0,0,0.4)] overflow-hidden min-w-[200px]">
                                        <div className="p-4 border-b border-[#19211C]/5 dark:border-white/5">
                                            <div className="font-medium text-[14px] text-[#19211C] dark:text-white leading-none whitespace-nowrap">{d.label}</div>
                                        </div>
                                        <div className="p-4 space-y-2">
                                            <div className="flex justify-between items-center text-[12px]">
                                                <span className="flex items-center gap-2 text-[#19211C] dark:text-white font-medium"><span className="w-1.5 h-1.5 rounded-full bg-[#150089] dark:bg-white"></span>Earned</span>
                                                <span className="font-medium text-[#19211C] dark:text-white">₹{d.earned.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[12px]">
                                                <span className="flex items-center gap-2 text-[#19211C] dark:text-white font-medium"><span className="w-1.5 h-1.5 rounded-full bg-[#1ED36A]"></span>Pending</span>
                                                <span className="font-medium text-[#19211C] dark:text-white">₹{d.pending.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                        <div className="px-4 py-3 bg-[#19211C] dark:bg-[#1ED36A]/20 backdrop-blur-sm border-t border-[#19211C] dark:border-white/5">
                                            <div className="text-[12px] font-medium text-white dark:text-[#1ED36A] flex justify-between items-center w-full">
                                                <span>Earned %</span>
                                                <span className="text-[#1ED36A]">{Math.round((d.earned / (d.earned + d.pending)) * 100)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute top-full left-[20%] -translate-x-1/2 border-[6px] border-transparent border-t-[#19211C] dark:border-t-[#1ED36A]/50 drop-shadow-sm"></div>
                                </div>
                            </div>
                            <span className="text-[clamp(14px,1vw,17px)] font-light text-[#19211C] dark:text-white">{d.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Transaction Status Badge ---


// --- Main Component ---
const AffiliateEarnings: React.FC = () => {
    const transactions: Transaction[] = [
        { id: '1', date: '16 Feb 2026', description: 'Commission - Pro Plan', paymentMode: 'Bank Transfer', amount: 2000 },
        { id: '2', date: '14 Feb 2026', description: 'Commission - Enterprise Plan', paymentMode: 'UPI', amount: 7500 },
        { id: '3', date: '12 Feb 2026', description: 'Bonus - 5 Referrals Milestone', paymentMode: 'Wallet', amount: 3000 },
        { id: '4', date: '10 Feb 2026', description: 'Commission - Business Plan', paymentMode: 'Bank Transfer', amount: 3500 },
        { id: '5', date: '08 Feb 2026', description: 'Commission - Enterprise Plan', paymentMode: 'UPI', amount: 5000 },
        { id: '6', date: '05 Feb 2026', description: 'Commission - Pro Plan', paymentMode: 'Wallet', amount: 4200 },
        { id: '7', date: '02 Feb 2026', description: 'Commission - Business Plan', paymentMode: 'Bank Transfer', amount: 1800 },
        { id: '8', date: '25 Jan 2026', description: 'Commission - Enterprise Plan', paymentMode: 'UPI', amount: 6000 },
    ];

    // --- Export CSV ---
    const handleExportCSV = () => {
        const headers = ["Date", "Description", "Payment Mode", "Total Amount"];
        const csvContent = [
            headers.join(","),
            ...transactions.map(txn => [
                txn.date,
                `"${txn.description}"`, // Quote description to handle commas
                txn.paymentMode,
                txn.amount
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `earnings_transactions_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="relative min-h-screen bg-transparent font-['Haskoy'] transition-colors duration-300 overflow-hidden p-4 sm:p-6 lg:p-8">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-[clamp(24px,2vw,36px)] font-bold text-[#150089] dark:text-white leading-tight">Earnings</h1>
                <p className="text-[clamp(14px,1vw,16px)] text-[#19211C] dark:text-white opacity-80 mt-1 font-normal">Track your commissions and payouts</p>
            </div>

            {/* Stats Row — Matching corporate MiniStat layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <EarningStat
                    label="Total Earned"
                    value="₹95,000"
                    icon={<svg className="w-5 h-5 text-[#150089] dark:text-[#1ED36A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
                />
                <EarningStat
                    label="Total Pending"
                    value="₹8,000"
                    icon={<svg className="w-5 h-5 text-[#150089] dark:text-[#1ED36A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                />
                <EarningStat
                    label="Total Settled"
                    value="₹67,000"
                    icon={<svg className="w-5 h-5 text-[#150089] dark:text-[#1ED36A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
            </div>

            {/* Chart */}
            <div className="mb-8">
                <LargeEarningsChart />
            </div>

            {/* Transaction History (Full Width) */}
            <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] border border-[#E0E0E0] dark:border-white/10 overflow-hidden shadow-sm h-full flex flex-col mb-8">
                <div className="flex justify-between items-center p-6">
                    <h3 className="font-semibold text-[clamp(16px,1.04vw,20px)] text-[#19211C] dark:text-white leading-none">Transaction History</h3>
                    <button
                        onClick={handleExportCSV}
                        className="font-medium text-[clamp(13px,1vw,15px)] text-[#1ED36A] cursor-pointer hover:underline bg-transparent border-none flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export CSV
                    </button>
                </div>
                <div className="w-full overflow-x-auto flex-1">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="bg-[#EAEAEA] dark:bg-white/5">
                                <th className="text-left py-3 pl-6 pr-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none">Date</th>
                                <th className="text-left py-3 px-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none">Description</th>
                                <th className="text-left py-3 px-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none">Payment Mode</th>
                                <th className="text-right py-3 pl-4 pr-6 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none">Total Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5F5F5] dark:divide-white/5">
                            {transactions.map((txn) => (
                                <tr key={txn.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="py-3.5 pl-6 pr-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">{txn.date}</td>
                                    <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">{txn.description}</td>
                                    <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">{txn.paymentMode}</td>
                                    <td className="py-3.5 pl-4 pr-6 text-right font-semibold text-[clamp(14px,1.1vw,17px)] text-[#1ED36A] leading-none">+₹{txn.amount.toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
export default AffiliateEarnings;
