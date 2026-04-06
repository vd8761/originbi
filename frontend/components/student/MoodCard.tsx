import React from 'react';
import { MoodItem as MoodItemType, MoodTag } from '../../lib/types';
import { MoodClockIcon } from '../icons';

const getTagClasses = (tag: MoodTag | string): string => {
    switch (tag) {
        case 'Feeling Happy':
        case 'Need Motivation':
        case 'Morning Boost':
            return 'border border-brand-green text-white bg-brand-green/10 outline-none';
        default:
            return 'border border-gray-500/30 text-gray-400 bg-transparent';
    }
};

const MoodItem: React.FC<{
    item: MoodItemType;
    onClick: () => void;
}> = ({ item, onClick }) => (
    <div
        onClick={onClick}
        className="grid grid-cols-2 gap-4 lg:gap-[1.25vw] px-6 py-4 lg:px-[1.25vw] lg:py-[0.833vw] transition-all duration-200 cursor-pointer group hover:bg-white/5 even:bg-white/5"
    >
        <div className="relative w-full aspect-video overflow-hidden rounded-xl">
            <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500"
            />
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors duration-300 group-hover:bg-black/20">
                <div className="w-14 h-14 lg:w-[3vw] lg:h-[3vw] bg-brand-green rounded-full flex items-center justify-center shadow-lg transition-transform duration-300">
                    <svg
                        className="w-6 h-6 lg:w-[1.25vw] lg:h-[1.25vw] text-white ml-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M6.3 3.31C5.33 2.72 4 3.42 4 4.54v10.92c0 1.12 1.33 1.82 2.3 1.23l9.36-5.46c.97-.57.97-1.9 0-2.46L6.3 3.31z" />
                    </svg>
                </div>
            </div>
        </div>

        <div className="flex flex-col justify-center min-w-0">
            <h4 className="font-semibold font-sans text-lg lg:text-[1.14vw] text-white truncate">
                {item.title}
            </h4>
            <p className="font-regular font-sans text-xs lg:text-[0.729vw] text-white/90 mt-1 line-clamp-2 leading-relaxed">
                {item.description}
            </p>
            <div className="flex flex-col space-y-2 lg:space-y-[0.41vw] mt-3 lg:mt-[0.6vw]">
                <div className="flex items-center">
                    <span
                        className={`text-[10px] lg:text-[0.625vw] px-3 py-1 lg:px-[0.625vw] lg:py-[0.1vw] font-semibold rounded-md transition-all ${getTagClasses(
                            item.tag
                        )}`}
                    >
                        {item.tag}
                    </span>
                </div>
                <div className="flex items-center space-x-1.5 lg:space-x-[0.31vw]">
                    <MoodClockIcon className="w-4 h-4 lg:w-[0.937vw] lg:h-[0.937vw] text-white" />
                    <span className="text-[10px] lg:text-[0.625vw] font-medium text-white/70">
                        {item.duration}
                    </span>
                </div>
            </div>
        </div>
    </div>
);



const MoodCard: React.FC = () => {
    const moodItems: MoodItemType[] = [
        {
            title: 'Smile Reset in 60 Seconds',
            description:
                'Curated to lift your energy and brighten your day. Curated to lift your energy.',
            tag: 'Feeling Happy',
            duration: '5:45 min',
            imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        },
        {
            title: 'Bright Start: 3 Mini Habits',
            description:
                'Curated to lift your energy and brighten your day. Curated to lift your energy.',
            tag: 'Need Motivation',
            duration: '5:45 min',
            imageUrl: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        },
    ];

    return (
        <div className="dashboard-glass-card h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-6 pt-6 pb-4 lg:px-[1.25vw] lg:pt-[1.25vw] lg:pb-[0.833vw] flex-shrink-0">
                <h3 className="font-semibold font-sans text-[#19211C] dark:text-brand-text-primary text-lg lg:text-[1.25vw]">
                    What&apos;s Your Mood?
                </h3>
                <a
                    href="#"
                    className="font-medium font-sans text-brand-green text-xs lg:text-[0.833vw] hover:underline"
                >
                    View All
                </a>
            </div>

            <div className="flex flex-col flex-grow overflow-y-auto w-full">
                {moodItems.map((item, index) => (
                    <MoodItem
                        key={index}
                        item={item}
                        onClick={() => { }}
                    />
                ))}
            </div>
        </div>
    );
};

export default MoodCard;
