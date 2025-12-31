import React from 'react';
import { SessionItem as SessionItemType } from '@/lib/types';

const SemiCircularProgress: React.FC<{ progress: number }> = ({ progress }) => {
    const radius = 100;
    const stroke = 10;
    const normalizedRadius = radius - stroke / 2;
    const circumference = normalizedRadius * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative w-full max-w-[240px] lg:max-w-none lg:w-auto h-auto mx-auto">
            <svg height="100%" width="100%" viewBox="0 0 224 128">
                {/* Background Track */}
                <path
                    className="stroke-gray-200 dark:stroke-white/10"
                    d="M 12 116 A 100 100 0 0 1 212 116"
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                />
                {/* Progress Arc */}
                <path
                    className="stroke-brand-green"
                    d="M 12 116 A 100 100 0 0 1 212 116"
                    fill="none"
                    strokeWidth={stroke}
                    strokeDasharray={`${circumference} ${circumference}`}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 lg:pb-[0.833vw]">
                <span className="font-regular font-sans text-brand-green mb-2 lg:mb-[0.41vw] text-sm lg:text-[0.833vw] tracking-wide">Call Progress</span>
                <span className="font-semibold font-sans leading-none text-[#19211C] dark:text-brand-text-primary text-5xl lg:text-[3.125vw]">
                    05
                    <span className="ml-0">
                        /10
                    </span>
                </span>
            </div>
        </div>
    );
};

const SessionItem: React.FC<{ session: SessionItemType }> = ({ session }) => (
    <div className="flex justify-between items-center py-2 lg:py-[0.41vw]">
        <div>
            <p className="font-semibold font-sans text-[#19211C] dark:text-brand-text-primary text-sm lg:text-[0.9375vw]">
                {session.title}
            </p>
            <p className="font-regular font-sans text-[#19211C]/60 dark:text-brand-text-secondary text-xs lg:text-[0.729vw] mt-0.5 lg:mt-[0.1vw]">
                {session.duration}
            </p>
        </div>
        <div className="text-right">
            <p className="font-semibold font-sans text-[#19211C] dark:text-brand-text-primary text-xs lg:text-[0.833vw]">
                {session.date}
            </p>
            <p className="font-regular font-sans text-[#19211C]/60 dark:text-brand-text-secondary text-xs lg:text-[0.729vw] mt-0.5 lg:mt-[0.1vw]">
                {session.time}
            </p>
        </div>
    </div>
);

const ConsultantCallCard: React.FC = () => {
    const sessions: SessionItemType[] = [
        {
            title: 'Free Session',
            duration: '2 Hrs',
            date: '12 July 2025',
            time: '08:30 AM - 10:30 AM',
        },
        {
            title: 'Free Session',
            duration: '2 Hrs',
            date: '18 July 2025',
            time: '04:00 PM - 06:00 PM',
        },
    ];

    return (
        <div className="bg-white/20 border border-[#19211C]/12 dark:bg-brand-dark-secondary dark:border-transparent p-6 lg:p-[1.25vw] rounded-2xl h-auto lg:h-full flex flex-col backdrop-blur-sm">
            <h3 className="font-semibold font-sans text-[#19211C] dark:text-brand-text-primary text-lg lg:text-[1.25vw] mb-4 lg:mb-[0.8vw]">
                Consultant Call
            </h3>

            <div className="flex-grow flex justify-center items-center my-4 lg:my-[0.8vw]">
                <div className="w-full max-w-[320px] lg:max-w-[18vw]">
                    <SemiCircularProgress progress={50} />
                </div>
            </div>

            <div className="mt-4 lg:mt-[0.8vw]">
                <div className="flex justify-between items-center mb-3 lg:mb-[0.6vw]">
                    <h4 className="font-semibold font-sans text-[#19211C] dark:text-brand-text-primary text-base lg:text-[1.25vw]">
                        Recent Sessions
                    </h4>
                    <a
                        href="#"
                        className="font-medium font-sans text-brand-green text-xs lg:text-[0.833vw] hover:underline"
                    >
                        View All
                    </a>
                </div>
                <div className="space-y-3 lg:space-y-[0.6vw] border-t border-brand-light-tertiary dark:border-white/10 pt-4 lg:pt-[0.833vw]">
                    {sessions.map((session, index) => (
                        <SessionItem key={index} session={session} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ConsultantCallCard;
