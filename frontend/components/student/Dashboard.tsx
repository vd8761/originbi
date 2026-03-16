import React, { useEffect, useState } from 'react';
import PersonalityCard from './PersonalityCard';
import PublicVisibilityCard from './PublicVisibilityCard';
import ConsultantCallCard from './ConsultantCallCard';
import RoadmapsCard from './RoadmapsCard';
import MoodCard from './MoodCard';
import ImpactAssessmentCard from './ImpactAssessmentCard';
import TopCollegesCard from './TopCollegesCard';

const Dashboard: React.FC = () => {
    const [isSchool, setIsSchool] = useState(false);

    useEffect(() => {
        const checkProgram = () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    if (user.programCode) {
                        const code = (user.programCode || '').toUpperCase();
                        setIsSchool(code.includes('SCHOOL'));
                        return true;
                    }
                    if (Object.prototype.hasOwnProperty.call(user, 'id')) return true;
                } catch (e) {
                    console.error("Error parsing user from localStorage", e);
                }
            }
            return false;
        };

        if (!checkProgram()) {
            const interval = setInterval(() => {
                if (checkProgram()) clearInterval(interval);
            }, 500);
            const timeout = setTimeout(() => clearInterval(interval), 5000);
            return () => { clearInterval(interval); clearTimeout(timeout); };
        }
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-[1.666vw] w-full auto-rows-auto lg:auto-rows-fr">
            {/* 
              GRID SYSTEM (12 Columns Desktop / 2 Columns Tablet / 1 Column Mobile)
              
              Row 1:
              - Personality: 50% (6 cols) | Tablet: 100% (2 cols)
              - Public Vis:  25% (3 cols) | Tablet: 50% (1 col)
              - Consultant:  25% (3 cols) | Tablet: 50% (1 col)
              
              Row 2 (College):
              - Roadmaps:    33% (4 cols) | Tablet: 100% (2 cols)
              - Mood:        66% (8 cols) | Tablet: 100% (2 cols)

              Row 2 (School):
              - Roadmaps:            33% (4 cols)
              - Impact Assessment:   33% (4 cols)
              - Top Colleges:        33% (4 cols)
            */}

            {/* Row 1 */}
            <div className="col-span-1 md:col-span-2 lg:col-span-6 h-full">
                <PersonalityCard />
            </div>
            {isSchool ? (
                <>
                    <div className="col-span-1 md:col-span-1 lg:col-span-3 h-full">
                        <ImpactAssessmentCard />
                    </div>
                    <div className="col-span-1 md:col-span-1 lg:col-span-3 h-full">
                        <ConsultantCallCard />
                    </div>
                </>
            ) : (
                <>
                    <div className="col-span-1 md:col-span-1 lg:col-span-3 h-full">
                        <PublicVisibilityCard />
                    </div>
                    <div className="col-span-1 md:col-span-1 lg:col-span-3 h-full">
                        <ConsultantCallCard />
                    </div>
                </>
            )}

            {/* Row 2 */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 h-full">
                <RoadmapsCard />
            </div>

            {isSchool ? (
                <div className="col-span-1 md:col-span-2 lg:col-span-8 h-full">
                    <TopCollegesCard />
                </div>
            ) : (
                <div className="col-span-1 md:col-span-2 lg:col-span-8 h-full">
                    <MoodCard />
                </div>
            )}
        </div>
    );
};

export default Dashboard;