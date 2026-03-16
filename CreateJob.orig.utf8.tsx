import React, { useState } from "react";
import { ChevronDownIcon, XIcon, CheckCircle2, AlertCircle, InfoIcon, XCircle, Gem } from "lucide-react";

export interface CreateJobProps {
    onBack?: () => void;
}

export default function CreateJob({ onBack }: CreateJobProps) {
    // Form State
    const [jobTitle, setJobTitle] = useState("UI/UX Designer");
    const [employmentType, setEmploymentType] = useState("Internship");
    const [shift, setShift] = useState("Day");
    const [experience, setExperience] = useState("Fresher");
    const [jobLocation, setJobLocation] = useState("Chennai, Tamil Nadu");
    const [workMode, setWorkMode] = useState("Onsite");

    const [minCtc, setMinCtc] = useState("3,50,000");
    const [maxCtc, setMaxCtc] = useState("4,50,000");

    const [jobDesc, setJobDesc] = useState("We are looking for creative and passionate students or recent graduates to join our team as UX/UI Designers. This role is ideal for freshers who want to learn, gain practical experience, and build a strong portfolio while working on real projects.");
    const [responsibilities, setResponsibilities] = useState("- Design wireframes, UI screens, and simple prototypes\n- Collaborate with developers to ensure accurate design implementation");
    const [eligibility, setEligibility] = useState("");
    const [niceToHave, setNiceToHave] = useState("Basic knowledge of HTML/CSS, Awareness of responsive design principles");
    const [learn, setLearn] = useState("");

    // UI State
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const [skills, setSkills] = useState(["Figma", "Prototyping", "Wire Framing", "Adobe XD"]);

    return (
        <div className="h-full w-full font-sans bg-[#F8F9FA] dark:bg-[#111412] text-[#19211C] dark:text-white overflow-y-auto flex justify-center transition-colors duration-200">
            <div className="w-full max-w-[1440px] flex flex-col gap-5 p-4 sm:p-6 lg:px-12">
                {/* Breadcrumb */}
                <div className="flex items-center text-[13px] text-gray-500 dark:text-gray-400 mb-2 font-normal">
                    <button onClick={onBack} className="hover:text-[#19211C] dark:text-white transition-colors cursor-pointer">Dashboard</button>
                    <span className="mx-2">
                        <svg width="12" height="12" viewBox="0 0 10 10" fill="none" className="text-gray-500">
                            <path d="M3.75 2L6.75 5L3.75 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                    <button onClick={onBack} className="hover:text-[#19211C] dark:text-white transition-colors cursor-pointer">Jobs</button>
                    <span className="mx-2">
                        <svg width="12" height="12" viewBox="0 0 10 10" fill="none" className="text-gray-500">
                            <path d="M3.75 2L6.75 5L3.75 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                    <span className="text-brand-green font-medium">Create Job</span>
                </div>

                {/* Header Area */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-white/5 pb-5">
                    <div className="flex items-center gap-4">
                        <h1 className="text-[28px] font-semibold text-[#19211C] dark:text-white leading-tight">
                            Create a Job Post
                        </h1>
                        <div className="flex items-center gap-2 text-[12px] text-gray-600 dark:text-gray-300 font-medium ml-2">
                            <span className="w-2 h-2 rounded-full bg-[#13C065] shrink-0"></span>
                            Draft Auto Saved...
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-5 py-2.5 rounded-full text-[13px] font-medium border border-gray-400 dark:border-gray-600 text-[#19211C] dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/5 transition-colors cursor-pointer">
                            Save Draft
                        </button>
                        <button onClick={() => setIsPreviewOpen(true)} className="px-5 py-2.5 rounded-full text-[13px] font-medium border border-gray-400 dark:border-gray-600 text-[#19211C] dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/5 transition-colors cursor-pointer">
                            Preview as Candidate
                        </button>
                        <button className="px-6 py-2.5 rounded-full text-[13px] font-bold bg-[#13C065] text-[#19211C] hover:bg-[#10A958] transition-colors border border-transparent shadow-sm cursor-pointer whitespace-nowrap">
                            Post Job
                        </button>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="flex flex-col xl:flex-row gap-6 mt-2">

                    {/* Left Form Column */}
                    <div className="flex-1 flex flex-col gap-8 w-full max-w-[1000px] mb-8 pb-32">
                        <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-transparent pb-8">

                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-[15px] font-semibold flex items-center gap-2 text-[#19211C] dark:text-white/90">
                                    Basic Job Information
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-brand-green mt-0.5">
                                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </h2>
                                <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium tracking-wide">Job ID : 18722765562</span>
                            </div>

                            {/* Row 1 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6 mb-6">
                                {/* Job Title */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[12px] font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                        Job Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        className="w-full bg-white dark:bg-[#2A302C] border border-gray-200 dark:border-white/5 rounded-full px-5 h-[42px] text-[13px] text-[#19211C] dark:text-white focus:outline-none focus:border-brand-green/50 transition-colors"
                                    />
                                </div>

                                {/* Employment Type segments */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[12px] font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                        Employment Type <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center bg-white dark:bg-[#2A302C] rounded-full border border-gray-200 dark:border-white/5 overflow-hidden h-[42px]">
                                        {["Full Time", "Part Time", "Internship"].map((type, idx, arr) => (
                                            <button
                                                key={type}
                                                onClick={() => setEmploymentType(type)}
                                                className={`flex-1 text-center h-full text-[13px] font-medium transition-all cursor-pointer ${employmentType === type
                                                    ? "bg-[#13C065] text-[#111412]"
                                                    : "text-gray-600 dark:text-gray-300 hover:bg-white/5"
                                                    } ${idx !== arr.length - 1 && employmentType !== type && employmentType !== arr[idx + 1] ? 'border-r border-gray-200 dark:border-white/5' : ''}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Work Mode */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[12px] font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                        Work Mode <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={workMode}
                                            onChange={(e) => setWorkMode(e.target.value)}
                                            className="w-full bg-white dark:bg-[#2A302C] border border-gray-200 dark:border-white/5 rounded-full pl-5 pr-10 h-[42px] text-[13px] text-gray-700 dark:text-gray-200 appearance-none focus:outline-none focus:border-brand-green/50 transition-colors cursor-pointer"
                                        >
                                            <option value="Onsite">Onsite</option>
                                            <option value="Hybrid">Hybrid</option>
                                            <option value="Remote">Remote</option>
                                        </select>
                                        <ChevronDownIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
                                {/* Shift segments */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[12px] font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                        Shift
                                    </label>
                                    <div className="flex items-center bg-white dark:bg-[#2A302C] rounded-full border border-gray-200 dark:border-white/5 overflow-hidden h-[42px]">
                                        {["Day", "Night"].map((s, idx, arr) => (
                                            <button
                                                key={s}
                                                onClick={() => setShift(s)}
                                                className={`flex-1 text-center h-full text-[13px] font-medium transition-all cursor-pointer ${shift === s
                                                    ? "bg-[#13C065] text-[#111412]"
                                                    : "text-gray-600 dark:text-gray-300 hover:bg-white/5"
                                                    } ${idx !== arr.length - 1 && shift !== s && shift !== arr[idx + 1] ? 'border-r border-gray-200 dark:border-white/5' : ''}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Experience Level */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[12px] font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                        Experience Level
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={experience}
                                            onChange={(e) => setExperience(e.target.value)}
                                            className="w-full bg-white dark:bg-[#2A302C] border border-gray-200 dark:border-white/5 rounded-full pl-5 pr-10 h-[42px] text-[13px] text-gray-700 dark:text-gray-200 appearance-none focus:outline-none focus:border-brand-green/50 transition-colors cursor-pointer"
                                        >
                                            <option value="Fresher">Fresher</option>
                                            <option value="1-3 Years">1-3 Years</option>
                                            <option value="3-5 Years">3-5 Years</option>
                                            <option value="5+ Years">5+ Years</option>
                                        </select>
                                        <ChevronDownIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Job Location */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[12px] font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                        Job Location
                                    </label>
                                    <input
                                        type="text"
                                        value={jobLocation}
                                        onChange={(e) => setJobLocation(e.target.value)}
                                        className="w-full bg-white dark:bg-[#2A302C] border border-gray-200 dark:border-white/5 rounded-full px-5 h-[42px] text-[13px] text-[#19211C] dark:text-white focus:outline-none focus:border-brand-green/50 transition-colors"
                                    />
                                </div>
                            </div>

                        </div>

                        {/* Section 2: Hiring Timeline & Compensation */}
                        <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-transparent pb-8">

                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-[15px] font-semibold flex items-center gap-2 text-[#19211C] dark:text-white/90">
                                    Hiring Timeline & Compensation
                                    <div className="w-[18px] h-[18px] flex items-center justify-center mt-0.5">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </div>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                                {/* Hiring Timeline */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[12px] font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                        Hiring Timeline <span className="text-red-500">*</span>
                                    </label>
                                    <button className="w-full flex items-center justify-between bg-white dark:bg-[#1F2320] border border-brand-green/30 rounded-full px-5 py-2.5 text-[13px] text-gray-600 dark:text-gray-300 hover:border-brand-green/50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-2.5 text-brand-green">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" />
                                                <path d="M16 2V6M8 2V6M3 10H21" />
                                            </svg>
                                            <span className="text-[#0D6D3A] dark:text-gray-100 font-medium">09 Oct to 08 Nov 2025</span>
                                            <span className="text-gray-500 dark:text-gray-400 font-normal">(30 Days)</span>
                                        </div>
                                        <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </button>
                                </div>

                                {/* Annual CTC */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[12px] font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                        Annual CTC (Ôé╣ / year) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {/* MIN */}
                                        <div className="flex-1 flex items-center bg-white dark:bg-[#1F2320] border border-gray-200 dark:border-white/5 rounded-full px-4 py-2.5 focus-within:border-brand-green/50 transition-colors">
                                            <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400 mr-2">MIN</span>
                                            <span className="text-[13px] text-gray-600 dark:text-gray-300 mr-1.5">Ôé╣</span>
                                            <input
                                                type="text"
                                                value={minCtc}
                                                onChange={(e) => setMinCtc(e.target.value)}
                                                className="w-full bg-transparent text-[13px] text-gray-900 dark:text-white focus:outline-none"
                                            />
                                        </div>

                                        <span className="text-gray-500 mx-1">-</span>

                                        {/* MAX */}
                                        <div className="flex-1 flex items-center bg-white dark:bg-[#1F2320] border border-gray-200 dark:border-white/5 rounded-full px-4 py-2.5 focus-within:border-brand-green/50 transition-colors">
                                            <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400 mr-2">MAX</span>
                                            <span className="text-[13px] text-gray-600 dark:text-gray-300 mr-1.5">Ôé╣</span>
                                            <input
                                                type="text"
                                                value={maxCtc}
                                                onChange={(e) => setMaxCtc(e.target.value)}
                                                className="w-full bg-transparent text-[13px] text-gray-900 dark:text-white focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Section 3: Rich Text Areas & Skills */}
                        <div className="flex flex-col gap-6">

                            {/* Job Description Title */}
                            <div className="flex items-center gap-2 px-1 mb-[-8px]">
                                <h2 className="text-[15px] font-semibold text-[#19211C] dark:text-white/90">Job Description</h2>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#13C065] mt-0.5">
                                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>

                            {/* About the Job */}
                            <RichTextArea
                                label="About the Job"
                                required={true}
                                completed={false}
                                value={jobDesc}
                                onChange={setJobDesc}
                                maxLength={250}
                            />

                            {/* Responsibilities */}
                            <RichTextArea
                                label="Responsibilities"
                                required={true}
                                completed={false}
                                value={responsibilities}
                                onChange={setResponsibilities}
                                maxLength={850}
                            />

                            {/* Eligibility */}
                            <RichTextArea
                                label="Eligibility"
                                required={true}
                                completed={false}
                                value={eligibility}
                                onChange={setEligibility}
                                maxLength={150}
                            />

                            {/* Required Skills */}
                            <TagsInput
                                label="Required Skills (Max 15)"
                                required={true}
                                tags={skills}
                                onAdd={(tag: string) => {
                                    if (skills.length < 15 && tag) setSkills([...skills, tag]);
                                }}
                                onRemove={(tagToRemove: string) => setSkills(skills.filter(t => t !== tagToRemove))}
                            />

                            {/* Nice-to-Have Skills */}
                            <RichTextArea
                                label="Nice-to-Have Skills (Optional)"
                                required={false}
                                completed={false}
                                value={niceToHave}
                                onChange={setNiceToHave}
                                maxLength={150}
                            />

                            {/* What You Will Learn */}
                            <RichTextArea
                                label="What You Will Learn (Optional)"
                                required={false}
                                completed={false}
                                value={learn}
                                onChange={setLearn}
                                maxLength={150}
                            />

                        </div>
                    </div>

                    {/* Right Preview Column */}
                    <div className="w-full xl:w-[400px] shrink-0 flex flex-col gap-5 mt-2 xl:mt-0">

                        {/* Company Preview Card */}
                        <div className="bg-[#F8F9FA] dark:bg-[#1A1F1C] border border-gray-200 dark:border-white/5 rounded-2xl p-6 relative shadow-lg">
                            {/* Status Checkmark */}
                            <div className="absolute top-6 left-6 w-5 h-5 rounded-full bg-[#13C065] flex items-center justify-center">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#111412" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>

                            <div className="flex flex-col items-center mt-2 mb-6 text-center">
                                <div className="w-[50px] h-[50px] bg-white rounded-full flex items-center justify-center mb-3">
                                    <span className="font-bold text-xl text-black">G</span>
                                </div>
                                <h3 className="text-lg font-semibold text-[#19211C] dark:text-white mb-2">Google</h3>
                                <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed max-w-[90%]">
                                    Google is a global tech leader known for innovation, offering students and freshers opportunities to learn, work on real projects, and grow in a supportive culture.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 border-t border-gray-200 dark:border-white/5 pt-5">
                                <div>
                                    <h4 className="text-[11px] text-brand-green font-medium mb-1">Business Location</h4>
                                    <p className="text-[12px] text-gray-600 dark:text-gray-300">Bio-Business Park, Marasurvaypur Village, Krishnarajapura, Hobli, Bengaluru East, Bengaluru, Karnataka 560067</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-[11px] text-brand-green font-medium mb-1">Email Address</h4>
                                        <p className="text-[12px] text-gray-600 dark:text-gray-300 truncate">HanishDav@micro.com</p>
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] text-brand-green font-medium mb-1">Phone Number</h4>
                                        <p className="text-[12px] text-gray-600 dark:text-gray-300">90876554432</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Preview Job Post Modal */}
            {isPreviewOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm" style={{ zIndex: 999999 }}>
                    {/* Modal Container */}
                    <div className="bg-white dark:bg-[#1F2320] w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl overflow-y-auto flex flex-col relative animate-in fade-in zoom-in duration-200 hide-scrollbar" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>

                        {/* Modal Header Bar */}
                        <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#1F2320]/95 backdrop-blur border-b border-gray-200 dark:border-white/5 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-[14px] font-semibold text-[#19211C] dark:text-white">Preview Job Post</h2>
                            <button onClick={() => setIsPreviewOpen(false)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-gray-500 dark:text-gray-300 transition-colors cursor-pointer">
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 md:p-8 flex flex-col gap-8">

                            {/* Job Header & Actions */}
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                {/* Left Side: Title & Company */}
                                <div className="flex items-center gap-5">
                                    <div className="w-[68px] h-[68px] rounded-full bg-white border border-gray-100 dark:border-transparent flex items-center justify-center shrink-0 shadow-sm">
                                        {/* Mock Google g logo */}
                                        <svg viewBox="0 0 24 24" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <h1 className="text-[26px] font-bold text-[#19211C] dark:text-white leading-tight mb-2">{jobTitle || "UI/UX Designer"}</h1>
                                        <div className="text-[14px] text-gray-600 dark:text-gray-300 font-medium mb-3">
                                            Google Inc ÔÇó {jobLocation || "Chennai"} ÔÇó {employmentType || "Full Time"}
                                        </div>
                                        {/* Dates */}
                                        <div className="flex flex-wrap items-center gap-5 text-[12px] font-medium text-gray-500 dark:text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#13C065]">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2.5" />
                                                    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2.5" />
                                                </svg>
                                                Posted on 27 December 2025
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#13C065]"></span>
                                                Closes at 28 February 2025
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Action Buttons */}
                                <div className="flex items-center gap-3 shrink-0">
                                    <button className="px-6 py-2.5 rounded-full text-[13px] font-medium border border-gray-300 dark:border-gray-500 text-[#19211C] dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer">
                                        Save Job
                                    </button>
                                    <button className="px-6 py-2.5 rounded-full text-[13px] font-bold bg-[#13C065] text-[#111412] hover:bg-[#10A958] transition-colors cursor-pointer">
                                        Apply Now
                                    </button>
                                </div>
                            </div>

                            {/* Job Information Bar */}
                            <div className="w-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[1px]">
                                {/* Type */}
                                <div className="bg-white dark:bg-[#1F2320] p-3 sm:p-4 flex flex-col xl:flex-row items-start xl:items-center gap-3">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E6FBF0] dark:bg-[#2A302C] flex items-center justify-center text-[#13C065] shrink-0">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">Employment Type</span>
                                        <span className="text-[12px] sm:text-[13px] font-semibold text-[#19211C] dark:text-white truncate max-w-[100px] sm:max-w-full">{employmentType}</span>
                                    </div>
                                </div>
                                {/* Mode */}
                                <div className="bg-white dark:bg-[#1F2320] p-3 sm:p-4 flex flex-col xl:flex-row items-start xl:items-center gap-3">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E6FBF0] dark:bg-[#2A302C] flex items-center justify-center text-[#13C065] shrink-0">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">Work Mode</span>
                                        <span className="text-[12px] sm:text-[13px] font-semibold text-[#19211C] dark:text-white truncate max-w-[100px] sm:max-w-full">{workMode}</span>
                                    </div>
                                </div>
                                {/* Shift */}
                                <div className="bg-white dark:bg-[#1F2320] p-3 sm:p-4 flex flex-col xl:flex-row items-start xl:items-center gap-3">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E6FBF0] dark:bg-[#2A302C] flex items-center justify-center text-[#13C065] shrink-0">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="4" />
                                            <path d="M12 3v2M12 19v2M3.5 12h2M18.5 12h2M5.5 5.5l1.5 1.5M17 17l1.5 1.5M5.5 18.5l1.5-1.5M17 7l1.5-1.5" />
                                            <path d="M15 9a5 5 0 0 1 0 6 7 7 0 0 0 0-6Z" fill="currentColor" stroke="none" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">Shift</span>
                                        <span className="text-[12px] sm:text-[13px] font-semibold text-[#19211C] dark:text-white whitespace-nowrap">{shift} Shift</span>
                                    </div>
                                </div>
                                {/* Experience */}
                                <div className="bg-white dark:bg-[#1F2320] p-3 sm:p-4 flex flex-col xl:flex-row items-start xl:items-center gap-3">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E6FBF0] dark:bg-[#2A302C] flex items-center justify-center text-[#13C065] shrink-0">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">Experience Level</span>
                                        <span className="text-[12px] sm:text-[13px] font-semibold text-[#19211C] dark:text-white whitespace-nowrap truncate max-w-[100px] sm:max-w-full">{experience}</span>
                                    </div>
                                </div>
                                {/* CTC */}
                                <div className="bg-white dark:bg-[#1F2320] p-3 sm:p-4 flex flex-col xl:flex-row items-start xl:items-center gap-3 md:col-span-2 lg:col-span-1">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E6FBF0] dark:bg-[#2A302C] flex items-center justify-center text-[#13C065] shrink-0">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3h12M6 8h12M9 13l6-10M12 6v15" /></svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">Annual CTC</span>
                                        <span className="text-[12px] sm:text-[13px] font-semibold text-[#19211C] dark:text-white whitespace-nowrap">{minCtc} - {maxCtc}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Markdown Sections Container */}
                            <div className="flex flex-col gap-6 text-[13px]">

                                {/* Job Description */}
                                <div>
                                    <h3 className="font-semibold text-[#19211C] dark:text-white mb-3">Job Description</h3>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-4xl whitespace-pre-line">
                                        {jobDesc || "We are looking for creative and passionate students or recent graduates..."}
                                    </p>
                                </div>

                                {/* Responsibilities */}
                                <div>
                                    <h3 className="font-semibold text-[#19211C] dark:text-white mb-3">Responsibilities</h3>
                                    <ul className="flex flex-col gap-2.5">
                                        {(responsibilities || "- Design wireframes, UI screens, and simple prototypes\n- Collaborate with developers to ensure accurate design implementation\n- Participate in design discussions and review sessions\n- Assist in improving user experience across products\n- Maintain visual consistency and design standards").split('\n').filter(Boolean).map((resp, idx) => (
                                            <li key={idx} className="flex gap-3 text-gray-600 dark:text-gray-300">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#13C065] shrink-0 mt-0.5">
                                                    <path d="M12 2L15 8L22 9L17 14L18 21L12 17L6 21L7 14L2 9L9 8L12 2Z" fill="currentColor" stroke="none" />
                                                </svg>
                                                <span className="leading-relaxed">{resp.replace(/^- /, '')}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Eligibility */}
                                <div>
                                    <h3 className="font-semibold text-[#19211C] dark:text-white mb-3">Eligibility</h3>
                                    <ul className="flex flex-col gap-2.5">
                                        {(eligibility || "- Final-year students & recent graduates\n- 2024 / 2025 pass-outs\n- Basic UI/UX knowledge\n- Portfolio or academic projects accepted").split('\n').filter(Boolean).map((el, idx) => (
                                            <li key={idx} className="flex gap-3 text-gray-600 dark:text-gray-300">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#13C065] shrink-0 mt-0.5">
                                                    <path d="M12 2L15 8L22 9L17 14L18 21L12 17L6 21L7 14L2 9L9 8L12 2Z" fill="currentColor" stroke="none" />
                                                </svg>
                                                <span className="leading-relaxed">{el.replace(/^- /, '')}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Required Skills */}
                                <div>
                                    <h3 className="font-semibold text-[#19211C] dark:text-white mb-3">Required Skills (Mandatory for shortlisting)</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.length > 0 ? skills.map((skill: string, idx: number) => (
                                            <span key={idx} className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white text-gray-800 dark:text-black border border-gray-200 dark:border-transparent font-semibold text-[11px]">
                                                {skill}
                                            </span>
                                        )) : (
                                            <span className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white text-gray-800 dark:text-black border border-gray-200 dark:border-transparent font-semibold text-[11px]">Figma</span>
                                        )}
                                    </div>
                                </div>

                                {/* Nice-to-Have Skills */}
                                <div>
                                    <h3 className="font-semibold text-[#19211C] dark:text-white mb-2">Nice-to-Have Skills</h3>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-4xl">
                                        {niceToHave || "Basic knowledge of HTML/CSS, Awareness of responsive design principles."}
                                    </p>
                                </div>

                                {/* What You Will Learn */}
                                <div>
                                    <h3 className="font-semibold text-[#19211C] dark:text-white mb-3">What You Will Learn</h3>
                                    <ul className="flex flex-col gap-2.5">
                                        {(learn || "- Industry-standard UI/UX design workflows\n- Working with real product requirements and timelines\n- Collaboration with cross-functional teams\n- Iterating designs based on feedback and usability insights\n- Exposure to professional design systems and best practices").split('\n').filter(Boolean).map((item, idx) => (
                                            <li key={idx} className="flex gap-3 text-gray-600 dark:text-gray-300">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#13C065] shrink-0 mt-0.5">
                                                    <path d="M12 2L15 8L22 9L17 14L18 21L12 17L6 21L7 14L2 9L9 8L12 2Z" fill="currentColor" stroke="none" />
                                                </svg>
                                                <span className="leading-relaxed">{item.replace(/^- /, '')}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ÔöÇÔöÇÔöÇ Helper Components ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

function RichTextArea({ label, required, completed, value, onChange, maxLength }: any) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-[12px] font-semibold flex items-center gap-1.5 text-[#19211C] dark:text-white/90">
                {label}
                {completed ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-brand-green">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ) : required ? (
                    <span className="text-red-500">*</span>
                ) : null}
            </label>
            <div className="bg-white dark:bg-[#1F2320] border border-gray-200 dark:border-white/5 rounded-xl overflow-hidden focus-within:border-brand-green/30 transition-colors">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-[#1F2320]">
                    <div className="flex items-center gap-2">
                        <button className="p-1 rounded hover:bg-white/10 text-brand-green transition-colors">
                            <span className="font-serif font-bold italic text-[13px] leading-none">B</span>
                        </button>
                        <button className="p-1 rounded hover:bg-white/10 text-[#19211C] dark:text-white transition-colors">
                            <span className="font-serif italic text-[13px] leading-none">I</span>
                        </button>
                        <button className="p-1 rounded hover:bg-white/10 text-brand-green transition-colors flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="8" y1="6" x2="21" y2="6"></line>
                                <line x1="8" y1="12" x2="21" y2="12"></line>
                                <line x1="8" y1="18" x2="21" y2="18"></line>
                                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                <line x1="3" y1="18" x2="3.01" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 uppercase">
                        {value.length}/{maxLength}
                    </span>
                </div>
                {/* Text Area */}
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    maxLength={maxLength}
                    className="w-full h-[80px] bg-transparent text-[13px] text-gray-600 dark:text-gray-300 p-4 focus:outline-none resize-none leading-relaxed"
                    placeholder="Type here..."
                />
            </div>
        </div>
    );
}

function TagsInput({ label, required, tags, onAdd, onRemove }: any) {
    const [input, setInput] = useState("");

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && input.trim()) {
            e.preventDefault();
            onAdd(input.trim());
            setInput("");
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-[12px] font-semibold flex items-center gap-1.5 text-[#19211C] dark:text-white/90">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#1F2320] border border-gray-200 dark:border-white/5 rounded-2xl px-5 py-4 min-h-[56px] focus-within:border-brand-green/30 transition-colors">
                {tags.map((tag: string) => (
                    <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-white text-[#111412] text-[11px] font-semibold rounded-full shadow-sm">
                        {tag}
                        <button onClick={() => onRemove(tag)} className="hover:bg-gray-200 rounded-full ml-1">
                            <XIcon className="w-3.5 h-3.5 text-gray-600" strokeWidth={2.5} />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-[13px] text-gray-600 dark:text-gray-300 focus:outline-none min-w-[100px]"
                    placeholder={tags.length === 0 ? "Type and press Enter to add skills..." : ""}
                />
            </div>
        </div>
    );
}

// ÔöÇÔöÇÔöÇ Advanced Toast Variant ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

interface AdvancedToastProps {
    type: "success" | "credits" | "error" | "warning" | "info";
    title: string;
    message: string;
    primaryAction?: string;
}

function AdvancedToast({ type, title, message, primaryAction }: AdvancedToastProps) {
    const config = {
        success: {
            bgIcon: "bg-[#13C065]",
            icon: <CheckCircle2 className="w-5 h-5 text-[#19211C] dark:text-white" strokeWidth={2.5} />,
        },
        credits: {
            bgIcon: "bg-[#FFB020]",
            icon: <Gem className="w-5 h-5 text-[#19211C] dark:text-white" fill="currentColor" strokeWidth={0} />,
        },
        error: {
            bgIcon: "bg-[#FF4A4A]",
            icon: <XCircle className="w-5 h-5 text-[#19211C] dark:text-white" strokeWidth={2.5} />,
        },
        warning: {
            bgIcon: "bg-[#FFB020]",
            icon: <AlertCircle className="w-5 h-5 text-[#19211C] dark:text-white" strokeWidth={2.5} />,
        },
        info: {
            bgIcon: "bg-[#33B6FF]",
            icon: <InfoIcon className="w-5 h-5 text-[#19211C] dark:text-white" strokeWidth={2.5} />,
        }
    };

    const currentConfig = config[type];

    if (type === "success") {
        return (
            <div className="flex items-center justify-between bg-[#151816] border border-[#272E2A] rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-3.5 min-w-0">
                    {/* Icon */}
                    <div className="w-9 h-9 flex-shrink-0 rounded-full bg-[#13C065] flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col justify-center min-w-0">
                        <h4 className="text-[14px] font-bold text-[#19211C] dark:text-white leading-tight truncate">Jobost Created</h4>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-[4px] truncate">{message}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    {primaryAction && (
                        <button className="px-[14px] py-[6px] bg-[#222824] hover:bg-white dark:bg-[#2A302C] border border-[#2A302C] rounded-full text-[12px] font-semibold text-gray-200 transition-colors whitespace-nowrap cursor-pointer">
                            {primaryAction}
                        </button>
                    )}
                    {/* Close Button */}
                    <button className="w-7 h-7 rounded-full bg-[#222824] hover:bg-white dark:bg-[#2A302C] border border-[#2A302C] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#19211C] dark:text-white transition-colors cursor-pointer shrink-0">
                        <XIcon className="w-[14px] h-[14px]" strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between bg-[#151816] border border-gray-200 dark:border-white/5 rounded-2xl p-4 shadow-xl">
            <div className="flex items-start gap-3.5">
                {/* Icon */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${currentConfig.bgIcon}`}>
                    {currentConfig.icon}
                </div>

                {/* Content */}
                <div className="flex flex-col justify-center translate-y-[2px]">
                    <h4 className="text-[14px] font-bold text-[#19211C] dark:text-white leading-tight">{title}</h4>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-[4px]">{message}</p>
                </div>
            </div>

            <div className="flex items-center gap-3 ml-4">
                {primaryAction && (
                    <button className="px-4 py-2 bg-white dark:bg-[#2A302C]/60 hover:bg-[#343D38] border border-gray-200 dark:border-white/5 rounded-full text-[12px] font-semibold text-gray-200 transition-colors whitespace-nowrap cursor-pointer shadow-sm">
                        {primaryAction}
                    </button>
                )}
                <button className="w-[26px] h-[26px] rounded-full bg-white dark:bg-[#2A302C]/60 hover:bg-[#343D38] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#19211C] dark:text-white transition-colors cursor-pointer shrink-0 border border-gray-200 dark:border-white/5">
                    <XIcon className="w-4 h-4" strokeWidth={2} />
                </button>
            </div>
        </div>
    );
}
