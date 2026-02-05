'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftWithoutLineIcon, ArrowRightWithoutLineIcon, ChevronDownIcon } from '../icons';

// ============================================================================
// INTERFACES
// ============================================================================

interface CounsellingReportData {
    generated_at: string;
    disc_profile: {
        scores: { D: number; I: number; S: number; C: number };
        dominant_trait: string;
        trait_name: string;
        trait_description: string;
    };
    behavioral_assessment: string;
    key_strengths: string[];
    natural_abilities: string[];
    growth_areas: string[];
    course_fitment: {
        methodology: string[];
        levels: {
            perfect: { min: number; max: number; label: string };
            good: { min: number; max: number; label: string };
            below: { max: number; label: string };
        };
    };
    perfect_courses: CourseRecommendation[];
    good_courses: CourseRecommendation[];
    entry_level_courses: { name: string; fitment: number }[];
    international_courses: CourseRecommendation[];
    career_guidance: {
        intro: string;
        bullets: string[];
        conclusion: string;
    };
    career_roadmap: {
        stage: string;
        bullets: string[];
    }[];
    final_guidance: string;
}

interface CourseRecommendation {
    name: string;
    fitment: number;
    why_recommended: string[];
    career_progression?: string;
}

interface CounsellingSession {
    id: number;
    studentName: string;
    email: string;
    mobileNumber: string;
    status: string;
    counsellingType: string;
    discScores: { D: number; I: number; S: number; C: number };
    dominantTrait: string;
    personalityTraitName: string;
    hasReport: boolean;
    createdAt: string;
    completedAt: string;
}

interface Props {
    onBack?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CounsellingReportView: React.FC<Props> = ({ onBack }) => {
    // State
    const [sessions, setSessions] = useState<CounsellingSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<CounsellingSession | null>(null);
    const [reportData, setReportData] = useState<CounsellingReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [showEntriesDropdown, setShowEntriesDropdown] = useState(false);

    // View mode
    const [viewMode, setViewMode] = useState<'list' | 'report'>('list');

    const reportRef = useRef<HTMLDivElement>(null);

    // Fetch sessions
    const fetchSessions = async () => {
        setIsLoading(true);
        setError(null);
        const baseUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4001';
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${baseUrl}/admin/counselling/sessions?page=${currentPage}&limit=${entriesPerPage}&status=COMPLETED`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            if (response.ok) {
                const result = await response.json();
                setSessions(result.data || []);
                setTotalCount(result.total || 0);
                setTotalPages(Math.ceil((result.total || 0) / entriesPerPage) || 1);
            } else {
                setError('Failed to fetch sessions');
            }
        } catch (err) {
            setError('Network error while fetching sessions');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch report for a session
    const fetchReport = async (sessionId: number) => {
        const baseUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4001';
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${baseUrl}/admin/counselling/sessions/${sessionId}/report`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            if (response.ok) {
                const result = await response.json();
                return result.data;
            }
            return null;
        } catch (err) {
            console.error('Error fetching report:', err);
            return null;
        }
    };

    // Generate report
    const generateReport = async (sessionId: number) => {
        setIsGenerating(true);
        setError(null);
        const baseUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4001';
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${baseUrl}/admin/counselling/sessions/${sessionId}/report/generate`,
                { 
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` } 
                }
            );
            
            if (response.ok) {
                const result = await response.json();
                setReportData(result.data);
                // Refresh sessions to update hasReport status
                fetchSessions();
            } else {
                const errResult = await response.json();
                setError(errResult.message || 'Failed to generate report');
            }
        } catch (err) {
            setError('Network error while generating report');
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    // View session report
    const handleViewReport = async (session: CounsellingSession) => {
        setSelectedSession(session);
        setViewMode('report');
        
        if (session.hasReport) {
            const report = await fetchReport(session.id);
            setReportData(report);
        } else {
            setReportData(null);
        }
    };

    // Back to list
    const handleBackToList = () => {
        setSelectedSession(null);
        setReportData(null);
        setViewMode('list');
    };

    useEffect(() => {
        fetchSessions();
    }, [currentPage, entriesPerPage]);

    // ========================================================================
    // RENDER HELPERS
    // ========================================================================

    const getFitmentColor = (fitment: number) => {
        if (fitment >= 85) return 'text-green-600 bg-green-100';
        if (fitment >= 70) return 'text-blue-600 bg-blue-100';
        return 'text-gray-600 bg-gray-100';
    };

    const getFitmentBadgeColor = (fitment: number) => {
        if (fitment >= 85) return 'bg-green-600';
        if (fitment >= 70) return 'bg-blue-600';
        return 'bg-gray-600';
    };

    // ========================================================================
    // LIST VIEW
    // ========================================================================

    const renderListView = () => (
        <div className="flex flex-col h-full w-full gap-6 font-sans">
            {/* Header */}
            <div>
                <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
                    <span>Dashboard</span>
                    <span className="mx-2 text-gray-400 dark:text-gray-600">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </span>
                    <span className="text-brand-green font-semibold">Counselling Reports</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#150089] dark:text-white">
                    Counselling Reports
                </h1>
            </div>

            {/* Controls */}
            <div className="flex flex-col xl:flex-row justify-between gap-4 items-start xl:items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing completed counselling sessions. Click on a session to view or generate report.
                </div>
                
                {/* Entries Dropdown */}
                <div className="flex items-center gap-3">
                    <span className="text-sm text-[#19211C] dark:text-brand-text-secondary font-[300]">Showing</span>
                    <div className="relative">
                        <button
                            onClick={() => setShowEntriesDropdown(!showEntriesDropdown)}
                            className="flex items-center gap-2 bg-white dark:bg-[#FFFFFF1F] px-3 py-1.5 rounded-lg text-sm text-brand-green font-semibold min-w-[60px] justify-between shadow-sm border border-transparent dark:border-[#FFFFFF1F]"
                        >
                            {entriesPerPage}
                            <ChevronDownIcon className="w-3 h-3 text-brand-green" />
                        </button>
                        {showEntriesDropdown && (
                            <div className="absolute top-full right-0 mt-1 w-20 bg-white dark:bg-[#303438] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl z-50">
                                {[10, 25, 50].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => {
                                            setEntriesPerPage(num);
                                            setShowEntriesDropdown(false);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full text-center py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-white"
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <span className="text-sm text-[#19211C] dark:text-brand-text-secondary font-[300]">
                        of {totalCount} entries
                    </span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="flex-1 overflow-auto bg-white dark:bg-brand-dark-secondary rounded-xl border border-gray-200 dark:border-brand-dark-tertiary">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full"></div>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>No completed sessions found</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-brand-dark-tertiary">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Student</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Contact</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">DISC Profile</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Personality</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Report</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-brand-dark-tertiary">
                            {sessions.map((session) => (
                                <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-brand-dark-tertiary/50 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="font-medium text-gray-900 dark:text-white">{session.studentName || 'Unknown'}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{session.counsellingType}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-sm text-gray-700 dark:text-gray-300">{session.mobileNumber}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{session.email || '-'}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        {session.discScores && (
                                            <div className="flex gap-1">
                                                {['D', 'I', 'S', 'C'].map((trait) => (
                                                    <span 
                                                        key={trait}
                                                        className={`px-2 py-0.5 text-xs rounded ${
                                                            session.dominantTrait?.includes(trait) 
                                                                ? 'bg-brand-green text-white font-semibold' 
                                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                        }`}
                                                    >
                                                        {trait}: {session.discScores[trait as keyof typeof session.discScores] || 0}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            {session.personalityTraitName || session.dominantTrait || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        {session.hasReport ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Ready
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                </svg>
                                                Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            onClick={() => handleViewReport(session)}
                                            className="px-3 py-1.5 bg-brand-green hover:bg-brand-green/90 text-white text-sm rounded-lg transition-colors"
                                        >
                                            {session.hasReport ? 'View Report' : 'Generate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            <div className="flex justify-center">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 text-gray-600 dark:text-white hover:text-brand-green disabled:opacity-30"
                    >
                        <ArrowLeftWithoutLineIcon className="w-4 h-4" />
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`min-w-[32px] h-8 px-1 rounded-md text-sm ${
                                currentPage === i + 1
                                    ? "bg-brand-green text-white"
                                    : "bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                            }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 text-gray-600 dark:text-white hover:text-brand-green disabled:opacity-30"
                    >
                        <ArrowRightWithoutLineIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    // ========================================================================
    // REPORT VIEW
    // ========================================================================

    const renderReportView = () => {
        if (!selectedSession) return null;

        return (
            <div className="flex flex-col h-full w-full gap-6 font-sans">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <button
                            onClick={handleBackToList}
                            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-brand-green mb-2"
                        >
                            <ArrowLeftWithoutLineIcon className="w-4 h-4" />
                            Back to Sessions
                        </button>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-[#150089] dark:text-white">
                            Counselling Report
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {selectedSession.studentName} • {selectedSession.mobileNumber}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        {reportData && (
                            <button
                                onClick={() => generateReport(selectedSession.id)}
                                disabled={isGenerating}
                                className="px-4 py-2 border border-brand-green text-brand-green hover:bg-brand-green/10 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                Regenerate
                            </button>
                        )}
                        {!reportData && (
                            <button
                                onClick={() => generateReport(selectedSession.id)}
                                disabled={isGenerating}
                                className="px-4 py-2 bg-brand-green hover:bg-brand-green/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isGenerating && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                )}
                                {isGenerating ? 'Generating...' : 'Generate Report'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                {/* Loading */}
                {isGenerating && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Generating AI-powered report...</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">This may take a few seconds</p>
                    </div>
                )}

                {/* No Report Yet */}
                {!reportData && !isGenerating && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-brand-dark-secondary rounded-xl border border-gray-200 dark:border-brand-dark-tertiary">
                        <svg className="w-20 h-20 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Report Generated Yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Click the button above to generate an AI-powered counselling report</p>
                    </div>
                )}

                {/* Report Content */}
                {reportData && !isGenerating && (
                    <div ref={reportRef} className="bg-white dark:bg-brand-dark-secondary rounded-xl border border-gray-200 dark:border-brand-dark-tertiary overflow-hidden">
                        {/* Report Header */}
                        <div className="bg-gradient-to-r from-[#150089] to-[#2a0fd6] text-white p-6">
                            <h2 className="text-2xl font-bold mb-2">Career Fitment & Course Recommendation Report</h2>
                            <p className="text-white/80 text-sm">
                                Generated on {new Date(reportData.generated_at).toLocaleDateString('en-IN', { 
                                    day: 'numeric', month: 'long', year: 'numeric' 
                                })}
                            </p>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Behavioral Assessment Summary */}
                            <section>
                                <h3 className="text-lg font-semibold text-[#150089] dark:text-brand-green mb-3 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-brand-green rounded-full"></span>
                                    Behavioral Assessment Summary
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {reportData.behavioral_assessment}
                                </p>
                            </section>

                            {/* Strengths, Abilities, Growth */}
                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Key Strengths */}
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5">
                                    <h4 className="font-semibold text-green-800 dark:text-green-400 mb-3">Key Strengths</h4>
                                    <ul className="space-y-2">
                                        {reportData.key_strengths.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                                                <span className="text-green-500 mt-0.5">•</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Natural Abilities */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5">
                                    <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-3">Natural Abilities</h4>
                                    <ul className="space-y-2">
                                        {reportData.natural_abilities.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
                                                <span className="text-blue-500 mt-0.5">•</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Growth Areas */}
                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5">
                                    <h4 className="font-semibold text-amber-800 dark:text-amber-400 mb-3">Potential Growth Areas</h4>
                                    <ul className="space-y-2">
                                        {reportData.growth_areas.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                                                <span className="text-amber-500 mt-0.5">•</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Course Fitment Methodology */}
                            <section>
                                <h3 className="text-lg font-semibold text-[#150089] dark:text-brand-green mb-3 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-brand-green rounded-full"></span>
                                    Course Fitment Methodology
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-3">Courses are shortlisted using:</p>
                                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-4">
                                    {reportData.course_fitment.methodology.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>

                                {/* Fitment Levels Table */}
                                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                                    <table className="w-full">
                                        <thead className="bg-gray-100 dark:bg-gray-800">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Range</th>
                                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Category</th>
                                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Recommendation</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="bg-green-50 dark:bg-green-900/20">
                                                <td className="px-4 py-2 text-sm text-green-700 dark:text-green-400">85% – 95%</td>
                                                <td className="px-4 py-2 text-sm font-semibold text-green-700 dark:text-green-400">Perfect Match</td>
                                                <td className="px-4 py-2 text-sm text-green-600 dark:text-green-300">Highly Recommended</td>
                                            </tr>
                                            <tr className="bg-blue-50 dark:bg-blue-900/20">
                                                <td className="px-4 py-2 text-sm text-blue-700 dark:text-blue-400">70% – 84%</td>
                                                <td className="px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-400">Good Match</td>
                                                <td className="px-4 py-2 text-sm text-blue-600 dark:text-blue-300">Recommended with support</td>
                                            </tr>
                                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                                <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">&lt; 70%</td>
                                                <td className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400">Below Threshold</td>
                                                <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Not Recommended</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* Perfect Match Courses */}
                            {reportData.perfect_courses.length > 0 && (
                                <section>
                                    <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-4">
                                        🎯 Priority 1: Top Recommendations
                                    </h3>
                                    <div className="space-y-4">
                                        {reportData.perfect_courses.map((course, i) => (
                                            <div key={i} className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-r-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-semibold text-green-800 dark:text-green-300">{course.name}</h4>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getFitmentBadgeColor(course.fitment)}`}>
                                                        {course.fitment}% Match
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                                    <strong>Why recommended:</strong>
                                                    <ul className="list-disc list-inside ml-2 mt-1">
                                                        {course.why_recommended.map((reason, j) => (
                                                            <li key={j}>{reason}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                {course.career_progression && (
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        <strong>Career Progression:</strong> {course.career_progression}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Good Match Courses */}
                            {reportData.good_courses.length > 0 && (
                                <section>
                                    <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-4">
                                        ✓ Priority 2: Strong Alternatives
                                    </h3>
                                    <div className="space-y-4">
                                        {reportData.good_courses.map((course, i) => (
                                            <div key={i} className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-semibold text-blue-800 dark:text-blue-300">{course.name}</h4>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getFitmentBadgeColor(course.fitment)}`}>
                                                        {course.fitment}% Match
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                                    <strong>Why recommended:</strong>
                                                    <ul className="list-disc list-inside ml-2 mt-1">
                                                        {course.why_recommended.map((reason, j) => (
                                                            <li key={j}>{reason}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Entry Level Courses */}
                            {reportData.entry_level_courses.length > 0 && (
                                <section>
                                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                        📚 Entry-Level Course Matches
                                    </h3>
                                    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                                        <table className="w-full">
                                            <thead className="bg-gray-100 dark:bg-gray-800">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Course Name</th>
                                                    <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Role Fitment</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.entry_level_courses.map((course, i) => (
                                                    <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                                                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{course.name}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getFitmentColor(course.fitment)}`}>
                                                                {course.fitment}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}

                            {/* International Certifications */}
                            {reportData.international_courses.length > 0 && (
                                <section>
                                    <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400 mb-4">
                                        🌍 International Certification Suitability
                                    </h3>
                                    <div className="space-y-4">
                                        {reportData.international_courses.map((course, i) => (
                                            <div key={i} className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 rounded-r-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-semibold text-purple-800 dark:text-purple-300">{course.name}</h4>
                                                    <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-purple-600">
                                                        {course.fitment}% Match
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                                    <strong>Why recommended:</strong>
                                                    <ul className="list-disc list-inside ml-2 mt-1">
                                                        {course.why_recommended.map((reason, j) => (
                                                            <li key={j}>{reason}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Career Guidance */}
                            <section>
                                <h3 className="text-lg font-semibold text-[#150089] dark:text-brand-green mb-3 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-brand-green rounded-full"></span>
                                    Career Direction Guidance
                                </h3>
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5">
                                    <p className="text-gray-700 dark:text-gray-300 mb-3">{reportData.career_guidance.intro}</p>
                                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-3">
                                        {reportData.career_guidance.bullets.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                    <p className="text-gray-700 dark:text-gray-300">{reportData.career_guidance.conclusion}</p>
                                </div>
                            </section>

                            {/* Career Roadmap */}
                            <section>
                                <h3 className="text-lg font-semibold text-[#150089] dark:text-brand-green mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-brand-green rounded-full"></span>
                                    Suggested Career Roadmap
                                </h3>
                                <div className="space-y-4">
                                    {reportData.career_roadmap.map((stage, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-10 rounded-full bg-[#150089] dark:bg-brand-green text-white flex items-center justify-center text-sm font-bold">
                                                    {i + 1}
                                                </div>
                                                {i < reportData.career_roadmap.length - 1 && (
                                                    <div className="w-0.5 h-full bg-gray-300 dark:bg-gray-600 my-2"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 pb-6">
                                                <h4 className="font-semibold text-[#150089] dark:text-white mb-2">{stage.stage}</h4>
                                                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                                                    {stage.bullets.map((item, j) => (
                                                        <li key={j}>{item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Final Guidance */}
                            <section className="bg-gradient-to-r from-[#150089]/10 to-brand-green/10 dark:from-[#150089]/30 dark:to-brand-green/30 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-[#150089] dark:text-brand-green mb-3">
                                    💡 Final Guidance
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {reportData.final_guidance}
                                </p>
                            </section>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ========================================================================
    // MAIN RENDER
    // ========================================================================

    return viewMode === 'list' ? renderListView() : renderReportView();
};

export default CounsellingReportView;
