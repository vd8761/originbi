'use client';

import React, { useState, useRef, useEffect } from 'react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import {NotificationWithDotIcon,NotificationIcon,ChevronDownIcon,DashboardIcon,JobsIcon,RoadmapIcon,VideosIcon,ProfileIcon,SettingsIcon,LogoutIcon,MenuIcon,CoinIcon,OriginDataIcon,MyEmployeesIcon } from '@/components/icons';

import { useTheme } from '@/contexts/ThemeContext';

interface HeaderProps {
    onLogout: () => void;
    currentView?: 'dashboard' | 'programs' | 'corporate' | 'registrations';
    portalMode?: 'admin';
    onSwitchPortal?: () => void;
    onNavigate?: (view: 'dashboard' | 'programs' | 'corporate' | 'registrations') => void;
    hideNav?: boolean;
}

interface NavItemProps { 
    icon: React.ReactNode; 
    label: string; 
    active?: boolean; 
    isMobile?: boolean;
    onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, isMobile, onClick }) => {
    const showDesktopText = 'hidden 2xl:inline'; 
    const spacingClass = isMobile ? 'gap-3' : 'justify-center 2xl:justify-start gap-0 2xl:gap-3';

    return (
        <div className="relative group">
            <button 
                onClick={onClick}
                className={`flex items-center ${spacingClass} rounded-lg transition-colors duration-200 w-full ${active ? 'bg-brand-green text-white px-3 py-2' : 'text-brand-text-light-secondary dark:text-brand-text-secondary hover:bg-brand-light-tertiary dark:hover:bg-brand-dark-tertiary hover:text-brand-text-light-primary dark:hover:text-white p-2 lg:px-3'}`}
            >
                <div className={`${active ? 'text-white' : 'text-current'}`}>
                    {icon}
                </div>
                 <span className={`font-medium text-sm whitespace-nowrap ${isMobile ? 'inline' : showDesktopText}`}>{label}</span>
            </button>
            <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-max px-2 py-1 bg-black/80 dark:bg-brand-dark-tertiary text-white text-xs rounded-md shadow-lg
                opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10
                ${isMobile ? 'hidden' : 'block 2xl:hidden'}`}>
                {label}
            </div>
        </div>
    );
};

const NotificationItem: React.FC<{ icon: React.ReactNode; title: string; time: string; isNew?: boolean }> = ({ icon, title, time, isNew }) => (
    <div className="flex items-start space-x-3 p-3 hover:bg-brand-light-tertiary dark:hover:bg-brand-dark-tertiary/60 transition-colors duration-200">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-light-tertiary dark:bg-brand-dark-tertiary flex items-center justify-center">
            {icon}
        </div>
        <div className="flex-grow">
            <p className="text-sm font-medium text-brand-text-light-primary dark:text-brand-text-primary">{title}</p>
            <p className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary">{time}</p>
        </div>
        {isNew && <div className="w-2 h-2 bg-brand-green rounded-full mt-1 flex-shrink-0"></div>}
    </div>
);

const Header: React.FC<HeaderProps> = ({ onLogout, currentView, onNavigate, hideNav = false, portalMode = 'student', onSwitchPortal }) => {
    const { theme, toggleTheme } = useTheme();
    const [isProfileOpen, setProfileOpen] = useState(false);
    const [isLangOpen, setLangOpen] = useState(false);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isNotificationsOpen, setNotificationsOpen] = useState(false);
    const [language, setLanguage] = useState('ENG');
    const [hasNotification, setHasNotification] = useState(true);
    
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const langMenuRef = useRef<HTMLDivElement>(null);
    const notificationsMenuRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }
            if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
                setLangOpen(false);
            }
            if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
            if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                 const target = event.target as Element;
                 if (!target.closest('#mobile-menu-btn')) {
                     setMobileMenuOpen(false);
                 }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMobileMenuOpen]);
    
    const handleLangChange = (lang: string) => {
        setLanguage(lang);
        setLangOpen(false);
    }

    const handleNotificationClick = () => {
        setNotificationsOpen(p => !p);
        if (hasNotification) {
            setHasNotification(false);
        }
    };

    const handleNavClick = (view: 'dashboard' | 'programs' | 'corporate' | 'registrations') => {
        if (onNavigate) {
            onNavigate(view);
        }
        setMobileMenuOpen(false);
    };

    const notifications = [
        {
            icon: <RoadmapIcon className="w-4 h-4 text-brand-text-light-secondary dark:text-brand-text-secondary" />,
            title: 'New Program Available',
            time: '2 hours ago',
            isNew: true
        },
        {
            icon: <JobsIcon className="w-4 h-4 text-brand-text-light-secondary dark:text-brand-text-secondary" />,
            title: 'Assessment Results Ready',
            time: 'Yesterday',
            isNew: true
        },
        {
            icon: <ProfileIcon className="w-4 h-4 text-brand-text-light-secondary dark:text-brand-text-secondary" />,
            title: 'Profile update required',
            time: '3 days ago',
            isNew: false
        }
    ];

    const logoSrc = theme === 'dark'
        ? '/Origin-BI-white-logo.png'
        : '/Origin-BI-Logo-01.png';

    const renderNavItems = (isMobile: boolean) => (
        <>
            <NavItem 
                icon={<DashboardIcon />} 
                label="Dashboard" 
                active={currentView === 'dashboard'} 
                isMobile={isMobile}
                onClick={() => handleNavClick('dashboard')}
            />
            <NavItem 
                icon={<RoadmapIcon />} 
                label="Programs" 
                active={currentView === 'programs'} 
                isMobile={isMobile}
                onClick={() => handleNavClick('programs')}
            />
            <NavItem 
                icon={<OriginDataIcon className="w-5 h-5" />} 
                label="Corporate Access" 
                active={currentView === 'corporate'} 
                isMobile={isMobile}
                onClick={() => handleNavClick('corporate')}
            />
            <NavItem 
                icon={<ProfileIcon />} 
                label="Registrations" 
                active={currentView === 'registrations'} 
                isMobile={isMobile}
                onClick={() => handleNavClick('registrations')}
            />
            <NavItem icon={<SettingsIcon />} label="Settings" isMobile={isMobile} />
        </>
    );

    return (
        <header className="bg-brand-light-secondary dark:bg-brand-dark-secondary px-4 sm:px-6 py-3 sm:py-3 flex items-center justify-between sticky top-0 z-50 border-b border-brand-light-tertiary dark:border-transparent shadow-sm dark:shadow-none">
            <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
                {!hideNav && (
                    <button 
                        id="mobile-menu-btn"
                        className="md:hidden text-brand-text-light-primary dark:text-white p-1"
                        onClick={() => setMobileMenuOpen(p => !p)}
                    >
                        <MenuIcon className="w-6 h-6" />
                    </button>
                )}
                <img src={logoSrc} alt="OriginBI Logo" className="h-6 sm:h-8 w-auto" />
                
                {!hideNav && (
                    <nav className="hidden md:flex items-center space-x-1">
                        {renderNavItems(false)}
                    </nav>
                )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:block scale-90 sm:scale-100">
                        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                    </div>
                    
                    {!hideNav && (
                    <>
                        <div className="relative hidden sm:block" ref={langMenuRef}>
                            <button onClick={() => setLangOpen(p => !p)} className="bg-brand-light-tertiary dark:bg-brand-dark-tertiary text-brand-text-light-primary dark:text-white flex items-center justify-center space-x-2 px-3 sm:px-4 h-9 sm:h-10 rounded-full font-semibold text-xs sm:text-sm hover:opacity-90 transition-opacity">
                                <span>{language}</span>
                                <ChevronDownIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            {isLangOpen && (
                                <div className="absolute right-0 top-full mt-2 w-32 bg-brand-light-secondary dark:bg-brand-dark-tertiary rounded-lg shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                                    <button onClick={() => handleLangChange('ENG')} className="w-full text-left px-4 py-2 text-sm text-brand-text-light-primary dark:text-brand-text-primary hover:bg-brand-light-tertiary dark:hover:bg-brand-dark-secondary/60">English</button>
                                    <button onClick={() => handleLangChange('TAM')} className="w-full text-left px-4 py-2 text-sm text-brand-text-light-primary dark:text-brand-text-primary hover:bg-brand-light-tertiary dark:hover:bg-brand-dark-secondary/60">Tamil</button>
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={notificationsMenuRef}>
                            <button onClick={handleNotificationClick} className="bg-brand-light-tertiary dark:bg-brand-dark-tertiary w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-brand-text-light-primary dark:text-white hover:opacity-80 transition-opacity">
                                {hasNotification ? (
                                    <NotificationWithDotIcon className="w-5 h-5" />
                                ) : (
                                    <NotificationIcon className="w-5 h-5" />
                                )}
                            </button>
                            {isNotificationsOpen && (
                                <div className="absolute right-[-50px] sm:right-0 top-full mt-2 w-72 sm:w-80 bg-brand-light-secondary dark:bg-brand-dark-secondary rounded-2xl shadow-lg border border-brand-light-tertiary dark:border-brand-dark-tertiary z-50">
                                    <div className="p-4 border-b border-brand-light-tertiary dark:border-brand-dark-tertiary">
                                        <h3 className="font-bold text-lg text-brand-text-light-primary dark:text-brand-text-primary">Notifications</h3>
                                    </div>
                                    <div className="divide-y divide-brand-light-tertiary dark:divide-brand-dark-tertiary max-h-[300px] overflow-y-auto">
                                        {notifications.map((item, index) => (
                                            <NotificationItem key={index} {...item} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                    )}
                </div>
                
                <div className="w-px h-8 bg-gray-300 dark:bg-brand-dark-tertiary hidden lg:block"></div>

                <div className="relative" ref={profileMenuRef}>
                     <button onClick={() => setProfileOpen(prev => !prev)} className="flex items-center gap-2 sm:space-x-3 focus:outline-none">
                        <img src="https://i.pravatar.cc/40?u=monishwar" alt="User Avatar" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-brand-light-tertiary dark:border-transparent" />
                        <div className="text-left hidden xl:block">
                            <p className="font-semibold text-base leading-tight text-brand-text-light-primary dark:text-brand-text-primary">Monishwar Rajasekaran</p>
                            <p className="text-sm text-brand-text-light-secondary dark:text-brand-text-secondary leading-tight">MonishwarRaja@originbi.com</p>
                        </div>
                        <ChevronDownIcon className={`w-4 h-4 sm:w-5 sm:h-5 text-brand-text-light-secondary dark:text-brand-text-secondary transition-transform hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-brand-light-secondary dark:bg-brand-dark-secondary rounded-xl shadow-2xl z-50 border border-brand-light-tertiary dark:border-brand-dark-tertiary/50 overflow-hidden">
                            <div className="p-2">
                                <button 
                                    onClick={() => {
                                        if(onSwitchPortal) onSwitchPortal();
                                        setProfileOpen(false);
                                    }} 
                                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-brand-text-light-primary dark:text-white rounded-lg hover:bg-brand-light-tertiary dark:hover:bg-brand-dark-tertiary transition-colors"
                                >
                                    <SettingsIcon className="w-5 h-5 mr-3" />
                                    <span>Switch Portal</span>
                                </button>

                                <button onClick={onLogout} className="w-full flex items-center px-3 py-2 text-sm font-medium text-brand-text-light-primary dark:text-white rounded-lg hover:bg-brand-light-tertiary dark:hover:bg-brand-dark-tertiary transition-colors">
                                    <LogoutIcon className="w-5 h-5 mr-3" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Menu with Ref for Click Outside */}
            {isMobileMenuOpen && !hideNav && (
                <div 
                    id="mobile-menu" 
                    ref={mobileMenuRef}
                    className="md:hidden absolute top-full left-0 w-full bg-brand-light-secondary dark:bg-brand-dark-secondary shadow-lg z-40 border-t border-brand-light-tertiary dark:border-brand-dark-tertiary animate-fade-in"
                >
                    <nav className="flex flex-col p-4 space-y-2">
                        {renderNavItems(true)}
                        
                        <div className="border-t border-brand-light-tertiary dark:border-brand-dark-tertiary my-2 pt-2">
                             <div className="flex justify-between items-center px-2 mb-4">
                                <p className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary font-semibold">Appearance</p>
                                <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                             </div>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;
