import React from 'react';
import { SessionItem as SessionItemType } from '@/lib/types';

const SemiCircularProgress: React.FC<{ progress: number }> = ({ progress }) => {
    const radius = 100;
    const stroke = 12;
    const normalizedRadius = radius - stroke / 2;
    const circumference = normalizedRadius * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative w-auto h-auto">
            <svg height="100%" width="100%" viewBox="0 0 224 118">
                {/* Background Track */}
                <path
                    className="stroke-gray-200 dark:stroke-white/10"
                    d="M 12 106 A 100 100 0 0 1 212 106"
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                />
                {/* Progress Arc */}
                <path
                    className="stroke-brand-green"
                    d="M 12 106 A 100 100 0 0 1 212 106"
                    fill="none"
                    strokeWidth={stroke}
                    strokeDasharray={`${circumference} ${circumference}`}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                <span className="text-base text-brand-green mb-1">Call Progress</span>
                <span className="text-6xl font-semibold leading-none text-brand-text-light-primary dark:text-brand-text-primary">
                    05
                    <span className="text-6xl leading-none text-brand-text-light-primary dark:text-brand-text-primary">
                        /10
                    </span>
                </span>
            </div>
        </div>
    );
};

const SessionItem: React.FC<{ session: SessionItemType }> = ({ session }) => (
    <div className="flex justify-between items-center">
        <div>
            <p className="font-semibold text-brand-text-light-primary dark:text-brand-text-primary">
                {session.title}
            </p>
            <p className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary">
                {session.duration}
            </p>
        </div>
        <div className="text-right">
            <p className="font-semibold text-sm text-brand-text-light-primary dark:text-brand-text-primary">
                {session.date}
            </p>
            <p className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary">
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
        <div className="bg-brand-light-secondary dark:bg-brand-dark-secondary p-6 rounded-2xl flex flex-col h-full">
            <h3 className="text-lg font-bold text-brand-text-light-primary dark:text-brand-text-primary">
                Consultant Call
            </h3>

            <div className="flex-grow flex justify-center items-center my-6">
                <SemiCircularProgress progress={50} />
            </div>

            <div>
                <div className="flex justify-between items-center">
                    <h4 className="font-bold text-lg text-brand-text-light-primary dark:text-brand-text-primary">
                        Recent Sessions
                    </h4>
                    <a
                        href="#"
                        className="text-sm text-brand-green font-semibold hover:underline"
                    >
                        View All
                    </a>
                </div>
                <hr className="border-brand-light-tertiary dark:border-white/10 my-4" />
                <div className="space-y-4">
                    {sessions.map((session, index) => (
                        <SessionItem key={index} session={session} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ConsultantCallCard;
