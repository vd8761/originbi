import React, { useEffect, useState } from 'react';

interface ImpactStats {
    personalityAvg: number;
    agilityAvg: number;
    leadershipScore: number;
}

const Ring: React.FC<{
    value: number;
    label: string;
    color: string;
    radius: number;
    strokeWidth: number;
}> = ({ value, label, color, radius, strokeWidth }) => {
    const circumference = 2 * Math.PI * radius;
    const fillRatio = Math.min(1, Math.max(0, value / 100));
    const dashArray = fillRatio * circumference;
    const dashOffset = circumference * 0.25; // Start from top

    return (
        <g>
            {/* Background track */}
            <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-gray-200 dark:text-white/10"
            />
            {/* Filled arc */}
            <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashArray} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
            />
        </g>
    );
};

const StatRow: React.FC<{
    label: string;
    value: number;
    color: string;
}> = ({ label, value, color }) => (
    <div className="flex items-center gap-3">
        <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
        />
        <span className="font-sans text-[#19211C] dark:text-white text-sm lg:text-[0.833vw] font-medium flex-1">
            {label}
        </span>
        <span className="font-sans text-[#19211C] dark:text-white text-lg lg:text-[1.04vw] font-bold">
            {value}%
        </span>
    </div>
);

const ImpactAssessmentCard: React.FC = () => {
    const [stats, setStats] = useState<ImpactStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkUser = () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    if (user.impactStats) {
                        setStats(user.impactStats);
                        setIsLoading(false);
                        return true;
                    }
                    if (user.hasOwnProperty('id')) {
                        setIsLoading(false);
                        return true;
                    }
                } catch (e) {
                    console.error("Error parsing user from localStorage", e);
                }
            }
            return false;
        };

        if (!checkUser()) {
            const interval = setInterval(() => {
                if (checkUser()) {
                    clearInterval(interval);
                }
            }, 500);

            const timeout = setTimeout(() => {
                setIsLoading(false);
                clearInterval(interval);
            }, 5000);

            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
            };
        }
    }, []);

    const personality = stats?.personalityAvg ?? 0;
    const agility = stats?.agilityAvg ?? 0;
    const leadership = stats?.leadershipScore ?? 0;
    const overallScore = stats ? Math.round((personality + agility + leadership) / 3) : 0;

    // Updated Executive Professional colors
    const colors = {
        personality: '#2563EB', // Trust & Professionalism (Blue)
        agility: '#9333EA',     // Innovation & Creativity (Purple)
        leadership: '#2DD4BF',  // Energy & Growth (Turquoise)
    };

    return (
        <div className="bg-white/20 border border-[#19211C]/12 dark:bg-brand-dark-secondary dark:border-transparent rounded-2xl h-full flex flex-col p-6 lg:p-[1.25vw]">
            {/* Header */}
            <div className="mb-6 lg:mb-[1.5vw] text-center">
                <h3 className="font-semibold font-sans text-[#19211C] dark:text-white text-lg lg:text-[1.25vw] leading-tight">
                    360° Impact Assessment
                </h3>
                <p className="font-sans text-[#19211C]/60 dark:text-white/50 text-xs lg:text-[0.729vw] mt-1 leading-relaxed">
                    Holistic growth across core professional dimensions
                </p>
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
                </div>
            ) : !stats ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="font-sans text-[#19211C]/40 dark:text-white/30 text-sm text-center">
                        Complete your assessment to see your impact stats
                    </p>
                </div>
            ) : (
                <div className="flex flex-col items-center flex-1">
                    {/* Ring Chart - Increased size */}
                    <div className="relative w-[210px] h-[210px] lg:w-[13vw] lg:h-[13vw] max-w-[280px] max-h-[280px] mb-8 lg:mb-[2vw]">
                        <svg viewBox="0 0 240 240" className="w-full h-full -rotate-90">
                            <Ring
                                value={personality}
                                label="Personality"
                                color={colors.personality}
                                radius={112}
                                strokeWidth={10}
                            />
                            <Ring
                                value={agility}
                                label="Agility"
                                color={colors.agility}
                                radius={90}
                                strokeWidth={10}
                            />
                            <Ring
                                value={leadership}
                                label="Leadership"
                                color={colors.leadership}
                                radius={68}
                                strokeWidth={10}
                            />
                        </svg>
                        {/* Center Score */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-3 lg:gap-y-[0.75vw]">
                            <span className="font-sans font-bold text-6xl lg:text-[3vw] text-[#19211C] dark:text-white leading-none">
                                {overallScore}
                            </span>
                            <span className="font-sans text-[#19211C]/50 dark:text-white/40 text-[12px] lg:text-[0.7vw] font-bold uppercase tracking-[0.25em]">
                                Growth
                            </span>
                        </div>
                    </div>

                    {/* Stats List - Now BELOW properly showing indicators */}
                    <div className="grid grid-cols-1 gap-4 lg:gap-[0.833vw] w-full max-w-[280px] lg:max-w-none">
                        <StatRow label="Personality" value={personality} color={colors.personality} />
                        <StatRow label="Agility" value={agility} color={colors.agility} />
                        <StatRow label="Leadership" value={leadership} color={colors.leadership} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImpactAssessmentCard;
