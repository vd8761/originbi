
import React, { useEffect, useState } from 'react';
import { AssessmentSession, assessmentService } from '../../lib/services/assessment.service';
import {
    ArrowLeftWithoutLineIcon,
    ArrowRightWithoutLineIcon,
    LockIcon,
    CheckIcon,
    CalendarIcon,
    EmailIcon,
    ProfileIcon,
    JobsIcon,
    ClockIcon
} from '../icons';

interface AssessmentResultPreviewProps {
    session: AssessmentSession | null;
    onBack: () => void;
}

// Helper Component for Info Items
const InfoItem = ({ icon: Icon, label, value, className = "" }: { icon: any, label: string, value: React.ReactNode, className?: string }) => (
    <div className={`flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 ${className}`}>
        <div className="p-2 rounded-lg bg-white/10 text-brand-green flex-shrink-0">
            <Icon className="w-4 h-4" />
        </div>
        <div>
            <p className="text-xs text-gray-400 mb-0.5">{label}</p>
            <div className="text-sm font-medium text-gray-200 break-all">{value}</div>
        </div>
    </div>
);

// ... (Top of file remains similar, updating imports if needed)

const AssessmentResultPreview: React.FC<AssessmentResultPreviewProps> = ({ session: initialSession, onBack }) => {

    const [session, setSession] = useState<AssessmentSession | null>(initialSession);
    const [levels, setLevels] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState(0);

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
    }, [initialSession]);

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
        reportPassword: session?.metadata?.reportPassword || '-',
        reportSent: session?.metadata?.isReportSent ? 'Yes' : 'No',
        isReportReady: session?.isReportReady
    };


    // Renderers
    const renderStatsBar = (attemptData?: any, levelData?: any) => {
        // Use status from attemptData if available, otherwise fallback to session status
        const currentStatus = attemptData?.status || status;

        return (
            <div className={`bg-[#19211C] border border-white/10 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6 mb-6`}>
                <div>
                    <p className="text-xs text-gray-400 mb-1">Exam Starts On</p>
                    <p className="text-sm font-semibold">{formatDate(attemptData?.startedAt) || '-'}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 mb-1">
                        {currentStatus === 'IN_PROGRESS' || currentStatus === 'ON_GOING' ? 'To be completed by' : 'Completed At'}
                    </p>
                    <p className="text-sm font-semibold">
                        {currentStatus === 'IN_PROGRESS' || currentStatus === 'ON_GOING'
                            ? formatDate(attemptData?.expiresAt) || '-'
                            : formatDate(attemptData?.completedAt) || '-'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 mb-1">Total Exam Duration</p>
                    <p className="text-sm font-semibold">
                        {levelData?.durationMinutes ? `${levelData.durationMinutes} Minutes` : '--'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 mb-1">Maximum Score</p>
                    <p className="text-sm font-semibold">
                        {levelData?.maxScore ?? '--'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 mb-1">Sincerity Index</p>
                    <p className="text-sm font-semibold">
                        {attemptData?.sincerityIndex || attemptData?.sincerity_index ? `${attemptData.sincerityIndex || attemptData.sincerity_index}%` : '--'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 mb-1">Sincerity Class</p>
                    <p className="text-sm font-semibold">
                        {attemptData?.sincerityClass || attemptData?.sincerity_class || '--'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 mb-1">Exam Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold 
                    ${currentStatus === 'COMPLETED' ? 'bg-[#00B69B] text-white' :
                            currentStatus === 'IN_PROGRESS' ? 'bg-[#F59E0B] text-black' :
                                'bg-gray-600 text-gray-200'}`}>
                        {currentStatus.replace(/_/g, " ")}
                    </span>
                </div>
                <div>
                    <p className="text-xs text-gray-400 mb-1">Generated Report Trait Code</p>
                    <p className="text-sm font-semibold">{session?.metadata?.traitCode || '--'}</p>
                </div>
            </div>
        );
    };

    const renderBasicInfoCards = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Assessment Details */}
            <div className="bg-[#19211C] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-2">
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
            <div className="bg-[#19211C] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="text-sm font-semibold border-b border-white/10 pb-4 mb-2">Candidate & Report</h3>
                <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        <InfoItem icon={ProfileIcon} label="Student Name" value={displayData.studentName} />
                        <InfoItem icon={ProfileIcon} label="Gender" value={displayData.gender} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <InfoItem icon={EmailIcon} label="Email" value={displayData.email} />
                        <InfoItem icon={ProfileIcon} label="Mobile" value={displayData.mobile} />
                    </div>
                    {displayData.isReportReady && (
                        <div className="p-4 rounded-xl bg-gradient-to-r from-[#19211C] to-brand-green/5 border border-brand-green/20 mt-2">
                            <div className="flex items-center gap-2 mb-3">
                                <CheckIcon className="w-4 h-4 text-brand-green" />
                                <span className="text-sm font-semibold text-brand-green">Report Generated</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Password</p>
                                    <div className="flex items-center gap-2">
                                        <LockIcon className="w-3 h-3 text-gray-400" />
                                        <code className="text-xs bg-black/30 px-2 py-1 rounded text-brand-green font-mono">{displayData.reportPassword}</code>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Sent via Email?</p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${displayData.reportSent === 'Yes' ? 'bg-brand-green text-black' : 'bg-gray-600 text-gray-200'}`}>
                                        {displayData.reportSent}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderLevelReport = (title: string, breakdown: any[], compatibility: any, levelAttempt?: any, levelData?: any, hideStats: boolean = false) => (
        <div className={`grid grid-cols-1 ${hideStats ? '' : 'xl:grid-cols-[1fr_300px]'} gap-6`}>
            <div className="flex flex-col gap-6">
                {/* Pass specific level attempt if available. Do not fallback to current session attempt for level reports. */}
                {!hideStats && renderStatsBar(levelAttempt, levelData)}

                {/* Breakdown Table */}
                <div className="bg-[#19211C] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold mb-4">{title} Value-wise Breakdown</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#FFFFFF0D] text-brand-green">
                                    <th className="py-3 px-4 text-left font-medium rounded-l-lg">{title} Value</th>
                                    <th className="py-3 px-4 text-center font-medium">Score</th>
                                    <th className="py-3 px-4 text-right font-medium rounded-r-lg">Behavioral Note</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {breakdown.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-4">{item.value}</td>
                                        <td className="py-4 px-4 text-center">{item.score}</td>
                                        <td className="py-4 px-4 text-right text-gray-300">{item.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-[#1ED36A]/20 text-brand-green font-bold">
                                <tr>
                                    <td className="py-3 px-4 rounded-l-lg" colSpan={3}>
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

                {/* Compatibility Index - ONLY FOR ACI */}
                {title === 'ACI' && (
                    <div className="bg-[#19211C] border border-white/10 rounded-2xl p-6">
                        <h3 className="text-sm font-semibold mb-4">Agile Compatibility Index (ACI) – Score Overview</h3>
                        <div className="overflow-x-auto border border-white/10 rounded-lg">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[#FFFFFF0D] text-brand-green border-b border-white/10">
                                        <th className="py-3 px-4 text-left font-medium w-1/3 border-r border-white/10">Parameter</th>
                                        <th className="py-3 px-4 text-left font-medium">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    <tr>
                                        <td className="py-4 px-4 border-r border-white/10 text-gray-300">Total Score:</td>
                                        <td className="py-4 px-4">{compatibility.totalScore}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 px-4 border-r border-white/10 text-gray-300">Level:</td>
                                        <td className="py-4 px-4">{compatibility.level}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 px-4 border-r border-white/10 text-gray-300">Compatibility Tag:</td>
                                        <td className="py-4 px-4">{compatibility.tag}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 px-4 border-r border-white/10 text-gray-300">Interpretation:</td>
                                        <td className="py-4 px-4">{compatibility.interpretation}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar for Level Tabs (Same Sidebar) */}
            {!hideStats && (
                <div className="flex flex-col gap-4">
                    <div className="bg-[#19211C] border border-white/10 rounded-2xl p-6 flex flex-col gap-6 h-full">
                        <SidebarItem label="Assessment Title" value={displayData.title} />
                        <div className="grid grid-cols-1 gap-4">
                            <SidebarItem label="Exam Published On" value={displayData.startsOn} />
                            <SidebarItem label="Exam Expired On" value={displayData.endsOn} />
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <SidebarItem label="Program Level" value={displayData.program} />
                            <SidebarItem label="Exam Type" value={displayData.type} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Mock Data for Reports (Replace with Real Data later)
    const aciBreakdownData = [
        { value: 'Commitment', score: '24', note: 'Deeply dedicated and consistent.' },
        { value: 'Focus', score: '22', note: 'Exceptionally attentive to detail and priority.' },
        { value: 'Openness', score: '18', note: 'Learning to adapt and welcome diverse approaches.' },
        { value: 'Respect', score: '19', note: 'Professional tone with scope to show empathy.' },
        { value: 'Courage', score: '23', note: 'Honest and principled; leads through integrity.' },
    ];
    const discBreakdownData = [
        { value: 'Dominance', score: '30', note: 'Direct and decisive.' },
        { value: 'Influence', score: '28', note: 'Enthusiastic and persuasive.' },
        { value: 'Steadiness', score: '22', note: 'Patient and reliable.' },
        { value: 'Compliance', score: '20', note: 'Precise and analytical.' },
    ];
    const aciCompatibilityData = {
        totalScore: '106 / 125',
        level: 'Agile Naturalist',
        tag: 'Embodies agility instinctively; thrives in collaboration and adapts with ease.',
        interpretation: 'You combine discipline with flexibility — upholding standards while remaining open to change.'
    };
    const discCompatibilityData = {
        totalScore: '100 / 125',
        level: 'Influential Leader',
        tag: 'Leads with enthusiasm and builds strong relationships.',
        interpretation: 'You are a natural influencer who thrives in social settings and values collaboration.'
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

        return (
            <div className="flex flex-col">
                {renderBasicInfoCards()}

                {/* Conditional State Message */}
                {status === 'NOT_STARTED' || status === 'ASSIGNED' ? (
                    <div className="bg-[#19211C] border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                        <LockIcon className="w-12 h-12 text-gray-600 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-200">Exam is not yet started</h3>
                        <p className="text-gray-400 text-sm mt-2">The assessment has not been initiated by the candidate.</p>
                    </div>
                ) : status === 'EXPIRED' ? (
                    <div className="bg-[#19211C] border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                        <h3 className="text-lg font-semibold text-red-400">Exam has been expired</h3>
                    </div>
                ) : !allLevelsCompleted ? (
                    <div className="bg-[#19211C] border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                        <ClockIcon className="w-12 h-12 text-brand-green mb-4 animate-pulse" />
                        <h3 className="text-lg font-semibold text-gray-200">Assessment in Progress</h3>
                        <p className="text-gray-400 text-sm mt-2">Please wait until all levels are finished to view the comprehensive report.</p>
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
                                    {renderLevelReport('ACI', aciData.breakdown, aciData.compatibility, aciAttempt, aciLevel, true)}
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 w-full h-full font-sans text-white">
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
            <div className="flex flex-col lg:flex-row justify-between items-end border-b border-white/10 pb-0 gap-4">
                <div className="flex items-center gap-8 overflow-x-auto w-full lg:w-auto scrollbar-hide no-scrollbar">
                    {/* Overall Report Tab - Always Accessible */}
                    <div
                        onClick={() => setActiveTab(0)}
                        className={`flex items-center gap-2 text-sm font-medium pb-4 cursor-pointer transition-colors whitespace-nowrap ${activeTab === 0
                            ? 'text-brand-green border-b-2 border-brand-green font-bold'
                            : 'text-gray-400 hover:text-white'
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
                        return (
                            <div
                                key={lvl.id}
                                onClick={() => accessible && setActiveTab(tabIndex)}
                                className={`flex items-center gap-2 text-sm font-medium pb-4 transition-colors whitespace-nowrap ${isActive
                                    ? 'text-brand-green border-b-2 border-brand-green font-bold cursor-default'
                                    : accessible
                                        ? 'text-gray-400 hover:text-white cursor-pointer'
                                        : 'text-white/50 cursor-not-allowed'
                                    }`}
                            >
                                {lvl.name}
                                {isActive ? (
                                    <span className='bg-brand-green rounded-full p-[1px]'><CheckIcon className="w-2 h-2 text-black" /></span>
                                ) : (
                                    !accessible && <LockIcon className="w-3 h-3 text-white/70" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center gap-4 text-xs font-medium text-gray-400 flex-shrink-0">
                    {/* Only show progress if levels fetched */}
                    {totalMandatoryLevels > 0 && (
                        <div className="flex items-center gap-2 ml-4">
                            <span>({status === 'COMPLETED' ? totalMandatoryLevels : (status === 'NOT_STARTED' ? 0 : currentLvl)}/{totalMandatoryLevels}) Levels Completed</span>
                            {Array.from({ length: totalMandatoryLevels }).map((_, i) => {
                                const levelNum = i + 1;
                                let barClass = 'bg-white/20';
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
                // Level Reports
                (() => {
                    const levelIndex = activeTab - 1;
                    const level = levels[levelIndex];

                    // Find the attempt corresponding to this level generically
                    const attempt = session?.attempts?.find((a: any) => {
                        const levelId = String(level?.id);
                        const aId = String(a.assessmentLevelId);
                        const alId = a.assessmentLevel ? String(a.assessmentLevel.id) : null;

                        console.log(`Debug Attempt Match: Level ${levelId} vs Attempt ${a.id} (LevelId: ${aId}, RelId: ${alId})`);

                        return aId === levelId || alId === levelId;
                    });

                    console.log('Found attempt for level:', level?.name, attempt);

                    // Check for DISC pattern in robust ways: patternType (database), name includes 'disc', or exact name 'Behavioral Insight'
                    const isDisc = level?.pattern_type === 'DISC' || level?.patternType === 'DISC' || level?.name.toLowerCase().includes('disc') || level?.name === 'Behavioral Insight';

                    if (isDisc) {
                        const { breakdown, compatibility } = getDiscData(attempt);
                        return renderLevelReport('DISC', breakdown, compatibility, attempt, level);
                    } else {
                        const { breakdown, compatibility } = getAciData(attempt);
                        return renderLevelReport('ACI', breakdown, compatibility, attempt, level);
                    }
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
    let breakdown = [
        { value: 'Commitment', score: '-', note: 'Deeply dedicated and consistent.' },
        { value: 'Focus', score: '-', note: 'Exceptionally attentive to detail and priority.' },
        { value: 'Openness', score: '-', note: 'Learning to adapt and welcome diverse approaches.' },
        { value: 'Respect', score: '-', note: 'Professional tone with scope to show empathy.' },
        { value: 'Courage', score: '-', note: 'Honest and principled; leads through integrity.' },
    ];
    let compatibility = {
        totalScore: '0 / 125',
        level: '-',
        tag: '-',
        interpretation: '-'
    };

    const scores = attempt?.metadata?.agile_scores || attempt?.metadata?.aci_scores || attempt?.metadata?.scores;

    if (attempt && scores) {
        breakdown = [
            { value: 'Commitment', score: scores['Commitment'] || scores['commitment'] || '-', note: 'Deeply dedicated and consistent.' },
            { value: 'Focus', score: scores['Focus'] || scores['focus'] || '-', note: 'Exceptionally attentive to detail and priority.' },
            { value: 'Openness', score: scores['Openness'] || scores['openness'] || '-', note: 'Learning to adapt and welcome diverse approaches.' },
            { value: 'Respect', score: scores['Respect'] || scores['respect'] || '-', note: 'Professional tone with scope to show empathy.' },
            { value: 'Courage', score: scores['Courage'] || scores['courage'] || '-', note: 'Honest and principled; leads through integrity.' },
        ];

        const rawTotal = scores['total'] || attempt.totalScore || '0';
        const trait = attempt.dominantTrait;

        compatibility = {
            totalScore: String(rawTotal).includes('/') ? rawTotal : `${rawTotal} / 125`,
            level: trait?.blendedStyleName || attempt.sincerityClass || '-',
            tag: trait?.blendedStyleDesc || '-',
            interpretation: trait?.metadata?.interpretation || '-'
        };
    }
    return { breakdown, compatibility };
};

// ... (export and SidebarItem helper remain)

const SidebarItem = ({ label, value, small }: { label: string, value: string, small?: boolean }) => (
    <div>
        <p className={`text-xs text-gray-400 mb-1`}>{label}</p>
        <p className={`${small ? 'text-xs' : 'text-sm'} font-medium text-gray-200 break-all`}>{value}</p>
    </div>
);

export default AssessmentResultPreview;
