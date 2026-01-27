'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowUpRightIcon, ArrowRightWithoutLineIcon } from '@/components/icons';
import { RoadmapCardData, RoadmapDetailData } from '@/lib/types';
import RoadmapDetailView from './RoadmapDetailView';

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

// Main roadmap card for grid view
const RoadmapCard: React.FC<{ item: RoadmapCardData; onSelect: (id: string) => void }> = ({ item, onSelect }) => (
    <div
        className="group relative bg-white dark:bg-white/[0.08] border border-[#E2E8F0] dark:border-white/[0.08] hover:border-brand-green dark:hover:border-brand-green hover:bg-white/5 dark:hover:bg-white/[0.12] rounded-[12px] p-5 lg:p-6 transition-all duration-300 hover:shadow-lg dark:hover:shadow-none backdrop-blur-sm flex flex-col justify-center min-h-[120px] lg:min-h-[124px] cursor-pointer"
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
            <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-12 lg:py-10 max-w-[1920px] mx-auto">
                {/* Breadcrumb */}
                <nav className="mb-6">
                    <ol className="flex items-center gap-2 text-[clamp(12px,0.73vw,14px)]">
                        <li>
                            <Link
                                href="/student/dashboard"
                                className="text-gray-500 dark:text-white hover:text-gray-700 dark:hover:text-[#1ED36A] transition-colors font-normal font-sans"
                            >
                                Dashboard
                            </Link>
                        </li>
                        <li className="flex items-center justify-center text-gray-400 dark:text-gray-600">
                            <ArrowRightWithoutLineIcon className="w-3 h-3" />
                        </li>
                        <li className="text-brand-green font-normal font-sans">Your Roadmaps</li>
                    </ol>
                </nav>

                {/* Header */}
                <div className="mb-6 lg:mb-8">
                    <h1 className="text-[clamp(20px,1.46vw,28px)] font-semibold text-[#19211C] dark:text-white mb-2 font-sans tracking-tight leading-none">
                        Your Roadmaps 2027-2035
                    </h1>
                    <p className="text-[#19211C]/70 dark:text-white text-[clamp(14px,0.94vw,14px)] font-normal font-sans leading-none">
                        Explore paths aligned with your strengths.
                    </p>
                </div>

                {/* Roadmaps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5 xl:gap-6">
                    {roadmaps.map((roadmap) => (
                        <RoadmapCard key={roadmap.id} item={roadmap} onSelect={handleSelectRoadmap} />
                    ))}
                </div>
            </div >
        </div >
    );
};

export default RoadmapsPage;
