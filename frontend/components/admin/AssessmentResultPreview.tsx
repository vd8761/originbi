
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { AssessmentSession, IatReportStatus, MetaphorReportStatus, assessmentService } from '../../lib/services/assessment.service';
import { buildReportApiUrl } from '../../lib/utils/reportUrl';
import {
    ArrowLeftWithoutLineIcon,
    ArrowRightWithoutLineIcon,
    LockIcon,
    CheckIcon,
    CalendarIcon,
    EmailIcon,
    ProfileIcon,
    JobsIcon,
    ClockIcon,
    LoadingIcon,
    DownloadIcon
} from '../icons';
import SurveyAnswersView, { SurveyAnswersData } from './SurveyAnswersView';
import MetaphorReportPanel from './MetaphorReportPanel';
import IatReportPanel from './IatReportPanel';

interface AssessmentResultPreviewProps {
    session: AssessmentSession | null;
    onBack: () => void;
}

// Helper Component for Info Items
const InfoItem = ({ icon: Icon, label, value, className = "" }: { icon: any, label: string, value: React.ReactNode, className?: string }) => (
    <div className={`flex items-start gap-3 p-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 ${className}`}>
        <div className="p-2 rounded-lg bg-gray-200 dark:bg-white/10 text-brand-green flex-shrink-0">
            <Icon className="w-4 h-4" />
        </div>
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200 break-all">{value}</div>
        </div>
    </div>
);

// ... (Top of file remains similar, updating imports if needed)

const AssessmentResultPreview: React.FC<AssessmentResultPreviewProps> = ({ session: initialSession, onBack }) => {

    const [session, setSession] = useState<AssessmentSession | null>(initialSession);
    const [levels, setLevels] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState(0);
    const [surveyData, setSurveyData] = useState<SurveyAnswersData | null>(null);
    const [surveyLoading, setSurveyLoading] = useState(false);
    const [metaphorData, setMetaphorData] = useState<MetaphorReportStatus | null>(null);
    const [metaphorLoading, setMetaphorLoading] = useState(false);
    const [metaphorRetrying, setMetaphorRetrying] = useState(false);
    const [iatData, setIatData] = useState<IatReportStatus | null>(null);
    const [iatLoading, setIatLoading] = useState(false);
    const [iatRetrying, setIatRetrying] = useState(false);

    // Download State
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState('');
    const isDownloadingRef = useRef(false);
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
    const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
    const [showShortReportModal, setShowShortReportModal] = useState(false);
    const downloadDropdownRef = useRef<HTMLDivElement>(null);

    // Send Email State
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [showEmailPopup, setShowEmailPopup] = useState(false);
    const [customEmail, setCustomEmail] = useState('');

    const fetchMetaphorReport = useCallback(async (showLoading = false) => {
        if (!initialSession?.id) return;
        try {
            if (showLoading) setMetaphorLoading(true);
            const data = await assessmentService.getMetaphorReport(initialSession.id);
            setMetaphorData(data);
        } catch (error) {
            console.error("Failed to fetch metaphor report", error);
            setMetaphorData(null);
        } finally {
            if (showLoading) setMetaphorLoading(false);
        }
    }, [initialSession?.id]);

    const fetchIatReport = useCallback(async (showLoading = false) => {
        if (!initialSession?.id) return;
        try {
            if (showLoading) setIatLoading(true);
            const data = await assessmentService.getIatReport(initialSession.id);
            setIatData(data);
        } catch (error) {
            console.error("Failed to fetch IAT Gen report", error);
            setIatData(null);
        } finally {
            if (showLoading) setIatLoading(false);
        }
    }, [initialSession?.id]);

    useEffect(() => {
        const fetchLevels = async () => {
            try {
                const data = await assessmentService.getLevels();
                setLevels(data);
            } catch (error) {
                console.error("Failed to fetch levels", error);
            }
        };
        fetchLevels();

        // Fetch fresh session details if an ID allows (using initialSession.id)
        const fetchSessionDetails = async () => {
            if (initialSession?.id) {
                try {
                    const data = await assessmentService.getSessionDetails(initialSession.id);
                    setSession(data);
                } catch (error) {
                    console.error("Failed to fetch fresh session details", error);
                }
            }
        };
        fetchSessionDetails();

        // Fetch SURVEY answers (non-scoring open questions). Drives the Survey tab:
        // present -> tab enabled; absent -> tab shown but disabled.
        const fetchSurvey = async () => {
            if (!initialSession?.id) return;
            try {
                setSurveyLoading(true);
                const data = await assessmentService.getSurveyAnswers(initialSession.id);
                setSurveyData(data);
            } catch (error) {
                console.error("Failed to fetch survey answers", error);
                setSurveyData(null);
            } finally {
                setSurveyLoading(false);
            }
        };
        fetchSurvey();
        fetchMetaphorReport(true);
        fetchIatReport(true);
    }, [initialSession, fetchMetaphorReport, fetchIatReport]);

    useEffect(() => {
        const jobStatus = metaphorData?.job?.status;
        const shouldPoll =
            !!metaphorData?.attempt &&
            !metaphorData?.report &&
            (metaphorData.readyForReport || jobStatus === 'PENDING' || jobStatus === 'PROCESSING');
        if (!shouldPoll) return;

        const timer = window.setInterval(() => {
            void fetchMetaphorReport(false);
        }, 8000);

        return () => window.clearInterval(timer);
    }, [fetchMetaphorReport, metaphorData?.attempt, metaphorData?.job?.status, metaphorData?.readyForReport, metaphorData?.report]);

    useEffect(() => {
        const jobStatus = iatData?.job?.status;
        const shouldPoll =
            !!iatData?.attempt &&
            !iatData?.report &&
            (jobStatus === 'PENDING' || jobStatus === 'PROCESSING');
        if (!shouldPoll) return;

        const timer = window.setInterval(() => {
            void fetchIatReport(false);
        }, 8000);

        return () => window.clearInterval(timer);
    }, [fetchIatReport, iatData?.attempt, iatData?.job?.status, iatData?.report]);

    const hasSurvey = (surveyData?.total ?? 0) > 0;

    // Helper to format dates
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    // Derived Status
    const status = session?.status || 'NOT_STARTED';
    const isStarted = status !== 'NOT_STARTED' && status !== 'ASSIGNED';

    // Check if program supports short report (School & College students only)
    const programId = session?.programId ? Number(session.programId) : null;
    const programCode = (session?.program as any)?.code || (session?.groupAssessment?.program as any)?.code || null;
    const isShortReportAvailable = programCode === 'SCHOOL_STUDENT' || programCode === 'COLLEGE_STUDENT' || programId === 1 || programId === 2;
    // Level 1 Behavioural (DISC-only) short report - currently College only.
    const isLevel1ReportAvailable = programCode === 'COLLEGE_STUDENT' || programId === 2;

    // Close download dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target as Node)) {
                setShowDownloadDropdown(false);
            }
        };
        if (showDownloadDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDownloadDropdown]);

    // Shared download handler. variant: 'full' | 'short' | 'level1'
    const handleDownloadReport = async (variant: 'full' | 'short' | 'level1' = 'full') => {
        if (isDownloadingRef.current) return;
        if (!session?.userId) {
            alert("User ID not found for this session.");
            return;
        }
        try {
            isDownloadingRef.current = true;
            setDownloading(true);
            setShowDownloadDropdown(false);
            setShowShortReportModal(false);
            setDownloadProgress('Initializing...');

            const studentId = session.userId;
            const startData = await assessmentService.generateStudentReport(studentId, variant === 'full' ? undefined : variant);
            
            if (!startData.success || !startData.jobId) {
                throw new Error("Failed to start report generation");
            }
            
            const jobId = startData.jobId;
            
            let isComplete = false;
            while (!isComplete && isDownloadingRef.current) {
                try {
                    const statusData = await assessmentService.getDownloadStatus(jobId);
                    
                    if (statusData.status === 'PROCESSING') {
                        setDownloadProgress(statusData.progress || 'Processing...');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } else if (statusData.status === 'COMPLETED') {
                        isComplete = true;
                        setDownloadProgress('Downloading...');

                        if (!statusData.downloadUrl) {
                            throw new Error('Download URL missing from report status.');
                        }
                        
                        const extendedData = statusData as any;
                        if (extendedData.password) {
                            setGeneratedPassword(extendedData.password);
                        }

                        window.location.href = buildReportApiUrl(statusData.downloadUrl);
                        
                        setTimeout(() => {
                            setDownloading(false);
                            setDownloadProgress('');
                        }, 2000);
                    } else if (statusData.status === 'ERROR') {
                        isComplete = true;
                        throw new Error(statusData.error || 'Generation failed');
                    }
                } catch (err) {
                    console.error("Polling error", err);
                    isComplete = true;
                    setDownloading(false);
                    alert("Failed to download report. Please try again.");
                }
            }
            
        } catch (error) {
            console.error("Download failed", error);
            setDownloading(false);
            alert("Failed to initiate download.");
        } finally {
            isDownloadingRef.current = false;
        }
    };

    const allLevelsCompleted = session?.status === 'COMPLETED';
    // Simplified completion logic: if status is COMPLETED, it's done.

    // Calculation for progress bar
    const totalMandatoryLevels = levels.length || 4; // fallback
    const currentLvl = (status === 'NOT_STARTED' || status === 'ASSIGNED') ? 0 : (session?.currentLevel || 1);

    // Tab Accessibility
    const isTabAccessible = (index: number) => {
        if (index === 0) return true; // Report always active
        if (status === 'COMPLETED') return true;

        // Find the level corresponding to this tab index (1-based index)
        const level = levels[index - 1];
        if (!level) return false;

        // Check if there is a COMPLETED attempt for this level
        const attempt = session?.attempts?.find((a: any) => {
            const attemptLevelId = a.assessmentLevelId ?? (a.assessmentLevel ? a.assessmentLevel.id : null);
            return String(attemptLevelId) === String(level.id);
        });

        return attempt?.status === 'COMPLETED';
    };

    // Correctly map data from the fresh session object
    const displayData = {
        title: session?.program?.assessment_title || session?.program?.assessmentTitle || session?.groupAssessment?.program?.assessment_title || session?.groupAssessment?.program?.assessmentTitle || 'Assessment',
        program: session?.program?.name || session?.groupAssessment?.program?.name || '-',
        type: 'WebApp', // Hardcoded as per request
        startsOn: formatDate(session?.validFrom),
        endsOn: formatDate(session?.validTo),
        studentName: session?.registration?.fullName || session?.registration?.['full_name' as keyof typeof session.registration] || '-',
        gender: session?.registration?.gender || '-',
        email: session?.user?.email || '-',
        mobile: session?.registration?.mobileNumber ? `${session?.registration?.countryCode || ''} ${session?.registration?.mobileNumber}` : '-',
        reportPassword: generatedPassword || session?.metadata?.reportPassword || '-',
        reportSent: session?.metadata?.isReportSent ? 'Yes' : 'No',
        isReportReady: session?.isReportReady
    };


    // Renderers
    const renderStatsBar = (attemptData?: any, levelData?: any) => {
        // Use status from attemptData if available, otherwise fallback to session status
        const currentStatus = attemptData?.status || status;

        return (
            <div className={`bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6 mb-6`}>
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Exam Starts On</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{formatDate(attemptData?.startedAt) || '-'}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {currentStatus === 'IN_PROGRESS' || currentStatus === 'ON_GOING' ? 'To be completed by' : 'Completed At'}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {currentStatus === 'IN_PROGRESS' || currentStatus === 'ON_GOING'
                            ? formatDate(attemptData?.expiresAt) || '-'
                            : formatDate(attemptData?.completedAt) || '-'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Exam Duration</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {levelData?.durationMinutes ? `${levelData.durationMinutes} Minutes` : '--'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Maximum Score</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {levelData?.maxScore ?? '--'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sincerity Index</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {attemptData?.sincerityIndex || attemptData?.sincerity_index ? `${attemptData.sincerityIndex || attemptData.sincerity_index}%` : '--'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sincerity Class</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {attemptData?.sincerityClass || attemptData?.sincerity_class || '--'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Exam Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold 
                    ${currentStatus === 'COMPLETED' ? 'bg-[#00B69B] text-white' :
                            currentStatus === 'IN_PROGRESS' ? 'bg-[#F59E0B] text-black' :
                                'bg-gray-600 text-gray-200'}`}>
                        {currentStatus.replace(/_/g, " ")}
                    </span>
                </div>
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Generated Report Trait Code</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{session?.metadata?.traitCode || '--'}</p>
                </div>
            </div>
        );
    };

    const renderBasicInfoCards = () => {
        const isSentToUser = session?.metadata?.emailSentTo === displayData.email;
        const emailStatusText = session?.metadata?.emailSent 
            ? (isSentToUser ? 'Sent' : `Sent to ${session?.metadata?.emailSentTo}`)
            : 'Not Sent';
        return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Assessment Details */}
            <div className="bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4 mb-2">
                    <h3 className="text-sm font-semibold">Assessment Details</h3>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${status === 'IN_PROGRESS' || status === 'ON_GOING' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20' : status === 'COMPLETED' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-gray-600/10 text-gray-400 border-gray-600/20'}`}>
                        {status?.replace(/_/g, ' ') || 'Unknown'}
                    </span>
                </div>
                <div className="flex flex-col gap-3">
                    <InfoItem icon={JobsIcon} label="Exam Title" value={displayData.title} />
                    <div className="grid grid-cols-2 gap-3">
                        <InfoItem icon={JobsIcon} label="Program" value={displayData.program} />
                        <InfoItem icon={JobsIcon} label="Type" value={displayData.type} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <InfoItem icon={CalendarIcon} label="Starts On" value={displayData.startsOn} />
                        <InfoItem icon={CalendarIcon} label="Ends On" value={displayData.endsOn} />
                    </div>
                </div>
            </div>

            {/* Candidate & Report */}
            <div className="bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-white/10 pb-4 mb-2">
                    <h3 className="text-sm font-semibold">Candidate & Report</h3>
                <div className="flex items-center gap-2">
                    {/* Download Report Button */}
                    {downloading ? (
                         <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                            <LoadingIcon className="w-3 h-3 text-brand-green animate-spin" />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{downloadProgress || 'Generating...'}</span>
                         </div>
                    ) : isShortReportAvailable ? (
                        <div className="relative" ref={downloadDropdownRef}>
                            <button
                                onClick={() => status === 'COMPLETED' && setShowDownloadDropdown(!showDownloadDropdown)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    status === 'COMPLETED' 
                                    ? 'bg-brand-green/10 hover:bg-brand-green/20 text-brand-green cursor-pointer' 
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                                }`}
                                disabled={status !== 'COMPLETED'}
                                title={status !== 'COMPLETED' ? 'Exam must be completed to download report' : ''}
                            >
                                <DownloadIcon className="w-3 h-3" />
                                Download Report
                                <svg className={`w-3 h-3 transition-transform ${showDownloadDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {showDownloadDropdown && (
                                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                                    <button
                                        onClick={() => handleDownloadReport('full')}
                                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                                    >
                                        <DownloadIcon className="w-3 h-3 text-brand-green" />
                                        Full Report
                                    </button>
                                    <div className="border-t border-gray-100 dark:border-white/5" />
                                    <button
                                        onClick={() => handleDownloadReport('short')}
                                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                                    >
                                        <DownloadIcon className="w-3 h-3 text-blue-500" />
                                        Short Report
                                    </button>
                                    {isLevel1ReportAvailable && (
                                        <>
                                            <div className="border-t border-gray-100 dark:border-white/5" />
                                            <button
                                                onClick={() => handleDownloadReport('level1')}
                                                className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                                            >
                                                <DownloadIcon className="w-3 h-3 text-purple-500" />
                                                Level 1 Report
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                        <button
                            onClick={() => handleDownloadReport('full')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                status === 'COMPLETED'
                                ? 'bg-brand-green/10 hover:bg-brand-green/20 text-brand-green cursor-pointer' 
                                : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                            }`}
                            disabled={status !== 'COMPLETED'}
                            title={status !== 'COMPLETED' ? 'Exam must be completed to download report' : ''}
                        >
                            <DownloadIcon className="w-3 h-3" />
                            Download Report
                        </button>
                        <button
                            onClick={async () => {
                                if (isDownloadingRef.current) return;
                                if (!session?.userId) {
                                    alert("User ID not found for this session.");
                                    return;
                                }
                                try {
                                    isDownloadingRef.current = true;
                                    setDownloading(true);
                                    setDownloadProgress('Initializing...');
                                    
                                    const studentId = session.userId; 
                                    const startData = await assessmentService.generateStudentReport(studentId, true);
                                    
                                    if (!startData.success || !startData.jobId) {
                                        throw new Error("Failed to start report generation");
                                    }
                                    
                                    const jobId = startData.jobId;
                                    
                                    let isComplete = false;
                                    while (!isComplete && isDownloadingRef.current) {
                                        try {
                                            const statusData = await assessmentService.getDownloadStatus(jobId);
                                            
                                            if (statusData.status === 'PROCESSING') {
                                                setDownloadProgress(statusData.progress || 'Processing...');
                                                await new Promise(resolve => setTimeout(resolve, 1000));
                                            } else if (statusData.status === 'COMPLETED') {
                                                isComplete = true;
                                                setDownloadProgress('Downloading...');

                                                if (!statusData.downloadUrl) {
                                                    throw new Error('Download URL missing from report status.');
                                                }
                                                
                                                const extendedData = statusData as any;
                                                if (extendedData.password) {
                                                    setGeneratedPassword(extendedData.password);
                                                }

                                                window.location.href = buildReportApiUrl(statusData.downloadUrl);
                                                
                                                setTimeout(() => {
                                                    setDownloading(false);
                                                    setDownloadProgress('');
                                                }, 2000);
                                            } else if (statusData.status === 'ERROR') {
                                                isComplete = true;
                                                throw new Error(statusData.error || 'Generation failed');
                                            }
                                        } catch (err) {
                                            console.error("Polling error", err);
                                            isComplete = true;
                                            setDownloading(false);
                                            alert("Failed to download report. Please try again.");
                                        }
                                    }
                                    
                                } catch (error) {
                                    console.error("Download failed", error);
                                    setDownloading(false);
                                    alert("Failed to initiate download.");
                                } finally {
                                    isDownloadingRef.current = false;
                                }
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                status === 'COMPLETED' 
                                ? 'bg-brand-green/10 hover:bg-brand-green/20 text-brand-green cursor-pointer' 
                                : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                            }`}
                            disabled={status !== 'COMPLETED'}
                            title={status !== 'COMPLETED' ? 'Exam must be completed to download report' : ''}
                        >
                            <DownloadIcon className="w-3 h-3" />
                            Download Short Report
                        </button>
                        </>
                    )}

                    {/* Short Report selection popup - lists the short reports available for this user */}
                    {showShortReportModal && (
                        <div
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                            onClick={() => setShowShortReportModal(false)}
                        >
                            <div
                                className="w-full max-w-md bg-white dark:bg-[#19211C] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-fade-in"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10">
                                    <h3 className="text-sm font-bold text-[#150089] dark:text-white">Download Short Report</h3>
                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                        Select an available short report{session?.registration?.fullName ? ` for ${session.registration.fullName}` : ''}.
                                    </p>
                                </div>
                                <div className="p-3 space-y-2">
                                    <button
                                        onClick={() => handleDownloadReport('short')}
                                        className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:border-brand-green hover:bg-brand-green/5 transition-colors flex items-center gap-3"
                                    >
                                        <DownloadIcon className="w-4 h-4 text-blue-500 shrink-0" />
                                        <span>
                                            <span className="block text-xs font-semibold text-gray-800 dark:text-gray-100">Short Report</span>
                                            <span className="block text-[11px] text-gray-500 dark:text-gray-400">Program summary report</span>
                                        </span>
                                    </button>
                                    {isLevel1ReportAvailable && (
                                        <button
                                            onClick={() => handleDownloadReport('level1')}
                                            className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:border-brand-green hover:bg-brand-green/5 transition-colors flex items-center gap-3"
                                        >
                                            <DownloadIcon className="w-4 h-4 text-brand-green shrink-0" />
                                            <span>
                                                <span className="block text-xs font-semibold text-gray-800 dark:text-gray-100">Short Report (Level 1 Only)</span>
                                                <span className="block text-[11px] text-gray-500 dark:text-gray-400">Level 1 Behavioural (DISC) snapshot</span>
                                            </span>
                                        </button>
                                    )}
                                </div>
                                <div className="px-3 pb-3">
                                    <button
                                        onClick={() => setShowShortReportModal(false)}
                                        className="w-full px-4 py-2 rounded-xl text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Send Email Split Button */}
                    {sendingEmail ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                            <LoadingIcon className="w-3 h-3 text-brand-green animate-spin" />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{downloadProgress || 'Sending...'}</span>
                        </div>
                    ) : emailSent ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-green/10 rounded-lg border border-brand-green/20">
                            <CheckIcon className="w-3 h-3 text-brand-green" />
                            <span className="text-xs font-medium text-brand-green">Email Queued</span>
                        </div>
                    ) : (
                        <div className="flex items-stretch gap-px">
                            {/* Main Send Email button */}
                            <button
                                onClick={async () => {
                                    if (!session?.userId) {
                                        alert("User ID not found for this session.");
                                        return;
                                    }
                                    try {
                                        setSendingEmail(true);

                                        if (!displayData.isReportReady) {
                                            setDownloadProgress('Generating...');
                                            const startData = await assessmentService.generateStudentReport(session.userId);
                                            if (!startData.success || !startData.jobId) {
                                                throw new Error("Failed to start report generation");
                                            }
                                            const jobId = startData.jobId;
                                            let isComplete = false;
                                            while (!isComplete) {
                                                const statusData = await assessmentService.getDownloadStatus(jobId);
                                                if (statusData.status === 'COMPLETED') {
                                                    isComplete = true;
                                                    const extendedData = statusData as any;
                                                    if (extendedData.password) {
                                                        setGeneratedPassword(extendedData.password);
                                                    }
                                                } else if (statusData.status === 'ERROR') {
                                                    throw new Error(statusData.error || 'Generation failed');
                                                } else {
                                                    setDownloadProgress(statusData.progress || 'Generating...');
                                                    await new Promise(resolve => setTimeout(resolve, 1000));
                                                }
                                            }
                                        }

                                        setDownloadProgress('');
                                        await assessmentService.sendReportEmail(session.userId);
                                        // Optimistically update local session metadata so badge refreshes immediately
                                        setSession(prev => prev ? {
                                            ...prev,
                                            metadata: {
                                                ...prev.metadata,
                                                emailSent: true,
                                                emailSentTo: prev.user?.email || '',
                                                emailSentAt: new Date().toISOString(),
                                            }
                                        } : prev);
                                        setEmailSent(true);
                                        setTimeout(() => setEmailSent(false), 5000);
                                    } catch (error) {
                                        console.error("Send email failed", error);
                                        alert("Failed to send email. Please try again.");
                                    } finally {
                                        setSendingEmail(false);
                                        setDownloadProgress('');
                                    }
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-l-lg text-xs font-medium transition-colors ${
                                    status === 'COMPLETED'
                                    ? 'bg-brand-green/10 hover:bg-brand-green/20 text-brand-green cursor-pointer'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                                }`}
                                disabled={status !== 'COMPLETED'}
                                title={status !== 'COMPLETED' ? 'Exam must be completed to send email' : 'Send report to student email'}
                            >
                                <EmailIcon className="w-3 h-3" />
                                Send Email
                            </button>
                            {/* Edit icon to open custom email popup */}
                            <button
                                onClick={() => setShowEmailPopup(true)}
                                className={`flex items-center px-2 py-1.5 rounded-r-lg text-xs font-medium transition-colors ${
                                    status === 'COMPLETED'
                                    ? 'bg-brand-green/10 hover:bg-brand-green/20 text-brand-green border-brand-green/20 cursor-pointer'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-white/10 cursor-not-allowed opacity-60'
                                }`}
                                disabled={status !== 'COMPLETED'}
                                title="Send to a different email"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
                </div>
                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        <InfoItem icon={ProfileIcon} label="Student Name" value={displayData.studentName} />
                        <InfoItem icon={ProfileIcon} label="Gender" value={displayData.gender} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <InfoItem icon={EmailIcon} label="Email" value={displayData.email} />
                        <InfoItem icon={ProfileIcon} label="Mobile" value={displayData.mobile} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <InfoItem icon={LockIcon} label="Report Password" value={displayData.reportPassword} />
                        <InfoItem icon={EmailIcon} label="Email Status" value={emailStatusText} />
                    </div>
                    {displayData.isReportReady && (
                        <div className="p-4 rounded-xl bg-gradient-to-r from-[#19211C] to-brand-green/5 border border-brand-green/20 mt-2">
                            <div className="flex items-center gap-2 mb-3">
                                <CheckIcon className="w-4 h-4 text-brand-green" />
                                <span className="text-sm font-semibold text-brand-green">Report Generated</span>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Password</p>
                                <div className="flex items-center gap-2">
                                    <LockIcon className="w-3 h-3 text-gray-400" />
                                    <code className="text-xs bg-black/30 px-2 py-1 rounded text-brand-green font-mono">{displayData.reportPassword}</code>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        );
    };

    const renderLevelReport = (title: string, breakdown: any[], compatibility: any, levelAttempt?: any, levelData?: any, hideStats: boolean = false) => {
        // Use status from levelAttempt if available, otherwise fallback to session status
        const currentStatus = levelAttempt?.status || status;

        return (
            <div className={`grid grid-cols-1 ${hideStats ? '' : 'xl:grid-cols-[1fr_300px]'} gap-6`}>
                {/* Left Section - Combined Stats + Breakdown in single container */}
                <div className="bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-6">
                    {/* Stats Section (inline, not separate container) */}
                    {!hideStats && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Exam Starts On</p>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{formatDate(levelAttempt?.startedAt) || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        {currentStatus === 'IN_PROGRESS' || currentStatus === 'ON_GOING' ? 'To be completed by' : 'Completed At'}
                                    </p>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                        {currentStatus === 'IN_PROGRESS' || currentStatus === 'ON_GOING'
                                            ? formatDate(levelAttempt?.expiresAt) || '-'
                                            : formatDate(levelAttempt?.completedAt) || '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Exam Duration</p>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                        {levelData?.durationMinutes ? `${levelData.durationMinutes} Minutes` : '--'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Maximum Score</p>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                        {levelData?.maxScore ?? '--'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sincerity Index</p>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                        {levelAttempt?.sincerityIndex || levelAttempt?.sincerity_index ? `${levelAttempt.sincerityIndex || levelAttempt.sincerity_index}%` : '--'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sincerity Class</p>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                        {levelAttempt?.sincerityClass || levelAttempt?.sincerity_class || '--'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Exam Status</p>
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold 
                                    ${currentStatus === 'COMPLETED' ? 'bg-[#00B69B] text-white' :
                                            currentStatus === 'IN_PROGRESS' ? 'bg-[#F59E0B] text-black' :
                                                'bg-gray-600 text-gray-200'}`}>
                                        {currentStatus.replace(/_/g, " ")}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Generated Report Trait Code</p>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{session?.metadata?.traitCode || '--'}</p>
                                </div>
                            </div>
                            {/* Horizontal divider between stats and breakdown */}
                            <div className="border-t border-gray-200 dark:border-white/10" />
                        </>
                    )}

                    {/* Breakdown Table Section */}
                    <div>
                        <h3 className="text-sm font-semibold text-[#150089] dark:text-white mb-4">{title} Value-wise Breakdown</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-brand-green/10 dark:bg-[#FFFFFF0D] text-black dark:text-brand-green">
                                        <th className="py-3 px-4 text-left font-medium rounded-l-lg">{title} Value</th>
                                        <th className="py-3 px-4 text-center font-medium">Score (out of 25)</th>
                                        <th className="py-3 px-4 text-right font-medium rounded-r-lg">Behavioral Note</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {breakdown.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-4 text-black dark:text-white font-medium">{item.value}</td>
                                            <td className="py-4 px-4 text-center text-black dark:text-white">{item.score}</td>
                                            <td className="py-4 px-4 text-right text-gray-500 dark:text-gray-300">{item.note}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-brand-green text-black font-bold">
                                        <td className="py-3 px-4 rounded-l-lg rounded-r-lg" colSpan={3}>
                                            <div className="flex justify-center w-full">
                                                {levelAttempt?.dominantTrait ? (
                                                    <>
                                                        {levelAttempt.dominantTrait.code} : {levelAttempt.dominantTrait.blendedStyleName}
                                                    </>
                                                ) : (
                                                    `Total (${title}) – ${compatibility.totalScore}`
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar with horizontal separators */}
                {!hideStats && (
                    <div className="flex flex-col gap-4">
                        <div className="bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col gap-0 h-full">
                            <SidebarItem label="Assessment Title" value={displayData.title} />

                            {/* Horizontal separator */}
                            <div className="border-t border-gray-200 dark:border-white/10 my-4" />

                            <div className="flex flex-col gap-4">
                                <SidebarItem label="Exam Published On" value={displayData.startsOn} />
                                <SidebarItem label="Exam Expired On" value={displayData.endsOn} />
                            </div>

                            {/* Horizontal separator */}
                            <div className="border-t border-gray-200 dark:border-white/10 my-4" />

                            <div className="flex flex-col gap-4">
                                <SidebarItem label="Program Level" value={displayData.program} />
                                <SidebarItem label="Exam Type" value={displayData.type} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Compatibility Index - ONLY FOR ACI (separate container) - Moved to bottom/left */}
                {title === 'ACI' && (
                    <div className="bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl p-6">
                        <h3 className="text-sm font-semibold text-[#150089] dark:text-white mb-4">Agile Compatibility Index (ACI) – Score Overview</h3>
                        <div className="overflow-x-auto border border-gray-200 dark:border-white/10 rounded-lg">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-brand-green/10 dark:bg-[#FFFFFF0D] text-black dark:text-brand-green border-b border-gray-200 dark:border-white/10">
                                        <th className="py-3 px-4 text-left font-medium w-1/3 border-r border-gray-200 dark:border-white/10">Parameter</th>
                                        <th className="py-3 px-4 text-left font-medium">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                                    <tr>
                                        <td className="py-4 px-4 border-r border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-300">Total Score:</td>
                                        <td className="py-4 px-4 text-black dark:text-white">{compatibility.totalScore}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 px-4 border-r border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-300">Level:</td>
                                        <td className="py-4 px-4 text-black dark:text-white">{compatibility.level}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 px-4 border-r border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-300">Compatibility Tag:</td>
                                        <td className="py-4 px-4 text-black dark:text-white">{compatibility.tag}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 px-4 border-r border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-300">Interpretation:</td>
                                        <td className="py-4 px-4 text-black dark:text-white">{compatibility.interpretation}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const handleRetryMetaphorReport = async () => {
        if (!metaphorData?.attempt?.id) return;
        try {
            setMetaphorRetrying(true);
            await assessmentService.retryMetaphorReport(metaphorData.attempt.id);
            await fetchMetaphorReport(false);
        } catch (error) {
            console.error("Failed to retry metaphor report", error);
            alert("Failed to retry Metaphor report generation.");
        } finally {
            setMetaphorRetrying(false);
        }
    };

    const handleRetryIatReport = async () => {
        if (!iatData?.attempt?.id) return;
        try {
            setIatRetrying(true);
            await assessmentService.retryIatReport(iatData.attempt.id);
            await fetchIatReport(false);
        } catch (error) {
            console.error("Failed to retry IAT Gen report", error);
            alert("Failed to retry IAT Gen report generation.");
        } finally {
            setIatRetrying(false);
        }
    };

    const renderMetaphorReport = (levelAttempt?: any, levelData?: any) => {
        return (
            <MetaphorReportPanel
                data={metaphorData}
                loading={metaphorLoading}
                retrying={metaphorRetrying}
                onRetry={handleRetryMetaphorReport}
                formatDate={formatDate}
                stats={renderStatsBar(levelAttempt, levelData)}
                displayData={displayData}
            />
        );
    };

    const renderIatReport = (levelAttempt?: any, levelData?: any) => {
        return (
            <IatReportPanel
                data={iatData}
                loading={iatLoading}
                retrying={iatRetrying}
                onRetry={handleRetryIatReport}
                formatDate={formatDate}
                stats={renderStatsBar(levelAttempt, levelData)}
            />
        );
    };

    // Mock Data for Reports (Replace with Real Data later)
    const _discBreakdownData = [
        { value: 'Dominance', score: '30', note: 'Direct and decisive.' },
        { value: 'Influence', score: '28', note: 'Enthusiastic and persuasive.' },
        { value: 'Steadiness', score: '22', note: 'Patient and reliable.' },
        { value: 'Compliance', score: '20', note: 'Precise and analytical.' },
    ];
    const _discCompatibilityData = {
        totalScore: '100 / 125',
        level: 'Influential Leader',
        tag: 'Leads with enthusiasm and builds strong relationships.',
        interpretation: 'You are a natural influencer who thrives in social settings and values collaboration.'
    };


    // Level 2 is configured as "ACI", but a candidate may instead have taken
    // the IATGen variant. Label the tab accordingly so it doesn't read "ACI"
    // for IATGen takers.
    const getLevelTabLabel = (lvl: any): string => {
        const lvlNumber = Number(lvl?.levelNumber || lvl?.level_number || 0);
        if (lvlNumber !== 2) return lvl?.name;
        const lvlAttempt = session?.attempts?.find((a: any) =>
            String(a.assessmentLevelId) === String(lvl?.id) ||
            (a.assessmentLevel && String(a.assessmentLevel.id) === String(lvl?.id))
        );
        const kind = String(
            lvlAttempt?.metadata?.assessment_kind || lvlAttempt?.metadata?.assessmentKind || ''
        ).toUpperCase();
        const isIatLevel2 = kind === 'IAT_GEN' || Boolean(iatData?.attempt);
        return isIatLevel2 ? 'IATGen' : lvl?.name;
    };

    const renderOverallReport = () => {
        // Find levels for displaying stats correctly even in Overall View
        // Note: This relies on levels being fetched and named conventionally.
        const discLevel = levels.find(l => l.patternType === 'DISC' || l.name === 'Behavioral Insight');
        const aciLevel = levels.find(l => l.patternType === 'ACI' || l.name === 'ACI');

        const discAttempt = session?.attempts?.find((a: any) =>
            String(a.assessmentLevelId) === String(discLevel?.id) ||
            (a.assessmentLevel && String(a.assessmentLevel.id) === String(discLevel?.id))
        );

        const aciAttempt = session?.attempts?.find((a: any) =>
            String(a.assessmentLevelId) === String(aciLevel?.id) ||
            (a.assessmentLevel && String(a.assessmentLevel.id) === String(aciLevel?.id))
        );
        const aciKind = String(aciAttempt?.metadata?.assessment_kind || aciAttempt?.metadata?.assessmentKind || '').toUpperCase();
        const hasIatLevel2 = aciKind === 'IAT_GEN' || Boolean(iatData?.attempt);

        return (
            <div className="flex flex-col">
                {renderBasicInfoCards()}

                {/* Conditional State Message */}
                {status === 'NOT_STARTED' || status === 'ASSIGNED' ? (
                    <div className="bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                        <LockIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Exam is not yet started</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">The assessment has not been initiated by the candidate.</p>
                    </div>
                ) : status === 'EXPIRED' ? (
                    <div className="bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                        <h3 className="text-lg font-semibold text-red-400">Exam has been expired</h3>
                    </div>
                ) : !allLevelsCompleted ? (
                    <div className="bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                        <ClockIcon className="w-12 h-12 text-brand-green mb-4 animate-pulse" />
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Assessment in Progress</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Please wait until all levels are finished to view the comprehensive report.</p>
                    </div>
                ) : (
                    // All Completed
                    <div className="flex flex-col gap-6">
                        {(() => {
                            const discData = getDiscData(discAttempt);
                            const aciData = getAciData(aciAttempt);
                            return (
                                <>
                                    {renderLevelReport('DISC', discData.breakdown, discData.compatibility, discAttempt, discLevel, true)}
                                    {hasIatLevel2
                                        ? renderIatReport(aciAttempt, aciLevel)
                                        : renderLevelReport('ACI', aciData.breakdown, aciData.compatibility, aciAttempt, aciLevel, true)}
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 w-full h-full font-sans text-gray-900 dark:text-white">
            {/* Header */}
            <div>
                <div className="flex items-center text-xs text-black dark:text-white mb-2 font-normal flex-wrap">
                    <span onClick={onBack} className="cursor-pointer hover:underline opacity-60">Dashboard</span>
                    <span className="mx-2 opacity-40"><ArrowRightWithoutLineIcon className="w-3 h-3" /></span>
                    <span onClick={onBack} className="cursor-pointer hover:underline opacity-60">Registrations</span>
                    <span className="mx-2 opacity-40"><ArrowRightWithoutLineIcon className="w-3 h-3" /></span>
                    <span className="text-brand-green font-semibold">Review Assessment</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#150089] dark:text-white flex items-center gap-3">
                    <button onClick={onBack} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowLeftWithoutLineIcon className="w-5 h-5" />
                    </button>
                    {displayData.title}
                </h1>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-col lg:flex-row justify-between items-end border-b border-gray-200 dark:border-white/10 pb-0 gap-4">
                <div className="flex items-center gap-8 overflow-x-auto w-full lg:w-auto scrollbar-hide no-scrollbar">
                    {/* Overall Report Tab - Always Accessible */}
                    <div
                        onClick={() => setActiveTab(0)}
                        className={`flex items-center gap-2 text-sm font-medium pb-4 cursor-pointer transition-colors whitespace-nowrap ${activeTab === 0
                            ? 'text-brand-green border-b-2 border-brand-green font-bold'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        Over All Report
                        {activeTab === 0 && <span className='bg-brand-green rounded-full p-[1px]'><CheckIcon className="w-2 h-2 text-black" /></span>}
                    </div>
                    {/* Level Tabs */}
                    {levels.map((lvl, idx) => {
                        const tabIndex = idx + 1;
                        const accessible = isTabAccessible(tabIndex);
                        const isActive = activeTab === tabIndex;
                        const tabLabel = getLevelTabLabel(lvl);
                        return (
                            <div
                                key={lvl.id}
                                onClick={() => accessible && setActiveTab(tabIndex)}
                                className={`flex items-center gap-2 text-sm font-medium pb-4 transition-colors whitespace-nowrap ${isActive
                                    ? 'text-brand-green border-b-2 border-brand-green font-bold cursor-default'
                                    : accessible
                                        ? 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer'
                                        : 'text-gray-400 dark:text-white/50 cursor-not-allowed'
                                    }`}
                            >
                                {tabLabel}
                                {isActive ? (
                                    <span className='bg-brand-green rounded-full p-[1px]'><CheckIcon className="w-2 h-2 text-black" /></span>
                                ) : (
                                    !accessible && <LockIcon className="w-3 h-3 text-gray-400 dark:text-white/70" />
                                )}
                            </div>
                        );
                    })}
                    {/* Survey Tab — always shown; enabled only if the candidate had survey questions */}
                    {(() => {
                        const surveyTabIndex = levels.length + 1;
                        const isActive = activeTab === surveyTabIndex;
                        return (
                            <div
                                onClick={() => hasSurvey && setActiveTab(surveyTabIndex)}
                                className={`flex items-center gap-2 text-sm font-medium pb-4 transition-colors whitespace-nowrap ${isActive
                                    ? 'text-brand-green border-b-2 border-brand-green font-bold cursor-default'
                                    : hasSurvey
                                        ? 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer'
                                        : 'text-gray-400 dark:text-white/50 cursor-not-allowed'
                                    }`}
                                title={hasSurvey ? 'Survey responses' : 'No survey questions in this assessment'}
                            >
                                Survey
                                {!isActive && !hasSurvey && (
                                    <LockIcon className="w-3 h-3 text-gray-400 dark:text-white/70" />
                                )}
                            </div>
                        );
                    })()}
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {/* Only show progress if levels fetched */}
                    {totalMandatoryLevels > 0 && (
                        <div className="flex items-center gap-2 ml-4">
                            <span>({status === 'COMPLETED' ? totalMandatoryLevels : (status === 'NOT_STARTED' ? 0 : currentLvl)}/{totalMandatoryLevels}) Levels Completed</span>
                            {Array.from({ length: totalMandatoryLevels }).map((_, i) => {
                                const levelNum = i + 1;
                                let barClass = 'bg-gray-200 dark:bg-white/20';
                                if (status === 'COMPLETED') barClass = 'bg-brand-green';
                                else if (isStarted && levelNum < currentLvl) barClass = 'bg-brand-green';
                                else if (isStarted && levelNum === currentLvl) barClass = 'bg-[#F59E0B]'; // Current active

                                return <div key={i} className={`w-8 h-1.5 rounded-full ${barClass}`}></div>;
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            {activeTab === 0 ? renderOverallReport() :
                activeTab === levels.length + 1 ? (
                    <SurveyAnswersView data={surveyData} loading={surveyLoading} />
                ) :
                // Level Reports
                (() => {
                    const levelIndex = activeTab - 1;
                    const level = levels[levelIndex];

                    // Find the attempt corresponding to this level generically
                    const attempt = session?.attempts?.find((a: any) => {
                        const levelId = String(level?.id);
                        const aId = String(a.assessmentLevelId);
                        const alId = a.assessmentLevel ? String(a.assessmentLevel.id) : null;
                        return aId === levelId || alId === levelId;
                    });

                    const levelName = String(level?.name || attempt?.assessmentLevel?.name || '').toLowerCase();
                    const patternType = String(level?.pattern_type || level?.patternType || attempt?.assessmentLevel?.patternType || '').toLowerCase();
                    const levelNumber = Number(level?.levelNumber || level?.level_number || attempt?.assessmentLevel?.levelNumber || 0);
                    const assessmentKind = String(attempt?.metadata?.assessment_kind || attempt?.metadata?.assessmentKind || '').toUpperCase();
                    const isIat = levelNumber === 2 && (assessmentKind === 'IAT_GEN' || Boolean(iatData?.attempt));
                    const isMetaphor = patternType === 'metaphor' || levelName.includes('metaphor') || levelNumber === 3;
                    const isDisc = patternType === 'disc' || levelName.includes('disc') || levelName === 'behavioral insight';
                    const isAci = patternType === 'aci' || levelName.includes('aci') || levelName.includes('agile');

                    if (isIat) {
                        return renderIatReport(attempt, level);
                    } else if (isMetaphor) {
                        return renderMetaphorReport(attempt, level);
                    } else if (isDisc) {
                        const { breakdown, compatibility } = getDiscData(attempt);
                        return renderLevelReport('DISC', breakdown, compatibility, attempt, level);
                    } else if (isAci) {
                        const { breakdown, compatibility } = getAciData(attempt);
                        return renderLevelReport('ACI', breakdown, compatibility, attempt, level);
                    }

                    return (
                        <div className="bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl p-8 text-sm text-gray-500 dark:text-gray-400">
                            No report renderer is configured for this assessment level.
                        </div>
                    );
                })()
            }

            <div className="flex justify-between items-center text-xs text-gray-500 mt-4 pb-8">
                <div className="flex gap-4">
                    <a href="#" className="hover:text-brand-green underline">Privacy Policy</a>
                    <span>|</span>
                    <a href="#" className="hover:text-brand-green underline">Terms & Conditions</a>
                </div>
                <div>
                    &copy; 2025 Origin BI, Made with by <span className="text-brand-green">Touchmark Descience Pvt. Ltd.</span>
                </div>
            </div>

            {/* Send Email to Custom Address Popup */}
            {showEmailPopup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowEmailPopup(false)}>
                    <div className="bg-white dark:bg-[#19211C] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Send Report Email</h3>
                            <button onClick={() => setShowEmailPopup(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Send the assessment report to a different email address.
                        </p>
                        <div className="mb-4">
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">To Email</label>
                            <input
                                type="email"
                                value={customEmail}
                                onChange={(e) => setCustomEmail(e.target.value)}
                                placeholder="Enter email address"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#150089]/30 focus:border-[#150089] dark:focus:ring-brand-green/30 dark:focus:border-brand-green transition-colors"
                            />
                        </div>
                        <div className="flex items-center gap-3 justify-end">
                            <button
                                onClick={() => { setShowEmailPopup(false); setCustomEmail(''); }}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (!customEmail || !customEmail.includes('@')) {
                                        alert('Please enter a valid email address.');
                                        return;
                                    }
                                    if (!session?.userId) {
                                        alert("User ID not found for this session.");
                                        return;
                                    }
                                    try {
                                        setShowEmailPopup(false);
                                        setSendingEmail(true);

                                        if (!displayData.isReportReady) {
                                            setDownloadProgress('Generating...');
                                            const startData = await assessmentService.generateStudentReport(session.userId);
                                            if (!startData.success || !startData.jobId) {
                                                throw new Error("Failed to start report generation");
                                            }
                                            const jobId = startData.jobId;
                                            let isComplete = false;
                                            while (!isComplete) {
                                                const statusData = await assessmentService.getDownloadStatus(jobId);
                                                if (statusData.status === 'COMPLETED') {
                                                    isComplete = true;
                                                    const extendedData = statusData as any;
                                                    if (extendedData.password) {
                                                        setGeneratedPassword(extendedData.password);
                                                    }
                                                } else if (statusData.status === 'ERROR') {
                                                    throw new Error(statusData.error || 'Generation failed');
                                                } else {
                                                    setDownloadProgress(statusData.progress || 'Generating...');
                                                    await new Promise(resolve => setTimeout(resolve, 1000));
                                                }
                                            }
                                        }

                                        setDownloadProgress('');
                                        await assessmentService.sendReportEmail(session.userId, customEmail);
                                        // Optimistically update local session metadata so badge refreshes immediately
                                        const resolvedEmail = customEmail.trim() || session.user?.email || '';
                                        setSession(prev => prev ? {
                                            ...prev,
                                            metadata: {
                                                ...prev.metadata,
                                                emailSent: true,
                                                emailSentTo: resolvedEmail,
                                                emailSentAt: new Date().toISOString(),
                                            }
                                        } : prev);
                                        setCustomEmail('');
                                        setEmailSent(true);
                                        setTimeout(() => setEmailSent(false), 5000);
                                    } catch (error) {
                                        console.error("Send email failed", error);
                                        alert("Failed to send email. Please try again.");
                                    } finally {
                                        setSendingEmail(false);
                                        setDownloadProgress('');
                                    }
                                }}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-green hover:bg-brand-green/90 text-black transition-colors"
                            >
                                Send Email
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
// Helper to extract DISC data
const getDiscData = (attempt: any) => {
    let breakdown = [
        { value: 'Dominance', score: '-', note: 'Direct and decisive.' },
        { value: 'Influence', score: '-', note: 'Enthusiastic and persuasive.' },
        { value: 'Steadiness', score: '-', note: 'Patient and reliable.' },
        { value: 'Compliance', score: '-', note: 'Precise and analytical.' },
    ];
    let compatibility = {
        totalScore: '0 / 125',
        level: '-',
        tag: '-',
        interpretation: '-'
    };

    if (attempt && attempt.metadata?.disc_scores) {
        const scores = attempt.metadata.disc_scores;
        breakdown = [
            { value: 'Dominance', score: scores['D'] || '-', note: 'Direct and decisive.' },
            { value: 'Influence', score: scores['I'] || '-', note: 'Enthusiastic and persuasive.' },
            { value: 'Steadiness', score: scores['S'] || '-', note: 'Patient and reliable.' },
            { value: 'Compliance', score: scores['C'] || '-', note: 'Precise and analytical.' },
        ];

        const rawTotal = attempt.totalScore || attempt.metadata.disc_scores?.total || scores['total'] || '0';
        compatibility = {
            totalScore: String(rawTotal).includes('/') ? rawTotal : `${rawTotal} / 125`,
            level: attempt.sincerityClass || '-',
            tag: '-',
            interpretation: '-'
        };
    }
    return { breakdown, compatibility };
};

// Helper to extract ACI data
const getAciData = (attempt: any) => {
    // Default structure with placeholders
    let breakdown = [
        { value: 'Commitment', score: '-', note: '-' },
        { value: 'Focus', score: '-', note: '-' },
        { value: 'Openness', score: '-', note: '-' },
        { value: 'Respect', score: '-', note: '-' },
        { value: 'Courage', score: '-', note: '-' },
    ];
    const compatibility = {
        totalScore: '0 / 125',
        level: '-',
        tag: '-',
        interpretation: '-'
    };

    if (attempt) {
        // 1. Resolve Scores
        // Try multiple sources for scores
        const meta = attempt.metadata || {};
        const scores = meta.agile_scores || meta.aci_scores || meta.scores || {};

        // 2. Resolve Total Score
        // specific score total OR attempt column OR metadata total
        const rawTotal = scores['total'] || attempt.totalScore || meta.total_score || '0';
        compatibility.totalScore = String(rawTotal).includes('/') ? rawTotal : `${rawTotal} / 125`;

        // 3. Resolve Compatibility Info using Backend Enriched Data (Preferred)
        if (attempt.aciBand) {
            compatibility.level = attempt.aciBand.levelName || '-';
            compatibility.tag = attempt.aciBand.compatibilityTag || '-';
            compatibility.interpretation = attempt.aciBand.interpretation || '-';
        } else {
            // Fallback: Manual Calculation
            const totalScoreVal = parseInt(String(rawTotal).split('/')[0], 10) || 0;
            if (totalScoreVal >= 100) {
                compatibility.level = 'Agile Naturalist';
                compatibility.tag = 'Embodies agility instinctively; thrives in collaboration and adapts with ease.';
                compatibility.interpretation = 'You live the Agile mindset naturally — showing balance between speed, empathy, and integrity.';
            } else if (totalScoreVal >= 75) {
                compatibility.level = 'Agile Adaptive';
                compatibility.tag = 'Shows strong energy, adaptability, and creative courage with growing consistency.';
                compatibility.interpretation = 'You’re quick to learn and adjust to change. You work well in dynamic situations but can refine your focus.';
            } else if (totalScoreVal >= 50) {
                compatibility.level = 'Agile Learner';
                compatibility.tag = 'Understands Agile values conceptually but applies them inconsistently.';
                compatibility.interpretation = 'You show openness to Agile ideas and collaboration but may need guidance on consistent application.';
            } else {
                compatibility.level = 'Agile Resistant';
                compatibility.tag = 'Prefers control and predictability; finds comfort in fixed systems and routines.';
                compatibility.interpretation = 'You may feel uncertain when faced with change or fast-moving teamwork. This is a growth area for you.';
            }
        }

        // 4. Resolve Breakdown and Notes
        // Use enriched notes from backend if available (checking metadata as fallback)
        const notes = attempt.aciNotes || attempt.metadata?.aciNotes || {};

        breakdown = [
            {
                value: 'Commitment',
                score: scores['Commitment'] || scores['commitment'] || '-',
                note: notes['Commitment'] || '-'
            },
            {
                value: 'Focus',
                score: scores['Focus'] || scores['focus'] || '-',
                note: notes['Focus'] || '-'
            },
            {
                value: 'Openness',
                score: scores['Openness'] || scores['openness'] || '-',
                note: notes['Openness'] || '-'
            },
            {
                value: 'Respect',
                score: scores['Respect'] || scores['respect'] || '-',
                note: notes['Respect'] || '-'
            },
            {
                value: 'Courage',
                score: scores['Courage'] || scores['courage'] || '-',
                note: notes['Courage'] || '-'
            },
        ];
    }

    return { breakdown, compatibility };
};

// ... (export and SidebarItem helper remain)

const SidebarItem = ({ label, value, small }: { label: string, value: string, small?: boolean }) => (
    <div>
        <p className={`text-xs text-gray-500 dark:text-gray-400 mb-1`}>{label}</p>
        <p className={`${small ? 'text-xs' : 'text-sm'} font-medium text-gray-800 dark:text-gray-200 break-all`}>{value}</p>
    </div>
);

export default AssessmentResultPreview;
