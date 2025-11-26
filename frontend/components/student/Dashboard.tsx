import React from 'react';
import PersonalityCard from '@/components/student/PersonalityCard';
import PublicVisibilityCard from '@/components/student/PublicVisibilityCard';
import ConsultantCallCard from '@/components/student/ConsultantCallCard';
import RoadmapsCard from '@/components/student/RoadmapsCard';
import MoodCard from '@/components/student/MoodCard';

const Dashboard: React.FC = () => {
    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 lg:row-span-1">
                    <PersonalityCard />
                </div>
                <div className="lg:col-span-3 lg:row-span-1">
                    <PublicVisibilityCard />
                </div>
                <div className="lg:col-span-3 lg:row-span-1">
                    <ConsultantCallCard />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4">
                    <RoadmapsCard />
                </div>
                <div className="lg:col-span-8">
                    <MoodCard />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;