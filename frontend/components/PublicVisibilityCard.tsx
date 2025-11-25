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
        className={`flex justify-between items-center py-3 ${
            !isLast ? 'border-b border-brand-light-tertiary dark:border-white/10' : ''
        }`}
    >
        <div>
            <h4 className="font-semibold text-brand-text-light-primary dark:text-brand-text-primary">
                {title}
            </h4>
            <p className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary">
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
        <div className="bg-brand-light-secondary dark:bg-brand-dark-secondary rounded-2xl h-full flex flex-col">
            <div className="px-6 pt-6 pb-4">
                <h3 className="text-lg font-bold text-brand-text-light-primary dark:text-brand-text-primary mb-1">
                    Public Visibility
                </h3>
                <p className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary">
                    Control what recruiters see on your profile to highlight your strengths and attract
                    the right opportunities.
                </p>
            </div>
            <hr className="border-brand-light-tertiary dark:border-white/10" />
            <div className="px-6 pt-4 pb-6 flex-grow">
                <div className="space-y-2">
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
