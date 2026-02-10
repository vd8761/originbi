
"use client";
import React, { useEffect, useState, use } from "react";
import { corporateDashboardService } from '../../../../../lib/services';
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from '../../../../../components/icons';
import { User, FileText, Mail, Phone, Globe, Calendar, Download, RefreshCw, CheckCircle, AlertCircle, BookOpen, Target, TrendingUp, Award, Briefcase, ChevronRight, MapPin, Building2, GraduationCap, Sparkles, Clock, ArrowRight, Layers, Star } from "lucide-react";

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
    qualification_note?: string;
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
    const handleGenerateReport = async (forceRegenerate: boolean = false) => {
        setReportGenerating(true);
        setReportError("");
        try {
            const user = localStorage.getItem("user");
            if (!user) throw new Error("Not logged in");
            const { email } = JSON.parse(user);
            const reportData = await corporateDashboardService.generateCounsellingReport(email, session.id, forceRegenerate);
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

        // Use full name from student details, fallback to report.student_name
        const candidateName = fullName !== 'N/A' ? fullName : (report.student_name || 'Candidate');
        const counsellingTypeId = session.counselling_type_id || session.counsellingTypeId || '';
        const html = generatePrintableHTML(report, candidateName, counsellingTypeId);

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
            // Delay print to allow fonts and images to fully load
            setTimeout(() => {
                printWindow.print();
            }, 150);
        };
    };

    // 6. Get Course Roadmap - Returns career progression for each course
    const getCourseRoadmap = (courseName: string): { stage: string; bullets: string[] }[] => {
        const roadmaps: Record<string, { stage: string; bullets: string[] }[]> = {
            'Refrigeration & Air conditioner training (A/C)': [
                { stage: '0-6 Months', bullets: ['Start as Assistant Technician', 'Complete technical training', 'Learn fundamentals'] },
                { stage: '1-2 Years', bullets: ['Progress to Technician', 'Gain hands-on experience'] },
                { stage: '3-5 Years', bullets: ['Advance to Senior Technician', 'Take on more responsibilities'] },
                { stage: '5-8 Years', bullets: ['Move to Supervisor', 'Lead teams'] },
                { stage: 'Entrepreneur', bullets: ['Own Service Unit or Start Own Company', 'Utilize technical expertise to manage and grow the business'] }
            ],
            'Basic Electrical & HVAC Training': [
                { stage: '0-6 Months', bullets: ['Start as Assistant Technician', 'Complete technical training', 'Learn fundamentals'] },
                { stage: '1-2 Years', bullets: ['Progress to Technician', 'Gain hands-on experience'] },
                { stage: '3-5 Years', bullets: ['Advance to Senior Technician', 'Take on more responsibilities'] },
                { stage: '5-8 Years', bullets: ['Move to Supervisor', 'Lead teams'] },
                { stage: 'Entrepreneur', bullets: ['Own Service Unit or Start Own Company', 'Utilize technical expertise to manage and grow the business'] }
            ],
            'Diploma In HVAC': [
                { stage: '0-6 Months', bullets: ['Start as Technician', 'Apply theoretical knowledge'] },
                { stage: '1-2 Years', bullets: ['Advance to Senior Technician', 'Handle complex systems'] },
                { stage: '3-5 Years', bullets: ['Move to Supervisor role', 'Train junior technicians'] },
                { stage: '5-8 Years', bullets: ['Become Manager', 'Oversee multiple projects'] },
                { stage: 'Entrepreneur', bullets: ['Own HVAC Company', 'Build client base and expand operations'] }
            ],
            'CERTIFIED HVAC ENGINEER (CHE)': [
                { stage: '0-6 Months', bullets: ['Start as Asst. Project Engineer', 'Learn project execution'] },
                { stage: '1-2 Years', bullets: ['Advance to Project Engineer', 'Lead small projects'] },
                { stage: '3-5 Years', bullets: ['Become Project In Charge', 'Handle multiple projects'] },
                { stage: '5-8 Years', bullets: ['Move to Project Manager', 'Strategic planning and client management'] },
                { stage: 'Entrepreneur', bullets: ['Own HVAC Engineering Company', 'Manage large-scale commercial projects'] }
            ],
            'NDT & Quality Management Training': [
                { stage: '0-6 Months', bullets: ['Start as Quality Inspector', 'Learn inspection procedures'] },
                { stage: '1-2 Years', bullets: ['Advance to Quality In Charge', 'Lead quality audits'] },
                { stage: '3-5 Years', bullets: ['Become Asst. Manager Quality', 'Implement quality systems'] },
                { stage: '5-8 Years', bullets: ['Move to QA Manager', 'Drive quality strategy'] },
                { stage: 'Entrepreneur', bullets: ['Become General Manager (GM)', 'Lead entire quality division'] }
            ],
            'Advance Diploma In Fire & Industrial Safety': [
                { stage: '0-6 Months', bullets: ['Start as Fire Safety Technician', 'Learn safety protocols'] },
                { stage: '1-2 Years', bullets: ['Advance to Safety Officer/Supervisor', 'Conduct safety audits'] },
                { stage: '3-5 Years', bullets: ['Become Safety Engineer', 'Design safety systems'] },
                { stage: '5-8 Years', bullets: ['Move to Safety Manager', 'Lead safety teams'] },
                { stage: 'Entrepreneur', bullets: ['Become EHS Manager', 'Head Environment, Health & Safety division'] }
            ],
            'CERTIFIED HEALTH, SAFETY & ENVIRONMENTAL OFFICER (CHSEO)': [
                { stage: '0-6 Months', bullets: ['Start as Safety Supervisor', 'Implement safety measures'] },
                { stage: '1-2 Years', bullets: ['Advance to Safety Officer', 'Lead site safety'] },
                { stage: '3-5 Years', bullets: ['Become Safety Engineer', 'Design comprehensive safety programs'] },
                { stage: '5-8 Years', bullets: ['Move to Safety Manager', 'Manage safety across organization'] },
                { stage: 'Entrepreneur', bullets: ['Become EHS Manager', 'Strategic EHS leadership role'] }
            ],
            'WELDING- ARC/TIG/MIG': [
                { stage: '0-6 Months', bullets: ['Start as Assistant Welder', 'Learn basic welding techniques'] },
                { stage: '1-2 Years', bullets: ['Advance to Skilled Welder', 'Master different welding types'] },
                { stage: '3-5 Years', bullets: ['Become Certified Welder', 'Handle specialized projects'] },
                { stage: '5-8 Years', bullets: ['Move to Welding Supervisor', 'Lead welding teams'] },
                { stage: 'Entrepreneur', bullets: ['Own Welding Unit', 'Provide welding services independently'] }
            ],
            'Welding Supervisor Training': [
                { stage: '0-6 Months', bullets: ['Start as Welding Foreman', 'Supervise daily operations'] },
                { stage: '1-2 Years', bullets: ['Advance to Welding Supervisor', 'Manage welding teams'] },
                { stage: '3-5 Years', bullets: ['Become Welding In Charge', 'Oversee multiple projects'] },
                { stage: '5-8 Years', bullets: ['Move to Manager', 'Strategic operations management'] },
                { stage: 'Entrepreneur', bullets: ['Own Welding Company', 'Expand to fabrication services'] }
            ],
            'MECHANICAL ELECTRICAL PLUMBING ENGINEER (MEP)': [
                { stage: '0-6 Months', bullets: ['Start as Asst. Project Engineer', 'Learn MEP systems'] },
                { stage: '1-2 Years', bullets: ['Advance to Project Engineer', 'Execute MEP projects'] },
                { stage: '3-5 Years', bullets: ['Become Project In Charge', 'Lead project teams'] },
                { stage: '5-8 Years', bullets: ['Move to Project Manager', 'Handle client relationships'] },
                { stage: 'Entrepreneur', bullets: ['Own MEP Consultancy', 'Provide engineering services'] }
            ],
            'CERTIFIED OIL & GAS PIPING ENGINEER (CPE)': [
                { stage: '0-6 Months', bullets: ['Start as Asst. Site Engineer', 'Learn piping systems'] },
                { stage: '1-2 Years', bullets: ['Advance to Project Engineer', 'Execute piping projects'] },
                { stage: '3-5 Years', bullets: ['Become Project In Charge', 'Manage project delivery'] },
                { stage: '5-8 Years', bullets: ['Move to Project Manager', 'Lead major projects'] },
                { stage: 'Entrepreneur', bullets: ['Own Engineering Company', 'Serve oil & gas industry'] }
            ],
            'Electrician': [
                { stage: '0-6 Months', bullets: ['Start as Assistant Technician', 'Learn electrical basics'] },
                { stage: '1-2 Years', bullets: ['Advance to Technician', 'Handle installations'] },
                { stage: '3-5 Years', bullets: ['Become Senior Technician', 'Complex troubleshooting'] },
                { stage: '5-8 Years', bullets: ['Move to Supervisor', 'Lead electrical teams'] },
                { stage: 'Entrepreneur', bullets: ['Own Electrical Service Unit', 'Provide independent services'] }
            ],
            'Plumber': [
                { stage: '0-6 Months', bullets: ['Start as Assistant Technician', 'Learn plumbing fundamentals'] },
                { stage: '1-2 Years', bullets: ['Advance to Technician', 'Handle installations'] },
                { stage: '3-5 Years', bullets: ['Become Senior Technician', 'Complex systems'] },
                { stage: '5-8 Years', bullets: ['Move to Supervisor', 'Lead plumbing teams'] },
                { stage: 'Entrepreneur', bullets: ['Own Plumbing Service Business', 'Commercial & residential services'] }
            ],
            'Industrial electrician': [
                { stage: '0-6 Months', bullets: ['Start as Assistant Technician', 'Industrial equipment basics'] },
                { stage: '1-2 Years', bullets: ['Advance to Technician', 'Maintain industrial systems'] },
                { stage: '3-5 Years', bullets: ['Become Senior Technician', 'Handle automation'] },
                { stage: '5-8 Years', bullets: ['Move to Supervisor', 'Manage industrial electrical systems'] },
                { stage: 'Entrepreneur', bullets: ['Own Industrial Electrical Service Unit', 'Serve manufacturing sector'] }
            ],
            'HOME APPLIANCE TRAINING': [
                { stage: '0-6 Months', bullets: ['Start as Assistant Technician', 'Learn appliance repair'] },
                { stage: '1-2 Years', bullets: ['Advance to Technician', 'Handle varied appliances'] },
                { stage: '3-5 Years', bullets: ['Become Senior Technician', 'Complex repairs'] },
                { stage: '5-8 Years', bullets: ['Move to Supervisor', 'Manage service center'] },
                { stage: 'Entrepreneur', bullets: ['Own Appliance Service Center', 'Brand authorized services'] }
            ],
            'Fitter': [
                { stage: '0-6 Months', bullets: ['Start as Assistant Fitter', 'Learn fitting basics'] },
                { stage: '1-2 Years', bullets: ['Advance to Skilled Fitter', 'Precision fitting work'] },
                { stage: '3-5 Years', bullets: ['Become Certified Fitter', 'Handle complex assemblies'] },
                { stage: '5-8 Years', bullets: ['Move to Fitter Supervisor', 'Lead fitting teams'] },
                { stage: 'Entrepreneur', bullets: ['Own Fitting/Fabrication Unit', 'Provide industrial services'] }
            ],
            'Automobile Quality Inspector Training': [
                { stage: '0-6 Months', bullets: ['Start as Quality Inspector', 'Learn inspection processes'] },
                { stage: '1-2 Years', bullets: ['Advance to Quality In Charge', 'Lead quality checks'] },
                { stage: '3-5 Years', bullets: ['Become Asst. Manager Quality', 'Implement quality systems'] },
                { stage: '5-8 Years', bullets: ['Move to QA Manager', 'Drive quality strategy'] },
                { stage: 'Entrepreneur', bullets: ['Become General Manager (GM)', 'Lead quality operations'] }
            ],
            'Washing Machine Training': [
                { stage: '0-6 Months', bullets: ['Start as Assistant Technician', 'Learn appliance repair'] },
                { stage: '1-2 Years', bullets: ['Advance to Technician', 'Independent repairs'] },
                { stage: '3-5 Years', bullets: ['Become Senior Technician', 'Train others'] },
                { stage: '5-8 Years', bullets: ['Move to Supervisor', 'Manage service team'] },
                { stage: 'Entrepreneur', bullets: ['Own Appliance Service Center', 'Multi-brand service center'] }
            ]
        };

        // Find matching roadmap (case insensitive partial match)
        const normalizedName = courseName.toLowerCase().trim();
        for (const [key, value] of Object.entries(roadmaps)) {
            if (key.toLowerCase().trim() === normalizedName ||
                normalizedName.includes(key.toLowerCase()) ||
                key.toLowerCase().includes(normalizedName)) {
                return value;
            }
        }

        // Default roadmap if course not found
        return [
            { stage: '0-6 Months', bullets: ['Start at Entry Level position', 'Complete initial training', 'Learn fundamentals'] },
            { stage: '1-2 Years', bullets: ['Progress to Skilled Professional', 'Gain hands-on experience'] },
            { stage: '3-5 Years', bullets: ['Advance to Senior Professional', 'Take on leadership responsibilities'] },
            { stage: '5-8 Years', bullets: ['Move to Supervisor/Manager role', 'Lead teams and projects'] },
            { stage: 'Entrepreneur', bullets: ['Own Business', 'Utilize expertise to manage and grow operations'] }
        ];
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
                                                onClick={() => handleGenerateReport(false)}
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
                                        /* REPORT PREVIEW - Professional Full Layout */
                                        <div className="space-y-6">
                                            {/* Report Header Banner */}
                                            <div className="bg-gradient-to-r from-[#150089] to-[#3a1cad] p-6 rounded-2xl text-white relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                                                <div className="relative z-10">
                                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                        <div>
                                                            <h3 className="text-xl font-bold mb-1">Career Fitment & Course Recommendation Report</h3>
                                                            <p className="text-white/70 text-sm">
                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <User className="w-3.5 h-3.5" />
                                                                    {report.student_name}
                                                                </span>
                                                                <span className="mx-3 text-white/30">|</span>
                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    {new Date(report.generated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                                </span>
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => handleGenerateReport(true)}
                                                                disabled={reportGenerating}
                                                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all"
                                                            >
                                                                <RefreshCw className={`w-4 h-4 ${reportGenerating ? 'animate-spin' : ''}`} />
                                                                Regenerate
                                                            </button>
                                                            <button
                                                                onClick={handleDownloadPDF}
                                                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white text-[#150089] rounded-lg hover:bg-white/90 transition-all"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                                Download PDF
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Associate Info Card (if available) */}
                                            {d.associate_details && (
                                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 p-5 rounded-xl border border-purple-200 dark:border-purple-800/30">
                                                    <h4 className="font-bold text-purple-900 dark:text-purple-300 mb-4 flex items-center gap-2 text-sm">
                                                        <Building2 className="w-4 h-4" />
                                                        Associate Information
                                                    </h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Associate ID</p>
                                                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{d.associate_details.associate_id || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Full Name</p>
                                                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{d.associate_details.full_name || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">City</p>
                                                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{d.associate_details.city || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">District</p>
                                                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{d.associate_details.district || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">State</p>
                                                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{d.associate_details.state || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Behavioral Assessment */}
                                            <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                                <h4 className="font-bold text-[#150089] dark:text-white mb-4 flex items-center gap-2 text-base">
                                                    <Target className="w-5 h-5 text-brand-green" />
                                                    Behavioral Assessment Summary
                                                </h4>
                                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                                    {report.behavioral_assessment}
                                                </p>
                                            </div>

                                            {/* Strengths, Abilities, Growth Areas Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-green-50 dark:bg-green-900/10 p-5 rounded-xl border border-green-200 dark:border-green-800/30">
                                                    <h5 className="font-bold text-green-800 dark:text-green-400 mb-4 text-sm flex items-center gap-2">
                                                        <Award className="w-4 h-4" />
                                                        Key Strengths
                                                    </h5>
                                                    <ul className="space-y-2">
                                                        {report.key_strengths?.map((s, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                                                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                                {s}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-200 dark:border-blue-800/30">
                                                    <h5 className="font-bold text-blue-800 dark:text-blue-400 mb-4 text-sm flex items-center gap-2">
                                                        <TrendingUp className="w-4 h-4" />
                                                        Natural Abilities
                                                    </h5>
                                                    <ul className="space-y-2">
                                                        {report.natural_abilities?.map((a, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
                                                                <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                                {a}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="bg-orange-50 dark:bg-orange-900/10 p-5 rounded-xl border border-orange-200 dark:border-orange-800/30">
                                                    <h5 className="font-bold text-orange-800 dark:text-orange-400 mb-4 text-sm flex items-center gap-2">
                                                        <Target className="w-4 h-4" />
                                                        Growth Areas
                                                    </h5>
                                                    <ul className="space-y-2">
                                                        {report.growth_areas?.map((g, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm text-orange-700 dark:text-orange-300">
                                                                <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                                {g}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Course Fitment Methodology */}
                                            <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                                <h4 className="font-bold text-[#150089] dark:text-white mb-4 flex items-center gap-2 text-base">
                                                    <Layers className="w-5 h-5 text-brand-green" />
                                                    Course Fitment Methodology
                                                </h4>
                                                <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">Courses are shortlisted using:</p>
                                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-5">
                                                    {(report.course_fitment?.methodology || ['Work stability', 'Safety and compliance orientation', 'Structured career growth', 'Long-term employability']).map((m, i) => (
                                                        <li key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                            <CheckCircle className="w-4 h-4 text-brand-green flex-shrink-0" />
                                                            {m}
                                                        </li>
                                                    ))}
                                                </ul>

                                                {/* Fitment Levels Table */}
                                                <h5 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Fitment Levels</h5>
                                                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="bg-gray-100 dark:bg-white/5">
                                                                <th className="px-4 py-2.5 text-left font-semibold text-gray-900 dark:text-white">Range</th>
                                                                <th className="px-4 py-2.5 text-center font-semibold text-gray-900 dark:text-white">Category</th>
                                                                <th className="px-4 py-2.5 text-left font-semibold text-gray-900 dark:text-white">Recommendation</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr className="bg-green-50 dark:bg-green-900/10 border-t border-gray-200 dark:border-white/10">
                                                                <td className="px-4 py-2.5 text-green-700 dark:text-green-400">85% – 95%</td>
                                                                <td className="px-4 py-2.5 text-center font-semibold text-green-700 dark:text-green-400">Perfect Match</td>
                                                                <td className="px-4 py-2.5 text-green-700 dark:text-green-400">Highly Recommended</td>
                                                            </tr>
                                                            <tr className="bg-blue-50 dark:bg-blue-900/10 border-t border-gray-200 dark:border-white/10">
                                                                <td className="px-4 py-2.5 text-blue-700 dark:text-blue-400">70% – 84%</td>
                                                                <td className="px-4 py-2.5 text-center font-semibold text-blue-700 dark:text-blue-400">Good Match</td>
                                                                <td className="px-4 py-2.5 text-blue-700 dark:text-blue-400">Recommended with support</td>
                                                            </tr>
                                                            <tr className="bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-white/10">
                                                                <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">&lt; 70%</td>
                                                                <td className="px-4 py-2.5 text-center font-semibold text-gray-600 dark:text-gray-400">Below Threshold</td>
                                                                <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">Not Recommended</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Course Suggestions Overview Table */}
                                            <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                                <h4 className="font-bold text-[#150089] dark:text-white mb-4 flex items-center gap-2 text-base">
                                                    <GraduationCap className="w-5 h-5 text-brand-green" />
                                                    Course Suggestions Overview
                                                </h4>
                                                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="bg-[#150089] text-white">
                                                                <th className="px-4 py-3 text-left font-semibold">Course Name</th>
                                                                <th className="px-4 py-3 text-center font-semibold">Fitment</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {[...(report.perfect_courses || []), ...(report.good_courses || [])].map((c, i) => (
                                                                <tr key={i} className="border-t border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
                                                                    <td className="px-4 py-3 text-gray-800 dark:text-white">{c.name}</td>
                                                                    <td className="px-4 py-3 text-center font-bold text-green-600">{c.fitment}%</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Detailed Course Recommendations */}
                                            <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                                <h4 className="font-bold text-[#150089] dark:text-white mb-2 flex items-center gap-2 text-base">
                                                    <BookOpen className="w-5 h-5 text-brand-green" />
                                                    Detailed Course Recommendations
                                                </h4>
                                                <p className="text-sm text-[#150089] dark:text-blue-300 mb-5">
                                                    The following courses have been selected based on your behavioral strengths and career fitment score. They represent your best opportunities for long-term growth.
                                                </p>

                                                {/* Priority 1: Perfect Match */}
                                                {report.perfect_courses?.length > 0 && (
                                                    <>
                                                        <h5 className="font-bold text-green-700 dark:text-green-400 mb-4 text-base">Priority 1: Top Recommendations</h5>
                                                        <div className="space-y-6 mb-6">
                                                            {report.perfect_courses.map((c, i) => {
                                                                // Get roadmap for this course
                                                                const courseRoadmap = getCourseRoadmap(c.name);
                                                                return (
                                                                    <div key={i} className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/10 rounded-r-xl overflow-hidden">
                                                                        <div className="flex items-center justify-between p-4 bg-green-100/50 dark:bg-green-900/20">
                                                                            <span className="font-bold text-green-800 dark:text-green-300 text-base">{c.name}</span>
                                                                            <span className="px-3 py-1.5 bg-green-600 text-white text-sm font-bold rounded-lg">{c.fitment}% Match</span>
                                                                        </div>
                                                                        <div className="p-4">
                                                                            {c.why_recommended && c.why_recommended.length > 0 && (
                                                                                <div className="mb-4">
                                                                                    <p className="font-semibold text-sm text-gray-800 dark:text-white mb-2">Why recommended:</p>
                                                                                    <ul className="space-y-1.5">
                                                                                        {c.why_recommended.map((r, j) => (
                                                                                            <li key={j} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                                                                <span className="text-green-600 mt-1">•</span>
                                                                                                {r}
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            )}

                                                                            {/* Career Roadmap for this course */}
                                                                            <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800/30">
                                                                                <h6 className="font-bold text-[#150089] dark:text-white mb-4 text-sm flex items-center gap-2">
                                                                                    <TrendingUp className="w-4 h-4 text-brand-green" />
                                                                                    Suggested Career Roadmap
                                                                                </h6>
                                                                                <div className="space-y-3">
                                                                                    {courseRoadmap.map((step, stepIdx) => (
                                                                                        <div key={stepIdx} className="flex items-start gap-4">
                                                                                            {/* Step Label Box */}
                                                                                            <div className="flex-shrink-0 w-28 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg py-2 px-3 text-center border border-blue-100 dark:border-blue-800/30">
                                                                                                <p className="text-[10px] text-[#150089] dark:text-blue-300 font-semibold uppercase tracking-wide">STEP {String(stepIdx + 1).padStart(2, '0')}</p>
                                                                                                <p className="text-sm font-bold text-[#150089] dark:text-white">{step.stage}</p>
                                                                                            </div>
                                                                                            {/* Step Content */}
                                                                                            <div className="flex-1 pt-1">
                                                                                                <ul className="space-y-1">
                                                                                                    {step.bullets.map((bullet, bulletIdx) => (
                                                                                                        <li key={bulletIdx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                                                                            <span className="text-[#150089] dark:text-blue-400 mt-1">•</span>
                                                                                                            {bullet}
                                                                                                        </li>
                                                                                                    ))}
                                                                                                </ul>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </>
                                                )}

                                                {/* Priority 2: Good Match */}
                                                {report.good_courses?.length > 0 && (
                                                    <>
                                                        <h5 className="font-bold text-blue-700 dark:text-blue-400 mb-4 text-base">Priority 2: Strong Alternatives</h5>
                                                        <div className="space-y-6">
                                                            {report.good_courses.map((c, i) => {
                                                                const courseRoadmap = getCourseRoadmap(c.name);
                                                                return (
                                                                    <div key={i} className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10 rounded-r-xl overflow-hidden">
                                                                        <div className="flex items-center justify-between p-4 bg-blue-100/50 dark:bg-blue-900/20">
                                                                            <span className="font-bold text-blue-800 dark:text-blue-300 text-base">{c.name}</span>
                                                                            <span className="px-3 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg">{c.fitment}% Match</span>
                                                                        </div>
                                                                        <div className="p-4">
                                                                            {c.why_recommended && c.why_recommended.length > 0 && (
                                                                                <div className="mb-4">
                                                                                    <p className="font-semibold text-sm text-gray-800 dark:text-white mb-2">Why recommended:</p>
                                                                                    <ul className="space-y-1.5">
                                                                                        {c.why_recommended.map((r, j) => (
                                                                                            <li key={j} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                                                                <span className="text-blue-600 mt-1">•</span>
                                                                                                {r}
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            )}

                                                                            {/* Career Roadmap for this course */}
                                                                            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800/30">
                                                                                <h6 className="font-bold text-[#150089] dark:text-white mb-4 text-sm flex items-center gap-2">
                                                                                    <TrendingUp className="w-4 h-4 text-brand-green" />
                                                                                    Suggested Career Roadmap
                                                                                </h6>
                                                                                <div className="space-y-3">
                                                                                    {courseRoadmap.map((step, stepIdx) => (
                                                                                        <div key={stepIdx} className="flex items-start gap-4">
                                                                                            {/* Step Label Box */}
                                                                                            <div className="flex-shrink-0 w-28 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg py-2 px-3 text-center border border-blue-100 dark:border-blue-800/30">
                                                                                                <p className="text-[10px] text-[#150089] dark:text-blue-300 font-semibold uppercase tracking-wide">STEP {String(stepIdx + 1).padStart(2, '0')}</p>
                                                                                                <p className="text-sm font-bold text-[#150089] dark:text-white">{step.stage}</p>
                                                                                            </div>
                                                                                            {/* Step Content */}
                                                                                            <div className="flex-1 pt-1">
                                                                                                <ul className="space-y-1">
                                                                                                    {step.bullets.map((bullet, bulletIdx) => (
                                                                                                        <li key={bulletIdx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                                                                            <span className="text-[#150089] dark:text-blue-400 mt-1">•</span>
                                                                                                            {bullet}
                                                                                                        </li>
                                                                                                    ))}
                                                                                                </ul>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Additional Pathways */}
                                            {(report.entry_level_courses?.length > 0 || report.international_courses?.length > 0) && (
                                                <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                                    <h4 className="font-bold text-[#150089] dark:text-white mb-2 flex items-center gap-2 text-base">
                                                        <Layers className="w-5 h-5 text-brand-green" />
                                                        Additional Pathways
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                                                        Courses listed below offer alternative entry points or specialized global opportunities.
                                                    </p>

                                                    {/* Entry Level Courses */}
                                                    {report.entry_level_courses?.length > 0 && (
                                                        <div className="mb-6">
                                                            <h5 className="font-bold text-gray-700 dark:text-gray-300 mb-3 text-base">Option A: Foundational Entry-Level Roles</h5>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Ideal for gaining immediate work experience before upskilling.</p>
                                                            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                                                                <table className="w-full text-sm">
                                                                    <thead>
                                                                        <tr className="bg-gray-100 dark:bg-white/5">
                                                                            <th className="px-4 py-2.5 text-left font-semibold text-gray-900 dark:text-white">Course Name</th>
                                                                            <th className="px-4 py-2.5 text-center font-semibold text-gray-900 dark:text-white">Fitment</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {report.entry_level_courses.map((c, i) => (
                                                                            <tr key={i} className="border-t border-gray-200 dark:border-white/10">
                                                                                <td className="px-4 py-2.5 text-gray-800 dark:text-white">{c.name}</td>
                                                                                <td className="px-4 py-2.5 text-center text-gray-600 dark:text-gray-400">{c.fitment}%</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* International Courses */}
                                                    {report.international_courses?.length > 0 && (
                                                        <div>
                                                            <h5 className="font-bold text-blue-800 dark:text-blue-400 mb-3 text-base">Option B: International Opportunities</h5>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Specialized certifications with high demand in overseas markets.</p>
                                                            <div className="space-y-3">
                                                                {report.international_courses.map((c, i) => (
                                                                    <div key={i} className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10 rounded-r-xl overflow-hidden">
                                                                        <div className="flex items-center justify-between p-4">
                                                                            <span className="font-bold text-blue-800 dark:text-blue-300">{c.name}</span>
                                                                            <span className="px-3 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg">{c.fitment}% Match</span>
                                                                        </div>
                                                                        {c.why_recommended && c.why_recommended.length > 0 && (
                                                                            <div className="px-4 pb-4">
                                                                                <ul className="space-y-1">
                                                                                    {c.why_recommended.map((r, j) => (
                                                                                        <li key={j} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                                                            <span className="text-blue-600 mt-1">•</span>
                                                                                            {r}
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Career Direction Guidance */}
                                            {report.career_guidance && (
                                                <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                                    <h4 className="font-bold text-[#150089] dark:text-white mb-4 flex items-center gap-2 text-base">
                                                        <Briefcase className="w-5 h-5 text-brand-green" />
                                                        Career Direction Guidance
                                                    </h4>
                                                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">{report.career_guidance.intro || 'The candidate will perform best in careers that:'}</p>
                                                    <ul className="space-y-2 mb-4">
                                                        {(report.career_guidance.bullets || ['Offer structured growth', 'Value safety and responsibility', 'Reward consistency and accuracy']).map((b, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                                <CheckCircle className="w-4 h-4 text-brand-green mt-0.5 flex-shrink-0" />
                                                                {b}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    {report.career_guidance.conclusion && (
                                                        <p className="text-gray-700 dark:text-gray-300 text-sm">{report.career_guidance.conclusion}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Career Roadmap */}
                                            {report.career_roadmap?.length > 0 && (
                                                <div className="bg-white dark:bg-white/5 p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                                                    <h4 className="font-bold text-[#150089] dark:text-white mb-5 flex items-center gap-2 text-base">
                                                        <TrendingUp className="w-5 h-5 text-brand-green" />
                                                        Suggested Career Roadmap
                                                    </h4>
                                                    <div className="space-y-4">
                                                        {report.career_roadmap.map((stage, i) => (
                                                            <div key={i} className="flex gap-4">
                                                                <div className="flex-shrink-0 w-28 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 text-center">
                                                                    <p className="text-xs text-[#150089] dark:text-blue-300 font-medium">STEP 0{i + 1}</p>
                                                                    <p className="text-sm font-bold text-[#150089] dark:text-white">{stage.stage}</p>
                                                                </div>
                                                                <div className="flex-1 pt-2">
                                                                    <ul className="space-y-1.5">
                                                                        {stage.bullets.map((b, j) => (
                                                                            <li key={j} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                                                <span className="text-[#150089] dark:text-blue-400 mt-1">•</span>
                                                                                {b}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Qualification Note */}
                                            {report.qualification_note && (
                                                <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-200 dark:border-amber-800/30">
                                                    <h4 className="font-bold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2 text-base">
                                                        <AlertCircle className="w-5 h-5" />
                                                        NOTE
                                                    </h4>
                                                    <p className="text-amber-900 dark:text-amber-200 text-sm leading-relaxed">
                                                        {report.qualification_note}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Final Guidance */}
                                            {report.final_guidance && (
                                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-6 rounded-xl border border-blue-200 dark:border-blue-800/30">
                                                    <h4 className="font-bold text-[#150089] dark:text-white mb-3 flex items-center gap-2 text-base">
                                                        <Star className="w-5 h-5 text-yellow-500" />
                                                        Final Guidance
                                                    </h4>
                                                    <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                                                        {report.final_guidance}
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
// PDF Generation Helper - Fixed A4 Pages with Proper Layout
// ============================================================================

function generatePrintableHTML(report: ReportData, studentName: string, counsellingTypeId: string): string {
    const date = new Date(report.generated_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    // Generate Report ID: OBI-S[CounsellingTypeId][Date as DDMMYYYY]
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateCode = `${day}${month}${year}`;
    const refNo = `OBI-S${counsellingTypeId}${dateCode}`;

    // Career roadmap data based on course name (from Course Career path-2026.docx)
    const getCareerRoadmap = (courseName: string): { stage: string; role: string }[] => {
        const roadmaps: Record<string, { stage: string; role: string }[]> = {
            'Refrigeration & Air conditioner training (A/C)': [
                { stage: '0-6 Months', role: 'Assistant Technician' },
                { stage: '1-2 Years', role: 'Technician' },
                { stage: '3-5 Years', role: 'Senior Technician' },
                { stage: '5-8 Years', role: 'Supervisor' },
                { stage: 'Entrepreneur', role: 'Own Service Unit' }
            ],
            'Basic Electrical & HVAC Training': [
                { stage: '0-6 Months', role: 'Assistant Technician' },
                { stage: '1-2 Years', role: 'Technician' },
                { stage: '3-5 Years', role: 'Senior Technician' },
                { stage: '5-8 Years', role: 'Supervisor' },
                { stage: 'Entrepreneur', role: 'Own Service Unit' }
            ],
            'Diploma In HVAC': [
                { stage: '0-6 Months', role: 'Technician' },
                { stage: '1-2 Years', role: 'Senior Technician' },
                { stage: '3-5 Years', role: 'Supervisor' },
                { stage: '5-8 Years', role: 'Manager' },
                { stage: 'Entrepreneur', role: 'Own Company' }
            ],
            'CERTIFIED HVAC ENGINEER (CHE)': [
                { stage: '0-6 Months', role: 'Asst. Project Engineer' },
                { stage: '1-2 Years', role: 'Project Engineer' },
                { stage: '3-5 Years', role: 'Project In Charge' },
                { stage: '5-8 Years', role: 'Project Manager' },
                { stage: 'Entrepreneur', role: 'Own HVAC Company' }
            ],
            'NDT & Quality Management Training': [
                { stage: '0-6 Months', role: 'Quality Inspector' },
                { stage: '1-2 Years', role: 'Quality In Charge' },
                { stage: '3-5 Years', role: 'Asst. Manager Quality' },
                { stage: '5-8 Years', role: 'QA Manager' },
                { stage: 'Entrepreneur', role: 'GM' }
            ],
            'Advance Diploma In Fire & Industrial Safety': [
                { stage: '0-6 Months', role: 'Fire Safety Technician' },
                { stage: '1-2 Years', role: 'Safety Officer/Supervisor' },
                { stage: '3-5 Years', role: 'Safety Engineer' },
                { stage: '5-8 Years', role: 'Safety Manager' },
                { stage: 'Entrepreneur', role: 'EHS Manager' }
            ],
            'CERTIFIED HEALTH, SAFETY & ENVIRONMENTAL OFFICER (CHSEO)': [
                { stage: '0-6 Months', role: 'Safety Supervisor' },
                { stage: '1-2 Years', role: 'Safety Officer' },
                { stage: '3-5 Years', role: 'Safety Engineer' },
                { stage: '5-8 Years', role: 'Safety Manager' },
                { stage: 'Entrepreneur', role: 'EHS Manager' }
            ],
            'WELDING- ARC/TIG/MIG': [
                { stage: '0-6 Months', role: 'Assistant Welder' },
                { stage: '1-2 Years', role: 'Skilled Welder' },
                { stage: '3-5 Years', role: 'Certified Welder' },
                { stage: '5-8 Years', role: 'Welding Supervisor' },
                { stage: 'Entrepreneur', role: 'Own Welding Unit' }
            ],
            'Welding Supervisor Training': [
                { stage: '0-6 Months', role: 'Welding Foreman' },
                { stage: '1-2 Years', role: 'Welding Supervisor' },
                { stage: '3-5 Years', role: 'Welding In Charge' },
                { stage: '5-8 Years', role: 'Manager' },
                { stage: 'Entrepreneur', role: 'Own Company' }
            ],
            'MECHANICAL ELECTRICAL PLUMBING ENGINEER (MEP)': [
                { stage: '0-6 Months', role: 'Asst. Project Engineer' },
                { stage: '1-2 Years', role: 'Project Engineer' },
                { stage: '3-5 Years', role: 'Project In Charge' },
                { stage: '5-8 Years', role: 'Project Manager' },
                { stage: 'Entrepreneur', role: 'Own MEP Company' }
            ],
            'CERTIFIED OIL & GAS PIPING ENGINEER (CPE)': [
                { stage: '0-6 Months', role: 'Asst. Site Engineer' },
                { stage: '1-2 Years', role: 'Project Engineer' },
                { stage: '3-5 Years', role: 'Project In Charge' },
                { stage: '5-8 Years', role: 'Project Manager' },
                { stage: 'Entrepreneur', role: 'Own Company' }
            ],
            'Electrician': [
                { stage: '0-6 Months', role: 'Assistant Technician' },
                { stage: '1-2 Years', role: 'Technician' },
                { stage: '3-5 Years', role: 'Senior Technician' },
                { stage: '5-8 Years', role: 'Supervisor' },
                { stage: 'Entrepreneur', role: 'Own Service Unit' }
            ],
            'Plumber': [
                { stage: '0-6 Months', role: 'Assistant Technician' },
                { stage: '1-2 Years', role: 'Technician' },
                { stage: '3-5 Years', role: 'Senior Technician' },
                { stage: '5-8 Years', role: 'Supervisor' },
                { stage: 'Entrepreneur', role: 'Own Service Unit' }
            ],
            'Industrial electrician': [
                { stage: '0-6 Months', role: 'Assistant Technician' },
                { stage: '1-2 Years', role: 'Technician' },
                { stage: '3-5 Years', role: 'Senior Technician' },
                { stage: '5-8 Years', role: 'Supervisor' },
                { stage: 'Entrepreneur', role: 'Own Service Unit' }
            ],
            'HOME APPLIANCE TRAINING': [
                { stage: '0-6 Months', role: 'Assistant Technician' },
                { stage: '1-2 Years', role: 'Technician' },
                { stage: '3-5 Years', role: 'Senior Technician' },
                { stage: '5-8 Years', role: 'Supervisor' },
                { stage: 'Entrepreneur', role: 'Own Service Unit' }
            ],
            'Fitter': [
                { stage: '0-6 Months', role: 'Assistant Fitter' },
                { stage: '1-2 Years', role: 'Skilled Fitter' },
                { stage: '3-5 Years', role: 'Certified Fitter' },
                { stage: '5-8 Years', role: 'Fitter Supervisor' },
                { stage: 'Entrepreneur', role: 'Own Unit' }
            ],
            'Automobile Quality Inspector Training': [
                { stage: '0-6 Months', role: 'Quality Inspector' },
                { stage: '1-2 Years', role: 'Quality In Charge' },
                { stage: '3-5 Years', role: 'Asst. Manager Quality' },
                { stage: '5-8 Years', role: 'QA Manager' },
                { stage: 'Entrepreneur', role: 'GM' }
            ],
            'Washing Machine Training': [
                { stage: '0-6 Months', role: 'Assistant Technician' },
                { stage: '1-2 Years', role: 'Technician' },
                { stage: '3-5 Years', role: 'Senior Technician' },
                { stage: '5-8 Years', role: 'Supervisor' },
                { stage: 'Entrepreneur', role: 'Own Service Unit' }
            ]
        };

        // Find matching roadmap (case insensitive partial match)
        const normalizedName = courseName.toLowerCase().trim();
        for (const [key, value] of Object.entries(roadmaps)) {
            if (key.toLowerCase().trim() === normalizedName ||
                normalizedName.includes(key.toLowerCase()) ||
                key.toLowerCase().includes(normalizedName)) {
                return value;
            }
        }

        // Default roadmap if course not found
        return [
            { stage: '0-6 Months', role: 'Entry Level' },
            { stage: '1-2 Years', role: 'Skilled Professional' },
            { stage: '3-5 Years', role: 'Senior Professional' },
            { stage: '5-8 Years', role: 'Supervisor/Manager' },
            { stage: 'Entrepreneur', role: 'Own Business' }
        ];
    };

    // Generate course card with its career roadmap
    const generateCourseWithRoadmap = (course: CourseRecommendation, type: 'perfect' | 'good') => {
        const roadmap = getCareerRoadmap(course.name);
        const bgColor = type === 'perfect' ? '#dcfce7' : '#dbeafe';
        const borderColor = type === 'perfect' ? '#22c55e' : '#3b82f6';
        const textColor = type === 'perfect' ? '#166534' : '#1e40af';
        
        return `
        <div class="course-card">
            <div class="course-card-header" style="background: ${bgColor}; border-left: 3mm solid ${borderColor};">
                <div class="course-name" style="color: ${textColor};">${course.name}</div>
                <div class="course-score" style="background: ${borderColor};">${course.fitment}%</div>
            </div>
            ${course.why_recommended?.length ? `
            <div class="course-reasons">
                <strong>Why recommended:</strong>
                <ul>${course.why_recommended.map(r => `<li>${r}</li>`).join('')}</ul>
            </div>
            ` : ''}
            <div class="career-roadmap">
                <div class="roadmap-heading">Suggested Career Roadmap</div>
                <table class="roadmap-table">
                    <tbody>
                        ${roadmap.map((step, i) => `
                        <tr>
                            <td class="roadmap-left">
                                <div class="roadmap-step-num">STEP 0${i + 1}</div>
                                <div class="roadmap-year">${step.stage}</div>
                            </td>
                            <td class="roadmap-right">${step.role}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;
    };

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
            size: A4;
            margin: 0;
        }
        
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        html, body { 
            width: 210mm;
            margin: 0 auto;
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 10pt;
            line-height: 1.5;
            color: #1a1a1a;
            background: #fff;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        /* ========== PAGE WRAPPER ========== */
        .page {
            width: 210mm;
            min-height: 297mm;
            height: 297mm;
            position: relative;
            page-break-after: always;
            overflow: hidden;
        }
        
        .page:last-child {
            page-break-after: auto;
        }
        
        /* ========== COVER PAGE (Page 1) ========== */
        .cover-page {
            width: 210mm;
            height: 297mm;
            position: relative;
            background: url('/Handbook_Cover_Default.jpg') no-repeat center center;
            background-size: cover;
        }
        
        .cover-logo {
            position: absolute;
            top: 12mm;
            right: 15mm;
            width: 22mm;
            height: auto;
        }
        
        .cover-title {
            position: absolute;
            top: 15mm;
            left: 15mm;
            font-family: 'Sora', sans-serif;
            font-size: 26pt;
            font-weight: 700;
            color: #150089;
            line-height: 1.2;
            max-width: 120mm;
        }
        
        .cover-ref {
            position: absolute;
            top: 50mm;
            right: 15mm;
            transform: rotate(-90deg);
            transform-origin: top right;
            font-size: 7pt;
            color: rgba(0,0,0,0.25);
            letter-spacing: 0.5px;
        }
        
        .cover-bottom-left {
            position: absolute;
            bottom: 20mm;
            left: 15mm;
        }
        
        .cover-label {
            font-family: 'Sora', sans-serif;
            font-size: 13pt;
            font-weight: 600;
            color: #1a1a1a;
        }
        
        .cover-date {
            font-size: 11pt;
            color: #555;
            margin-top: 2mm;
        }
        
        .cover-candidate {
            position: absolute;
            bottom: 20mm;
            right: 15mm;
            font-family: 'Sora', sans-serif;
            font-size: 20pt;
            font-weight: 700;
            color: #150089;
            text-align: right;
        }
        
        /* ========== CONTENT PAGES (Pages 2-6) ========== */
        .content-page {
            width: 210mm;
            height: 297mm;
            position: relative;
            padding: 12mm 12mm 18mm 12mm;
            border: 1.5pt solid #150089;
            background: #fff;
        }
        
        .page-content {
            height: calc(297mm - 12mm - 18mm - 14mm);
            overflow: hidden;
        }
        
        /* Page Header */
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 4mm;
            margin-bottom: 5mm;
            border-bottom: 1pt solid #e0e0e0;
        }
        
        .header-left {
            font-family: 'Sora', sans-serif;
            font-size: 9pt;
            font-weight: 600;
            color: #150089;
        }
        
        .header-right {
            font-size: 9pt;
            color: #555;
        }
        
        /* Page Footer with Page Number */
        .page-footer {
            position: absolute;
            bottom: 6mm;
            left: 12mm;
            right: 12mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 3mm;
            border-top: 0.5pt solid #e0e0e0;
        }
        
        .footer-left {
            font-size: 8pt;
            color: #888;
        }
        
        .footer-right {
            font-size: 8pt;
            color: #888;
        }
        
        .page-number {
            font-family: 'Sora', sans-serif;
            font-size: 9pt;
            font-weight: 600;
            color: #150089;
        }
        
        /* ========== SECTION STYLING ========== */
        .section-title {
            font-family: 'Sora', sans-serif;
            font-size: 13pt;
            font-weight: 700;
            color: #150089;
            margin: 0 0 4mm 0;
            padding-bottom: 2mm;
            border-bottom: 1pt solid #150089;
        }
        
        .section-title-sm {
            font-family: 'Sora', sans-serif;
            font-size: 11pt;
            font-weight: 700;
            color: #150089;
            margin: 4mm 0 2mm 0;
        }
        
        .text-block {
            font-size: 10pt;
            line-height: 1.55;
            color: #333;
            margin-bottom: 3mm;
            text-align: justify;
        }
        
        .bullet-list {
            list-style: none;
            padding-left: 0;
            margin: 2mm 0 4mm 0;
        }
        
        .bullet-list li {
            position: relative;
            padding-left: 5mm;
            margin-bottom: 1.5mm;
            font-size: 10pt;
            line-height: 1.5;
            color: #333;
        }
        
        .bullet-list li::before {
            content: "•";
            position: absolute;
            left: 0;
            color: #150089;
            font-weight: bold;
        }
        
        /* ========== TABLES ========== */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 3mm 0;
            font-size: 9pt;
        }
        
        .data-table th {
            background: #150089;
            color: #fff;
            padding: 2.5mm 3mm;
            text-align: left;
            font-weight: 600;
            font-size: 9pt;
        }
        
        .data-table td {
            padding: 2.5mm 3mm;
            border: 0.5pt solid #e0e0e0;
            background: #fafafa;
        }
        
        .data-table tr:nth-child(even) td {
            background: #fff;
        }
        
        .row-perfect td { background: #f0fff4 !important; color: #166534; }
        .row-good td { background: #eff6ff !important; color: #1e40af; }
        .row-below td { background: #fef2f2 !important; color: #991b1b; }
        
        /* ========== COURSE CARDS ========== */
        .priority-label {
            font-family: 'Sora', sans-serif;
            font-size: 11pt;
            font-weight: 700;
            margin: 4mm 0 3mm 0;
            display: flex;
            align-items: center;
            gap: 2mm;
        }
        
        .priority-label.priority-1 { color: #166534; }
        .priority-label.priority-1::before {
            content: "";
            display: inline-block;
            width: 3mm;
            height: 3mm;
            background: #22c55e;
            border-radius: 0.5mm;
        }
        
        .priority-label.priority-2 { color: #1e40af; }
        .priority-label.priority-2::before {
            content: "";
            display: inline-block;
            width: 3mm;
            height: 3mm;
            background: #3b82f6;
            border-radius: 0.5mm;
        }
        
        .course-card {
            margin-bottom: 4mm;
            border: 1pt solid #e0e0e0;
            border-radius: 1.5mm;
            overflow: hidden;
            page-break-inside: avoid;
        }
        
        .course-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 2.5mm 4mm;
        }
        
        .course-name {
            font-family: 'Sora', sans-serif;
            font-size: 10pt;
            font-weight: 700;
        }
        
        .course-score {
            padding: 1.5mm 3mm;
            border-radius: 2mm;
            font-size: 9pt;
            font-weight: 700;
            color: #fff;
        }
        
        .course-reasons {
            padding: 2mm 4mm;
            background: #f9fafb;
            border-top: 0.5pt solid #e5e7eb;
            font-size: 9pt;
        }
        
        .course-reasons ul {
            margin: 1mm 0 0 4mm;
            padding: 0;
            list-style: disc;
        }
        
        .course-reasons li {
            margin-bottom: 0.5mm;
            color: #555;
            font-size: 9pt;
        }
        
        /* ========== CAREER ROADMAP ========== */
        .career-roadmap {
            padding: 2.5mm 4mm;
            background: #f8fafc;
            border-top: 0.5pt solid #e5e7eb;
        }
        
        .roadmap-heading {
            font-family: 'Sora', sans-serif;
            font-size: 9pt;
            font-weight: 700;
            color: #150089;
            margin-bottom: 2mm;
        }
        
        .roadmap-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .roadmap-table tr {
            border-bottom: 0.3pt solid #e0e0e0;
        }
        
        .roadmap-table tr:last-child {
            border-bottom: none;
        }
        
        .roadmap-left {
            width: 26mm;
            padding: 1.5mm 2mm;
            background: #e0e7ff;
            text-align: center;
            vertical-align: middle;
        }
        
        .roadmap-step-num {
            font-family: 'Sora', sans-serif;
            font-size: 7pt;
            color: #4338ca;
            font-weight: 600;
        }
        
        .roadmap-year {
            font-family: 'Sora', sans-serif;
            font-size: 8pt;
            font-weight: 700;
            color: #150089;
        }
        
        .roadmap-right {
            padding: 1.5mm 3mm;
            background: #fff;
            font-size: 9pt;
            color: #374151;
            vertical-align: middle;
            border-left: 0.3pt solid #e0e0e0;
        }
        
        /* ========== GUIDANCE & NOTE BOXES ========== */
        .guidance-box {
            background: #f0f9ff;
            padding: 4mm;
            border-radius: 2mm;
            margin: 4mm 0;
            border: 1pt solid #bae6fd;
        }
        
        .note-box {
            background: #fffbeb;
            padding: 3mm 4mm;
            margin: 4mm 0;
            border-radius: 2mm;
            border-left: 3mm solid #f59e0b;
        }
        
        .note-title {
            font-family: 'Sora', sans-serif;
            font-size: 9pt;
            font-weight: 700;
            color: #b45309;
            text-transform: uppercase;
            margin-bottom: 1mm;
        }
        
        .note-text {
            font-size: 9pt;
            line-height: 1.5;
            color: #92400e;
        }
        
        /* ========== PRINT STYLES ========== */
        @media print {
            html, body {
                width: 210mm;
            }
            
            .page, .cover-page, .content-page {
                page-break-after: always;
            }
            
            .page:last-child, .content-page:last-child {
                page-break-after: auto;
            }
            
            .course-card {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <!-- PAGE 1: COVER PAGE -->
    <div class="page cover-page">
        <img src="/NTSC.jpeg" alt="Logo" class="cover-logo" />
        <div class="cover-title">Career Fitment & Course<br>Recommendation Report</div>
        <div class="cover-ref">${refNo}</div>
        <div class="cover-bottom-left">
            <div class="cover-label">Course Suggestion Report</div>
            <div class="cover-date">${date}</div>
        </div>
        <div class="cover-candidate">${studentName}</div>
    </div>
    
    <!-- PAGE 2: Behavioral Assessment & Methodology -->
    <div class="page content-page">
        <div class="page-header">
            <div class="header-left">Career Fitment Report</div>
            <div class="header-right">${studentName}</div>
        </div>
        
        <div class="page-content">
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
            
            <div class="section-title" style="margin-top: 5mm;">Course Fitment Methodology</div>
            <div class="text-block">Courses are shortlisted based on the following criteria:</div>
            <ul class="bullet-list">
                ${report.course_fitment?.methodology?.map(m => `<li>${m}</li>`).join('') || `
                <li>Work stability and job security potential</li>
                <li>Safety and compliance orientation</li>
                <li>Structured career growth path</li>
                <li>Long-term employability in the industry</li>
                `}
            </ul>
            
            <div class="section-title-sm">Fitment Levels</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width:20%">Score Range</th>
                        <th style="width:20%">Category</th>
                        <th>Recommendation</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="row-perfect">
                        <td>85% – 95%</td>
                        <td>Perfect Match</td>
                        <td>Highly Recommended – Strong alignment with candidate profile</td>
                    </tr>
                    <tr class="row-good">
                        <td>70% – 84%</td>
                        <td>Good Match</td>
                        <td>Recommended with additional support and training</td>
                    </tr>
                    <tr class="row-below">
                        <td>&lt; 70%</td>
                        <td>Below Threshold</td>
                        <td>Not Recommended for this candidate</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="page-footer">
            <div class="footer-left">OriginBI</div>
            <div class="page-number">Page 2</div>
            <div class="footer-right">${date}</div>
        </div>
    </div>
    
    <!-- PAGE 3: Course Suggestions Overview -->
    <div class="page content-page">
        <div class="page-header">
            <div class="header-left">Career Fitment Report</div>
            <div class="header-right">${studentName}</div>
        </div>
        
        <div class="page-content">
            <div class="section-title">Course Suggestions Overview</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Course Name</th>
                        <th style="text-align:center;width:18%">Fitment Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${[...(report.perfect_courses || []), ...(report.good_courses || [])].map(c => `
                    <tr>
                        <td>${c.name}</td>
                        <td style="text-align:center;font-weight:700;color:#166534">${c.fitment}%</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="section-title" style="margin-top: 5mm;">Detailed Course Recommendations</div>
            
            ${(report.perfect_courses || []).length > 0 ? `
            <div class="priority-label priority-1">Priority 1: Top Recommendations</div>
            ${(report.perfect_courses || []).slice(0, 1).map(c => generateCourseWithRoadmap(c, 'perfect')).join('')}
            ` : ''}
        </div>
        
        <div class="page-footer">
            <div class="footer-left">OriginBI</div>
            <div class="page-number">Page 3</div>
            <div class="footer-right">${date}</div>
        </div>
    </div>
    
    <!-- PAGE 4: More Courses -->
    <div class="page content-page">
        <div class="page-header">
            <div class="header-left">Career Fitment Report</div>
            <div class="header-right">${studentName}</div>
        </div>
        
        <div class="page-content">
            ${(report.perfect_courses || []).length > 1 ? `
            <div class="priority-label priority-1">Priority 1: Top Recommendations (continued)</div>
            ${(report.perfect_courses || []).slice(1).map(c => generateCourseWithRoadmap(c, 'perfect')).join('')}
            ` : ''}
            
            ${(report.good_courses || []).length > 0 ? `
            <div class="priority-label priority-2">Priority 2: Strong Alternatives</div>
            ${(report.good_courses || []).slice(0, 2).map(c => generateCourseWithRoadmap(c, 'good')).join('')}
            ` : ''}
        </div>
        
        <div class="page-footer">
            <div class="footer-left">OriginBI</div>
            <div class="page-number">Page 4</div>
            <div class="footer-right">${date}</div>
        </div>
    </div>
    
    <!-- PAGE 5: Remaining Courses -->
    <div class="page content-page">
        <div class="page-header">
            <div class="header-left">Career Fitment Report</div>
            <div class="header-right">${studentName}</div>
        </div>
        
        <div class="page-content">
            ${(report.good_courses || []).length > 2 ? `
            <div class="priority-label priority-2">Priority 2: Strong Alternatives (continued)</div>
            ${(report.good_courses || []).slice(2).map(c => generateCourseWithRoadmap(c, 'good')).join('')}
            ` : ''}
            
            ${(report.entry_level_courses || []).length > 0 ? `
            <div class="section-title">Additional Pathways</div>
            <div class="section-title-sm">Option A: Foundational Entry-Level Roles</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Course Name</th>
                        <th style="text-align:center;width:18%">Fitment</th>
                    </tr>
                </thead>
                <tbody>
                    ${(report.entry_level_courses || []).map(c => `
                    <tr>
                        <td>${c.name}</td>
                        <td style="text-align:center;font-weight:600">${c.fitment}%</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : ''}
        </div>
        
        <div class="page-footer">
            <div class="footer-left">OriginBI</div>
            <div class="page-number">Page 5</div>
            <div class="footer-right">${date}</div>
        </div>
    </div>
    
    <!-- PAGE 6: Career Guidance & Final Notes -->
    <div class="page content-page">
        <div class="page-header">
            <div class="header-left">Career Fitment Report</div>
            <div class="header-right">${studentName}</div>
        </div>
        
        <div class="page-content">
            <div class="section-title">Career Direction Guidance</div>
            <div class="text-block">${report.career_guidance?.intro || 'Based on the assessment, the candidate will perform best in careers that:'}</div>
            <ul class="bullet-list">
                ${report.career_guidance?.bullets?.map(b => `<li>${b}</li>`).join('') || `
                <li>Offer structured growth with clear milestones</li>
                <li>Value safety, responsibility, and attention to detail</li>
                <li>Reward consistency, accuracy, and reliability</li>
                `}
            </ul>
            <div class="text-block">${report.career_guidance?.conclusion || 'Such roles naturally lead to supervisory and management positions over time, providing stable career advancement.'}</div>
            
            ${report.qualification_note ? `
            <div class="note-box">
                <div class="note-title">Important Note</div>
                <div class="note-text">${report.qualification_note}</div>
            </div>
            ` : ''}
            
            <div class="guidance-box">
                <div class="section-title-sm" style="margin-top: 0; color: #0369a1;">Final Guidance</div>
                <div class="text-block" style="margin-bottom: 0;">${report.final_guidance || 'Your strength lies in doing work correctly, safely, and consistently. Choosing structured technical and safety-focused careers will ensure steady income, professional respect, and long-term growth opportunities.'}</div>
            </div>
        </div>
        
        <div class="page-footer">
            <div class="footer-left">OriginBI</div>
            <div class="page-number">Page 6</div>
            <div class="footer-right">${date}</div>
        </div>
    </div>
</body>
</html>
    `;
}
