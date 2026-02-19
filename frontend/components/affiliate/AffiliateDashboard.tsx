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
    settledDown: 'Not Settled' | 'Processing' | 'Settled';
}

// --- Sub Components ---

const CircleArrowUpRightFilled = ({ className = "w-6 h-6" }: { className?: string }) => (
    <div className={`${className} bg-[#1ED36A] rounded-full flex items-center justify-center flex-shrink-0`}>
        <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 17L17 7M17 7H7M17 7V17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    </div>
);

const MiniStat = ({ label, sublabel, value, trend, isPositive }: { label: string, sublabel?: string, value: string, trend?: string, isPositive?: boolean }) => (
    <div className="flex flex-col pr-6 pl-0 sm:px-6 sm:first:pl-0 w-full sm:w-auto flex-1 border-b sm:border-b-0 sm:border-r border-[#E0E0E0] dark:border-white/10 last:border-0 sm:last:border-r-0 h-full justify-between py-4 sm:py-1">
        <div className="flex justify-between items-start gap-3">
            <div className="flex flex-row items-baseline gap-1">
                <span className="text-xs text-[#19211C]/60 dark:text-white/60 font-normal whitespace-nowrap">{label}</span>
                {sublabel && <span className="text-[9px] text-[#9CA3AF] dark:text-white/35 font-normal whitespace-nowrap">({sublabel})</span>}
            </div>
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
                            ₹{(earnings ?? 0).toLocaleString('en-IN')}
                        </div>
                    </div>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={() => router.push('/affiliate/earnings')}
                        className="font-['Haskoy'] font-semibold text-[clamp(15px,1vw,18px)] text-white bg-gradient-to-r from-[#1ED36A] to-[#16b058] hover:from-[#16b058] hover:to-[#1ED36A] px-14 py-4 rounded-full shadow-[0_8px_24px_-4px_rgba(30,211,106,0.4)] hover:shadow-[0_12px_32px_-4px_rgba(30,211,106,0.5)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        View
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
            api.get(`/affiliates/portal/earnings-chart`, { params: { affiliateId } })
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
    const [showQRModal, setShowQRModal] = useState(false);
    const [showShareCardModal, setShowShareCardModal] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [referralLink, setReferralLink] = useState("https://discover.originbi.com/register?ref=affiliate");
    const [referralCode, setReferralCode] = useState('AFFILIATE');
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [shareCardImageUrl, setShareCardImageUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [sharingPlatform, setSharingPlatform] = useState<string | null>(null);

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

    // Generate QR code as base64 data URL (no CORS issues for html2canvas)
    useEffect(() => {
        if (!referralLink || !mounted) return;
        import('qrcode').then(QRCode => {
            QRCode.toDataURL(referralLink, {
                width: 300,
                margin: 1,
                color: { dark: '#150089', light: '#ffffff' },
                errorCorrectionLevel: 'H',
            }).then(url => setQrDataUrl(url));
        });
    }, [referralLink, mounted]);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
                img.src = '/after-plus-2-originbi-without-qr.jpeg';
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

        // Small delay so download completes before redirect
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
            setShowQRModal(false);
            setShowShareCardModal(true);
        }
    };

    // Inline hidden promotional card captured by html2canvas (NOT a nested component to keep ref stable)

    const QRModalContent = () => (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowQRModal(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
            <div className="relative bg-white dark:bg-[#1a1a2e] rounded-[32px] shadow-2xl max-w-md w-full p-8 border border-white/10" onClick={e => e.stopPropagation()}>
                <button
                    onClick={() => setShowQRModal(false)}
                    className="absolute -top-3 -right-3 sm:top-5 sm:right-5 w-10 h-10 rounded-full bg-white dark:bg-[#2a2a40] shadow-lg border border-gray-100 dark:border-white/10 flex items-center justify-center text-[#19211C] dark:text-white hover:bg-gray-50 dark:hover:bg-white/20 transition-all transform hover:scale-110 z-50"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="text-center mb-8">
                    <h3 className="font-['Haskoy'] font-bold text-[clamp(20px,1.5vw,28px)] text-[#150089] dark:text-white">Affiliate Card</h3>
                    <p className="text-sm text-[#19211C]/60 dark:text-white/50 mt-1">Scan or share your referral details</p>
                </div>

                <div className="flex justify-center mb-8">
                    <div className="p-5 bg-white rounded-[24px] shadow-xl border border-gray-100">
                        {qrDataUrl ? (
                            <img src={qrDataUrl} alt="Referral QR Code" className="w-[220px] h-[220px] rounded-xl" />
                        ) : (
                            <div className="w-[220px] h-[220px] rounded-xl bg-gray-100 animate-pulse" />
                        )}
                    </div>
                </div>

                <div className="flex gap-3 mb-3">
                    <button
                        onClick={() => { navigator.clipboard.writeText(referralLink); handleCopy(); }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-full font-bold text-sm bg-[#150089] text-white hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                        {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button
                        onClick={() => shareVia('native')}
                        disabled={isGenerating}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-full font-bold text-sm bg-gradient-to-r from-[#1ED36A] to-[#16b058] text-white hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
                    >
                        {isGenerating && sharingPlatform === 'native' ? (
                            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" /></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                            </svg>
                        )}
                        Share
                    </button>
                </div>
            </div>
        </div>
    );

    const ShareCardModalContent = () => (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowShareCardModal(false)}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>
            <div className="relative bg-white dark:bg-[#1a1a2e] rounded-[32px] shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-6 border border-white/10" onClick={e => e.stopPropagation()}>
                <button
                    onClick={() => setShowShareCardModal(false)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white dark:bg-[#2a2a40] shadow-lg border border-gray-100 dark:border-white/10 flex items-center justify-center text-[#19211C] dark:text-white hover:bg-gray-50 transition-all z-50"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="text-center mb-4">
                    <h3 className="font-['Haskoy'] font-bold text-lg text-[#150089] dark:text-white">Share Promo Card</h3>
                    <p className="text-xs text-[#19211C]/60 dark:text-white/50 mt-1">Image + text + referral link will be shared together</p>
                </div>

                {/* Card Image Preview */}
                {shareCardImageUrl && (
                    <div className="rounded-2xl overflow-hidden mb-4 shadow-xl border border-gray-100 dark:border-white/10">
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

                {/* Share Buttons - Each generates card + downloads + opens platform */}
                <div className="space-y-3">
                    {/* Native Share (Mobile) — sends image + text together */}
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
                            {qrDataUrl ? (
                                <img src={qrDataUrl} alt="Referral QR Code" className="w-[120px] h-[120px] rounded-lg" />
                            ) : (
                                <div className="w-[120px] h-[120px] rounded-lg bg-gray-100 animate-pulse" />
                            )}
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

                            <button
                                onClick={() => shareVia('native')}
                                disabled={isGenerating}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all bg-gradient-to-r from-[#1ED36A] to-[#16b058] text-white hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
                            >
                                {isGenerating ? (
                                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" /></svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                    </svg>
                                )}
                                {isGenerating ? 'Sharing...' : 'Share'}
                            </button>

                        </div>
                    </div>
                </div>
            </div>
            {showQRModal && mounted && ReactDOM.createPortal(<QRModalContent />, document.body)}
            {showShareCardModal && mounted && ReactDOM.createPortal(<ShareCardModalContent />, document.body)}
        </>
    );
};

// --- Referrals Table ---
const ReferralsTable = ({ data }: { data: Referral[] }) => {
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
                            <th className="text-left py-3 pl-6 pr-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[25%]">Name</th>
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
                                    {(() => {
                                        if (!row.signUpDate) return 'N/A';
                                        const date = new Date(row.signUpDate);
                                        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ');
                                    })()}
                                </td>
                                <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] leading-none">
                                    <span className={
                                        row.settledDown === 'Settled' ? 'text-[#1ED36A]'
                                        : row.settledDown === 'Processing' ? 'text-[#F59E0B]'
                                        : 'text-[#FF5457]'
                                    }>
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

    const [referrals, setReferrals] = useState<Referral[]>([]);

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
                        value={(stats.activeReferrals ?? 0).toString()}
                        trend={`${Math.abs(stats.trends?.referrals || 0)}%`}
                        isPositive={(stats.trends?.referrals || 0) >= 0}
                    />
                    <MiniStat
                        label="Total Earning"
                        sublabel="This Month"
                        value={`₹${(stats.thisMonthEarnings ?? 0).toLocaleString('en-IN')}`}
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
                        value={`₹${(stats.pendingEarnings ?? 0).toLocaleString('en-IN')}`}
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
