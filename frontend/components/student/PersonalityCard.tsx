import React, { useEffect, useState } from 'react';

interface PersonalityCardProps {
    reportData?: any;
    isLoadingReport?: boolean;
}

const PersonalityCard: React.FC<PersonalityCardProps> = ({ reportData, isLoadingReport }) => {
    const [trait, setTrait] = useState<{ id: number; name: string; code: string; colorRgb: string } | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [isImageLoading, setIsImageLoading] = useState(true);

    useEffect(() => {
        let storedTrait: { id: number; name: string; code: string; colorRgb: string } | null = null;
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.personalityTrait) {
                    storedTrait = user.personalityTrait;
                }
            }
        } catch (e) {
            console.error("Error parsing user from localStorage", e);
        }

        if (reportData) {
            setTrait({
                id: storedTrait?.id || 0,
                name: storedTrait?.name || "Analytical Leader",
                code: storedTrait?.code || reportData.discProfile?.primaryType || "D",
                colorRgb: storedTrait?.colorRgb || "0,0,0"
            });
            setIsLoadingUser(false);
            return;
        }

        const checkUser = () => {
            if (storedTrait) {
                setTrait(storedTrait);
                setIsLoadingUser(false);
                return true;
            }
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    if (Object.prototype.hasOwnProperty.call(user, 'id')) {
                        // User is present but no personality trait yet
                        setIsLoadingUser(false);
                        return true;
                    }
                }
            } catch (e) {
                console.error("Error checking user id", e);
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
                setIsLoadingUser(false);
                clearInterval(interval);
            }, 5000);

            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
            };
        }
    }, [reportData]);

    let traitName = trait?.name || "Analytical Leader";
    if (traitName.toLowerCase().startsWith('the ')) {
        traitName = traitName.substring(4);
    }
    const traitImageKey = traitName.replace(/\s+/g, '_');
    const imageSrc = `/student_traits/${traitImageKey}.png`;

    const nameWords = traitName.split(' ');
    const firstName = nameWords[0] || "";
    const remainingName = nameWords.slice(1).join(' ');

    const isAnyLoading = isLoadingReport || (!trait && isLoadingUser);

    return (
        <div className="rounded-2xl relative w-full h-full min-h-[220px] md:min-h-[300px] overflow-hidden group bg-gradient-to-br from-[#150089] to-[#0D0055]">
            {isAnyLoading && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-b-2 border-[#1ED36A]"></div>
                </div>
            )}

            {/* Base Background - Dark Red Gradient */}
            {/* Concentric Circles Effect - Centered relative to the character */}
            {/* Using vw units for the circles to scale with the screen as requested */}
            <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[40vw] h-[40vw] max-w-[800px] max-h-[800px] rounded-full border-[1px] border-white/[0.08]" />
            <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[30vw] h-[30vw] max-w-[600px] max-h-[600px] rounded-full border-[1px] border-white/[0.08]" />
            <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[20vw] h-[20vw] max-w-[400px] max-h-[400px] rounded-full border-[1px] border-white/[0.08]" />
            <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[10vw] h-[10vw] max-w-[200px] max-h-[200px] rounded-full bg-white/[0.03] blur-2xl" />

            {/* Dark Gradient Overlay from Left - Improves text contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent z-15 pointer-events-none" />

            {/* Trait Image */}
            <div className="absolute inset-0 z-10 flex items-end justify-end transition-opacity duration-300">
                <img
                    src={imageSrc}
                    alt={traitName}
                    className="h-full w-full object-cover object-bottom transition-transform duration-700 group-hover:scale-105"
                    onLoad={() => setIsImageLoading(false)}
                    onError={(e) => {
                        setIsImageLoading(false);
                        e.currentTarget.src = "/student_traits/Analytical_Leader.png";
                    }}
                />
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 p-4 md:p-6 lg:p-[1.25vw] flex flex-col justify-start z-20 transition-opacity duration-500">
                {/* Your Personality */}
                <h4 className="text-white/90 font-sans font-normal text-sm lg:text-[0.833vw] mb-[0.5em] lg:mb-[0.4vw] tracking-wide leading-none drop-shadow-sm">
                    Your Personality
                </h4>
                {/* Dynamic Trait Name */}
                <h2 className="text-white font-sans font-bold text-3xl lg:text-[2.5vw] leading-[1] drop-shadow-lg">
                    {firstName} <br /> {remainingName}
                </h2>

                {/* Download Report Button */}
                {/* 
                <div className="mt-auto">
                    <ReportDownloadButton className="mt-4 pointer-events-auto" />
                </div>
                */}
            </div>
        </div>
    );
};

export default PersonalityCard;
