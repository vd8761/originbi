"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from 'next/navigation';
import ThemeToggle from "@/components/ui/ThemeToggle";
import {
    NotificationWithDotIcon,
    NotificationIcon,
    ChevronDownIcon,
    DashboardIcon,
    JobsIcon,
    RoadmapIcon,
    VideosIcon,
    ProfileIcon,
    SettingsIcon,
    LogoutIcon,
    MenuIcon,
    CoinIcon,
    OriginDataIcon,
    MyEmployeesIcon,
} from "@/components/icons";

import { useTheme } from "@/contexts/ThemeContext";

interface HeaderProps {
    onLogout: () => void;
    // Combined views for flexibility, or just string
    currentView?: "dashboard" | "assessment" | "registrations" | "jobs" | "origindata" | "settings" | "programs" | "corporate";
    portalMode?: "student" | "corporate" | "admin";
    onSwitchPortal?: () => void;
    onNavigate?: (view: any) => void;
    hideNav?: boolean;
}

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    isMobile?: boolean;
    onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
    icon,
    label,
    active,
    isMobile,
    onClick,
}) => {
    // Scaling Logic: Show text on LG (Laptops) and up. 
    // COMPACT on LG/XL to prevent overlap. ROBUST on 2XL.
    const showDesktopText = "hidden lg:inline";
    const spacingClass = isMobile
        ? "gap-3"
        : "justify-center gap-0 lg:gap-1 2xl:gap-2";

    return (
        <div className="relative group">
            <button
                onClick={onClick}
                // SCALING: 
                // LG/XL: Ultra-Compact Mode (h-8, px-2.5) to fit 5 items on laptop
                // 2XL: Robust Mode (h-10, px-6) for large screens
                className={`flex items-center ${spacingClass} rounded-full transition-all duration-200 w-full lg:h-8 2xl:h-9 cursor-pointer ${active
                    ? "bg-brand-green text-white shadow-[0_4px_14px_0_rgba(30,211,106,0.3)] border border-transparent px-2.5 2xl:px-4"
                    : "bg-white border border-gray-200 text-[#19211C] hover:bg-gray-50 hover:text-black hover:border-gray-300 dark:bg-transparent dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5 dark:hover:text-white px-2.5 2xl:px-4"
                    }`}
            >
                <div className={`${active ? "text-white" : "text-brand-green dark:text-white"}`}>
                    {icon}
                </div>
                <span
                    // TEXT SCALING: text-xs on Laptop, text-sm on 2XL
                    className={`font-medium text-xs 2xl:text-sm whitespace-nowrap ml-1.5 2xl:ml-2 ${isMobile ? "inline" : showDesktopText
                        }`}
                >
                    {label}
                </span>
            </button>
            {/* Tooltip on desktop between md and 2xl */}
            <div
                className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-max px-2 py-1 bg-black/80 dark:bg-brand-dark-tertiary text-white text-xs rounded-md shadow-lg
                opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10
                ${isMobile ? "hidden" : "block 2xl:hidden"}`}
            >
                {label}
            </div>
        </div>
    );
};

const NotificationItem: React.FC<{
    icon: React.ReactNode;
    title: string;
    time: string;
    isNew?: boolean;
}> = ({ icon, title, time, isNew }) => (
    <div className="flex items-start space-x-3 p-3 hover:bg-brand-light-tertiary dark:hover:bg-brand-dark-tertiary/60 transition-colors duration-200">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-light-tertiary dark:bg-brand-dark-tertiary flex items-center justify-center">
            {icon}
        </div>
        <div className="flex-grow">
            <p className="text-sm font-medium text-brand-text-light-primary dark:text-brand-text-primary">
                {title}
            </p>
            <p className="text-xs text-brand-text-light-secondary dark:text-brand-text-secondary">
                {time}
            </p>
        </div>
        {isNew && (
            <div className="w-2 h-2 bg-brand-green rounded-full mt-1 flex-shrink-0"></div>
        )}
    </div>
);

const Header: React.FC<HeaderProps> = ({
    onLogout,
    currentView,
    onNavigate,
    hideNav = false,
    portalMode = "student",
    onSwitchPortal,
}) => {
    const { theme, toggleTheme } = useTheme();
    const [isProfileOpen, setProfileOpen] = useState(false);
    const [isLangOpen, setLangOpen] = useState(false);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isNotificationsOpen, setNotificationsOpen] = useState(false);
    const [language, setLanguage] = useState("ENG");
    const [hasNotification, setHasNotification] = useState(true);

    const profileMenuRef = useRef<HTMLDivElement>(null);
    const langMenuRef = useRef<HTMLDivElement>(null);
    const notificationsMenuRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    const [corporateData, setCorporateData] = useState<any>(null);

    // Corporate specific logic for profile fetching (Can keep, won't hurt Admin)
    useEffect(() => {
        if (portalMode === 'corporate') {
            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    setCorporateData({
                        full_name: parsed.name,
                        email: parsed.email,
                        ...parsed
                    });
                }
            } catch (e) { /* empty */ }

            import('@/lib/services').then(({ corporateDashboardService }) => {
                const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
                let queryEmail = email;
                if (!queryEmail) {
                    const u = localStorage.getItem('user');
                    if (u) queryEmail = JSON.parse(u).email;
                }

                if (queryEmail) {
                    corporateDashboardService.getProfile(queryEmail)
                        .then((data) => {
                            setCorporateData((prev: any) => ({ ...prev, ...data }));
                        })
                        .catch((err) => console.error("Failed to fetch header data", err));
                }
            });
        } else if (portalMode === 'admin') {
            // Basic Admin Name
            if (typeof window !== 'undefined') {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        setCorporateData({
                            full_name: parsed.name || parsed.fullName || parsed.username || 'Admin User',
                            email: parsed.email || 'admin@originbi.com'
                        });
                    } catch (e) { /* empty */ }
                }
            }
        }
    }, [portalMode]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) { setProfileOpen(false); }
            if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) { setLangOpen(false); }
            if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target as Node)) { setNotificationsOpen(false); }
            if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                const target = event.target as Element;
                if (!target.closest("#mobile-menu-btn")) { setMobileMenuOpen(false); }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, [isMobileMenuOpen]);

    const pathname = usePathname();
    const activeView = (() => {
        if (pathname.includes('/dashboard')) return 'dashboard';
        if (pathname.includes('/programs')) return 'programs';
        if (pathname.includes('/corporate')) return 'corporate';
        if (pathname.includes('/registrations')) return 'registrations';
        return currentView;
    })();

    const handleLangChange = (lang: string) => { setLanguage(lang); setLangOpen(false); };
    const handleNotificationClick = () => { setNotificationsOpen((p) => !p); if (hasNotification) setHasNotification(false); };
    const handleNavClick = (view: any) => {
        onNavigate?.(view);
        setMobileMenuOpen(false);
        // If onNavigate isn't provided (e.g. in layout), we might need to router.push here?
        // But the parent is passing a handleNavigate that does router.push.
        // We will adapt the parent layout to pass a default handler or handle it here.
    };

    const notifications = [
        { icon: <RoadmapIcon className="w-4 h-4 text-brand-text-light-secondary dark:text-brand-text-secondary" />, title: "New Roadmap Unlocked!", time: "2 hours ago", isNew: true },
        { icon: <JobsIcon className="w-4 h-4 text-brand-text-light-secondary dark:text-brand-text-secondary" />, title: "3 new job matches for you", time: "Yesterday", isNew: true },
        { icon: <ProfileIcon className="w-4 h-4 text-brand-text-light-secondary dark:text-brand-text-secondary" />, title: "Your profile is 85% complete", time: "3 days ago", isNew: false },
    ];

    const renderNavItems = (isMobile: boolean) => (
        <>
            {portalMode === "admin" ? (
                <>
                    <NavItem
                        icon={<DashboardIcon />}
                        label="Dashboard"
                        active={activeView === 'dashboard'}
                        isMobile={isMobile}
                        onClick={() => handleNavClick('dashboard')}
                    />
                    <NavItem
                        icon={<RoadmapIcon />}
                        label="Programs"
                        active={activeView === 'programs'}
                        isMobile={isMobile}
                        onClick={() => handleNavClick('programs')}
                    />
                    <NavItem
                        icon={<OriginDataIcon className="w-4 h-4" />}
                        label="Corporate Access"
                        active={activeView === 'corporate'}
                        isMobile={isMobile}
                        onClick={() => handleNavClick('corporate')}
                    />
                    <NavItem
                        icon={<ProfileIcon />}
                        label="Registrations"
                        active={activeView === 'registrations'}
                        isMobile={isMobile}
                        onClick={() => handleNavClick('registrations')}
                    />
                    <NavItem icon={<SettingsIcon />} label="Settings" isMobile={isMobile} />
                </>
            ) : portalMode === "corporate" ? (
                <>
                    <NavItem icon={<DashboardIcon className="w-4 h-4" />} label="Dashboard" active={currentView === "dashboard"} isMobile={isMobile} onClick={() => handleNavClick("dashboard")} />
                    <NavItem icon={<MyEmployeesIcon className="w-4 h-4" />} label="My Employees" active={currentView === "registrations"} isMobile={isMobile} onClick={() => handleNavClick("registrations")} />
                    <NavItem icon={<JobsIcon className="w-4 h-4" />} label="Jobs" active={currentView === "jobs"} isMobile={isMobile} onClick={() => handleNavClick("jobs")} />
                    <NavItem icon={<OriginDataIcon className="w-4 h-4" />} label="Origin Data" active={currentView === "origindata"} isMobile={isMobile} onClick={() => handleNavClick("origindata")} />
                    <NavItem icon={<SettingsIcon className="w-4 h-4" />} label="Settings" active={currentView === "settings"} isMobile={isMobile} onClick={() => handleNavClick("settings")} />
                </>
            ) : (
                <>
                    <NavItem icon={<DashboardIcon />} label="Dashboard" active={currentView === "dashboard"} isMobile={isMobile} onClick={() => handleNavClick("dashboard")} />
                    {/* Student nav items ... */}
                    <NavItem icon={<JobsIcon />} label="Assessments" active={currentView === "assessment"} isMobile={isMobile} onClick={() => handleNavClick("assessment")} />
                    <NavItem icon={<RoadmapIcon />} label="Road Map" isMobile={isMobile} />
                    <NavItem icon={<VideosIcon />} label="Videos" isMobile={isMobile} />
                    <NavItem icon={<ProfileIcon />} label="Profile" isMobile={isMobile} />
                </>
            )}
            {portalMode === "student" && (
                <NavItem icon={<SettingsIcon />} label="Settings" isMobile={isMobile} />
            )}
        </>
    );

    return (
        <header className="fixed top-0 left-0 right-0 w-full bg-white dark:bg-brand-dark-secondary z-50 border-b border-gray-200 dark:border-transparent shadow-sm dark:shadow-none transition-all duration-300">
            <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-3 sm:py-4 flex items-center justify-between h-full">
                <div className="flex items-center gap-2 lg:gap-2 2xl:gap-4">
                    {!hideNav && (
                        <button
                            id="mobile-menu-btn"
                            className="md:hidden text-gray-700 dark:text-white p-1 cursor-pointer"
                            onClick={() => setMobileMenuOpen((p) => !p)}
                        >
                            <MenuIcon className="w-6 h-6 dark:text-white" />
                        </button>
                    )}

                    {/* Logo Scaling: h-6 (Laptop) -> h-7 (2XL) */}
                    <img src="/Origin-BI-Logo-01.png" alt="OriginBI Logo" className="h-5 lg:h-6 2xl:h-7 w-auto dark:hidden" />
                    <img src="/Origin-BI-white-logo.png" alt="OriginBI Logo" className="h-5 lg:h-6 2xl:h-7 w-auto hidden dark:block" />

                    {!hideNav && (
                        <nav className="hidden md:flex items-center space-x-1 lg:space-x-1 2xl:space-x-2 ml-2 lg:ml-2 2xl:ml-6">
                            {renderNavItems(false)}
                        </nav>
                    )}
                </div>

                <div className="flex items-center gap-1 sm:gap-2 lg:gap-2 2xl:gap-4">
                    <div className="hidden sm:block">
                        {/* Theme Toggle: Scale to h-8 (Laptop) / h-9 (2XL) */}
                        <div className="scale-90 lg:scale-100 2xl:scale-110 origin-right">
                            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                        </div>
                    </div>

                    {!hideNav && (
                        <>
                            {/* 2. Language: h-8 (Laptop) / h-9 (2XL) */}
                            <div className="relative hidden sm:block" ref={langMenuRef}>
                                {!corporateData ? (
                                    <div className="h-8 2xl:h-9 w-[4.5rem] bg-gray-200 dark:bg-gray-700/50 rounded-full animate-pulse border border-transparent" />
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setLangOpen((p) => !p)}
                                            className="bg-white border border-brand-green text-[#19211C] hover:bg-green-50 dark:bg-brand-dark-tertiary dark:border-transparent dark:text-white dark:hover:bg-gray-800 flex items-center justify-center space-x-1.5 px-3 h-8 2xl:h-9 rounded-full font-semibold text-xs 2xl:text-sm transition-all cursor-pointer"
                                        >
                                            <span>{language}</span>
                                            <ChevronDownIcon className="w-3 h-3" />
                                        </button>
                                        {isLangOpen && (
                                            <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-brand-dark-tertiary rounded-lg shadow-xl py-1 ring-1 ring-black ring-opacity-5 z-50 border border-gray-100 dark:border-transparent">
                                                <button onClick={() => handleLangChange("ENG")} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-brand-text-primary hover:bg-gray-50 dark:hover:bg-brand-dark-secondary/60">English</button>
                                                <button onClick={() => handleLangChange("TAM")} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-brand-text-primary hover:bg-gray-50 dark:hover:bg-brand-dark-secondary/60">Tamil</button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* 3. Notification: h-8 w-8 (Laptop) / h-9 w-9 (2XL) */}
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
                                            {notifications.map((n, i) => (
                                                <NotificationItem key={i} {...n} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <div className="w-px h-6 lg:h-6 2xl:h-8 bg-gray-300 dark:bg-brand-dark-tertiary hidden lg:block mx-2 2xl:mx-3"></div>

                    {/* User Profile Section */}
                    <div className="relative" ref={profileMenuRef}>
                        <button
                            onClick={() => setProfileOpen((prev) => !prev)}
                            className="flex items-center gap-2 sm:space-x-3 focus:outline-none text-left cursor-pointer"
                        >
                            {!corporateData ? (
                                <div className="w-8 h-8 2xl:w-9 2xl:h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse border border-brand-light-tertiary dark:border-transparent flex-shrink-0"></div>
                            ) : (
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(corporateData.full_name || corporateData.name || 'User')}&background=150089&color=fff`}
                                    alt="User Avatar"
                                    className="w-9 h-9 2xl:w-10 2xl:h-10 rounded-full border border-brand-light-tertiary dark:border-transparent"
                                />
                            )}
                            <div className="hidden xl:block">
                                {!corporateData ? (
                                    <div className="flex flex-col gap-1">
                                        <span className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                                        <span className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span>
                                    </div>
                                ) : (
                                    <>
                                        <p className="font-semibold text-sm 2xl:text-base leading-tight text-[#19211C] dark:text-brand-text-primary">
                                            {corporateData.full_name || corporateData.name || 'User'}
                                        </p>
                                        <p className="text-xs 2xl:text-sm text-[#19211C] dark:text-brand-text-secondary leading-tight">
                                            {corporateData.email || ''}
                                        </p>
                                    </>
                                )}
                            </div>
                            <ChevronDownIcon
                                className={`w-3 h-3 2xl:w-4 2xl:h-4 text-brand-text-light-secondary dark:text-brand-text-secondary transition-transform hidden sm:block ${isProfileOpen ? "rotate-180" : ""
                                    }`}
                            />
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-brand-light-secondary dark:bg-brand-dark-secondary rounded-xl shadow-2xl z-50 border border-brand-light-tertiary dark:border-brand-dark-tertiary/50 overflow-hidden">
                                <div className="p-2">
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
            </div>

            {
                isMobileMenuOpen && !hideNav && (
                    <div
                        id="mobile-menu"
                        ref={mobileMenuRef}
                        className="md:hidden absolute top-full left-0 w-full bg-brand-light-secondary dark:bg-brand-dark-secondary shadow-lg z-40 border-t border-brand-light-tertiary dark:border-brand-dark-tertiary animate-fade-in"
                    >
                        <nav className="flex flex-col p-4 space-y-2">
                            {renderNavItems(true)}

                            <div className="border-t border-brand-light-tertiary dark:border-brand-dark-tertiary my-2 pt-2">
                                <div className="flex justify-between items-center px-2 mb-2">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                                        Appearance
                                    </p>
                                    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                                </div>
                                <div className="flex justify-between items-center px-2">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                                        Language
                                    </p>
                                    <div className="flex bg-white dark:bg-brand-dark-tertiary rounded-lg p-1 border border-brand-light-tertiary dark:border-white/10">
                                        <button
                                            onClick={() => setLanguage("ENG")}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${language === "ENG"
                                                ? "bg-brand-green text-white shadow-sm"
                                                : "text-brand-text-light-secondary dark:text-brand-text-secondary hover:text-brand-text-primary dark:hover:text-white"
                                                }`}
                                        >
                                            ENG
                                        </button>
                                        <button
                                            onClick={() => setLanguage("TAM")}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${language === "TAM"
                                                ? "bg-brand-green text-white shadow-sm"
                                                : "text-brand-text-light-secondary dark:text-brand-text-secondary hover:text-brand-text-primary dark:hover:text-white"
                                                }`}
                                        >
                                            TAM
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </nav>
                    </div>
                )
            }
        </header >
    );
};

export default Header;
