import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { AffiliateSettlementModal } from "./AffiliateSettlementModal";
import { capitalizeWords } from "../../lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  isLoading?: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "";

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive,
  isLoading
}) => (
  <div className="bg-brand-light-secondary dark:bg-brand-dark-secondary p-6 rounded-2xl border border-brand-light-tertiary dark:border-white/5 relative overflow-hidden">
    {isLoading && (
      <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 animate-pulse" />
    )}
    <h3 className="text-brand-text-light-secondary dark:text-brand-text-secondary text-sm font-medium mb-2">
      {title}
    </h3>
    <div className="flex items-end justify-between">
      <div className="text-3xl font-bold text-brand-text-light-primary dark:text-white">
        {value}
      </div>
      <div
        className={`text-xs font-bold px-2 py-1 rounded-full ${isPositive
          ? "bg-green-500/10 text-green-500"
          : "bg-red-500/10 text-red-500"
          }`}
      >
        {change}
      </div>
    </div>
  </div>
);

interface DashboardData {
  totalReadyToPayment: number;
  affiliates: Array<{
    id: number;
    name: string;
    email: string;
    amount: number;
    mobileNumber: string;
    upiId?: string;
    bankName?: string;

    // extra fields for modal compatibility if needed, though id is enough for fetching
    ready_to_process_commission?: number;
    total_settled_commission?: number;
    commission_percentage?: number;
  }>;
}

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Settlement Modal State
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/admin/affiliates/dashboard-stats`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const openSettlementModal = (affiliate: any) => {
    // We need to shape the object so the modal can read it.
    // The dashboard API returns camelCase, but the modal EXPECTS snake_case properties usually found in the full list
    // verification: AffiliateSettlementModal props interface isn't fully visible but it likely uses the same shape as the table.
    // Let's create a compatible object.
    const compatibleAffiliate = {
      ...affiliate,
      ready_to_process_commission: affiliate.amount, // Important map
      // The modal re-fetches preview data by ID, so basic ID is crucial.
      // However, display might need name/email.
    };
    setSelectedAffiliate(compatibleAffiliate);
    setSettlementModalOpen(true);
  };

  // Hardcoded stats mixed with dynamic one
  const stats: StatCardProps[] = [
    { title: "Total Users", value: "24,592", change: "+12% this month", isPositive: true },
    { title: "Active Assessments", value: "1,840", change: "+5% this week", isPositive: true },
    { title: "Corporate Clients", value: "142", change: "+2 new", isPositive: true },
    {
      title: "Ready to Payment",
      value: loading ? "..." : formatCurrency(data?.totalReadyToPayment || 0),
      change: "Action Required", // Contextual label
      isPositive: (data?.totalReadyToPayment || 0) > 0,
      isLoading: loading
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text-light-primary dark:text-white">
            Admin Overview
          </h1>
          <p className="text-brand-text-light-secondary dark:text-brand-text-secondary text-sm">
            System statistics and platform health.
          </p>
        </div>

      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {/* Bottom Grid: Settlements (Small Left) & Coming Soon (Large Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Affiliate Settlements - Compact Roadmap Style */}
        <div className="lg:col-span-4 h-full">
          <div className="bg-white/20 dark:bg-brand-dark-secondary border border-[#19211C]/12 dark:border-transparent rounded-2xl h-full flex flex-col backdrop-blur-sm overflow-hidden shadow-sm min-h-[400px]">
            {/* Card Header */}
            <div className="px-6 pt-6 pb-4 flex justify-between items-center">
              <h3 className="font-semibold text-[#19211C] dark:text-white text-lg font-sans">
                Affiliate Settlements
              </h3>
              <Link href="/admin/affiliates" className="font-medium text-brand-green text-xs hover:underline">
                View All
              </Link>
            </div>
            <hr className="border-[#19211C]/10 dark:border-white/10" />

            {/* Content List */}
            <div className="flex-grow overflow-auto custom-scrollbar">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : !data?.affiliates || data.affiliates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-14 h-14 bg-brand-green/10 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-[#19211C] dark:text-white font-medium text-base">Perfectly Settled</h4>
                  <p className="text-sm text-[#19211C]/60 dark:text-white/60 mt-1">
                    No pending payments.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {data.affiliates.slice(0, 5).map((aff) => (
                    <div
                      key={aff.id}
                      className="px-6 group even:bg-white/5 hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-200"
                    >
                      <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(aff.name)}&background=random`}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform"
                          />
                          <div>
                            <h4 className="font-semibold text-[#19211C] dark:text-white text-sm line-clamp-1">
                              {capitalizeWords(aff.name)}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Ready to Payment:</span>
                              <span className="text-[#1ED36A] font-bold text-xs tracking-tight">
                                {formatCurrency(aff.amount)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => openSettlementModal(aff)}
                          className="bg-brand-green/10 hover:bg-brand-green text-brand-green hover:text-white w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 cursor-pointer"
                          title="Settle Payment"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>


          </div>
        </div>

        {/* Right Side: Coming Soon (Simplified) */}
        <div className="lg:col-span-8 h-full">
          <div className="bg-white/60 dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10 shadow-sm flex flex-col justify-center items-center h-full min-h-[400px] text-center">
            <div className="max-w-md mx-auto">
              <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-6 h-6 text-gray-400 dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>

              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                Advanced Analytics Hub
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                A streamlined command center for platform health, student progress tracking, and detailed performance reports is currently under development.
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-full border border-gray-100 dark:border-white/5">
                <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest">Available Phase 2</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settle Modal */}
      {settlementModalOpen && selectedAffiliate && (
        <AffiliateSettlementModal
          affiliate={selectedAffiliate}
          onClose={() => {
            setSettlementModalOpen(false);
            setSelectedAffiliate(null);
          }}
          onSuccess={() => {
            setSettlementModalOpen(false);
            setSelectedAffiliate(null);
            fetchStats(); // Refresh stats after settlement
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
