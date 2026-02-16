"use client";
import React, { useEffect, useState } from "react";
import { corporateDashboardService } from '../../../../lib/services';
import { useRouter } from "next/navigation";
import {
    SearchIcon,
    ChevronRightIcon,
    ArrowLeftIcon,
} from '../../../../components/icons';
import CounsellingPreviewModal from '../../../../components/corporate/CounsellingPreviewModal';
import { Clipboard as ClipboardIcon, Check as CheckIcon } from "lucide-react";

interface ClientPageProps {
    typeId: number;
}

export default function ClientPage({ typeId }: ClientPageProps) {
    const router = useRouter();
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [previewSession, setPreviewSession] = useState<any>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const limit = 10;

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        const fetchSessions = async () => {
            setLoading(true);
            try {
                const user = localStorage.getItem("user");
                if (!user) return;
                const { email } = JSON.parse(user);

                const res = await corporateDashboardService.getCounsellingSessions(
                    email,
                    typeId,
                    page,
                    limit,
                    debouncedSearch
                );
                setSessions(res.data);
                setTotal(res.total);
            } catch (error) {
                console.error("Failed to fetch sessions", error);
            } finally {
                setLoading(false);
            }
        };

        if (typeId) {
            fetchSessions();
        }
    }, [typeId, page, debouncedSearch]);

    const totalPages = Math.ceil(total / limit);

    const handleCopyLink = (token: string, id: string) => {
        const link = `${window.location.origin}/counselling/start?token=${token}`;
        navigator.clipboard.writeText(link);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="p-6 md:p-8">
            <button
                onClick={() => router.back()}
                className="flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition-colors"
            >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Assessment Sessions
                </h1>

                <div className="relative w-full md:w-64">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by mobile or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-brand-dark-secondary border border-gray-200 dark:border-brand-dark-tertiary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-brand-dark-secondary rounded-xl border border-gray-100 dark:border-brand-dark-tertiary shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Mobile / Email</th>
                                <th className="px-6 py-4">Access Code</th>
                                <th className="px-6 py-4">Link</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-brand-dark-tertiary">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : sessions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No sessions found.
                                    </td>
                                </tr>
                            ) : (
                                sessions.map((session) => {
                                    let details = session.studentDetails || session.student_details || {};
                                    if (typeof details === 'string') {
                                        try { details = JSON.parse(details); } catch { /* ignore */ }
                                    }

                                    const d = details; // short alias

                                    const firstName = d.personal_details?.first_name || d.personalDetails?.firstName || d.contact_information?.first_name || d.contactInformation?.firstName || d.first_name || d.name || '';
                                    const lastName = d.personal_details?.last_name || d.personalDetails?.lastName || d.contact_information?.last_name || d.contactInformation?.lastName || d.last_name || '';

                                    const fullName = firstName ? `${firstName} ${lastName}`.trim() : 'N/A';

                                    return (
                                        <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-brand-dark-tertiary/30 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                {new Date(session.created_at || session.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                {fullName}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-900 dark:text-white">
                                                        {session.mobileNumber}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {session.email || "-"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-mono">
                                                {session.accessCode}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleCopyLink(session.sessionToken, session.id)}
                                                    className="flex items-center gap-1.5 text-xs font-medium text-brand-green hover:underline"
                                                    title="Copy Assessment Link"
                                                >
                                                    {copiedId === session.id ? (
                                                        <>
                                                            <CheckIcon className="w-4 h-4" /> Copied
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ClipboardIcon className="w-4 h-4" /> Copy Link
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${session.status === 'COMPLETED'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    }`}>
                                                    {session.status === 'ACTIVE' ? 'READY' : session.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => router.push(`/corporate/counselling/${typeId}/${session.id}`)}
                                                    className="text-sm font-medium text-brand-green hover:underline"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-brand-dark-tertiary bg-gray-50 dark:bg-white/5">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Page {page} of {totalPages}
                        </span>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg hover:bg-white dark:hover:bg-brand-dark-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRightIcon className="w-4 h-4 text-gray-600 dark:text-gray-300 rotate-180" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg hover:bg-white dark:hover:bg-brand-dark-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRightIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
