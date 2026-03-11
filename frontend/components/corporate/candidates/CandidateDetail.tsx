"use client";

import React, { useState } from "react";
import { ChevronDownIcon, CheckCircle2, XCircle, StarIcon, Download } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

export interface CandidateDetailProps {
    candidateId: string;
    jobTitle?: string;
    onBack?: () => void;
}

interface CandidateData {
    id: string;
    name: string;
    originId: string;
    avatar: string;
    trait: string;
    traitColor: string;
    skills: string[];
    alignment: string;
    alignmentPercent: number;
    role: string;
    linkedIn: string;
    github: string;
}

interface OriginReportData {
    traitName: string;
    traitImage: string;
    characterName: string;
    collegeName: string;
    degreeInfo: string;
    keyStrengths: string[];
    roleAlignment: { title: string; items: string[] };
    careerGrowthTips: { title: string; sections: { heading: string; body: string }[] };
}

interface AppliedJob {
    id: string;
    title: string;
    company: string;
    employmentType: string;
    roleAlignment: string;
    alignmentPercent: number;
    postedDate: string;
    appliedDate: string;
    closeDate: string;
    status: "Hired" | "Shortlisted" | "Rejected" | "-";
}

type TabKey = "origin_report" | "resume" | "certificate1" | "certificate2" | "applied_jobs";

// ─── Mock Data ──────────────────────────────────────────────────

const mockCandidate: CandidateData = {
    id: "202001256",
    name: "Monishwar Rajasekaran",
    originId: "202001256",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    trait: "Supportive Energizer",
    traitColor: "border-[#FFB020] text-[#FFB020]",
    skills: ["Figma", "UX Design", "Wire Framing", "Photoshop", "Adobe XD", "Prototype", "Sketch"],
    alignment: "92%",
    alignmentPercent: 92,
    role: "UI/UX Designer",
    linkedIn: "https://linkedin.com",
    github: "https://github.com",
};

const mockOriginReport: OriginReportData = {
    traitName: "Supportive Energizer",
    traitImage: "",
    characterName: "Pushparaaj",
    collegeName: "Peri Institute of Engineering and Technology",
    degreeInfo: "B.Tech Information Technology (3rd Year)",
    keyStrengths: [
        "Frequently reviews and aligns goals to stay focused and motivated.",
        "Continuously seeks ways to improve and refine processes.",
        "Stays informed about the latest trends and developments in the industry.",
        "Actively seeks constructive feedback from peers and mentors to grow and develop.",
        "Adapts strategies to remain effective in changing circumstances.",
    ],
    roleAlignment: {
        title: "Role Alignment",
        items: [
            "User Experience (UX) Designer",
            "IT Business Analyst",
            "Knowledge Management Specialist",
        ],
    },
    careerGrowthTips: {
        title: "Career Growth Tips",
        sections: [
            {
                heading: "Delivering on Promises",
                body: "The candidate's enthusiasm can sometimes lead him/her to take on more than can realistically be managed. By learning to prioritize and set boundaries, he/she can ensure commitments are met without feeling overwhelmed.",
            },
            {
                heading: "Active Listening",
                body: "While the candidate's conversational skills are excellent, focusing more on listening can help build deeper connections. Taking the time to fully understand others' perspectives will enhance relationships and decision-making.",
            },
            {
                heading: "Staying Focused",
                body: "The candidate's excitement about new ideas can occasionally distract him/her from existing priorities. Adopting tools like task managers and timers can improve focus.",
            },
        ],
    },
};

const mockAppliedJobs: AppliedJob[] = [
    { id: "1", title: "Front-End Developer", company: "Google Inc", employmentType: "Full Time", roleAlignment: "92%", alignmentPercent: 92, postedDate: "31 Feb 2025", appliedDate: "13 May 2025", closeDate: "31 Feb 2025", status: "Hired" },
    { id: "2", title: "Front-End Developer", company: "Google Inc", employmentType: "Full Time", roleAlignment: "92%", alignmentPercent: 92, postedDate: "31 Feb 2025", appliedDate: "13 May 2025", closeDate: "31 Feb 2025", status: "Shortlisted" },
    { id: "3", title: "Front-End Developer", company: "Google Inc", employmentType: "Full Time", roleAlignment: "92%", alignmentPercent: 92, postedDate: "31 Feb 2025", appliedDate: "13 May 2025", closeDate: "31 Feb 2025", status: "Rejected" },
    { id: "4", title: "Front-End Developer", company: "Google Inc", employmentType: "Full Time", roleAlignment: "92%", alignmentPercent: 92, postedDate: "31 Feb 2025", appliedDate: "13 May 2025", closeDate: "31 Feb 2025", status: "-" },
    { id: "5", title: "Front-End Developer", company: "Google Inc", employmentType: "Full Time", roleAlignment: "92%", alignmentPercent: 92, postedDate: "31 Feb 2025", appliedDate: "13 May 2025", closeDate: "31 Feb 2025", status: "Shortlisted" },
    { id: "6", title: "Front-End Developer", company: "Google Inc", employmentType: "Full Time", roleAlignment: "92%", alignmentPercent: 92, postedDate: "31 Feb 2025", appliedDate: "13 May 2025", closeDate: "31 Feb 2025", status: "Hired" },
];

// ─── Status Badge Helper ────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
    Hired: "bg-[#13C065] text-white",
    Shortlisted: "bg-[#FFB020] text-white",
    Rejected: "bg-[#FF4A4A] text-white",
    "-": "text-gray-400",
};

// ─── Star Rating Component ──────────────────────────────────────

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
    return (
        <div className="flex gap-1">
            {Array.from({ length: max }).map((_, i) => (
                <svg
                    key={i}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                    className={i < Math.round(rating) ? "text-[#13C065]" : "text-[#13C065]/30"}
                >
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
            ))}
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────

export default function CandidateDetail({ candidateId, jobTitle, onBack }: CandidateDetailProps) {
    const [activeTab, setActiveTab] = useState<TabKey>("origin_report");

    const candidate = mockCandidate;
    const report = mockOriginReport;
    const appliedJobs = mockAppliedJobs;

    const tabs: { key: TabKey; label: string; count?: number }[] = [
        { key: "origin_report", label: "Origin Report" },
        { key: "resume", label: "Resume" },
        { key: "certificate1", label: "Certificate 1" },
        { key: "certificate2", label: "Certificate 2" },
        { key: "applied_jobs", label: "Applied Jobs", count: 10 },
    ];

    return (
        <div className="flex flex-col h-full w-full gap-5 font-sans p-4 sm:p-6 lg:p-8">

            {/* Breadcrumb */}
            <div className="flex items-center text-xs text-gray-400 dark:text-white/70 mb-1.5 font-normal">
                <button onClick={onBack} className="hover:underline cursor-pointer">Dashboard</button>
                <span className="mx-1.5">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-500">
                        <path d="M3.75 2L6.75 5L3.75 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
                <button onClick={onBack} className="hover:underline cursor-pointer">Jobs</button>
                <span className="mx-1.5">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-500">
                        <path d="M3.75 2L6.75 5L3.75 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
                {jobTitle && (
                    <>
                        <button onClick={onBack} className="hover:underline cursor-pointer">{jobTitle}</button>
                        <span className="mx-1.5">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-gray-500">
                                <path d="M3.75 2L6.75 5L3.75 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                    </>
                )}
                <span className="text-brand-green font-semibold">Candidate Detail</span>
            </div>

            {/* Main Content: Left Sidebar + Right Panel */}
            <div className="flex flex-col lg:flex-row gap-6">

                {/* ─── Left Sidebar (Profile Card) ─── */}
                <div className="w-full lg:w-[280px] shrink-0">
                    <div className="bg-white dark:bg-[#1F2320] border border-gray-200 dark:border-white/5 rounded-2xl p-6 flex flex-col items-center gap-4">
                        {/* Avatar */}
                        <div className="w-[90px] h-[90px] rounded-full overflow-hidden border-2 border-white/10">
                            <img src={candidate.avatar} alt={candidate.name} className="w-full h-full object-cover" />
                        </div>

                        {/* Name & ID */}
                        <div className="text-center">
                            <h2 className="text-[16px] font-bold text-[#19211C] dark:text-white mb-1">{candidate.name}</h2>
                            <p className="text-[12px] text-gray-500 dark:text-gray-400">Origin ID : {candidate.originId}</p>
                        </div>

                        {/* Trait */}
                        <div className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold tracking-wide whitespace-nowrap ${candidate.traitColor} bg-transparent`}>
                            <span className="opacity-70 font-medium">Trait:</span> {candidate.trait}
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap justify-center gap-2 mt-1">
                            {candidate.skills.map((skill, i) => (
                                <span key={i} className="px-3 py-[5px] rounded-full border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1A1F1C] text-[11px] font-medium text-[#19211C] dark:text-white">
                                    {skill}
                                </span>
                            ))}
                        </div>

                        {/* Social Links */}
                        <div className="flex gap-3 mt-2">
                            <a href={candidate.linkedIn} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A66C2] text-white rounded-full text-[11px] font-semibold hover:opacity-90 transition-opacity">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                                LinkedIn Profile
                            </a>
                            <a href={candidate.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#2A302C] text-[#19211C] dark:text-white border border-gray-200 dark:border-white/10 rounded-full text-[11px] font-semibold hover:opacity-90 transition-opacity">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg>
                                GitHub Profile
                            </a>
                        </div>

                        {/* Divider */}
                        <div className="w-full h-px bg-gray-200 dark:bg-white/5 my-2" />

                        {/* Role */}
                        <h3 className="text-[15px] font-bold text-[#19211C] dark:text-white">{candidate.role}</h3>

                        {/* Alignment */}
                        <p className="text-[12px] font-bold text-[#19211C] dark:text-white">
                            Role Alignment : <span className="text-[#13C065]">{candidate.alignment}</span>
                        </p>

                        {/* Star Rating */}
                        <StarRating rating={4} />

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2.5 mt-2 w-full">
                            <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-semibold bg-white/5 hover:bg-white/10 text-[#19211C] dark:text-white border border-gray-200 dark:border-white/5 transition-colors cursor-pointer">
                                <CheckCircle2 className="w-[14px] h-[14px] text-[#13C065]" strokeWidth={3} />
                                Hire
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-semibold bg-white/5 hover:bg-white/10 text-[#19211C] dark:text-white border border-gray-200 dark:border-white/5 transition-colors cursor-pointer">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-[#FFB020]">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                </svg>
                                Shortlist
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-semibold bg-white/5 hover:bg-white/10 text-[#19211C] dark:text-white border border-gray-200 dark:border-white/5 transition-colors cursor-pointer">
                                <XCircle className="w-[14px] h-[14px] text-[#FF4A4A]" strokeWidth={3} />
                                Reject
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── Right Content Panel ─── */}
                <div className="flex-1 min-w-0">

                    {/* Tabs */}
                    <div className="flex items-center gap-0 border-b border-gray-200 dark:border-white/10 mb-6 overflow-x-auto scrollbar-hide">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-1 py-3 mr-6 text-[14px] border-b-[3px] transition-colors whitespace-nowrap cursor-pointer ${activeTab === tab.key
                                    ? "border-brand-green"
                                    : "border-transparent hover:border-gray-200 dark:hover:border-white/20"
                                    }`}
                            >
                                <span className={activeTab === tab.key ? "font-semibold text-brand-green" : "font-medium text-gray-500 dark:text-gray-400"}>
                                    {tab.label}
                                </span>
                                {tab.count !== undefined && (
                                    <span className={activeTab === tab.key ? "text-brand-green font-semibold ml-1.5" : "text-gray-400 dark:text-gray-500 font-medium ml-1.5"}>
                                        ({tab.count})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* ─── Origin Report Tab ─── */}
                    {activeTab === "origin_report" && (
                        <div className="bg-white dark:bg-[#1F2320] border border-gray-200 dark:border-white/5 rounded-2xl p-6">
                            <div className="flex flex-col lg:flex-row gap-8">

                                {/* Left: Trait Character */}
                                <div className="flex flex-col items-center gap-4 lg:w-[300px] shrink-0">
                                    {/* Character header */}
                                    <div className="text-center">
                                        <h3 className="text-[22px] font-bold text-[#19211C] dark:text-white">{report.characterName}</h3>
                                        <p className="text-[13px] text-brand-green font-medium">{report.degreeInfo}</p>
                                        <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1">{report.collegeName}</p>
                                    </div>

                                    {/* Trait illustration placeholder */}
                                    <div className="w-[200px] h-[200px] rounded-full bg-gradient-to-br from-brand-green/20 to-yellow-400/20 flex items-center justify-center">
                                        <div className="text-center">
                                            <h2 className="text-[24px] font-bold text-[#19211C] dark:text-white leading-tight">Supportive</h2>
                                            <h2 className="text-[24px] font-bold text-[#19211C] dark:text-white leading-tight">Energizer</h2>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Key Strengths */}
                                <div className="flex-1">
                                    <h3 className="text-[15px] font-bold text-[#19211C] dark:text-white mb-4">Key Strength</h3>
                                    <ul className="flex flex-col gap-3">
                                        {report.keyStrengths.map((strength, i) => (
                                            <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700 dark:text-gray-300">
                                                <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 shrink-0" />
                                                {strength}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Bottom: Role Alignment + Career Growth Tips */}
                            <div className="mt-8 border-t border-gray-200 dark:border-white/5 pt-6">
                                <div className="flex flex-col lg:flex-row gap-8">
                                    {/* Role Alignment */}
                                    <div className="lg:w-[300px] shrink-0">
                                        <h3 className="text-[15px] font-bold text-brand-green mb-4">{report.roleAlignment.title}</h3>
                                        <ul className="flex flex-col gap-2.5">
                                            {report.roleAlignment.items.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700 dark:text-gray-300">
                                                    <span className="text-gray-400 mt-0.5">•</span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Career Growth Tips */}
                                    <div className="flex-1">
                                        <h3 className="text-[15px] font-bold text-brand-green mb-4">{report.careerGrowthTips.title}</h3>
                                        <p className="text-[13px] text-gray-700 dark:text-gray-300 mb-4">
                                            The candidate&apos;s vibrant personality and optimistic outlook are among his/her greatest assets, but like any strength, these can be overextended. To ensure continued growth, here are some tailored recommendations for the candidate:
                                        </p>
                                        <div className="flex flex-col gap-5">
                                            {report.careerGrowthTips.sections.map((section, i) => (
                                                <div key={i}>
                                                    <h4 className="text-[13px] font-bold text-[#19211C] dark:text-white mb-1.5">{section.heading}</h4>
                                                    <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">{section.body}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Resume Tab ─── */}
                    {activeTab === "resume" && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[14px] text-gray-600 dark:text-gray-300">Monishwar Rajasekaran Resume.pdf</p>
                                <button className="flex items-center gap-2 px-5 py-2.5 bg-[#13C065] hover:bg-[#10A958] text-white rounded-full text-[13px] font-semibold transition-colors cursor-pointer">
                                    Download Resume
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                            {/* Resume Preview */}
                            <div className="bg-white border border-gray-200 dark:border-white/5 rounded-2xl p-8 sm:p-12 min-h-[600px]">
                                {/* Name */}
                                <h2 className="text-[42px] font-bold text-[#2D2D2D] leading-tight tracking-tight">MARSELINA</h2>
                                <h2 className="text-[42px] font-bold text-[#2D2D2D] leading-tight tracking-tight">ZALIYANTI</h2>
                                <p className="text-[16px] text-[#666] mt-2 tracking-wide">Accountant</p>

                                {/* Contact Info */}
                                <div className="flex flex-col gap-2.5 mt-6 ml-auto w-fit absolute right-16 top-[180px]" style={{ position: "relative", marginLeft: "auto" }}>
                                    <div className="flex items-center gap-3 text-[13px] text-[#444]">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#13C065" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                                        +123-456-7890
                                    </div>
                                    <div className="flex items-center gap-3 text-[13px] text-[#444]">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#13C065" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                        hello@reallygreatsite.com
                                    </div>
                                    <div className="flex items-center gap-3 text-[13px] text-[#444]">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#13C065" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                        123 Anywhere St., Any City
                                    </div>
                                    <div className="flex items-center gap-3 text-[13px] text-[#444]">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#13C065" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                                        www.reallygreatsite.com
                                    </div>
                                </div>

                                {/* Work Experience Section */}
                                <div className="mt-10">
                                    <div className="bg-[#F0F0F0] rounded-lg px-5 py-3 mb-6">
                                        <h3 className="text-[16px] font-bold text-[#2D2D2D] tracking-widest uppercase">Work Experience</h3>
                                    </div>

                                    <div className="flex gap-8 mb-8">
                                        <div className="text-[13px] text-[#888] w-[160px] shrink-0">
                                            <p>Ingoude Company</p>
                                            <p>2019 - Present</p>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-[14px] font-bold text-[#2D2D2D] mb-2">Senior Accountant</h4>
                                            <p className="text-[13px] text-[#666] leading-relaxed">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-8">
                                        <div className="text-[13px] text-[#888] w-[160px] shrink-0">
                                            <p>Ingoude Company</p>
                                            <p>2019 - Present</p>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-[14px] font-bold text-[#2D2D2D] mb-2">Accountant</h4>
                                            <p className="text-[13px] text-[#666] leading-relaxed">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Certificate Tabs ─── */}
                    {(activeTab === "certificate1" || activeTab === "certificate2") && (
                        <div className="bg-white dark:bg-[#1F2320] border border-gray-200 dark:border-white/5 rounded-2xl p-8 min-h-[400px] flex items-center justify-center">
                            <div className="text-center text-gray-400 dark:text-gray-500">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-gray-300">
                                    <circle cx="12" cy="8" r="6" />
                                    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                                </svg>
                                <p className="text-[14px] font-medium">{activeTab === "certificate1" ? "Certificate 1" : "Certificate 2"}</p>
                                <p className="text-[12px] mt-1">Certificate preview will appear here</p>
                            </div>
                        </div>
                    )}

                    {/* ─── Applied Jobs Tab ─── */}
                    {activeTab === "applied_jobs" && (
                        <div className="flex flex-col gap-5">
                            {/* Filters */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="relative w-full md:w-[350px]">
                                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search by name, mobile, or Origin BI ID..."
                                        className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-[13px] text-[#19211C] dark:text-white focus:outline-none focus:border-brand-green/50 transition-colors"
                                    />
                                </div>
                                <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide shrink-0">
                                    <button className="flex items-center gap-2 bg-[#13C065]/10 border border-[#13C065]/20 hover:bg-[#13C065]/20 text-[#064E3B] dark:text-[#A7E9C0] px-4 py-2 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap cursor-pointer">
                                        Hired
                                        <ChevronDownIcon className="w-3.5 h-3.5" />
                                    </button>
                                    <button className="flex items-center gap-2 bg-[#13C065]/10 border border-[#13C065]/20 hover:bg-[#13C065]/20 text-[#064E3B] dark:text-[#A7E9C0] px-4 py-2 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap cursor-pointer">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        09 Oct to 17 Nov 2025
                                        <ChevronDownIcon className="w-3.5 h-3.5" />
                                    </button>
                                    <button className="flex items-center gap-2 bg-[#13C065]/10 border border-[#13C065]/20 hover:bg-[#13C065]/20 text-[#064E3B] dark:text-[#A7E9C0] px-4 py-2 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap cursor-pointer">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                        </svg>
                                        Alignment (90% - 100%)
                                        <ChevronDownIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-white dark:bg-[#1F2320] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[13px]">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-white/5">
                                                <th className="text-left px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                    Job Title
                                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="inline ml-1 opacity-40"><path d="M4 0L7 3H1L4 0ZM4 8L1 5H7L4 8Z" /></svg>
                                                </th>
                                                <th className="text-left px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                    Role Alignment
                                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="inline ml-1 opacity-40"><path d="M4 0L7 3H1L4 0ZM4 8L1 5H7L4 8Z" /></svg>
                                                </th>
                                                <th className="text-left px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                    Posted Date
                                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="inline ml-1 opacity-40"><path d="M4 0L7 3H1L4 0ZM4 8L1 5H7L4 8Z" /></svg>
                                                </th>
                                                <th className="text-left px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                    Applied Date
                                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="inline ml-1 opacity-40"><path d="M4 0L7 3H1L4 0ZM4 8L1 5H7L4 8Z" /></svg>
                                                </th>
                                                <th className="text-left px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                    Close Date
                                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="inline ml-1 opacity-40"><path d="M4 0L7 3H1L4 0ZM4 8L1 5H7L4 8Z" /></svg>
                                                </th>
                                                <th className="text-left px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Current Status</th>
                                                <th className="text-left px-5 py-3.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {appliedJobs.map((job) => (
                                                <tr key={job.id} className="border-b border-gray-100 dark:border-white/5 last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-5 py-4">
                                                        <div>
                                                            <p className="font-semibold text-[#19211C] dark:text-white">{job.title}</p>
                                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{job.company} - Chennai · {job.employmentType}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex gap-0.5">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <svg key={star} width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={star <= 4 ? "text-[#13C065]" : "text-[#13C065]/30"}>
                                                                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                                                    </svg>
                                                                ))}
                                                            </div>
                                                            <span className="text-[#13C065] font-semibold text-[12px]">{job.roleAlignment}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{job.postedDate}</td>
                                                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{job.appliedDate}</td>
                                                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{job.closeDate}</td>
                                                    <td className="px-5 py-4">
                                                        {job.status === "-" ? (
                                                            <span className="text-gray-400">-</span>
                                                        ) : (
                                                            <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold ${STATUS_COLORS[job.status]}`}>
                                                                {job.status}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <button className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 dark:text-gray-300">
                                                                <circle cx="12" cy="5" r="1.5" />
                                                                <circle cx="12" cy="12" r="1.5" />
                                                                <circle cx="12" cy="19" r="1.5" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-4 pb-4">
                <div className="flex items-center gap-4">
                    <span className="text-brand-green hover:underline cursor-pointer">Privacy Policy</span>
                    <span className="text-brand-green hover:underline cursor-pointer">Terms & Conditions</span>
                </div>
                <span>
                    &copy; 2025 Origin BI, Made with{" "}
                    <span className="text-brand-green hover:underline cursor-pointer">Touchmark Descience Pvt. Ltd</span>
                </span>
            </div>
        </div>
    );
}
