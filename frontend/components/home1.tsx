
import React, { useState } from 'react';
import { ProfileIcon, JobsIcon, SettingsIcon } from './icons';
import Logo from './ui/Logo';

interface PortalHomeProps {
    onSelectPortal: (portal: 'student' | 'corporate' | 'admin') => void;
}

interface PortalItemProps {
    id: 'student' | 'corporate' | 'admin';
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactElement;
    colorClass: string; // Tailwind text color class e.g., 'text-green-500'
    bgGradient: string;
    borderClass: string;
    onClick: () => void;
    isHovered: boolean;
    onHover: (id: string | null) => void;
    anyHovered: boolean;
}

const PortalPanel: React.FC<PortalItemProps> = ({ 
    id, title, subtitle, description, icon, colorClass, bgGradient, borderClass, onClick, isHovered, onHover, anyHovered 
}) => {
    // Determine width/flex based on hover state (Desktop only logic mostly)
    // If nothing is hovered, everyone is equal.
    // If this is hovered, it grows.
    // If something else is hovered, this shrinks slightly.
    const flexClass = isHovered ? 'lg:flex-[1.5]' : anyHovered ? 'lg:flex-[0.8]' : 'lg:flex-1';
    const opacityClass = anyHovered && !isHovered ? 'opacity-60 grayscale-[0.5]' : 'opacity-100';

    return (
        <button 
            onClick={onClick}
            onMouseEnter={() => onHover(id)}
            onMouseLeave={() => onHover(null)}
            className={`
                relative flex flex-col justify-end p-8 sm:p-10 rounded-[2.5rem] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                w-full min-h-[320px] lg:min-h-0 lg:h-auto
                border ${isHovered ? borderClass : 'border-brand-light-tertiary dark:border-white/5'}
                bg-brand-light-primary dark:bg-[#13161B] shadow-lg hover:shadow-2xl
                ${flexClass} ${opacityClass} group
            `}
        >
            {/* --- Background Effects --- */}
            
            {/* Gradient Blob on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-b ${bgGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
            
            {/* Large Background Icon (Decoration) */}
            <div className={`absolute -right-6 -top-6 w-48 h-48 sm:w-64 sm:h-64 opacity-[0.03] group-hover:opacity-[0.07] transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-12 ${colorClass}`}>
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-full h-full" })}
            </div>

            {/* --- Content --- */}
            <div className="relative z-10 w-full text-left">
                {/* Icon Circle */}
                <div className={`
                    w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 
                    bg-brand-light-secondary dark:bg-white/5 backdrop-blur-md border border-white/10
                    shadow-xl group-hover:scale-110 transition-transform duration-500
                `}>
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 ${colorClass}`}>
                        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-full h-full fill-current" })}
                    </div>
                </div>

                {/* Text Info */}
                <div className="transform transition-transform duration-500 group-hover:translate-x-1">
                    <span className={`inline-block text-xs font-bold tracking-widest uppercase mb-2 ${colorClass} bg-current/10 px-3 py-1 rounded-full`}>
                        {subtitle}
                    </span>
                    <h3 className="text-2xl sm:text-4xl font-extrabold text-brand-text-light-primary dark:text-white mb-3 sm:mb-4 leading-tight">
                        {title}
                    </h3>
                    <p className="text-sm sm:text-base text-brand-text-light-secondary dark:text-brand-text-secondary leading-relaxed max-w-md opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                        {description}
                    </p>
                </div>

                {/* Call to Action */}
                <div className="mt-8 flex items-center text-sm font-bold tracking-wide uppercase">
                    <div className={`h-px w-8 ${isHovered ? 'w-16' : 'w-8'} bg-current transition-all duration-500 mr-4 ${colorClass}`} />
                    <span className={`transition-all duration-300 ${isHovered ? 'translate-x-2' : ''} ${colorClass}`}>
                        Enter Portal
                    </span>
                </div>
            </div>
        </button>
    );
}

const PortalHome: React.FC<PortalHomeProps> = ({ onSelectPortal }) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-brand-light-secondary dark:bg-[#0B0D10] flex flex-col relative overflow-hidden font-sans">
            
            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-6 sm:p-8 z-50 flex justify-between items-center pointer-events-none">
               <div className="pointer-events-auto">
                   <Logo />
               </div>
            </div>

            {/* Main Layout */}
            <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 relative z-10 pt-24 sm:pt-0">
                
                <div className="text-center mb-10 sm:mb-14 max-w-3xl px-4 animate-fade-in">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-brand-text-light-primary dark:text-white mb-4 tracking-tight">
                        Select Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-400">Workspace</span>
                    </h1>
                    <p className="text-brand-text-light-secondary dark:text-gray-400 text-lg">
                        Tailored experiences for every role. Choose your portal to begin.
                    </p>
                </div>

                {/* The Split Container */}
                <div className="w-full max-w-[1400px] h-auto lg:h-[600px] flex flex-col lg:flex-row gap-4 sm:gap-6 items-stretch animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    
                    <PortalPanel 
                        id="student"
                        title="Individual Portal"
                        subtitle="Personal Growth"
                        description="For Students, Employees & Leaders. Access assessments, view your roadmap, and track career growth."
                        icon={<ProfileIcon />}
                        colorClass="text-brand-green"
                        bgGradient="from-brand-green/20 to-emerald-500/20"
                        borderClass="border-brand-green/50"
                        onClick={() => onSelectPortal('student')}
                        isHovered={hoveredId === 'student'}
                        anyHovered={!!hoveredId}
                        onHover={setHoveredId}
                    />

                    <PortalPanel 
                        id="corporate"
                        title="Corporate Portal"
                        subtitle="Talent Management"
                        description="For Organizations. Manage registrations, assign bulk assessments, and view team analytics."
                        icon={<JobsIcon />}
                        colorClass="text-blue-500"
                        bgGradient="from-blue-500/20 to-indigo-500/20"
                        borderClass="border-blue-500/50"
                        onClick={() => onSelectPortal('corporate')}
                        isHovered={hoveredId === 'corporate'}
                        anyHovered={!!hoveredId}
                        onHover={setHoveredId}
                    />

                    <PortalPanel 
                        id="admin"
                        title="Admin Portal"
                        subtitle="System Control"
                        description="For Administrators. Configure settings, manage users, and oversee platform operations."
                        icon={<SettingsIcon />}
                        colorClass="text-purple-500"
                        bgGradient="from-purple-500/20 to-pink-500/20"
                        borderClass="border-purple-500/50"
                        onClick={() => onSelectPortal('admin')}
                        isHovered={hoveredId === 'admin'}
                        anyHovered={!!hoveredId}
                        onHover={setHoveredId}
                    />

                </div>
            </div>

            {/* Footer */}
            <div className="p-6 text-center text-xs text-brand-text-light-secondary dark:text-gray-600 font-medium tracking-wide uppercase opacity-60">
                &copy; 2025 Origin BI. All rights reserved.
            </div>
        </div>
    );
};

export default PortalHome;
