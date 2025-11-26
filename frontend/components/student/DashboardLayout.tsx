import React from "react";
import Header from "@/components/student/Header";
import Dashboard from "@/components/student/Dashboard";

interface DashboardLayoutProps {
  onLogout: () => void;
  currentView?: "dashboard" | "assessment";
  onNavigate?: (view: "dashboard" | "assessment") => void;
  hideNav?: boolean;
  children?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onLogout, currentView, onNavigate, hideNav, children }) => {
    return (
        <div className="bg-brand-light-primary dark:bg-brand-dark-primary h-screen flex flex-col overflow-hidden">
            <div className="shrink-0 z-50">
                <Header onLogout={onLogout} currentView={currentView} onNavigate={onNavigate} hideNav={hideNav} />
            </div>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide relative">
                {children ? children : <Dashboard />}
            </main>
        </div>
    );
};

export default DashboardLayout;
