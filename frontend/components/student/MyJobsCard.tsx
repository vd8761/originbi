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
    <div className="bg-[#19211C]/5 dark:bg-white/5 rounded-2xl p-4 lg:p-[1vw] flex flex-col h-full border border-transparent hover:border-brand-green/30 transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 lg:w-[2.5vw] lg:h-[2.5vw] bg-white rounded-lg flex items-center justify-center p-1.5 overflow-hidden">
                    <img src="/google-logo.png" alt="Company" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png' }} />
                </div>
                <div>
                    <h4 className="font-semibold text-[#19211C] dark:text-white text-sm lg:text-[0.937vw] leading-tight">{role}</h4>
                    <p className="text-[#19211C]/60 dark:text-white/60 text-[10px] lg:text-[0.729vw] mt-0.5">{company} | {location}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[10px] lg:text-[0.729vw] font-medium text-[#19211C]/60 dark:text-white/60">
                    Role Alignment : <span className="text-brand-green">{alignment}%</span>
                </p>
            </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
            <span className="flex items-center space-x-1.5 text-[10px] lg:text-[0.729vw] text-[#19211C]/70 dark:text-white/70">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
                <span>{type}</span>
            </span>
            <span className="flex items-center space-x-1.5 text-[10px] lg:text-[0.729vw] text-[#19211C]/70 dark:text-white/70">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
                <span>{level}</span>
            </span>
            <span className="flex items-center space-x-1.5 text-[10px] lg:text-[0.729vw] text-[#19211C]/70 dark:text-white/70">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
                <span>CTC {salary}</span>
            </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-auto">
            {skills.map((skill, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-full bg-white dark:bg-white/10 text-[#19211C] dark:text-white text-[9px] lg:text-[0.625vw] border border-[#19211C]/10 dark:border-white/10">
                    {skill}
                </span>
            ))}
            <span className="text-[#19211C]/40 dark:text-white/40 text-[9px] lg:text-[0.625vw] ml-auto self-center mt-1">
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
            skills: ['Figma', 'Prototyping', 'Wire Framing', 'A...'],
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
            skills: ['Figma', 'Prototyping', 'Wire Framing', 'A...'],
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
            skills: ['Figma', 'Prototyping', 'Wire Framing', 'A...'],
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
            skills: ['Figma', 'Prototyping', 'Wire Framing', 'A...'],
            postedDate: '25/05/2026'
        }
    ];

    return (
        <div className="dashboard-glass-card h-full flex flex-col p-6 lg:p-[1.25vw]">
            <div className="flex justify-between items-center mb-6 lg:mb-[1.25vw]">
                <h3 className="font-semibold text-[#19211C] dark:text-white text-lg lg:text-[1.25vw]">My Jobs</h3>
                <a href="#" className="text-brand-green text-xs lg:text-[0.833vw] font-medium hover:underline">View All</a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-[1vw] overflow-y-auto pr-1">
                {jobs.map((job, index) => (
                    <JobItem key={index} {...job} />
                ))}
            </div>
        </div>
    );
};

export default MyJobsCard;
