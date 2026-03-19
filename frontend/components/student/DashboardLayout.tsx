import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { studentService } from '../../lib/services/student.service';
import Header from "./Header";
import Dashboard from "./Dashboard";

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
        <div className="relative min-h-screen w-full bg-transparent dark:bg-[#19211C] font-sans selection:bg-brand-green/20 overflow-x-hidden">

            <div className="w-full min-h-screen lg:[zoom:0.85] xl:[zoom:0.9] 2xl:[zoom:1.0]">
                {/* Header is Fixed inside the component */}
                <div className="fixed top-0 left-0 right-0 z-50">
                    <Header onLogout={onLogout} currentView={currentView} onNavigate={onNavigate} hideNav={hideNav} />
                </div>

                {/* Content Area with Top Padding for Fixed Header */}
                <main className="relative z-10 w-full min-h-screen pt-[clamp(70px,7.6vh,100px)] portal-bg">
                    <div className="w-full h-full max-w-[2000px] mx-auto transition-all duration-300 relative">
                        {children ? children : <Dashboard />}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
