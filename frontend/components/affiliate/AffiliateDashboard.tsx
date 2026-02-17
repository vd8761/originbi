"use client";

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { TrendUpIcon, TrendDownIcon } from '../icons';

// --- Types ---
interface AffiliateStats {
    totalEarnings: number;
    pendingEarnings: number;
    activeReferrals: number;
    totalClicks: number;
    conversionRate: number;
    thisMonthEarnings: number;
    trends?: {
        earnings: number;
        referrals: number;
    };
}

interface Referral {
    id: string;
    name: string;
    email: string;
    status: 'active' | 'pending' | 'converted';
    signUpDate: string;
    commission: number;
}

// --- Sub Components ---

const CircleArrowUpRightFilled = ({ className = "w-6 h-6" }: { className?: string }) => (
    <div className={`${className} bg-[#1ED36A] rounded-full flex items-center justify-center flex-shrink-0`}>
        <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 17L17 7M17 7H7M17 7V17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    </div>
);

const MiniStat = ({ label, value, trend, isPositive }: { label: string, value: string, trend?: string, isPositive?: boolean }) => (
    <div className="flex flex-col pr-6 pl-0 sm:px-6 sm:first:pl-0 w-full sm:w-auto flex-1 border-b sm:border-b-0 sm:border-r border-[#E0E0E0] dark:border-white/10 last:border-0 sm:last:border-r-0 h-full justify-between py-4 sm:py-1">
        <div className="flex justify-between items-start gap-3">
            <span className="text-xs text-[#19211C]/60 dark:text-white/60 font-normal whitespace-nowrap">{label}</span>
            <CircleArrowUpRightFilled className="w-6 h-6" />
        </div>
        <div className="flex flex-row items-baseline gap-3">
            <span className="text-[clamp(32px,2.5vw,48px)] font-medium text-[#150089] dark:text-white leading-none">{value}</span>
            {trend && (
                <div className="flex items-center gap-2">
                    <span className={`text-[clamp(14px,1vw,16px)] font-semibold flex items-center gap-1.5 ${isPositive ? 'text-[#1ED36A]' : 'text-[#FF5457]'}`}>
                        {trend}
                        {isPositive ? <TrendUpIcon /> : <TrendDownIcon />}
                    </span>
                    <span className="text-[clamp(12px,0.8vw,14px)] font-normal text-[#19211C] dark:text-white opacity-80 whitespace-nowrap">
                        vs last month
                    </span>
                </div>
            )}
        </div>
    </div>
);

// --- Earnings Card (Credits Summary Style) ---
// --- Earnings Card (Credits Summary Style) ---
const EarningsCard = ({ earnings }: { earnings: number }) => {
    const router = useRouter();
    return (
        <div className="relative overflow-hidden rounded-[32px] h-full bg-white dark:bg-[#FFFFFF]/[0.08] border border-[#E0E0E0] dark:border-white/10 flex flex-col items-center justify-between shadow-sm">
            {/* Multi-color Bottom Gradient Glow */}
            <div
                className="absolute -bottom-[40%] -left-[20%] -right-[20%] h-[220px] blur-[60px] pointer-events-none opacity-80"
                style={{
                    background: 'linear-gradient(120deg, #1ED36A 0%, #F59E0B 35%, #FF6B6B 65%, #1ED36A 100%)'
                }}
            ></div>

            {/* Content */}
            <div className="relative z-10 w-full flex flex-col h-full justify-between p-8">
                <div className="w-full text-left">
                    <h3 className="font-['Haskoy'] font-bold text-[clamp(18px,1.2vw,24px)] text-[#150089] dark:text-white leading-none">Total Earnings</h3>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center py-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="font-['Haskoy'] font-bold text-[clamp(64px,6vw,120px)] text-[#150089] dark:text-white leading-[0.9] tracking-tight">
                            ₹{earnings.toLocaleString('en-IN')}
                        </div>
                    </div>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={() => router.push('/affiliate/earnings')}
                        className="font-['Haskoy'] font-semibold text-[clamp(15px,1vw,18px)] text-white bg-gradient-to-r from-[#1ED36A] to-[#16b058] hover:from-[#16b058] hover:to-[#1ED36A] px-14 py-4 rounded-full shadow-[0_8px_24px_-4px_rgba(30,211,106,0.4)] hover:shadow-[0_12px_32px_-4px_rgba(30,211,106,0.5)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Earnings
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Earnings Chart ---
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// --- Earnings Chart ---
const EarningsChart = ({ affiliateId }: { affiliateId?: string }) => {
    const [chartData, setChartData] = useState<{ label: string; earned: number; pending: number }[]>([]);

    useEffect(() => {
        if (affiliateId) {
            api.get(`/affiliates/portal/earnings-chart?affiliateId=${affiliateId}`)
                .then(res => {
                    if (Array.isArray(res.data)) {
                        setChartData(res.data.map((d: any) => ({
                            label: d.label,
                            earned: Number(d.earned),
                            pending: Number(d.pending)
                        })));
                    }
                })
                .catch(err => console.error(err));
        }
    }, [affiliateId]);

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
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] p-6 border border-[#E0E0E0] dark:border-white/10 h-full flex flex-col font-['Haskoy'] shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-[clamp(18px,1.2vw,22px)] font-semibold text-[#19211C] dark:text-white leading-none">Earnings Overview</h3>
                <div className="flex gap-4 text-xs font-medium text-[#19211C] dark:text-white">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#150089]"></span> Earned</div>
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#1ED36A]"></span> Pending</div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={4}>
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
                            barSize={12}
                        />
                        <Bar
                            dataKey="pending"
                            fill="#1ED36A"
                            radius={[4, 4, 0, 0]}
                            barSize={12}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


// --- Referral Performance ---


// --- Referral Link Card (Redesigned as Share Card) ---
const ReferralLinkCard = () => {
    const [copied, setCopied] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [referralLink, setReferralLink] = useState("https://discover.originbi.com/register?ref=affiliate");
    const [referralCode, setReferralCode] = useState('AFFILIATE');

    useEffect(() => {
        setMounted(true);
        try {
            const storedUser = localStorage.getItem('affiliate_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                if (user.referralCode) {
                    setReferralCode(user.referralCode);
                    setReferralLink(`https://discover.originbi.com/register?ref=${user.referralCode}`);
                }
            }
        } catch { /* empty */ }
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join OriginBI via my referral',
                    text: 'Sign up for OriginBI using my referral link and get started!',
                    url: referralLink,
                });
            } catch { /* user cancelled */ }
        } else {
            setShowShareMenu(!showShareMenu);
        }
    };

    const ModalContent = () => (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowQRModal(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"></div>
            <div className="relative bg-white dark:bg-[#1a1a2e] rounded-[32px] shadow-2xl max-w-md w-full p-8 animate-scale-up border border-white/10" onClick={e => e.stopPropagation()}>
                {/* Close Button - More prominent */}
                <button
                    onClick={() => setShowQRModal(false)}
                    className="absolute -top-3 -right-3 sm:top-5 sm:right-5 w-10 h-10 rounded-full bg-white dark:bg-[#2a2a40] shadow-lg border border-gray-100 dark:border-white/10 flex items-center justify-center text-[#19211C] dark:text-white hover:bg-gray-50 dark:hover:bg-white/20 transition-all transform hover:scale-110 z-50"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <h3 className="font-['Haskoy'] font-bold text-[clamp(20px,1.5vw,28px)] text-[#150089] dark:text-white">Affiliate Card</h3>
                    <p className="text-sm text-[#19211C]/60 dark:text-white/50 mt-1">Scan or share your referral details</p>
                </div>

                {/* QR Code - Larger */}
                <div className="flex justify-center mb-8">
                    <div className="p-5 bg-white rounded-[24px] shadow-xl border border-gray-100">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(referralLink)}&bgcolor=ffffff&color=150089&margin=8`}
                            alt="Referral QR Code"
                            className="w-[220px] h-[220px] rounded-xl"
                        />
                    </div>
                </div>

                {/* Affiliate Details - REMOVED as per request */}

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        onClick={() => { navigator.clipboard.writeText(referralLink); handleCopy(); }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-full font-bold text-sm bg-[#150089] text-white hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                        {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-full font-bold text-sm bg-gradient-to-r from-[#1ED36A] to-[#16b058] text-white hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                        Share
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] border border-[#E0E0E0] dark:border-white/10 font-['Haskoy'] shadow-sm h-full flex flex-col">
                <div className="p-6 h-full flex flex-col justify-between gap-6">
                    <div>
                        <h3 className="font-semibold text-[clamp(16px,1.04vw,20px)] text-[#19211C] dark:text-white leading-none mb-2">
                            Your Affiliate Link!
                        </h3>
                        <p className="text-sm text-[#19211C]/60 dark:text-white/60">Invite friends to OriginBI</p>
                    </div>

                    <div className="flex flex-col items-center gap-6 flex-1 justify-center">
                        {/* QR Trigger */}
                        <button onClick={() => setShowQRModal(true)} className="p-3 bg-white rounded-2xl shadow-md border border-gray-100 dark:border-white/10 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 group">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(referralLink)}&bgcolor=ffffff&color=150089&margin=6`}
                                alt="Referral QR Code"
                                className="w-[120px] h-[120px] rounded-lg"
                            />
                        </button>

                        {/* Buttons */}
                        <div className="w-full space-y-3">
                            <button
                                onClick={handleCopy}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md transform active:scale-[0.98] ${copied
                                    ? 'bg-[#1ED36A] text-white'
                                    : 'bg-[#150089] text-white hover:bg-[#150089]/90'
                                    }`}
                            >
                                {copied ? 'Copied!' : 'Copy Link'}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                            </button>

                            <div className="relative w-full">
                                <button
                                    onClick={handleShare}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all bg-white dark:bg-white/5 border border-[#E0E0E0] dark:border-white/10 text-[#19211C] dark:text-white hover:bg-gray-50 dark:hover:bg-white/10"
                                >
                                    Share
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                    </svg>
                                </button>
                                {showShareMenu && (
                                    <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-brand-dark-secondary rounded-xl shadow-xl border border-gray-100 dark:border-brand-dark-tertiary p-1.5 z-50">
                                        <a href={`https://wa.me/?text=${encodeURIComponent('Check out OriginBI! ' + referralLink)}`} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-[#19211C] dark:text-white rounded-lg hover:bg-[#25D366]/10 transition-colors">
                                            <span className="text-base">💬</span> WhatsApp
                                        </a>
                                        <a href={`mailto:?subject=Join OriginBI&body=${encodeURIComponent('Sign up using my referral: ' + referralLink)}`}
                                            className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-[#19211C] dark:text-white rounded-lg hover:bg-blue-500/10 transition-colors">
                                            <span className="text-base">📧</span> Email
                                        </a>
                                        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-[#19211C] dark:text-white rounded-lg hover:bg-[#0A66C2]/10 transition-colors">
                                            <span className="text-base">💼</span> LinkedIn
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {showQRModal && mounted && ReactDOM.createPortal(<ModalContent />, document.body)}
        </>
    );
};

// --- Referrals Table ---
const ReferralsTable = ({ data }: { data: (Referral & { settledDown: 'Completed' | 'Incomplete' })[] }) => {
    const router = useRouter();


    const statusBadge = (status: string) => {
        switch (status) {
            case 'converted':
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#1ED36A]/10 text-[#1ED36A] border border-[#1ED36A]/20">Converted</span>;
            case 'active':
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">Active</span>;
            case 'pending':
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">Pending</span>;
            default:
                return null;
        }
    };

    return (
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] border border-[#E0E0E0] dark:border-white/10 h-full overflow-hidden flex flex-col font-['Haskoy'] shadow-sm">
            <div className="flex justify-between items-center p-6">
                <h3 className="font-semibold text-[clamp(16px,1.04vw,20px)] text-[#19211C] dark:text-white leading-none">
                    Recent Referrals
                </h3>
                <span
                    onClick={() => router.push('/affiliate/referrals')}
                    className="font-medium text-[clamp(13px,1vw,15px)] text-[#1ED36A] cursor-pointer hover:underline"
                >
                    View all
                </span>
            </div>

            <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="bg-[#EAEAEA] dark:bg-white/5">
                            <th className="text-left py-3 pl-6 pr-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[25%]">Organization</th>
                            <th className="text-left py-3 px-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[25%]">Email</th>
                            <th className="text-left py-3 px-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[15%]">Sign-up Date</th>
                            <th className="text-left py-3 px-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[15%]">Settled Down</th>
                            <th className="text-right py-3 pl-4 pr-6 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[15%]">Commission</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F5F5] dark:divide-white/5">
                        {data.map((row, i) => (
                            <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="py-3.5 pl-6 pr-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">
                                    {row.name}
                                </td>
                                <td className="py-3.5 px-4 font-normal text-[clamp(13px,0.9vw,15px)] text-brand-text-light-secondary dark:text-brand-text-secondary leading-none">
                                    {row.email}
                                </td>
                                <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">
                                    {new Date(row.signUpDate).toISOString().split('T')[0]}
                                </td>
                                <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] leading-none">
                                    <span className={row.settledDown === 'Completed' ? 'text-[#1ED36A]' : 'text-[#FF5457]'}>
                                        {row.settledDown}
                                    </span>
                                </td>
                                <td className="py-3.5 pl-4 pr-6 text-right font-semibold text-[clamp(14px,1.1vw,17px)] text-[#1ED36A] leading-none">
                                    {row.commission > 0 ? `₹${row.commission.toLocaleString('en-IN')}` : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};



// --- Main Dashboard ---
const AffiliateDashboard: React.FC = () => {
    const router = useRouter();
    const [affiliateUser, setAffiliateUser] = useState<any>(null);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('affiliate_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                setAffiliateUser(user);

                // user.id IS the affiliate_accounts.id (stored by LoginForm)
                const affId = user.id;
                if (affId) {
                    fetchData(affId);
                }
            }
        } catch { /* empty */ }
    }, []);

    const [stats, setStats] = useState<AffiliateStats>({
        totalEarnings: 0,
        pendingEarnings: 0,
        activeReferrals: 0,
        totalClicks: 0,
        conversionRate: 0,
        thisMonthEarnings: 0
    });

    const [referrals, setReferrals] = useState<(Referral & { settledDown: 'Completed' | 'Incomplete' })[]>([]);

    const fetchData = async (affiliateId: string) => {
        try {
            const [statsRes, referralsRes] = await Promise.all([
                api.get('/affiliates/portal/dashboard', { params: { affiliateId } }),
                api.get('/affiliates/portal/referrals', { params: { affiliateId } })
            ]);
            setStats(statsRes.data);
            setReferrals(referralsRes.data);
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        }
    };

    const userName = affiliateUser?.name || "Affiliate Partner";

    return (
        <div className="relative min-h-screen bg-transparent font-sans transition-colors duration-300 overflow-hidden p-4 sm:p-6 lg:p-8">
            {/* 1. Header Section */}
            <div className="flex flex-col xl:flex-row justify-between items-start mb-10 gap-6">
                <div>
                    <div className="text-[clamp(12px,0.73vw,14px)] text-[#19211C] dark:text-white font-normal mb-1">Welcome Back!!</div>
                    <h1 className="text-[clamp(28px,2.3vw,44px)] font-semibold text-[#150089] dark:text-white mb-2 leading-tight">{userName}</h1>
                    <p className="text-[clamp(16px,1.05vw,20px)] text-[#19211C] dark:text-white font-medium">Here&apos;s your affiliate performance overview</p>
                </div>

                {/* Header Stats */}
                <div className="flex flex-wrap sm:flex-nowrap w-full xl:w-auto xl:mt-6">
                    <MiniStat
                        label="Total Referrals"
                        value={stats.activeReferrals.toString()}
                        trend={`${Math.abs(stats.trends?.referrals || 0)}%`}
                        isPositive={(stats.trends?.referrals || 0) >= 0}
                    />
                    <MiniStat
                        label="This Month"
                        value={`₹${stats.thisMonthEarnings.toLocaleString('en-IN')}`}
                        trend={`${Math.abs(stats.trends?.earnings || 0)}%`}
                        isPositive={(stats.trends?.earnings || 0) >= 0}
                    />
                    <MiniStat
                        label="Conversion Rate"
                        value={`${stats.conversionRate}%`}
                        trend=""
                        isPositive={true}
                    />
                    <MiniStat
                        label="Pending Payouts"
                        value={`₹${stats.pendingEarnings.toLocaleString('en-IN')}`}
                        trend=""
                        isPositive={true}
                    />
                </div>
            </div>

            {/* 2. Top Grid: Earnings, Chart, Share */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                <div className="lg:col-span-3">
                    <EarningsCard earnings={stats.totalEarnings} />
                </div>
                <div className="lg:col-span-6 relative z-20">
                    <EarningsChart affiliateId={affiliateUser?.id} />
                </div>
                <div className="lg:col-span-3 relative z-10">
                    <ReferralLinkCard />
                </div>
            </div>

            {/* 3. Referrals Table (Full Width) */}
            <div className="mb-8">
                <ReferralsTable data={referrals} />
            </div>

            {/* Footer */}
            <div className="mt-12 border-t border-gray-200 dark:border-white/5 pt-6 flex flex-col sm:flex-row justify-between text-[14px] font-medium items-center gap-4">
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

export default AffiliateDashboard;
