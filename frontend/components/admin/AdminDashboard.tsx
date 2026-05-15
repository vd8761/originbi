import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { AffiliateSettlementModal } from "./AffiliateSettlementModal";
import { ExtendAssessmentModal } from "./ExtendAssessmentModal";
import { formatDistanceToNow } from "date-fns";
import ReactCountryFlag from "react-country-flag";
import { COUNTRY_CODES } from "../../lib/countryCodes";


import { capitalizeWords } from "../../lib/utils";
import { api } from "../../lib/api";
import { useTheme } from "../../contexts/ThemeContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  isLoading?: boolean;
  href?: string;
};


const API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "";

// --- Interface for Charts ---
interface TraitData {
  traitName: string;
  count: number;
  colorRgb: string;
}

interface UserDistributionData {
  totalWithTraits: number;
  topTraits: TraitData[];
}

const RING_RADII = [90, 75, 60, 45];
const FALLBACK_COLORS = ['#150089', '#1ED36A', '#FF5457', '#FBC02D'];

const DonutChartSimple = ({ total, traits }: { total: number; traits: TraitData[] }) => {
  const maxCount = Math.max(...traits.map(t => t.count), 1);
  return (
    <div className="relative w-[180px] h-[180px] md:w-[220px] md:h-[220px] flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-full h-full rotate-[-90deg]">
        {traits.map((trait, i) => {
          const r = RING_RADII[i] || 45;
          const circumference = 2 * Math.PI * r;
          const fillRatio = total > 0 ? trait.count / maxCount : 0;
          const dashArray = `${fillRatio * circumference * 0.8}, ${circumference}`;
          const color = trait.colorRgb || FALLBACK_COLORS[i] || '#1ED36A';
          return (
            <React.Fragment key={i}>
              <circle cx="100" cy="100" r={r} fill="none" stroke="#e5e5e5" strokeWidth="10" strokeLinecap="round" className="dark:stroke-white/5" />
              <circle cx="100" cy="100" r={r} fill="none" stroke={color} strokeWidth="10" strokeDasharray={dashArray} strokeDashoffset={`-${i * 20}`} strokeLinecap="round" />
            </React.Fragment>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none mb-1">
        <span className="font-bold text-3xl text-[#150089] dark:text-[#1ED36A]">{total}</span>
        <span className="text-sm font-medium text-[#19211C] dark:text-white opacity-60">Total Users</span>
      </div>
    </div>
  );
};

const UserDistributionDonut = ({ data }: { data: UserDistributionData }) => {
  const traits = data.topTraits || [];
  return (
    <div className="w-full h-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-x-10 px-4 md:px-6">
      <div className="flex-shrink-0">
        <DonutChartSimple total={data.totalWithTraits} traits={traits} />
      </div>
      <div className="grid grid-cols-2 md:flex md:flex-col gap-x-6 gap-y-4 md:gap-6">
        {traits.map((trait, i) => (
          <div key={i} className="flex flex-col gap-0.5 md:gap-1 min-w-[120px] md:min-w-[160px]">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="w-2 md:w-2.5 h-5 md:h-6 rounded-full" style={{ backgroundColor: trait.colorRgb || FALLBACK_COLORS[i] }}></span>
              <span className="font-bold text-xl md:text-2xl text-[#19211C] dark:text-white leading-none">{trait.count}</span>
            </div>
            <span className="text-[12px] md:text-[15px] font-bold text-[#111812] dark:text-white/80 md:dark:text-white/90 pl-4 md:pl-6 leading-tight whitespace-nowrap tracking-wide uppercase">{trait.traitName}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive,
  isLoading,
  href
}) => {
  const content = (
    <div className="dashboard-glass-card p-6 relative overflow-hidden h-full group transition-all duration-300 hover:shadow-lg hover:shadow-brand-green/5 cursor-pointer">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 animate-pulse" />
      )}
      <h3 className="text-[#19211C] dark:text-white opacity-90 text-sm font-medium mb-2 group-hover:text-brand-green transition-colors">
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

  if (href) {
    return (
      <Link href={href}>
        {content}
      </Link>
    );
  }

  return content;
};


interface DashboardData {
  totalReadyToPayment: number;
  totalUsers: number;
  activeAssessments: number;
  corporateClients: number;
  totalCommissionsPaid: number;
  totalRevenue: number;
  revenueTrend: Array<{ month: string; revenue: number }>;
  userDistribution: UserDistributionData;
  affiliates: Array<{
    id: number;
    name: string;
    email: string;
    amount: number;
    mobileNumber: string;
    upiId?: string;
    bankName?: string;
    ready_to_process_commission?: number;
    total_settled_commission?: number;
    commission_percentage?: number;
  }>;
  recentExpiredAssessments: any[];
  todaysRegistrations: any[];
}


const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Settlement Modal State
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any | null>(null);
  
  // Extend Assessment Modal State
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [selectedExpiredSession, setSelectedExpiredSession] = useState<any | null>(null);

  const { theme } = useTheme();
  const isDark = theme === "dark";


  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/dashboard-stats");
      setData(res.data);
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

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    const s = 55 + (Math.abs(hash) % 20);
    const l = 45 + (Math.abs(hash) % 10);
    const hslToHex = (h: number, s: number, l: number) => {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = (n: number) => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `${f(0)}${f(8)}${f(4)}`;
    };
    return hslToHex(h, s, l);
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

  // Stats cards
  const stats: StatCardProps[] = [
    {
      title: "Total Users",
      value: loading ? "..." : (data?.totalUsers || 0).toLocaleString(),
      change: "Total",
      isPositive: true,
      isLoading: loading,
      href: "/admin/registrations"
    },
    {
      title: "Active Assessments",
      value: loading ? "..." : (data?.activeAssessments || 0).toLocaleString(),
      change: "This Week",
      isPositive: true,
      isLoading: loading,
      href: "/admin/registrations?tab=individual"
    },
    {
      title: "Corporate Clients",
      value: loading ? "..." : (data?.corporateClients || 0).toLocaleString(),
      change: "Total",
      isPositive: true,
      isLoading: loading,
      href: "/admin/corporate"
    },
    {
      title: "Total Revenue",
      value: loading ? "..." : formatCurrency(data?.totalRevenue || 0),
      change: "Last 12m",
      isPositive: true,
      isLoading: loading,
    },
    {
      title: "Total Commissions Paid",
      value: loading ? "..." : formatCurrency(data?.totalCommissionsPaid || 0),
      change: "Distributed",
      isPositive: true,
      isLoading: loading,
      href: "/admin/affiliates"
    },
  ];


  return (
    <div className="relative min-h-screen font-sans transition-colors duration-300 pb-12 flex flex-col gap-6">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {/* Bottom Grid: Settlements & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Affiliate Settlements */}
        <div className="lg:col-span-4 h-full">
          <div className="dashboard-glass-card h-full flex flex-col overflow-hidden min-h-[400px]">
            {/* Card Header */}
            <div className="px-6 pt-6 pb-4 flex justify-between items-center">
              <h3 className="font-semibold text-[#19211C] dark:text-white text-lg">
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
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(aff.name)}&background=${getAvatarColor(aff.name)}&color=fff&font-size=0.4`}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform"
                          />
                          <div>
                            <h4 className="font-semibold text-[#19211C] dark:text-white text-sm line-clamp-1">
                              {capitalizeWords(aff.name)}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">Ready:</span>
                              <span className="text-[#1ED36A] font-bold text-sm tracking-tight">
                                {formatCurrency(aff.amount)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => openSettlementModal(aff)}
                          className="bg-brand-green/10 hover:bg-brand-green text-brand-green hover:text-white w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
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

        {/* Right Side: Analytics */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue Trend Chart */}
            <div className="dashboard-glass-card p-6 min-h-[400px] flex flex-col">
              <h3 className="font-semibold text-[#19211C] dark:text-white text-lg mb-6">
                Platform Revenue Trend
              </h3>
              <div className="flex-grow w-full h-[300px]">
                {loading ? (
                   <div className="w-full h-full bg-gray-100 dark:bg-white/5 animate-pulse rounded-2xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.revenueTrend?.slice(-5) || []} margin={{ top: 10, right: 30, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1ED36A" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#1ED36A" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255, 255, 255, 0.05)" : "#E0E0E0"} />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: isDark ? "#FFFFFF" : "#19211C", fontSize: 13, fontWeight: 500 }}
                        dy={10}
                        interval={0}
                        minTickGap={5}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: isDark ? "#FFFFFF" : "#19211C", fontSize: 13, fontWeight: 500 }}
                        tickFormatter={(val) => {
                          if (val >= 100000) return `₹${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}L`;
                          if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                          return `₹${val}`;
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? "#242C27" : "rgba(255, 255, 255, 0.95)",
                          borderRadius: '16px',
                          border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
                          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                          padding: '12px 16px',
                          backdropFilter: 'blur(8px)',
                        }}
                        itemStyle={{
                          color: "#1ED36A",
                          fontSize: '14px',
                          fontWeight: 'bold',
                          padding: '0'
                        }}
                        labelStyle={{
                          color: isDark ? "#FFFFFF" : "#19211C",
                          fontSize: '12px',
                          fontWeight: 600,
                          marginBottom: '6px',
                          opacity: 0.8
                        }}
                        formatter={(val: any) => [formatCurrency(val || 0), 'Revenue']}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#1ED36A"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* User Distribution Chart */}
            <div className="dashboard-glass-card p-6 min-h-[400px] flex flex-col">
              <h3 className="font-semibold text-[#19211C] dark:text-white text-lg mb-6">
                User Growth & Demographics
              </h3>
              {loading ? (
                <div className="flex-grow flex items-center justify-center animate-pulse">
                  <div className="w-32 h-32 rounded-full border-4 border-gray-200" />
                </div>
              ) : data ? (
                <div className="flex-grow flex flex-col items-center justify-center">
                  <UserDistributionDonut data={data.userDistribution} />
                </div>
              ) : null}
            </div>
          </div>
          
          {/* Ready to Payment Summary */}
          <div className="dashboard-glass-card p-6 flex justify-between items-center">
            <div>
              <h4 className="text-[#19211C] dark:text-white opacity-80 text-sm font-medium">
                Ready to Payment
              </h4>
              <div className="text-2xl font-bold text-brand-text-light-primary dark:text-white mt-1">
                {formatCurrency(data?.totalReadyToPayment || 0)}
              </div>
            </div>
            <Link href="/admin/affiliates" className="bg-brand-green text-white px-8 py-2.5 rounded-full text-sm font-bold hover:bg-brand-green/90 transition-all shadow-md">
              Process Payments
            </Link>
          </div>
        </div>
      </div>

      {/* New Row: Today's Registrations & Expired Assessments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's New Registrations */}
        <div className="dashboard-glass-card flex flex-col overflow-hidden min-h-[400px]">
          <div className="px-6 pt-6 pb-4 flex justify-between items-center">
            <h3 className="font-semibold text-[#19211C] dark:text-white text-lg">
              Today's New Registrations
            </h3>
            <Link href="/admin/registrations" className="font-medium text-brand-green text-xs hover:underline">
              View All
            </Link>
          </div>
          <hr className="border-[#19211C]/10 dark:border-white/10" />
          <div className="flex-grow overflow-auto custom-scrollbar">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : !data?.todaysRegistrations || data.todaysRegistrations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-sm text-[#19211C]/60 dark:text-white/60">No registrations today yet.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {data.todaysRegistrations.map((reg) => (
                  <div key={reg.id} className="px-6 group even:bg-white/5 hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-200 border-b border-black/5 dark:border-white/5 last:border-0">
                    <div className="flex items-center py-4 gap-4">
                      {/* Column 1: Profile */}
                      <div className="flex items-center gap-3 w-[25%] min-w-0 shrink-0">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(reg.fullName || 'User')}&background=${getAvatarColor(reg.fullName || 'User')}&color=fff&font-size=0.4`}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-brand-light-tertiary dark:border-brand-dark-tertiary shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <h4 className="font-semibold text-[#19211C] dark:text-white text-sm truncate">
                            {reg.fullName || 'New User'}
                          </h4>
                        </div>
                      </div>

                      {/* Column 2: Email */}
                      <div className="w-[30%] min-w-0 flex items-center justify-center">
                        <p className="text-sm text-[#19211C] dark:text-white font-medium truncate max-w-full">
                          {reg.user?.email || 'No Email'}
                        </p>
                      </div>

                      {/* Column 3: Mobile (Flag + Code + Number) */}
                      <div className="w-[25%] min-w-0 flex items-center justify-center gap-2">
                        <div className="flex items-center gap-1.5 shrink-0">
                           <ReactCountryFlag
                              countryCode={COUNTRY_CODES.find(c => c.dial_code === (reg.country_code || reg.countryCode))?.code || 'IN'}
                              svg
                              style={{
                                  width: '1.2em',
                                  height: '1.2em',
                                  borderRadius: '2px',
                              }}
                            />
                            <span className="text-[12px] text-gray-500 dark:text-gray-400 font-bold whitespace-nowrap">
                              {reg.country_code || reg.countryCode || '+91'}
                            </span>
                        </div>
                        <span className="text-sm text-[#19211C] dark:text-white font-medium">
                          {reg.mobile_number || reg.mobileNumber || reg.phoneNumber || 'N/A'}
                        </span>
                      </div>

                      {/* Column 4: Time */}
                      <div className="w-[20%] text-right shrink-0">
                        <span className="text-[11px] font-medium text-gray-400">
                          {formatDistanceToNow(new Date(reg.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Expired Assessments */}
        <div className="dashboard-glass-card flex flex-col overflow-hidden min-h-[400px]">
          <div className="px-6 pt-6 pb-4 flex justify-between items-center">
            <h3 className="font-semibold text-[#19211C] dark:text-white text-lg">
              Recent Expired Assessments
            </h3>
            <Link href="/admin/registrations?tab=individual" className="font-medium text-brand-green text-xs hover:underline">
              View All
            </Link>
          </div>
          <hr className="border-[#19211C]/10 dark:border-white/10" />
          <div className="flex-grow overflow-auto custom-scrollbar">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : !data?.recentExpiredAssessments || data.recentExpiredAssessments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-sm text-[#19211C]/60 dark:text-white/60">No recent expired assessments.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {data.recentExpiredAssessments.map((session) => (
                  <div key={session.id} className="px-6 group even:bg-white/5 hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-200 border-b border-black/5 dark:border-white/5 last:border-0">
                    <div className="flex items-center py-4 gap-4">
                      {/* Column 1: Profile */}
                      <div className="flex items-center gap-3 w-[25%] min-w-0 shrink-0">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(session.registration?.fullName || 'User')}&background=${getAvatarColor(session.registration?.fullName || 'User')}&color=fff&font-size=0.4`}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-brand-light-tertiary dark:border-brand-dark-tertiary shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <h4 className="font-semibold text-[#19211C] dark:text-white text-sm truncate">
                            {session.registration?.fullName || session.user?.email || 'Student'}
                          </h4>
                        </div>
                      </div>

                      {/* Column 2: Email */}
                      <div className="w-[30%] min-w-0 flex items-center justify-center">
                        <p className="text-sm text-[#19211C] dark:text-white font-medium truncate max-w-full">
                          {session.user?.email || 'No Email'}
                        </p>
                      </div>

                      {/* Column 3: Mobile (Flag + Code + Number) */}
                      <div className="w-[25%] min-w-0 flex items-center justify-center gap-2">
                        <div className="flex items-center gap-1.5 shrink-0">
                           <ReactCountryFlag
                              countryCode={COUNTRY_CODES.find(c => c.dial_code === (session.registration?.country_code || session.registration?.countryCode))?.code || 'IN'}
                              svg
                              style={{
                                  width: '1.2em',
                                  height: '1.2em',
                                  borderRadius: '2px',
                              }}
                            />
                            <span className="text-[12px] text-gray-500 dark:text-gray-400 font-bold whitespace-nowrap">
                              {session.registration?.country_code || session.registration?.countryCode || '+91'}
                            </span>
                        </div>
                        <span className="text-sm text-[#19211C] dark:text-white font-medium">
                          {session.registration?.mobile_number || session.registration?.mobileNumber || session.registration?.phoneNumber || 'N/A'}
                        </span>
                      </div>

                      {/* Column 4: Expiry Action */}
                      <div className="w-[20%] text-right flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-red-500 font-bold whitespace-nowrap">
                          Expired {formatDistanceToNow(new Date(session.validTo), { addSuffix: true })}
                        </span>
                        <button 
                          onClick={() => {
                            setSelectedExpiredSession(session);
                            setExtendModalOpen(true);
                          }}
                          className="px-3 py-1 bg-brand-green text-white text-[10px] font-bold rounded-lg hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/20"
                        >
                          Extend
                        </button>
                      </div>


                    </div>
                  </div>
                ))}
              </div>
            )}
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

      {/* Extend Assessment Modal */}
      {extendModalOpen && selectedExpiredSession && (
        <ExtendAssessmentModal
          session={selectedExpiredSession}
          onClose={() => {
            setExtendModalOpen(false);
            setSelectedExpiredSession(null);
          }}
          onSuccess={() => {
            setExtendModalOpen(false);
            setSelectedExpiredSession(null);
            fetchStats(); // Refresh dashboard data
          }}
        />
      )}
    </div>

  );
};

export default AdminDashboard;
