"use client";
import React, { useEffect, useState } from "react";
import { corporateDashboardService } from '@/lib/services/index';
import { RoadmapIcon } from '@/components/icons/index';

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

            {error && <div className="text-red-500 mb-4">{error}</div>}

            {!loading && !error && accessList.length === 0 ? (
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No counselling services currently activated.</p>
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
