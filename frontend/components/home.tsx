import React, { useState, useEffect } from 'react';
import { ProfileIcon, JobsIcon, DashboardIcon } from './icons';
import Logo from './ui/Logo';

interface PortalHomeProps {
    onSelectPortal: (portal: 'student' | 'corporate' | 'admin') => void;
}

// Internal component for text rotation
const TextRotator: React.FC = () => {
    const words = ["Students", "Organizations", "Professionals", "You"];
    const [index, setIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false); // Start fade out
            setTimeout(() => {
                setIndex((prev) => (prev + 1) % words.length);
                setFade(true); // Start fade in
            }, 500); // Wait for fade out to finish
        }, 3000); // Change every 3 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <span className={`inline-block transition-all duration-500 transform ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-500`}>
            {words[index]}
        </span>
    );
};

// Compact Portal Card optimized for "Gateway" feel
const PortalCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    accentColor: string;
    delay?: string;
    isActive?: boolean;
}> = ({ title, description, icon, onClick, accentColor, delay, isActive }) => (
    <button
        onClick={onClick}
        className={`group relative cursor-pointer flex flex-row md:flex-col items-center md:items-start text-left w-full h-full min-h-[90px] md:min-h-[140px] rounded-2xl md:rounded-3xl p-4 md:p-6 transition-all duration-500 transform hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-xl focus:outline-none ring-2 ring-transparent focus:ring-brand-green/30 ${delay} animate-fade-in-up`}
    >
        {/* Card Background & Border - Dark Mode Enhanced */}
        <div className="absolute inset-0 bg-white dark:bg-[#181B21] rounded-2xl md:rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm group-hover:shadow-lg group-hover:border-transparent transition-all duration-300" />

        {/* Gradient Hover Effect */}
        <div className={`absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br ${accentColor} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300`} />

        {/* Content */}
        <div className="relative z-10 flex flex-row md:flex-col items-center md:items-start w-full h-full">
            {/* Icon */}
            <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-md bg-gradient-to-br ${accentColor} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 mr-4 md:mr-0 md:mb-4`}>
                {icon}
            </div>

            {/* Text Content */}
            <div className="flex-grow">
                <div className="flex justify-between items-center w-full">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-tight">
                        {title}
                    </h3>

                    {/* Mobile Arrow (Visible inline) */}
                    <div className="md:hidden opacity-0 group-hover:opacity-100 transition-all duration-300 text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                </div>

                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium mt-1 line-clamp-2 md:line-clamp-none">
                    {description}
                </p>
            </div>

            {/* Desktop Arrow (Absolute top right) */}
            <div className="hidden md:block absolute top-0 right-0 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500 ease-out text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </div>
        </div>
    </button>
);

const PortalHome: React.FC<PortalHomeProps> = ({ onSelectPortal }) => {
    return (
        // Ensured overflow-hidden on desktop for "No Scroll" feel, auto on mobile if needed
        <div className="h-[100dvh] w-full bg-[#FAFAFA] dark:bg-[#090A0C] flex flex-col relative overflow-y-auto md:overflow-hidden font-sans selection:bg-brand-green/20">

            {/* Animated Wave Background */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex flex-col justify-end">
                <svg className="w-full h-[50vh] min-h-[400px] text-brand-green/5 dark:text-brand-green/5 transition-colors duration-500" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0.8" />
                        </linearGradient>
                    </defs>
                    <path fill="url(#wave-gradient)" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,192C384,203,480,245,576,245.3C672,245,768,203,864,186.7C960,171,1056,181,1152,197.3C1248,213,1344,235,1392,245.3L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z">
                        <animate attributeName="d" dur="20s" repeatCount="indefinite"
                            values="
                            M0,224L48,213.3C96,203,192,181,288,192C384,203,480,245,576,245.3C672,245,768,203,864,186.7C960,171,1056,181,1152,197.3C1248,213,1344,235,1392,245.3L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                            M0,192L48,202.7C96,213,192,235,288,229.3C384,224,480,192,576,176C672,160,768,160,864,176C960,192,1056,224,1152,229.3C1248,235,1344,213,1392,202.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z;
                            M0,224L48,213.3C96,203,192,181,288,192C384,203,480,245,576,245.3C672,245,768,203,864,186.7C960,171,1056,181,1152,197.3C1248,213,1344,235,1392,245.3L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z
                            "
                        />
                    </path>
                </svg>
            </div>

            {/* Background Grid Mesh - Subtler */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            {/* Gradient Blobs - Ambient Lighting */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-brand-green/5 dark:bg-brand-green/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[20%] w-[60%] h-[60%] bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '3s' }} />
            </div>

            {/* Top Bar Removed - Logo moved to center */}

            {/* Main Content Centered Viewport - Optimized for No-Scroll */}
            <main className="flex-grow flex flex-col justify-center items-center w-full px-4 sm:px-6 z-10 pt-4 pb-2 md:py-0">

                <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center h-full">

                    {/* Dynamic Header - Reduced Margins for compactness */}
                    <div className="text-center mb-4 md:mb-6 animate-fade-in-up">

                        {/* Central Logo Placement */}
                        <div className="flex justify-center mb-4 md:mb-6 transition-transform hover:scale-105 duration-300">
                            <div className="scale-75 md:scale-90 origin-center">
                                <Logo />
                            </div>
                        </div>

                        {/* Wording Polish 1: Gradient Pill */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm mb-3 md:mb-4 transition-transform hover:scale-105 cursor-default scale-90 md:scale-100">
                            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-brand-green animate-pulse"></span>
                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300">
                                Beyond Intelligence
                            </span>
                        </div>

                        {/* Dynamic Text Rotation */}
                        <h1 className="text-3xl sm:text-4xl md:text-[clamp(32px,3.5vw,56px)] font-black text-gray-900 dark:text-white tracking-tight mb-2 md:mb-3 leading-tight drop-shadow-sm">
                            Build the future for <br className="md:hidden" /> <TextRotator />
                        </h1>

                        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-xl mx-auto font-medium px-4">
                            The intelligent assessment platform designed to unlock potential. Choose your portal to begin.
                        </p>
                    </div>

                    {/* Cards Row - Functional & Balanced */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-5 w-full place-items-stretch text-left">

                        <div className="w-full h-full" style={{ animationDelay: '100ms' }}>
                            <PortalCard
                                title="Individual"
                                description="Access personalized assessments and track your career growth."
                                icon={<ProfileIcon className="w-5 h-5 lg:w-6 lg:h-6" />}
                                accentColor="from-brand-green to-emerald-500"
                                onClick={() => onSelectPortal('student')}
                                delay="animation-delay-100"
                            />
                        </div>

                        <div className="w-full h-full" style={{ animationDelay: '200ms' }}>
                            <PortalCard
                                title="Corporate"
                                description="Manage talent, recruit top candidates, and view analytics."
                                icon={<JobsIcon className="w-5 h-5 lg:w-6 lg:h-6" />}
                                accentColor="from-blue-500 to-indigo-600"
                                onClick={() => onSelectPortal('corporate')}
                                delay="animation-delay-200"
                            />
                        </div>

                        <div className="w-full h-full" style={{ animationDelay: '300ms' }}>
                            <PortalCard
                                title="Administrator"
                                description="Platform control center, user management, and configuration."
                                icon={<DashboardIcon className="w-5 h-5 lg:w-6 lg:h-6" />}
                                accentColor="from-purple-500 to-pink-600"
                                onClick={() => onSelectPortal('admin')}
                                delay="animation-delay-300"
                            />
                        </div>

                    </div>
                </div>

            </main>

            {/* Minimal Background Footer */}
            <footer className="w-full text-center py-3 mt-auto shrink-0 text-[10px] md:text-[10px] font-semibold text-gray-300 dark:text-gray-600 z-10 pointer-events-none tracking-widest uppercase opacity-70">
                &copy; {new Date().getFullYear()} Origin BI
            </footer>
        </div>
    );
};

export default PortalHome;
