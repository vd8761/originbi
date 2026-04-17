import React, { useEffect, useState } from 'react';
import { studentService } from '../../lib/services/student.service';
import PersonalityCard from './PersonalityCard';
import ConsultantCallCard from './ConsultantCallCard';
import RoadmapsCard from './RoadmapsCard';
import MoodCard from './MoodCard';
import MyJobsCard from './MyJobsCard';
import ImpactAssessmentCard from './ImpactAssessmentCard';
import TopCollegesCard from './TopCollegesCard';

const FINAL_ASSESSMENT_COMPLETION_NOTICE_KEY = 'finalAssessmentCompletionNotice';
const DASHBOARD_NOTICE_DELAY_MS = 2000;
const FINAL_ASSESSMENT_COUNT_THRESHOLD = 2;

type AssessmentCompletionNoticePayload = {
    source?: string;
    completedCount?: number;
    completionPercentage?: number;
    completedAt?: number;
};

const playAssessmentCompletionSound = () => {
    if (typeof window === 'undefined') return;

    try {
        const extendedWindow = window as Window & {
            webkitAudioContext?: typeof AudioContext;
        };

        const AudioContextClass = window.AudioContext || extendedWindow.webkitAudioContext;
        if (!AudioContextClass) return;

        const audioContext = new AudioContextClass();
        if (audioContext.state === 'suspended') {
            void audioContext.resume();
        }

        const playTone = (
            frequency: number,
            startTime: number,
            duration: number,
            gainValue: number,
        ) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, startTime);

            gainNode.gain.setValueAtTime(0.0001, startTime);
            gainNode.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };

        const startAt = audioContext.currentTime + 0.02;
        playTone(784, startAt, 0.12, 0.14);
        playTone(988, startAt + 0.14, 0.12, 0.12);
        playTone(1175, startAt + 0.28, 0.16, 0.10);

        window.setTimeout(() => {
            void audioContext.close();
        }, 900);
    } catch (error) {
        console.warn('Unable to play assessment completion sound', error);
    }
};

const Dashboard: React.FC = () => {
    const [isSchool, setIsSchool] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [showCompletionNotice, setShowCompletionNotice] = useState(false);

    useEffect(() => {
        const checkProgram = async () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);

                    // Fetch report data if not already fetched
                    if (user.id && !reportData && !isLoadingReport) {
                        setIsLoadingReport(true);
                        const data = await studentService.getStudentReport(user.id);
                        if (data) {
                            setReportData(data);
                        }
                        setIsLoadingReport(false);
                    }

                    if (user.programCode) {
                        const code = (user.programCode || '').toUpperCase();
                        setIsSchool(code.includes('SCHOOL'));
                        return true;
                    }
                    if (Object.prototype.hasOwnProperty.call(user, 'id')) return true;
                } catch (e) {
                    console.error("Error parsing user or fetching report", e);
                    setIsLoadingReport(false);
                }
            }
            return false;
        };

        const init = async () => {
            if (!(await checkProgram())) {
                const interval = setInterval(async () => {
                    if (await checkProgram()) clearInterval(interval);
                }, 500);
                const timeout = setTimeout(() => clearInterval(interval), 5000);
                return () => { clearInterval(interval); clearTimeout(timeout); };
            }
        };
        init();
    }, []);

    useEffect(() => {
        const rawNotice = sessionStorage.getItem(FINAL_ASSESSMENT_COMPLETION_NOTICE_KEY);
        if (!rawNotice) return;

        sessionStorage.removeItem(FINAL_ASSESSMENT_COMPLETION_NOTICE_KEY);

        let noticePayload: AssessmentCompletionNoticePayload | null = null;
        try {
            noticePayload = JSON.parse(rawNotice) as AssessmentCompletionNoticePayload;
        } catch {
            noticePayload = null;
        }

        if (
            noticePayload?.source !== 'final-assessment'
        ) {
            return;
        }

        const completedCount = Number(noticePayload?.completedCount || 0);
        if (completedCount < FINAL_ASSESSMENT_COUNT_THRESHOLD) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setShowCompletionNotice(true);
            playAssessmentCompletionSound();
        }, DASHBOARD_NOTICE_DELAY_MS);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, []);

    return (
        <div className="relative min-h-screen bg-transparent dark:bg-[#19211C] font-sans transition-colors duration-300 overflow-hidden p-4 sm:p-6 lg:p-8">
            {showCompletionNotice && (
                <div className="fixed top-20 left-4 right-4 sm:left-auto sm:right-8 sm:w-[460px] z-[120] animate-fade-in">
                    <div className="relative rounded-2xl border border-brand-green/30 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl shadow-2xl px-5 py-4">
                        <button
                            onClick={() => setShowCompletionNotice(false)}
                            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors flex items-center justify-center"
                            aria-label="Close notification"
                        >
                            <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        <div className="flex items-start gap-3 pr-6">
                            <div className="w-10 h-10 rounded-full bg-brand-green/15 border border-brand-green/30 flex items-center justify-center shrink-0 mt-0.5">
                                <svg className="w-5 h-5 text-brand-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-brand-text-light-primary dark:text-white">
                                    Assessment Completed Successfully
                                </h3>
                                <p className="mt-1 text-xs leading-relaxed text-brand-text-light-secondary dark:text-gray-300">
                                    Thank you for completing the full assessment process. Your personalized report is now being prepared and will be sent to your registered email address. Delivery may take a few minutes.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-[1.666vw] w-full auto-rows-auto">
            {/* 
              GRID SYSTEM (12 Columns Desktop / 2 Columns Tablet / 1 Column Mobile)
              
              Row 1:
              - Personality: 50% (6 cols) | Tablet: 100% (2 cols)
              - Consultant:  25% (3 cols) | Tablet: 50% (1 col)
              - Roadmaps:    25% (3 cols) | Tablet: 50% (1 col)
              
              Row 2 (College):
              - Mood:        33% (4 cols) | Tablet: 100% (2 cols)
              - My Jobs:     66% (8 cols) | Tablet: 100% (2 cols)

              Row 2 (School):
              - Roadmaps:            33% (4 cols)
              - Impact Assessment:   33% (4 cols)
              - Top Colleges:        33% (4 cols)
            */}

            {/* Row 1 */}
            <div className="col-span-1 md:col-span-2 lg:col-span-6 h-full">
                <PersonalityCard reportData={reportData} isLoadingReport={isLoadingReport} />
            </div>
            {isSchool ? (
                <>
                    <div className="col-span-1 md:col-span-1 lg:col-span-3 h-full">
                        <ImpactAssessmentCard reportData={reportData} isLoadingReport={isLoadingReport} />
                    </div>
                    <div className="col-span-1 md:col-span-1 lg:col-span-3 h-full">
                        <ConsultantCallCard />
                    </div>
                </>
            ) : (
                <>
                    <div className="col-span-1 md:col-span-1 lg:col-span-3 h-full">
                        <ConsultantCallCard />
                    </div>
                    <div className="col-span-1 md:col-span-1 lg:col-span-3 h-full">
                        <RoadmapsCard reportData={reportData} isLoadingReport={isLoadingReport} />
                    </div>
                </>
            )}

            {/* Row 2 */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 h-full">
                {isSchool ? (
                    <RoadmapsCard reportData={reportData} isLoadingReport={isLoadingReport} />
                ) : (
                    <MoodCard />
                )}
            </div>

            {isSchool && (
                <div className="col-span-1 md:col-span-2 lg:col-span-8 h-full">
                    <TopCollegesCard reportData={reportData} isLoadingReport={isLoadingReport} />
                </div>
            )}
            {!isSchool && (
                <div className="col-span-1 md:col-span-2 lg:col-span-8 h-full">
                    <MyJobsCard />
                </div>
            )}
            </div>
        </div>
    );
};

export default Dashboard;
