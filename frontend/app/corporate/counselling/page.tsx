"use client";
import React, { useEffect, useState } from "react";
import { corporateDashboardService } from '../../../lib/services';
import { RoadmapIcon } from '../../../components/icons';

export default function CorporateCounsellingPage() {
    const [accessList, setAccessList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAccess = async () => {
            try {
                const user = localStorage.getItem("user");
                if (!user) return;
                const { email } = JSON.parse(user);

                const res = await corporateDashboardService.getCounsellingAccess(email);
                setAccessList(res.data || []);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to load counselling access.");
            } finally {
                setLoading(false);
            }
        };
        fetchAccess();
    }, []);

    if (loading) return <div className="p-8 text-center dark:text-white">Loading...</div>;

    return (
        <div className="p-6 md:p-8">
            <h1 className="text-2xl font-bold mb-6 text-brand-text-light-primary dark:text-white">
                Activated Counselling Services
            </h1>

            {error ? (
                <div className="bg-white dark:bg-brand-dark-secondary border border-gray-100 dark:border-brand-dark-tertiary rounded-2xl p-12 text-center max-w-2xl mx-auto mt-8 shadow-sm animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        No Active Counselling Access
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                        It looks like there are no counselling services currently assigned to your account.
                        <br className="hidden md:block" />
                        <span className="block mt-2 font-medium">No More Counselling Access Provided.</span>
                        Need access? Please contact your organization's administrator.
                    </p>
                    <button
                        className="px-8 py-3 bg-brand-green text-white rounded-xl font-medium hover:bg-green-600 transition-shadow shadow-md hover:shadow-lg flex items-center justify-center gap-2 mx-auto"
                        onClick={() => window.location.href = 'mailto:support@originbi.com'}
                    >
                        Contact Administrator
                    </button>
                </div>
            ) : !loading && accessList.length === 0 ? (
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-12 text-center max-w-xl mx-auto">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <RoadmapIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Services Active</h3>
                    <p className="text-gray-500 dark:text-gray-400">There are no counselling services currently activated for your account.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {accessList.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => window.location.href = `/corporate/counselling/${item.id}`} // Simple navigation for now, or use router
                            className="bg-white dark:bg-brand-dark-secondary border border-gray-100 dark:border-brand-dark-tertiary rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green group-hover:bg-brand-green group-hover:text-white transition-colors">
                                    <RoadmapIcon className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.name}</h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                                {item.prompt || "No description available."}
                            </p>
                            <div className="flex justify-between items-center mt-4">
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-medium">
                                    Active Access
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
