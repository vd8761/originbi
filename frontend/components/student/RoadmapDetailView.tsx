import React from 'react';
import Link from 'next/link';
import { ArrowRightWithoutLineIcon, ArrowUpRightIcon } from '../../components/icons';
import { RoadmapDetailData, RoadmapCardData } from '../../lib/types';

// Small card for "Explore Other Roadmaps" section
const ExploreRoadmapCard: React.FC<{ item: RoadmapCardData; onSelect: (id: string) => void; isActive?: boolean; isLast?: boolean }> = ({ item, onSelect, isActive, isLast }) => (
    <div className="relative px-4">
        <div
            className={`group relative py-4 px-5 transition-all duration-300 cursor-pointer rounded-[8px] border ${isActive
                ? 'bg-[#19211C]/5 dark:bg-white/[0.12] border-[#19211C]/10 dark:border-white/[0.08]' // Active
                : 'bg-transparent border-transparent hover:bg-[#19211C]/5 dark:hover:bg-white/[0.05]' // Inactive
                }`}
            onClick={() => onSelect(item.id)}
        >
            <div className="flex justify-between items-center gap-4">
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[#19211C] dark:text-white text-[clamp(16px,1.05vw,20px)] mb-1 leading-none font-sans">
                        {item.title}
                    </h4>
                    <p className="text-black dark:text-white text-[clamp(13px,0.85vw,16px)] font-normal leading-tight line-clamp-2 font-sans opacity-80">
                        {item.description}
                    </p>
                </div>
                <button
                    className="bg-brand-green hover:bg-brand-green/90 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:scale-110 shadow-md shadow-brand-green/20 cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(item.id);
                    }}
                >
                    <ArrowUpRightIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
        {/* Separator Line for Inactive items (unless it's the last one) - Placed outside the padding */}
        {!isActive && !isLast && (
            <div className="mx-5 h-px bg-[#19211C]/10 dark:bg-white/10 my-2"></div>
        )}
    </div>
);

interface RoadmapDetailViewProps {
    roadmap: RoadmapDetailData;
    allRoadmaps: RoadmapCardData[];
    onBack: () => void;
    onSelectRoadmap: (id: string) => void;
}

const RoadmapDetailView: React.FC<RoadmapDetailViewProps> = ({ roadmap, allRoadmaps, onBack, onSelectRoadmap }) => {
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
                        <li>
                            <button
                                onClick={onBack}
                                className="text-gray-500 cursor-pointer dark:text-white hover:text-gray-700 dark:hover:text-brand-green transition-colors font-normal font-sans"
                            >
                                Your Roadmaps
                            </button>
                        </li>
                        <li className="flex items-center justify-center text-gray-400 dark:text-gray-600">
                            <ArrowRightWithoutLineIcon className="w-3 h-3" />
                        </li>
                        <li className="text-brand-green font-normal font-sans">{roadmap.category}</li>
                    </ol>
                </nav>

                {/* Main Content Grid */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-[5vw]">
                    {/* Left Content - Detail Section */}
                    <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h1 className="text-[clamp(24px,2.5vw,40px)] font-semibold text-[#19211C] dark:text-brand-text-primary mb-6 lg:mb-8 font-sans leading-none">
                            {roadmap.title}
                        </h1>

                        {/* Tools to Learn */}
                        <section className="mb-6 lg:mb-8">
                            <h2 className="text-[clamp(16px,1.15vw,22px)] font-semibold text-[#19211C] dark:text-white mb-3 font-sans leading-tight">
                                Tools to Learn
                            </h2>
                            <div className="space-y-1">
                                {roadmap.toolsToLearn.map((tool, idx) => (
                                    <p key={idx} className="text-[clamp(16px,1.15vw,22px)] text-[#19211C] dark:text-white leading-none mb-2">
                                        <span className="font-semibold">{tool.name}</span>
                                        <span className="font-normal"> ({tool.category})</span>
                                    </p>
                                ))}
                            </div>
                        </section>

                        {/* Overview */}
                        <section className="mb-6 lg:mb-8">
                            <h2 className="text-[clamp(16px,1.15vw,22px)] font-semibold text-[#19211C] dark:text-brand-text-primary mb-3 font-sans leading-tight">
                                Overview
                            </h2>
                            <p className="text-[clamp(16px,1.15vw,22px)] text-black dark:text-white leading-tight font-normal">
                                {roadmap.overview}
                            </p>
                        </section>

                        {/* Trait Alignment */}
                        <section className="mb-6 lg:mb-8">
                            <h2 className="text-[clamp(16px,1.15vw,22px)] font-semibold text-[#19211C] dark:text-brand-text-primary mb-3 font-sans leading-tight">
                                Trait Alignment
                            </h2>
                            <p className="text-[clamp(16px,1.15vw,22px)] text-black dark:text-white leading-tight font-normal">
                                {roadmap.traitAlignment}
                            </p>
                        </section>

                        {/* Roadmap & Fundamental Learning */}
                        <section className="mb-6 lg:mb-8">
                            <h2 className="text-[clamp(16px,1.15vw,22px)] font-semibold text-[#19211C] dark:text-brand-text-primary mb-4 font-sans leading-tight">
                                Roadmap & Fundamental Learning
                            </h2>
                            <div className="space-y-3">
                                {roadmap.roadmapSteps.map((step, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <span className="w-2 h-2 mt-2 rounded-full bg-brand-green flex-shrink-0"></span>
                                        <p className="text-[clamp(16px,1.15vw,22px)] text-black dark:text-white leading-tight font-normal">
                                            <span className="font-semibold text-black dark:text-white">{step.label}:</span>{' '}
                                            {step.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Detailed Guidelines */}
                        <section className="mb-6 lg:mb-8">
                            <h2 className="text-[clamp(16px,1.15vw,22px)] font-semibold text-[#19211C] dark:text-brand-text-primary mb-4 font-sans leading-tight">
                                Detailed Guidelines
                            </h2>
                            <div className="space-y-6">
                                {roadmap.guidelines.map((guideline, gIdx) => (
                                    <div key={gIdx}>
                                        <h3 className="text-[clamp(16px,1.15vw,22px)] font-semibold text-[#19211C] dark:text-brand-text-primary mb-3 leading-tight">
                                            {gIdx + 1}. {guideline.title}
                                        </h3>
                                        <ul className="space-y-2 ml-1">
                                            {guideline.points.map((point, pIdx) => (
                                                <li key={pIdx} className="flex items-start gap-3">
                                                    <span className="w-2 h-2 mt-2 rounded-full bg-brand-green flex-shrink-0"></span>
                                                    <span className="text-[clamp(16px,1.15vw,22px)] text-black dark:text-white leading-tight font-normal">
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
                        <section className="mt-2 lg:mt-2">
                            <h2 className="text-[clamp(16px,1.15vw,22px)] font-semibold text-[#19211C] dark:text-brand-text-primary mb-4 font-sans leading-tight">
                                Guidance Tip
                            </h2>
                            <p className="text-[clamp(16px,1.15vw,22px)] text-black dark:text-white leading-tight font-normal">
                                {roadmap.guidanceTip}
                            </p>
                        </section>
                    </div>

                    {/* Right Sidebar - Explore Other Roadmaps */}
                    <aside className="w-full lg:w-[30vw] flex-shrink-0">
                        <div className="bg-white/[0.08] border border-white/[0.2] rounded-xl p-0 backdrop-blur-[100px] shadow-[0_16px_40px_0px_#19211C] sticky top-[100px]">
                            <div className="p-4 pb-3">
                                <h3 className="text-[clamp(18px,1.25vw,24px)] font-semibold text-[#19211C] dark:text-white mb-3 font-sans leading-none">
                                    Explore Other Roadmaps
                                </h3>
                                <div className="h-px w-full bg-[#19211C]/10 dark:bg-white/10"></div>
                            </div>
                            <div className="space-y-2 pb-4 pt-2">
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

export default RoadmapDetailView;
