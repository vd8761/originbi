
import React from 'react';
import { ProfileIcon, JobsIcon, SettingsIcon } from './icons';
import Logo from './ui/Logo';

interface PortalHomeProps {
    onSelectPortal: (portal: 'student' | 'corporate' | 'admin') => void;
}

const PortalCard: React.FC<{ 
    title: string; 
    subtitle: string;
    description: string; 
    icon: React.ReactNode; 
    onClick: () => void;
    color: string;
    hoverBorderColor: string;
    shadowColor: string;
    delay?: string;
}> = ({ title, subtitle, description, icon, onClick, color, hoverBorderColor, shadowColor, delay }) => (
    <button 
        onClick={onClick}
        className={`
            group relative flex flex-col items-start text-left p-8 h-full
            bg-white dark:bg-[#13161B] 
            border border-gray-100 dark:border-white/5 
            rounded-[2rem] 
            transition-all duration-300 
            hover:-translate-y-2 hover:shadow-2xl ${shadowColor}
            animate-fade-in
            overflow-hidden
        `}
        style={{ animationDelay: delay }}
    >
        {/* Hover Gradient Overlay */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-[0.03] bg-current transition-opacity duration-300 ${color}`} />
        
        {/* Top Border Accent */}
        <div className={`absolute top-0 left-0 w-full h-1.5 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ${color.replace('text-', 'bg-')}`} />

        {/* Icon Header */}
        <div className="flex justify-between w-full items-start mb-6">
            <div className={`
                p-4 rounded-2xl bg-gray-50 dark:bg-white/5 
                group-hover:scale-110 transition-transform duration-300
                ${color}
            `}>
                <div className="w-8 h-8">
                    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-full h-full fill-current" }) : icon}
                </div>
            </div>
            
            <div className={`
                opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0
                bg-gray-50 dark:bg-white/10 p-2 rounded-full
            `}>
                <svg className={`w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            </div>
        </div>

        {/* Content */}
        <div className="space-y-3 mb-8 flex-grow">
            <span className={`text-xs font-bold tracking-wider uppercase opacity-80 ${color}`}>
                {subtitle}
            </span>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {description}
            </p>
        </div>

        {/* Footer / Badge */}
        <div className="w-full pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                Access Required
            </span>
            <span className={`text-xs font-bold ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                Enter Now
            </span>
        </div>
    </button>
);

const PortalHome: React.FC<PortalHomeProps> = ({ onSelectPortal }) => {
    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0D10] flex flex-col font-sans selection:bg-brand-green selection:text-white">
            
            {/* Header */}
            <div className="w-full max-w-7xl mx-auto p-6 sm:p-8 flex justify-between items-center">
               <Logo />
               <div className="hidden sm:block text-sm font-medium text-gray-500 dark:text-gray-400">
                   Secure Portal Access
               </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow flex flex-col justify-center items-center px-4 sm:px-6 py-12 relative">
                
                {/* Background Blobs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-green/5 rounded-full blur-[128px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[128px] pointer-events-none" />

                <div className="text-center max-w-2xl mx-auto mb-16 relative z-10">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
                        Choose your <span className="relative whitespace-nowrap">
                            <span className="relative z-10 text-brand-green">Workspace</span>
                            <span className="absolute bottom-1 left-0 w-full h-3 bg-brand-green/10 -rotate-2 -z-0"></span>
                        </span>
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
                        Welcome to OriginBI. Select the portal that aligns with your role to access your personalized dashboard and tools.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto relative z-10">
                    
                    <PortalCard 
                        title="Individual Portal" 
                        subtitle="Personal Growth"
                        description="For students and professionals. Track your career roadmap, take assessments, and view personal insights."
                        icon={<ProfileIcon />}
                        color="text-brand-green"
                        hoverBorderColor="hover:border-brand-green/30"
                        shadowColor="hover:shadow-brand-green/10"
                        onClick={() => onSelectPortal('student')}
                        delay="0ms"
                    />
                    
                    <PortalCard 
                        title="Corporate Portal" 
                        subtitle="Talent Management"
                        description="For HR and Recruiters. Manage employee registrations, assign tests, and analyze team performance."
                        icon={<JobsIcon />}
                        color="text-blue-500"
                        hoverBorderColor="hover:border-blue-500/30"
                        shadowColor="hover:shadow-blue-500/10"
                        onClick={() => onSelectPortal('corporate')}
                        delay="100ms"
                    />

                    <PortalCard 
                        title="Admin Portal" 
                        subtitle="System Control"
                        description="For Administrators. Configure platform settings, manage users, and oversee system health."
                        icon={<SettingsIcon />}
                        color="text-purple-500"
                        hoverBorderColor="hover:border-purple-500/30"
                        shadowColor="hover:shadow-purple-500/10"
                        onClick={() => onSelectPortal('admin')}
                        delay="200ms"
                    />

                </div>
            </div>

            {/* Footer */}
            <div className="py-8 text-center">
                <p className="text-xs text-gray-400 dark:text-gray-600">
                    © 2025 Origin BI. All rights reserved. <span className="mx-2">•</span> <a href="#" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Privacy</a> <span className="mx-2">•</span> <a href="#" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Terms</a>
                </p>
            </div>
        </div>
    );
};

export default PortalHome;
