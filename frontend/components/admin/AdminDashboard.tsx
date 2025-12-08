import React from "react";

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive,
}) => (
  <div className="bg-brand-light-secondary dark:bg-brand-dark-secondary p-6 rounded-2xl border border-brand-light-tertiary dark:border-white/5">
    <h3 className="text-brand-text-light-secondary dark:text-brand-text-secondary text-sm font-medium mb-2">
      {title}
    </h3>
    <div className="flex items-end justify-between">
      <div className="text-3xl font-bold text-brand-text-light-primary dark:text-white">
        {value}
      </div>
      <div
        className={`text-xs font-bold px-2 py-1 rounded-full ${
          isPositive
            ? "bg-green-500/10 text-green-500"
            : "bg-red-500/10 text-red-500"
        }`}
      >
        {change}
      </div>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  // later you can fetch these from API
  const stats: StatCardProps[] = [
    { title: "Total Users", value: "24,592", change: "+12% this month", isPositive: true },
    { title: "Active Assessments", value: "1,840", change: "+5% this week", isPositive: true },
    { title: "Corporate Clients", value: "142", change: "+2 new", isPositive: true },
    { title: "System Load", value: "34%", change: "-2% load", isPositive: true },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-text-light-primary dark:text-white">
          Admin Overview
        </h1>
        <p className="text-brand-text-light-secondary dark:text-brand-text-secondary text-sm">
          System statistics and platform health.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {/* Placeholder panel */}
      <div className="bg-brand-light-secondary dark:bg-brand-dark-secondary rounded-2xl p-6 border border-brand-light-tertiary dark:border-white/5 min-h-[400px] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-brand-light-tertiary dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-brand-text-light-secondary dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-brand-text-light-primary dark:text-white">
            Admin Modules Coming Soon
          </h3>
          <p className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary mt-1">
            Detailed analytics and user management interfaces are under
            development.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
