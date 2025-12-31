import React, { useState } from 'react';
import ToggleSwitch from '@/components/ui/ToggleSwitch';

interface VisibilityItemProps {
    title: string;
    subtitle: string;
    isOn: boolean;
    onToggle: () => void;
    disabled?: boolean;
    isLast?: boolean;
}

const VisibilityItem: React.FC<VisibilityItemProps> = ({
    title,
    subtitle,
    isOn,
    onToggle,
    disabled,
    isLast,
}) => (
    <div
        className={`flex justify-between items-center py-3 lg:py-[0.833vw] ${!isLast ? 'border-b border-brand-light-tertiary dark:border-white/10' : ''
            }`}
    >
        <div className="pr-4">
            <h4 className="font-semibold font-sans text-[#19211C] dark:text-brand-text-primary text-sm lg:text-[0.833vw] leading-tight">
                {title}
            </h4>
            <p className="font-regular font-sans text-[#19211C]/60 dark:text-brand-text-secondary mt-0.5 text-xs lg:text-[0.729vw] leading-tight">
                {subtitle}
            </p>
        </div>
        <ToggleSwitch isOn={isOn} onToggle={onToggle} disabled={disabled} />
    </div>
);

const PublicVisibilityCard: React.FC = () => {
    const [toggles, setToggles] = useState({
        nameContact: true,
        strengthSummary: true,
        interestAreas: true,
        fullResultsPDF: true,
        strengthsImprovements: false,
        careerRoadmap: false,
    });

    const handleToggle = (key: keyof typeof toggles) => {
        setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="bg-white/20 border border-[#19211C]/12 dark:bg-brand-dark-secondary dark:border-transparent rounded-2xl h-full flex flex-col backdrop-blur-sm">
            <div className="px-6 pt-6 pb-2 lg:px-[1.25vw] lg:pt-[1.25vw] lg:pb-[0.4vw]">
                <h3 className="font-semibold font-sans text-[#19211C] dark:text-brand-text-primary text-lg lg:text-[1.25vw] mb-2 leading-tight">
                    Public Visibility
                </h3>
                <p className="font-regular font-sans text-[#19211C]/60 dark:text-brand-text-secondary text-xs lg:text-[0.729vw] leading-relaxed">
                    Control what recruiters see on your profile to highlight your strengths and attract
                    the right opportunities.
                </p>
            </div>

            <div className="px-6 pt-2 pb-6 lg:px-[1.25vw] lg:pt-[0.41vw] lg:pb-[1.25vw] flex-grow">
                <div className="space-y-1">
                    <VisibilityItem
                        title="Name & Contact Info"
                        subtitle="Your basic professional details"
                        isOn={toggles.nameContact}
                        onToggle={() => handleToggle('nameContact')}
                        disabled
                    />
                    <VisibilityItem
                        title="Full Results PDF"
                        subtitle="Your detailed assessment insights"
                        isOn={toggles.fullResultsPDF}
                        onToggle={() => handleToggle('fullResultsPDF')}
                    />
                    <VisibilityItem
                        title="Strengths & Improvements"
                        subtitle="Focus areas and growth points"
                        isOn={toggles.strengthsImprovements}
                        onToggle={() => handleToggle('strengthsImprovements')}
                    />
                    <VisibilityItem
                        title="Career Roadmap"
                        subtitle="Your future career direction"
                        isOn={toggles.careerRoadmap}
                        onToggle={() => handleToggle('careerRoadmap')}
                        isLast
                    />
                </div>
            </div>
        </div>
    );
};

export default PublicVisibilityCard;
