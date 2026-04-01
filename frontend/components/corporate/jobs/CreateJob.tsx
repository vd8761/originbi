import React, { useRef, useState } from "react";
import { ChevronDownIcon, XIcon, CheckCircle2, AlertCircle, InfoIcon, XCircle, Gem } from "lucide-react";
import { AnnualCtcJobIcon, EmploymentTypeJobIcon, ExperienceLevelJobIcon, ShiftJobIcon, WorkModeJobIcon } from "../../icons";

export interface CreateJobProps {
    onBack?: () => void;
    mode?: "create" | "edit";
    initialData?: {
        title?: string;
        employmentType?: string;
        shift?: string;
        experienceLevel?: string;
        jobLocation?: string;
        workMode?: string;
    };
}

export default function CreateJob({ onBack, mode = "create", initialData }: CreateJobProps) {
    // Form State
    const [jobTitle, setJobTitle] = useState(initialData?.title ?? "UI/UX Designer");
    const [employmentType, setEmploymentType] = useState(initialData?.employmentType ?? "Internship");
    const [shift, setShift] = useState(initialData?.shift ?? "Day");
    const [experience, setExperience] = useState(initialData?.experienceLevel ?? "Fresher");
    const [jobLocation, setJobLocation] = useState(initialData?.jobLocation ?? "Chennai, Tamil Nadu");
    const [workMode, setWorkMode] = useState(initialData?.workMode ?? "Onsite");

    const [minCtc, setMinCtc] = useState("3,50,000");
    const [maxCtc, setMaxCtc] = useState("4,50,000");

    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const [jobDesc, setJobDesc] = useState("We are looking for creative and passionate students or recent graduates to join our team as UX/UI Designers. This role is ideal for freshers who want to learn, gain practical experience, and build a strong portfolio while working on real projects.");
    const [responsibilities, setResponsibilities] = useState("- Design wireframes, UI screens, and simple prototypes\n- Collaborate with developers to ensure accurate design implementation");
    const [eligibility, setEligibility] = useState("");
    const [niceToHave, setNiceToHave] = useState("Basic knowledge of HTML/CSS, Awareness of responsive design principles");
    const [learn, setLearn] = useState("");

    // UI State
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const [skills, setSkills] = useState(["Figma", "Prototyping", "Wire Framing", "Adobe XD"]);

    return (
        <div className="thin-ui-page h-full w-full font-sans bg-[#F8F9FA] dark:bg-[#19211C] text-[#19211C] dark:text-white overflow-y-auto flex justify-center transition-colors duration-200">
            <div className="w-full flex flex-col gap-5 px-3 py-4 sm:px-4 sm:py-5 lg:px-6 xl:px-8">
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
                    <span className="text-brand-green font-normal">Create Job</span>
                </div>

                {/* Header Area */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-white/5 pb-5">
                    <div className="flex items-center gap-4">
                        <h1 className="text-[36px] lg:text-[42px] font-semibold text-[#19211C] dark:text-white leading-[100%]">
                            {mode === "edit" ? "Edit Job Post" : "Create a Job Post"}
                        </h1>
                        <div className="flex items-center gap-2 text-[16px] text-gray-600 dark:text-white/95 font-normal ml-2">
                            <span className="w-2 h-2 rounded-full bg-[#13C065] shrink-0"></span>
                            Draft Auto Saved...
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="bg-white dark:bg-[#555B57] border border-gray-200 dark:border-transparent shadow-sm px-5 py-2.5 rounded-full text-[16px] font-normal text-[#19211C] dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors cursor-pointer">
                            Save Draft
                        </button>
                        <button onClick={() => setIsPreviewOpen(true)} className="bg-white dark:bg-[#555B57] border border-gray-200 dark:border-transparent shadow-sm px-5 py-2.5 rounded-full text-[16px] font-normal text-[#19211C] dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors cursor-pointer">
                            Preview as Candidate
                        </button>
                        <button className="px-6 py-2.5 rounded-full text-[16px] font-normal bg-[#13C065] text-white hover:bg-[#10A958] transition-colors border border-transparent shadow-sm cursor-pointer whitespace-nowrap">
                            {mode === "edit" ? "Update Job" : "Post Job"}
                        </button>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="flex flex-col xl:flex-row gap-7 mt-2">

                    {/* Left Form Column */}
                        <div className="flex-1 min-w-0 flex flex-col w-full mb-8 pb-16">
                            {/* Overall Form Container Box - All Sections */}
                            <div className="bg-white dark:bg-[#2A302C] border border-transparent dark:border-transparent rounded-xl p-8 flex flex-col gap-0 shadow-sm dark:shadow-none">

                                {/* Section 1: Basic Job Information */}
                                <div className="flex flex-col gap-6 pb-8">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[22px] font-normal flex items-center gap-2 text-[#19211C] dark:text-white leading-[100%]">
                                            Basic Job Information
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-brand-green mt-0.5">
                                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </h2>
                                        <span className="font-['Haskoy'] text-[16px] leading-[21px] text-right font-normal text-gray-500 dark:text-[#FFFFFF]">Job ID : 18722765562</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
                                        {/* Job Title */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[16px] font-normal text-gray-600 dark:text-white flex items-center gap-1">
                                                Job Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={jobTitle}
                                                onChange={(e) => setJobTitle(e.target.value)}
                                                className="w-full bg-white dark:bg-[#555B57] border border-gray-200 dark:border-transparent rounded-full px-5 h-[48px] text-[16px] font-normal text-[#19211C] dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-green/40 transition-colors"
                                            />
                                        </div>

                                        {/* Employment Type segments */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[16px] font-normal text-gray-600 dark:text-white flex items-center gap-1">
                                                Employment Type <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex items-center bg-white dark:bg-[#555B57] rounded-full border border-gray-200 dark:border-transparent overflow-hidden h-[48px]">
                                                {["Full Time", "Part Time", "Internship"].map((type, idx, arr) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => setEmploymentType(type)}
                                                        className={`flex-1 text-center h-full text-[16px] font-normal transition-all cursor-pointer ${employmentType === type
                                                            ? "bg-[#13C065] text-white"
                                                            : "text-gray-600 dark:text-white/95 hover:bg-black/5 dark:hover:bg-white/5"
                                                            } ${idx !== arr.length - 1 && employmentType !== type && employmentType !== arr[idx + 1] ? 'border-r border-gray-200 dark:border-white/5' : ''}`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Work Mode */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[16px] font-normal text-gray-600 dark:text-white flex items-center gap-1">
                                                Work Mode <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <div 
                                                    onClick={() => setActiveDropdown(activeDropdown === 'workMode' ? null : 'workMode')}
                                                    className="w-full bg-white dark:bg-[#555B57] border border-gray-200 dark:border-transparent rounded-full pl-5 pr-10 h-[48px] text-[16px] font-normal text-gray-700 dark:text-white flex items-center justify-between cursor-pointer transition-colors"
                                                >
                                                    {workMode}
                                                    <ChevronDownIcon className={`absolute right-5 w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${activeDropdown === 'workMode' ? 'rotate-180' : ''}`} />
                                                </div>
                                                
                                                {activeDropdown === 'workMode' && (
                                                    <>
                                                        <div 
                                                            className="fixed inset-0 z-[40]" 
                                                            onClick={() => setActiveDropdown(null)}
                                                        />
                                                        <div className="absolute left-0 top-full mt-2 w-full bg-white/14 dark:bg-[rgba(25,33,28,0.12)] border border-[rgba(25,33,28,0.08)] dark:border-[rgba(255,255,255,0.2)] rounded-xl shadow-[0_16px_40px_rgba(25,33,28,0.05)] dark:shadow-[0_16px_40px_rgba(25,33,28,0.6)] backdrop-blur-[20px] z-50 overflow-hidden py-1.5 box-border">
                                                            {['Onsite', 'Hybrid', 'Remote'].map((option) => (
                                                                <div 
                                                                    key={option}
                                                                    onClick={() => {
                                                                        setWorkMode(option);
                                                                        setActiveDropdown(null);
                                                                    }}
                                                                    className="px-5 py-2.5 text-[16px] font-normal text-gray-700 dark:text-white/90 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer"
                                                                >
                                                                    {option}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Shift segments */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[16px] font-normal text-gray-600 dark:text-white flex items-center gap-1">
                                                Shift
                                            </label>
                                            <div className="flex items-center bg-white dark:bg-[#555B57] rounded-full border border-gray-200 dark:border-transparent overflow-hidden h-[48px]">
                                                {["Day", "Night"].map((s, idx, arr) => (
                                                    <button
                                                        key={s}
                                                        onClick={() => setShift(s)}
                                                        className={`flex-1 text-center h-full text-[16px] font-normal transition-all cursor-pointer ${shift === s
                                                            ? "bg-[#13C065] text-white"
                                                            : "text-gray-600 dark:text-white/95 hover:bg-black/5 dark:hover:bg-white/5"
                                                            } ${idx !== arr.length - 1 && shift !== s && shift !== arr[idx + 1] ? 'border-r border-gray-200 dark:border-white/5' : ''}`}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Experience Level */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[16px] font-normal text-gray-600 dark:text-white flex items-center gap-1">
                                                Experience Level
                                            </label>
                                            <div className="relative">
                                                <div 
                                                    onClick={() => setActiveDropdown(activeDropdown === 'experience' ? null : 'experience')}
                                                    className="w-full bg-white dark:bg-[#555B57] border border-gray-200 dark:border-transparent rounded-full pl-5 pr-10 h-[48px] text-[16px] font-normal text-gray-700 dark:text-white flex items-center justify-between cursor-pointer transition-colors"
                                                >
                                                    {experience}
                                                    <ChevronDownIcon className={`absolute right-5 w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${activeDropdown === 'experience' ? 'rotate-180' : ''}`} />
                                                </div>
                                                
                                                {activeDropdown === 'experience' && (
                                                    <>
                                                        <div 
                                                            className="fixed inset-0 z-[40]" 
                                                            onClick={() => setActiveDropdown(null)}
                                                        />
                                                        <div className="absolute left-0 top-full mt-2 w-full bg-white/14 dark:bg-[rgba(25,33,28,0.12)] border border-[rgba(25,33,28,0.08)] dark:border-[rgba(255,255,255,0.2)] rounded-xl shadow-[0_16px_40px_rgba(25,33,28,0.05)] dark:shadow-[0_16px_40px_rgba(25,33,28,0.6)] backdrop-blur-[20px] z-50 overflow-hidden py-1.5 box-border">
                                                            {['Fresher', '1-3 Years', '3-5 Years', '5+ Years'].map((option) => (
                                                                <div 
                                                                    key={option}
                                                                    onClick={() => {
                                                                        setExperience(option);
                                                                        setActiveDropdown(null);
                                                                    }}
                                                                    className="px-5 py-2.5 text-[16px] font-normal text-gray-700 dark:text-white/90 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer"
                                                                >
                                                                    {option}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Job Location */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[16px] font-normal text-gray-600 dark:text-white flex items-center gap-1">
                                                Job Location
                                            </label>
                                            <input
                                                type="text"
                                                value={jobLocation}
                                                onChange={(e) => setJobLocation(e.target.value)}
                                                className="w-full bg-white dark:bg-[#555B57] border border-gray-200 dark:border-transparent rounded-full px-5 h-[48px] text-[16px] font-normal text-[#19211C] dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-green/40 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Hiring Timeline & Compensation */}
                                <div className="flex flex-col gap-6 border-t border-gray-200 dark:border-white/10 py-8">
                                    <h2 className="text-[22px] font-normal flex items-center gap-2 text-[#19211C] dark:text-white leading-[100%]">
                                        Hiring Timeline & Compensation
                                        <div className="w-[18px] h-[18px] flex items-center justify-center mt-0.5">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </div>
                                    </h2>

                                    <div className="flex flex-col md:flex-row md:items-end gap-y-6 md:gap-x-6">
                                        {/* Hiring Timeline */}
                                        <div className="flex flex-col gap-2 md:w-[360px]">
                                            <label className="text-[14px] font-normal text-gray-600 dark:text-white flex items-center gap-1">
                                                Hiring Timeline <span className="text-red-500">*</span>
                                            </label>
                                            <button className="w-full h-[46px] flex items-center justify-between bg-white dark:bg-[#434844] border border-gray-200 dark:border-transparent rounded-full px-5 text-[14px] text-gray-600 dark:text-white transition-colors cursor-pointer shadow-sm">
                                                <div className="flex items-center gap-3">
                                                       <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                           <path d="M15.3 2.7H14.4V0.9C14.4 0.661305 14.3052 0.432387 14.1364 0.263604C13.9676 0.0948211 13.7387 0 13.5 0C13.2613 0 13.0324 0.0948211 12.8636 0.263604C12.6948 0.432387 12.6 0.661305 12.6 0.9V2.7H5.4V0.9C5.4 0.661305 5.30518 0.432387 5.1364 0.263604C4.96761 0.0948211 4.73869 0 4.5 0C4.2613 0 4.03239 0.0948211 3.8636 0.263604C3.69482 0.432387 3.6 0.661305 3.6 0.9V2.7H2.7C1.98392 2.7 1.29716 2.98446 0.790812 3.49081C0.284464 3.99716 0 4.68392 0 5.4V6.3H18V5.4C18 4.68392 17.7155 3.99716 17.2092 3.49081C16.7028 2.98446 16.0161 2.7 15.3 2.7Z" fill="#1ED36A" />
                                                           <path d="M0 15.3C0 16.0161 0.284464 16.7028 0.790812 17.2092C1.29716 17.7155 1.98392 18 2.7 18H15.3C16.0161 18 16.7028 17.7155 17.2092 17.2092C17.7155 16.7028 18 16.0161 18 15.3V8.09998H0V15.3Z" fill="#1ED36A" />
                                                       </svg>
                                                    <span className="text-[#0D6D3A] dark:text-white font-normal whitespace-nowrap">09 Oct to 08 Nov 2025</span>
                                                    <span className="text-gray-500 dark:text-gray-300 font-normal whitespace-nowrap"> (30 Days)</span>
                                                </div>
                                                <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                            </button>
                                        </div>

                                        {/* Annual CTC */}
                                        <div className="flex flex-col gap-2 md:w-[380px]">
                                            <label className="text-[14px] font-normal text-gray-600 dark:text-white flex items-center gap-1">
                                                Annual CTC (₹ / year) <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-[46px] flex items-center bg-white dark:bg-[#434844] border border-gray-200 dark:border-transparent rounded-full px-5 transition-colors shadow-sm">
                                                    <span className="text-[14px] font-normal text-gray-500 dark:text-gray-300 mr-2">MIN</span>
                                                    <span className="text-[14px] text-gray-600 dark:text-white mr-1.5 font-normal">₹</span>
                                                    <input
                                                        type="text"
                                                        value={minCtc}
                                                        onChange={(e) => setMinCtc(e.target.value)}
                                                        className="w-full bg-transparent text-[14px] text-gray-900 dark:text-white focus:outline-none"
                                                    />
                                                </div>

                                                <span className="text-gray-500">-</span>

                                                <div className="flex-1 h-[46px] flex items-center bg-white dark:bg-[#434844] border border-gray-200 dark:border-transparent rounded-full px-5 transition-colors shadow-sm">
                                                    <span className="text-[14px] font-normal text-gray-500 dark:text-gray-300 mr-2">MAX</span>
                                                    <span className="text-[14px] text-gray-600 dark:text-white mr-1.5 font-normal">₹</span>
                                                    <input
                                                        type="text"
                                                        value={maxCtc}
                                                        onChange={(e) => setMaxCtc(e.target.value)}
                                                        className="w-full bg-transparent text-[14px] text-gray-900 dark:text-white focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Rich Text Areas & Skills */}
                                <div className="flex flex-col gap-6 border-t border-gray-200 dark:border-white/10 pt-8">
                                    <div className="flex items-center gap-2 px-1 mb-[-8px]">
                                        <h2 className="text-[22px] font-normal text-[#19211C] dark:text-white">Job Description</h2>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#13C065] mt-0.5">
                                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>

                                    <RichTextArea
                                        label="About the Job"
                                        required={true}
                                        completed={false}
                                        value={jobDesc}
                                        onChange={setJobDesc}
                                        maxLength={250}
                                    />

                                    <RichTextArea
                                        label="Responsibilities"
                                        required={true}
                                        completed={false}
                                        value={responsibilities}
                                        onChange={setResponsibilities}
                                        maxLength={850}
                                    />

                                    <RichTextArea
                                        label="Eligibility"
                                        required={true}
                                        completed={false}
                                        value={eligibility}
                                        onChange={setEligibility}
                                        maxLength={150}
                                    />

                                    <TagsInput
                                        label="Required Skills (Max 15)"
                                        required={true}
                                        tags={skills}
                                        onAdd={(tag: string) => {
                                            if (skills.length < 15 && tag) setSkills([...skills, tag]);
                                        }}
                                        onRemove={(tagToRemove: string) => setSkills(skills.filter(t => t !== tagToRemove))}
                                    />

                                    <RichTextArea
                                        label="Nice-to-Have Skills (Optional)"
                                        required={false}
                                        completed={false}
                                        value={niceToHave}
                                        onChange={setNiceToHave}
                                        maxLength={150}
                                    />

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
                        </div>

                    {/* Right Preview Column */}
                    <div className="w-full xl:w-[520px] 2xl:w-[560px] shrink-0 flex flex-col gap-0 mt-2 xl:mt-0">
                        {/* Employer Details Box Container */}
                        <div className="bg-white dark:bg-[#2A302C] border border-transparent dark:border-transparent rounded-xl p-6 flex flex-col gap-4 shadow-sm dark:shadow-none">
                            {/* Employer Details Header */}
                            <h2 className="text-[22px] font-normal text-[#19211C] dark:text-white">Employer Details</h2>
                            <div className="flex flex-col items-center mt-2 mb-6 text-center">
                                {/* Using the solid Google Logo from the design */}
                                <div className="w-[60px] h-[60px] bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-transparent">
                                    <svg viewBox="0 0 24 24" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                </div>
                                <h3 className="text-[44px] font-normal text-[#19211C] dark:text-white mb-2 tracking-wide leading-[100%]">Google</h3>
                                <p className="text-[16px] text-[#19211C] dark:text-white leading-relaxed">
                                    Google is a global tech leader known for innovation, offering students and freshers opportunities to learn, work on real projects, and grow in a creative culture.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 border-t border-transparent dark:border-white/10 pt-5">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 pr-6">
                                        <h4 className="text-[16px] text-[#19211C] dark:text-white/70 font-normal mb-1.5">Business Location</h4>
                                        <p className="text-[16px] text-[#19211C] dark:text-white leading-relaxed font-normal">Rio Business Park, Mahadevapura Village, Krishnarajapuram, Hobli, Bengaluru East, Bengaluru, Karnataka 560037</p>
                                    </div>
                                    <ChevronDownIcon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <h4 className="text-[16px] text-[#19211C] dark:text-white/70 font-normal mb-1.5">Email Address</h4>
                                        <p className="text-[16px] text-[#19211C] dark:text-white font-normal truncate">Monish@touchmarkdes.com</p>
                                    </div>
                                    <div>
                                        <h4 className="text-[16px] text-[#19211C] dark:text-white/70 font-normal mb-1.5">Mobile Number</h4>
                                        <p className="text-[16px] text-[#19211C] dark:text-white font-normal">90876554432</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* End Employer Details Box Container */}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-brand-text-light-secondary dark:text-brand-text-secondary mt-auto pb-4">
                    <div className="flex gap-4 w-full sm:w-1/2 justify-center sm:justify-start">
                        <a href="#" className="text-brand-green hover:text-brand-green/80 transition-colors underline cursor-pointer">Privacy Policy</a>
                        <div className="h-4 w-px bg-brand-light-tertiary dark:bg-brand-dark-tertiary"></div>
                        <a href="#" className="text-brand-green hover:text-brand-green/80 transition-colors underline cursor-pointer">Terms &amp; Conditions</a>
                    </div>
                    <div className="text-center sm:text-right w-full sm:w-1/2 font-normal text-[#19211C] dark:text-[#FFFFFF]">
                        &copy; {new Date().getFullYear()} Origin BI, Made with by{" "}
                        <span className="underline text-[#1ED36A] hover:text-[#1ED36A]/80 transition-colors cursor-pointer">
                            Touchmark Descience Pvt. Ltd.
                        </span>
                    </div>
                </div>
            </div>

            {/* Preview Job Post Modal */}
            {isPreviewOpen && (
                <div
                    className="fixed inset-0 z-[99999] flex items-start justify-center px-4 sm:px-6 py-8 md:py-12 bg-black/70 dark:bg-black/80 overflow-y-auto"
                    style={{ zIndex: 999999 }}
                    onClick={() => setIsPreviewOpen(false)}
                >
                    {/* Modal Container */}
                    <div
                        className="bg-white dark:bg-[#19211C] border border-transparent dark:border-white/10 w-full max-w-[1060px] h-fit rounded-[24px] shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200 my-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header Bar */}
                        <div className="z-10 bg-white/95 dark:bg-transparent backdrop-blur-none border-b border-gray-200 dark:border-white/10 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-[18px] font-semibold text-[#19211C] dark:text-white">Preview Job Post</h2>
                            <button
                                type="button"
                                onClick={() => setIsPreviewOpen(false)}
                                className="w-7 h-7 rounded-full bg-[#223227]/90 hover:bg-[#2b3d31] border border-[#2f5a45] flex items-center justify-center text-[#1ED36A] transition-colors cursor-pointer"
                                aria-label="Close preview"
                            >
                                <XIcon className="w-4 h-4" strokeWidth={3} />
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
                                        <h1 className="font-['Haskoy'] text-[44px] font-normal text-[#19211C] dark:text-white leading-[100%] tracking-[0px] mb-2">{jobTitle || "UI/UX Designer"}</h1>
                                        <div className="font-['Haskoy'] text-[18px] text-[#19211C] dark:text-white font-normal leading-[100%] tracking-[0px] mb-3">
                                            Google Inc &middot; {jobLocation || "Chennai"} &middot; {employmentType || "Full Time"}
                                        </div>
                                        {/* Dates */}
                                        <div className="flex flex-wrap items-center gap-5 text-[14px] font-normal text-gray-500 dark:text-white/85">
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

                                <div className="flex items-center gap-3 shrink-0 self-end mb-1">
                                    <button className="px-6 py-2.5 rounded-full text-[13px] font-normal border border-gray-300 dark:border-white/10 text-[#19211C] dark:text-white bg-transparent hover:bg-white/5 transition-colors cursor-pointer">
                                        Save Job
                                    </button>
                                    <button className="px-6 py-2.5 rounded-full text-[13px] font-normal bg-[#13C065] text-white hover:bg-[#10A958] transition-colors cursor-pointer shadow-sm">
                                        Apply Now
                                    </button>
                                </div>
                            </div>

                            {/* Job Information Bar */}
                            <div className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-transparent rounded-lg flex flex-row items-center divide-x divide-gray-200 dark:divide-white/10 h-[96px] px-2 md:px-0">
                                {/* Type */}
                                <div className="flex-1 px-4 md:px-6 flex flex-row items-center gap-4 min-w-0">
                                    <div className="flex items-center justify-center shrink-0">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-[#13C065] dark:border-white/[0.08] dark:bg-transparent dark:text-[#1ED36A]">
                                            <EmploymentTypeJobIcon className="w-5 h-[18px]" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] sm:text-[13px] text-gray-500 dark:text-white/70 font-normal whitespace-nowrap">Employment Type</span>
                                        <span className="text-[14px] sm:text-[15px] font-[Haskoy] font-semibold text-[#19211C] dark:text-white truncate max-w-[100px] sm:max-w-[150px]">{employmentType || "Internship / Full-Time"}</span>
                                    </div>
                                </div>
                                {/* Mode */}
                                <div className="flex-1 px-4 md:px-6 flex flex-row items-center gap-4 min-w-0">
                                    <div className="flex items-center justify-center shrink-0">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-[#13C065] dark:border-white/[0.08] dark:bg-transparent dark:text-[#1ED36A]">
                                            <WorkModeJobIcon className="w-10 h-10" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] sm:text-[13px] text-gray-500 dark:text-white/70 font-normal whitespace-nowrap">Work Mode</span>
                                        <span className="text-[14px] sm:text-[15px] font-[Haskoy] font-semibold text-[#19211C] dark:text-white truncate max-w-[100px] sm:max-w-[150px]">{workMode || "Onsite"}</span>
                                    </div>
                                </div>
                                {/* Shift */}
                                <div className="flex-1 px-4 md:px-6 flex flex-row items-center gap-4 min-w-0">
                                    <div className="flex items-center justify-center shrink-0">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-[#13C065] dark:border-white/[0.08] dark:bg-transparent dark:text-[#1ED36A]">
                                            <ShiftJobIcon className="w-6 h-6" withBackground={false} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] sm:text-[13px] text-gray-500 dark:text-white/70 font-normal whitespace-nowrap">Shift</span>
                                        <span className="text-[14px] sm:text-[15px] font-[Haskoy] font-semibold text-[#19211C] dark:text-white whitespace-nowrap">{shift || "Day"} Shift</span>
                                    </div>
                                </div>
                                {/* Experience */}
                                <div className="flex-1 px-4 md:px-6 flex flex-row items-center gap-4 min-w-0">
                                    <div className="flex items-center justify-center shrink-0">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-[#13C065] dark:border-white/[0.08] dark:bg-transparent dark:text-[#1ED36A]">
                                            <ExperienceLevelJobIcon className="w-10 h-10" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] sm:text-[13px] text-gray-500 dark:text-white/70 font-normal whitespace-nowrap">Experience Level</span>
                                        <span className="text-[14px] sm:text-[15px] font-[Haskoy] font-semibold text-[#19211C] dark:text-white whitespace-nowrap truncate max-w-[100px] sm:max-w-[150px]">{experience || "Fresher"}</span>
                                    </div>
                                </div>
                                {/* CTC */}
                                <div className="flex-1 pl-4 md:pl-6 pr-2 md:pr-4 flex flex-row items-center gap-4 min-w-0">
                                    <div className="flex items-center justify-center shrink-0">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-[#13C065] dark:border-white/[0.08] dark:bg-transparent dark:text-[#1ED36A] text-[0px] leading-none">
                                            <AnnualCtcJobIcon className="w-[15px] h-5" />
                                            ?
                                        </div>
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-[12px] sm:text-[13px] text-gray-500 dark:text-white/70 font-normal whitespace-nowrap">Annual CTC</span>
                                        <span className="text-[14px] sm:text-[15px] font-[Haskoy] font-semibold text-[#19211C] dark:text-white leading-none mt-1 whitespace-nowrap">
                                            {minCtc || "3,50,000"} - {maxCtc || "4,00,000"}
                                        </span>
                                    </div>
                                </div>
                            </div>                            {/* Markdown Sections Container */}
                            <div className="flex flex-col gap-7 text-[16px]">

                                {/* Job Description */}
                                <div>
                                    <h3 className="font-semibold text-[#19211C] dark:text-white mb-3">Job Description</h3>
                                    <p className="text-gray-700 dark:text-white/90 leading-relaxed max-w-4xl whitespace-pre-line">
                                        {jobDesc || "We are looking for creative and passionate students or recent graduates..."}
                                    </p>
                                </div>

                                {/* Responsibilities */}
                                <div>
                                    <h3 className="font-semibold text-[#19211C] dark:text-white mb-2">Responsibilities</h3>
                                    <ul className="flex flex-col gap-2.5">
                                        {(responsibilities || "- Design wireframes, UI screens, and simple prototypes\n- Collaborate with developers to ensure accurate design implementation\n- Participate in design discussions and review sessions\n- Assist in improving user experience across products\n- Maintain visual consistency and design standards").split('\n').filter(Boolean).map((resp, idx) => (
                                            <li key={idx} className="flex flex-row items-center gap-[18px] p-0 text-gray-700 dark:text-white/90">
                                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                                                    <path d="M8.1181 2.94232L7.5 0L6.88113 2.94232C6.67755 3.91022 6.19676 4.79799 5.49737 5.49737C4.79799 6.19676 3.91022 6.67755 2.94232 6.88113L0 7.5L2.94232 8.1181C3.91032 8.32176 4.79814 8.80267 5.49753 9.5022C6.19692 10.2017 6.67766 11.0896 6.88113 12.0577L7.5 15L8.1181 12.0577C8.3216 11.0895 8.80244 10.2015 9.50199 9.50199C10.2015 8.80244 11.0895 8.3216 12.0577 8.1181L15 7.49922L12.0577 6.88113C11.0896 6.67771 10.2017 6.19698 9.50214 5.49758C8.80261 4.79818 8.32171 3.91034 8.1181 2.94232Z" fill="#1ED36A" />
                                                </svg>
                                                <span className="leading-relaxed">{resp.replace(/^\s*(?:[-•✦✳❇*])\s+/, '')}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Eligibility */}
                                <div>
                                    <h3 className="font-semibold text-[#19211C] dark:text-white mb-2">Eligibility</h3>
                                    <ul className="flex flex-col gap-2.5">
                                        {(eligibility || "- Final-year students & recent graduates\n- 2024 / 2025 pass-outs\n- Basic UI/UX knowledge\n- Portfolio or academic projects accepted").split('\n').filter(Boolean).map((el, idx) => (
                                            <li key={idx} className="flex flex-row items-center gap-[18px] p-0 text-gray-700 dark:text-white/90">
                                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                                                    <path d="M8.1181 2.94232L7.5 0L6.88113 2.94232C6.67755 3.91022 6.19676 4.79799 5.49737 5.49737C4.79799 6.19676 3.91022 6.67755 2.94232 6.88113L0 7.5L2.94232 8.1181C3.91032 8.32176 4.79814 8.80267 5.49753 9.5022C6.19692 10.2017 6.67766 11.0896 6.88113 12.0577L7.5 15L8.1181 12.0577C8.3216 11.0895 8.80244 10.2015 9.50199 9.50199C10.2015 8.80244 11.0895 8.3216 12.0577 8.1181L15 7.49922L12.0577 6.88113C11.0896 6.67771 10.2017 6.19698 9.50214 5.49758C8.80261 4.79818 8.32171 3.91034 8.1181 2.94232Z" fill="#1ED36A" />
                                                </svg>
                                                <span className="leading-relaxed">{el.replace(/^\s*(?:[-•✦✳❇*])\s+/, '')}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Required Skills */}
                                <div>
                                    <h3 className="font-semibold text-[#19211C] dark:text-white mb-2">Required Skills (Mandatory for shortlisting)</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.length > 0 ? skills.map((skill: string, idx: number) => (
                                            <span key={idx} className="px-4 py-[8px] rounded-full bg-white text-gray-900 border border-gray-200 font-normal text-[14px] shadow-sm leading-none">
                                                {skill}
                                            </span>
                                        )) : (
                                            <span className="px-4 py-[8px] rounded-full bg-white text-gray-900 border border-gray-200 font-normal text-[14px] shadow-sm leading-none">Figma</span>
                                        )}
                                    </div>
                                </div>

                                {/* Nice-to-Have Skills */}
                                <div>
                                    <h3 className="font-semibold text-[#19211C] dark:text-white mb-2">Nice-to-Have Skills</h3>
                                    <p className="text-gray-700 dark:text-white/90 leading-relaxed max-w-4xl">
                                        {niceToHave || "Basic knowledge of HTML/CSS, Awareness of responsive design principles."}
                                    </p>
                                </div>

                                {/* What You Will Learn */}
                                <div>
                                    <h3 className="font-semibold text-[#19211C] dark:text-white mb-2">What You Will Learn</h3>
                                    <ul className="flex flex-col gap-2.5">
                                        {(learn || "- Industry-standard UI/UX design workflows\n- Working with real product requirements and timelines\n- Collaboration with cross-functional teams\n- Iterating designs based on feedback and usability insights\n- Exposure to professional design systems and best practices").split('\n').filter(Boolean).map((item, idx) => (
                                            <li key={idx} className="flex flex-row items-center gap-[18px] p-0 text-gray-700 dark:text-white/90">
                                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                                                    <path d="M8.1181 2.94232L7.5 0L6.88113 2.94232C6.67755 3.91022 6.19676 4.79799 5.49737 5.49737C4.79799 6.19676 3.91022 6.67755 2.94232 6.88113L0 7.5L2.94232 8.1181C3.91032 8.32176 4.79814 8.80267 5.49753 9.5022C6.19692 10.2017 6.67766 11.0896 6.88113 12.0577L7.5 15L8.1181 12.0577C8.3216 11.0895 8.80244 10.2015 9.50199 9.50199C10.2015 8.80244 11.0895 8.3216 12.0577 8.1181L15 7.49922L12.0577 6.88113C11.0896 6.67771 10.2017 6.19698 9.50214 5.49758C8.80261 4.79818 8.32171 3.91034 8.1181 2.94232Z" fill="#1ED36A" />
                                                </svg>
                                                <span className="leading-relaxed">{item.replace(/^\s*(?:[-•✦✳❇*])\s+/, '')}</span>
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

// ─── Helper Components ──────────────────────────────────────────

function RichTextArea({ label, required, completed, value, onChange, maxLength }: any) {
    const [isBoldSelected, setIsBoldSelected] = useState(false);
    const [isItalicSelected, setIsItalicSelected] = useState(false);
    const [isListSelected, setIsListSelected] = useState(false);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    const applyStarList = () => {
        const el = textAreaRef.current;
        if (!el) return;

        const start = el.selectionStart;
        const end = el.selectionEnd;

        if (start === end) {
            const lineStart = value.lastIndexOf("\n", start - 1) + 1;
            const lineEndRaw = value.indexOf("\n", start);
            const lineEnd = lineEndRaw === -1 ? value.length : lineEndRaw;
            const currentLine = value.slice(lineStart, lineEnd);

            if (/^\s*(?:[-•✦✳❇*])\s+/.test(currentLine)) {
                const cleanedLine = currentLine.replace(/^\s*(?:[-•✦✳❇*])\s+/, "");
                const nextValue = value.slice(0, lineStart) + cleanedLine + value.slice(lineEnd);
                onChange(nextValue);
                return;
            }

            const nextValue = value.slice(0, lineStart) + `✦ ${currentLine}` + value.slice(lineEnd);
            onChange(nextValue);
            requestAnimationFrame(() => {
                el.focus();
                const delta = 2;
                el.setSelectionRange(start + delta, start + delta);
            });
            return;
        }

        const selected = value.slice(start, end);
        const lines = selected.split("\n");
        const nextSelected = lines
            .map((line: string) => {
                if (!line.trim()) return line;
                if (/^\s*(?:[-•✦✳❇*])\s+/.test(line)) {
                    return line.replace(/^\s*(?:[-•✦✳❇*])\s+/, "✦ ");
                }
                return `✦ ${line}`;
            })
            .join("\n");

        const nextValue = value.slice(0, start) + nextSelected + value.slice(end);
        onChange(nextValue);
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(start, start + nextSelected.length);
        });
    };

    const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== "Enter") return;

        const el = e.currentTarget;
        const cursor = el.selectionStart;
        const lineStart = value.lastIndexOf("\n", cursor - 1) + 1;
        const currentLine = value.slice(lineStart, cursor);

        if (/^\s*[✦✳❇]\s+/.test(currentLine)) {
            e.preventDefault();
            const insertion = "\n✦ ";
            const nextValue = value.slice(0, cursor) + insertion + value.slice(el.selectionEnd);
            onChange(nextValue);
            requestAnimationFrame(() => {
                el.focus();
                const nextPos = cursor + insertion.length;
                el.setSelectionRange(nextPos, nextPos);
            });
        }
    };

    const handleTextareaScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (!overlayRef.current) return;
        overlayRef.current.scrollTop = e.currentTarget.scrollTop;
        overlayRef.current.scrollLeft = e.currentTarget.scrollLeft;
    };

    const renderEditablePreview = (text: string) => {
        const lines = text.split("\n");

        return lines.map((line, idx) => {
            const bulletMatch = line.match(/^\s*(?:[-•✦✳❇*])\s+(.*)$/);

            if (bulletMatch) {
                return (
                    <div key={idx} className="flex items-center gap-[10px] leading-[100%] min-h-[24px]">
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                            <path d="M8.1181 2.94232L7.5 0L6.88113 2.94232C6.67755 3.91022 6.19676 4.79799 5.49737 5.49737C4.79799 6.19676 3.91022 6.67755 2.94232 6.88113L0 7.5L2.94232 8.1181C3.91032 8.32176 4.79814 8.80267 5.49753 9.5022C6.19692 10.2017 6.67766 11.0896 6.88113 12.0577L7.5 15L8.1181 12.0577C8.3216 11.0895 8.80244 10.2015 9.50199 9.50199C10.2015 8.80244 11.0895 8.3216 12.0577 8.1181L15 7.49922L12.0577 6.88113C11.0896 6.67771 10.2017 6.19698 9.50214 5.49758C8.80261 4.79818 8.32171 3.91034 8.1181 2.94232Z" fill="#1ED36A" />
                        </svg>
                        <span>{bulletMatch[1] || "\u00A0"}</span>
                    </div>
                );
            }

            return (
                <div key={idx} className="leading-[100%] min-h-[24px]">
                    {line || "\u00A0"}
                </div>
            );
        });
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="text-[16px] font-normal flex items-center gap-1.5 text-[#19211C] dark:text-white">
                {label}
                {completed ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-brand-green">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ) : required ? (
                    <span className="text-red-500">*</span>
                ) : null}
            </label>
            <div className="bg-[#EEF1EF] dark:bg-[rgba(255,255,255,0.12)] border border-transparent rounded-[24px] overflow-hidden transition-colors">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-3.5 bg-[#E6EBE8] dark:bg-[rgba(255,255,255,0.16)]">
                    <div className="flex items-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsBoldSelected((prev: boolean) => !prev);
                            }}
                            className={`p-0.5 rounded hover:bg-white/10 transition-colors ${isBoldSelected ? "text-brand-green" : "text-[#19211C] dark:text-white"}`}
                        >
                            <span className="font-serif font-bold italic text-[13px] leading-none">B</span>
                        </button>
                        <span aria-hidden="true" className="mx-2.5 inline-block h-4 w-px bg-[#6F7B76] dark:bg-white/35"></span>
                        <button
                            type="button"
                            onClick={() => {
                                setIsItalicSelected((prev: boolean) => !prev);
                            }}
                            className={`p-0.5 rounded hover:bg-white/10 transition-colors ${isItalicSelected ? "text-brand-green" : "text-[#19211C] dark:text-white"}`}
                        >
                            <span className="font-serif italic text-[13px] leading-none">I</span>
                        </button>
                        <span aria-hidden="true" className="mx-2.5 inline-block h-4 w-px bg-[#6F7B76] dark:bg-white/35"></span>
                        <button
                            type="button"
                            onClick={() => {
                                setIsListSelected((prev: boolean) => !prev);
                                applyStarList();
                            }}
                            className={`p-0.5 rounded hover:bg-white/10 transition-colors flex items-center justify-center ${isListSelected ? "text-brand-green" : "text-[#19211C] dark:text-white"}`}
                        >
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
                    <span className="text-[14px] leading-[100%] font-normal text-gray-500 dark:text-white/95">
                        {value.length}/{maxLength}
                    </span>
                </div>
                {/* Text Area */}
                <div className="relative">
                    <div
                        ref={overlayRef}
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-0 p-4 overflow-hidden whitespace-pre-wrap break-words text-[16px] leading-[100%] text-gray-700 dark:text-white ${isBoldSelected ? "font-semibold" : "font-normal"} ${isItalicSelected ? "italic" : "not-italic"}`}
                    >
                        {renderEditablePreview(value)}
                    </div>
                    <textarea
                        ref={textAreaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleTextareaKeyDown}
                        onScroll={handleTextareaScroll}
                        maxLength={maxLength}
                        className={`relative w-full min-h-[92px] bg-transparent text-[16px] leading-[100%] text-transparent dark:text-transparent caret-[#19211C] dark:caret-white p-4 focus:outline-none resize-none ${isBoldSelected ? "font-semibold" : "font-normal"} ${isItalicSelected ? "italic" : "not-italic"}`}
                        placeholder="Type here..."
                    />
                </div>
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
            <label className="text-[16px] font-normal flex items-center gap-1.5 text-[#19211C] dark:text-white">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#555B57] border border-gray-200 dark:border-transparent rounded-[24px] px-5 py-4 min-h-[56px] focus-within:border-brand-green/30 transition-colors">
                {tags.map((tag: string) => (
                    <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-white text-[#111412] text-[16px] font-normal rounded-full shadow-sm">
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

// ─── Advanced Toast Variant ────────────────────────────────────────

interface AdvancedToastProps {
    type: "success" | "credits" | "error" | "warning" | "info";
    title: string;
    message: string;
    primaryAction?: string;
}

function _AdvancedToast({ type, title, message, primaryAction }: AdvancedToastProps) {
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
        <div className="flex items-center justify-between bg-[#151816] border border-transparent dark:border-white/5 rounded-2xl p-4 shadow-xl">
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
                    <button className="px-4 py-2 bg-white dark:bg-[#2A302C]/60 hover:bg-[#343D38] border border-transparent dark:border-white/5 rounded-full text-[12px] font-semibold text-gray-200 transition-colors whitespace-nowrap cursor-pointer shadow-sm">
                        {primaryAction}
                    </button>
                )}
                <button className="w-[26px] h-[26px] rounded-full bg-white dark:bg-[#2A302C]/60 hover:bg-[#343D38] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#19211C] dark:text-white transition-colors cursor-pointer shrink-0 border border-transparent dark:border-white/5">
                    <XIcon className="w-4 h-4" strokeWidth={2} />
                </button>
            </div>
        </div>
    );
}







