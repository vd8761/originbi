
import React from 'react';
import LoginForm from '@/components/admin/LoginForm';
import Logo from '@/components/ui/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import {ArrowLeftIcon,QuoteIcon } from '@/components/icons';

interface CorporateLoginProps {
    onLoginSuccess: () => void;
    onBack: () => void;
    portalMode?: string;
}

const CorporateLogin: React.FC<CorporateLoginProps> = ({ onLoginSuccess, onBack }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen w-full flex bg-brand-light-primary dark:bg-brand-dark-primary font-sans transition-colors duration-300">
            {/* Left Side - Brand Showcase */}
            <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-16 text-white bg-blue-950">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
                        alt="Corporate Architecture"
                        className="w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-900/80 to-blue-900/60 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/40" />
                </div>

                {/* Top Brand Tag */}
                <div className="relative z-10 flex items-center gap-3 animate-fade-in">
                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                         <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <span className="text-sm font-bold tracking-[0.2em] uppercase text-blue-100/80">OriginBI Corporate</span>
                </div>

                {/* Main Content */}
                <div className="relative z-10 max-w-2xl mt-12">
                    <h1 className="text-5xl font-bold leading-[1.1] mb-6 tracking-tight">
                        Transform Your Workforce With <span className="text-blue-400">Intelligent Insights.</span>
                    </h1>
                    <p className="text-lg text-blue-100/90 leading-relaxed font-light border-l-2 border-blue-400 pl-6">
                        Access comprehensive analytics, manage recruitment pipelines, and unlock the potential of your organization through our data-driven assessment platform.
                    </p>
                </div>

                {/* Testimonial Footer */}
                <div className="relative z-10 mt-auto pt-12">
                     <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl max-w-xl">
                        <div className="flex gap-4 items-start">
                            <QuoteIcon className="w-8 h-8 text-blue-400 shrink-0" />
                            <div>
                                <p className="text-lg font-medium italic text-white/95 mb-4 leading-relaxed">
                                    "OriginBI has completely revolutionized our hiring process. We're finding better candidates faster, and retention has improved by 40%."
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/50">
                                        ER
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm">Elena Rodriguez</div>
                                        <div className="text-xs text-blue-300 uppercase tracking-wider font-semibold">VP of People, TechFlow</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-[45%] flex flex-col relative bg-brand-light-primary dark:bg-brand-dark-primary transition-colors duration-300">
                {/* Header Actions */}
                <div className="absolute top-0 left-0 w-full p-6 sm:p-8 flex justify-between items-center z-20">
                    <button
                        onClick={onBack}
                        className="group flex items-center gap-2 px-4 py-2 rounded-full bg-transparent hover:bg-brand-light-tertiary dark:hover:bg-brand-dark-tertiary transition-all text-sm font-medium text-brand-text-light-secondary dark:text-brand-text-secondary hover:text-brand-text-light-primary dark:hover:text-white"
                    >
                        <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        <span>Back to Portal</span>
                    </button>
                    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                </div>

                {/* Form Container */}
                <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 overflow-y-auto">
                    <div className="w-full max-w-md space-y-8 mt-16 sm:mt-0">
                        <div className="text-center lg:text-left space-y-2">
                             <div className="flex justify-center lg:justify-start mb-6 scale-110 origin-center lg:origin-left">
                                <Logo />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-brand-text-light-primary dark:text-white">
                                Corporate Login
                            </h2>
                            <p className="text-brand-text-light-secondary dark:text-brand-text-secondary text-base">
                                Enter your organization credentials to proceed.
                            </p>
                        </div>

                        {/* Login Form Component */}
                        <LoginForm onLoginSuccess={onLoginSuccess} />

                        {/* Footer Links */}
                        <div className="pt-6 border-t border-brand-light-tertiary dark:border-brand-dark-tertiary">
                             <p className="text-center text-sm text-brand-text-light-secondary dark:text-brand-text-secondary">
                                New to OriginBI? <a href="#" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">Register your organization</a>
                            </p>
                        </div>
                    </div>
                </div>
                
                 <div className="p-6 text-center lg:text-left border-t border-brand-light-tertiary dark:border-brand-dark-tertiary lg:border-none">
                    <p className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary">
                        &copy; 2025 Origin BI. All rights reserved. <span className="mx-2">|</span> <a href="#" className="hover:underline">Privacy</a> <span className="mx-2">|</span> <a href="#" className="hover:underline">Help</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CorporateLogin;
