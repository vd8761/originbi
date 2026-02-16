"use client";

import React, { useState } from "react";

// --- Types ---
interface AffiliateProfileData {
    affiliateId: string;
    fullName: string;
    email: string;
    phone: string;
    company: string;
    status: 'active' | 'inactive';
    joinedDate: string;
    referralLink: string;
    totalEarnings: number;
    totalReferrals: number;
    conversionRate: number;
    tier: string;
}

// --- Detail Item (matching corporate) ---
const DetailItem = ({ label, value }: { label: string; value?: string | number }) => (
    <div>
        <label className="text-[clamp(11px,0.73vw,13px)] text-[#19211C] dark:text-white block mb-1 font-normal opacity-70">{label}</label>
        <p className="text-[clamp(14px,1vw,16px)] font-medium text-[#19211C] dark:text-white">{value || '—'}</p>
    </div>
);

// --- Main Component ---
const AffiliateProfile: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const data: AffiliateProfileData = {
        affiliateId: 'AFF_001',
        fullName: 'Jaya Krishna',
        email: 'jayakrishna@example.com',
        phone: '+91 98765 43210',
        company: 'OriginBI Partner',
        status: 'active',
        joinedDate: '01 Jan 2026',
        referralLink: 'https://originbi.com/ref/aff_001',
        totalEarnings: 95000,
        totalReferrals: 10,
        conversionRate: 70,
        tier: 'Gold Affiliate',
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(data.referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative min-h-screen bg-transparent font-['Haskoy'] transition-colors duration-300 overflow-hidden p-4 sm:p-6 lg:p-8">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-[clamp(24px,2vw,36px)] font-bold text-[#150089] dark:text-white leading-tight">My Profile</h1>
                <p className="text-[clamp(14px,1vw,16px)] text-[#19211C] dark:text-white opacity-80 mt-1 font-normal">Your affiliate account overview</p>
            </div>

            {/* Main Grid: Left Avatar + Right Details (matching CorporateProfileView) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Left Column: Avatar & Quick Info */}
                <div className="lg:col-span-1">
                    <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] p-8 border border-[#E0E0E0] dark:border-white/10 shadow-sm flex flex-col items-center text-center h-full justify-between">
                        {/* Avatar */}
                        <div className="flex flex-col items-center">
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=150089&color=fff&size=128`}
                                alt="Profile"
                                className="w-32 h-32 rounded-full mb-4 border-4 border-[#E0E0E0] dark:border-white/10"
                            />
                            <h3 className="text-[clamp(18px,1.3vw,22px)] font-bold text-[#19211C] dark:text-white mb-1">{data.fullName}</h3>
                            <p className="text-[clamp(14px,1vw,16px)] text-[#1ED36A] font-medium mb-1">{data.tier}</p>
                            <p className="text-[clamp(12px,0.8vw,14px)] text-[#19211C] dark:text-white opacity-60 font-normal">{data.company}</p>

                            {/* Status Badge */}
                            <div className="mt-4">
                                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold ${data.status === 'active'
                                    ? 'bg-[#1ED36A]/10 text-[#1ED36A] border border-[#1ED36A]/20'
                                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                    }`}>
                                    {data.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="w-full pt-4 border-t border-[#E0E0E0] dark:border-white/10 grid grid-cols-3 gap-4 mt-6">
                            <div className="text-center">
                                <p className="text-[clamp(11px,0.73vw,13px)] text-[#19211C] dark:text-white opacity-60 mb-1 font-normal">Referrals</p>
                                <p className="text-[clamp(18px,1.3vw,22px)] font-bold text-[#150089] dark:text-white">{data.totalReferrals}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[clamp(11px,0.73vw,13px)] text-[#19211C] dark:text-white opacity-60 mb-1 font-normal">Conversion</p>
                                <p className="text-[clamp(18px,1.3vw,22px)] font-bold text-[#1ED36A]">{data.conversionRate}%</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[clamp(11px,0.73vw,13px)] text-[#19211C] dark:text-white opacity-60 mb-1 font-normal">Earned</p>
                                <p className="text-[clamp(18px,1.3vw,22px)] font-bold text-[#150089] dark:text-white">₹{(data.totalEarnings / 1000).toFixed(0)}K</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Details (matching corporate Registration Details) */}
                <div className="lg:col-span-2">
                    <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] p-8 border border-[#E0E0E0] dark:border-white/10 shadow-sm h-full">
                        <div className="flex items-center gap-3 mb-8">
                            <svg className="w-5 h-5 text-[#1ED36A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <h4 className="text-[clamp(16px,1.04vw,20px)] font-semibold text-[#19211C] dark:text-white leading-none">Affiliate Details</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <DetailItem label="Full Name" value={data.fullName} />
                            <DetailItem label="Affiliate ID" value={data.affiliateId} />
                            <DetailItem label="Email Address" value={data.email} />
                            <DetailItem label="Phone Number" value={data.phone} />
                            <DetailItem label="Company / Organization" value={data.company} />
                            <DetailItem label="Affiliate Tier" value={data.tier} />
                            <DetailItem label="Joined Date" value={data.joinedDate} />
                            <DetailItem label="Conversion Rate" value={`${data.conversionRate}%`} />
                        </div>

                        {/* Referral Link Section */}
                        <div className="mt-8 pt-6 border-t border-[#E0E0E0] dark:border-white/10">
                            <label className="text-[clamp(11px,0.73vw,13px)] text-[#19211C] dark:text-white block mb-2 font-normal opacity-70">Your Referral Link</label>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 px-4 py-3 rounded-xl bg-[#FAFAFA] dark:bg-white/5 border border-[#E0E0E0] dark:border-white/10 text-[clamp(14px,1vw,16px)] font-medium text-[#150089] dark:text-[#1ED36A] truncate">
                                    {data.referralLink}
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className="px-6 py-3 rounded-xl font-medium text-[clamp(14px,1vw,16px)] bg-[#1ED36A] hover:bg-[#16b058] text-white transition-all shadow-md shrink-0"
                                >
                                    {copied ? '✓ Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Removed Performance Summary Cards and Recent Activity Table as per user request */}

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

export default AffiliateProfile;
