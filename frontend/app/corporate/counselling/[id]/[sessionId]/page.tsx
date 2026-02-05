
"use client";
import React, { useEffect, useState, use } from "react";
import { corporateDashboardService } from '../../../../../lib/services';
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from '../../../../../components/icons';
import { User, FileText, Mail, Phone, Globe, Calendar, Download, RefreshCw, CheckCircle, AlertCircle, BookOpen, Target, TrendingUp, Award, Briefcase, ChevronRight } from "lucide-react";

// ============================================================================
// INTERFACES
// ============================================================================

interface CourseRecommendation {
    name: string;
    fitment: number;
    why_recommended?: string[];
    career_progression?: string;
}

interface ReportData {
    generated_at: string;
    student_name: string;
    disc_profile?: {
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
    career_roadmap: { stage: string; bullets: string[] }[];
    final_guidance: string;
}

export default function CounsellingSessionDetailPage({ params }: { params: Promise<{ id: string, sessionId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'report'>('details');
    const [error, setError] = useState("");
    const [responses, setResponses] = useState<any[]>([]);
    const [responsesLoading, setResponsesLoading] = useState(false);

    // Report State
    const [report, setReport] = useState<ReportData | null>(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportGenerating, setReportGenerating] = useState(false);
    const [reportError, setReportError] = useState("");

    const sessionId = Number(resolvedParams.sessionId);

    // 1. Fetch Session Details
    useEffect(() => {
        const fetchSession = async () => {
            setLoading(true);
            try {
                const user = localStorage.getItem("user");
                if (!user) return;
                const { email } = JSON.parse(user);

                const res = await corporateDashboardService.getCounsellingSessionById(email, sessionId);
                setSession(res);
            } catch (err) {
                console.error("Failed to fetch session", err);
                setError("Failed to load session details.");
            } finally {
                setLoading(false);
            }
        };

        if (sessionId) {
            fetchSession();
        }
    }, [sessionId]);

    // 2. Fetch Responses when Report Tab is active
    useEffect(() => {
        if (activeTab === 'report' && session?.id && (session.status === 'COMPLETED' || session.status === 'ACTIVE')) {
            const fetchResponses = async () => {
                setResponsesLoading(true);
                try {
                    const res = await corporateDashboardService.getSessionResponses(session.id);
                    setResponses(res || []);
                } catch (e) {
                    console.error(e);
                } finally {
                    setResponsesLoading(false);
                }
            };
            fetchResponses();
        }
    }, [activeTab, session]);

    // 3. Fetch Report when Report Tab is active and session is completed
    useEffect(() => {
        if (activeTab === 'report' && session?.id && session.status === 'COMPLETED') {
            const fetchReport = async () => {
                setReportLoading(true);
                setReportError("");
                try {
                    const user = localStorage.getItem("user");
                    if (!user) return;
                    const { email } = JSON.parse(user);
                    const reportData = await corporateDashboardService.getCounsellingReport(email, session.id);
                    setReport(reportData);
                } catch (err: any) {
                    console.error("Failed to fetch report:", err);
                    setReportError(err.message || "Failed to load report");
                } finally {
                    setReportLoading(false);
                }
            };
            fetchReport();
        }
    }, [activeTab, session]);

    // 4. Generate Report Handler
    const handleGenerateReport = async () => {
        setReportGenerating(true);
        setReportError("");
        try {
            const user = localStorage.getItem("user");
            if (!user) throw new Error("Not logged in");
            const { email } = JSON.parse(user);
            const reportData = await corporateDashboardService.generateCounsellingReport(email, session.id);
            setReport(reportData);
        } catch (err: any) {
            console.error("Report generation failed:", err);
            setReportError(err.message || "Failed to generate report");
        } finally {
            setReportGenerating(false);
        }
    };

    // 5. PDF Download Handler
    const handleDownloadPDF = () => {
        if (!report) return;

        // Create a printable version and open in new window
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const studentName = report.student_name || 'Student';
        const html = generatePrintableHTML(report, studentName);

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
            // Delay print to allow fonts and images to fully load
            setTimeout(() => {
                printWindow.print();
            }, 1500);
        };
    };

    // ... (rest of the file until the report tab content)



    if (loading) {
        return (
            <div className="p-8 flex justify-center text-gray-500">
                Loading session details...
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="p-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-500 hover:text-gray-900 mb-6"
                >
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Back
                </button>
                <div className="text-red-500 bg-red-50 p-4 rounded-lg border border-red-100 dark:bg-red-900/10 dark:border-red-900/20">
                    {error || "Session not found."}
                </div>
            </div>
        );
    }

    let details = session.studentDetails || session.student_details || {};
    if (typeof details === 'string') {
        try { details = JSON.parse(details); } catch { /* ignore */ }
    }
    const d = details;
    const firstName = d.personal_details?.first_name || d.personalDetails?.firstName || d.contact_information?.first_name || d.contactInformation?.firstName || d.first_name || d.name || '';
    const lastName = d.personal_details?.last_name || d.personalDetails?.lastName || d.contact_information?.last_name || d.contactInformation?.lastName || d.last_name || '';
    const fullName = firstName ? `${firstName} ${lastName}`.trim() : 'N/A';

    // Fallback for contact display
    const contact = d.contact_information || d.contactInformation || d.personal_details || d.personalDetails || {};

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
            <button
                onClick={() => router.back()}
                className="flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition-colors"
            >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Sessions
            </button>

            {/* Header Card */}
            <div className="bg-white dark:bg-brand-dark-secondary rounded-2xl p-6 border border-gray-100 dark:border-brand-dark-tertiary shadow-sm mb-8">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {fullName}
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Session ID: #{session.id}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${session.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                            {session.status}
                        </span>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Created At</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {new Date(session.created_at || session.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs & Content */}
            <div className="bg-white dark:bg-brand-dark-secondary rounded-2xl border border-gray-100 dark:border-brand-dark-tertiary shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                <div className="flex border-b border-gray-100 dark:border-brand-dark-tertiary">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`flex-1 md:flex-none md:w-48 py-4 text-sm font-medium text-center transition-all relative ${activeTab === 'details'
                            ? 'text-brand-green bg-brand-green/5'
                            : 'text-gray-500 dark:text-gray-400 hover:text-brand-green hover:bg-gray-50 dark:hover:bg-white/5'
                            }`}
                    >
                        Student Details
                        {activeTab === 'details' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-green" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('report')}
                        className={`flex-1 md:flex-none md:w-48 py-4 text-sm font-medium text-center transition-all relative ${activeTab === 'report'
                            ? 'text-brand-green bg-brand-green/5'
                            : 'text-gray-500 dark:text-gray-400 hover:text-brand-green hover:bg-gray-50 dark:hover:bg-white/5'
                            }`}
                    >
                        Report / Analysis
                        {activeTab === 'report' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-green" />
                        )}
                    </button>
                </div>

                <div className="p-6 md:p-8 flex-1 bg-gray-50/30 dark:bg-transparent">
                    {activeTab === 'details' && (
                        <div className="space-y-8 animate-fade-in-up">
                            {/* Contact Grid */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
                                    Contact Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                                        <div className="flex items-start gap-3">
                                            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs uppercase text-gray-400 font-semibold tracking-wider mb-1">Email Address</p>
                                                <p className="text-gray-900 dark:text-white font-medium break-all">
                                                    {contact.email || session.email || '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                                        <div className="flex items-start gap-3">
                                            <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs uppercase text-gray-400 font-semibold tracking-wider mb-1">Mobile Number</p>
                                                <p className="text-gray-900 dark:text-white font-medium">
                                                    {contact.mobile_number || session.mobileNumber || '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                                        <div className="flex items-start gap-3">
                                            <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs uppercase text-gray-400 font-semibold tracking-wider mb-1">Location</p>
                                                <p className="text-gray-900 dark:text-white font-medium">
                                                    {d.work_experience?.location || d.contact_information?.city || d.other_details?.source || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* JSON Viewer */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    Raw Data Payload
                                </h3>
                                <div className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-gray-800 shadow-inner">
                                    <div className="flex items-center px-4 py-2 bg-[#2d2d2d] border-b border-gray-700">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                                        </div>
                                        <span className="ml-4 text-xs text-gray-400 font-mono">student_details.json</span>
                                    </div>
                                    <div className="p-4 overflow-x-auto">
                                        <pre className="text-xs font-mono text-blue-300 leading-relaxed">
                                            {JSON.stringify(details, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'report' && (
                        <div className="animate-fade-in-up space-y-8">
                            {/* Assessment Responses Section - Original UI */}
                            {responsesLoading ? (
                                <div className="text-center py-20 text-gray-500">Loading responses...</div>
                            ) : responses.length > 0 ? (
                                <section>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
                                        Assessment Responses
                                    </h3>
                                    <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                                                    <tr>
                                                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Question</th>
                                                        <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Selected Answer</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                                    {responses.map((r, i) => (
                                                        <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                                <div className="font-medium text-gray-900 dark:text-white mb-1">
                                                                    {r.question}
                                                                </div>
                                                                {r.question_ta && (
                                                                    <div className="text-xs text-gray-400">{r.question_ta}</div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="inline-flex flex-col">
                                                                    <span className="font-medium text-brand-green text-base">
                                                                        {r.selected_option}
                                                                    </span>
                                                                    {r.selected_option_ta && (
                                                                        <span className="text-xs text-gray-400 mt-0.5">
                                                                            ({r.selected_option_ta})
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </section>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                                    <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-brand-green/5">
                                        <FileText className="w-10 h-10 text-brand-green" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No Responses Yet</h3>
                                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-lg leading-relaxed">
                                        The student has not started or completed the assessment yet.
                                    </p>
                                </div>
                            )}

                            {/* Report Preview/Generate Section - Only for COMPLETED sessions */}
                            {session.status === 'COMPLETED' && (
                                <section className="border-t border-gray-100 dark:border-white/10 pt-8">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                        Career Counselling Report
                                    </h3>

                                    {reportLoading ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <RefreshCw className="w-10 h-10 text-brand-green animate-spin mb-4" />
                                            <p className="text-gray-500">Loading report...</p>
                                        </div>
                                    ) : !report ? (
                                        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-800 text-center">
                                            <h4 className="text-blue-800 dark:text-blue-200 font-semibold mb-2">Generate AI-Powered Report</h4>
                                            <p className="text-sm text-blue-600 dark:text-blue-300 mb-4">
                                                Click below to generate a detailed career counselling report with course recommendations.
                                            </p>
                                            {reportError && (
                                                <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-4 text-sm">
                                                    {reportError}
                                                </div>
                                            )}
                                            <button
                                                onClick={handleGenerateReport}
                                                disabled={reportGenerating}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green text-white font-semibold rounded-xl hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                {reportGenerating ? (
                                                    <>
                                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                                        Generating Report...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FileText className="w-5 h-5" />
                                                        Generate Report
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        /* REPORT PREVIEW */
                                        <div className="space-y-6">
                                            {/* Report Header & Actions */}
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-brand-green/5 to-transparent p-5 rounded-xl border border-brand-green/20">
                                                <div>
                                                    <div className="flex items-center gap-2 text-brand-green mb-1">
                                                        <CheckCircle className="w-5 h-5" />
                                                        <span className="text-sm font-semibold">Report Generated</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        Generated on {new Date(report.generated_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={handleGenerateReport}
                                                        disabled={reportGenerating}
                                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-brand-dark-tertiary border border-gray-200 dark:border-brand-dark-tertiary rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                                                    >
                                                        <RefreshCw className={`w-4 h-4 ${reportGenerating ? 'animate-spin' : ''}`} />
                                                        Regenerate
                                                    </button>
                                                    <button
                                                        onClick={handleDownloadPDF}
                                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-green rounded-lg hover:bg-brand-green/90 transition-all"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Download PDF
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Behavioral Assessment */}
                                            <div className="bg-white dark:bg-white/5 p-5 rounded-xl border border-gray-100 dark:border-white/10">
                                                <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <Target className="w-4 h-4 text-brand-green" />
                                                    Behavioral Assessment Summary
                                                </h4>
                                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                                    {report.behavioral_assessment}
                                                </p>
                                            </div>

                                            {/* Strengths, Abilities, Growth Areas Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-800/30">
                                                    <h5 className="font-bold text-green-800 dark:text-green-400 mb-3 text-sm flex items-center gap-2">
                                                        <Award className="w-4 h-4" />
                                                        Key Strengths
                                                    </h5>
                                                    <ul className="space-y-1.5">
                                                        {report.key_strengths?.map((s, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-xs text-green-700 dark:text-green-300">
                                                                <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                                {s}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                                                    <h5 className="font-bold text-blue-800 dark:text-blue-400 mb-3 text-sm flex items-center gap-2">
                                                        <TrendingUp className="w-4 h-4" />
                                                        Natural Abilities
                                                    </h5>
                                                    <ul className="space-y-1.5">
                                                        {report.natural_abilities?.map((a, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300">
                                                                <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                                {a}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30">
                                                    <h5 className="font-bold text-orange-800 dark:text-orange-400 mb-3 text-sm flex items-center gap-2">
                                                        <Target className="w-4 h-4" />
                                                        Growth Areas
                                                    </h5>
                                                    <ul className="space-y-1.5">
                                                        {report.growth_areas?.map((g, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-xs text-orange-700 dark:text-orange-300">
                                                                <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                                {g}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Course Recommendations Summary */}
                                            <div className="bg-white dark:bg-white/5 p-5 rounded-xl border border-gray-100 dark:border-white/10">
                                                <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                    <BookOpen className="w-4 h-4 text-brand-green" />
                                                    Course Recommendations
                                                </h4>
                                                <div className="space-y-3">
                                                    {report.perfect_courses?.map((c, i) => (
                                                        <div key={i} className="flex items-center justify-between bg-green-50/50 dark:bg-green-900/10 p-3 rounded-lg">
                                                            <span className="font-medium text-gray-800 dark:text-white text-sm">{c.name}</span>
                                                            <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                                                                {c.fitment}% Match
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {report.good_courses?.map((c, i) => (
                                                        <div key={i} className="flex items-center justify-between bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg">
                                                            <span className="font-medium text-gray-800 dark:text-white text-sm">{c.name}</span>
                                                            <span className="text-xs font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                                                                {c.fitment}% Match
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Career Roadmap */}
                                            {report.career_roadmap?.length > 0 && (
                                                <div className="bg-white dark:bg-white/5 p-5 rounded-xl border border-gray-100 dark:border-white/10">
                                                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                        <Briefcase className="w-4 h-4 text-brand-green" />
                                                        Career Roadmap
                                                    </h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        {report.career_roadmap.map((stage, i) => (
                                                            <div key={i} className="bg-gradient-to-br from-brand-green/5 to-transparent p-3 rounded-lg border border-brand-green/20">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="w-6 h-6 rounded-full bg-brand-green text-white flex items-center justify-center text-xs font-bold">
                                                                        {i + 1}
                                                                    </span>
                                                                    <span className="font-semibold text-brand-green text-xs">{stage.stage}</span>
                                                                </div>
                                                                <ul className="space-y-1">
                                                                    {stage.bullets.map((b, j) => (
                                                                        <li key={j} className="text-xs text-gray-600 dark:text-gray-400">• {b}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Final Guidance */}
                                            {report.final_guidance && (
                                                <div className="bg-gradient-to-r from-brand-green/10 to-blue-500/10 p-5 rounded-xl border border-brand-green/20">
                                                    <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">Final Guidance</h4>
                                                    <p className="text-gray-700 dark:text-gray-300 text-sm italic leading-relaxed">
                                                        "{report.final_guidance}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* Pending message for non-completed sessions */}
                            {session.status !== 'COMPLETED' && (
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-800 text-center">
                                    <h4 className="text-blue-800 dark:text-blue-200 font-semibold mb-2">Report Generation Pending</h4>
                                    <p className="text-sm text-blue-600 dark:text-blue-300">
                                        The full graphical analysis report will be generated once the assessment is completed.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// PDF Generation Helper - Exact 5-Page A4 Layout Matching Sample PDF
// ============================================================================

function generatePrintableHTML(report: ReportData, studentName: string): string {
    const date = new Date(report.generated_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const refNo = `REF-${dateStr}`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Career Fitment & Course Recommendation Report - ${studentName}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        @page { 
            size: A4 portrait; 
            margin: 0; 
        }
        
        *, *::before, *::after { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        html { 
            font-size: 18pt;
            -webkit-text-size-adjust: 100%;
        }
        
        body { 
            width: 210mm;
            margin: 0 auto;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000000;
            background: #ffffff;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-align: justify;
        }
        
        /* ===== PAGE 1: COVER ===== */
        .cover-page {
            width: 210mm;
            height: 297mm;
            position: relative;
            background: url('/Handbook_Cover_Default.jpg') no-repeat center center;
            background-size: 210mm 297mm;
            page-break-after: always;
            overflow: hidden;
        }
        
        .cover-logo {
            position: absolute;
            top: 10mm;
            right: 12mm;
            width: 30mm;
            height: auto;
        }
        
        .cover-title {
            position: absolute;
            top: 12mm;
            left: 12mm;
            font-family: 'Sora', sans-serif;
            font-size: 28pt;
            font-weight: 700;
            color: #150089;
            line-height: 1.2;
            max-width: 125mm;
        }
        
        .cover-ref {
    position: absolute;

    top: 18mm;        /* distance from top */
    right: 6mm;      /* distance from right edge */

    transform: rotate(-90deg);
    transform-origin: top right;

    font-family: 'Inter', sans-serif;
    font-size: 8pt;
    font-weight: 500;

    color: rgba(0,0,0,0.35);
    letter-spacing: 1px;
    white-space: nowrap;
}

        
        .cover-bottom-left {
            position: absolute;
            bottom: 20mm;
            left: 12mm;
        }
        
        .cover-label {
            font-family: 'Sora', sans-serif;
            font-size: 16pt;
            font-weight: 600;
            color: #000000;
        }
        
        .cover-date {
            font-family: 'Inter', sans-serif;
            font-size: 14pt;
            font-weight: 400;
            color: #000000;
            margin-top: 2mm;
        }
        
        .cover-candidate {
            position: absolute;
            bottom: 20mm;
            right: 12mm;
            font-family: 'Sora', sans-serif;
            font-size: 22pt;
            font-weight: 700;
            color: #150089;
            text-align: right;
        }
        
        /* ===== CONTENT PAGES 2-5 ===== */
        .content-page {
            width: 210mm;
            height: 297mm;
            padding: 12mm 15mm 22mm 15mm;
            position: relative;
            background: url('/Watermark_Background.jpg') no-repeat center center;
            background-size: 210mm 297mm;
            page-break-after: always;
            overflow: hidden;
        }
        
        .content-page:last-child { 
            page-break-after: auto; 
        }
        
        /* Section Title - 15pt Sora bold brand blue NO underline */
        .section-title {
            font-family: 'Sora', sans-serif;
            font-size: 15pt;
            font-weight: 700;
            color: #150089;
            margin: 0 0 2mm 0;
            padding: 0;
            border: none;
        }
        
        /* Sub-section Title - 13pt Sora bold brand blue NO underline */
        .section-title-sm {
            font-family: 'Sora', sans-serif;
            font-size: 13pt;
            font-weight: 700;
            color: #150089;
            margin: 2mm 0 1mm 0;
            padding: 0;
            border: none;
        }
        
        /* Gray sub-section (Entry Level) */
        .section-title-gray {
            font-family: 'Sora', sans-serif;
            font-size: 15pt;
            font-weight: 700;
            color: #505050;
            margin: 3mm 0 1.5mm 0;
        }
        
        /* Blue sub-section (International) */
        .section-title-blue {
            font-family: 'Sora', sans-serif;
            font-size: 15pt;
            font-weight: 700;
            color: #003296;
            margin: 3mm 0 1.5mm 0;
        }
        
        /* Text - 11pt Inter */
        .text-block {
            font-family: 'Inter', sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000000;
            margin-bottom: 1.5mm;
            text-align: justify;
        }
        
        .text-sm {
            font-family: 'Inter', sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #000000;
            margin-bottom: 1.5mm;
            text-align: justify;
        }
        
        /* Bullet Lists */
        .bullet-list {
            list-style: disc outside;
            padding-left: 6mm;
            margin: 0.5mm 0 1.5mm 0;
        }
        
        .bullet-list li {
            font-family: 'Inter', sans-serif;
            font-size: 10pt;
            line-height: 1.35;
            padding: 0.3mm 0;
            color: #000000;
            text-align: justify;
        }
        
        /* ===== FITMENT LEVELS TABLE ===== */
        .fitment-table {
            width: 100%;
            max-width: 180mm;
            border-collapse: collapse;
            margin: 1.5mm 0 2mm 0;
            font-family: 'Inter', sans-serif;
            font-size: 9pt;
            table-layout: fixed;
        }
        
        .fitment-table th {
            background-color: #f5f5f5;
            padding: 1.5mm 2mm;
            text-align: center;
            border: 0.5pt solid #999999;
            font-weight: 600;
            color: #000000;
            font-size: 9pt;
        }
        
        .fitment-table th:nth-child(1) { width: 18%; text-align: center; }
        .fitment-table th:nth-child(2) { width: 27%; text-align: center; }
        .fitment-table th:nth-child(3) { width: 55%; text-align: left; }
        
        .fitment-table td {
            padding: 1.5mm 2mm;
            border: 0.5pt solid #999999;
            vertical-align: middle;
            font-size: 9pt;
            line-height: 1.2;
        }
        
        .fitment-table td:nth-child(1) { text-align: center; }
        .fitment-table td:nth-child(2) { text-align: center; font-weight: 600; }
        .fitment-table td:nth-child(3) { text-align: left; padding-left: 2mm; }
        
        .fitment-perfect { background-color: #e8f8e8; }
        .fitment-perfect td { color: #006400; }
        
        .fitment-good { background-color: #e8f2ff; }
        .fitment-good td { color: #003a8c; }
        
        .fitment-below { background-color: #f7f7f7; }
        .fitment-below td { color: #595959; }
        
        /* ===== COURSE OVERVIEW TABLE ===== */
        .course-table {
            width: 100%;
            max-width: 180mm;
            border-collapse: collapse;
            margin: 1.5mm 0 2mm 0;
            font-family: 'Inter', sans-serif;
            font-size: 9pt;
            table-layout: fixed;
        }
        
        .course-table th {
            background-color: #150089;
            color: #ffffff;
            padding: 1.5mm 2.5mm;
            border: 0.5pt solid #150089;
            font-weight: 600;
            font-size: 9pt;
        }
        
        .course-table th:nth-child(1) { text-align: left; width: 70%; }
        .course-table th:nth-child(2) { text-align: center; width: 30%; }
        
        .course-table td {
            padding: 1.5mm 2.5mm;
            border: 0.5pt solid #dddddd;
            color: #000000;
            font-size: 9pt;
        }
        
        .course-table td:nth-child(1) { text-align: left; }
        .course-table td:nth-child(2) { text-align: center; color: #009600; font-weight: 600; }
        
        /* Brand colored text */
        .text-brand {
            font-family: 'Inter', sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #150089;
            margin-bottom: 1.5mm;
            text-align: justify;
        }
        
        /* ===== PRIORITY LABELS ===== */
        .priority-label {
            font-family: 'Sora', sans-serif;
            font-size: 15pt;
            font-weight: 700;
            margin: 3.5mm 0 2.5mm 0;
        }
        
        /* Priority 1 = Green (Perfect Match) */
        .priority-1 { 
            color: #008000;
        }
        
        /* Priority 2 = Blue (Good Match) */
        .priority-2 { 
            color: #0050b4;
        }
        
        /* ===== COURSE CARDS ===== */
        .course-card {
            width: 100%;
            max-width: 180mm;
            margin-bottom: 3.5mm;
            background: #ffffff;
            border: 1pt solid #e0e0e0;
        }
        
        /* Card Header */
        .course-card-header {
            display: table;
            width: 100%;
            height: 12mm;
            padding: 0;
        }
        
        .course-card-header-inner {
            display: table-cell;
            vertical-align: middle;
            padding: 2mm 4mm;
        }
        
        .course-card-header-left {
            text-align: left;
        }
        
        .course-card-header-right {
            text-align: right;
            width: 25%;
        }
        
        /* Perfect Match Card - Green */
        .course-card.perfect .course-card-header {
            background-color: #f0fff0;
            border-left: 2.5mm solid #008000;
        }
        
        .course-card.perfect .course-card-title {
            font-family: 'Sora', sans-serif;
            font-size: 16pt;
            font-weight: 700;
            color: #008000;
        }
        
        .course-card.perfect .course-card-badge {
            display: inline-block;
            padding: 1.5mm 4mm;
            border-radius: 2mm;
            background-color: #008000;
            color: #ffffff;
            font-family: 'Inter', sans-serif;
            font-size: 10pt;
            font-weight: 700;
        }
        
        /* Good Match Card - Blue */
        .course-card.good .course-card-header {
            background-color: #f5faff;
            border-left: 2.5mm solid #0050b4;
        }
        
        .course-card.good .course-card-title {
            font-family: 'Sora', sans-serif;
            font-size: 16pt;
            font-weight: 700;
            color: #0050b4;
        }
        
        .course-card.good .course-card-badge {
            display: inline-block;
            padding: 1.5mm 4mm;
            border-radius: 2mm;
            background-color: #0050b4;
            color: #ffffff;
            font-family: 'Inter', sans-serif;
            font-size: 10pt;
            font-weight: 700;
        }
        
        /* Card Body */
        .course-card-body {
            padding: 2.5mm 4mm 2.5mm 6mm;
            font-family: 'Inter', sans-serif;
            font-size: 11pt;
            line-height: 1.45;
            color: #000000;
            text-align: justify;
        }
        
        .course-card-body strong {
            font-weight: 600;
        }
        
        .course-card-body ul {
            list-style: disc outside;
            padding-left: 5mm;
            margin: 1mm 0;
        }
        
        .course-card-body li {
            padding: 0.3mm 0;
            line-height: 1.5;
        }
        
        .career-path {
            margin-top: 1mm;
        }
        
        /* ===== ENTRY LEVEL TABLE ===== */
        .entry-table {
            width: 100%;
            max-width: 180mm;
            border-collapse: collapse;
            margin: 2.5mm 0 3mm 0;
            font-family: 'Inter', sans-serif;
            font-size: 11pt;
            table-layout: fixed;
        }
        
        .entry-table th {
            background-color: #f0f0f0;
            padding: 2.5mm 4mm;
            border: 1pt solid #999999;
            font-weight: 600;
            color: #000000;
            font-size: 11pt;
        }
        
        .entry-table th:nth-child(1) { text-align: left; width: 75%; }
        .entry-table th:nth-child(2) { text-align: center; width: 25%; }
        
        .entry-table td {
            padding: 2mm 3mm;
            border: 0.5pt solid #cccccc;
            color: #000000;
        }
        
        .entry-table td:nth-child(1) { text-align: left; }
        .entry-table td:nth-child(2) { text-align: center; }
        
        /* ===== CAREER ROADMAP ===== */
        .roadmap-container {
            margin: 2.5mm 0;
        }
        
        .roadmap-step {
            display: table;
            width: 100%;
            margin-bottom: 3.5mm;
        }
        
        .roadmap-left {
            display: table-cell;
            width: 35mm;
            min-height: 16mm;
            background-color: #ebf2ff;
            border-radius: 2mm;
            padding: 2mm;
            text-align: center;
            vertical-align: middle;
            position: relative;
        }
        
        .roadmap-step-num {
            font-family: 'Sora', sans-serif;
            font-size: 9pt;
            color: #150089;
            font-weight: 400;
        }
        
        .roadmap-year {
            font-family: 'Sora', sans-serif;
            font-size: 12pt;
            font-weight: 700;
            color: #150089;
            margin-top: 0.5mm;
        }
        
        .roadmap-right {
            display: table-cell;
            vertical-align: top;
            padding: 2mm 0 2mm 8mm;
            font-family: 'Inter', sans-serif;
            font-size: 11pt;
            color: #3c3c3c;
            text-align: justify;
        }
        
        .roadmap-right ul {
            list-style: disc outside;
            padding-left: 5mm;
            margin: 0;
        }
        
        .roadmap-right li {
            padding: 0.3mm 0;
            line-height: 1.5;
        }
        
        /* ===== FINAL GUIDANCE BOX ===== */
        .final-box {
            width: 100%;
            max-width: 180mm;
            background-color: #f0f8ff;
            padding: 3.5mm;
            margin-top: 3.5mm;
            border-radius: 1mm;
        }
        
        .final-box .section-title-sm {
            margin-top: 0;
            margin-bottom: 1.5mm;
            color: #150089;
        }
        
        .final-text {
            font-family: 'Inter', sans-serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000000;
            text-align: justify;
        }
        
        /* ===== PAGE FOOTER ===== */
        .page-footer {
            position: absolute;
            bottom: 10mm;
            left: 15mm;
            right: 15mm;
            padding-top: 2mm;
            border-top: 0.5pt solid #b4b4b4;
            display: table;
            width: calc(100% - 30mm);
            font-family: 'Inter', sans-serif;
            font-size: 8pt;
        }
        
        .footer-left {
            display: table-cell;
            text-align: left;
            vertical-align: middle;
        }
        
        .footer-title {
            color: #000000;
            font-weight: 400;
        }
        
        .footer-ref {
            color: #808080;
            margin-left: 2mm;
        }
        
        .footer-right {
            display: table-cell;
            text-align: right;
            vertical-align: middle;
        }
        
        .footer-page {
            color: #000000;
        }
        
        /* Spacing */
        .mt-2 { margin-top: 2mm; }
        .mt-3 { margin-top: 3mm; }
        .mt-4 { margin-top: 4mm; }
        .mt-5 { margin-top: 5mm; }
        
        /* Print */
        @media print {
            html, body {
                width: 210mm;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            
            .cover-page, .content-page {
                width: 210mm !important;
                height: 297mm !important;
                page-break-inside: avoid;
            }
            
            .section-title { 
                page-break-after: avoid;
                page-break-inside: avoid;
            }
            .course-card { 
                page-break-inside: avoid;
                page-break-before: auto;
            }
            .roadmap-step { 
                page-break-inside: avoid;
            }
            .bullet-list {
                page-break-inside: avoid;
            }
            .fitment-table, .course-table, .entry-table {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <!-- PAGE 1: COVER -->
    <div class="cover-page">
        <img src="/NTSC.jpeg" alt="Logo" class="cover-logo" />
        <div class="cover-title">Career Fitment & Course<br>Recommendation Report</div>
        <div class="cover-ref">${refNo}</div>
        <div class="cover-bottom-left">
            <div class="cover-label">Course Suggestion Report</div>
            <div class="cover-date">${date}</div>
        </div>
        <div class="cover-candidate">${studentName}</div>
    </div>
    
    <!-- PAGE 2: BEHAVIORAL + METHODOLOGY + FITMENT -->
    <div class="content-page">
        <div class="section-title">Behavioral Assessment Summary</div>
        <div class="text-block">${report.behavioral_assessment}</div>
        
        <div class="section-title-sm">Key Strengths</div>
        <ul class="bullet-list">
            ${report.key_strengths?.map(s => `<li>${s}</li>`).join('') || ''}
        </ul>
        
        <div class="section-title-sm">Natural Abilities</div>
        <ul class="bullet-list">
            ${report.natural_abilities?.map(a => `<li>${a}</li>`).join('') || ''}
        </ul>
        
        <div class="section-title-sm">Potential Growth Areas</div>
        <ul class="bullet-list">
            ${report.growth_areas?.map(g => `<li>${g}</li>`).join('') || ''}
        </ul>
        
        <div class="section-title mt-3">Course Fitment Methodology</div>
        <div class="text-block">Courses are shortlisted using:</div>
        <ul class="bullet-list">
            ${report.course_fitment?.methodology?.map(m => `<li>${m}</li>`).join('') || `
            <li>Work stability</li>
            <li>Safety and compliance orientation</li>
            <li>Structured career growth</li>
            <li>Long-term employability</li>
            `}
        </ul>
        
        <div class="section-title-sm mt-2">Fitment Levels</div>
        <table class="fitment-table">
            <thead>
                <tr>
                    <th>Range</th>
                    <th>Category</th>
                    <th>Recommendation</th>
                </tr>
            </thead>
            <tbody>
                <tr class="fitment-perfect">
                    <td>85% – 95%</td>
                    <td>Perfect Match</td>
                    <td>Highly Recommended</td>
                </tr>
                <tr class="fitment-good">
                    <td>70% – 84%</td>
                    <td>Good Match</td>
                    <td>Recommended with support</td>
                </tr>
                <tr class="fitment-below">
                    <td>&lt; 70%</td>
                    <td>Below Threshold</td>
                    <td>Not Recommended</td>
                </tr>
            </tbody>
        </table>
        
        <div class="page-footer">
            <div class="footer-left">
                <span class="footer-title">Origin BI</span>
                <span class="footer-ref">#${refNo}</span>
            </div>
            <div class="footer-right">
                <span class="footer-page">Page 2 of 5</span>
            </div>
        </div>
    </div>
    
    <!-- PAGE 3: COURSE OVERVIEW + DETAILED (PERFECT) -->
    <div class="content-page">
        <div class="section-title">Course Suggestions Overview</div>
        <table class="course-table">
            <thead>
                <tr>
                    <th>Course Name</th>
                    <th>Fitment</th>
                </tr>
            </thead>
            <tbody>
                ${[...(report.perfect_courses || []), ...(report.good_courses || [])].map(c => `
                <tr>
                    <td>${c.name}</td>
                    <td>${c.fitment}%</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="section-title mt-3">Detailed Course Recommendations</div>
        <div class="text-brand">The following courses have been selected based on your behavioral strengths and career fitment score. They represent your best opportunities for long-term growth.</div>
        
        <div class="priority-label priority-1">Priority 1: Top Recommendations</div>
        ${(report.perfect_courses || []).map(c => `
        <div class="course-card perfect">
            <div class="course-card-header">
                <div class="course-card-header-inner course-card-header-left">
                    <span class="course-card-title">${c.name}</span>
                </div>
                <div class="course-card-header-inner course-card-header-right">
                    <span class="course-card-badge">${c.fitment}% Match</span>
                </div>
            </div>
            <div class="course-card-body">
                ${c.why_recommended?.length ? `<strong>Why recommended:</strong><ul>${c.why_recommended.map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
                ${c.career_progression ? `<div class="career-path"><strong>Career Progression:</strong> ${c.career_progression}</div>` : ''}
            </div>
        </div>
        `).join('')}
        
        <div class="priority-label priority-2">Priority 2: Strong Alternatives</div>
        
        <div class="page-footer">
            <div class="footer-left">
                <span class="footer-title">Origin BI</span>
                <span class="footer-ref">#${refNo}</span>
            </div>
            <div class="footer-right">
                <span class="footer-page">Page 3 of 5</span>
            </div>
        </div>
    </div>
    
    <!-- PAGE 4: GOOD COURSES + ADDITIONAL PATHWAYS -->
    <div class="content-page">
        ${(report.good_courses || []).map(c => `
        <div class="course-card good">
            <div class="course-card-header">
                <div class="course-card-header-inner course-card-header-left">
                    <span class="course-card-title">${c.name}</span>
                </div>
                <div class="course-card-header-inner course-card-header-right">
                    <span class="course-card-badge">${c.fitment}% Match</span>
                </div>
            </div>
            <div class="course-card-body">
                ${c.why_recommended?.length ? `<strong>Why recommended:</strong><ul>${c.why_recommended.map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
            </div>
        </div>
        `).join('')}
        
        <div class="section-title mt-4">Additional Pathways</div>
        <div class="text-sm">Courses listed below offer alternative entry points or specialized global opportunities.</div>
        
        <div class="section-title-gray">Option A: Foundational Entry-Level Roles</div>
        <div class="text-sm">Ideal for gaining immediate work experience before upskilling.</div>
        <table class="entry-table">
            <thead>
                <tr>
                    <th>Course Name</th>
                    <th>Fitment</th>
                </tr>
            </thead>
            <tbody>
                ${(report.entry_level_courses || []).map(c => `
                <tr>
                    <td>${c.name}</td>
                    <td>${c.fitment}%</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="section-title-blue mt-4">Option B: International Opportunities</div>
        <div class="text-sm">Specialized certifications with high demand in overseas markets.</div>
        ${(report.international_courses || []).map(c => `
        <div class="course-card good">
            <div class="course-card-header">
                <div class="course-card-header-inner course-card-header-left">
                    <span class="course-card-title">${c.name}</span>
                </div>
                <div class="course-card-header-inner course-card-header-right">
                    <span class="course-card-badge">${c.fitment}% Match</span>
                </div>
            </div>
            <div class="course-card-body">
                ${c.why_recommended?.length ? `<strong>Why recommended:</strong><ul>${c.why_recommended.map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
            </div>
        </div>
        `).join('')}
        
        <div class="page-footer">
            <div class="footer-left">
                <span class="footer-title">Origin BI</span>
                <span class="footer-ref">#${refNo}</span>
            </div>
            <div class="footer-right">
                <span class="footer-page">Page 4 of 5</span>
            </div>
        </div>
    </div>
    
    <!-- PAGE 5: CAREER GUIDANCE + ROADMAP + FINAL -->
    <div class="content-page">
        <div class="section-title">Career Direction Guidance</div>
        <div class="text-block">${report.career_guidance?.intro || 'The candidate will perform best in careers that:'}</div>
        <ul class="bullet-list">
            ${report.career_guidance?.bullets?.map(b => `<li>${b}</li>`).join('') || `
            <li>Offer structured growth</li>
            <li>Value safety and responsibility</li>
            <li>Reward consistency and accuracy</li>
            `}
        </ul>
        <div class="text-block mt-2">${report.career_guidance?.conclusion || 'Such roles naturally lead to supervisory and management positions over time.'}</div>
        
        <div class="section-title mt-4">Suggested Career Roadmap</div>
        <div class="roadmap-container">
            ${(report.career_roadmap || []).map((stage, i) => `
            <div class="roadmap-step">
                <div class="roadmap-left">
                    <div class="roadmap-step-num">STEP 0${i + 1}</div>
                    <div class="roadmap-year">${stage.stage}</div>
                </div>
                <div class="roadmap-right">
                    <ul>${stage.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
                </div>
            </div>
            `).join('')}
        </div>
        
        <div class="final-box">
            <div class="section-title-sm">Final Guidance</div>
            <div class="final-text">${report.final_guidance || 'Your strength lies in doing work correctly, safely, and consistently. Choosing structured technical and safety-focused careers will ensure steady income, professional respect, and long-term growth.'}</div>
        </div>
        
        <div class="page-footer">
            <div class="footer-left">
                <span class="footer-title">Origin BI</span>
                <span class="footer-ref">#${refNo}</span>
            </div>
            <div class="footer-right">
                <span class="footer-page">Page 5 of 5</span>
            </div>
        </div>
    </div>
</body>
</html>
    `;
}
