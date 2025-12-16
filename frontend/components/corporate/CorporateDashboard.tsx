import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface DashboardStats {
    companyName: string;
    availableCredits: number;
    totalCredits: number;
    studentsRegistered: number;
    isActive: boolean;
}

const StatCard: React.FC<{
    title: string;
    value: string | number;
    change?: string;
    isPositive?: boolean;
}> = ({ title, value, change, isPositive }) => (
    <div className="bg-brand-light-secondary dark:bg-brand-dark-secondary p-6 rounded-2xl border border-brand-light-tertiary dark:border-white/5 shadow-sm">
        <h3 className="text-brand-text-light-secondary dark:text-brand-text-secondary text-sm font-medium mb-2">
            {title}
        </h3>
        <div className="flex items-end justify-between">
            <div className="text-3xl font-bold text-brand-text-light-primary dark:text-white">
                {value}
            </div>
            {change && (
                <div
                    className={`text-xs font-bold px-2 py-1 rounded-full ${isPositive
                        ? "bg-green-500/10 text-green-500"
                        : "bg-red-500/10 text-red-500"
                        }`}
                >
                    {change}
                </div>
            )}
        </div>
    </div>
);

const CorporateDashboard: React.FC = () => {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStats = async () => {
            const email = sessionStorage.getItem("userEmail");
            const token = sessionStorage.getItem("accessToken");

            if (!email || !token) {
                // Redirect to login if waiting too long or just show loading state 
                // Logic handled by page or header usually, but good to check
                router.push("/corporate/login");
                return;
            }

            try {
                const res = await fetch(`http://localhost:4003/dashboard/stats?email=${email}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    throw new Error("Failed to fetch dashboard data");
                }

                const data = await res.json();
                setStats(data);
            } catch (err: any) {
                setError(err.message || "An error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [router]);

    if (loading) {
        return <div className="text-center p-10 text-brand-text-light-primary dark:text-white">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-brand-text-light-primary dark:text-white">
                    Welcome, {stats?.companyName || "Corporate Partner"}
                </h1>
                <p className="text-brand-text-light-secondary dark:text-brand-text-secondary text-sm">
                    Manage your candidates and credits.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Available Credits"
                    value={stats?.availableCredits || 0}
                    change="Balance"
                    isPositive={true}
                />
                <StatCard
                    title="Total Students"
                    value={stats?.studentsRegistered || 0}
                    change="Registered"
                    isPositive={true}
                />
                <StatCard
                    title="Total Credits Allocated"
                    value={stats?.totalCredits || 0}
                />
                <StatCard
                    title="Account Status"
                    value={stats?.isActive ? "Active" : "Inactive"}
                    isPositive={stats?.isActive}
                />
            </div>

            {/* Placeholder for Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-brand-light-secondary dark:bg-brand-dark-secondary rounded-2xl p-6 border border-brand-light-tertiary dark:border-white/5">
                    <h3 className="text-lg font-bold text-brand-text-light-primary dark:text-white mb-4">Quick Actions</h3>
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.push('/corporate/registrations')}
                            className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-green/90 transition"
                        >
                            Register Students
                        </button>
                    </div>
                </div>

                <div className="bg-brand-light-secondary dark:bg-brand-dark-secondary rounded-2xl p-6 border border-brand-light-tertiary dark:border-white/5">
                    <h3 className="text-lg font-bold text-brand-text-light-primary dark:text-white mb-4">Recent Activity</h3>
                    <p className="text-sm text-gray-500">No recent activity.</p>
                </div>
            </div>
        </div>
    );
};

export default CorporateDashboard;
