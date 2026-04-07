import React from 'react';

interface JobItemProps {
    role: string;
    company: string;
    location: string;
    alignment: number;
    type: string;
    level: string;
    salary: string;
    skills: string[];
    postedDate: string;
}

const JobItem: React.FC<JobItemProps> = ({
    role,
    company,
    location,
    alignment,
    type,
    level,
    salary,
    skills,
    postedDate
}) => (
    <div className="bg-white/5 rounded-2xl p-4 lg:p-[1vw] flex flex-col h-full border border-white/5 hover:bg-white/10 transition-all duration-300 group cursor-pointer">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 lg:w-[2.5vw] lg:h-[2.5vw] bg-white rounded-full flex items-center justify-center p-1.5 overflow-hidden">
                    <img src="/images/google.png" alt="Company" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[#19211C] dark:text-brand-text-primary text-sm lg:text-[0.937vw] leading-tight truncate">{role}</h4>
                    <p className="text-[#19211C] dark:text-white text-[10px] lg:text-[0.729vw] mt-0.5 truncate">{company} | {location}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[10px] lg:text-[0.729vw] font-medium text-[#19211C] dark:text-white">
                    Role Alignment : <span className="text-brand-green">{alignment}%</span>
                </p>
            </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
            <span className="flex items-center space-x-1.5 text-[10px] lg:text-[0.729vw] text-[#19211C] dark:text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
                <span>{type}</span>
            </span>
            <span className="flex items-center space-x-1.5 text-[10px] lg:text-[0.729vw] text-[#19211C] dark:text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
                <span>{level}</span>
            </span>
            <span className="flex items-center space-x-1.5 text-[10px] lg:text-[0.729vw] text-[#19211C] dark:text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
                <span>CTC {salary}</span>
            </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-auto">
            {skills.map((skill, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-full bg-white text-[#19211C] font-medium text-[9px] lg:text-[0.625vw]">
                    {skill}
                </span>
            ))}
            <span className="text-[#19211C] dark:text-white text-[9px] lg:text-[0.625vw] ml-auto self-center mt-1">
                {postedDate}
            </span>
        </div>
    </div>
);


const MyJobsCard: React.FC = () => {
    const jobs = [
        {
            role: 'UI/UX Designer',
            company: 'Google Inc',
            location: 'Chennai (Onsite)',
            alignment: 92,
            type: 'Full-Time',
            level: 'Fresher',
            salary: '3,50,000 - 4,00,000',
            skills: ['Figma', 'Prototyping', 'Wire Framing'],
            postedDate: 'Today'
        },
        {
            role: 'UI/UX Designer',
            company: 'Google Inc',
            location: 'Chennai (Onsite)',
            alignment: 92,
            type: 'Full-Time',
            level: 'Fresher',
            salary: '3,50,000 - 4,00,000',
            skills: ['Figma', 'Prototyping', 'Wire Framing'],
            postedDate: 'Yesterday'
        },
        {
            role: 'UI/UX Designer',
            company: 'Google Inc',
            location: 'Chennai (Onsite)',
            alignment: 92,
            type: 'Full-Time',
            level: 'Fresher',
            salary: '3,50,000 - 4,00,000',
            skills: ['Figma', 'Prototyping', 'Wire Framing'],
            postedDate: '12/04/2026'
        },
        {
            role: 'UI/UX Designer',
            company: 'Google Inc',
            location: 'Chennai (Onsite)',
            alignment: 92,
            type: 'Full-Time',
            level: 'Fresher',
            salary: '3,50,000 - 4,00,000',
            skills: ['Figma', 'Prototyping', 'Wire Framing'],
            postedDate: '25/05/2026'
        }
    ];

    return (
        <div className="dashboard-glass-card h-full flex flex-col p-4 sm:p-6 lg:p-[1.25vw]">
            <div className="flex justify-between items-center mb-6 lg:mb-[1.25vw]">
                <h3 className="font-semibold text-[#19211C] dark:text-white text-lg lg:text-[1.25vw]">My Jobs</h3>
                <a href="#" className="text-brand-green text-xs lg:text-[0.833vw] font-medium hover:underline">View All</a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-[1vw] overflow-y-auto custom-scrollbar">
                {jobs.map((job, index) => (
                    <JobItem key={index} {...job} />
                ))}
            </div>
        </div>
    );
};

export default MyJobsCard;
