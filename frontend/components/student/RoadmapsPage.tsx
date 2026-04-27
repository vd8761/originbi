import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowUpRightIcon, ArrowRightWithoutLineIcon } from '../icons';
import { RoadmapCardData, RoadmapDetailData } from '../../lib/types';
import RoadmapDetailView from './RoadmapDetailView';
import { studentService } from '../../lib/services/student.service';

// Main roadmap card for grid view
const RoadmapCard: React.FC<{ item: RoadmapCardData; onSelect: (id: string) => void }> = ({ item, onSelect }) => (
    <div
        className="group relative bg-white dark:bg-white/[0.08] border border-[#E2E8F0] dark:border-white/[0.08] hover:border-white dark:hover:border-white hover:bg-white/5 dark:hover:bg-white/[0.12] rounded-[12px] p-5 lg:p-6 transition-all duration-300 hover:shadow-lg dark:hover:shadow-none backdrop-blur-sm flex flex-col justify-center min-h-[120px] lg:min-h-[124px] cursor-pointer"
        onClick={() => onSelect(item.id)}
    >
        <div className="flex justify-between items-center gap-4">
            <div className="flex-1">
                <h3 className="font-semibold text-[#19211C] dark:text-white text-[clamp(16px,1.1vw,22px)] mb-2 leading-tight font-sans">
                    {item.title}
                </h3>
                <p className="text-[#19211C]/70 dark:text-white/80 text-[clamp(13px,0.85vw,17px)] leading-relaxed line-clamp-2 font-normal font-sans">
                    {item.description}
                </p>
            </div>
            <button
                className="bg-brand-green hover:bg-brand-green/90 text-white w-8 h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:scale-110 shadow-md shadow-brand-green/20 cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(item.id);
                }}
            >
                <ArrowUpRightIcon className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
        </div>
    </div>
);

const RoadmapsPage: React.FC = () => {
    const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);
    const [roadmaps, setRoadmaps] = useState<RoadmapCardData[]>([]);
    const [roadmapDetails, setRoadmapDetails] = useState<Record<string, RoadmapDetailData>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSchool, setIsSchool] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        const fetchRoadmaps = async () => {
            try {
                setLoading(true);
                const email = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
                if (!email) {
                    setError('User email not found. Please log in again.');
                    setLoading(false);
                    return;
                }

                // 1. Get student profile to get user id
                const profile = await studentService.getProfile(email);
                const userId = profile?.id || profile?.userId || profile?.user_id;

                if (!profile || !userId) {
                    setError('Student profile not found.');
                    setLoading(false);
                    return;
                }

                // Check if user is a school student
                let isSchoolUser = false;
                try {
                    const userStr = localStorage.getItem('user');
                    if (userStr) {
                        const user = JSON.parse(userStr);
                        if (user.programCode) {
                            isSchoolUser = user.programCode.toUpperCase().includes('SCHOOL');
                        }
                    }
                } catch (e) {
                    console.error('Error parsing user from localStorage', e);
                }

                setIsSchool(isSchoolUser);

                if (isSchoolUser) {
                    setLoading(false);
                    return;
                }


                // 2. Fetch the report which contains career guidance / roadmap
                const report = await studentService.getStudentReport(userId);
                if (!report || !report.sections?.careerGuidance) {
                    setError('No roadmap data available. Please complete your assessment first.');
                    setLoading(false);
                    return;
                }

                // 3. Map the report data to our local structures
                const apiRoadmaps = report.sections.careerGuidance;
                const newRoadmaps: RoadmapCardData[] = [];
                const newDetails: Record<string, RoadmapDetailData> = {};

                apiRoadmaps.forEach((role: any, index: number) => {
                    const id = (index + 1).toString();
                    
                    // Basic Card Data
                    newRoadmaps.push({
                        id,
                        title: role.roleName,
                        description: role.shortDescription,
                        category: role.roleName
                    });

                    // Detailed Data
                    const steps: any[] = [];
                    const guidelines: any[] = [];
                    let guidanceTip = "";
                    let overview = role.shortDescription;
                    let naturalStrengths = "";

                    (role.guidanceSections || []).forEach((section: any) => {
                        const titleLower = section.title.toLowerCase();
                        const content = section.content;

                        // Case: Overview
                        if (titleLower.includes('overview')) {
                            if (typeof content === 'string') {
                                overview = content;
                            } else if (Array.isArray(content)) {
                                overview = content.map(c => c.text || c.subtitle || c.bullets?.join(' ') || "").filter(Boolean).join(' ');
                            }
                            return;
                        }

                        // Case: Natural Strengths
                        if (titleLower.includes('natural strength')) {
                            if (typeof content === 'string') {
                                naturalStrengths = content;
                            } else if (Array.isArray(content)) {
                                naturalStrengths = content.map(c => c.text || c.subtitle || c.bullets?.join(' ') || "").filter(Boolean).join(' ');
                            }
                            return;
                        }

                        // Check if it's a roadmap step or a container for roadmap steps
                        if (titleLower.includes('foundation') || 
                            titleLower.includes('action') || 
                            titleLower.includes('advancement') || 
                            titleLower.includes('career entry')) {
                            
                            steps.push({
                                label: section.title,
                                type: titleLower.includes('foundation') ? 'foundation' : 
                                      titleLower.includes('action') ? 'action' :
                                      titleLower.includes('advancement') ? 'advancement' : 'career',
                                content: typeof content === 'string' ? content : (content[0]?.text || content[0]?.subtitle || content[0]?.bullets?.join(' ') || "")
                            });
                        } else if (titleLower.includes('roadmap')) {
                            
                            if (Array.isArray(content)) {
                                content.forEach((sub: any) => {
                                    const subTitle = (sub.subtitle || sub.text || "").toLowerCase();
                                    steps.push({
                                        label: sub.subtitle || sub.text || "Step",
                                        type: subTitle.includes('foundation') ? 'foundation' : 
                                              subTitle.includes('action') ? 'action' :
                                              subTitle.includes('advancement') ? 'advancement' : 'career',
                                        content: sub.text || sub.bullets?.join(' ') || ""
                                    });
                                });
                            }
                        } else if (titleLower.includes('guidance tip')) {
                            // Extract to standalone guidanceTip instead of guidelines
                            if (typeof content === 'string') {
                                guidanceTip = content;
                            } else if (Array.isArray(content)) {
                                guidanceTip = content.map(c => c.text || c.bullets?.join(' ') || c.tip || "").join(' ');
                            }
                        } else {
                            // Professional Guidelines
                            const points: string[] = [];
                            const subSections: { subtitle: string, points: string[] }[] = [];
                            
                            if (Array.isArray(content)) {
                                content.forEach((sub: any) => {
                                    const subTitle = (sub.subtitle || sub.text || "").toLowerCase();
                                    
                                    if (subTitle.includes('overview') || subTitle.includes('roadmap') || subTitle.includes('natural strength')) return;

                                    if (sub.bullets && (sub.subtitle || sub.text)) {
                                        subSections.push({
                                            subtitle: sub.subtitle || sub.text,
                                            points: sub.bullets
                                        });
                                    } else if (sub.bullets) {
                                        points.push(...sub.bullets);
                                    } else if (sub.text) {
                                        points.push(sub.text);
                                    }
                                    if (sub.tip) guidanceTip = sub.tip;
                                });
                            } else if (typeof content === 'string') {
                                points.push(content);
                            }
                            
                            if (points.length > 0 || subSections.length > 0) {
                                guidelines.push({
                                    title: section.title,
                                    points: points,
                                    sections: subSections.length > 0 ? subSections : undefined
                                });
                            }
                        }
                    });

                    newDetails[id] = {
                        id,
                        title: role.roleName,
                        category: role.roleName,
                        toolsToLearn: (role.tools || []).map((t: string) => ({ name: t, category: 'Skill/Tool' })),
                        overview: overview,
                        naturalStrengths: naturalStrengths,
                        roadmapSteps: steps,
                        guidelines: guidelines,
                        guidanceTip: guidanceTip
                    };
                });

                setRoadmaps(newRoadmaps);
                setRoadmapDetails(newDetails);
                
                // Check if there's a pre-selected ID in URL
                const idFromUrl = searchParams.get('id');
                if (idFromUrl && newDetails[idFromUrl]) {
                    setSelectedRoadmapId(idFromUrl);
                }
            } catch (err) {
                console.error('Error fetching roadmaps:', err);
                setError('Failed to load roadmaps. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchRoadmaps();
    }, [searchParams]);

    const handleSelectRoadmap = (id: string) => {
        setSelectedRoadmapId(id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBack = () => {
        setSelectedRoadmapId(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <p className="text-[#19211C] dark:text-white text-lg mb-4 text-center">{error}</p>
                <Link 
                    href="/student/assessment" 
                    className="bg-brand-green text-white px-6 py-2 rounded-lg hover:bg-brand-green/90 transition-colors"
                >
                    Go to Assessment
                </Link>
            </div>
        );
    }

    if (isSchool) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 space-y-6">
                <div className="w-24 h-24 rounded-full bg-brand-green/5 flex items-center justify-center mb-2">
                    <svg className="w-12 h-12 text-brand-green/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                </div>
                <div className="bg-brand-green/10 text-brand-green px-8 py-3 rounded-full font-bold text-lg shadow-sm transform transition-transform hover:scale-105">
                    Coming Soon
                </div>
                <p className="text-[#19211C]/60 dark:text-white/60 text-center max-w-md text-base">
                    Personalized career roadmaps are currently being developed for school students. Check back later!
                </p>
                <Link 
                    href="/student/dashboard" 
                    className="mt-4 bg-brand-green text-white px-6 py-2 rounded-lg hover:bg-brand-green/90 transition-colors"
                >
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    // If a roadmap is selected, show the detail view
    if (selectedRoadmapId && roadmapDetails[selectedRoadmapId]) {
        return (
            <RoadmapDetailView
                roadmap={roadmapDetails[selectedRoadmapId]}
                allRoadmaps={roadmaps}
                onBack={handleBack}
                onSelectRoadmap={handleSelectRoadmap}
            />
        );
    }

    return (
        <div className="w-full pb-10 mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
                <Link
                    href="/student/dashboard"
                    className="hover:text-gray-700 dark:hover:text-[#1ED36A] transition-colors"
                >
                    Dashboard
                </Link>
                <span className="mx-2 text-gray-400 dark:text-gray-600">
                    <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
                </span>
                <span className="text-brand-green font-semibold">Your Roadmaps</span>
            </div>

            {/* Header */}
            <div className="mb-6 lg:mb-8">
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#19211C] dark:text-white mb-1.5 font-sans">
                    Your Roadmaps
                </h1>
                <p className="text-[#19211C]/70 dark:text-white text-sm font-normal font-sans">
                    Explore personalized career paths aligned with your assessment results.
                </p>
            </div>

            {/* Roadmaps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5 xl:gap-6">
                {roadmaps.map((roadmap) => (
                    <RoadmapCard key={roadmap.id} item={roadmap} onSelect={handleSelectRoadmap} />
                ))}
            </div>
        </div>
    );
};

export default RoadmapsPage;
