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
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    if (user && user.id) {
                        const status = await studentService.getAssessmentStatus(user.id);

                        // Condition: If not completed, force assessment screen
                        if (!status.isCompleted && currentView !== 'assessment') {
                            router.push('/student/assessment');
                        }
                        // Condition: If completed, and trying to view assessment, maybe allow viewing results? 
                        // Prompt says: "Redirect to the dashboard on after the all the exam levels has been completed"
                        // It implies the transition happens upon completion. Re-visiting assessment might be allowed (results).
                        // But explicitly: "Even if it is not started show assesment level screen only."
                        // So if NOT started/completed, force assessment.
                        // If Completed, Dashboard is allowed.
                    }
                } catch (e) {
                    console.error("Error checking assessment status", e);
                }
            }
            setCheckingStatus(false);
        };

        checkStatus();
    }, [currentView, router]);

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
