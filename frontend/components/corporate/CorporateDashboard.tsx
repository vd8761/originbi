import React, { useEffect, useState, useRef } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Search, Edit2, MoreHorizontal, CheckCircle, Clock, Users, Briefcase, Eye } from "lucide-react";
import { TrendUpIcon, TrendDownIcon, CircleArrowUpIcon, DiamondIcon } from '../icons';
import { CorporateAccount } from '../../lib/types';
import { corporateDashboardService } from '../../lib/services';
import { ToastContainer, ToastMessage } from '../ui/Toast';
import BuyCreditsModal from './BuyCreditsModal';


// --- Types ---
interface MiniStatsData {
    totalRegistrations: number;
    newRegistrationsThisMonth: number;
    assessmentsAssigned: number;
    assessmentsCompleted: number;
    registrationsTrend: number;
    assessmentsAssignedTrend: number;
    assessmentsCompletedTrend: number;
}

interface AssessmentInsight {
    month: string;
    year: number;
    assigned: number;
    completed: number;
}

interface PipelineOverviewData {
    totalRegistered: number;
    assessmentsAssigned: number;
    assessmentsInProgress: number;
    assessmentsCompleted: number;
}

interface TraitData {
    traitName: string;
    count: number;
    colorRgb: string;
}

interface PersonalityDistributionData {
    totalWithTraits: number;
    topTraits: TraitData[];
}

interface DashboardStats {
    companyName: string;
    availableCredits: number;
    totalCredits: number;
    studentsRegistered: number;
    isActive: boolean;
    perCreditCost: number;
    miniStats: MiniStatsData;
    assessmentInsights: AssessmentInsight[];
    pipelineOverview: PipelineOverviewData;
    personalityDistribution: PersonalityDistributionData;
    recentParticipants: Participant[];
}

interface Participant {
    id: string;
    name: string;
    programType: string;
    status: boolean;
    registerDate: string;
    mobile: string;
}

// --- Icons / Graphics ---
// (Icons are imported from @/components/icons)

// --- Components ---
const API_URL = process.env.NEXT_PUBLIC_CORPORATE_API_URL;

// --- Custom Icons ---
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
            <span className="text-[clamp(14px,1vw,16px)] text-[#19211C] dark:text-white font-normal whitespace-nowrap">{label}</span>
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

const CreditsCard = ({ credits, onBuy }: { credits: number, onBuy: () => void }) => (
    <div className="relative overflow-hidden rounded-[32px] p-8 h-full bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] border border-[#E0E0E0] dark:border-white/10 flex flex-col items-center justify-between shadow-sm">
        {/* Bottom Gradient - CSS Based for Better Visibilty */}
        <div
            className="absolute -bottom-[30%] -left-[10%] -right-[10%] h-[180px] blur-[50px] pointer-events-none opacity-100"
            style={{
                background: 'linear-gradient(90deg, #ED2F34 0%, #EF5921 33%, #FDC00C 66%, #1ED36A 100%)'
            }}
        ></div>

        {/* Watermark Number */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <span className="font-['Haskoy'] font-extrabold text-[clamp(140px,20vw,380px)] text-[#19211C] dark:text-white opacity-[0.02] leading-none select-none tracking-normal">
                {credits}
            </span>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full flex flex-col h-full justify-between">
            {/* Header */}
            <div className="w-full text-left">
                <h3 className="font-['Haskoy'] font-semibold text-[20px] text-[#19211C] dark:text-white leading-none">Credits Summary</h3>
            </div>

            {/* Center Content - Left Aligned "Your Balance" */}
            <div className="flex-1 flex flex-col justify-center items-center py-4">
                <div className="flex flex-col items-start">
                    <div className="font-['Haskoy'] font-normal text-[14px] text-[#19211C] dark:text-white mb-4 text-left pl-1 opacity-90">Your balance</div>
                    <div className="font-['Haskoy'] font-medium text-[clamp(90px,6vw,130px)] text-[#150089] dark:text-white leading-[0.85] tracking-tight">
                        {credits}
                    </div>
                </div>
            </div>

            {/* Button - Increased Text Size and Padding */}
            <div className="flex justify-center">
                <button
                    onClick={onBuy}
                    className="font-['Haskoy'] font-medium text-[clamp(16px,1vw,18px)] text-white bg-[#1ED36A] hover:bg-[#16b058] px-12 py-3.5 rounded-full shadow-lg shadow-[#1ED36A]/20 transition-all"
                >
                    Buy now
                </button>
            </div>
        </div>
    </div>
);

const AssessmentBarChart = ({ insights }: { insights: AssessmentInsight[] }) => {
    const chartData = insights.length > 0
        ? insights.map(d => ({ label: d.month, assigned: d.assigned, completed: d.completed }))
        : [
            { label: 'Jan', assigned: 0, completed: 0 },
            { label: 'Feb', assigned: 0, completed: 0 },
            { label: 'Mar', assigned: 0, completed: 0 },
            { label: 'Apr', assigned: 0, completed: 0 },
            { label: 'May', assigned: 0, completed: 0 },
        ];

    const maxVal = Math.max(...chartData.flatMap(d => [d.assigned, d.completed]), 1);
    const max = Math.ceil(maxVal / 100) * 100 || 100;
    const yLabels = Array.from({ length: 4 }, (_, i) => max - (i * max / 4));

    return (
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] p-8 border border-[#E0E0E0] dark:border-white/10 h-full flex flex-col font-['Haskoy'] overflow-visible shadow-sm">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-[clamp(18px,1.2vw,22px)] font-semibold text-[#19211C] dark:text-white leading-none">Assessment Insights</h3>
                <div className="flex gap-4 text-[clamp(12px,0.8vw,14px)] font-medium text-[#19211C] dark:text-white">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#150089] dark:bg-white"></span> Assigned</div>
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#1ED36A]"></span> Completed</div>
                </div>
            </div>

            <div className="flex-1 flex gap-4">
                {/* Y Axis */}
                <div className="flex flex-col justify-between text-[#19211C] dark:text-white font-light text-[clamp(14px,1vw,17px)] pb-8 pt-2">
                    {yLabels.map((v, i) => <span key={i}>{v}</span>)}
                </div>

                {/* Chart Area */}
                <div className="flex-1 flex justify-between items-end pb-1 relative">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-4">
                        <div className="border-b border-dashed border-gray-200 dark:border-white/5 w-full h-0"></div>
                        <div className="border-b border-dashed border-gray-200 dark:border-white/5 w-full h-0"></div>
                        <div className="border-b border-dashed border-gray-200 dark:border-white/5 w-full h-0"></div>
                        <div className="border-b border-dashed border-gray-200 dark:border-white/5 w-full h-0"></div>
                    </div>

                    {chartData.map((d, i) => (
                        <div key={i} className="relative flex flex-col items-center justify-end h-full gap-4 flex-1 group z-10 w-full cursor-pointer">
                            <div className="flex items-end gap-1 sm:gap-2 h-full relative justify-center w-full">
                                {/* Assigned Bar */}
                                <div className="w-[clamp(14px,1.5vw,28px)] bg-[#150089] dark:bg-white rounded-full transition-all duration-500 hover:opacity-90 relative" style={{ height: `${(d.assigned / max) * 100}%` }}>
                                    {/* Hover Dot */}
                                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#19211C] dark:bg-white border-2 border-white dark:border-[#19211C] rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-40"></div>
                                </div>
                                {/* Completed Bar */}
                                <div className="w-[clamp(14px,1.5vw,28px)] bg-[#1ED36A] rounded-full transition-all duration-500 hover:opacity-90 relative" style={{ height: `${(d.completed / max) * 100}%` }}>
                                    {/* Hover Dot */}
                                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#19211C] dark:bg-[#1ED36A] border-2 border-white dark:border-[#111111] rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-40"></div>
                                </div>

                                {/* Tooltip */}
                                <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/4 hidden group-hover:block z-50 pointer-events-none origin-bottom transition-all">
                                    {/* Glass Morphism Tooltip with Exact Design Specs */}
                                    <div className="relative backdrop-blur-[40px] bg-white/95 dark:bg-[#19211C]/80 border border-[#19211C]/10 dark:border-[#FFFFFF]/[0.08] rounded-2xl shadow-[0_8px_13.4px_-2px_rgba(0,0,0,0.4)] overflow-hidden min-w-[200px]">
                                        <div className="p-4 border-b border-[#19211C]/5 dark:border-white/5">
                                            <div className="font-['Haskoy'] font-medium text-[14px] text-[#19211C] dark:text-white leading-none whitespace-nowrap">
                                                {d.label === 'Jan' ? 'January' : d.label === 'Feb' ? 'February' : d.label === 'Mar' ? 'March' : d.label === 'Apr' ? 'April' : 'May'}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-transparent space-y-2">
                                            <div className="flex justify-between items-center text-[12px]">
                                                <span className="flex items-center gap-2 text-[#19211C] dark:text-white font-medium"><span className="w-1.5 h-1.5 rounded-full bg-[#150089] dark:bg-white"></span> Assigned</span>
                                                <span className="text-[#19211C] dark:text-white font-medium text-right">{d.assigned}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[12px]">
                                                <span className="flex items-center gap-2 text-[#19211C] dark:text-white font-medium"><span className="w-1.5 h-1.5 rounded-full bg-[#1ED36A]"></span> Completed</span>
                                                <span className="text-[#19211C] dark:text-white font-medium text-right">{d.completed}</span>
                                            </div>
                                        </div>

                                        {/* Completion Rate Footer */}
                                        <div className="px-4 py-3 bg-[#19211C] dark:bg-[#1ED36A]/20 backdrop-blur-sm border-t border-[#19211C] dark:border-white/5">
                                            <div className="text-[12px] font-medium text-white dark:text-[#1ED36A] flex justify-between items-center w-full">
                                                <span>Completion Rate :</span>
                                                <span className="text-[#1ED36A]">{Math.round((d.completed / (d.assigned + d.completed)) * 100)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Arrow: Fixed for Dark Mode Visibility (Green Tint) */}
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

const RecruitmentOverview = ({
    pipeline,
    onDateChange,
    selectedRange
}: {
    pipeline: PipelineOverviewData;
    onDateChange: (start: Date | null, end: Date | null, label: string) => void;
    selectedRange: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const dropdownRef = useRef<HTMLDivElement>(null);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (m: number | null, y: number | null) => {
        setIsOpen(false);
        if (m === null || y === null) {
            onDateChange(null, null, "All");
            return;
        }
        setSelectedMonth(m);
        setSelectedYear(y);

        const start = new Date(y, m, 1);
        const end = new Date(y, m + 1, 0);
        onDateChange(start, end, `${months[m]} ${y}`);
    };

    const maxVal = Math.max(pipeline.totalRegistered, 1);
    const items = [
        { label: 'Total Registered', val: pipeline.totalRegistered, max: maxVal },
        { label: 'Assessments Assigned', val: pipeline.assessmentsAssigned, max: maxVal },
        { label: 'In Progress', val: pipeline.assessmentsInProgress, max: maxVal },
        { label: 'Completed', val: pipeline.assessmentsCompleted, max: maxVal },
    ];

    return (
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] p-8 border border-[#E0E0E0] dark:border-white/10 h-full font-['Haskoy'] flex flex-col shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-[clamp(18px,1.2vw,22px)] font-semibold text-[#19211C] dark:text-white leading-none">
                    Assessment Pipeline
                </h3>

                {/* Selective Month/Year Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <div
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E0E0E0] dark:border-white/10 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                        <span className="text-[clamp(13px,1vw,15px)] font-normal text-[#19211C] dark:text-white leading-none whitespace-nowrap">
                            {selectedRange === "All" ? "All Records" : selectedRange}
                        </span>
                        <svg className={`w-4 h-4 text-[#19211C] dark:text-white opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>

                    {isOpen && (
                        <div className="absolute top-full right-0 mt-2 p-4 bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 min-w-[300px]">
                            <div
                                onClick={() => handleSelect(null, null)}
                                className="mb-4 px-4 py-2 rounded-xl text-center text-sm font-semibold bg-gray-100 dark:bg-white/5 text-[#19211C] dark:text-white cursor-pointer hover:bg-[#1ED36A] hover:text-white transition-colors"
                            >
                                All Time Records
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 max-h-[200px] overflow-y-auto scrollbar-hide">
                                    <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2 px-2">Month</div>
                                    {months.map((m, idx) => (
                                        <div
                                            key={m}
                                            onClick={() => handleSelect(idx, selectedYear)}
                                            className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${selectedRange !== "All" && selectedMonth === idx ? 'bg-[#1ED36A] text-white' : 'text-[#19211C] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                        >
                                            {m}
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-1 max-h-[200px] overflow-y-auto scrollbar-hide">
                                    <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2 px-2 text-center">Year</div>
                                    {years.map((y) => (
                                        <div
                                            key={y}
                                            onClick={() => handleSelect(selectedMonth, y)}
                                            className={`px-3 py-1.5 rounded-lg text-sm text-center cursor-pointer transition-colors ${selectedRange !== "All" && selectedYear === y ? 'bg-[#1ED36A] text-white' : 'text-[#19211C] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                        >
                                            {y}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats List */}
            <div className="space-y-6 flex-1">
                {items.map((item, i) => (
                    <div key={i} className="flex flex-col gap-3">
                        <div className="flex justify-between items-end">
                            <span className="text-[clamp(13px,1vw,15px)] font-normal text-[#19211C] dark:text-white leading-none">
                                {item.label}
                            </span>
                            <span className="text-[clamp(13px,1vw,15px)] font-semibold text-[#19211C] dark:text-white leading-none">
                                {item.val}
                            </span>
                        </div>
                        {/* Progress Bar Container - Adjusted Height */}
                        <div className="h-[clamp(6px,0.4vw,8px)] w-full bg-[#FAFAFA] dark:bg-white/5 rounded-full overflow-hidden border border-[#F5F5F5] dark:border-none">
                            {/* Progress Bar Fill */}
                            <div
                                className="h-full rounded-full bg-[#1ED36A]"
                                style={{ width: `${(item.val / item.max) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Updated Donut Chart & Personality Distribution ---
const RING_RADII = [90, 75, 60, 45];
const FALLBACK_COLORS = ['#C2185B', '#FBC02D', '#D4E157', '#D32F2F'];

const DonutChart = ({ total, traits }: { total: number; traits: TraitData[] }) => {
    const maxCount = Math.max(...traits.map(t => t.count), 1);
    return (
        <div className="relative w-[clamp(200px,14vw,260px)] h-[clamp(200px,14vw,260px)] mx-auto flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full rotate-[-90deg]">
                {traits.map((trait, i) => {
                    const r = RING_RADII[i] || 45;
                    const circumference = 2 * Math.PI * r;
                    const fillRatio = total > 0 ? trait.count / maxCount : 0;
                    const dashArray = `${fillRatio * circumference * 0.8}, ${circumference}`;
                    const color = trait.colorRgb || FALLBACK_COLORS[i] || '#1ED36A';
                    return (
                        <React.Fragment key={i}>
                            <circle cx="100" cy="100" r={r} fill="none" stroke="#e5e5e5" strokeWidth="10" strokeLinecap="round" className="dark:stroke-white/5" />
                            <circle cx="100" cy="100" r={r} fill="none" stroke={color} strokeWidth="10" strokeDasharray={dashArray} strokeDashoffset={`-${i * 20}`} strokeLinecap="round" />
                        </React.Fragment>
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="font-['Haskoy'] font-semibold text-[clamp(20px,1.5vw,26px)] text-[#150089] dark:text-[#1ED36A] leading-tight">{total}</span>
                <span className="font-['Haskoy'] font-normal text-[clamp(13px,1vw,15px)] text-[#19211C] dark:text-white leading-tight">Candidates</span>
            </div>
        </div>
    );
};

const PersonalityDistribution = ({ data }: { data: PersonalityDistributionData }) => {
    const traits = data.topTraits.length > 0 ? data.topTraits : [];
    return (
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] p-6 border border-[#E0E0E0] dark:border-white/10 h-full font-['Haskoy'] flex flex-col justify-between shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-3">
                    <h3 className="font-semibold text-[clamp(16px,1.04vw,20px)] text-[#19211C] dark:text-white leading-none">
                        Applicant Personality Distribution
                    </h3>
                    <div className="flex flex-row items-center gap-2 sm:gap-6 whitespace-nowrap">
                        <span className="font-normal text-[clamp(13px,1vw,15px)] text-[#19211C] dark:text-white">
                            Total Applicants : <span className="font-semibold">{data.totalWithTraits}</span>
                        </span>
                        <span className="flex items-center gap-1.5 font-semibold text-[clamp(13px,1vw,15px)] text-[#19211C] dark:text-white">
                            <span className="w-3 h-3 rounded-full bg-[#1ED36A]"></span> Top {traits.length}
                            <span className="font-normal">traits shown</span>
                        </span>
                    </div>
                </div>
                <button className="font-medium text-[clamp(13px,1vw,15px)] text-[#1ED36A] hover:underline whitespace-nowrap">
                    Know More
                </button>
            </div>

            {/* Content Row */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-6 flex-1">
                {/* Chart Left */}
                <div className="flex-shrink-0">
                    <DonutChart total={data.totalWithTraits} traits={traits} />
                </div>

                {/* Legend Right */}
                <div className="grid grid-cols-2 gap-4 w-full xl:flex xl:flex-col xl:w-auto xl:min-w-[140px]">
                    {traits.length > 0 ? traits.map((trait, i) => (
                        <div key={i} className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-4 rounded-full" style={{ backgroundColor: trait.colorRgb || FALLBACK_COLORS[i] || '#1ED36A' }}></span>
                                <span className="font-medium text-[clamp(20px,1.5vw,26px)] text-[#19211C] dark:text-white leading-none">{trait.count}</span>
                            </div>
                            <span className="font-medium text-[clamp(13px,1vw,15px)] text-[#19211C] dark:text-white leading-none pl-4">{trait.traitName}</span>
                        </div>
                    )) : (
                        <div className="col-span-2 text-center text-[clamp(13px,1vw,15px)] text-[#19211C] dark:text-white opacity-60">
                            No personality data yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ParticipantsTable = ({
    participants,
    onViewAll,
    onView
}: {
    participants: Participant[];
    onViewAll: () => void;
    onView: (id: string) => void;
}) => {
    const tableData = participants.map(p => ({
        id: p.id,
        name: p.name,
        type: p.programType,
        date: p.registerDate,
        mobile: p.mobile,
        status: p.status,
    }));

    return (
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] border border-[#E0E0E0] dark:border-white/10 h-full overflow-hidden flex flex-col font-['Haskoy'] shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-center p-6">
                <h3 className="font-semibold text-[clamp(16px,1.04vw,20px)] text-[#19211C] dark:text-white leading-none">
                    Recently Added Participants
                </h3>
                <span
                    onClick={onViewAll}
                    className="font-medium text-[clamp(13px,1vw,15px)] text-[#1ED36A] cursor-pointer hover:underline"
                >
                    View all
                </span>
            </div>

            {/* Table Area ... */}
            <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="bg-[#EAEAEA] dark:bg-white/5">
                            <th className="text-left py-3 pl-6 pr-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[25%]">Name</th>
                            <th className="text-left py-3 px-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[15%]">Program Type</th>
                            <th className="text-center py-3 px-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[10%]">Status</th>
                            <th className="text-left py-3 px-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[15%]">Registration Date</th>
                            <th className="text-left py-3 px-4 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[15%]">Mobile</th>
                            <th className="text-center py-3 pl-4 pr-6 font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none w-[10%]">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F5F5] dark:divide-white/5">
                        {tableData.map((row, i) => (
                            <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="py-3.5 pl-6 pr-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">
                                    {row.name}
                                </td>
                                <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">
                                    {row.type}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                    {/* Toggle Switch */}
                                    <div className={`w-[52px] h-[22px] relative flex items-center rounded-full p-1 transition-colors duration-300 mx-auto cursor-pointer ${row.status ? 'bg-[#1ED36A]' : 'bg-gray-300'}`}>
                                        <span className={`absolute left-2 text-[9px] font-bold text-white transition-opacity duration-300 ${row.status ? 'opacity-100' : 'opacity-0'}`}>ON</span>
                                        <span className={`absolute right-2 text-[9px] font-bold text-gray-600 transition-opacity duration-300 ${row.status ? 'opacity-0' : 'opacity-100'}`}>OFF</span>
                                        <div className={`w-[14px] h-[14px] bg-white rounded-full shadow-sm transform transition-transform duration-300 ${row.status ? 'translate-x-[30px]' : 'translate-x-0'} z-10`}></div>
                                    </div>
                                </td>
                                <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">
                                    {row.date}
                                </td>
                                <td className="py-3.5 px-4 font-medium text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-none">
                                    {row.mobile}
                                </td>
                                <td className="py-3.5 pl-4 pr-6 text-center">
                                    <div
                                        onClick={() => onView(row.id)}
                                        className="flex justify-center items-center cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                        <Eye className="w-[18px] h-[18px] text-[#1ED36A]" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Report Data Interface ---
interface ReportData {
    reportNumber: string;
    generatedAt: string;
    candidateName: string;
    email: string;
    mobile: string;
    gender: string;
    programName: string;
    assessmentTitle: string;
    departmentName: string;
    degreeTypeName: string;
    currentYear: string | null;
    institutionName: string | null;
    personalityTrait: {
        id: number;
        code: string;
        name: string;
        description: string;
        colorRgb: string;
        imageKey: string;
        characterImage: string;
        strengthChartImage: string;
        metadata: any;
    };
    discScores: { D: number; I: number; S: number; C: number };
    totalScore: string;
    sincerityIndex: string;
    sincerityClass: string;
    attemptStatus: string;
    completedAt: string;
    keyStrengths: string[];
    roleAlignment: string[];
    careerGrowthTips: { title: string; desc: string }[] | string[];
    keyBehaviors: string[];
    typicalScenarios: string[];
}

// --- Detailed Profile Card (Bottom Search Result) ---
const ProfileResult = ({ data }: { data: ReportData }) => {
    const trait = data.personalityTrait;
    const traitNameWords = trait.name ? trait.name.split(' ') : ['Unknown'];

    // Build subtitle line (e.g., "B.Tech Information Technology (3rd Year)")
    const subtitleParts: string[] = [];
    if (data.degreeTypeName) subtitleParts.push(data.degreeTypeName);
    if (data.departmentName) subtitleParts.push(data.departmentName);
    if (data.currentYear) subtitleParts.push(`(${data.currentYear})`);
    const subtitle = subtitleParts.join(' ') || data.programName || 'Assessment Completed';

    // Normalize career growth tips to always be { title, desc } objects
    const careerTips = (data.careerGrowthTips || []).map((tip: any) => {
        if (typeof tip === 'string') return { title: '', desc: tip };
        return { title: tip.title || '', desc: tip.desc || tip.description || '' };
    });

    return (
        <div className="mt-8 pt-8 text-left border-t border-gray-100 dark:border-white/5 relative overflow-hidden transition-colors">
            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start mb-8">

                {/* Left: Personality Title */}
                <div className="lg:w-1/4 text-center lg:text-left flex flex-col justify-center pt-8 lg:pt-16">
                    <h2 className="text-[clamp(36px,2.5vw,48px)] font-semibold text-[#150089] dark:text-white leading-[1.1] flex flex-col items-center lg:block">
                        {traitNameWords.map((word, i) => (
                            <span key={i} className={i > 0 ? "lg:ml-16 block" : ""}>{word}</span>
                        ))}
                    </h2>
                </div>

                {/* Center: Character Image */}
                <div className="lg:w-1/3 flex justify-center relative py-6 lg:py-0">
                    {/* Background Glow */}
                    <div className="w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] bg-[#FDE047]/20 dark:bg-yellow-500/10 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none"></div>
                    <div className="relative w-[300px] h-[300px] sm:w-[350px] sm:h-[350px]">
                        <img
                            src={trait.characterImage}
                            alt={`${trait.name} Character`}
                            className="w-full h-full object-contain drop-shadow-2xl relative z-10"
                            onError={(e) => {
                                e.currentTarget.src = `/traits/Corporate_${trait.imageKey}.png`;
                            }}
                        />
                    </div>
                </div>

                {/* Right: Profile Details & Strengths */}
                <div className="lg:w-5/12 w-full text-left pl-0 lg:pl-4">
                    {/* Header Info */}
                    <div className="mb-8 border-b border-gray-100 dark:border-white/5 pb-6">
                        <h1 className="text-[clamp(20px,1.5vw,26px)] font-semibold text-[#19211C] dark:text-white mb-2 leading-tight">{data.candidateName}</h1>
                        <div className="text-[clamp(14px,1.1vw,17px)] font-medium text-[#1ED36A] mb-1 leading-snug">{subtitle}</div>
                        {data.institutionName && (
                            <div className="text-[clamp(13px,1.1vw,16px)] font-normal text-[#19211C] dark:text-white opacity-80 leading-snug">{data.institutionName}</div>
                        )}
                        <div className="text-[clamp(12px,0.9vw,14px)] font-normal text-[#19211C] dark:text-white opacity-60 mt-2">Report ID: {data.reportNumber}</div>
                    </div>

                    {/* Key Strengths Section */}
                    <div className="flex flex-row items-start gap-4 sm:gap-6">
                        {/* Strength Chart Graphic */}
                        <div className="shrink-0 pt-1">
                            <img
                                src={trait.strengthChartImage}
                                alt="Strength Chart"
                                className="w-[60px] sm:w-[80px] h-auto object-contain"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>

                        {/* Strength List */}
                        <div>
                            <h4 className="text-[clamp(16px,1.1vw,20px)] font-semibold text-[#19211C] dark:text-white mb-3">Key Strength</h4>
                            <ul className="space-y-2.5">
                                {(data.keyStrengths.length > 0 ? data.keyStrengths : [
                                    "Demonstrates strong analytical and strategic thinking.",
                                    "Adapts to new environments and challenges with ease.",
                                    "Builds effective working relationships across teams.",
                                    "Maintains high standards of work quality and consistency.",
                                    "Shows resilience and determination in achieving goals."
                                ]).map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[clamp(14px,1.1vw,17px)] font-normal text-[#19211C] dark:text-white leading-snug">
                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-[#19211C] dark:bg-white shrink-0"></span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>


                </div>
            </div>

            {/* Bottom Section: Role Alignment & Career Tips */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-[#F9F9F9] dark:bg-white/5 rounded-2xl overflow-hidden mb-8">
                {/* Role Alignment */}
                <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-white/5">
                    <h5 className="text-[#150089] dark:text-[#1ED36A] text-[clamp(18px,1.4vw,22px)] font-semibold mb-4">Role Alignment</h5>
                    {data.roleAlignment.length > 0 ? (
                        <ul className="space-y-1">
                            {data.roleAlignment.map((role, i) => (
                                <li key={i} className="flex items-center gap-1 text-[clamp(14px,1.1vw,16px)] font-normal text-[#19211C] dark:text-white">
                                    <span className="w-2 h-2 bg-[#1ED36A] rounded-full"></span> {typeof role === 'string' ? role : (role as any).name || (role as any).title || ''}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-[clamp(14px,1.1vw,16px)] font-normal text-[#19211C] dark:text-white opacity-60">Role alignment data will be available after full analysis.</p>
                    )}
                </div>

                {/* Career Growth Tips */}
                <div className="p-6">
                    <h5 className="text-[#150089] dark:text-[#1ED36A] text-[clamp(16px,1.25vw,20px)] font-semibold mb-4">Career Growth Tips</h5>
                    {careerTips.length > 0 ? (
                        <div className="space-y-5">
                            {careerTips.map((tip, i) => (
                                <div key={i}>
                                    {tip.title && <span className="font-bold text-[clamp(16px,1.3vw,19px)] text-[#19211C] dark:text-white block mb-1">{tip.title}</span>}
                                    <p className="text-[clamp(14px,1.1vw,16px)] text-[#19211C] dark:text-white leading-relaxed font-normal">{tip.desc}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[clamp(14px,1.1vw,16px)] font-normal text-[#19211C] dark:text-white opacity-60">Career growth tips will be available after full analysis.</p>
                    )}
                </div>
            </div>

            {/* Footer Description */}
            <div className="mt-8 pt-4">
                <h3 className="text-[#150089] dark:text-[#1ED36A] text-[clamp(24px,2vw,32px)] font-semibold mb-2">{data.candidateName} is {trait.name}</h3>
                {trait.description && (
                    <p className="text-[clamp(14px,1.1vw,16px)] text-[#19211C] dark:text-white leading-relaxed font-normal mb-6">
                        <span className="font-semibold text-black dark:text-white opacity-90">Description:</span> {trait.description}
                    </p>
                )}

                <div className="space-y-6">
                    {data.keyBehaviors.length > 0 && (
                        <div>
                            <h4 className="text-[clamp(16px,1.3vw,19px)] font-semibold text-[#19211C] dark:text-white mb-2">Key Behaviors:</h4>
                            <ul className="list-disc pl-5 space-y-1.5 text-[clamp(14px,1.1vw,16px)] text-[#19211C] dark:text-white font-normal">
                                {data.keyBehaviors.map((behavior, i) => (
                                    <li key={i}>{behavior}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {data.typicalScenarios.length > 0 && (
                        <div>
                            <h4 className="text-[clamp(16px,1.3vw,19px)] font-semibold text-[#19211C] dark:text-white mb-2">Typical Scenarios:</h4>
                            <ul className="list-disc pl-5 space-y-1.5 text-[clamp(14px,1.1vw,16px)] text-[#19211C] dark:text-white font-normal">
                                {data.typicalScenarios.map((scenario, i) => (
                                    <li key={i}>{scenario}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const CorporateDashboard: React.FC = () => {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showResult, setShowResult] = useState(false);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);

    // Toast State
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', title?: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type, title }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // Filter states
    const [dateRangeLabel, setDateRangeLabel] = useState<string>("All");
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const fetchDashboardStats = async (start: Date | null = null, end: Date | null = null) => {
        const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
        if (!email) return;

        setLoading(true);
        try {
            const formatDate = (d: Date | null) => {
                if (!d) return undefined;
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${dd}`;
            };

            const data = await corporateDashboardService.getStats(
                email,
                formatDate(start),
                formatDate(end)
            );
            setStats(data);
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchDashboardStats(startDate, endDate);
    }, []);

    // Real participants from API
    const participants: Participant[] = stats?.recentParticipants ?? [];

    const handleSearch = async () => {
        const query = searchQuery.trim();
        if (!query) {
            setShowResult(false);
            setReportData(null);
            setSearchError(null);
            return;
        }

        const email = sessionStorage.getItem("userEmail");
        if (!email) {
            setSearchError("Please log in to search reports.");
            return;
        }

        setSearchLoading(true);
        setSearchError(null);
        setShowResult(false);
        setReportData(null);

        try {
            const result = await corporateDashboardService.searchByReportNumber(email, query);
            if (result) {
                setReportData(result);
                setShowResult(true);
            } else {
                setSearchError(`No report found for ID: ${query}`);
            }
        } catch (err: any) {
            console.error('Search failed:', err);
            setSearchError(err.message || `No report found for ID: ${query}`);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const companyName = stats?.companyName || "Monishwar Rajasekaran";

    return (
        <div className="relative min-h-screen bg-transparent font-sans transition-colors duration-300 overflow-hidden p-4 sm:p-6 lg:p-8">
            {/* 1. Header Section */}
            <Script
                id="razorpay-checkout-js"
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="lazyOnload"
            />
            <div className="flex flex-col xl:flex-row justify-between items-start mb-10 gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full">
                    <div>
                        <div className="text-[clamp(12px,0.73vw,14px)] text-[#19211C] dark:text-white font-normal mb-1 flex items-center gap-2">
                            Welcome Back!!
                            {loading && <span className="text-[10px] text-[#1ED36A] animate-pulse">(Updating...)</span>}
                        </div>
                        <h1 className="text-[clamp(28px,2.3vw,44px)] font-semibold text-[#150089] dark:text-white mb-2 leading-tight">{companyName}</h1>
                        <p className="text-[clamp(16px,1.05vw,20px)] text-[#19211C] dark:text-white font-medium">Here's a quick overview of your activity</p>
                    </div>
                </div>

                {/* Header Stats */}
                <div className="flex flex-wrap sm:flex-nowrap w-full xl:w-auto xl:mt-6">
                    <MiniStat label="Total Registered" value={String(stats?.miniStats?.totalRegistrations ?? 0)} trend={`${Math.abs(stats?.miniStats?.registrationsTrend ?? 0)}%`} isPositive={(stats?.miniStats?.registrationsTrend ?? 0) >= 0} />
                    <MiniStat label="New This Month" value={String(stats?.miniStats?.newRegistrationsThisMonth ?? 0)} trend={`${Math.abs(stats?.miniStats?.registrationsTrend ?? 0)}%`} isPositive={(stats?.miniStats?.registrationsTrend ?? 0) >= 0} />
                    <MiniStat label="Assessments Assigned" value={String(stats?.miniStats?.assessmentsAssigned ?? 0)} trend={`${Math.abs(stats?.miniStats?.assessmentsAssignedTrend ?? 0)}%`} isPositive={(stats?.miniStats?.assessmentsAssignedTrend ?? 0) >= 0} />
                    <MiniStat label="Assessments Completed" value={String(stats?.miniStats?.assessmentsCompleted ?? 0)} trend={`${Math.abs(stats?.miniStats?.assessmentsCompletedTrend ?? 0)}%`} isPositive={(stats?.miniStats?.assessmentsCompletedTrend ?? 0) >= 0} />
                </div>
            </div>

            {/* 2. Top Grid: Credits, Insights, Recruitment */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                <div className="lg:col-span-3">
                    <CreditsCard
                        credits={stats?.availableCredits ?? 0}
                        onBuy={() => setIsBuyCreditsOpen(true)}
                    />
                </div>
                <div className="lg:col-span-5 relative z-20">
                    <AssessmentBarChart insights={stats?.assessmentInsights ?? []} />
                </div>
                <div className="lg:col-span-4 relative z-10">
                    <RecruitmentOverview
                        pipeline={stats?.pipelineOverview ?? { totalRegistered: 0, assessmentsAssigned: 0, assessmentsInProgress: 0, assessmentsCompleted: 0 }}
                        selectedRange={dateRangeLabel}
                        onDateChange={(start, end, label) => {
                            setDateRangeLabel(label);
                            setStartDate(start);
                            setEndDate(end);
                            fetchDashboardStats(start, end);
                        }}
                    />
                </div>
            </div>

            {/* 3. Middle Grid: Personality, Participants */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                <div className="lg:col-span-4">
                    <PersonalityDistribution data={stats?.personalityDistribution ?? { totalWithTraits: 0, topTraits: [] }} />
                </div>
                <div className="lg:col-span-8">
                    <ParticipantsTable
                        participants={participants}
                        onViewAll={() => router.push('/corporate/registrations')}
                        onView={(id) => router.push(`/corporate/registrations?id=${id}`)}
                    />
                </div>
            </div>

            {/* 4. Search & Report Section */}
            <div>
                <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] p-6 sm:p-10 border border-[#E0E0E0] dark:border-white/10 shadow-sm text-center font-['Haskoy'] mb-8">
                    <h2 className="text-[clamp(26px,1.8vw,34px)] font-semibold text-[#150089] dark:text-white leading-none mb-4">
                        Search Student Report
                    </h2>
                    <p className="text-[clamp(12px,0.83vw,16px)] font-normal text-[#19211C] dark:text-white mb-6 max-w-3xl mx-auto leading-tight">
                        Enter a valid Origin BI ID to instantly view a candidate's personality summary, assessment scores, and career readiness report
                    </p>

                    <div className="max-w-2xl mx-auto">
                        <div className="flex items-center w-full bg-white dark:bg-[#111111]/50 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-[#1ED36A] focus-within:border-[#1ED36A] transition-all h-[44px] sm:h-[50px]">
                            <input
                                type="text"
                                placeholder="Enter Origin BI ID (e.g., OB-20345)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 bg-transparent border-none h-full px-5 text-[clamp(11px,0.73vw,14px)] font-medium text-[#19211C] dark:text-white placeholder:text-[#D2D2D2] focus:outline-none focus:ring-0"
                            />
                            <button
                                onClick={handleSearch}
                                className="bg-[#1ED36A] w-[50px] sm:w-[60px] h-full flex items-center justify-center hover:bg-green-600 transition-colors cursor-pointer"
                            >
                                <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white">
                                    <g clipPath="url(#clip0_880_1102)">
                                        <path d="M16.6217 15.868L12.2892 11.6047C13.4237 10.372 14.1208 8.74177 14.1208 6.94788C14.1203 3.11043 10.9595 0 7.06014 0C3.1608 0 0 3.11043 0 6.94788C0 10.7853 3.1608 13.8958 7.06014 13.8958C8.74492 13.8958 10.2902 13.313 11.5039 12.3442L15.8533 16.6243C16.0652 16.8331 16.4093 16.8331 16.6212 16.6243C16.8336 16.4156 16.8336 16.0768 16.6217 15.868ZM7.06014 12.8268C3.76087 12.8268 1.0863 10.1947 1.0863 6.94788C1.0863 3.70104 3.76087 1.06897 7.06014 1.06897C10.3594 1.06897 13.034 3.70104 13.034 6.94788C13.034 10.1947 10.3594 12.8268 7.06014 12.8268Z" fill="white" />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_880_1102">
                                            <rect width="16.7809" height="16.7809" fill="white" />
                                        </clipPath>
                                    </defs>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Loading State */}
                    {searchLoading && (
                        <div className="mt-8 pt-8 text-center">
                            <div className="inline-flex items-center gap-3 text-[#19211C] dark:text-white">
                                <svg className="animate-spin h-6 w-6 text-[#1ED36A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-[clamp(14px,1vw,16px)] font-medium">Searching for report...</span>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {searchError && !searchLoading && (
                        <div className="mt-8 pt-8 text-center">
                            <div className="inline-flex flex-col items-center gap-2">
                                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-2">
                                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <span className="text-[clamp(14px,1vw,16px)] font-medium text-red-400">{searchError}</span>
                                <span className="text-[clamp(12px,0.8vw,14px)] text-[#19211C] dark:text-white opacity-60">Please check the Origin BI ID and try again</span>
                            </div>
                        </div>
                    )}

                    {/* Profile Result Card (Only shows after successful search) */}
                    {showResult && reportData && <ProfileResult data={reportData} />}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-12 border-t border-gray-200 dark:border-white/5 pt-6 flex flex-col sm:flex-row justify-between text-[14px] font-medium items-center gap-4">
                <div className="flex items-center gap-4">
                    <span className="text-[#1ED36A] underline decoration-solid cursor-pointer">Privacy Policy</span>
                    <span className="h-4 w-px bg-gray-300 dark:bg-white/20"></span>
                    <span className="text-[#1ED36A] underline decoration-solid cursor-pointer">Terms & Conditions</span>
                </div>
                <div className="text-[#19211C] dark:text-white">
                    © 2025 Origin BI, Made with ❤️ by <span className="text-[#1ED36A] underline decoration-solid cursor-pointer">Touchmark Descience Pvt. Ltd.</span>
                </div>
            </div>

            {/* Buy Credits Modal */}
            <BuyCreditsModal
                isOpen={isBuyCreditsOpen}
                onClose={() => setIsBuyCreditsOpen(false)}
                currentBalance={stats?.availableCredits ?? 0}
                onBuy={async (amount, cost) => {
                    const email = sessionStorage.getItem("userEmail");
                    if (!email || !stats) return;

                    try {
                        // 1. Create Order
                        const order = await corporateDashboardService.createOrder(email, amount, "Dashboard Top-up");

                        const options = {
                            key: order.key,
                            amount: order.amount,
                            currency: order.currency,
                            name: "Origin BI",
                            description: "Credit Purchase",
                            order_id: order.orderId,
                            handler: async function (response: any) {
                                try {
                                    // 2. Verify Payment
                                    await corporateDashboardService.verifyPayment(email, {
                                        razorpay_order_id: response.razorpay_order_id,
                                        razorpay_payment_id: response.razorpay_payment_id,
                                        razorpay_signature: response.razorpay_signature
                                    });

                                    // 3. Update UI
                                    setStats(prev => prev ? ({
                                        ...prev,
                                        availableCredits: prev.availableCredits + amount,
                                        totalCredits: prev.totalCredits + amount
                                    }) : null);

                                    setIsBuyCreditsOpen(false);
                                    addToast("Payment successful! Credits added.", 'success');
                                } catch (e) {
                                    console.error("Verification failed", e);
                                    addToast("Payment verification failed.", 'error');
                                }
                            },
                            prefill: {
                                email: email,
                                name: stats.companyName,
                            },
                            theme: { color: "#1ED36A" }
                        };

                        if (!(window as any).Razorpay) {
                            addToast("Razorpay SDK not loaded. Please try again in a moment.", 'error');
                            return;
                        }
                        const rzp = new (window as any).Razorpay(options);
                        rzp.on('payment.failed', async function (response: any) {
                            await corporateDashboardService.recordPaymentFailure(order.orderId, response.error.description);
                            addToast(`Payment Failed: ${response.error.description}`, 'error');
                        });
                        rzp.open();

                    } catch (error: any) {
                        console.error("Order creation failed", error);
                        // Extract message from error object (NestJS standard error format)
                        const msg = error?.response?.data?.message || error.message || "Failed to initiate payment";
                        addToast(msg, 'error', 'Payment Initialization Failed');
                    }
                }}
                perCreditCost={stats?.perCreditCost}
            />

            <ToastContainer toasts={toasts} removeToast={removeToast} />

            {loading && !stats && (
                <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white dark:bg-[#19211C] shadow-2xl border border-gray-100 dark:border-white/10">
                        <div className="w-12 h-12 border-4 border-[#1ED36A] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-semibold text-[#19211C] dark:text-white">Loading data...</span>
                    </div>
                </div>
            )}
        </div >
    );
};

export default CorporateDashboard;
