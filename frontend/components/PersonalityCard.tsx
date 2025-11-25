import React from 'react';

const PersonalityCard: React.FC = () => {
    return (
        <div className="rounded-2xl relative w-full h-full min-h-[300px] overflow-hidden bg-brand-light-secondary dark:bg-brand-dark-secondary">
            <img
                src="/Analytical_Leader.png"
                alt="Analytical Leader Character"
                className="absolute inset-0 w-full h-full object-cover"
            />
        </div>
    );
};

export default PersonalityCard;
