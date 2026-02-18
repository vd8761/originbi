import React from 'react';
import ReportDownloadButton from './ReportDownloadButton';

const PersonalityCard: React.FC = () => {
    return (
        <div className="rounded-2xl relative w-full h-full min-h-[300px] overflow-hidden group">
            {/* Base Background - Dark Red Gradient */}
            {/* Concentric Circles Effect - Centered relative to the character */}
            {/* Using vw units for the circles to scale with the screen as requested */}
            <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[40vw] h-[40vw] max-w-[800px] max-h-[800px] rounded-full border-[2px] border-white/[0.05]" />
            <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[30vw] h-[30vw] max-w-[600px] max-h-[600px] rounded-full border-[2px] border-white/[0.05]" />
            <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[20vw] h-[20vw] max-w-[400px] max-h-[400px] rounded-full border-[2px] border-white/[0.05]" />
            <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[10vw] h-[10vw] max-w-[200px] max-h-[200px] rounded-full bg-white/[0.02] blur-2xl" />

            {/* Dark Gradient Overlay from Left - Improves text contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent z-15 pointer-events-none" />

            {/* Spiderman Image */}
            <div className="absolute inset-0 z-10 flex items-end justify-end">
                <img
                    src="/Analytical_Leader.png"
                    alt="Analytical Leader"
                    className="h-full w-full transition-transform duration-700 group-hover:scale-105"
                />
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 p-6 lg:p-[1.25vw] flex flex-col justify-start z-20">
                {/* Your Personality */}
                <h4 className="text-white/90 font-sans font-normal text-sm lg:text-[0.833vw] mb-[0.5em] lg:mb-[0.4vw] tracking-wide leading-none drop-shadow-sm">
                    Your Personality
                </h4>
                {/* Analytical Leader */}
                <h2 className="text-white font-sans font-bold text-3xl lg:text-[2.5vw] leading-[1] drop-shadow-lg">
                    Analytical <br /> Leader
                </h2>
                
                {/* Download Report Button */}
                <div className="mt-auto">
                    <ReportDownloadButton className="mt-4 pointer-events-auto" />
                </div>
            </div>
        </div>
    );
};

export default PersonalityCard;
