import React, { useState } from 'react';
import { AssessmentSession } from '@/lib/services/assessment.service';
import { Registration } from '@/lib/types';
import { ArrowLeftWithoutLineIcon, DownloadIcon, SendIcon, CheckIcon, LockIcon, ArrowRightWithoutLineIcon } from '@/components/icons';

interface AssessmentDetailsProps {
    session: AssessmentSession; // Contains assessment/exam info
    registration: Registration; // Contains user info
    onBack: () => void;
}

const AssessmentDetails: React.FC<AssessmentDetailsProps> = ({ session, registration, onBack }) => {

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).toUpperCase();
        } catch {
            return dateStr;
        }
    };

    // Placeholder Data - Replace with actual data from session if available in future
    const examRefNo = "OBI-G308-10/25-WB-CS-0093";
    const academicYear = "0";
    const programLevel = "General";
    const publishedOn = "28 Oct, 2025 10:46 AM";
    const expiredOn = "04 Nov, 2025 10:46 AM";
    const totalDuration = "32 min 46 sec";
    const questionsAttempted = "100/100";
    const traitCode = "IC";
    const examPassword = "tvbmx7lk";
    const reportPassword = "a26496634074fa72";
    const examLink = "Exam Link";
    const reportTitle = "Origin BI ClarityFit - Behavioural InsightTwin";

    const isReportActive = false; // Toggle state

    return (
        <div className="flex flex-col gap-6 font-sans h-full text-white">
            {/* Header */}
            <div>
                <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
                    <span className="cursor-pointer hover:underline text-gray-500">Dashboard</span>
                    <span className="mx-2 text-gray-400 dark:text-gray-600">
                        <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
                    </span>
                    <span onClick={onBack} className="cursor-pointer hover:underline text-gray-500">Preview Registrations</span>
                    <span className="mx-2 text-gray-400 dark:text-gray-600">
                        <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
                    </span>
                    <span className="text-brand-green font-semibold">{registration.full_name}</span>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        {/* We can hide the back button here if breadcrumb is enough, but design shows header */}
                        <h1 className="text-2xl sm:text-3xl font-semibold text-[#150089] dark:text-white">
                            {session.program?.assessment_title || 'ClarityFit - Behavioural Insight'}
                        </h1>
                    </div>

                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-[#FFFFFF0D] border border-[#FFFFFF1F] rounded-lg text-xs font-medium text-gray-300 hover:bg-[#FFFFFF1F] transition-colors">
                            Download Report
                            <DownloadIcon className="w-4 h-4" />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-brand-green border border-transparent rounded-lg text-xs font-medium text-white hover:bg-brand-green/90 transition-colors">
                            Sent Report
                            <SendIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs / Levels */}
            <div className="flex flex-col lg:flex-row justify-between items-end border-b border-[#FFFFFF1F] pb-4 gap-4">
                <div className="flex items-center gap-6 overflow-x-auto w-full lg:w-auto scrollbar-hide">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500 whitespace-nowrap cursor-pointer">
                        Over All Report
                        <LockIcon className="w-3 h-3" />
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-brand-green border-b-2 border-brand-green pb-4 -mb-4 whitespace-nowrap cursor-pointer">
                        Unlock Your Mindset
                        <div className="bg-brand-green rounded-full p-0.5">
                            <CheckIcon className="w-2 h-2 text-black" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500 whitespace-nowrap cursor-pointer">
                        Decode Your Behavior
                        <LockIcon className="w-3 h-3" />
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500 whitespace-nowrap cursor-pointer">
                        Decode Your Behavior
                        <LockIcon className="w-3 h-3" />
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500 whitespace-nowrap cursor-pointer">
                        Decode Your Behavior
                        <LockIcon className="w-3 h-3" />
                    </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-medium w-full lg:w-auto justify-end">
                    <span className="text-gray-400">(1/4) Levels Completed</span>
                    <div className="flex gap-1">
                        <div className="w-8 h-2 rounded-full bg-brand-green"></div>
                        <div className="w-8 h-2 rounded-full bg-[#FFFFFF1F]"></div>
                        <div className="w-8 h-2 rounded-full bg-[#FFFFFF1F]"></div>
                        <div className="w-8 h-2 rounded-full bg-[#FFFFFF1F]"></div>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="bg-[#19211C] p-8 rounded-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-4">

                {/* Row 1 */}
                <InfoItem label="Full Name" value={registration.full_name} isLarge />
                <InfoItem label="Email Address" value={registration.email} isLarge />
                <InfoItem label="Mobile Number" value={registration.mobile_number} isLarge />
                <InfoItem label="Program Name" value={session.program?.name || '-'} isLarge />

                {/* Row 2 */}
                <InfoItem label="Department" value={(registration as any).department || 'Information Technology'} />
                <InfoItem label="Academic Year" value={academicYear} />
                <div className="hidden lg:block col-span-2"></div> {/* Spacer */}

                {/* Row 3 */}
                <InfoItem label="Assessment Title" value={session.program?.assessment_title || '-'} />
                <InfoItem label="Exam Ref No." value={examRefNo} />
                <InfoItem label="Exam Type" value="WebApp" />
                <InfoItem label="Program Level" value={programLevel} />

                {/* Row 4 */}
                <InfoItem label="Exam Published On" value={publishedOn} />
                <InfoItem label="Exam Expired On" value={expiredOn} />
                <div className="hidden lg:block col-span-2"></div>

                {/* Row 5 */}
                <InfoItem label="Exam Starts On" value={formatDate(session.validFrom)} />
                <InfoItem label="Exam Ends On" value={formatDate(session.validTo)} />
                <InfoItem label="Total Exam Duration" value={totalDuration} />
                <InfoItem label="Questions Attempted" value={questionsAttempted} />

                {/* Row 6 */}
                <InfoItem label="Sincerity" value="Sincere" />
                <div className='flex flex-col gap-1'>
                    <p className="text-xs text-gray-400">Exam Status</p>
                    <span className={`inline-block px-3 py-1 rounded bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/30 text-xs font-semibold w-fit`}>
                        In Progress
                    </span>
                </div>
                <InfoItem label="Generated Report Trait Code" value={traitCode} />
                <div className="hidden lg:block"></div>

                {/* Row 7 - Divider/Spacing can be handled by grid gap, but visually separated sections might need hr */}
                <div className="col-span-1 md:col-span-2 lg:col-span-4 h-px bg-[#FFFFFF0D] my-2"></div>


                {/* Row 8 */}
                <div>
                    <p className="text-xs text-gray-400 mb-1">Exam Link</p>
                    <a href="#" className="text-base font-medium text-brand-green underline decoration-brand-green underline-offset-4">{examLink}</a>
                </div>
                <InfoItem label="Password" value={examPassword} />
                <div className="hidden lg:block col-span-2"></div>

                <div className="col-span-1 md:col-span-2 lg:col-span-4 h-px bg-[#FFFFFF0D] my-2"></div>


                {/* Row 9 */}
                <InfoItem label="Report Title" value={reportTitle} />
                <InfoItem label="Generated Report Password" value={reportPassword} />

                <div className='flex flex-col gap-1'>
                    <p className="text-xs text-gray-400">Email the Report Feature</p>
                    <span className={`inline-block px-3 py-1 rounded bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/30 text-xs font-semibold w-fit`}>
                        In Active
                    </span>
                </div>

                <div className="flex flex-col gap-1">
                    <p className="text-xs text-gray-400">Is Report Sent Via Email?</p>
                    <span className={`inline-block px-3 py-1 rounded bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/30 text-xs font-semibold w-fit`}>
                        No
                    </span>
                </div>

            </div>

            <div className="flex justify-between items-center text-xs text-gray-500 mt-4">
                <div className="flex gap-4">
                    <a href="#" className="hover:text-brand-green underline">Privacy Policy</a>
                    <span>|</span>
                    <a href="#" className="hover:text-brand-green underline">Terms & Conditions</a>
                </div>
                <div>
                    &copy; 2025 Origin BI, Made with by <span className="text-brand-green">Touchmark Descience Pvt. Ltd.</span>
                </div>
            </div>
        </div>
    );
};

const InfoItem = ({ label, value, isLarge = false }: { label: string, value?: string, isLarge?: boolean }) => (
    <div>
        <p className="text-xs text-gray-400 mb-2">{label}</p>
        <p className={`${isLarge ? 'text-lg' : 'text-base'} font-medium text-white break-all`}>{value || 'N/A'}</p>
    </div>
);

export default AssessmentDetails;
