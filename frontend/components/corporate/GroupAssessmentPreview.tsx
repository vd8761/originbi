import React, { useState, useEffect, useCallback, useRef } from 'react';
import { assessmentService } from '../../lib/services/assessment.service';
import { buildReportApiUrl } from '../../lib/utils/reportUrl';
import { ArrowLeftWithoutLineIcon, ArrowRightWithoutLineIcon, ChevronDownIcon, EyeVisibleIcon, FilterFunnelIcon } from '../icons';
import ExcelExportButton from '../ui/ExcelExportButton';

interface GroupAssessmentPreviewProps {
    sessionId: string;
    onBack: () => void;
    onViewSession: (session: any) => void;
    // Opens the combined "By Group" report across all windows of this
    // (group, program). Optional so the component still works standalone.
    onViewCombined?: (groupId: string | number, programId: string | number) => void;
}

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
        });
    } catch {
        return dateStr;
    }
};

const GroupAssessmentPreview: React.FC<GroupAssessmentPreviewProps> = ({ sessionId, onBack, onViewSession, onViewCombined }) => {
    const [groupData, setGroupData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [showEntriesDropdown, setShowEntriesDropdown] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    // Group placement report (Download / Email) state
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [departmentStats, setDepartmentStats] = useState<any[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
    const [downloadLoading, setDownloadLoading] = useState(false);
    // Report-type chooser. Defaults to the dept-appropriate handbook
    // (MBA → "mba", everything else → "standard"). "level1" is the Level 1
    // Placement Report and is available for every department.
    const [reportType, setReportType] = useState<'mba' | 'standard' | 'level1'>('mba');

    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState('');
    const isDownloadingRef = useRef(false);

    // Email State
    const [reportEmail, setReportEmail] = useState('');
    const [sendingReportEmail, setSendingReportEmail] = useState(false);
    const [reportEmailSent, setReportEmailSent] = useState(false);

    // Fetch Data
    const fetchGroupData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await assessmentService.getGroupSession(sessionId);
            setGroupData(data);
        } catch (error) {
            console.error("Failed to fetch group assessment", error);
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    useEffect(() => {
        fetchGroupData();
    }, [fetchGroupData]);

    const handleDownloadReportClick = async () => {
        setDownloadLoading(true);
        try {
            const stats = await assessmentService.getGroupDepartmentStats(sessionId);
            setDepartmentStats(stats.departments || []);
            // If single department, select it automatically and default the
            // report type to whichever handbook best matches that department.
            if (stats.departments?.length > 0) {
                const first = stats.departments[0];
                setSelectedDepartment(first.id);
                const firstIsMBA = (first?.name || '').toUpperCase().includes('MBA');
                setReportType(firstIsMBA ? 'mba' : 'standard');
            } else {
                setReportType('standard');
            }
            setShowDownloadModal(true);
        } catch (error) {
            console.error("Failed to fetch department stats", error);
        } finally {
            setDownloadLoading(false);
        }
    };

    const handleConfirmDownload = async () => {
        if (!selectedDepartment || !groupData?.group?.id) return;
        if (isDownloadingRef.current) return;

        try {
            isDownloadingRef.current = true;
            setGenerating(true);
            setProgress('Initializing...');

            // 1. Start Job — always send reportType so the backend knows which
            // report variant to generate (standard, mba, or level1).
            const startRes = await fetch(buildReportApiUrl(`/generate/placement/${groupData.group.id}/${selectedDepartment}?json=true&reportType=${reportType}`));
            const startData = await startRes.json();

            if (!startData.success || !startData.jobId) {
                throw new Error("Failed to start report generation");
            }

            const jobId = startData.jobId;

            // 2. Poll Status
            let isComplete = false;
            while (!isComplete && isDownloadingRef.current) {
                try {
                    const statusRes = await fetch(buildReportApiUrl(`/download/status/${jobId}?json=true`));
                    const statusData = await statusRes.json();

                    if (statusData.status === 'PROCESSING') {
                        setProgress(statusData.progress || 'Processing...');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } else if (statusData.status === 'COMPLETED') {
                        isComplete = true;
                        setProgress('Download Starting...');

                        if (!statusData.downloadUrl) {
                            throw new Error('Download URL missing from report status.');
                        }

                        // Trigger Download
                        window.location.href = buildReportApiUrl(statusData.downloadUrl);

                        // Close Modal after a delay
                        setTimeout(() => {
                            setGenerating(false);
                            setProgress('');
                            setShowDownloadModal(false);
                        }, 2000);
                    } else if (statusData.status === 'ERROR') {
                        isComplete = true;
                        throw new Error(statusData.error || 'Generation failed');
                    }
                } catch (err) {
                    isComplete = true;
                    console.error("Polling error", err);
                    setProgress('Error!');
                    setGenerating(false);
                }
            }

        } catch (error) {
            console.error("Download failed", error);
            setProgress('Failed');
            setGenerating(false);
        } finally {
            isDownloadingRef.current = false;
        }
    };

    const handleSendReportEmail = async () => {
        if (!selectedDepartment || !groupData?.group?.id) return;
        if (!reportEmail || !reportEmail.includes('@')) {
            alert('Please enter a valid email address.');
            return;
        }

        try {
            setSendingReportEmail(true);

            // 1. Start Generation — always send reportType.
            const startRes = await fetch(buildReportApiUrl(`/generate/placement/${groupData.group.id}/${selectedDepartment}?json=true&reportType=${reportType}`));
            const startData = await startRes.json();

            if (!startData.success || !startData.jobId) {
                throw new Error('Failed to start report generation');
            }

            const jobId = startData.jobId;

            // 2. Poll until complete
            let isComplete = false;
            while (!isComplete) {
                const statusRes = await fetch(buildReportApiUrl(`/download/status/${jobId}?json=true`));
                const statusData = await statusRes.json();

                if (statusData.status === 'PROCESSING') {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else if (statusData.status === 'COMPLETED') {
                    isComplete = true;

                    if (!statusData.downloadUrl) {
                        throw new Error('Download URL missing from report status.');
                    }

                    // 3. Trigger send email with the download URL
                    const selectedDept = departmentStats.find((d: any) => d.id === selectedDepartment);
                    const deptFullName = selectedDept?.name || '';
                    // Extract degree type from name (e.g. "B.Tech. Information Technology" -> degreeType="B.Tech.", dept="Information Technology")
                    const deptNameParts = deptFullName.match(/^(B\.Tech\.|M\.Tech\.|B\.E\.|M\.E\.|B\.Sc\.|M\.Sc\.|BCA|MCA|MBA|B\.Com|M\.Com|B\.A\.|M\.A\.)\s*(.+)$/i);
                    const degreeType = deptNameParts ? deptNameParts[1] : '';
                    const deptName = deptNameParts ? deptNameParts[2] : deptFullName;

                    const studentApiBase = process.env.NEXT_PUBLIC_STUDENT_API_URL || '';
                    const sendRes = await fetch(`${studentApiBase}/student/send-placement-report-email`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            groupId: groupData.group.id,
                            departmentId: selectedDepartment,
                            toEmail: reportEmail,
                            downloadUrl: buildReportApiUrl(statusData.downloadUrl),
                            studentCount: selectedDept?.completed || 0,
                            degreeType,
                            departmentName: deptName,
                        }),
                    });

                    if (!sendRes.ok) throw new Error('Failed to send email');

                    setReportEmailSent(true);
                    setTimeout(() => setReportEmailSent(false), 5000);
                } else if (statusData.status === 'ERROR') {
                    isComplete = true;
                    throw new Error(statusData.error || 'Generation failed');
                }
            }
        } catch (error) {
            console.error('Send report email failed', error);
            alert('Failed to send report email. Please try again.');
        } finally {
            setSendingReportEmail(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
            </div>
        );
    }

    if (!groupData) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-gray-500">Group assessment not found.</p>
                <button onClick={onBack} className="text-brand-green hover:underline">Go Back</button>
            </div>
        );
    }

    // Filter sessions locally for now (since backend returns all for this group)
    const allSessions = groupData.sessions || [];
    const filteredSessions = allSessions.filter((s: any) => {
        const query = search.toLowerCase();
        const matchesSearch = (
            (s.userFullName && s.userFullName.toLowerCase().includes(query)) ||
            (s.userEmail && s.userEmail.toLowerCase().includes(query)) ||
            (s.status && s.status.toLowerCase().includes(query))
        );

        const matchesFilter = statusFilter === 'All'
            ? true
            : s.status?.toUpperCase() === statusFilter.replace(/ /g, '_').toUpperCase();

        return matchesSearch && matchesFilter;
    });

    const total = filteredSessions.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginatedSessions = filteredSessions.slice((page - 1) * limit, page * limit);

    // Safely determine program ID (fallback to session programId if group-level program is missing/misconfigured)
    const actualProgramId = groupData?.program?.id
        ? Number(groupData.program.id)
        : (allSessions.length > 0 ? Number(allSessions[0].programId) : null);

    // The group placement report is generated from Level 1 DISC scores and is
    // currently available for College Student groups only.
    const isCollegeStudentProgram = actualProgramId === 2;

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const getPaginationNumbers = () => {
        const pageNumbers: (number | string)[] = [];
        const maxVisibleButtons = 5;

        if (totalPages <= maxVisibleButtons + 2) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            pageNumbers.push(1);
            if (page > 3) pageNumbers.push("...");

            let start = Math.max(2, page - 1);
            let end = Math.min(totalPages - 1, page + 1);

            if (page <= 3) {
                start = 2;
                end = 4;
            }
            if (page >= totalPages - 2) {
                start = totalPages - 3;
                end = totalPages - 1;
            }

            for (let i = start; i <= end; i++) {
                pageNumbers.push(i);
            }

            if (page < totalPages - 2) pageNumbers.push("...");
            pageNumbers.push(totalPages);
        }
        return pageNumbers;
    };

    const handleExport = () => {
        if (!groupData) return;

        // Prepare Summary Data
        const summaryRows = [
            ['Assessment Summary'],
            ['Exam Title', groupData.program?.assessment_title || 'N/A'],
            ['Exam Status', groupData.status || 'N/A'],
            ['Exam Type', 'WebApp'],
            ['Program Name', groupData.program?.name || 'N/A'],
            ['Group Name', groupData.group?.name || 'N/A'],
            ['No. of Candidates', groupData.totalCandidates || allSessions.length],
            ['Exam Starts On', formatDate(groupData.validFrom)],
            ['Exam Ends On', formatDate(groupData.validTo)],
            [], // Empty row
            ['List of Candidates'],
            ['Name', 'Email ID', 'Exam Status', 'Exam Starts On', 'Exam Ends On', 'Expired On'] // Headers
        ];

        // Prepare Candidates Data
        const candidateRows = filteredSessions.map((session: any) => {
            const isNotStarted = session.status === 'NOT_STARTED';
            const isExpired = session.status === 'EXPIRED';
            return [
                session.userFullName,
                session.userEmail,
                session.status,
                isNotStarted ? '--' : formatDate(session.validFrom),
                isNotStarted ? '--' : formatDate(session.validTo),
                isExpired ? formatDate(session.validTo) : '-'
            ];
        });

        // Combine Content
        const csvContent = [
            ...summaryRows.map((row: any[]) => row.map(cell => `"${cell}"`).join(',')),
            ...candidateRows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
        ].join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Group_Assessment_${groupData.group?.name || 'Export'}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col gap-6 font-sans h-full p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div>
                <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
                    <span onClick={onBack} className="cursor-pointer hover:underline">Dashboard</span>
                    <span className="mx-2 text-gray-400 dark:text-gray-600">
                        <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
                    </span>
                    <span onClick={onBack} className="cursor-pointer hover:underline">Registrations</span>
                    <span className="mx-2 text-gray-400 dark:text-gray-600">
                        <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
                    </span>
                    <span className="text-brand-green font-semibold">Group Assessment Preview</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <ArrowLeftWithoutLineIcon className="w-6 h-6 text-[#150089] dark:text-white" />
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-[#150089] dark:text-white">
                        Group Assessment Preview
                    </h1>
                </div>
            </div>

            {/* Assessment Summary Card */}
            <div className="bg-[#19211C] p-6 rounded-2xl text-white relative shadow-lg">
                <h2 className="text-sm text-gray-400 mb-6 font-medium uppercase tracking-wider">Assessment Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-6">
                    <div>
                        <p className="text-xs text-brand-text-secondary dark:text-gray-400 mb-1.5">Exam Title</p>
                        <p className="text-base font-semibold text-white">{groupData.program?.assessment_title || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-brand-text-secondary dark:text-gray-400 mb-1.5">Exam Status</p>
                        <span className={`inline-block px-3 py-1 rounded text-[10px] font-bold border tracking-wide
                            ${groupData.status === 'COMPLETED' ? 'bg-[#00B69B] text-white border-[#00B69B]' :
                                groupData.status === 'IN_PROGRESS' || groupData.status === 'ON_GOING' ? 'bg-[#00B69B]/20 text-[#00B69B] border-[#00B69B]' :
                                    groupData.status === 'EXPIRED' ? 'bg-[#EF3826]/20 text-[#EF3826] border-[#EF3826]' :
                                        groupData.status === 'NOT_STARTED' ? 'bg-[#F2F2F2]/10 text-white border-[#F2F2F2]/20' :
                                            'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {groupData.status?.replace(/_/g, " ")}
                        </span>
                    </div>
                    <div>
                        <p className="text-xs text-brand-text-secondary dark:text-gray-400 mb-1.5">Exam Type</p>
                        <p className="text-base font-medium text-white">WebApp</p>
                    </div>
                    <div>
                        <p className="text-xs text-brand-text-secondary dark:text-gray-400 mb-1.5">Program Name</p>
                        <p className="text-base font-medium text-white">{groupData.program?.name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-brand-text-secondary dark:text-gray-400 mb-1.5">Group Name</p>
                        <p className="text-base font-medium text-white">{groupData.group?.name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-brand-text-secondary dark:text-gray-400 mb-1.5">No. of Candidates</p>
                        <p className="text-base font-medium text-white">{groupData.totalCandidates || allSessions.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-brand-text-secondary dark:text-gray-400 mb-1.5">Exam Starts On</p>
                        <p className="text-base font-medium text-white">{formatDate(groupData.validFrom)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-brand-text-secondary dark:text-gray-400 mb-1.5">Exam Ends On</p>
                        <p className="text-base font-medium text-white">{formatDate(groupData.validTo)}</p>
                    </div>
                </div>
            </div>

            {/* Candidates List Header */}
            <div className='flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 pt-4'>
                <h2 className="text-xl font-semibold text-[#150089] dark:text-white">List of Candidates</h2>

                <div className="flex items-center gap-3">
                    <span className="text-sm text-[#19211C] dark:text-brand-text-secondary hidden sm:inline font-[300]">
                        Showing
                    </span>
                    <div className="relative">
                        <button
                            onClick={() => setShowEntriesDropdown(!showEntriesDropdown)}
                            className="flex items-center gap-2 bg-white dark:bg-[#FFFFFF1F] px-3 py-1.5 rounded-lg text-sm text-brand-green font-semibold min-w-[60px] justify-between shadow-sm border border-transparent dark:border-[#FFFFFF1F] hover:border-gray-200 transition-all"
                        >
                            {limit}
                            <ChevronDownIcon className="w-3 h-3 text-brand-green" />
                        </button>
                        {showEntriesDropdown && (
                            <div className="absolute top-full right-0 mt-1 w-20 bg-brand-light-secondary dark:bg-[#303438] border border-brand-light-tertiary dark:border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                                {[10, 25, 50, 100].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => {
                                            setLimit(num);
                                            setShowEntriesDropdown(false);
                                            setPage(1);
                                        }}
                                        className="w-full text-center py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 text-brand-text-light-primary dark:text-white"
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <span className="text-sm text-[#19211C] dark:text-brand-text-secondary whitespace-nowrap font-[300]">
                        of {total.toString().padStart(2, '0')} entries
                    </span>

                    {/* Compact arrows for quick nav */}
                    <div className="flex gap-1 ml-2">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="p-1 rounded bg-white dark:bg-[#19211C] hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                        >
                            <ArrowLeftWithoutLineIcon className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="p-1 rounded bg-white dark:bg-[#19211C] hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50 transition-colors"
                        >
                            <ArrowRightWithoutLineIcon className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Search + Actions */}
            <div className="flex flex-col xl:flex-row justify-between gap-4 items-start xl:items-center">
                {/* Search */}
                <div className="relative w-full xl:w-96">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search by name, email..."
                        className="w-full bg-transparent border border-[#19211C]/40 dark:border-brand-dark-tertiary rounded-xl py-2.5 pl-4 pr-10 text-sm text-[#19211C] dark:text-white placeholder-[#19211C]/80 placeholder:font-normal dark:placeholder-brand-text-secondary focus:outline-none focus:border-brand-green transition-colors"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-light-secondary dark:text-brand-text-secondary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                </div>
                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    {/* Combined "By Group" report across all windows */}
                    {onViewCombined && groupData?.group?.id && actualProgramId && (
                        <button
                            onClick={() => onViewCombined(groupData.group.id, actualProgramId as number)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#FFFFFF1F] border border-gray-200 dark:border-[#FFFFFF1F] rounded-lg text-sm font-medium text-[#19211C] dark:text-white hover:bg-gray-50 dark:hover:bg-white/30 transition-all shadow-sm"
                        >
                            <span>Combined Report</span>
                            <svg className="w-5 h-5 text-brand-green" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    )}
                    {/* Process Report Button (group placement report) */}
                    <button
                        onClick={handleDownloadReportClick}
                        disabled={downloadLoading || !isCollegeStudentProgram}
                        title={!isCollegeStudentProgram ? "Available for College Students only" : ""}
                        className={`flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#FFFFFF1F] border border-gray-200 dark:border-[#FFFFFF1F] rounded-lg text-sm font-medium transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed
                            ${!isCollegeStudentProgram
                                ? 'text-gray-400 dark:text-gray-500'
                                : 'text-[#19211C] dark:text-white hover:bg-gray-50 dark:hover:bg-white/30'}`}
                    >
                        <span>{downloadLoading ? "Loading..." : "Process Report"}</span>
                        {downloadLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-green"></div>
                        ) : (
                            <svg className={`w-5 h-5 ${!isCollegeStudentProgram ? 'text-gray-400' : 'text-brand-green'}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className={`flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#FFFFFF1F] border border-gray-200 dark:border-[#FFFFFF1F] rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/30 transition-all shadow-sm cursor-pointer ${statusFilter !== 'All' ? 'text-brand-green border-brand-green/30 bg-brand-green/5' : 'text-[#19211C] dark:text-white'}`}
                        >
                            <FilterFunnelIcon className={`w-4 h-4 ${statusFilter !== 'All' ? 'text-brand-green' : ''}`} />
                            <span>{statusFilter === 'All' ? 'Filter' : statusFilter}</span>
                        </button>
                        {showFilterDropdown && (
                            <div className="absolute top-full right-0 mt-1 w-48 bg-[#303438] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                                {['All', 'Not Started', 'In Progress', 'Completed', 'Partially Expired', 'Expired'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => {
                                            setStatusFilter(status);
                                            setShowFilterDropdown(false);
                                            setPage(1);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors flex items-center justify-between
                                            ${statusFilter === status ? 'text-brand-green' : 'text-gray-300'}`}
                                    >
                                        {status}
                                        {statusFilter === status && <div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <ExcelExportButton onClick={handleExport} />
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-[300px] flex flex-col rounded-xl border border-brand-light-tertiary dark:border-white/10 bg-white dark:bg-[#19211C]/90 backdrop-blur-sm shadow-xl relative overflow-hidden transition-all duration-300">
                <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                    <table className="w-full border-collapse relative min-w-[1000px]">
                        <thead className="sticky top-0 z-20 bg-[#F8FAFC] dark:bg-[#FFFFFF1F] shadow-sm">
                            <tr className="text-left">
                                <th className="p-4 text-xs font-semibold text-[#19211C] dark:text-brand-text-secondary tracking-wider text-center w-16 uppercase">Action</th>
                                <th className="p-4 text-xs font-semibold text-[#19211C] dark:text-brand-text-secondary tracking-wider uppercase">Name</th>
                                <th className="p-4 text-xs font-semibold text-[#19211C] dark:text-brand-text-secondary tracking-wider uppercase">Email ID</th>
                                <th className="p-4 text-xs font-semibold text-[#19211C] dark:text-brand-text-secondary tracking-wider text-center uppercase">Exam Status</th>
                                <th className="p-4 text-xs font-semibold text-[#19211C] dark:text-brand-text-secondary tracking-wider uppercase">Exam Starts On</th>
                                <th className="p-4 text-xs font-semibold text-[#19211C] dark:text-brand-text-secondary tracking-wider uppercase">Exam Ends On</th>
                                <th className="p-4 text-xs font-semibold text-[#19211C] dark:text-brand-text-secondary tracking-wider uppercase">Expired On</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-light-tertiary dark:divide-brand-dark-tertiary">
                            {paginatedSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">No candidates found.</td>
                                </tr>
                            ) : (
                                paginatedSessions.map((session: any) => {
                                    const isNotStarted = session.status === 'NOT_STARTED';
                                    const isExpired = session.status === 'EXPIRED';
                                    return (
                                        <tr key={session.id} className="hover:bg-brand-light-primary/30 dark:hover:bg-[#FFFFFF0D] transition-colors group">
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => onViewSession(session)}
                                                    className="p-1 hover:bg-brand-light-tertiary dark:hover:bg-white/10 rounded-full transition-colors text-brand-green transform group-hover:scale-110"
                                                    title="View Results"
                                                >
                                                    <EyeVisibleIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                            <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-primary font-medium">{session.userFullName}</td>
                                            <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-secondary">{session.userEmail}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-3 py-1 rounded text-[10px] font-bold border tracking-wide uppercase 
                                                    ${session.status === 'COMPLETED' ? 'bg-[#00B69B] text-white border-[#00B69B]' :
                                                        session.status === 'IN_PROGRESS' || session.status === 'ON_GOING' ? 'bg-[#00B69B]/20 text-[#00B69B] border-[#00B69B]' :
                                                            session.status === 'EXPIRED' ? 'bg-[#EF3826]/20 text-[#EF3826] border-[#EF3826]' :
                                                                'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                    {session.status?.replace(/_/g, " ")}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-secondary">{isNotStarted ? '--' : formatDate(session.validFrom)}</td>
                                            <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-secondary">{isNotStarted ? '--' : formatDate(session.validTo)}</td>
                                            <td className="p-4 text-sm text-[#19211C] dark:text-brand-text-secondary">{isExpired ? formatDate(session.validTo) : '-'}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-brand-text-light-secondary dark:text-brand-text-secondary pb-4">
                <div className="flex gap-4 w-full sm:w-1/3 justify-center sm:justify-start order-2 sm:order-1">
                    <p className="text-xs text-gray-500">Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results</p>
                </div>

                <div className="flex justify-center w-full sm:w-1/3 order-1 sm:order-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ArrowLeftWithoutLineIcon className="w-3 h-3" />
                        </button>

                        {getPaginationNumbers().map((p, i) => (
                            <button
                                key={i}
                                onClick={() => typeof p === 'number' && handlePageChange(p)}
                                disabled={typeof p !== 'number'}
                                className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors
                                    ${p === page
                                        ? 'bg-brand-green text-white shadow-md shadow-brand-green/20'
                                        : typeof p === 'number' ? 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300' : 'cursor-default text-gray-400'}`}
                            >
                                {p}
                            </button>
                        ))}

                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ArrowRightWithoutLineIcon className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                <div className="w-full sm:w-1/3 sm:block hidden order-3"></div>
            </div>

            {/* Download Modal — group placement report */}
            {showDownloadModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDownloadModal(false)}></div>
                    <div className="bg-white dark:bg-[#19211C] rounded-2xl w-full max-w-lg p-0 shadow-2xl relative z-10 animate-fade-in-up overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-black/5 dark:ring-white/10">
                        {/* Accent bar */}
                        <div className="h-1 w-full bg-gradient-to-r from-brand-green via-emerald-400 to-brand-green"></div>

                        {/* Modal Header */}
                        <div className="flex justify-between items-start gap-4 px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/10">
                            <div className="flex items-start gap-3 min-w-0">
                                <div className="shrink-0 mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green ring-1 ring-brand-green/20">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-bold text-brand-dark-primary dark:text-white leading-tight">Process Report</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Select a department, choose a report type, then download or email it.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDownloadModal(false)}
                                className="shrink-0 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-5 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                            {/* Department List */}
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Department</p>
                                {departmentStats.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-gray-500 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                                        No departments found for this group.
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {departmentStats.map((dept) => {
                                            // MBA departments get a special placement report — mirror the
                                            // backend isMBA detection in reportQueueService.processPlacementReport.
                                            const isMBA = (dept.name || '').toUpperCase().includes('MBA');
                                            const isSelected = selectedDepartment === dept.id;
                                            const pct = Math.round((dept.completed / (dept.total || 1)) * 100);
                                            const isComplete = dept.completed === dept.total && dept.total > 0;
                                            return (
                                                <div
                                                    key={dept.id}
                                                    onClick={() => {
                                                        setSelectedDepartment(dept.id);
                                                        // If the current report type isn't compatible with
                                                        // the newly-selected department, snap to a sensible
                                                        // default ("mba" only valid for MBA depts).
                                                        if (reportType === 'mba' && !isMBA) setReportType('standard');
                                                    }}
                                                    className={`p-4 rounded-xl border cursor-pointer transition-all
                                                        ${isSelected
                                                            ? 'border-brand-green bg-brand-green/[0.07] ring-1 ring-brand-green shadow-sm'
                                                            : 'border-gray-200 dark:border-white/10 hover:border-brand-green/50 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            <div className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors
                                                                ${isSelected ? 'border-brand-green bg-brand-green' : 'border-gray-300 dark:border-gray-500'}`}>
                                                                {isSelected && <div className="w-2 h-2 rounded-full bg-brand-dark-primary"></div>}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <p className={`font-semibold text-sm truncate ${isSelected ? 'text-brand-green' : 'text-brand-dark-primary dark:text-white'}`}>
                                                                        {dept.name}
                                                                    </p>
                                                                    {isMBA && (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md whitespace-nowrap shadow-sm bg-gradient-to-r from-amber-300 to-yellow-500 text-amber-900 ring-1 ring-amber-500/50">
                                                                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                                                <path d="M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.6l-5.9 3.1 1.13-6.58L2.45 9.44l6.6-.96L12 2.5z" />
                                                                            </svg>
                                                                            Special MBA
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                                    {dept.completed} of {dept.total || 0} candidates completed
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className={`shrink-0 inline-block whitespace-nowrap text-xs font-bold px-2 py-1 rounded-md
                                                            ${isComplete
                                                                ? 'bg-brand-green/15 text-brand-green'
                                                                : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'}`}>
                                                            {pct}%
                                                        </span>
                                                    </div>
                                                    {/* Progress bar */}
                                                    <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-brand-green' : 'bg-brand-green/60'}`}
                                                            style={{ width: `${pct}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Report Type Chooser — always available. The
                                "Special MBA Report" tile only shows for MBA
                                departments; the Standard and Level 1 reports
                                are available for every department. */}
                            {(() => {
                                const sel = departmentStats.find((d: any) => d.id === selectedDepartment);
                                const isMBASel = (sel?.name || '').toUpperCase().includes('MBA');
                                if (!sel) return null;
                                const allOptions: { value: 'mba' | 'standard' | 'level1'; title: string; desc: string; mbaOnly?: boolean }[] = [
                                    {
                                        value: 'mba',
                                        title: 'Special MBA Report',
                                        desc: 'Specialization-fit handbook (Finance, HR, BA, Ops, Marketing).',
                                        mbaOnly: true,
                                    },
                                    {
                                        value: 'standard',
                                        title: 'Standard Placement Report',
                                        desc: 'The regular DISC-style placement handbook.',
                                    },
                                    {
                                        value: 'level1',
                                        title: 'Level 1 Placement Report',
                                        desc: 'Group specialization & trait mapping driven by Level 1 DISC scores.',
                                    },
                                ];
                                const options = allOptions.filter((o) => (o.mbaOnly ? isMBASel : true));
                                const cols = options.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2';
                                return (
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Report Type</p>
                                        <div className={`grid grid-cols-1 ${cols} gap-2.5`}>
                                            {options.map((opt) => {
                                                const active = reportType === opt.value;
                                                return (
                                                    <button
                                                        type="button"
                                                        key={opt.value}
                                                        onClick={() => setReportType(opt.value)}
                                                        className={`relative text-left p-3.5 rounded-xl border transition-all ${active
                                                            ? 'border-brand-green bg-brand-green/[0.07] ring-1 ring-brand-green shadow-sm'
                                                            : 'border-gray-200 dark:border-white/10 hover:border-brand-green/50 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                                    >
                                                        {active && (
                                                            <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-green text-brand-dark-primary">
                                                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                            </span>
                                                        )}
                                                        <div className="flex items-center gap-2 pr-5">
                                                            {opt.value === 'mba' && (
                                                                <svg className="w-4 h-4 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                                    <path d="M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.6l-5.9 3.1 1.13-6.58L2.45 9.44l6.6-.96L12 2.5z" />
                                                                </svg>
                                                            )}
                                                            {opt.value === 'level1' && (
                                                                <span className="inline-flex shrink-0 items-center justify-center w-4 h-4 rounded-full bg-brand-green/20 text-brand-green text-[9px] font-bold">L1</span>
                                                            )}
                                                            {opt.value === 'standard' && (
                                                                <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6h6v6m-9 4h12a2 2 0 002-2V7a2 2 0 00-2-2h-4l-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                            )}
                                                            <p className={`text-sm font-semibold leading-tight ${active ? 'text-brand-green' : 'text-brand-dark-primary dark:text-white'}`}>
                                                                {opt.title}
                                                            </p>
                                                        </div>
                                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 leading-snug">{opt.desc}</p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Email Input */}
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Send to Email <span className="normal-case font-normal text-gray-400">(optional)</span></p>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </span>
                                    <input
                                        type="email"
                                        value={reportEmail}
                                        onChange={(e) => setReportEmail(e.target.value)}
                                        placeholder="Enter email address to send report"
                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#FFFFFF05] flex flex-col-reverse sm:flex-row gap-3">
                            {/* Send Email Button */}
                            <button
                                onClick={handleSendReportEmail}
                                disabled={!selectedDepartment || !reportEmail || sendingReportEmail || generating}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-brand-green text-brand-green font-bold text-sm hover:bg-brand-green/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {sendingReportEmail ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-green"></div>
                                        <span>Sending...</span>
                                    </>
                                ) : reportEmailSent ? (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        <span>Email Sent!</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        <span>Send Email</span>
                                    </>
                                )}
                            </button>
                            {/* Download Report Button */}
                            <button
                                onClick={handleConfirmDownload}
                                disabled={!selectedDepartment || generating || sendingReportEmail}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-green text-brand-dark-primary font-bold text-sm hover:bg-brand-green/90 transition-colors shadow-lg shadow-brand-green/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {generating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-dark-primary"></div>
                                        <span>{progress}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Download Report</span>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default GroupAssessmentPreview;
