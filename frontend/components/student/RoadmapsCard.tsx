import React from 'react';
import Link from 'next/link';
import { RoadmapItem as RoadmapItemType } from '../../lib/types';
import { ArrowUpRightIcon } from '../icons';

const RoadmapItem: React.FC<{ item: RoadmapItemType & { id?: string } }> = ({ item }) => (
    <div
        className="block -mx-6 px-6 lg:-mx-[1.25vw] lg:px-[1.25vw] even:bg-white/5 hover:bg-white/5 transition-colors duration-200 group relative"
    >
        <div className="flex justify-between items-center py-4 lg:py-[0.833vw]">
            <div className="pr-4">
                <h4 className="font-semibold font-sans text-[#19211C] dark:text-white text-base lg:text-[1.04vw] mb-1 lg:mb-[0.2vw]">
                    {item.title}
                </h4>
                <p className="font-normal font-sans text-black dark:text-white text-xs lg:text-[0.833vw] leading-tight opacity-90 hover:opacity-100 transition-opacity">
                    {item.description}
                </p>
            </div>
            <Link
                href={item.id ? `/student/roadmaps?id=${item.id}` : '#'}
                className="bg-brand-green text-white w-8 h-8 lg:w-[1.66vw] lg:h-[1.66vw] rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
            >
                <ArrowUpRightIcon className="w-5 h-5 lg:w-[1.04vw] lg:h-[1.04vw]" />
            </Link>
        </div>
    </div>
);

interface RoadmapsCardProps {
    reportData?: any;
    isLoadingReport?: boolean;
}

const RoadmapsCard: React.FC<RoadmapsCardProps> = ({ reportData, isLoadingReport }) => {
    // Extract real roadmaps from report data
    const apiRoadmaps = reportData?.sections?.careerGuidance || [];
    const roadmaps = apiRoadmaps.slice(0, 5).map((role: any, index: number) => ({
        id: (index + 1).toString(),
        title: role.roleName,
        description: role.shortDescription,
    }));

    if (isLoadingReport) {
        return (
            <div className="dashboard-glass-card h-full flex items-center justify-center p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
            </div>
        );
    }

    return (
        <div className="dashboard-glass-card h-full flex flex-col">
            <div className="px-6 pt-6 pb-4 lg:px-[1.25vw] lg:pt-[1.25vw] lg:pb-[0.833vw] flex justify-between items-center">
                <h3 className="font-semibold font-sans text-[#19211C] dark:text-white text-[18px]">
                    Your Roadmaps
                </h3>
                <Link
                    href="/student/roadmaps"
                    className="font-medium font-sans text-brand-green text-xs lg:text-[0.833vw] hover:underline"
                >
                    View All
                </Link>
            </div>
            <hr className="border-[#19211C]/10 dark:border-white/10" />
            <div className="px-6 pt-2 pb-2 lg:px-[1.25vw] lg:pt-[0.41vw] lg:pb-[0.41vw] flex-grow overflow-auto no-scrollbar">
                <div className="flex flex-col h-full justify-around min-h-[250px]">
                    {roadmaps.length > 0 ? (
                        roadmaps.map((item: any, index: number) => (
                            <RoadmapItem key={index} item={item} />
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-full text-[#19211C]/50 dark:text-white/50 text-sm">
                            {reportData ? "No roadmaps available." : "Complete assessment to view roadmaps."}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoadmapsCard;
