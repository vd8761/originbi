import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { studentService } from "@/lib/services/student.service";
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
    const router = useRouter();
    const [checkingStatus, setCheckingStatus] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            // 1. Check Session Storage Flag (Fastest)
            if (sessionStorage.getItem('isAssessmentMode') === 'true') {
                if (currentView !== 'assessment') {
                    router.push('/student/assessment');
                    return;
                }
            }

            // 2. Validate with Backend (Robust)
            const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
            if (email) {
                try {
                    const status = await studentService.checkLoginStatus(email);

                    if (status?.isAssessmentMode) {
                        sessionStorage.setItem('isAssessmentMode', 'true');
                        if (currentView !== 'assessment') {
                            router.push('/student/assessment');
                        }
                    } else {
                        sessionStorage.removeItem('isAssessmentMode');
                    }
                } catch (e) {
                    console.error("Error checking assessment status", e);
                }
            }
            setCheckingStatus(false);
        };

        checkStatus();
    }, [currentView, router]);

    if (checkingStatus) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-brand-dark-primary">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
            </div>
        );
    }

    return (
        <div className="bg-[url('/Background_Light_Theme.svg')] bg-cover bg-center bg-no-repeat bg-fixed dark:bg-none dark:bg-brand-dark-primary min-h-screen flex flex-col font-sans selection:bg-brand-green/20">
            {/* Header is Fixed inside the component */}
            <div className="z-50">
                <Header onLogout={onLogout} currentView={currentView} onNavigate={onNavigate} hideNav={hideNav} />
            </div>

            {/* Content Area with Top Padding for Fixed Header */}
            <main className="flex-1 pt-[72px] sm:pt-[80px] lg:pt-[88px] relative">
                <div className="w-full h-full px-4 py-4 sm:px-6 sm:py-6 lg:px-[1.666vw] lg:py-[1.666vw] max-w-[2000px] mx-auto">
                    {children ? children : <Dashboard />}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
