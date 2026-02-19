"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";

// --- Types ---
interface Referral {
    id: string;
    name: string;
    email: string;
    status: 'pending' | 'converted';
    registeredOn: string;
    studentBoard: string;
    schoolLevel: string;
    schoolStream: string;
    commissionPercentage: number;
    totalEarnedCommission: number;
}

interface ReferralStats {
    totalReferrals: number;
    completedCount: number;
    pendingCount: number;
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

// --- Main Component ---
const AffiliateReferrals: React.FC = () => {
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [copied, setCopied] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 10;

    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [stats, setStats] = useState<ReferralStats>({ totalReferrals: 0, completedCount: 0, pendingCount: 0 });
    const [totalItems, setTotalItems] = useState(0);
    const [affiliateId, setAffiliateId] = useState<string | null>(null);
    const [referralLink, setReferralLink] = useState("https://discover.originbi.com/register?ref=affiliate");
    const [referralCode, setReferralCode] = useState('AFFILIATE');
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [shareCardImageUrl, setShareCardImageUrl] = useState<string | null>(null);
    const [showShareCardModal, setShowShareCardModal] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [sharingPlatform, setSharingPlatform] = useState<string | null>(null);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('affiliate_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                // user.id IS the affiliate_accounts.id (stored by LoginForm)
                const affId = user.id;
                if (affId) {
                    setAffiliateId(affId);
                    if (user.referralCode) {
                        setReferralCode(user.referralCode);
                        setReferralLink(`https://discover.originbi.com/register?ref=${user.referralCode}`);
                    }
                }
            }
        } catch { /* empty */ }
    }, []);

    useEffect(() => {
        if (affiliateId) {
            fetchData();
        }
    }, [affiliateId, currentPage, filterStatus, searchQuery]);

    const fetchData = async () => {
        if (!affiliateId) return;
        setLoading(true);
        try {
            const res = await api.get('/affiliates/portal/referrals-full', {
                params: {
                    affiliateId,
                    page: currentPage,
                    limit: itemsPerPage,
                    status: filterStatus === 'all' ? undefined : filterStatus,
                    search: searchQuery || undefined,
                },
            });
            setStats(res.data.stats);
            setReferrals(res.data.data);
            setTotalItems(res.data.total);
        } catch (error) {
            console.error("Failed to fetch referrals", error);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

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

    // QR code as data URL once referralLink is set
    useEffect(() => {
        if (!referralLink) return;
        import('qrcode').then(QRCode => {
            QRCode.toDataURL(referralLink, {
                width: 300,
                margin: 1,
                color: { dark: '#150089', light: '#ffffff' },
                errorCorrectionLevel: 'H',
            }).then(url => setQrDataUrl(url));
        });
    }, [referralLink]);



    // --- Formatted share text templates ---
    const getShareText = (format: 'whatsapp' | 'email' | 'telegram' | 'plain') => {
        if (format === 'whatsapp') {
            return `🎯 *What Next After +2?*

Your Marks show your Past.
*OriginBI reveals your Future.*

✨ *What you will get:*
✦ Career Direction Clarity
✦ Course Fitment
✦ Growth Roadmap
✦ Confident Career Decision

💰 It's just *₹749* to reveal your future!

👆 *Scan the QR code in the image above* or click below to register:
👉 ${referralLink}`;
        }
        if (format === 'email') {
            return `Hi,

I'd like to share something exciting with you!

🎯 What Next After +2?

Your Marks show your Past. OriginBI reveals your Future.

What you will get:
  ✦ Career Direction Clarity
  ✦ Course Fitment
  ✦ Growth Roadmap
  ✦ Confident Career Decision

It's just ₹749 to reveal your future!

👉 Register here: ${referralLink}

Please find the promotional card attached above. Scan the QR code in the image to register directly!

See you on the other side!`;
        }
        if (format === 'telegram') {
            return `🎯 What Next After +2?

Your Marks show your Past.
OriginBI reveals your Future.

✨ What you will get:
✦ Career Direction Clarity
✦ Course Fitment
✦ Growth Roadmap
✦ Confident Career Decision

💰 It's just ₹749 to reveal your future!

👆 Scan the QR code in the image or click below:
👉 ${referralLink}`;
        }
        // plain
        return `🎯 What Next After +2?

Your Marks show your Past. OriginBI reveals your Future.

What you will get:
✦ Career Direction Clarity
✦ Course Fitment
✦ Growth Roadmap
✦ Confident Career Decision

It's just ₹749 to reveal your future!

Scan the QR code in the image or register here: ${referralLink}`;
    };

    // Clear cached card when QR code regenerates
    useEffect(() => {
        setShareCardImageUrl(null);
    }, [qrDataUrl]);

    // --- Generate promo card: load poster image + overlay QR code ---
    const ensureCardGenerated = async (): Promise<string | null> => {
        if (shareCardImageUrl) return shareCardImageUrl;
        if (!referralLink) return null;

        try {
            const QRCode = await import('qrcode');

            // Load the poster image
            const bgImg = await new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load poster image'));
                img.src = '/After +2 OriginBI without QR.jpg.jpeg';
            });

            // Create canvas matching the image dimensions
            const canvas = document.createElement('canvas');
            canvas.width = bgImg.naturalWidth;
            canvas.height = bgImg.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            // Draw the poster as background
            ctx.drawImage(bgImg, 0, 0);

            // Generate QR code onto a temp canvas
            const qrTempCanvas = document.createElement('canvas');
            await QRCode.toCanvas(qrTempCanvas, referralLink, {
                width: 400,
                margin: 1,
                color: { dark: '#150089', light: '#ffffff' },
                errorCorrectionLevel: 'H',
            });

            // Position QR in the blank "Scan Here" area of the poster (1080x1920)
            const qrSize = 220;
            const qrX = 440;
            const qrY = 1560;

            // White background behind QR
            ctx.fillStyle = '#ffffff';
            const pad = 10;
            ctx.beginPath();
            ctx.roundRect(qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, 16);
            ctx.fill();

            // Draw QR code
            ctx.drawImage(qrTempCanvas, qrX, qrY, qrSize, qrSize);

            const imgUrl = canvas.toDataURL('image/png');
            setShareCardImageUrl(imgUrl);
            return imgUrl;
        } catch (e) {
            console.error('Promo card generation failed', e);
            return null;
        }
    };

    const downloadCard = (imgUrl?: string | null) => {
        const url = imgUrl || shareCardImageUrl;
        if (!url) return;
        const a = document.createElement('a');
        a.href = url;
        a.download = `OriginBI-Referral-${referralCode}.png`;
        a.click();
    };

    // Main share function — generates card, then shares via the chosen platform
    const shareVia = async (platform: 'native' | 'whatsapp' | 'email' | 'linkedin' | 'telegram') => {
        setSharingPlatform(platform);
        setIsGenerating(true);

        const imgUrl = await ensureCardGenerated();
        setIsGenerating(false);
        setSharingPlatform(null);

        if (!imgUrl) return;

        if (platform === 'native') {
            try {
                const res = await fetch(imgUrl);
                const blob = await res.blob();
                const file = new File([blob], `OriginBI-${referralCode}.png`, { type: 'image/png' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    // Send image + text as one single message
                    await navigator.share({
                        title: 'What Next After +2? — OriginBI',
                        text: getShareText('plain'),
                        files: [file],
                    });
                    return;
                }
            } catch { /* fallback to text-only */ }
            // Fallback: share just text + link in one message (no separate download)
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'What Next After +2? — OriginBI',
                        text: getShareText('plain'),
                        url: referralLink,
                    });
                } catch { /* cancelled */ }
            }
            return;
        }

        // For all other platforms: download card first, then open platform with formatted text
        downloadCard(imgUrl);
        await new Promise(r => setTimeout(r, 300));

        if (platform === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(getShareText('whatsapp'))}`, '_blank');
        } else if (platform === 'email') {
            window.location.href = `mailto:?subject=${encodeURIComponent('🎯 What Next After +2? — Discover your future with OriginBI')}&body=${encodeURIComponent(getShareText('email'))}`;
        } else if (platform === 'linkedin') {
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`, '_blank');
        } else if (platform === 'telegram') {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(getShareText('telegram'))}`, '_blank');
        }
    };

    // Open the preview modal (generate first if needed)
    const openPreviewModal = async () => {
        setIsGenerating(true);
        const imgUrl = await ensureCardGenerated();
        setIsGenerating(false);
        if (imgUrl) {
            setShowShareCardModal(true);
        }
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
                            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="pl-10 pr-4 py-2.5 rounded-full bg-white/60 dark:bg-white/5 border border-[#E0E0E0] dark:border-white/10 text-[clamp(14px,1vw,16px)] text-[#19211C] dark:text-white placeholder:text-[#19211C]/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#1ED36A]/30 focus:border-[#1ED36A] transition-all w-[200px] sm:w-[280px] font-normal"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard label="Total Referrals" value={stats.totalReferrals.toString()} subtext="All time" color="#150089" />
                <StatCard label="Completed Assessment" value={stats.completedCount.toString()} subtext="Converted users" color="#1ED36A" />
                <StatCard label="Pending Assessment" value={stats.pendingCount.toString()} subtext="Yet to complete" color="#F59E0B" />
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
                <span className="ml-2 text-[clamp(13px,1vw,15px)] text-[#19211C] dark:text-white opacity-70 font-normal">{totalItems} results</span>
            </div>

            <div className="flex justify-end mb-4">
                <button
                    onClick={() => {
                        const headers = ["Name", "Email", "Registered On", "Student Board", "School Level", "School Stream", "Commission (%)", "Total Earned Commission"];
                        const csvContent = [
                            headers.join(","),
                            ...referrals.map(row => [
                                `"${row.name}"`,
                                row.email,
                                new Date(row.registeredOn).toLocaleDateString('en-IN'),
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
                            {loading ? (
                                <tr><td colSpan={8} className="py-12 text-center text-[#19211C] dark:text-white opacity-50 text-[clamp(14px,1vw,16px)]">Loading...</td></tr>
                            ) : referrals.length === 0 ? (
                                <tr><td colSpan={8} className="py-12 text-center text-[#19211C] dark:text-white opacity-50 text-[clamp(14px,1vw,16px)]">No referrals found matching your criteria</td></tr>
                            ) : referrals.map((row) => (
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
                                    <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">
                                        {new Date(row.registeredOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">{row.studentBoard}</td>
                                    <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">{row.schoolLevel}</td>
                                    <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">{row.schoolStream}</td>
                                    <td className="py-3.5 px-4 text-center font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">{row.commissionPercentage}%</td>
                                    <td className="py-3.5 pl-4 pr-6 text-right font-semibold text-[clamp(14px,1.1vw,17px)] text-[#1ED36A] leading-none">
                                        {row.totalEarnedCommission > 0 ? `₹${row.totalEarnedCommission.toLocaleString('en-IN')}` : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalItems > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-brand-text-light-secondary dark:text-brand-text-secondary mb-8">
                    <div className="w-full sm:w-1/3 order-2 sm:order-1"></div>
                    <div className="flex justify-center w-full sm:w-1/3 order-1 sm:order-2">
                        <div className="flex items-center gap-2">
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                                className="p-2 flex items-center justify-center text-[#19211C] dark:text-white hover:text-[#1ED36A] dark:hover:text-[#1ED36A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
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
                                    <button key={page} onClick={() => handlePageChange(page)}
                                        className={`min-w-[32px] h-8 px-1 rounded-md font-medium text-sm flex items-center justify-center transition-all border cursor-pointer ${currentPage === page
                                            ? "bg-[#150089] border-[#150089] text-white shadow-md"
                                            : "bg-transparent border-[#E0E0E0] dark:border-white/10 text-[#19211C] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5"
                                            }`}>
                                        {page}
                                    </button>
                                );
                            })}
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}
                                className="p-2 flex items-center justify-center text-[#19211C] dark:text-white hover:text-[#1ED36A] dark:hover:text-[#1ED36A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                    <div className="text-center sm:text-right w-full sm:w-1/3 order-3 font-medium text-[#19211C] dark:text-white">
                        Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} referrals
                    </div>
                </div>
            )}

            {/* Share Card Modal */}
            {showShareCardModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowShareCardModal(false)}>
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
                    <div className="relative bg-white dark:bg-[#1a1a2e] rounded-[32px] shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-6 border border-white/10" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowShareCardModal(false)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white dark:bg-[#2a2a40] shadow-lg border border-gray-100 dark:border-white/10 flex items-center justify-center hover:bg-gray-50 transition-all z-50">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <div className="text-center mb-4">
                            <h3 className="font-['Haskoy'] font-bold text-lg text-[#150089] dark:text-white">Share Promo Card</h3>
                            <p className="text-xs text-[#19211C]/60 dark:text-white/50 mt-1">Image + text + referral link will be shared together</p>
                        </div>
                        {/* Card Image Preview */}
                        {shareCardImageUrl && (
                            <div className="rounded-2xl overflow-hidden mb-4 shadow-xl border border-gray-100 dark:border-white/10">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={shareCardImageUrl} alt="Promo Card" className="w-full" />
                            </div>
                        )}
                        {/* Text Preview that will be sent along */}
                        <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 mb-4 border border-gray-100 dark:border-white/10">
                            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#150089] dark:text-white/60 mb-2">📝 Text that will be sent:</p>
                            <div className="text-[13px] text-[#19211C] dark:text-white/80 leading-relaxed whitespace-pre-line font-medium">
                                🎯 <span className="font-bold">What Next After +2?</span>{'\n\n'}
                                Your Marks show your Past.{'\n'}
                                <span className="text-[#1ED36A] font-bold">OriginBI</span> reveals your Future.{'\n\n'}
                                ✨ What you will get:{'\n'}
                                ✦ Career Direction Clarity{'\n'}
                                ✦ Course Fitment{'\n'}
                                ✦ Growth Roadmap{'\n'}
                                ✦ Confident Career Decision{'\n\n'}
                                💰 It&apos;s just <span className="font-bold">₹749</span> to reveal your future!{'\n\n'}
                                👉 <a href={referralLink} className="text-[#150089] underline break-all">{referralLink}</a>
                            </div>
                        </div>
                        {/* Share Buttons */}
                        <div className="space-y-3">
                            {/* Native Share (Mobile) */}
                            <button
                                onClick={() => shareVia('native')}
                                disabled={isGenerating}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-full font-bold text-sm bg-gradient-to-r from-[#1ED36A] to-[#16b058] text-white hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                </svg>
                                Share Image + Text + Link
                            </button>
                            {/* Download only */}
                            <button
                                onClick={() => downloadCard()}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full font-bold text-sm bg-[#150089] text-white hover:shadow-lg hover:-translate-y-0.5 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Download Card
                            </button>

                        </div>
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
                <div className="flex flex-wrap gap-3 shrink-0">
                    <button onClick={handleCopy}
                        className="px-8 py-3.5 rounded-full bg-white text-[#150089] font-semibold text-[clamp(14px,1vw,16px)] hover:bg-white/90 transition-all shadow-md">
                        {copied ? '✓ Copied!' : 'Copy Link'}
                    </button>
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

export default AffiliateReferrals;
