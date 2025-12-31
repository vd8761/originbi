import React from 'react';
import { RoadmapItem as RoadmapItemType } from '@/lib/types';
import { CrossRightArrowIcon } from '@/components/icons';

const RoadmapItem: React.FC<{ item: RoadmapItemType }> = ({ item }) => (
    <a
        href="#"
        className="block -mx-6 px-6 lg:-mx-[1.25vw] lg:px-[1.25vw] even:bg-white/5 hover:bg-white/10 dark:hover:bg-brand-dark-tertiary transition-colors duration-200 group"
    >
        <div className="flex justify-between items-center py-4 lg:py-[0.833vw]">
            <div className="pr-4">
                <h4 className="font-semibold font-sans text-[#19211C] dark:text-brand-text-primary text-base lg:text-[1.04vw] mb-1 lg:mb-[0.2vw]">
                    {item.title}
                </h4>
                <p className="font-regular font-sans text-[#19211C]/60 dark:text-brand-text-secondary text-xs lg:text-[0.729vw]">
                    {item.description}
                </p>
            </div>
            <div className="bg-brand-green text-white w-8 h-8 lg:w-[1.66vw] lg:h-[1.66vw] rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                <CrossRightArrowIcon className="w-5 h-5 lg:w-[1.04vw] lg:h-[1.04vw]" />
            </div>
        </div>
    </a>
);

const RoadmapsCard: React.FC = () => {
    const roadmaps: RoadmapItemType[] = [
        {
            title: 'UX/UI Designer',
            description: 'Design intuitive and beautiful digital products',
        },
        {
            title: 'Product Manager',
            description: 'Lead cross-functional teams to build impactful products',
        },
        {
            title: 'UX/UI Designer',
            description: 'Deepen your skills in user research and interaction design',
        },
        {
            title: 'Product Manager',
            description: 'Own product strategy from discovery to delivery',
        },
        {
            title: 'UX/UI Designer',
            description: 'Grow into a senior creative leadership role',
        },
    ];

    return (
        <div className="bg-white/20 border border-[#19211C]/12 dark:bg-brand-dark-secondary dark:border-transparent rounded-2xl h-full flex flex-col backdrop-blur-sm">
            <div className="px-6 pt-6 pb-4 lg:px-[1.25vw] lg:pt-[1.25vw] lg:pb-[0.833vw] flex justify-between items-center">
                <h3 className="font-semibold font-sans text-[#19211C] dark:text-brand-text-primary text-lg lg:text-[1.25vw]">
                    Your Roadmaps 2027-2035
                </h3>
                <a
                    href="#"
                    className="font-medium font-sans text-brand-green text-xs lg:text-[0.833vw] hover:underline"
                >
                    View All
                </a>
            </div>
            <hr className="border-[#19211C]/10 dark:border-white/10" />
            <div className="px-6 pt-2 pb-2 lg:px-[1.25vw] lg:pt-[0.41vw] lg:pb-[0.41vw] flex-grow">
                <div className="flex flex-col h-full justify-around">
                    {roadmaps.map((item, index) => (
                        <RoadmapItem key={index} item={item} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RoadmapsCard;
