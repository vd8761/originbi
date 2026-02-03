'use client';

import React from 'react';
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';

interface AdminAuthLayoutProps {
    children: React.ReactNode;
    heroTitle: React.ReactNode;
    heroSubtitle: string;
}

const AdminAuthLayout: React.FC<AdminAuthLayoutProps> = ({ children, heroTitle, heroSubtitle }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 lg:p-10 bg-transparent transition-all duration-300">

            {/* Main Card Container - Fills the available space inside padding */}
            <div className="w-full h-full bg-white dark:bg-[#15171A] rounded-[2rem] shadow-none flex flex-col lg:flex-row overflow-hidden border-none relative">

                {/* Left Panel - Hero Section - With Premium Background Image */}
                <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 bg-black overflow-hidden group">
                    {/* Background Image: Abstract Tech / Server Node */}
                    <div className="absolute inset-0 opacity-60 group-hover:opacity-70 transition-opacity duration-1000 scale-105 group-hover:scale-100">
                        <img
                            src="/Secure_Node_Background.jpg"
                            alt="Secure Node Background"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]"></div>
                    </div>

                    {/* Content Overlay */}
                    <div className="relative z-10 p-12 xl:p-16 flex flex-col justify-between h-full w-full">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs font-medium tracking-widest text-gray-300 shadow-xl">
                                <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                                SECURE ADMIN ENVIRONMENT
                            </div>
                        </div>

                        <div className="space-y-6 max-w-2xl animate-slide-up">
                            <h1 className="text-4xl xl:text-5xl 2xl:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-2xl">
                                {heroTitle}
                            </h1>
                            <p className="text-lg xl:text-xl text-gray-400 leading-relaxed font-light border-l-2 border-brand-green pl-6">
                                {heroSubtitle}
                            </p>
                        </div>


                    </div>
                </div>

                {/* Right Panel - Auth Form with Theme Background */}
                <div className="w-full lg:w-1/2 xl:w-5/12 relative flex flex-col h-full z-10 bg-white/90 dark:bg-[#0F1115]/90 backdrop-blur-xl transition-colors duration-500 bg-cover bg-center bg-no-repeat bg-[url('/Background_Light_Theme.svg')] dark:bg-[url('/Background_Dark_Theme.svg')]">
                    <div className="flex flex-col h-full w-full items-center p-6 lg:p-8 xl:p-12 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] lg:[zoom:0.8]">

                        {/* Header Actions */}
                        <div className="w-full max-w-md flex justify-between items-center shrink-0">
                            <div className="origin-left w-[clamp(100px,7vw,130px)]">
                                <Logo className="w-full h-auto object-contain" />
                            </div>
                            <div className="flex items-center gap-4">
                                <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                            </div>
                        </div>

                        {/* Form Wrapper - Centered Vertically */}
                        <div className="w-full flex-grow flex flex-col justify-center items-center py-8">
                            <div className="w-full max-w-md space-y-4">
                                {children}
                            </div>
                        </div>

                        {/* Footer - Sticky Bottom with Privacy/Terms */}
                        <div className="w-full max-w-md mt-auto shrink-0 border-t border-gray-100 dark:border-gray-800 pt-4">
                            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 text-[10px] sm:text-xs font-medium text-brand-green">
                                <div className="flex items-center gap-4">
                                    <a href="#" className="hover:text-brand-green transition-colors">Privacy Policy</a>
                                    <span className="hidden sm:block w-px h-3 bg-gray-300 dark:bg-gray-700"></span>
                                    <a href="#" className="hover:text-brand-green transition-colors">Terms & Conditions</a>
                                </div>
                                <span className="text-brand-text-light-secondary dark:text-white">&copy; {new Date().getFullYear()} Origin BI</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAuthLayout;
