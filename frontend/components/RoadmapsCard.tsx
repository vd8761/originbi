import React from 'react';
import { RoadmapItem as RoadmapItemType } from '@/lib/types';
import { RightArrowIcon } from '@/components/icons';

const RoadmapItem: React.FC<{ item: RoadmapItemType }> = ({ item }) => (
    <a
        href="#"
        className="block -mx-6 px-6 hover:bg-brand-light-tertiary dark:hover:bg-brand-dark-tertiary transition-colors duration-200"
    >
        <div className="flex justify-between items-center py-4">
            <div>
                <h4 className="font-bold text-brand-text-light-primary dark:text-brand-text-primary">
                    {item.title}
                </h4>
                <p className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary">
                    {item.description}
                </p>
            </div>
            <div className="bg-brand-green text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                <RightArrowIcon className="w-5 h-5" />
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
        <div className="bg-brand-light-secondary dark:bg-brand-dark-secondary rounded-2xl h-full flex flex-col">
            <div className="px-6 pt-6 pb-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-brand-text-light-primary dark:text-brand-text-primary">
                    Your Roadmaps 2027-2035
                </h3>
                <a
                    href="#"
                    className="text-sm text-brand-green font-semibold hover:underline"
                >
                    View All
                </a>
            </div>
            <hr className="border-brand-light-tertiary dark:border-white/10" />
            <div className="px-6 pt-2 pb-2 flex-grow">
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
