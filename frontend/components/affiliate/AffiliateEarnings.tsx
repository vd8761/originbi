"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";

// --- Types ---
interface Transaction {
    id: string;
    date: string;
    description: string;
    paymentMode: string;
    amount: number;
    type: string;
    status: string;
}

interface EarningsStats {
    totalEarned: number;
    totalPending: number;
    totalSettled: number;
}

interface ChartDataPoint {
    label: string;
    earned: number;
    pending: number;
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

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// --- Earnings Chart ---
const LargeEarningsChart = ({ chartData }: { chartData: ChartDataPoint[] }) => {

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 dark:bg-[#19211C]/90 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-lg">
                    <p className="text-sm font-semibold mb-2 text-[#19211C] dark:text-white">{label}</p>
                    <div className="space-y-1">
                        <p className="text-xs text-[#150089] dark:text-blue-300">
                            Earned: ₹{payload[0].value.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-[#1ED36A]">
                            Pending: ₹{payload[1].value.toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] p-8 border border-[#E0E0E0] dark:border-white/10 font-['Haskoy'] shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-[clamp(18px,1.2vw,22px)] font-semibold text-[#19211C] dark:text-white leading-none">Earnings Trend</h3>
                <div className="flex gap-4 text-[clamp(12px,0.8vw,14px)] font-medium text-[#19211C] dark:text-white">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#150089]"></span> Earned</div>
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#1ED36A]"></span> Pending</div>
                </div>
            </div>

            <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={4} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#888', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#888', fontSize: 12 }}
                            tickFormatter={(value) => `₹${value >= 1000 ? value / 1000 + 'k' : value}`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar
                            dataKey="earned"
                            fill="#150089"
                            radius={[4, 4, 0, 0]}
                            barSize={28}
                        />
                        <Bar
                            dataKey="pending"
                            fill="#1ED36A"
                            radius={[4, 4, 0, 0]}
                            barSize={28}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- Main Component ---
const AffiliateEarnings: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<EarningsStats>({
        totalEarned: 0,
        totalPending: 0,
        totalSettled: 0,
    });
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 10;

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('affiliate_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                // user.id IS the affiliate_accounts.id (stored by LoginForm)
                const affId = user.id;
                if (affId) {
                    fetchAll(affId);
                }
            }
        } catch { /* empty */ }
    }, []);

    const fetchAll = async (affiliateId: string) => {
        setLoading(true);
        try {
            const [statsRes, chartRes, historyRes] = await Promise.all([
                api.get('/affiliates/portal/earnings-stats', { params: { affiliateId } }),
                api.get('/affiliates/portal/earnings-chart', { params: { affiliateId } }),
                api.get('/affiliates/portal/earnings', { params: { affiliateId, page: currentPage, limit: itemsPerPage } }),
            ]);
            setStats(statsRes.data);
            setChartData(Array.isArray(chartRes.data) ? chartRes.data.map((d: any) => ({
                label: d.label,
                earned: Number(d.earned),
                pending: Number(d.pending)
            })) : []);
            setTransactions(historyRes.data.data);
            setTotalItems(historyRes.data.total);
        } catch (error) {
            console.error("Failed to fetch earnings data", error);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // --- Export CSV ---
    const handleExportCSV = () => {
        const headers = ["Date", "Description", "Payment Mode", "Total Amount"];
        const csvContent = [
            headers.join(","),
            ...transactions.map(txn => [
                new Date(txn.date).toLocaleDateString('en-IN'),
                `"${txn.description}"`,
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

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <EarningStat
                    label="Total Earned"
                    value={`₹${stats.totalEarned.toLocaleString('en-IN')}`}
                    icon={<svg className="w-5 h-5 text-[#150089] dark:text-[#1ED36A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
                />
                <EarningStat
                    label="Total Pending"
                    value={`₹${stats.totalPending.toLocaleString('en-IN')}`}
                    icon={<svg className="w-5 h-5 text-[#150089] dark:text-[#1ED36A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                />
                <EarningStat
                    label="Total Settled"
                    value={`₹${stats.totalSettled.toLocaleString('en-IN')}`}
                    icon={<svg className="w-5 h-5 text-[#150089] dark:text-[#1ED36A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
            </div>

            {/* Chart */}
            <div className="mb-8">
                {chartData.length > 0 ? (
                    <LargeEarningsChart chartData={chartData} />
                ) : (
                    <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] p-8 border border-[#E0E0E0] dark:border-white/10 text-center text-[#19211C]/50 dark:text-white/50">
                        {loading ? 'Loading chart...' : 'No earnings data yet'}
                    </div>
                )}
            </div>

            {/* Transaction History */}
            <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] border border-[#E0E0E0] dark:border-white/10 overflow-hidden shadow-sm flex flex-col mb-8 min-h-[400px]">
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
                            {loading ? (
                                <tr><td colSpan={4} className="py-12 text-center text-[#19211C] dark:text-white opacity-50">Loading...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={4} className="py-12 text-center text-[#19211C] dark:text-white opacity-50">No transactions yet</td></tr>
                            ) : transactions.map((txn) => (
                                <tr key={txn.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="py-3.5 pl-6 pr-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">
                                        {new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">
                                        {txn.description}
                                        {txn.status === 'PENDING' && <span className="ml-2 text-xs text-yellow-500">(Pending)</span>}
                                    </td>
                                    <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">{txn.paymentMode}</td>
                                    <td className={`py-3.5 pl-4 pr-6 text-right font-semibold text-[clamp(14px,1.1vw,17px)] leading-none text-[#1ED36A]`}>
                                        +₹{txn.amount.toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalItems > itemsPerPage && (
                <div className="flex justify-center items-center gap-2 mb-8">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                        className="p-2 text-[#19211C] dark:text-white hover:text-[#1ED36A] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="text-sm text-[#19211C] dark:text-white font-medium">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                        className="p-2 text-[#19211C] dark:text-white hover:text-[#1ED36A] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            )}

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
