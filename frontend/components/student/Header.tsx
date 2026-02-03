"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from 'next/navigation';
import ThemeToggle from "../ui/ThemeToggle";
import { studentService } from "../../lib/services/student.service";
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
} from "../icons";

import { useTheme } from "../../contexts/ThemeContext";

interface HeaderProps {
    onLogout: () => void;
    currentView?: "dashboard" | "assessment" | "roadmaps";
    onNavigate?: (view: "dashboard" | "assessment") => void;
    hideNav?: boolean;
    showAssessmentOnly?: boolean;
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
    // 90% Scale Goal: start at LG.
    const showDesktopText = "hidden lg:inline";

    const spacingClass = isMobile
        ? "gap-3"
        : "justify-center gap-1 lg:gap-2 2xl:gap-3";

    return (
        <div className="relative group">
            <button
                onClick={onClick}
                // SCALING (90% Simulation): 
                // LG/XL: Compact (h-7, px-2) 
                // 2XL: Regular (h-8, px-3)
                className={`flex items-center ${spacingClass} rounded-full transition-all duration-200 w-full ${isMobile ? "py-3.5" : "lg:h-7 2xl:h-8"} cursor-pointer ${active
                    ? "bg-[#1ED36A] text-white shadow-[0_4px_14px_0_rgba(30,211,106,0.3)] border border-transparent px-2 2xl:px-3"
                    : "bg-white border border-gray-200 text-[#19211C] hover:bg-gray-50 hover:text-black hover:border-gray-300 dark:bg-transparent dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5 dark:hover:text-white px-2 2xl:px-3"
                    }`}
            >
                <div className={`${active ? "text-white" : "text-[#1ED36A] dark:text-white"}`}>
                    {icon}
                </div>
                <span
                    // TEXT SCALING: text-[11px] on Laptop, text-xs on 2XL
                    className={`font-medium ${isMobile ? "text-sm" : "text-[11px] 2xl:text-xs"} whitespace-nowrap 2xl:ml-2 ${isMobile ? "inline" : showDesktopText
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



import { useLanguage } from "../../contexts/LanguageContext";

// ... existing imports

interface HeaderProps {
    onLogout: () => void;
    currentView?: "dashboard" | "assessment" | "roadmaps";
    onNavigate?: (view: "dashboard" | "assessment") => void;
    hideNav?: boolean;
    showAssessmentOnly?: boolean;
}

// ... NavItem and NotificationItem components ...

const Header: React.FC<HeaderProps> = ({
    onLogout,
    currentView,
    onNavigate,
    hideNav = false,
    showAssessmentOnly = false,
}) => {
    const { theme, toggleTheme } = useTheme();
    const { language, setLanguage } = useLanguage(); // Use Global Context
    const [isProfileOpen, setProfileOpen] = useState(false);
    const [isLangOpen, setLangOpen] = useState(false);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isNotificationsOpen, setNotificationsOpen] = useState(false);
    const [hasNotification, setHasNotification] = useState(true);

    const profileMenuRef = useRef<HTMLDivElement>(null);
    const langMenuRef = useRef<HTMLDivElement>(null);
    const notificationsMenuRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    const [user, setUser] = useState<{ name: string; email: string } | null>(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');

            if (email) {
                // Temporary State
                setUser({ name: email.split('@')[0], email });

                try {
                    const profile = await studentService.getProfile(email);
                    if (profile) {
                        const fullName = profile.metadata?.fullName || profile.metadata?.name || profile.email?.split('@')[0] || 'Student';
                        setUser({
                            name: fullName,
                            email: profile.email
                        });
                        localStorage.setItem('user', JSON.stringify({ ...profile, name: fullName })); // Update cache
                    }
                } catch (e) {
                    console.error("Error loading profile", e);
                }
            } else {
                // Fallback default if no email found
                setUser({
                    name: 'Student',
                    email: 'student@originbi.com'
                });
            }
        };

        fetchUserProfile();
    }, []);

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

    const handleLangChange = (lang: "ENG" | "TAM") => { setLanguage(lang); setLangOpen(false); };
    const handleNotificationClick = () => { setNotificationsOpen((p) => !p); if (hasNotification) setHasNotification(false); };

    const router = useRouter();
    const pathname = usePathname();

    const handleNavClick = (view: "dashboard" | "assessment") => {
        onNavigate?.(view);
        setMobileMenuOpen(false);
    };

    const handleRoadmapClick = () => {
        router.push('/student/roadmaps');
        setMobileMenuOpen(false);
    };

    // Determine if roadmaps is active based on pathname
    const isRoadmapsActive = pathname?.includes('/student/roadmaps') || currentView === 'roadmaps';

    const notifications = [
        { icon: <RoadmapIcon className="w-4 h-4 text-brand-text-light-secondary dark:text-brand-text-secondary" />, title: "New Roadmap Unlocked!", time: "2 hours ago", isNew: true },
        { icon: <JobsIcon className="w-4 h-4 text-brand-text-light-secondary dark:text-brand-text-secondary" />, title: "3 new job matches for you", time: "Yesterday", isNew: true },
        { icon: <ProfileIcon className="w-4 h-4 text-brand-text-light-secondary dark:text-brand-text-secondary" />, title: "Your profile is 85% complete", time: "3 days ago", isNew: false },
    ];

    const renderNavItems = (isMobile: boolean) => {
        if (showAssessmentOnly) {
            return (
                <NavItem
                    icon={<JobsIcon />}
                    label="Assessments"
                    active={true}
                    isMobile={isMobile}
                    onClick={() => handleNavClick("assessment")}
                />
            );
        }
        return (
            <>
                <NavItem
                    icon={<DashboardIcon />}
                    label="Dashboard"
                    active={currentView === "dashboard"}
                    isMobile={isMobile}
                    onClick={() => handleNavClick("dashboard")}
                />
                <NavItem
                    icon={<JobsIcon />}
                    label="Assessments"
                    active={currentView === "assessment"}
                    isMobile={isMobile}
                    onClick={() => handleNavClick("assessment")}
                />
                <NavItem icon={<RoadmapIcon />} label="Road Map" active={isRoadmapsActive} isMobile={isMobile} onClick={handleRoadmapClick} />
                <NavItem icon={<VideosIcon />} label="Videos" isMobile={isMobile} />
                <NavItem icon={<ProfileIcon />} label="Profile" isMobile={isMobile} />
                <NavItem icon={<SettingsIcon />} label="Settings" isMobile={isMobile} />
            </>
        );
    };

    return (
        <header className="fixed top-0 left-0 right-0 w-full bg-white dark:bg-brand-dark-secondary z-50 border-b border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
            {/* 90% Scale Padding: py-2 sm:py-3 */}
            <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 py-2 sm:py-3 flex items-center justify-between h-full">
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

                    {/* Logo Scaling: h-4/5 (Laptop) -> h-6 (2XL) */}
                    <img src="/Origin-BI-Logo-01.png" alt="OriginBI Logo" className="h-4 lg:h-5 2xl:h-6 w-auto dark:hidden" />
                    <img src="/Origin-BI-white-logo.png" alt="OriginBI Logo" className="h-4 lg:h-5 2xl:h-6 w-auto hidden dark:block" />

                    {!hideNav && (
                        <nav className="hidden md:flex items-center space-x-1 lg:space-x-1 2xl:space-x-2 ml-2 lg:ml-2 2xl:ml-6">
                            {renderNavItems(false)}
                        </nav>
                    )}
                </div>

                <div className="flex items-center gap-1 sm:gap-2 lg:gap-2 2xl:gap-4">
                    <div>
                        {/* Theme Toggle Scaled Down */}
                        <div className="scale-75 lg:scale-90 2xl:scale-100 origin-right">
                            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                        </div>
                    </div>


                    {/* 2. Language: h-7 (Laptop) / h-8 (2XL) */}
                    <div className="relative" ref={langMenuRef}>
                        <button
                            onClick={() => setLangOpen((p) => !p)}
                            className="bg-white border border-gray-200 text-[#19211C] hover:bg-gray-50 hover:border-gray-300 dark:bg-transparent dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5 dark:hover:text-white flex items-center justify-center space-x-1 px-2 lg:px-2.5 h-7 2xl:h-8 rounded-full font-semibold text-[10px] 2xl:text-[11px] transition-all cursor-pointer"
                        >
                            <span>{language}</span>
                            <ChevronDownIcon className="w-2.5 h-2.5 opacity-60" />
                        </button>
                        {isLangOpen && (
                            <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-brand-dark-tertiary rounded-lg shadow-xl py-1 ring-1 ring-black ring-opacity-5 z-50 border border-gray-100 dark:border-transparent">
                                <button onClick={() => handleLangChange("ENG")} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-brand-text-primary hover:bg-gray-50 dark:hover:bg-brand-dark-secondary/60">English</button>
                                <button onClick={() => handleLangChange("TAM")} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-brand-text-primary hover:bg-gray-50 dark:hover:bg-brand-dark-secondary/60">Tamil</button>
                            </div>
                        )}
                    </div>

                    {/* 3. Notification: h-7 w-7 (Laptop) / h-8 w-8 (2XL) */}
                    <div className="relative" ref={notificationsMenuRef}>
                        <button
                            onClick={handleNotificationClick}
                            className="bg-white border border-gray-200 shadow-sm text-[#150089] hover:bg-gray-50 hover:border-gray-300 dark:bg-black/20 dark:border-white/5 dark:shadow-none dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white w-7 h-7 2xl:w-8 2xl:h-8 rounded-full flex items-center justify-center transition-all relative cursor-pointer"
                        >
                            <NotificationIcon className="w-3.5 h-3.5 2xl:w-4 2xl:h-4 fill-current" />
                            {hasNotification && (
                                <span className="absolute top-[6px] right-[6px] w-1.5 h-1.5 bg-[#1ED36A] rounded-full border border-white dark:border-[#19211C]"></span>
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


                    <div className="w-px h-5 lg:h-5 2xl:h-6 bg-gray-300 dark:bg-[#2D3136] hidden lg:block mx-2 2xl:mx-3"></div>

                    {/* User Profile Section - Scaled Down */}
                    <div className="relative" ref={profileMenuRef}>
                        <button
                            onClick={() => setProfileOpen((prev) => !prev)}
                            className="flex items-center gap-2 sm:gap-3 focus:outline-none text-left cursor-pointer"
                        >
                            {!user ? (
                                <div className="w-8 h-8 2xl:w-9 2xl:h-9 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse flex-shrink-0"></div>
                            ) : (
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Student')}&background=1ED36A&color=fff`}
                                    alt="User Avatar"
                                    className="w-8 h-8 2xl:w-9 2xl:h-9 rounded-full border border-brand-light-tertiary dark:border-white/10"
                                />
                            )}
                            <div className="hidden xl:block text-left mr-1">
                                {!user ? (
                                    <div className="flex flex-col gap-1">
                                        <span className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></span>
                                        <span className="h-2.5 w-12 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></span>
                                    </div>
                                ) : (
                                    <>
                                        <p className="font-semibold text-xs 2xl:text-sm leading-tight text-[#19211C] dark:text-white">
                                            {user.name || 'Student'}
                                        </p>
                                        <p className="text-[10px] 2xl:text-xs text-[#19211C]/60 dark:text-gray-400 leading-tight">
                                            {user.email || ''}
                                        </p>
                                    </>
                                )}
                            </div>
                            <ChevronDownIcon
                                className={`w-2.5 h-2.5 2xl:w-3 2xl:h-3 text-brand-text-light-secondary dark:text-gray-500 transition-transform hidden sm:block ${isProfileOpen ? "rotate-180" : ""
                                    }`}
                            />
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-brand-light-secondary dark:bg-brand-dark-secondary rounded-xl shadow-2xl z-50 border border-brand-light-tertiary dark:border-brand-dark-tertiary/50 overflow-hidden">
                                <div className="px-4 py-3 border-b border-brand-light-tertiary dark:border-brand-dark-tertiary">
                                    <p className="text-sm font-semibold text-[#19211C] dark:text-brand-text-primary truncate">
                                        {user?.name || 'Student'}
                                    </p>
                                    <p className="text-xs text-[#19211C]/60 dark:text-brand-text-secondary truncate mt-0.5">
                                        {user?.email || ''}
                                    </p>
                                </div>
                                <div className="p-2">
                                    <button
                                        onClick={onLogout}
                                        className="w-full flex items-center px-3 py-2 text-sm font-medium text-brand-text-light-primary dark:text-white rounded-lg hover:bg-brand-light-tertiary dark:hover:bg-brand-dark-tertiary transition-colors cursor-pointer"
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

            {isMobileMenuOpen && !hideNav && (
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
            )}
        </header>
    );
};

export default Header;