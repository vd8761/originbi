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
    accentColor: string;
    delay?: string;
}> = ({ title, subtitle, description, icon, onClick, accentColor, delay }) => (
    <button 
        onClick={onClick}
        className={`relative group flex flex-col h-full overflow-hidden rounded-[2rem] p-1 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl animate-fade-in ${delay}`}
    >
        {/* Border Gradient & Glow */}
        <div className={`absolute inset-0 bg-gradient-to-br ${accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />
        <div className={`absolute inset-0 bg-gradient-to-br ${accentColor} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
        
        {/* Card Content */}
        <div className="relative flex flex-col h-full bg-brand-light-primary dark:bg-[#13161B] rounded-[1.8rem] p-8 sm:p-10 border border-brand-light-tertiary dark:border-white/5 h-full z-10 overflow-hidden">
            
            {/* Background Decor */}
            <div className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${accentColor} opacity-[0.03] group-hover:opacity-[0.08] rounded-full blur-3xl transition-opacity duration-500`} />

            {/* Icon */}
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-8 text-white shadow-lg bg-gradient-to-br ${accentColor} transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                <div className="scale-150">
                    {icon}
                </div>
            </div>
            
            <div className="text-left flex-grow">
                <h3 className="text-3xl font-bold text-brand-text-light-primary dark:text-white mb-2 leading-tight">
                    {title}
                </h3>
                <p className={`text-sm font-bold uppercase tracking-wider mb-4 bg-clip-text text-transparent bg-gradient-to-r ${accentColor}`}>
                    {subtitle}
                </p>
                <p className="text-brand-text-light-secondary dark:text-gray-400 leading-relaxed text-base">
                    {description}
                </p>
            </div>
            
            <div className="mt-10 flex items-center text-sm font-bold tracking-wide uppercase group/btn">
                <span className={`flex items-center justify-center px-6 py-3 rounded-full text-white bg-gradient-to-r ${accentColor} shadow-md group-hover/btn:shadow-lg group-hover/btn:brightness-110 transition-all duration-300`}>
                    Get Started
                    <svg className="w-4 h-4 ml-2 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </span>
            </div>
        </div>
    </button>
);

const PortalHome: React.FC<PortalHomeProps> = ({ onSelectPortal }) => {
    return (
        <div className="min-h-screen bg-brand-light-secondary dark:bg-[#0B0D10] flex flex-col relative overflow-hidden">
            
            {/* Navigation / Header Area */}
            <div className="absolute top-0 left-0 w-full p-6 z-50 flex justify-between items-center">
               <div className="scale-110 origin-top-left">
                   <Logo />
               </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-brand-green/10 rounded-full blur-[150px] animate-blob" />
                <div className="absolute bottom-[-20%] right-[10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] animate-blob" style={{ animationDelay: '4s' }} />
            </div>

            <div className="flex-grow flex flex-col justify-center items-center p-6 sm:p-10 relative z-10">
                <div className="text-center mb-16 sm:mb-20 max-w-4xl mx-auto mt-20 sm:mt-0">
                    <span className="inline-block py-1 px-4 rounded-full bg-brand-green/10 text-brand-green font-bold text-sm tracking-widest uppercase mb-6 animate-fade-in">
                        Choose Your Portal
                    </span>
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-brand-text-light-primary dark:text-white mb-8 tracking-tight leading-none animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-400">OriginBI</span>
                    </h1>
                    <p className="text-xl text-brand-text-light-secondary dark:text-gray-400 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        Empowering careers and organizations through intelligent assessments. Select your role to access your personalized dashboard.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto items-stretch">
                    
                    {/* Individual Portal */}
                    <PortalCard 
                        title="Individual Portal" 
                        subtitle="For Students, Employees & Leaders"
                        description="Unlock your potential. Access personalized assessments, view your career roadmap, and track your growth journey."
                        icon={<ProfileIcon className="w-8 h-8" />}
                        accentColor="from-brand-green to-emerald-600"
                        onClick={() => onSelectPortal('student')}
                        delay="animation-delay-300"
                    />
                    
                    {/* Corporate Portal */}
                    <PortalCard 
                        title="Corporate Portal" 
                        subtitle="For Organizations & Recruiters"
                        description="Streamline talent management. Register employees, assign assessments in bulk, and view comprehensive analytics."
                        icon={<JobsIcon className="w-8 h-8" />}
                        accentColor="from-blue-500 to-indigo-600"
                        onClick={() => onSelectPortal('corporate')}
                        delay="animation-delay-400"
                    />

                    {/* Admin Portal */}
                    <PortalCard 
                        title="Admin Portal" 
                        subtitle="For System Administrators"
                        description="Platform control center. Manage users, configure system settings, and oversee global platform operations."
                        icon={<SettingsIcon className="w-8 h-8" />}
                        accentColor="from-purple-500 to-pink-600"
                        onClick={() => onSelectPortal('admin')}
                        delay="animation-delay-500"
                    />
                </div>
            </div>
            
            <div className="p-6 text-center text-sm text-brand-text-light-secondary dark:text-gray-600 font-medium">
                &copy; 2025 Origin BI. All rights reserved.
            </div>
        </div>
    );
};

export default PortalHome;