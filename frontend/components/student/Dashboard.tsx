import React from 'react';
import PersonalityCard from '@/components/student/PersonalityCard';
import PublicVisibilityCard from '@/components/student/PublicVisibilityCard';
import ConsultantCallCard from '@/components/student/ConsultantCallCard';
import RoadmapsCard from '@/components/student/RoadmapsCard';
import MoodCard from '@/components/student/MoodCard';

const Dashboard: React.FC = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-[1.666vw] w-full auto-rows-auto lg:auto-rows-fr">
            {/* 
              GRID SYSTEM (12 Columns Desktop / 2 Columns Tablet / 1 Column Mobile)
              
              Row 1:
              - Personality: 50% (6 cols) | Tablet: 100% (2 cols)
              - Public Vis:  25% (3 cols) | Tablet: 50% (1 col)
              - Consultant:  25% (3 cols) | Tablet: 50% (1 col)
              
              Row 2:
              - Roadmaps:    33% (4 cols) | Tablet: 100% (2 cols) -> Consider 50%? No, content needs space.
              - Mood:        66% (8 cols) | Tablet: 100% (2 cols)
            */}

            {/* Row 1 */}
            <div className="col-span-1 md:col-span-2 lg:col-span-6 h-full">
                <PersonalityCard />
            </div>
            <div className="col-span-1 md:col-span-1 lg:col-span-3 h-full">
                <PublicVisibilityCard />
            </div>
            <div className="col-span-1 md:col-span-1 lg:col-span-3 h-full">
                <ConsultantCallCard />
            </div>

            {/* Row 2 */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 h-full">
                <RoadmapsCard />
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-8 h-full">
                <MoodCard />
            </div>
        </div>
    );
};

export default Dashboard;