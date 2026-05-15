import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { studentService } from '../../lib/services/student.service';
import PersonalityCard from './PersonalityCard';
import ConsultantCallCard from './ConsultantCallCard';
import RoadmapsCard from './RoadmapsCard';
import MoodCard from './MoodCard';
import MyJobsCard from './MyJobsCard';
import ImpactAssessmentCard from './ImpactAssessmentCard';
import TopCollegesCard from './TopCollegesCard';
import DebriefPromoToast from './DebriefPromoToast';

const FINAL_ASSESSMENT_COMPLETION_NOTICE_KEY = 'finalAssessmentCompletionNotice';
const REPORT_READY_STORAGE_KEY = 'studentReportReady';
const DASHBOARD_NOTICE_DELAY_MS = 2000;
const FINAL_ASSESSMENT_COUNT_THRESHOLD = 2;
const FORCE_SHOW_COMPLETION_NOTICE_FOR_TESTING = false;
const ASSESSMENT_COMPLETION_SOUND_SRC = '/sounds/dragon-studio-new-notification-3-398649.mp3';

type CompletionAudioWindow = Window & {
    __completionNoticeAudio?: HTMLAudioElement;
};

type AssessmentCompletionNoticePayload = {
    source?: string;
    completedCount?: number;
    completionPercentage?: number;
    completedAt?: number;
};

const playAssessmentCompletionSound = () => {
    if (typeof window === 'undefined') return;

    try {
        const audioWindow = window as CompletionAudioWindow;
        if (!audioWindow.__completionNoticeAudio) {
            const persistentAudio = new Audio(ASSESSMENT_COMPLETION_SOUND_SRC);
            persistentAudio.preload = 'auto';
            persistentAudio.volume = 0.9;
            audioWindow.__completionNoticeAudio = persistentAudio;
        }

        const audio = audioWindow.__completionNoticeAudio;
        audio.currentTime = 0;

        void audio.play().catch((playbackError) => {
            console.warn('Unable to play completion mp3 immediately, waiting for interaction', playbackError);

            const retryPlayback = () => {
                window.removeEventListener('pointerdown', retryPlayback);
                window.removeEventListener('keydown', retryPlayback);
                audio.currentTime = 0;
                void audio.play().catch((retryError) => {
                    console.warn('Completion mp3 retry failed, using fallback tone', retryError);
                    playFallbackCompletionTone();
                });
            };

            window.addEventListener('pointerdown', retryPlayback, { once: true });
            window.addEventListener('keydown', retryPlayback, { once: true });

            playFallbackCompletionTone();
        });
    } catch (error) {
        console.warn('Unable to initialize completion mp3 playback', error);
        playFallbackCompletionTone();
    }
};

const playFallbackCompletionTone = () => {
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
        console.warn('Unable to play fallback assessment completion tone', error);
    }
};

const Dashboard: React.FC = () => {
    const router = useRouter();
    const [isSchool, setIsSchool] = useState(false);
    const [isProgramLoading, setIsProgramLoading] = useState(true);
    const [reportData, setReportData] = useState<any>(null);
    const [isLoadingReport, setIsLoadingReport] = useState(true);
    const [showCompletionNotice, setShowCompletionNotice] = useState(false);

    useEffect(() => {
        const checkProgram = async () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);

                    // Fetch report data if not already fetched
                    if (user.id && !reportData) {
                        setIsLoadingReport(true);
                        const data = await studentService.getStudentReport(user.id);
                        if (data) {
                            setReportData(data);
                        }
                        setIsLoadingReport(false);
                    } else {
                        setIsLoadingReport(false);
                    }

                    if (user.programCode) {
                        const code = (user.programCode || '').toUpperCase();
                        setIsSchool(code.includes('SCHOOL'));
                        setIsProgramLoading(false);
                        return true;
                    }
                    if (Object.prototype.hasOwnProperty.call(user, 'id')) {
                        setIsProgramLoading(false);
                        return true;
                    }
                } catch (e) {
                    console.error("Error parsing user or fetching report", e);
                    setIsLoadingReport(false);
                }
            } else {
                setIsLoadingReport(false);
            }
            return false;
        };

        const init = async () => {
            if (!(await checkProgram())) {
                const interval = setInterval(async () => {
                    if (await checkProgram()) clearInterval(interval);
                }, 500);
                const timeout = setTimeout(() => {
                    clearInterval(interval);
                    setIsProgramLoading(false);
                }, 5000);
                return () => { clearInterval(interval); clearTimeout(timeout); };
            }
            setIsProgramLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        const triggerCompletionNotice = () => {
            setShowCompletionNotice(true);
            playAssessmentCompletionSound();
        };

        const rawNotice = sessionStorage.getItem(FINAL_ASSESSMENT_COMPLETION_NOTICE_KEY);
        if (!rawNotice) {
            if (!FORCE_SHOW_COMPLETION_NOTICE_FOR_TESTING) {
                return;
            }

            const timeoutId = window.setTimeout(() => {
                triggerCompletionNotice();
            }, DASHBOARD_NOTICE_DELAY_MS);

            return () => {
                window.clearTimeout(timeoutId);
            };
        }

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
            triggerCompletionNotice();
        }, DASHBOARD_NOTICE_DELAY_MS);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, []);

    return (
        <div className="relative bg-transparent dark:bg-[#19211C] font-sans transition-colors duration-300 overflow-hidden pb-10">
            <DebriefPromoToast />
            {showCompletionNotice && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center px-4 animate-fade-in">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowCompletionNotice(false)}
                    />

                    <div className="relative bg-white dark:bg-[#1A1D21] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-brand-light-tertiary dark:border-white/10 text-center flex flex-col items-center animate-notice-pop">
                        <div className="relative w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mb-6 border border-brand-green/20">
                            <div className="notice-sparkles" aria-hidden="true">
                                <span className="notice-sparkle-dot" />
                                <span className="notice-sparkle-dot" />
                                <span className="notice-sparkle-dot" />
                                <span className="notice-sparkle-dot" />
                            </div>

                            <div className="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center shadow-lg shadow-brand-green/30 animate-notice-icon-pop">
                                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-brand-text-light-primary dark:text-white mb-2">
                            Assessment Completed!
                        </h2>
                        <p className="text-brand-text-light-secondary dark:text-gray-300 mb-8 text-sm leading-relaxed">
                            You&apos;ve successfully completed the assessment. Your report is being processed and will be shared to your registered mail ID.
                        </p>

                        <button
                            onClick={() => {
                                setShowCompletionNotice(false);
                                sessionStorage.setItem(REPORT_READY_STORAGE_KEY, 'true');
                                localStorage.setItem(REPORT_READY_STORAGE_KEY, 'true');
                                sessionStorage.removeItem('isAssessmentMode');
                                router.push('/student/assessment');
                            }}
                            className="w-full py-3.5 rounded-full bg-brand-green text-white font-bold text-sm hover:bg-brand-green/90 transition-colors shadow-lg shadow-brand-green/20"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full flex-grow flex items-center justify-center min-h-[60vh]">
                {isProgramLoading ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green"></div>
                        <p className="text-brand-text-light-secondary dark:text-white/60 font-medium animate-pulse">
                            Initializing your dashboard...
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-[1.666vw] w-full auto-rows-auto">
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
                        <ConsultantCallCard isSchool={isSchool} />
                    </div>
                </>
            ) : (
                <>
                    <div className="col-span-1 md:col-span-1 lg:col-span-3 h-full">
                        <ConsultantCallCard isSchool={isSchool} />
                    </div>
                    <div className="col-span-1 md:col-span-1 lg:col-span-3 h-full">
                        <RoadmapsCard reportData={reportData} isLoadingReport={isLoadingReport} isSchool={isSchool} />
                    </div>
                </>
            )}

            {/* Row 2 */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 h-full">
                {isSchool ? (
                    <RoadmapsCard reportData={reportData} isLoadingReport={isLoadingReport} isSchool={isSchool} />
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
                )}
            </div>
        </div>
    );
};

export default Dashboard;
