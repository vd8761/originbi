import React, { useEffect, useState } from 'react';
import { studentService } from '../../lib/services/student.service';
import PersonalityCard from './PersonalityCard';
import ConsultantCallCard from './ConsultantCallCard';
import RoadmapsCard from './RoadmapsCard';
import MoodCard from './MoodCard';
import MyJobsCard from './MyJobsCard';
import ImpactAssessmentCard from './ImpactAssessmentCard';
import TopCollegesCard from './TopCollegesCard';

const Dashboard: React.FC = () => {
    const [isSchool, setIsSchool] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [isLoadingReport, setIsLoadingReport] = useState(false);

    useEffect(() => {
        const checkProgram = async () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);

                    // Fetch report data if not already fetched
                    if (user.id && !reportData && !isLoadingReport) {
                        setIsLoadingReport(true);
                        const data = await studentService.getStudentReport(user.id);
                        if (data) {
                            setReportData(data);
                        }
                        setIsLoadingReport(false);
                    }

                    if (user.programCode) {
                        const code = (user.programCode || '').toUpperCase();
                        setIsSchool(code.includes('SCHOOL'));
                        return true;
                    }
                    if (Object.prototype.hasOwnProperty.call(user, 'id')) return true;
                } catch (e) {
                    console.error("Error parsing user or fetching report", e);
                    setIsLoadingReport(false);
                }
            }
            return false;
        };

        const init = async () => {
            if (!(await checkProgram())) {
                const interval = setInterval(async () => {
                    if (await checkProgram()) clearInterval(interval);
                }, 500);
                const timeout = setTimeout(() => clearInterval(interval), 5000);
                return () => { clearInterval(interval); clearTimeout(timeout); };
            }
        };
        init();
    }, []);

    return (
        <div className="relative min-h-screen bg-transparent dark:bg-[#19211C] font-sans transition-colors duration-300 overflow-hidden p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-[1.666vw] w-full auto-rows-auto">
            {/* 
              GRID SYSTEM (12 Columns Desktop / 2 Columns Tablet / 1 Column Mobile)
              
              Row 1:
              - Personality: 50% (6 cols) | Tablet: 100% (2 cols)
              - Consultant:  25% (3 cols) | Tablet: 50% (1 col)
              - Roadmaps:    25% (3 cols) | Tablet: 50% (1 col)
              
              Row 2 (College):
              - Mood:        33% (4 cols) | Tablet: 100% (2 cols)
              - My Jobs:     66% (8 cols) | Tablet: 100% (2 cols)

              Row 2 (School):
              - Roadmaps:            33% (4 cols)
              - Impact Assessment:   33% (4 cols)
              - Top Colleges:        33% (4 cols)
            */}

            {/* Row 1 */}
            <div className="col-span-1 md:col-span-2 lg:col-span-6 h-full">
                <PersonalityCard reportData={reportData} isLoadingReport={isLoadingReport} />
            </div>
            {isSchool ? (
                <>
                    <div className="col-span-1 md:col-span-1 lg:col-span-3 h-full">
                        <ImpactAssessmentCard reportData={reportData} isLoadingReport={isLoadingReport} />
                    </div>
                    <div className="col-span-1 md:col-span-1 lg:col-span-3 h-full">
                        <ConsultantCallCard />
                    </div>
                </>
            ) : (
                <>
                    <div className="col-span-1 md:col-span-1 lg:col-span-3 h-full">
                        <ConsultantCallCard />
                    </div>
                    <div className="col-span-1 md:col-span-1 lg:col-span-3 h-full">
                        <RoadmapsCard />
                    </div>
                </>
            )}

            {/* Row 2 */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 h-full">
                {isSchool ? (
                    <RoadmapsCard />
                ) : (
                    <MoodCard />
                )}
            </div>

            {isSchool && (
                <div className="col-span-1 md:col-span-2 lg:col-span-8 h-full">
                    <TopCollegesCard reportData={reportData} isLoadingReport={isLoadingReport} />
                </div>
            )}
            {!isSchool && (
                <div className="col-span-1 md:col-span-2 lg:col-span-8 h-full">
                    <MyJobsCard />
                </div>
            )}
            </div>
        </div>
    );
};

export default Dashboard;
