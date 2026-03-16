import React from 'react';

const TopCollegesCard: React.FC = () => {
    return (
        <div className="relative bg-white/20 border border-[#19211C]/12 dark:bg-brand-dark-secondary dark:border-transparent rounded-2xl h-full flex flex-col overflow-hidden">
            {/* Content */}
            <div className="relative z-10 p-6 lg:p-[1.25vw] flex flex-col h-full">
                {/* Header with Coming Soon Badge */}
                <div className="flex justify-between items-start mb-4 lg:mb-[0.833vw]">
                    <h3 className="font-semibold font-sans text-[#19211C] dark:text-white text-lg lg:text-[1.25vw] leading-tight">
                        Top Colleges for You
                    </h3>
                    <span className="inline-flex items-center px-3 py-1 lg:px-[0.625vw] lg:py-[0.2vw] rounded-full bg-brand-green/10 dark:bg-brand-green/20 border border-brand-green/20 dark:border-brand-green/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse mr-1.5" />
                        <span className="font-sans font-medium text-brand-green text-[10px] lg:text-[0.625vw]">
                            Coming Soon
                        </span>
                    </span>
                </div>

                {/* Description */}
                <p className="font-sans text-[#19211C]/60 dark:text-white/50 text-xs lg:text-[0.729vw] leading-relaxed mb-6 lg:mb-[1.25vw]">
                    Discover colleges that match your personality profile and career interests.
                    Get personalized recommendations based on your assessment results.
                </p>

                {/* Placeholder College Cards Removed as requested */}
                <div className="flex-1 flex flex-col justify-center items-center py-8">
                    <div className="w-16 h-16 rounded-full bg-brand-green/5 flex items-center justify-center mb-4 transition-transform hover:scale-110">
                        <svg className="w-8 h-8 text-brand-green/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                        </svg>
                    </div>
                    <p className="font-sans text-[#19211C]/40 dark:text-white/30 text-sm lg:text-[0.833vw] max-w-[200px] text-center">
                        Your college roadmap is being generated...
                    </p>
                </div>

                {/* Bottom CTA */}
                <div className="mt-4 lg:mt-[0.833vw] text-center">
                    <p className="font-sans text-[#19211C]/40 dark:text-white/30 text-[10px] lg:text-[0.625vw]">
                        Based on your DISC profile & academic preferences
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TopCollegesCard;
