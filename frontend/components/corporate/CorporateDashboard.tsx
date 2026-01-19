import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Edit2, MoreHorizontal, CheckCircle, Clock, Users, Briefcase } from "lucide-react";
import { TrendUpIcon, TrendDownIcon, CircleArrowUpIcon, EditPencilIcon, DiamondIcon } from "@/components/icons";

// --- Types ---
interface DashboardStats {
    companyName: string;
    availableCredits: number;
    totalCredits: number;
    studentsRegistered: number;
    isActive: boolean;
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
            <span className="text-[clamp(12px,0.73vw,14px)] text-[#19211C] dark:text-white font-normal whitespace-nowrap">{label}</span>
            <CircleArrowUpRightFilled className="w-6 h-6" />
        </div>
        <div className="flex flex-row items-baseline gap-3">
            <span className="text-[clamp(28px,2.3vw,44px)] font-medium text-[#150089] dark:text-white leading-none">{value}</span>
            {trend && (
                <div className="flex items-center gap-2">
                    <span className={`text-[clamp(12px,0.73vw,14px)] font-semibold flex items-center gap-1.5 ${isPositive ? 'text-[#1ED36A]' : 'text-[#FF5457]'}`}>
                        {trend}
                        {isPositive ? <TrendUpIcon /> : <TrendDownIcon />}
                    </span>
                    <span className="text-[clamp(10px,0.6vw,12px)] font-normal text-[#19211C] dark:text-white opacity-80 whitespace-nowrap">
                        vs last month
                    </span>
                </div>
            )}
        </div>
    </div>
);

const CreditsCard = ({ credits }: { credits: number }) => (
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
            <span className="font-['Haskoy'] font-extrabold text-[clamp(120px,18.2vw,350px)] text-[#19211C] dark:text-white opacity-[0.02] leading-none select-none tracking-normal">
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
                    <div className="font-['Haskoy'] font-medium text-[clamp(80px,5vw,120px)] text-[#150089] dark:text-white leading-[0.85] tracking-tight">
                        {credits}
                    </div>
                </div>
            </div>

            {/* Button - Increased Text Size and Padding */}
            <div className="flex justify-center">
                <button className="font-['Haskoy'] font-medium text-[clamp(14px,0.83vw,16px)] text-white bg-[#1ED36A] hover:bg-[#16b058] px-12 py-3.5 rounded-full shadow-lg shadow-[#1ED36A]/20 transition-all">
                    Buy now
                </button>
            </div>
        </div>
    </div>
);

const AssessmentBarChart = () => {
    // Mock Data (Adjusted for Max 400 Scale)
    const data = [
        { label: 'Jan', assigned: 280, completed: 350 },
        { label: 'Feb', assigned: 350, completed: 330 },
        { label: 'Mar', assigned: 350, completed: 250 },
        { label: 'Apr', assigned: 320, completed: 390 },
        { label: 'May', assigned: 300, completed: 340 },
    ];
    // Re-adjusting to match Design Image 0 roughly
    const chartData = [
        { label: 'Jan', assigned: 280, completed: 340 },
        { label: 'Feb', assigned: 340, completed: 340 },
        { label: 'Mar', assigned: 350, completed: 250 },
        { label: 'Apr', assigned: 310, completed: 395 },
        { label: 'May', assigned: 300, completed: 350 },
    ];

    const max = 400;

    return (
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] p-8 border border-[#E0E0E0] dark:border-white/10 h-full flex flex-col font-['Haskoy'] overflow-visible shadow-sm">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-[clamp(16px,1.04vw,20px)] font-semibold text-[#19211C] dark:text-white leading-none">Assessment Insights</h3>
                <div className="flex gap-4 text-[clamp(10px,0.6vw,12px)] font-medium text-[#19211C] dark:text-white">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#150089] dark:bg-white"></span> Assigned</div>
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#1ED36A]"></span> Completed</div>
                </div>
            </div>

            <div className="flex-1 flex gap-4">
                {/* Y Axis */}
                <div className="flex flex-col justify-between text-[#19211C] dark:text-white font-light text-[clamp(12px,0.8vw,16px)] pb-8 pt-2">
                    <span>400</span>
                    <span>300</span>
                    <span>200</span>
                    <span>100</span>
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
                            <span className="text-[clamp(12px,0.8vw,16px)] font-light text-[#19211C] dark:text-white">{d.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const RecruitmentOverview = () => {
    const items = [
        { label: 'Total Applicants', val: 453, max: 500 },
        { label: 'Short Listed', val: 242, max: 500 },
        { label: 'Interviewed', val: 165, max: 500 },
        { label: 'Hired', val: 125, max: 500 },
    ];

    return (
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] p-8 border border-[#E0E0E0] dark:border-white/10 h-full font-['Haskoy'] flex flex-col shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-[clamp(16px,1.04vw,20px)] font-semibold text-[#19211C] dark:text-white leading-none">
                    Recruitment Overview
                </h3>
                {/* Date Dropdown */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E0E0E0] dark:border-white/10 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <span className="text-[clamp(11px,0.73vw,14px)] font-normal text-[#19211C] dark:text-white leading-none whitespace-nowrap">
                        September 2025
                    </span>
                    <svg className="w-4 h-4 text-[#19211C] dark:text-white opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" /></svg>
                </div>
            </div>

            {/* Stats List */}
            <div className="space-y-6 flex-1">
                {items.map((item, i) => (
                    <div key={i} className="flex flex-col gap-3">
                        <div className="flex justify-between items-end">
                            <span className="text-[clamp(11px,0.73vw,14px)] font-normal text-[#19211C] dark:text-white leading-none">
                                {item.label}
                            </span>
                            <span className="text-[clamp(11px,0.73vw,14px)] font-semibold text-[#19211C] dark:text-white leading-none">
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
const DonutChart = () => (
    <div className="relative w-[clamp(200px,14vw,260px)] h-[clamp(200px,14vw,260px)] mx-auto flex items-center justify-center">
        {/* Chart SVG with 4 Rings - adjusted for larger inner space */}
        <svg viewBox="0 0 200 200" className="w-full h-full rotate-[-90deg]">
            {/* Ring 1 (Outer) - Supportive Energizer (45) */}
            <circle cx="100" cy="100" r="90" fill="none" stroke="#e5e5e5" strokeWidth="10" strokeLinecap="round" className="dark:stroke-white/5" />
            <circle cx="100" cy="100" r="90" fill="none" stroke="#C2185B" strokeWidth="10" strokeDasharray="500, 1000" strokeDashoffset="0" strokeLinecap="round" />

            {/* Ring 2 - Strategic Stabilizer (32) */}
            <circle cx="100" cy="100" r="75" fill="none" stroke="#e5e5e5" strokeWidth="10" strokeLinecap="round" className="dark:stroke-white/5" />
            <circle cx="100" cy="100" r="75" fill="none" stroke="#FBC02D" strokeWidth="10" strokeDasharray="300, 1000" strokeDashoffset="-20" strokeLinecap="round" />

            {/* Ring 3 - Decisive Analyst (28) */}
            <circle cx="100" cy="100" r="60" fill="none" stroke="#e5e5e5" strokeWidth="10" strokeLinecap="round" className="dark:stroke-white/5" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="#D4E157" strokeWidth="10" strokeDasharray="200, 1000" strokeDashoffset="-40" strokeLinecap="round" />

            {/* Ring 4 (Inner) - Charismatic Leader (21) */}
            <circle cx="100" cy="100" r="45" fill="none" stroke="#e5e5e5" strokeWidth="10" strokeLinecap="round" className="dark:stroke-white/5" />
            <circle cx="100" cy="100" r="45" fill="none" stroke="#D32F2F" strokeWidth="10" strokeDasharray="120, 1000" strokeDashoffset="-60" strokeLinecap="round" />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
            <span className="font-['Haskoy'] font-semibold text-[clamp(18px,1.25vw,24px)] text-[#150089] dark:text-[#1ED36A] leading-tight">200</span>
            <span className="font-['Haskoy'] font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-tight">Candidates</span>
        </div>
    </div>
);

const PersonalityDistribution = () => {
    return (
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] p-6 border border-[#E0E0E0] dark:border-white/10 h-full font-['Haskoy'] flex flex-col justify-between shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-3">
                    <h3 className="font-semibold text-[clamp(16px,1.04vw,20px)] text-[#19211C] dark:text-white leading-none">
                        Applicant Personality Distribution
                    </h3>
                    <div className="flex flex-row items-center gap-2 sm:gap-6 whitespace-nowrap">
                        <span className="font-normal text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white">
                            Total Applicants : <span className="font-semibold">200</span>
                        </span>
                        <span className="flex items-center gap-1.5 font-semibold text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white">
                            <span className="w-3 h-3 rounded-full bg-[#1ED36A]"></span> Top 4
                            <span className="font-normal">traits shown</span>
                        </span>
                    </div>
                </div>
                <button className="font-medium text-[clamp(11px,0.73vw,14px)] text-[#1ED36A] hover:underline whitespace-nowrap">
                    Know More
                </button>
            </div>

            {/* Content Row */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-6 flex-1">
                {/* Chart Left */}
                <div className="flex-shrink-0">
                    <DonutChart />
                </div>

                {/* Legend Right */}
                <div className="grid grid-cols-2 gap-4 w-full xl:flex xl:flex-col xl:w-auto xl:min-w-[140px]">
                    {/* Item 1 */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-4 rounded-full bg-[#C2185B]"></span>
                            <span className="font-medium text-[clamp(18px,1.25vw,24px)] text-[#19211C] dark:text-white leading-none">45</span>
                        </div>
                        <span className="font-medium text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none pl-4">Supportive Energizer</span>
                    </div>
                    {/* Item 2 */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-4 rounded-full bg-[#FBC02D]"></span>
                            <span className="font-medium text-[clamp(18px,1.25vw,24px)] text-[#19211C] dark:text-white leading-none">32</span>
                        </div>
                        <span className="font-medium text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none pl-4">Strategic Stabilizer</span>
                    </div>
                    {/* Item 3 */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-4 rounded-full bg-[#D4E157]"></span>
                            <span className="font-medium text-[clamp(18px,1.25vw,24px)] text-[#19211C] dark:text-white leading-none">28</span>
                        </div>
                        <span className="font-medium text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none pl-4">Decisive Analyst</span>
                    </div>
                    {/* Item 4 */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-4 rounded-full bg-[#D32F2F]"></span>
                            <span className="font-medium text-[clamp(18px,1.25vw,24px)] text-[#19211C] dark:text-white leading-none">21</span>
                        </div>
                        <span className="font-medium text-[clamp(11px,0.73vw,14px)] text-[#19211C] dark:text-white leading-none pl-4">Charismatic Leader</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ParticipantsTable = ({ participants }: { participants: Participant[] }) => {
    // Exact Design Data Structure
    const tableData = [
        { name: 'Monishwar Rajasekaran (M)', type: 'School Student', date: '13 May 2025', mobile: '8787627634', status: true },
        { name: 'Monishwar Rajasekaran (M)', type: 'School Student', date: '13 May 2025', mobile: '8787627634', status: true },
        { name: 'Monishwar Rajasekaran (M)', type: 'School Student', date: '13 May 2025', mobile: '8787627634', status: true },
        { name: 'Monishwar Rajasekaran (M)', type: 'School Student', date: '13 May 2025', mobile: '8787627634', status: true },
        { name: 'Monishwar Rajasekaran (M)', type: 'School Student', date: '13 May 2025', mobile: '8787627634', status: true },
    ];

    return (
        <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] border border-[#E0E0E0] dark:border-white/10 h-full overflow-hidden flex flex-col font-['Haskoy'] shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-center p-6">
                <h3 className="font-semibold text-[clamp(16px,1.04vw,20px)] text-[#19211C] dark:text-white leading-none">
                    Assessment Participants
                </h3>
                <span className="font-medium text-[clamp(11px,0.73vw,14px)] text-[#1ED36A] cursor-pointer hover:underline">
                    View all
                </span>
            </div>

            {/* Table Area */}
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
                                <td className="py-3.5 pl-6 pr-4 font-medium text-[clamp(12px,0.83vw,16px)] text-[#19211C] dark:text-white leading-none">
                                    {row.name}
                                </td>
                                <td className="py-3.5 px-4 font-medium text-[clamp(12px,0.83vw,16px)] text-[#19211C] dark:text-white leading-none">
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
                                <td className="py-3.5 px-4 font-medium text-[clamp(12px,0.83vw,16px)] text-[#19211C] dark:text-white leading-none">
                                    {row.date}
                                </td>
                                <td className="py-3.5 px-4 font-medium text-[clamp(12px,0.83vw,16px)] text-[#19211C] dark:text-white leading-none">
                                    {row.mobile}
                                </td>
                                <td className="py-3.5 pl-4 pr-6 text-center">
                                    <div className="flex justify-center items-center cursor-pointer hover:opacity-80 transition-opacity">
                                        <EditPencilIcon className="w-[18px] h-[18px] text-[#1ED36A]" />
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

// --- Detailed Profile Card (Bottom Search Result) ---
const ProfileResult = () => (
    <div className="mt-8 pt-8 text-left border-t border-gray-100 dark:border-white/5 relative overflow-hidden transition-colors">
        {/* Main Content Area */}
        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start mb-8">

            {/* Left: Personality Title */}
            <div className="lg:w-1/4 text-center lg:text-left flex flex-col justify-center pt-8 lg:pt-16">
                <h2 className="text-[clamp(32px,2.3vw,44px)] font-semibold text-[#150089] dark:text-white leading-[1.1] flex flex-col items-center lg:block">
                    <span>Supportive</span>
                    <span className="lg:ml-16 block">Energizer</span>
                </h2>
            </div>

            {/* Center: Character Image */}
            <div className="lg:w-1/3 flex justify-center relative py-6 lg:py-0">
                {/* Background Glow */}
                <div className="w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] bg-[#FDE047]/20 dark:bg-yellow-500/10 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none"></div>
                <div className="relative w-[300px] h-[300px] sm:w-[350px] sm:h-[350px]">
                    <img
                        src="/Corporate_Analytical_Leader.png"
                        alt="Supportive Energizer Character"
                        className="w-full h-full object-contain drop-shadow-2xl relative z-10"
                        onError={(e) => {
                            // Fallback if image missing - remove this in prod
                            e.currentTarget.src = "https://via.placeholder.com/350x350/transparent/transparent?text=Character";
                        }}
                    />
                </div>
            </div>

            {/* Right: Profile Details & Strengths */}
            <div className="lg:w-5/12 w-full text-left pl-0 lg:pl-4">
                {/* Header Info */}
                <div className="mb-8 border-b border-gray-100 dark:border-white/5 pb-6">
                    <h1 className="text-[clamp(18px,1.25vw,24px)] font-semibold text-[#19211C] dark:text-white mb-2 leading-tight">Pushparaaj</h1>
                    <div className="text-[clamp(12px,0.8vw,16px)] font-medium text-[#1ED36A] mb-1 leading-snug">B.Tech Information Technology (3rd Year)</div>
                    <div className="text-[clamp(11px,0.7vw,14px)] font-normal text-[#19211C] dark:text-white opacity-80 leading-snug">Peri Institute of Engineering and Technology</div>
                </div>

                {/* Key Strengths Section */}
                <div className="flex flex-row items-start gap-4 sm:gap-6">
                    {/* Strength Chart Graphic */}
                    <div className="shrink-0 pt-1">
                        <img
                            src="/Analytical_Leader_Strength_Chart.png"
                            alt="Strength Chart"
                            className="w-[60px] sm:w-[80px] h-auto object-contain"
                        />
                    </div>

                    {/* Strength List */}
                    <div>
                        <h4 className="text-[clamp(14px,0.9vw,18px)] font-semibold text-[#19211C] dark:text-white mb-3">Key Strength</h4>
                        <ul className="space-y-2.5">
                            {[
                                "Frequently reviews and aligns goals to stay focused and motivated.",
                                "Continuously seeks ways to improve and refine processes.",
                                "Stays informed about the latest trends and developments in the industry.",
                                "Actively seeks constructive feedback from peers and mentors to grow and develop.",
                                "Adapts strategies to remain effective in changing circumstances."
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-[clamp(12px,0.8vw,16px)] font-normal text-[#19211C] dark:text-white leading-snug">
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
                <h5 className="text-[#150089] dark:text-[#1ED36A] text-[clamp(16px,1.25vw,20px)] font-semibold mb-4">Role Alignment</h5>
                <ul className="space-y-1">
                    {["User Experience (UX) Designer", "IT Business Analyst", "Knowledge Management Specialist"].map(role => (
                        <li key={role} className="flex items-center gap-1 text-[clamp(12px,0.97vw,15px)] font-normal text-[#19211C] dark:text-white">
                            <span className="w-2 h-2 bg-gray-400 rounded-full"></span> {role}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Career Growth Tips */}
            <div className="p-6">
                <h5 className="text-[#150089] dark:text-[#1ED36A] text-[clamp(16px,1.25vw,20px)] font-semibold mb-4">Career Growth Tips</h5>
                <div className="space-y-5">
                    <p className="text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-relaxed opacity-90 mb-4">
                        The candidate's vibrant personality and optimistic outlook are among his/her greatest assets, but like any strength, these can be overextended. To ensure continued growth, here are some tailored recommendations for the candidate:
                    </p>
                    {[
                        { title: "Delivering on Promises", desc: "The candidate's enthusiasm can sometimes lead him/her to take on more than can realistically be managed. By learning to prioritize and set boundaries, he/she can ensure commitments are met without feeling overwhelmed." },
                        { title: "Active Listening", desc: "While the candidate's conversational skills are excellent, focusing more on listening can help build deeper connections. Taking the time to fully understand others' perspectives will enhance relationships and decision-making." },
                        { title: "Staying Focused", desc: "The candidate's excitement about new ideas can occasionally distract him/her from existing priorities. Adopting tools like task lists or scheduling techniques can help channel energy effectively and maintain consistent productivity." },
                        { title: "Digging Deeper", desc: "The candidate's natural optimism might lead to quick decisions without analyzing all the details. Developing the habit of gathering more information before acting will strengthen problem-solving skills." },
                        { title: "Time Management", desc: "With a packed schedule and multiple interests, time management is key. Setting clear timelines and avoiding overcommitment will allow the candidate to balance aspirations with well-being." },
                    ].map((tip, i) => (
                        <div key={i}>
                            <span className="font-bold text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white block mb-1">{tip.title}</span>
                            <p className="text-[clamp(14px,1.1vw,17px)] text-[#19211C] dark:text-white leading-relaxed font-normal">{tip.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Footer Description */}
        <div className="mt-8 pt-4">
            <h3 className="text-[#150089] dark:text-[#1ED36A] text-[clamp(20px,1.66vw,28px)] font-semibold mb-2">Pushparaaj is Supportive Energizer</h3>
            <p className="text-[clamp(12px,0.97vw,15px)] text-[#19211C] dark:text-white leading-relaxed font-normal mb-6">
                <span className="font-semibold text-black dark:text-white opacity-90">Description:</span> A warm, empathetic individual who thrives on fostering harmony and collaboration. Your focus on relationships and positivity makes you an invaluable team player and connector.
            </p>

            <div className="space-y-6">
                <div>
                    <h4 className="text-[clamp(14px,1.1vw,17px)] font-semibold text-[#19211C] dark:text-white mb-2">Key Behaviors:</h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-[clamp(12px,0.97vw,15px)] text-[#19211C] dark:text-white font-normal">
                        <li>Builds meaningful relationships and fosters trust within teams.</li>
                        <li>Creates a collaborative environment where everyone feels valued.</li>
                        <li>Acts as a calming presence in high-stress situations.</li>
                        <li>Thrives in people-focused roles that require empathy and engagement.</li>
                        <li>Encourages creativity and collaboration to achieve goals.</li>
                        <li>Supports team members in their growth and development.</li>
                        <li>Balances optimism with practicality in decision-making.</li>
                        <li>Commits to long-term success and loyalty within organizations.</li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-[clamp(14px,1.1vw,17px)] font-semibold text-[#19211C] dark:text-white mb-2">Typical Scenarios:</h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-[clamp(12px,0.97vw,15px)] text-[#19211C] dark:text-white font-normal">
                        <li>Coordinating a team-building initiative to boost morale.</li>
                        <li>Leading a customer success program to improve retention rates.</li>
                        <li>Acting as a mentor to help colleagues achieve their potential.</li>
                        <li>Supporting recruitment efforts by creating a welcoming candidate experience.</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);


const CorporateDashboard: React.FC = () => {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showResult, setShowResult] = useState(false);

    // Mock Participants Data
    const participants: Participant[] = [
        { id: '1', name: 'Monishwar Rajasekaran (M)', programType: 'School Student', status: true, registerDate: '10 May 2024', mobile: '9585743154' },
        { id: '2', name: 'Harishwar Rajasekaran (M)', programType: 'School Student', status: true, registerDate: '10 May 2024', mobile: '9080706050' },
        { id: '3', name: 'SaiKiran Rajasekaran (M)', programType: 'School Student', status: true, registerDate: '10 May 2024', mobile: '8056233554' },
        { id: '4', name: 'Monishwar Rajasekaran (M)', programType: 'School Student', status: true, registerDate: '11 May 2024', mobile: '9585743154' },
        { id: '5', name: 'Harishwar Rajasekaran (M)', programType: 'School Student', status: true, registerDate: '12 May 2024', mobile: '9585743154' },
    ];

    useEffect(() => {
        // Keeps the existing fetching logic specifically for credits/stats
        const fetchStats = async () => {
            const email = sessionStorage.getItem("userEmail");
            const token = sessionStorage.getItem("accessToken");
            if (email && token) {
                try {
                    const res = await fetch(`${API_URL}/dashboard/stats?email=${email}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) setStats(await res.json());
                } catch (e) { console.error(e); }
            }
        };
        fetchStats();
    }, []);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            setShowResult(true);
        } else {
            setShowResult(false);
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
            <div className="flex flex-col xl:flex-row justify-between items-start mb-10 gap-6">
                <div>
                    <div className="text-[clamp(12px,0.73vw,14px)] text-[#19211C] dark:text-white font-normal mb-1">Welcome Back!!</div>
                    <h1 className="text-[clamp(28px,2.3vw,44px)] font-semibold text-[#150089] dark:text-white mb-2 leading-tight">{companyName}</h1>
                    <p className="text-[clamp(16px,1.05vw,20px)] text-[#19211C] dark:text-white font-medium">Here's a quick overview of your activity</p>
                </div>

                {/* Header Stats */}
                <div className="flex flex-wrap sm:flex-nowrap w-full xl:w-auto xl:mt-6">
                    <MiniStat label="Active Jobs" value="100" trend="12%" isPositive={true} />
                    <MiniStat label="New Applicants" value="25" trend="12%" isPositive={false} />
                    <MiniStat label="Assessments Assigned" value="25" trend="12%" isPositive={true} />
                    <MiniStat label="Assessments Completed" value="18" trend="12%" isPositive={true} />
                </div>
            </div>

            {/* 2. Top Grid: Credits, Insights, Recruitment */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                <div className="lg:col-span-3">
                    <CreditsCard credits={stats?.totalCredits || 250} />
                </div>
                <div className="lg:col-span-5 relative z-20">
                    <AssessmentBarChart />
                </div>
                <div className="lg:col-span-4 relative z-10">
                    <RecruitmentOverview />
                </div>
            </div>

            {/* 3. Middle Grid: Personality, Participants */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                <div className="lg:col-span-4">
                    <PersonalityDistribution />
                </div>
                <div className="lg:col-span-8">
                    <ParticipantsTable participants={participants} />
                </div>
            </div>

            {/* 4. Search & Report Section */}
            <div>
                <div className="bg-white/60 backdrop-blur-xl dark:bg-[#FFFFFF]/[0.08] rounded-[32px] p-6 sm:p-10 border border-[#E0E0E0] dark:border-white/10 shadow-sm text-center font-['Haskoy'] mb-8">
                    <h2 className="text-[clamp(24px,1.66vw,32px)] font-semibold text-[#150089] dark:text-white leading-none mb-4">
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

                    {/* Profile Result Card (Only shows after search) */}
                    {showResult && <ProfileResult />}
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
        </div>
    );
};

export default CorporateDashboard;
