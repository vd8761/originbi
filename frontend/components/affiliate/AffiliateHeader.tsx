"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from 'next/navigation';
import ThemeToggle from '../ui/ThemeToggle';
import {
    NotificationWithDotIcon,
    NotificationIcon,
    ChevronDownIcon,
    DashboardIcon,
    ProfileIcon,
    SettingsIcon,
    LogoutIcon,
    MenuIcon,
    HistoryIcon,
    CheckCircleIcon,
    CompletedStepIcon,
    UsersIcon,
    RoadmapIcon,
    CoinIcon,
    MarkAllReadIcon,
    NoNotificationsIcon,
} from '../icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from "../../lib/hooks/useNotifications";
import { formatRelativeTime, capitalizeWords } from "../../lib/utils";

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
                    ? `bg-brand-green text-white shadow-none border border-transparent ${isMobile ? "px-4" : "px-2.5 2xl:px-4"}`
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

const NotificationItem: React.FC<{
    icon?: React.ReactNode;
    title: string;
    message: string;
    time?: string;
    isNew?: boolean;
    onClick?: () => void;
}> = ({ icon, title, message, time, isNew, onClick }) => (
    <div
        onClick={onClick}
        className="flex items-start justify-between p-3 px-1.5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors duration-200 cursor-pointer border-b border-gray-100 dark:border-white/5 last:border-0"
    >
        <div className="flex items-start space-x-3 min-w-0 pr-4 w-full">
            {icon && (
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 text-brand-green">
                    {icon}
                </div>
            )}
            <div className="flex-grow min-w-0 flex flex-col pt-0.5">
                <div className="text-[14px] font-semibold text-gray-900 dark:text-white w-full">
                    {title}
                </div>
                <div className="text-[13px] text-gray-500 dark:text-gray-400 mt-1 w-full">
                    {message}
                </div>
            </div>
        </div>
        <div className="flex flex-col items-end flex-shrink-0 space-y-2 pt-1 h-full">
            {isNew ? (
                <div className="w-2 h-2 bg-brand-green rounded-full shadow-[0_0_8px_rgba(30,211,106,0.6)]"></div>
            ) : (
                <div className="w-2 h-2"></div>
            )}
            {time && (
                <span className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap pt-2">
                    {time}
                </span>
            )}
        </div>
    </div>
);

const AffiliateHeader: React.FC<AffiliateHeaderProps> = ({ onLogout, onNavigate }) => {
    const { theme, toggleTheme } = useTheme();
    const [isProfileOpen, setProfileOpen] = useState(false);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isNotificationsOpen, setNotificationsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("All");
    const [affiliateData, setAffiliateData] = useState<any>(null);
    const { unreadCount, notifications: realNotifications, fetchNotifications, markAllAsRead, markAsRead } = useNotifications();

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
            if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target as Node)) {
                if (isNotificationsOpen) {
                    if (unreadCount > 0) markAllAsRead();
                    setNotificationsOpen(false);
                    setActiveTab("All");
                }
            }
            if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                const target = event.target as Element;
                if (!target.closest("#affiliate-mobile-menu-btn")) setMobileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMobileMenuOpen, isNotificationsOpen, unreadCount, markAllAsRead]);

    const handleNavClick = (view: string) => {
        onNavigate?.(view);
        setMobileMenuOpen(false);
    };

    const handleNotificationClick = () => {
        const nextState = !isNotificationsOpen;
        if (nextState) {
            fetchNotifications();
            setNotificationsOpen(true);
        } else {
            if (unreadCount > 0) {
                markAllAsRead();
            }
            setNotificationsOpen(false);
            setActiveTab("All");
        }
    };

    const getNotificationIcon = (type: string) => {
        const iconClass = "w-4 h-4 text-brand-green";
        switch (type) {
            case 'STUDENT_REFERRAL_REGISTRATION':
            case 'STUDENT_DIRECT_REGISTRATION':
            case 'AFFILIATE_NEW_REFERRAL':
                return <ProfileIcon className={iconClass} />;
            case 'NEW_CORPORATE_SIGNUP':
                return <UsersIcon className={iconClass} />;
            case 'AFFILIATE_SETTLEMENT_READY':
            case 'AFFILIATE_SETTLEMENT_PROCESSED':
                return <EarningsIcon className={iconClass} />;
            case 'AFFILIATE_MILESTONE_REACHED':
                return <CompletedStepIcon className={iconClass} />;
            case 'EMPLOYEE_TEST_COMPLETED':
                return <CompletedStepIcon className={iconClass} />;
            default:
                return <RoadmapIcon className={iconClass} />;
        }
    };

    const filteredNotificationsByType =
        realNotifications.length > 0
            ? realNotifications.filter((n) => {
                const isWithin7Days =
                    new Date(n.createdAt).getTime() >=
                    Date.now() - 7 * 24 * 60 * 60 * 1000;
                if (!isWithin7Days) return false;

                if (activeTab === "History") return true;

                if (!n.isRead) {
                    if (activeTab === "All") return true;

                    const typeStr = n.type || "";
                    if (activeTab === "Settlement")
                        return (
                            typeStr.includes("SETTLEMENT") ||
                            typeStr.includes("EARNING")
                        );

                    return true;
                }

                return false;
            })
            : [];

    const displayNotifications = filteredNotificationsByType.map((n) => ({
        id: n.id,
        icon: getNotificationIcon(n.type),
        title: n.title || capitalizeWords(n.type.toLowerCase().replace(/_/g, ' ')),
        message: n.message,
        time: formatRelativeTime(n.createdAt),
        isNew: !n.isRead,
        createdAt: n.createdAt,
    }));

    type GroupedType = { title: string; items: typeof displayNotifications };
    const groupedNotifications: GroupedType[] = [];

    if (displayNotifications.length > 0) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const groups = displayNotifications.reduce(
            (acc, n) => {
                const date = new Date(n.createdAt);
                const isToday =
                    date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();
                const isYesterday =
                    date.getDate() === yesterday.getDate() &&
                    date.getMonth() === yesterday.getMonth() &&
                    date.getFullYear() === yesterday.getFullYear();

                const formatNum = (num: number) => num.toString().padStart(2, "0");
                let key = "Older";
                if (isToday) key = "Today";
                else if (isYesterday)
                    key = `Yesterday (${formatNum(date.getDate())}/${formatNum(date.getMonth() + 1)}/${date.getFullYear()})`;
                else
                    key = `${formatNum(date.getDate())}/${formatNum(date.getMonth() + 1)}/${date.getFullYear()}`;

                if (!acc[key]) acc[key] = [];
                acc[key].push(n);
                return acc;
            },
            {} as Record<string, typeof displayNotifications>,
        );

        if (groups["Today"])
            groupedNotifications.push({ title: "Today", items: groups["Today"] });
        const yesterdayKey = Object.keys(groups).find((k) =>
            k.startsWith("Yesterday"),
        );
        if (yesterdayKey)
            groupedNotifications.push({
                title: yesterdayKey,
                items: groups[yesterdayKey],
            });

        Object.keys(groups).forEach((key) => {
            if (key !== "Today" && !key.startsWith("Yesterday")) {
                groupedNotifications.push({ title: key, items: groups[key] });
            }
        });
    }

    const renderNavItems = (isMobile: boolean) => (
        <>
            <NavItem icon={<DashboardIcon className="w-4 h-4" />} label="Dashboard" active={activeView === "dashboard"} isMobile={isMobile} onClick={() => handleNavClick("dashboard")} />
            <NavItem icon={<ReferralsIcon className="w-4 h-4" />} label="Referrals" active={activeView === "referrals"} isMobile={isMobile} onClick={() => handleNavClick("referrals")} />
            <NavItem icon={<EarningsIcon className="w-4 h-4" />} label="Earnings" active={activeView === "earnings"} isMobile={isMobile} onClick={() => handleNavClick("earnings")} />
            <NavItem icon={<SettingsIcon className="w-4 h-4" />} label="Settings" active={activeView === "settings"} isMobile={isMobile} onClick={() => handleNavClick("settings")} />
        </>
    );

    return (
        <header className={`fixed top-0 left-0 right-0 w-full z-50 transition-all ${isNotificationsOpen ? "duration-150" : "duration-300"} bg-transparent dark:bg-[#19211C]/40 ${isNotificationsOpen ? "" : "backdrop-blur-xl dark:backdrop-blur-[200px]"} border-b border-[#E0E0E0] dark:border-white/[0.08] shadow-none`}>
            {isNotificationsOpen && (
                <div className="absolute top-full left-0 w-full h-[100vh] bg-black/20 dark:bg-black/40 z-[-1] animate-fade-in-fast" />
            )}
            <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-3 sm:py-4 flex items-center justify-between h-full">
                <div className="flex items-center gap-2 lg:gap-2 2xl:gap-4">
                    <button
                        id="affiliate-mobile-menu-btn"
                        className="md:hidden text-gray-700 dark:text-white p-1 cursor-pointer"
                        onClick={() => setMobileMenuOpen((p) => !p)}
                    >
                        <MenuIcon className="w-6 h-6 dark:text-white" />
                    </button>

                    <img src="/Origin-BI-Logo-01.png" alt="OriginBI Logo" className="h-5 lg:h-5.5 2xl:h-6 w-auto dark:hidden" />
                    <img src="/Origin-BI-white-logo.png" alt="OriginBI Logo" className="h-5 lg:h-5.5 2xl:h-6 w-auto hidden dark:block" />

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
                        <div className="scale-90 lg:scale-100 2xl:scale-100 origin-right">
                            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                        </div>
                    </div>

                    {/* Notification */}
                    <div className="relative" ref={notificationsMenuRef}>
                        <button
                            onClick={handleNotificationClick}
                            className={`w-8 h-8 2xl:w-8.5 2xl:h-8.5 rounded-full flex items-center justify-center transition-all relative cursor-pointer ${isNotificationsOpen
                                ? "bg-[#1ED36A] text-white border-transparent"
                                : "bg-white border border-gray-200 text-[#150089] hover:bg-gray-50 hover:border-gray-300 dark:bg-brand-dark-tertiary dark:border-transparent dark:text-white dark:hover:bg-gray-800"
                                }`}
                        >
                            <NotificationIcon className="w-[15px] h-[15px] 2xl:w-[19px] 2xl:h-[19px] fill-current" />
                            {unreadCount > 0 && (
                                <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center ${isNotificationsOpen ? "bg-white text-[#1ED36A] border-transparent" : "bg-brand-green text-white border-white dark:border-brand-dark-secondary"} border-2 text-[10px] font-bold rounded-full px-1`}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>
                        {isNotificationsOpen && (
                            <div className="absolute right-0 top-full mt-6 w-[340px] sm:w-[480px] md:w-[540px] notification-glass-card p-0 z-50 animate-slide-down overflow-hidden text-gray-900 dark:text-white cursor-default">
                                <div className="p-5 pb-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-[17px] font-semibold tracking-wide text-gray-900 dark:text-white">
                                            Notifications
                                        </h3>
                                        <button
                                            onClick={() => setNotificationsOpen(false)}
                                            className="w-[27px] h-[27px] bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                        >
                                            <svg
                                                className="w-3.5 h-3.5 text-brand-green"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="h-px bg-gray-200 dark:bg-white/10 mb-4" />

                                    <div className="flex justify-between items-center flex-wrap gap-y-3 gap-x-6">
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                "All",
                                                "Settlement",
                                                "History",
                                            ].map((tab) => (
                                                <button
                                                    key={tab}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveTab(tab);
                                                    }}
                                                    className={`px-4 py-1 rounded-full text-[13px] transition-colors ${activeTab === tab
                                                        ? "bg-brand-green text-white font-semibold"
                                                        : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 font-medium"
                                                        }`}
                                                >
                                                    {tab === "All" && unreadCount > 0
                                                        ? `All (${unreadCount})`
                                                        : tab}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAllAsRead();
                                            }}
                                            className="flex items-center gap-1.5 text-brand-green text-[13px] hover:text-green-400 transition-colors bg-transparent border-none flex-shrink-0"
                                        >
                                            <MarkAllReadIcon />
                                            <span className="font-medium tracking-wide">
                                                Mark as all Read
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <div className="max-h-[440px] overflow-y-auto px-2 pb-4 custom-scrollbar">
                                    {groupedNotifications.length > 0 ? (
                                        groupedNotifications.map((group, gIdx) => (
                                            <div key={gIdx} className="mb-4 last:mb-0">
                                                <h4 className="text-[14px] text-gray-500 dark:text-gray-300 mb-2 px-2 font-medium">
                                                    {group.title}
                                                </h4>
                                                <div className="divide-y divide-gray-100 dark:divide-white/5">
                                                    {group.items.map((n, i) => (
                                                        <NotificationItem
                                                            key={i}
                                                            {...n}
                                                            onClick={() => {
                                                                if (n.isNew) markAsRead(n.id);
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 pb-12 flex flex-col items-center justify-center text-center">
                                            <NoNotificationsIcon className="w-[100px] h-auto mb-4 text-[#19211C] dark:text-white" />
                                            <p className="text-gray-900 dark:text-white font-medium text-[15px]">
                                                No Notifications Yet
                                            </p>
                                        </div>
                                    )}
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
                                <p className="font-semibold text-sm 2xl:text-sm leading-tight text-[#19211C] dark:text-brand-text-primary">
                                    {affiliateData?.full_name || 'Affiliate User'}
                                </p>
                                <p className="text-xs 2xl:text-[12px] text-[#19211C] dark:text-brand-text-secondary leading-tight">
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
                            className="md:hidden absolute top-full left-0 w-full bg-brand-light-secondary dark:bg-[#19211C]/40 dark:backdrop-blur-[200px] shadow-none z-40 border-t border-brand-light-tertiary dark:border-white/[0.08] animate-fade-in max-h-[85vh] overflow-y-auto"
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
