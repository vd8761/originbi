import React from 'react';

interface TopCollegesCardProps {
    reportData?: any;
    isLoadingReport?: boolean;
}

const TopCollegesCard: React.FC<TopCollegesCardProps> = ({ reportData, isLoadingReport }) => {
    const schoolLevel = reportData?.meta?.schoolLevel; // 'SSLC' or 'HSC'
    const isSSLC = schoolLevel === 'SSLC';

    // Data for SSLC (Streams)
    const streamData = reportData?.sections?.whereYouFitBest;
    const recommendedStream = streamData?.recommendedStream;
    const alternativeStreams = streamData?.alternativeStreams || [];

    // Data for HSC (Colleges)
    const colleges = reportData?.sections?.topColleges || [];

    // Fallback/Legacy: Courses
    const courses = reportData?.sections?.courseCompatibility?.courses || [];

    const isAnyLoading = isLoadingReport;
    const hasData = isSSLC ? !!recommendedStream : (colleges.length > 0 || courses.length > 0);

    return (
        <div className="relative dashboard-glass-card h-full flex flex-col overflow-hidden">
            {/* Content */}
            <div className="relative z-10 p-6 lg:p-[1.25vw] flex flex-col h-full">
                {/* Header with Badge */}
                <div className="flex justify-between items-start mb-4 lg:mb-[0.833vw]">
                    <h3 className="font-semibold font-sans text-[#19211C] dark:text-white text-lg lg:text-[1.25vw] leading-tight">
                        {isSSLC ? "Streams for You" : "Top Colleges for You"}
                    </h3>
                    <span className="inline-flex items-center px-3 py-1 lg:px-[0.625vw] lg:py-[0.2vw] rounded-full bg-brand-green/10 dark:bg-brand-green/20 border border-brand-green/20 dark:border-brand-green/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green mr-1.5" />
                        <span className="font-sans font-medium text-brand-green text-[10px] lg:text-[0.625vw]">
                            {hasData ? "Personalized" : "Coming Soon"}
                        </span>
                    </span>
                </div>

                {/* Description */}
                <p className="font-sans text-[#19211C]/60 dark:text-white/50 text-xs lg:text-[0.729vw] leading-relaxed mb-6 lg:mb-[1.25vw]">
                    {isSSLC
                        ? "Explore academic streams that best suit your personality and cognitive strengths."
                        : "Discover colleges that match your personality profile and career interests."
                    }
                    {" "}Get personalized recommendations based on your assessment results.
                </p>

                {isAnyLoading ? (
                    <div className="flex-1 flex flex-col justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
                    </div>
                ) : hasData ? (
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-4">
                            {isSSLC ? (
                                <>
                                    {/* Recommended Stream */}
                                    {recommendedStream && (
                                        <div className="p-3 rounded-xl bg-brand-green/5 border border-brand-green/20">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider">Recommended</span>
                                                <span className="text-brand-green font-bold text-xs lg:text-[0.833vw]">
                                                    {recommendedStream.compatibility}% Match
                                                </span>
                                            </div>
                                            <h4 className="font-sans font-bold text-[#19211C] dark:text-white text-sm lg:text-[1.042vw]">
                                                {recommendedStream.shortName}
                                            </h4>
                                            <p className="text-[10px] lg:text-[0.729vw] text-[#19211C]/60 dark:text-white/50">
                                                {recommendedStream.fullName}
                                            </p>
                                        </div>
                                    )}
                                    {/* Alternative Streams */}
                                    {alternativeStreams.slice(0, 3).map((alt: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                                            <div className="flex-1 pr-4">
                                                <h4 className="font-sans font-bold text-[#19211C] dark:text-white text-sm lg:text-[0.938vw]">
                                                    {alt.shortName}
                                                </h4>
                                                <p className="text-[10px] lg:text-[0.729vw] text-[#19211C]/60 dark:text-white/50">
                                                    {alt.fullName}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[#19211C]/60 dark:text-white/40 font-bold text-xs lg:text-[0.833vw]">
                                                    {alt.compatibility}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <>
                                    {/* HSC: Colleges or Fallback Courses */}
                                    {(colleges.length > 0 ? colleges : courses).slice(0, 5).map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                            <div className="flex-1 pr-4">
                                                <h4 className="font-sans font-bold text-[#19211C] dark:text-white text-sm lg:text-[0.938vw]">
                                                    {item.name || item.course_name}
                                                </h4>
                                                <p className="text-[10px] lg:text-[0.729vw] text-[#19211C]/60 dark:text-white/50">
                                                    {item.city ? `${item.city}, ${item.state}` : item.department_name}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-brand-green font-bold text-xs lg:text-[0.833vw]">
                                                    {item.score ? `Score: ${item.score}` : `${item.compatibility_percentage}%`}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                ) : (
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
                )}

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
