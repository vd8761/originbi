import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Video, ArrowRight } from 'lucide-react';
import { studentService } from '../../lib/services/student.service';

const DEBRIEF_TOAST_DISMISSED_KEY = 'debriefPromoToastDismissed';
const REPORT_READY_STORAGE_KEY = 'studentReportReady';

const DebriefPromoToast: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        const checkEligibility = async () => {
            // 1. Check if already dismissed in this session or permanently
            const dismissed = localStorage.getItem(DEBRIEF_TOAST_DISMISSED_KEY) === 'true';
            if (dismissed) return;

            // 2. Check if user is a school student
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            
            try {
                const user = JSON.parse(userStr);
                const programCode = (user.programCode || '').toUpperCase();
                const isSchool = programCode.includes('SCHOOL');
                if (!isSchool) return;

                // 3. Check if report is ready (assessment completed)
                const isReportReady = localStorage.getItem(REPORT_READY_STORAGE_KEY) === 'true';
                if (!isReportReady) return;

                // 4. Check if debrief is already booked
                if (user.email) {
                    const status = await studentService.getDebriefStatus(user.email);
                    if (status && status.booked) {
                        return;
                    }
                }

                // If all conditions met, show the toast with a slight delay for better UX
                setTimeout(() => {
                    setIsVisible(true);
                }, 1500);
            } catch (error) {
                console.error("Error checking debrief toast eligibility", error);
            }
        };

        checkEligibility();
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        setIsDismissed(true);
        localStorage.setItem(DEBRIEF_TOAST_DISMISSED_KEY, 'true');
    };

    const handleBookNow = () => {
        window.open('/debrief', '_blank');
    };

    if (!isVisible || isDismissed || typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed top-20 right-6 z-[40] w-full max-w-sm pointer-events-none">
            <div className="pointer-events-auto bg-white/95 dark:bg-[#24272B]/90 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-none border border-brand-green/20 dark:border-white/[0.08] overflow-hidden animate-in slide-in-from-right-full duration-500">
                <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-gray-900 dark:text-brand-text-primary leading-tight mb-1">
                                Unlock Your Expert Debrief
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-white leading-relaxed mb-4">
                                Get a personalised 1-on-1 expert session to decode your assessment results and map your career path.
                            </p>
                            
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleBookNow}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand-green hover:bg-brand-green/90 text-white text-xs font-bold rounded-xl transition-all group"
                                >
                                    Book Debrief
                                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                                </button>
                                
                                <button
                                    onClick={handleDismiss}
                                    className="text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:text-brand-text-secondary dark:hover:text-white transition-colors"
                                >
                                    Maybe later
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleDismiss}
                            className="shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Subtle Decorative Element */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-brand-green/5 rounded-full blur-2xl pointer-events-none" />
            </div>
        </div>,
        document.body
    );
};

export default DebriefPromoToast;
