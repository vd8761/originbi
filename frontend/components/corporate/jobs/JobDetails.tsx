import React, { useState } from "react";
import { ChevronDownIcon, SearchIcon, ClockIcon, MapPinIcon, StarIcon, CheckCircle2, XCircle } from "lucide-react";
import CandidateDetail from "../candidates/CandidateDetail";

export interface JobDetailsProps {
    jobId: string;
    onBack?: () => void;
}

// ─── Mock Data for Job Details ──────────────────────────────────
// TODO: Replace with real API data later
const mockJobDetail = {
    id: "1",
    title: "UI/UX Designer",
    company: "Google Inc",
    location: "Chennai",
    employmentType: "Full Time",
    jobId: "18722765562",
    workMode: "Onsite",
    shift: "Day Shift",
    experienceLevel: "Fresher",
    annualCTC: "3,50,000 - 4,00,000",
    postedDate: "27 December 2025",
    closingDate: "28 February 2026",
    jobDescription: "We are looking for creative and passionate students or recent graduates to join our team as UX/UI Designers.\nThis role is ideal for freshers who want to learn, gain practical experience, and build a strong portfolio while working on real projects.",
    responsibilities: [
        "Design wireframes, UI screens, and simple prototypes",
        "Collaborate with developers to ensure accurate design implementation",
        "Participate in design discussions and review sessions",
        "Assist in improving user experience across products",
        "Maintain visual consistency and design standards",
    ],
    eligibility: [
        "Final-year students & recent graduates",
        "2024 / 2025 pass-outs",
        "Basic UI/UX knowledge",
        "Portfolio or academic projects accepted",
    ],
    requiredSkills: ["Figma", "Prototyping", "Wire Framing", "Adobe XD"],
    niceToHaveSkills: "Basic knowledge of HTML/CSS, Awareness of responsive design principles, Any prior academic, personal, or internship project experience",
    whatYouWillLearn: [
        "Industry-standard UI/UX design workflows",
        "Working with real product requirements and timelines",
        "Collaboration with cross-functional teams",
        "Iterating designs based on feedback and usability insights",
        "Exposure to professional design systems and best practices",
    ],
    companyDetails: "Google is a global tech leader known for innovation, offering students and freshers opportunities to learn, work on real projects, and grow in a creative culture.",
    counts: {
        all: 100,
        new: 20,
        shortlisted: 20,
        hired: 17,
        rejected: 12,
    }
};

// ─── Mock Candidates Data ───────────────────────────────────────
export interface Candidate {
    id: string;
    name: string;
    originId: string;
    location: string;
    postedTime: string;
    trait: string;
    traitColor: string;
    skills: string[];
    alignment: string;
    avatar: string;
}

const mockCandidates: Candidate[] = [
    {
        id: "202001256_1",
        name: "Monishwar Rajasekaran",
        originId: "202001256",
        location: "", // No location for this one in image
        postedTime: "2 days ago",
        trait: "Supportive Energizer",
        traitColor: "border-[#FFB020] text-[#FFB020]",
        skills: ["Figma", "UX Design", "Wire Framing", "+3 more"],
        alignment: "92%",
        avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    },
    {
        id: "202001256_2",
        name: "Giyu Tomioka",
        originId: "202001256",
        location: "Chennai, Tamil Nadu",
        postedTime: "2 days ago",
        trait: "Analytical Leader",
        traitColor: "border-[#33B6FF] text-[#33B6FF]",
        skills: ["Figma", "UX Design", "Wire Framing"],
        alignment: "92%",
        avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    },
    {
        id: "202001256_3",
        name: "Majiro Sano",
        originId: "202001256",
        location: "",
        postedTime: "2 days ago",
        trait: "Strategic Stabilizer",
        traitColor: "border-[#FF7A00] text-[#FF7A00]",
        skills: ["Figma", "UX Design", "Wire Framing"],
        alignment: "92%",
        avatar: "https://i.pravatar.cc/150?u=a04258a2462d826712d",
    },
    {
        id: "202001256_4",
        name: "Eren Yeager",
        originId: "202001256",
        location: "",
        postedTime: "2 days ago",
        trait: "Collaborative Optimist",
        traitColor: "border-[#13C065] text-[#13C065]",
        skills: ["Figma", "UX Design", "Wire Framing", "+1 more"],
        alignment: "92%",
        avatar: "https://i.pravatar.cc/150?u=a042581f4e29026702d",
    },
    {
        id: "202001256_5",
        name: "Sakuna",
        originId: "202001256",
        location: "",
        postedTime: "2 days ago",
        trait: "Dependable Specialist",
        traitColor: "border-[#00E5FF] text-[#00E5FF]",
        skills: ["Figma", "UX Design", "Wire Framing", "+2 more"],
        alignment: "92%",
        avatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d",
    },
    {
        id: "202001256_6",
        name: "Taki Tachibana",
        originId: "202001256",
        location: "",
        postedTime: "2 days ago",
        trait: "Structured Supporter",
        traitColor: "border-[#FF4A8D] text-[#FF4A8D]",
        skills: ["Figma", "UX Design", "Wire Framing"],
        alignment: "92%",
        avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024e",
    }
];

type TabKey = "job_details" | "all" | "new" | "shortlisted" | "hired" | "rejected";

export default function JobDetails({ jobId, onBack }: JobDetailsProps) {
    const [activeTab, setActiveTab] = useState<TabKey>("job_details");
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

    // TODO: Fetch data from backend using jobId
    const job = mockJobDetail;

    // Show CandidateDetail when a candidate is selected
    if (selectedCandidateId) {
        const selectedCandidate = mockCandidates.find((candidate) => candidate.id === selectedCandidateId);

        return (
            <CandidateDetail
                candidateId={selectedCandidateId}
                jobTitle={job.title}
                candidateData={selectedCandidate ? {
                    name: selectedCandidate.name,
                    originId: selectedCandidate.originId,
                    avatar: selectedCandidate.avatar,
                    trait: selectedCandidate.trait,
                    traitColor: selectedCandidate.traitColor,
                    alignment: selectedCandidate.alignment,
                } : undefined}
                onBack={() => setSelectedCandidateId(null)}
            />
        );
    }

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
                <span className="text-brand-green font-semibold">Job Overview</span>
            </div>

            {/* Header: Title & Company Info & Edit Btn */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-[32px] font-semibold text-[#19211C] dark:text-white mb-2 leading-tight">
                        {job.title}
                    </h1>
                    <div className="flex items-center gap-2 text-[14px] text-gray-600 dark:text-gray-300">
                        <span>{job.company}</span>
                        <span className="text-gray-400 dark:text-gray-500">•</span>
                        <span>{job.location}</span>
                        <span className="text-gray-400 dark:text-gray-500">•</span>
                        <span>{job.employmentType}</span>
                        <span className="text-gray-400 dark:text-gray-500 ml-4">|</span>
                        <span className="ml-4">Job ID : {job.jobId}</span>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-[18px] py-[8px] bg-white dark:bg-[#2A302C]/60 hover:bg-[#343D38] border border-gray-200 dark:border-white/5 rounded-full text-[13px] font-medium text-[#19211C] dark:text-white transition-colors cursor-pointer shadow-sm">
                    Edit
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#13C065" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-100">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                </button>
            </div>

            {/* Tabs + Dates Row */}
            <div className="flex flex-col xl:flex-row justify-between items-end xl:items-center border-b border-brand-light-tertiary dark:border-white/10 pb-0 gap-4 xl:gap-0 mt-4">
                {/* Tabs */}
                <div className="flex items-center w-full xl:w-auto overflow-x-auto scrollbar-hide">
                    {([
                        { key: "job_details" as TabKey, label: "Job Details", count: null },
                        { key: "all" as TabKey, label: "All", count: job.counts.all },
                        { key: "new" as TabKey, label: "New", count: job.counts.new },
                        { key: "shortlisted" as TabKey, label: "Shortlisted", count: job.counts.shortlisted },
                        { key: "hired" as TabKey, label: "Hired", count: job.counts.hired },
                        { key: "rejected" as TabKey, label: "Rejected", count: job.counts.rejected },
                    ]).map((tab) => (
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
                            {tab.count !== null && (
                                <span className={activeTab === tab.key ? "text-brand-green font-semibold ml-1.5" : "text-gray-400 dark:text-gray-500 font-medium ml-1.5"}>
                                    ({tab.count})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Dates */}
                <div className="flex items-center gap-5 py-2 w-full xl:w-auto justify-end flex-wrap text-[13px]">
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-brand-green">
                            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Posted on {job.postedDate}
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green flex-shrink-0" />
                        Closes at {job.closingDate}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === "job_details" && (
                <div className="flex flex-col gap-6 mt-4 bg-white dark:bg-[#1F2320] border border-gray-200 dark:border-white/5 rounded-[14px] px-6 py-6">
                    {/* Stats Ribbon */}
                    <div className="flex items-center justify-start py-2 gap-7 overflow-x-auto scrollbar-hide whitespace-nowrap">

                        <div className="flex items-center gap-3.5 pr-1">
                            <div className="w-11 h-11 rounded-full bg-white dark:bg-[#2A302C] flex items-center justify-center text-[#13C065] shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[12px] text-gray-500 dark:text-gray-400 mb-0.5">Employment Type</span>
                                <span className="text-[15px] font-semibold text-[#19211C] dark:text-white leading-tight">{job.employmentType}</span>
                            </div>
                        </div>

                        <div className="w-[1px] h-8 bg-white/10 shrink-0" />

                        <div className="flex items-center gap-3.5 pr-1">
                            <div className="w-11 h-11 rounded-full bg-white dark:bg-[#2A302C] flex items-center justify-center text-[#13C065] shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[12px] text-gray-500 dark:text-gray-400 mb-0.5">Work Mode</span>
                                <span className="text-[15px] font-semibold text-[#19211C] dark:text-white leading-tight">{job.workMode}</span>
                            </div>
                        </div>

                        <div className="w-[1px] h-8 bg-white/10 shrink-0" />

                        <div className="flex items-center gap-3.5 pr-1">
                            <div className="w-11 h-11 rounded-full bg-white dark:bg-[#2A302C] flex items-center justify-center text-[#13C065] shrink-0">
                                {/* Sun/Moon Shift Icon */}
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="4" />
                                    <path d="M12 3v2M12 19v2M3.5 12h2M18.5 12h2M5.5 5.5l1.5 1.5M17 17l1.5 1.5M5.5 18.5l1.5-1.5M17 7l1.5-1.5" />
                                    <path d="M15 9a5 5 0 0 1 0 6 7 7 0 0 0 0-6Z" fill="currentColor" stroke="none" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[12px] text-gray-500 dark:text-gray-400 mb-0.5">Shift</span>
                                <span className="text-[15px] font-semibold text-[#19211C] dark:text-white leading-tight">{job.shift}</span>
                            </div>
                        </div>

                        <div className="w-[1px] h-8 bg-white/10 shrink-0" />

                        <div className="flex items-center gap-3.5 pr-1">
                            <div className="w-11 h-11 rounded-full bg-white dark:bg-[#2A302C] flex items-center justify-center text-[#13C065] shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[12px] text-gray-500 dark:text-gray-400 mb-0.5">Experience Level</span>
                                <span className="text-[15px] font-semibold text-[#19211C] dark:text-white leading-tight">{job.experienceLevel}</span>
                            </div>
                        </div>

                        <div className="w-[1px] h-8 bg-white/10 shrink-0" />

                        <div className="flex items-center gap-3.5 pr-1">
                            <div className="w-11 h-11 rounded-full bg-white dark:bg-[#2A302C] flex items-center justify-center text-[#13C065] shrink-0 font-bold text-[19px]">
                                ₹
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[12px] text-gray-500 dark:text-gray-400 mb-0.5">Annual CTC</span>
                                <span className="text-[15px] font-semibold text-[#19211C] dark:text-white leading-tight">{job.annualCTC}</span>
                            </div>
                        </div>
                    </div>

                    {/* Job Details Body */}
                    <div className="flex flex-col gap-8 max-w-4xl text-[14.5px] text-gray-800 dark:text-gray-200 mt-2">

                        {/* Summary / Description */}
                        <div>
                            <h3 className="text-[13px] font-semibold text-[#19211C] dark:text-white mb-2.5">Job Description</h3>
                            <p className="leading-relaxed whitespace-pre-line text-gray-700 dark:text-gray-300">
                                {job.jobDescription}
                            </p>
                        </div>

                        {/* Responsibilities */}
                        <div>
                            <h3 className="text-[13px] font-semibold text-[#19211C] dark:text-white mb-2.5">Responsibilities</h3>
                            <ul className="flex flex-col gap-2.5">
                                {job.responsibilities.map((resp, i) => (
                                    <li key={i} className="flex flex-row items-start gap-2 text-gray-700 dark:text-gray-300">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#13C065] shrink-0 mt-0.5">
                                            <path d="M12 2L14.07 9.93L22 12L14.07 14.07L12 22L9.93 14.07L2 12L9.93 9.93L12 2Z" />
                                        </svg>
                                        <span>{resp}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Eligibility */}
                        <div>
                            <h3 className="text-[13px] font-semibold text-[#19211C] dark:text-white mb-2.5">Eligibility</h3>
                            <ul className="flex flex-col gap-2.5">
                                {job.eligibility.map((elig, i) => (
                                    <li key={i} className="flex flex-row items-start gap-2 text-gray-700 dark:text-gray-300">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#13C065] shrink-0 mt-0.5">
                                            <path d="M12 2L14.07 9.93L22 12L14.07 14.07L12 22L9.93 14.07L2 12L9.93 9.93L12 2Z" />
                                        </svg>
                                        <span>{elig}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Required Skills */}
                        <div>
                            <h3 className="text-[13px] font-semibold text-[#19211C] dark:text-white mb-3">Required Skills (Mandatory for shortlisting)</h3>
                            <div className="flex flex-wrap gap-2.5">
                                {job.requiredSkills.map((skill, i) => (
                                    <span key={i} className="px-4 py-[7px] rounded-full border border-gray-300 dark:border-white/10 bg-white dark:bg-[#1A1F1C] text-[13px] font-medium text-[#19211C] dark:text-white">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Nice to Have */}
                        <div>
                            <h3 className="text-[13px] font-semibold text-[#19211C] dark:text-white mb-2">Nice-to-Have Skills</h3>
                            <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                                {job.niceToHaveSkills}
                            </p>
                        </div>

                        {/* What You Will Learn */}
                        <div>
                            <h3 className="text-[13px] font-semibold text-[#19211C] dark:text-white mb-2.5">What You Will Learn</h3>
                            <ul className="flex flex-col gap-2.5">
                                {job.whatYouWillLearn.map((learn, i) => (
                                    <li key={i} className="flex flex-row items-start gap-2 text-gray-700 dark:text-gray-300">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#13C065] shrink-0 mt-0.5">
                                            <path d="M12 2L14.07 9.93L22 12L14.07 14.07L12 22L9.93 14.07L2 12L9.93 9.93L12 2Z" />
                                        </svg>
                                        <span>{learn}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Company Details */}
                        <div>
                            <h3 className="text-[13px] font-semibold text-[#19211C] dark:text-white mb-2.5">Company Details</h3>
                            <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                                {job.companyDetails}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Candidates Grid View for other tabs */}
            {activeTab !== "job_details" && (
                <div className="flex-1 flex flex-col mt-4">

                    {/* Filters Bar */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 relative z-10">
                        {/* Search Input */}
                        <div className="relative w-full md:w-[350px]">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by name, skill..."
                                className="w-full bg-transparent border border-white/10 rounded-full pl-10 pr-4 py-2 text-[13px] text-[#19211C] dark:text-white focus:outline-none focus:border-brand-green/50 transition-colors"
                            />
                        </div>

                        {/* Dropdown Filters */}
                        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto scrollbar-hide shrink-0 pb-1 md:pb-0">
                            <button className="flex items-center gap-2 bg-[#13C065]/10 border border-[#13C065]/20 hover:bg-[#13C065]/20 text-[#064E3B] dark:text-[#A7E9C0] px-4 py-2 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap cursor-pointer">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                09 Oct to 17 Nov 2025
                                <ChevronDownIcon className="w-3.5 h-3.5 ml-1" />
                            </button>
                            <button className="flex items-center gap-2 bg-[#13C065]/10 border border-[#13C065]/20 hover:bg-[#13C065]/20 text-[#064E3B] dark:text-[#A7E9C0] px-4 py-2 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap cursor-pointer">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                </svg>
                                Alignment (90% - 100%)
                                <ChevronDownIcon className="w-3.5 h-3.5 ml-1" />
                            </button>
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
                        {mockCandidates.map((cad) => (
                            <div key={cad.id} className="bg-white dark:bg-[#1F2320]/80 border border-gray-200 dark:border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors flex flex-col gap-4">

                                {/* Top Section */}
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        {/* Avatar */}
                                        <div className="w-[52px] h-[52px] rounded-full overflow-hidden border border-white/10 shrink-0">
                                            <img src={cad.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        </div>
                                        {/* Name & Details */}
                                        <div className="flex flex-col mt-0.5">
                                            <h3 className="text-[15px] font-bold text-[#19211C] dark:text-white mb-1.5 leading-none">{cad.name}</h3>
                                            <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium mb-1">Origin ID : {cad.originId}</p>
                                            {cad.location && (
                                                <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                                                    <MapPinIcon className="w-3 h-3 text-gray-500" /> {cad.location}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Time & Links */}
                                    <div className="flex items-center gap-1.5 text-[11px] font-medium shrink-0">
                                        <ClockIcon className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                        <span className="text-gray-500 dark:text-gray-400">{cad.postedTime}</span>
                                        <span className="text-gray-600 mx-0.5">|</span>
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedCandidateId(cad.id); }} className="text-[#13C065] hover:text-[#10A958] transition-colors cursor-pointer">View Details</button>
                                    </div>
                                </div>

                                {/* Skills Row */}
                                <div className="flex items-end justify-between mt-1">
                                    <div className="flex flex-wrap items-center gap-2 max-w-[70%]">
                                        {cad.skills.map((s, idx) => (
                                            <span key={idx} className="bg-white text-[#111412] px-3 py-[5px] rounded-full text-[11px] font-bold shadow-sm whitespace-nowrap">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                    {/* Trait Badge */}
                                    <div className={`px-3 py-1.5 rounded-full border bg-[#F8F9FA] dark:bg-[#111412]/50 text-[11px] font-semibold tracking-wide whitespace-nowrap shrink-0 shadow-sm ${cad.traitColor}`}>
                                        <span className="opacity-70 font-medium">Trait:</span> {cad.trait}
                                    </div>
                                </div>

                                {/* Divider */}
                                {/* No divider across the card visually in image, just space */}
                                <div className="h-[1px] w-full bg-white/5 my-1" />

                                {/* Footer Row */}
                                <div className="flex items-center justify-between">
                                    {/* Alignment Score */}
                                    <div className="flex flex-col gap-1.5">
                                        <p className="text-[11px] font-bold text-[#19211C] dark:text-white">
                                            Role Alignment : <span className="text-[#13C065]">{cad.alignment}</span>
                                        </p>
                                        <div className="flex gap-1 text-[#13C065]">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={star === 5 ? "opacity-40" : ""}>
                                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3">
                                        <button className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-semibold transition-colors cursor-pointer shadow-sm ${activeTab === 'hired' ? 'bg-[#13C065] text-[#111412] border border-transparent' : 'bg-white/5 hover:bg-white/10 text-[#19211C] dark:text-white border border-gray-200 dark:border-white/5'}`}>
                                            <CheckCircle2 className={`w-[14px] h-[14px] ${activeTab === 'hired' ? 'text-[#111412]' : 'text-[#13C065]'}`} strokeWidth={3} />
                                            Hire
                                        </button>
                                        <button className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-semibold transition-colors cursor-pointer shadow-sm ${activeTab === 'shortlisted' ? 'bg-[#FFB020] text-[#111412] border border-transparent' : 'bg-white/5 hover:bg-white/10 text-[#19211C] dark:text-white border border-gray-200 dark:border-white/5'}`}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={`${activeTab === 'shortlisted' ? 'text-[#111412]' : 'text-[#FFB020]'}`}>
                                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                            </svg>
                                            Shortlist
                                        </button>
                                        <button className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-semibold transition-colors cursor-pointer shadow-sm ${activeTab === 'rejected' ? 'bg-[#FF4A4A] text-[#19211C] dark:text-white border border-transparent' : 'bg-white/5 hover:bg-white/10 text-[#19211C] dark:text-white border border-gray-200 dark:border-white/5'}`}>
                                            <XCircle className={`w-[14px] h-[14px] ${activeTab === 'rejected' ? 'text-[#19211C] dark:text-white' : 'text-[#FF4A4A]'}`} strokeWidth={3} />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-center gap-2 mt-2 mb-10 pb-8 text-[13px] font-medium text-gray-500 dark:text-gray-400">
                        <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer">&lt;</button>
                        <button className="w-8 h-8 rounded flex items-center justify-center bg-[#13C065] text-[#111412] font-bold">1</button>
                        <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-white/5 hover:text-[#19211C] dark:text-white transition-colors cursor-pointer border border-transparent hover:border-white/10">2</button>
                        <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-white/5 hover:text-[#19211C] dark:text-white transition-colors cursor-pointer border border-transparent hover:border-white/10">3</button>
                        <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-white/5 hover:text-[#19211C] dark:text-white transition-colors cursor-pointer border border-transparent hover:border-white/10">4</button>
                        <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-white/5 hover:text-[#19211C] dark:text-white transition-colors cursor-pointer border border-transparent hover:border-white/10">5</button>
                        <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-white/5 hover:text-[#19211C] dark:text-white transition-colors cursor-pointer border border-transparent hover:border-white/10">6</button>
                        <span className="px-1 text-gray-600">...</span>
                        <button className="min-w-8 px-2 h-8 rounded flex items-center justify-center hover:bg-white/5 hover:text-[#19211C] dark:text-white transition-colors cursor-pointer border border-transparent hover:border-white/10">144</button>
                        <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer">&gt;</button>
                    </div>

                </div>
            )}
        </div>
    );
}
