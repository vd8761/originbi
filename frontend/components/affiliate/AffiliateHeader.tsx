"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from 'next/navigation';
import ThemeToggle from '../ui/ThemeToggle';
import {
    NotificationIcon,
    ChevronDownIcon,
    DashboardIcon,
    ProfileIcon,
    SettingsIcon,
    LogoutIcon,
    MenuIcon,
} from '../icons';
import { useTheme } from '../../contexts/ThemeContext';

// --- Affiliate-specific Icons ---
const ReferralsIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
);

const EarningsIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);

interface AffiliateHeaderProps {
    onLogout: () => void;
    onNavigate?: (view: string) => void;
}

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    isMobile?: boolean;
    onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, isMobile, onClick }) => {
    const showDesktopText = "hidden lg:inline";
    const spacingClass = isMobile ? "gap-3" : "justify-center gap-0 lg:gap-1 2xl:gap-2";

    return (
        <div className="relative group">
            <button
                onClick={onClick}
                className={`flex items-center ${spacingClass} rounded-full transition-all duration-200 w-full lg:h-8 2xl:h-9 cursor-pointer ${isMobile ? "py-3 min-h-[44px]" : ""} ${active
                    ? `bg-brand-green text-white shadow-[0_4px_14px_0_rgba(30,211,106,0.3)] border border-transparent ${isMobile ? "px-4" : "px-2.5 2xl:px-4"}`
                    : `bg-white border border-gray-200 text-[#19211C] hover:bg-gray-50 hover:text-black hover:border-gray-300 dark:bg-transparent dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5 dark:hover:text-white ${isMobile ? "px-4" : "px-2.5 2xl:px-4"}`
                    }`}
            >
                <div className={`${active ? "text-white" : "text-brand-green dark:text-white"}`}>
                    {icon}
                </div>
                <span className={`font-medium text-xs 2xl:text-sm whitespace-nowrap ml-1.5 2xl:ml-2 ${isMobile ? "inline" : showDesktopText}`}>
                    {label}
                </span>
            </button>
            <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-max px-2 py-1 bg-black/80 dark:bg-brand-dark-tertiary text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 ${isMobile ? "hidden" : "block 2xl:hidden"}`}>
                {label}
            </div>
        </div>
    );
};

const AffiliateHeader: React.FC<AffiliateHeaderProps> = ({ onLogout, onNavigate }) => {
    const { theme, toggleTheme } = useTheme();
    const [isProfileOpen, setProfileOpen] = useState(false);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isNotificationsOpen, setNotificationsOpen] = useState(false);
    const [hasNotification, setHasNotification] = useState(true);
    const [affiliateData, setAffiliateData] = useState<any>(null);

    const profileMenuRef = useRef<HTMLDivElement>(null);
    const notificationsMenuRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    const pathname = usePathname();

    const activeView = (() => {
        if (pathname.includes('/dashboard')) return 'dashboard';
        if (pathname.includes('/referrals')) return 'referrals';
        if (pathname.includes('/earnings')) return 'earnings';
        if (pathname.includes('/settings')) return 'settings';
        return 'dashboard';
    })();

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('affiliate_user');
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                setAffiliateData({
                    full_name: parsed.name,
                    email: parsed.email,
                    ...parsed,
                });
            }
        } catch { /* empty */ }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) setProfileOpen(false);
            if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target as Node)) setNotificationsOpen(false);
            if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                const target = event.target as Element;
                if (!target.closest("#affiliate-mobile-menu-btn")) setMobileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMobileMenuOpen]);

    const handleNavClick = (view: string) => {
        onNavigate?.(view);
        setMobileMenuOpen(false);
    };

    const handleNotificationClick = () => {
        setNotificationsOpen((p) => !p);
        if (hasNotification) setHasNotification(false);
    };

    const renderNavItems = (isMobile: boolean) => (
        <>
            <NavItem icon={<DashboardIcon className="w-4 h-4" />} label="Dashboard" active={activeView === "dashboard"} isMobile={isMobile} onClick={() => handleNavClick("dashboard")} />
            <NavItem icon={<ReferralsIcon className="w-4 h-4" />} label="Referrals" active={activeView === "referrals"} isMobile={isMobile} onClick={() => handleNavClick("referrals")} />
            <NavItem icon={<EarningsIcon className="w-4 h-4" />} label="Earnings" active={activeView === "earnings"} isMobile={isMobile} onClick={() => handleNavClick("earnings")} />
            <NavItem icon={<SettingsIcon className="w-4 h-4" />} label="Settings" active={activeView === "settings"} isMobile={isMobile} onClick={() => handleNavClick("settings")} />
        </>
    );

    return (
        <header className="fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 bg-transparent dark:bg-white/[0.08] backdrop-blur-xl border-b border-[#E0E0E0] dark:border-white/10 shadow-none">
            <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-3 sm:py-4 flex items-center justify-between h-full">
                <div className="flex items-center gap-2 lg:gap-2 2xl:gap-4">
                    <button
                        id="affiliate-mobile-menu-btn"
                        className="md:hidden text-gray-700 dark:text-white p-1 cursor-pointer"
                        onClick={() => setMobileMenuOpen((p) => !p)}
                    >
                        <MenuIcon className="w-6 h-6 dark:text-white" />
                    </button>

                    <img src="/Origin-BI-Logo-01.png" alt="OriginBI Logo" className="h-5 lg:h-6 2xl:h-7 w-auto dark:hidden" />
                    <img src="/Origin-BI-white-logo.png" alt="OriginBI Logo" className="h-5 lg:h-6 2xl:h-7 w-auto hidden dark:block" />

                    {/* Affiliate Badge */}
                    <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] 2xl:text-xs font-bold bg-brand-green/10 text-brand-green border border-brand-green/20 tracking-wider uppercase">
                        Affiliate
                    </span>

                    <nav className="hidden md:flex items-center space-x-1 lg:space-x-1 2xl:space-x-2 ml-2 lg:ml-2 2xl:ml-6">
                        {renderNavItems(false)}
                    </nav>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 lg:gap-2 2xl:gap-4">
                    <div className="hidden sm:block">
                        <div className="scale-90 lg:scale-100 2xl:scale-110 origin-right">
                            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                        </div>
                    </div>

                    {/* Notification */}
                    <div className="relative" ref={notificationsMenuRef}>
                        <button
                            onClick={handleNotificationClick}
                            className="bg-white border border-gray-200 text-[#150089] hover:bg-gray-50 hover:border-gray-300 dark:bg-brand-dark-tertiary dark:border-transparent dark:text-white dark:hover:bg-gray-800 w-8 h-8 2xl:w-9 2xl:h-9 rounded-full flex items-center justify-center transition-all relative cursor-pointer"
                        >
                            <NotificationIcon className="w-4 h-4 2xl:w-5 2xl:h-5 fill-current" />
                            {hasNotification && (
                                <span className="absolute top-[7px] right-[7px] w-2 h-2 bg-brand-green rounded-full border border-white dark:border-brand-dark-secondary"></span>
                            )}
                        </button>
                        {isNotificationsOpen && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-brand-dark-secondary rounded-lg shadow-xl py-2 ring-1 ring-black ring-opacity-5 z-50 border border-gray-100 dark:border-brand-dark-tertiary max-h-96 overflow-y-auto">
                                <div className="px-4 py-2 border-b border-gray-100 dark:border-brand-dark-tertiary flex justify-between items-center">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                                    <button className="text-xs text-brand-green hover:underline">Mark all read</button>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-brand-dark-tertiary">
                                    <div className="flex items-start space-x-3 p-3 hover:bg-brand-light-tertiary dark:hover:bg-brand-dark-tertiary/60 transition-colors">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-light-tertiary dark:bg-brand-dark-tertiary flex items-center justify-center">
                                            <EarningsIcon className="w-4 h-4 text-brand-green" />
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-sm font-medium text-brand-text-light-primary dark:text-brand-text-primary">New commission earned!</p>
                                            <p className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary">2 hours ago</p>
                                        </div>
                                        <div className="w-2 h-2 bg-brand-green rounded-full mt-1 flex-shrink-0"></div>
                                    </div>
                                    <div className="flex items-start space-x-3 p-3 hover:bg-brand-light-tertiary dark:hover:bg-brand-dark-tertiary/60 transition-colors">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-light-tertiary dark:bg-brand-dark-tertiary flex items-center justify-center">
                                            <ReferralsIcon className="w-4 h-4 text-brand-green" />
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-sm font-medium text-brand-text-light-primary dark:text-brand-text-primary">3 new referral sign-ups</p>
                                            <p className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary">Yesterday</p>
                                        </div>
                                        <div className="w-2 h-2 bg-brand-green rounded-full mt-1 flex-shrink-0"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-px h-6 lg:h-6 2xl:h-8 bg-gray-300 dark:bg-brand-dark-tertiary hidden lg:block mx-2 2xl:mx-3"></div>

                    {/* User Profile Section */}
                    <div className="relative" ref={profileMenuRef}>
                        <button
                            onClick={() => setProfileOpen((prev) => !prev)}
                            className="flex items-center gap-2 sm:space-x-3 focus:outline-none text-left cursor-pointer"
                        >
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(affiliateData?.full_name || 'Affiliate User')}&background=150089&color=fff`}
                                alt="User Avatar"
                                className="w-9 h-9 2xl:w-10 2xl:h-10 rounded-full border border-brand-light-tertiary dark:border-transparent"
                            />
                            <div className="hidden xl:block">
                                <p className="font-semibold text-sm 2xl:text-base leading-tight text-[#19211C] dark:text-brand-text-primary">
                                    {affiliateData?.full_name || 'Affiliate User'}
                                </p>
                                <p className="text-xs 2xl:text-sm text-[#19211C] dark:text-brand-text-secondary leading-tight">
                                    {affiliateData?.email || ''}
                                </p>
                            </div>
                            <ChevronDownIcon className={`w-3 h-3 2xl:w-4 2xl:h-4 text-brand-text-light-secondary dark:text-brand-text-secondary transition-transform hidden sm:block ${isProfileOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-brand-light-secondary dark:bg-brand-dark-secondary rounded-xl shadow-2xl z-50 border border-brand-light-tertiary dark:border-brand-dark-tertiary/50 overflow-hidden">
                                <div className="p-2">
                                    <button
                                        onClick={() => { setProfileOpen(false); onNavigate?.('profile'); }}
                                        className="w-full flex items-center px-3 py-2 text-sm font-medium text-brand-text-light-primary dark:text-white rounded-lg hover:bg-brand-light-tertiary dark:hover:bg-brand-dark-tertiary transition-colors"
                                    >
                                        <ProfileIcon className="w-5 h-5 mr-3" />
                                        <span>View Profile</span>
                                    </button>
                                    <button
                                        onClick={onLogout}
                                        className="w-full flex items-center px-3 py-2 text-sm font-medium text-brand-text-light-primary dark:text-white rounded-lg hover:bg-brand-light-tertiary dark:hover:bg-brand-dark-tertiary transition-colors"
                                    >
                                        <LogoutIcon className="w-5 h-5 mr-3" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {isMobileMenuOpen && (
                    <>
                        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
                        <div
                            id="affiliate-mobile-menu"
                            ref={mobileMenuRef}
                            className="md:hidden absolute top-full left-0 w-full bg-brand-light-secondary dark:bg-brand-dark-secondary shadow-xl z-40 border-t border-brand-light-tertiary dark:border-brand-dark-tertiary animate-fade-in max-h-[85vh] overflow-y-auto"
                        >
                            <nav className="flex flex-col p-4 space-y-2">
                                {renderNavItems(true)}
                                <div className="border-t border-brand-light-tertiary dark:border-brand-dark-tertiary my-2 pt-2">
                                    <div className="flex justify-between items-center px-2 mb-2">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Appearance</p>
                                        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                                    </div>
                                </div>
                            </nav>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
};

export default AffiliateHeader;
