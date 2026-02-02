
"use client";
import React, { useEffect, useState } from "react";
import { corporateDashboardService } from "@/lib/services";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@/components/icons";
import { User, FileText, Mail, Phone, Globe, Calendar } from "lucide-react";

export default function CounsellingSessionDetailPage({ params }: { params: { id: string, sessionId: string } }) {
    const router = useRouter();
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'report'>('details');
    const [error, setError] = useState("");
    const [responses, setResponses] = useState<any[]>([]);
    const [responsesLoading, setResponsesLoading] = useState(false);

    const sessionId = Number(params.sessionId);

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

                            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-800 text-center">
                                <h4 className="text-blue-800 dark:text-blue-200 font-semibold mb-2">Report Generation Pending</h4>
                                <p className="text-sm text-blue-600 dark:text-blue-300">
                                    The full graphical analysis report will be generated and available here soon.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
