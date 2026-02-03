import React, { useState } from 'react';
import { MoodItem as MoodItemType, MoodTag } from '@/lib/types';
import { ClockIcon } from '@/components/icons';

const getTagClasses = (tag: MoodTag | string): string => {
    switch (tag) {
        case 'Feeling Happy':
            return 'bg-brand-green text-white border-none';
        case 'Need Motivation':
            return 'bg-brand-green text-white border-none';
        case 'Morning Boost':
            return 'bg-brand-green text-white border-none';
        default:
            return 'bg-gray-500/20 text-gray-400';
    }
};

const MoodItem: React.FC<{
    item: MoodItemType;
    isActive: boolean;
    onClick: () => void;
}> = ({ item, isActive, onClick }) => (
    <div
        onClick={onClick}
        className="flex items-center space-x-4 lg:space-x-[0.833vw] p-4 lg:p-[0.833vw] rounded-xl transition-all duration-200 cursor-pointer group bg-[#19211C]/5 dark:bg-white/5 hover:bg-[#19211C]/10 dark:hover:bg-white/10"
    >
        <div className="relative flex-shrink-0 w-32 h-20 lg:w-[6.66vw] lg:h-[4.16vw] overflow-hidden rounded-lg">
            <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Small Play Overlay - Always Visible */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-100 transition-opacity duration-200">
                <div className="w-8 h-8 lg:w-[1.66vw] lg:h-[1.66vw] rounded-full bg-brand-green/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <svg
                        className="w-4 h-4 lg:w-[0.833vw] lg:h-[0.833vw] text-white ml-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M6.3 3.31C5.33 2.72 4 3.42 4 4.54v10.92c0 1.12 1.33 1.82 2.3 1.23l9.36-5.46c.97-.57.97-1.9 0-2.46L6.3 3.31z" />
                    </svg>
                </div>
            </div>
        </div>
        <div className="flex-grow min-w-0">
            <h4 className="font-semibold font-sans text-[#19211C] dark:text-brand-text-primary text-base lg:text-[1.04vw] truncate">
                {item.title}
            </h4>
            <p className="font-regular font-sans text-[#19211C]/60 dark:text-brand-text-secondary mt-1 lg:mt-[0.2vw] text-xs lg:text-[0.729vw] line-clamp-2">
                {item.description}
            </p>
            <div className="flex items-center space-x-4 lg:space-x-[0.833vw] mt-2 lg:mt-[0.41vw]">
                <span
                    className={`text-[10px] lg:text-[0.729vw] px-3 py-1 lg:px-[0.625vw] lg:py-[0.2vw] font-medium rounded-md ${getTagClasses(
                        item.tag
                    )}`}
                >
                    {item.tag}
                </span>
                <div className="flex items-center space-x-1.5 lg:space-x-[0.31vw]">
                    <ClockIcon className="w-4 h-4 lg:w-[0.833vw] lg:h-[0.833vw] text-[#19211C]/60 dark:text-brand-text-secondary" />
                    <span className="text-xs lg:text-[0.729vw] text-[#19211C]/60 dark:text-brand-text-secondary">
                        {item.duration}
                    </span>
                </div>
            </div>
        </div>
    </div>
);

const MoodCard: React.FC = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const moodItems: MoodItemType[] = [
        {
            title: 'Smile Reset in 60 Seconds',
            description:
                'Curated to lift your energy and brighten your day.',
            tag: 'Feeling Happy',
            duration: '5:45 min',
            imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        },
        {
            title: 'Bright Start: 3 Mini Habits',
            description:
                'Curated to lift your energy and brighten your day.',
            tag: 'Need Motivation',
            duration: '5:45 min',
            imageUrl: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        },
        {
            title: 'Morning Positivity Boost',
            description:
                'Curated to lift your energy and brighten your day.',
            tag: 'Morning Boost',
            duration: '5:45 min',
            imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
        },
    ];

    return (
        <div className="bg-white/20 border border-[#19211C]/12 dark:bg-brand-dark-secondary dark:border-transparent rounded-2xl h-full flex flex-col backdrop-blur-sm p-6 lg:p-[1.25vw]">
            <div className="grid grid-cols-1 lg:grid-cols-8 gap-6 lg:gap-[1.25vw] h-full">
                {/* Left Side - Image (3 columns) */}
                <div className="lg:col-span-3 relative w-full h-full min-h-[240px] lg:min-h-0 rounded-2xl overflow-hidden group">
                    <img
                        src="/Videos_Banner_img.png"
                        alt="Mood video"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Big Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <button className="w-16 h-16 lg:w-[3.5vw] lg:h-[3.5vw] bg-brand-green rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(30,211,106,0.5)] transition-transform duration-300 hover:scale-110 active:scale-95 group-hover:shadow-[0_0_60px_rgba(30,211,106,0.7)]">
                            <svg
                                className="w-6 h-6 lg:w-[1.25vw] lg:h-[1.25vw] text-white ml-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M6.3 3.31C5.33 2.72 4 3.42 4 4.54v10.92c0 1.12 1.33 1.82 2.3 1.23l9.36-5.46c.97-.57.97-1.9 0-2.46L6.3 3.31z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Right Side - Header + List (5 columns) */}
                <div className="lg:col-span-5 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4 lg:mb-[0.833vw] flex-shrink-0">
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

                    <div className="flex flex-col flex-grow justify-center gap-4 lg:gap-[0.833vw]">
                        {moodItems.map((item, index) => (
                            <MoodItem
                                key={index}
                                item={item}
                                isActive={index === activeIndex}
                                onClick={() => setActiveIndex(index)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MoodCard;
