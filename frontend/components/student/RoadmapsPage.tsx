'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowUpRightIcon, ArrowRightWithoutLineIcon } from '@/components/icons';

interface RoadmapCardData {
    id: string;
    title: string;
    description: string;
    category?: string;
}

interface RoadmapDetailData {
    id: string;
    title: string;
    category: string;
    toolsToLearn: { name: string; category: string }[];
    overview: string;
    traitAlignment: string;
    roadmapSteps: { label: string; type: 'foundation' | 'action' | 'advancement' | 'career'; content: string }[];
    guidelines: { title: string; points: string[] }[];
    guidanceTip: string;
}

// Hardcoded detailed roadmap data for demonstration
const roadmapDetails: Record<string, RoadmapDetailData> = {
    '1': {
        id: '1',
        title: 'Product Manager Tech',
        category: 'Product Manager',
        toolsToLearn: [
            { name: 'Jira, Trello, Asana', category: 'Project Management' },
            { name: 'Figma, Adobe XD', category: 'Design & Prototyping' },
            { name: 'Slack, Microsoft Teams', category: 'Team Communication' },
            { name: 'Google Analytics', category: 'Product Metrics & Data' },
        ],
        overview: 'A Product Manager leads cross-functional teams to bring innovative technology products to market. They strategize, manage development, oversee launch phases, and ensure continuous improvement.',
        traitAlignment: 'This career suits you well, leveraging your leadership qualities, decision-making strength, and communication skills.',
        roadmapSteps: [
            { label: 'Foundation', type: 'foundation', content: 'Learn Agile methodologies, UX/UI design basics, software development processes, and business analysis fundamentals.' },
            { label: 'Action Steps', type: 'action', content: 'Engage in campus leadership roles, attend product management workshops, and participate in collaborative projects.' },
            { label: 'Advancement', type: 'advancement', content: 'Secure internships in product-focused roles and obtain certifications like Certified Scrum Product Owner (CSPO).' },
            { label: 'Career Entry', type: 'career', content: 'Begin your professional journey as an Associate Product Manager, gradually moving up to senior roles.' },
            { label: 'Career Entry', type: 'career', content: 'Begin your professional journey as an Associate Product Manager, gradually moving up to senior roles.' },
        ],
        guidelines: [
            {
                title: "What's the secret mindset to becoming a standout IT Product Manager?",
                points: [
                    'Always put your users first—think from their perspective.',
                    'Keep your ego aside—listen openly and adapt quickly.',
                    'Embrace failures as stepping stones to success.',
                    'Cultivate curiosity—never stop exploring new tech trends.',
                    "Stay confidently humble—assert your ideas while valuing others' inputs.",
                ],
            },
            {
                title: 'Want to become an exceptional product leader? Develop these daily habits:',
                points: [
                    'Brainstorm fresh product ideas weekly.',
                    'Regularly interview users to deeply understand their needs.',
                    'Document your learnings and reflect weekly.',
                    'Spend daily time observing market trends and competitors.',
                    'Engage proactively in product discussions online.',
                ],
            },
            {
                title: 'How much time should you realistically dedicate weekly to thrive?',
                points: [
                    'Skill-building & new concepts exploration (8–10 hours/week)',
                    'Hands-on product practice through real or simulated projects (6–8 hours/week)',
                    'Networking, community, and portfolio development (2–3 hours/week)',
                    'Total (~15–20 hours/week)',
                ],
            },
            {
                title: 'Recommended Events for Aspiring Product Managers in India',
                points: [
                    'Product Leaders Forum, Bangalore',
                    'Nasscom Product Conclave, Bangalore',
                    'DesignUp Conference, Bangalore',
                    'India Product Management Summit, Mumbai',
                ],
            },
            {
                title: 'Must-Read Books for Product Managers',
                points: [
                    '"Inspired" by Marty Cagan',
                    '"Hooked" by Nir Eyal',
                    '"The Lean Startup" by Eric Ries',
                    '"Measure What Matters" by John Doerr',
                ],
            },
            {
                title: 'Essential Tools to Start Mastering',
                points: [
                    'Jira, Trello, or Asana (Project Management)',
                    'Figma or Adobe XD (Design & Prototyping)',
                    'Slack or Microsoft Teams (Communication)',
                    'Google Analytics (Product Metrics)',
                ],
            },
        ],
        guidanceTip: 'As a Product Manager, your ability to inspire teams, navigate complexity, and clearly communicate product vision is key. Cultivate empathy for users, foster collaborative relationships, and remain flexible and responsive to market shifts. Your consistent effort and adaptability will position you to excel and innovate in tech leadership.',
    },
    '2': {
        id: '2',
        title: 'UX/UI Designer',
        category: 'Design',
        toolsToLearn: [
            { name: 'Figma, Sketch', category: 'Design Tools' },
            { name: 'Adobe Creative Suite', category: 'Graphics & Illustration' },
            { name: 'InVision, Principle', category: 'Prototyping' },
            { name: 'Hotjar, Maze', category: 'User Research' },
        ],
        overview: 'A UX/UI Designer creates intuitive and visually appealing digital experiences. They conduct user research, design interfaces, and ensure products are user-friendly and accessible.',
        traitAlignment: 'This career leverages your creativity, attention to detail, and empathy for users.',
        roadmapSteps: [
            { label: 'Foundation', type: 'foundation', content: 'Learn design principles, color theory, typography, and basic coding (HTML/CSS).' },
            { label: 'Action Steps', type: 'action', content: 'Build a portfolio with personal projects, participate in design challenges, and seek feedback.' },
            { label: 'Advancement', type: 'advancement', content: 'Complete UX certifications, intern at design studios, and specialize in a niche.' },
            { label: 'Career Entry', type: 'career', content: 'Start as a Junior Designer and progress to Senior or Lead Designer roles.' },
        ],
        guidelines: [
            {
                title: 'Core skills every UX/UI Designer should master:',
                points: [
                    'Visual design and layout composition',
                    'User research and persona development',
                    'Wireframing and prototyping',
                    'Accessibility standards (WCAG)',
                    'Design systems and component libraries',
                ],
            },
        ],
        guidanceTip: 'Great design comes from understanding people. Continuously learn, iterate, and stay curious about how users interact with your designs.',
    },
};

// Generate similar data for other IDs
for (let i = 3; i <= 7; i++) {
    roadmapDetails[i.toString()] = {
        ...roadmapDetails['1'],
        id: i.toString(),
        title: `Product Manager ${i}`,
    };
}

// Small card for "Explore Other Roadmaps" section
const ExploreRoadmapCard: React.FC<{ item: RoadmapCardData; onSelect: (id: string) => void; isActive?: boolean; isLast?: boolean }> = ({ item, onSelect, isActive, isLast }) => (
    <div className="relative">
        <div
            className={`group relative py-3 px-4 transition-all duration-300 cursor-pointer ${isActive
                ? 'bg-[#19211C]/5 dark:bg-white/10' // Active: Light gray in light mode, translucent white in dark mode
                : 'bg-transparent hover:bg-[#19211C]/5 dark:hover:bg-white/5' // Inactive: Transparent with hover effect
                }`}
            onClick={() => onSelect(item.id)} // Allowing card click to select as it's more intuitive for a sidebar list item
        >
            <div className="flex justify-between items-center gap-3">
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[#19211C] dark:text-white text-[14px] mb-0.5 truncate">
                        {item.title}
                    </h4>
                    <p className="text-black dark:text-white text-[12px] leading-snug line-clamp-2">
                        {item.description}
                    </p>
                </div>
                <button
                    className="bg-brand-green hover:bg-brand-green/90 text-white w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:scale-110 shadow-md shadow-brand-green/20 cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(item.id);
                    }}
                >
                    <ArrowUpRightIcon className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
        {/* Separator Line for Inactive items (unless it's the last one) - Placed outside the padding */}
        {!isActive && !isLast && (
            <div className="mx-4 h-px bg-[#19211C]/10 dark:bg-white/10"></div>
        )}
    </div>
);

// Main roadmap card for grid view
const RoadmapCard: React.FC<{ item: RoadmapCardData; onSelect: (id: string) => void }> = ({ item, onSelect }) => (
    <div
        className="group relative bg-white/40 dark:bg-black/20 border border-white/20 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/10 hover:border-white/60 dark:hover:border-white/50 rounded-2xl p-4 lg:p-5 transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] dark:hover:shadow-none backdrop-blur-md"
    >
        <div className="flex justify-between items-center gap-4">
            <div className="flex-1">
                <h3 className="font-semibold text-[#19211C] dark:text-white text-[16px] mb-1">
                    {item.title}
                </h3>
                <p className="text-[#19211C]/80 dark:text-white/70 text-[12px] leading-relaxed">
                    {item.description}
                </p>
            </div>
            <button
                className="bg-brand-green hover:bg-brand-green/90 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:scale-110 shadow-lg shadow-brand-green/20 cursor-pointer"
                onClick={() => onSelect(item.id)}
            >
                <ArrowUpRightIcon className="w-4 h-4" />
            </button>
        </div>
    </div>
);

// Roadmap Detail View Component
const RoadmapDetailView: React.FC<{
    roadmap: RoadmapDetailData;
    allRoadmaps: RoadmapCardData[];
    onBack: () => void;
    onSelectRoadmap: (id: string) => void;
}> = ({ roadmap, allRoadmaps, onBack, onSelectRoadmap }) => {
    return (
        <div className="min-h-screen bg-[url('/Background_Light_Theme.svg')] bg-cover bg-center bg-no-repeat bg-fixed dark:bg-none dark:bg-brand-dark-primary">
            <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-12 lg:py-10">
                {/* Breadcrumb */}
                <nav className="mb-6 lg:mb-[1.5vw]">
                    <ol className="flex items-center flex-wrap gap-2 text-[clamp(11px,0.75vw,13px)]">
                        <li>
                            <Link
                                href="/student/dashboard"
                                className="text-[#19211C]/60 dark:text-brand-text-secondary hover:text-[#19211C] dark:hover:text-brand-text-primary transition-colors"
                            >
                                Dashboard
                            </Link>
                        </li>
                        <li className="text-[#19211C]/40 dark:text-brand-text-secondary"><ArrowRightWithoutLineIcon className="w-3 h-3" /></li>
                        <li>
                            <button
                                onClick={onBack}
                                className="text-[#19211C]/60 dark:text-brand-text-secondary hover:text-[#19211C] dark:hover:text-brand-text-primary transition-colors"
                            >
                                Your Roadmap
                            </button>
                        </li>
                        <li className="text-[#19211C]/40 dark:text-brand-text-secondary"><ArrowRightWithoutLineIcon className="w-3 h-3" /></li>
                        <li className="text-brand-green font-medium">{roadmap.category}</li>
                    </ol>
                </nav>

                {/* Main Content Grid */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                    {/* Left Content - Detail Section */}
                    <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h1 className="text-[18px] font-bold text-[#19211C] dark:text-brand-text-primary mb-6 lg:mb-8">
                            {roadmap.title}
                        </h1>

                        {/* Tools to Learn */}
                        <section className="mb-6 lg:mb-8">
                            <h2 className="text-[18px] font-semibold text-[#19211C] dark:text-brand-text-primary mb-3">
                                Tools to Learn
                            </h2>
                            <div className="space-y-1">
                                {roadmap.toolsToLearn.map((tool, idx) => (
                                    <p key={idx} className="text-[16px] text-black dark:text-white">
                                        <span className="font-medium text-black dark:text-white">{tool.name}</span>
                                        <span className="text-black dark:text-white/80"> ({tool.category})</span>
                                    </p>
                                ))}
                            </div>
                        </section>

                        {/* Overview */}
                        <section className="mb-6 lg:mb-8">
                            <h2 className="text-[18px] font-semibold text-[#19211C] dark:text-brand-text-primary mb-3">
                                Overview
                            </h2>
                            <p className="text-[16px] text-black dark:text-white leading-relaxed">
                                {roadmap.overview}
                            </p>
                        </section>

                        {/* Trait Alignment */}
                        <section className="mb-6 lg:mb-8">
                            <h2 className="text-[18px] font-semibold text-[#19211C] dark:text-brand-text-primary mb-3">
                                Trait Alignment
                            </h2>
                            <p className="text-[16px] text-black dark:text-white leading-relaxed">
                                {roadmap.traitAlignment}
                            </p>
                        </section>

                        {/* Roadmap & Fundamental Learning */}
                        <section className="mb-6 lg:mb-8">
                            <h2 className="text-[18px] font-semibold text-[#19211C] dark:text-brand-text-primary mb-4">
                                Roadmap & Fundamental Learning
                            </h2>
                            <div className="space-y-3">
                                {roadmap.roadmapSteps.map((step, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <span className="w-2 h-2 mt-2 rounded-full bg-brand-green flex-shrink-0"></span>
                                        <p className="text-[16px] text-black dark:text-white leading-relaxed">
                                            <span className="font-semibold text-black dark:text-white">{step.label}:</span>{' '}
                                            {step.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Detailed Guidelines */}
                        <section className="mb-6 lg:mb-8">
                            <h2 className="text-[18px] font-semibold text-[#19211C] dark:text-brand-text-primary mb-4">
                                Detailed Guidelines
                            </h2>
                            <div className="space-y-6">
                                {roadmap.guidelines.map((guideline, gIdx) => (
                                    <div key={gIdx}>
                                        <h3 className="text-[16px] font-semibold text-[#19211C] dark:text-brand-text-primary mb-3">
                                            {gIdx + 1}. {guideline.title}
                                        </h3>
                                        <ul className="space-y-2 ml-1">
                                            {guideline.points.map((point, pIdx) => (
                                                <li key={pIdx} className="flex items-start gap-3">
                                                    <span className="w-2 h-2 mt-1.5 rounded-full bg-brand-green flex-shrink-0"></span>
                                                    <span className="text-[16px] text-black dark:text-white">
                                                        {point}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Guidance Tip */}
                        <section className="mt-8 lg:mt-12 pt-6 lg:pt-8 border-t border-[#19211C]/10 dark:border-white/10">
                            <h2 className="text-[18px] font-semibold text-[#19211C] dark:text-brand-text-primary mb-4">
                                Guidance Tip
                            </h2>
                            <p className="text-[16px] text-black dark:text-white leading-relaxed">
                                {roadmap.guidanceTip}
                            </p>
                        </section>
                    </div>

                    {/* Right Sidebar - Explore Other Roadmaps */}
                    <aside className="w-full lg:w-[280px] xl:w-[320px] 2xl:w-[360px] flex-shrink-0">
                        <div className="bg-white/30 dark:bg-black/20 border border-[#19211C]/12 dark:border-white/5 rounded-2xl p-0 backdrop-blur-sm sticky top-[100px] overflow-hidden">
                            <div className="p-4 pb-3">
                                <h3 className="text-[18px] font-semibold text-[#19211C] dark:text-white mb-3">
                                    Explore Other Roadmaps
                                </h3>
                                <div className="h-px w-full bg-[#19211C]/10 dark:bg-white/10"></div>
                            </div>
                            <div className="space-y-0.5 max-h-[calc(100vh-200px)] overflow-y-auto pb-4 custom-scrollbar">
                                {allRoadmaps.map((item, index) => (
                                    <ExploreRoadmapCard
                                        key={item.id}
                                        item={item}
                                        onSelect={onSelectRoadmap}
                                        isActive={item.id === roadmap.id}
                                        isLast={index === allRoadmaps.length - 1}
                                    />
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

const RoadmapsPage: React.FC = () => {
    const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        const id = searchParams.get('id');
        if (id && roadmapDetails[id]) {
            setSelectedRoadmapId(id);
        }
    }, [searchParams]);

    // Hardcoded roadmaps data
    const roadmaps: RoadmapCardData[] = [
        {
            id: '1',
            title: 'Product Manager',
            description: 'Lead product development and strategy. Lead product development and strategy. Lead product development Cad.',
        },
        {
            id: '2',
            title: 'UX/UI Designer',
            description: 'Design intuitive and visually appealing digital experiences for users across platforms.',
        },
        {
            id: '3',
            title: 'Product Manager',
            description: 'Lead product development and strategy. Lead product development and strategy. Lead product development Cad.',
        },
        {
            id: '4',
            title: 'Product Manager',
            description: 'Lead product development and strategy. Lead product development and strategy. Lead product development Cad.',
        },
        {
            id: '5',
            title: 'Product Manager',
            description: 'Lead product development and strategy. Lead product development and strategy. Lead product development Cad.',
        },
    ];

    const handleSelectRoadmap = (id: string) => {
        setSelectedRoadmapId(id);
        // Scroll to top when selecting a roadmap
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBack = () => {
        setSelectedRoadmapId(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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

    // Otherwise, show the grid view
    return (
        <div className="min-h-screen bg-[url('/Background_Light_Theme.svg')] bg-cover bg-center bg-no-repeat bg-fixed dark:bg-none dark:bg-brand-dark-primary">
            <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-12 lg:py-10">
                {/* Breadcrumb */}
                <nav className="mb-6 lg:mb-[1.5vw]">
                    <ol className="flex items-center space-x-2 text-[clamp(11px,0.75vw,13px)]">
                        <li>
                            <Link
                                href="/student/dashboard"
                                className="text-[#19211C]/60 dark:text-brand-text-secondary hover:text-[#19211C] dark:hover:text-brand-text-primary transition-colors"
                            >
                                Dashboard
                            </Link>
                        </li>
                        <li className="text-[#19211C]/40 dark:text-brand-text-secondary"><ArrowRightWithoutLineIcon className="w-3 h-3" /></li>
                        <li className="text-brand-green font-medium">Your Roadmaps</li>
                    </ol>
                </nav>

                {/* Header */}
                <div className="mb-6 lg:mb-[1.5vw]">
                    <h1 className="text-[18px] font-semibold text-[#19211C] dark:text-brand-text-primary mb-1">
                        Your Roadmaps 2027-2035
                    </h1>
                    <p className="text-black dark:text-brand-text-secondary text-[clamp(11px,0.8vw,14px)]">
                        Explore paths aligned with your strengths.
                    </p>
                </div>

                {/* Roadmaps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    {roadmaps.map((roadmap) => (
                        <RoadmapCard key={roadmap.id} item={roadmap} onSelect={handleSelectRoadmap} />
                    ))}
                </div>
            </div >
        </div >
    );
};

export default RoadmapsPage;
