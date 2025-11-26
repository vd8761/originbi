import React from 'react';
import { MoodItem as MoodItemType, MoodTag } from '@/lib/types';
import { ClockIcon } from '@/components/icons';

const getTagClasses = (tag: MoodTag | string): string => {
    switch (tag) {
        case 'Feeling Happy':
            return 'bg-brand-green/20 text-brand-green';
        case 'Need Motivation':
            return 'bg-green-500/20 text-green-400';
        case 'Morning Boost':
            return 'bg-blue-500/20 text-blue-400';
        default:
            return 'bg-gray-500/20 text-gray-400';
    }
};

const MoodItem: React.FC<{ item: MoodItemType }> = ({ item }) => (
    <div className="flex items-center space-x-4 bg-brand-light-secondary dark:bg-brand-dark-tertiary p-3 rounded-xl hover:bg-brand-light-tertiary/60 dark:hover:bg-brand-dark-tertiary/60 transition-colors duration-200 cursor-pointer">
        <div className="relative flex-shrink-0">
            <img
                src={item.imageUrl}
                alt={item.title}
                className="w-20 h-20 rounded-lg object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                <div className="w-8 h-8 rounded-full bg-brand-green/90 backdrop-blur-sm flex items-center justify-center">
                    <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M6.3 3.31C5.33 2.72 4 3.42 4 4.54v10.92c0 1.12 1.33 1.82 2.3 1.23l9.36-5.46c.97-.57.97-1.9 0-2.46L6.3 3.31z" />
                    </svg>
                </div>
            </div>
        </div>
        <div className="flex-grow">
            <h4 className="font-semibold text-base text-brand-text-light-primary dark:text-brand-text-primary">
                {item.title}
            </h4>
            <p className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary mt-1">
                {item.description}
            </p>
            <div className="flex items-center space-x-4 mt-2">
                <span
                    className={`text-xs px-3 py-1 font-semibold rounded-md ${getTagClasses(
                        item.tag
                    )}`}
                >
                    {item.tag}
                </span>
                <div className="flex items-center space-x-1.5">
                    <ClockIcon className="w-4 h-4 text-brand-text-light-secondary dark:text-brand-text-secondary" />
                    <span className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary">
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
            imageUrl: 'https://i.imgur.com/8QRLT1E.png',
        },
        {
            title: 'Bright Start: 3 Mini Habits',
            description:
                'Curated to lift your energy and brighten your day. Curated to lift your energy.',
            tag: 'Need Motivation',
            duration: '5:45 min',
            imageUrl: 'https://i.imgur.com/Y08fJ5j.png',
        },
        {
            title: 'Morning Positivity Boost',
            description:
                'Curated to lift your energy and brighten your day. Curated to lift your energy.',
            tag: 'Morning Boost',
            duration: '5:45 min',
            imageUrl: 'https://i.imgur.com/G4hG3mB.png',
        },
    ];

    return (
        <div className="bg-brand-light-secondary dark:bg-brand-dark-secondary rounded-2xl h-full flex flex-col">
            <div className="px-6 pt-6 pb-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-brand-text-light-primary dark:text-brand-text-primary">
                    What&apos;s Your Mood?
                </h3>
                <a
                    href="#"
                    className="text-sm text-brand-green font-semibold hover:underline"
                >
                    View All
                </a>
            </div>
            <hr className="border-brand-light-tertiary dark:border-white/10" />
            <div className="p-6 flex-grow">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center h-full">
                    <div className="lg:col-span-4 relative w-full h-full flex items-center justify-center rounded-2xl overflow-hidden min-h-[300px]">
                        <div className="absolute w-[250px] h-[400px] bg-brand-green/90 rounded-[100px] blur-3xl -rotate-45" />
                        <img
                            src="https://i.imgur.com/eLS0e1d.png"
                            alt="Mood video"
                            className="relative z-10 w-full h-auto max-w-[250px]"
                        />
                        <div className="absolute z-20 bg-brand-green shadow-2xl shadow-brand-green/30 w-24 h-24 rounded-full flex items-center justify-center top-1/2 left-4 -translate-y-1/2">
                            <svg
                                className="w-10 h-10 text-white ml-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M6.3 3.31C5.33 2.72 4 3.42 4 4.54v10.92c0 1.12 1.33 1.82 2.3 1.23l9.36-5.46c.97-.57.97-1.9 0-2.46L6.3 3.31z" />
                            </svg>
                        </div>
                    </div>
                    <div className="lg:col-span-8 space-y-3">
                        {moodItems.map((item, index) => (
                            <MoodItem key={index} item={item} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MoodCard;
