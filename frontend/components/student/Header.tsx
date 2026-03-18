"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from 'next/navigation';
import ThemeToggle from '../ui/ThemeToggle';
import { studentService } from '../../lib/services/student.service';
import {
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
    UsersIcon,
    HistoryIcon,
    CompletedStepIcon,
    MarkAllReadIcon,
    NoNotificationsIcon,
} from '../icons';

import { useTheme } from '../../contexts/ThemeContext';
import { Brain } from 'lucide-react';
import { capitalizeWords, formatRelativeTime } from "../../lib/utils";
import { useNotifications } from "../../lib/hooks/useNotifications";

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
        : "justify-center gap-2";

    return (
        <div className="relative group">
            <button
                onClick={onClick}
                // SCALING (90% Simulation): 
                // LG/XL: Compact (h-7, px-2) 
                // 2XL: Regular (h-8, px-3)
                className={`flex items-center ${spacingClass} rounded-full transition-all duration-200 w-full ${isMobile ? "py-3.5" : "lg:h-7 2xl:h-7"} cursor-pointer ${active
                    ? "bg-[#1ED36A] text-white shadow-[0_4px_14px_0_rgba(30,211,106,0.3)] border border-transparent px-2.5 2xl:px-3"
                    : "bg-white border border-gray-200 text-[#19211C] hover:bg-gray-50 hover:text-black hover:border-gray-300 dark:bg-transparent dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5 dark:hover:text-white px-2.5 2xl:px-3"
                    }`}
            >
                <div className={`${active ? "text-white" : "text-[#1ED36A] dark:text-white"}`}>
                    {icon}
                </div>
                <span
                    // TEXT SCALING: text-[10.5px] on Laptop, text-[11.5px] on 2XL
                    className={`font-medium ${isMobile ? "text-sm ml-2" : "text-[10.5px] 2xl:text-[11.5px]"} whitespace-nowrap ${isMobile ? "inline" : showDesktopText
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
import { useLanguage } from '../../contexts/LanguageContext';

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
    const [activeTab, setActiveTab] = useState("All");
    const { unreadCount, notifications: realNotifications, fetchNotifications, markAllAsRead, markAsRead } = useNotifications();

    const profileMenuRef = useRef<HTMLDivElement>(null);
    const langMenuRef = useRef<HTMLDivElement>(null);
    const notificationsMenuRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    const [user, setUser] = useState<{ name: string; email: string } | null>(null);
    const [counsellorAccess, setCounsellorAccess] = useState(false);
    const [counsellorDays, setCounsellorDays] = useState<number | null>(null);
    const [counsellorPurchasing, setCounsellorPurchasing] = useState(false);

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

                // Check AI Counsellor subscription
                try {
                    const status = await studentService.getSubscriptionStatus(email);
                    setCounsellorAccess(status.hasAiCounsellor);
                    if (status.daysRemaining !== undefined) setCounsellorDays(status.daysRemaining);
                } catch { /* ignore */ }
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

    const handleCounsellorPurchase = async () => {
        setCounsellorPurchasing(true);
        try {
            const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
            if (!email) return;
            const order = await studentService.createCounsellorOrder(email);
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                const options = {
                    key: order.keyId,
                    amount: order.amount,
                    currency: order.currency,
                    name: 'OriginBI',
                    description: 'AI Career Counsellor - 90 Day Access',
                    order_id: order.orderId,
                    handler: async (response: any) => {
                        try {
                            const result = await studentService.verifyCounsellorPayment({
                                email: email!,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            });
                            if (result.success) {
                                setCounsellorAccess(true);
                                setCounsellorDays(90);
                            }
                        } catch (e) {
                            console.error('Payment verification failed', e);
                        }
                        setCounsellorPurchasing(false);
                    },
                    prefill: { email },
                    theme: { color: '#7c3aed' },
                    modal: { ondismiss: () => setCounsellorPurchasing(false) },
                };
                const rzp = new (window as any).Razorpay(options);
                rzp.open();
            };
            document.body.appendChild(script);
        } catch (e) {
            console.error('Purchase initiation failed', e);
            setCounsellorPurchasing(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) { setProfileOpen(false); }
            if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) { setLangOpen(false); }
            if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target as Node)) {
                if (isNotificationsOpen) {
                    if (unreadCount > 0) markAllAsRead();
                    setNotificationsOpen(false);
                    setActiveTab("All");
                }
            }
            if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                const target = event.target as Element;
                if (!target.closest("#mobile-menu-btn")) { setMobileMenuOpen(false); }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, [isMobileMenuOpen, isNotificationsOpen, unreadCount, markAllAsRead]);

    const handleLangChange = (lang: "ENG" | "TAM") => { setLanguage(lang); setLangOpen(false); };
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

    const handleCounsellorClick = () => {
        router.push('/student/counsellor');
        setMobileMenuOpen(false);
    };

    // Determine if roadmaps is active based on pathname
    const isRoadmapsActive = pathname?.includes('/student/roadmaps') || currentView === 'roadmaps';
    const isCounsellorActive = pathname?.includes('/student/counsellor');

    const getNotificationIcon = (type: string) => {
        const iconClass = "w-4 h-4 text-brand-green";
        switch (type) {
            case 'STUDENT_REFERRAL_REGISTRATION':
            case 'STUDENT_DIRECT_REGISTRATION':
                return <ProfileIcon className={iconClass} />;
            case 'NEW_CORPORATE_SIGNUP':
                return <UsersIcon className={iconClass} />;
            case 'EMPLOYEE_TEST_COMPLETED':
                return <CompletedStepIcon className={iconClass} />;
            case 'LEVEL_UNLOCKED':
                return <JobsIcon className={iconClass} />;
            case 'ASSESSMENT_REPORT_READY':
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
                    if (activeTab === "Assessment")
                        return (
                            typeStr.includes("TEST") ||
                            typeStr.includes("EXAM") ||
                            typeStr.includes("ASSESSMENT") ||
                            typeStr.includes("LEVEL")
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
                <NavItem icon={<Brain className="w-4 h-4" />} label="AI Counsellor" active={isCounsellorActive} isMobile={isMobile} onClick={handleCounsellorClick} />
                <NavItem icon={<VideosIcon />} label="Videos" isMobile={isMobile} />
                <NavItem icon={<ProfileIcon />} label="Profile" isMobile={isMobile} />
                <NavItem icon={<SettingsIcon />} label="Settings" isMobile={isMobile} />
            </>
        );
    };

    return (
        <header className={`fixed top-0 left-0 right-0 w-full z-50 transition-all ${isNotificationsOpen ? "duration-150" : "duration-300"} bg-transparent dark:bg-white/[0.08] ${isNotificationsOpen ? "" : "backdrop-blur-xl"} border-b border-[#E0E0E0] dark:border-white/10 shadow-none`}>
            {isNotificationsOpen && (
                <div className="absolute top-full left-0 w-full h-[100vh] bg-black/20 dark:bg-black/40 z-[-1] animate-fade-in-fast" />
            )}
            {/* 90% Scale Padding: py-2 sm:py-3 */}
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

                    {/* Logo Scaling: h-4/5 (Laptop) -> h-6 (2XL) */}
                    <img src="/Origin-BI-Logo-01.png" alt="OriginBI Logo" className="h-5 lg:h-5.5 2xl:h-6 w-auto dark:hidden" />
                    <img src="/Origin-BI-white-logo.png" alt="OriginBI Logo" className="h-5 lg:h-5.5 2xl:h-6 w-auto hidden dark:block" />

                    {!hideNav && (
                        <nav className="hidden md:flex items-center space-x-1 lg:space-x-1 2xl:space-x-1.5 ml-1.5 lg:ml-1.5 2xl:ml-3">
                            {renderNavItems(false)}
                        </nav>
                    )}
                </div>

                <div className="flex items-center gap-1 sm:gap-2 lg:gap-1.5 2xl:gap-1.5">
                    <div className="hidden sm:block">
                        {/* Theme Toggle Scaled Down */}
                        <div className="scale-90 lg:scale-100 2xl:scale-100 origin-right">
                            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                        </div>
                    </div>


                    {/* 2. Language: h-7 (Laptop) / h-8 (2XL) */}
                    <div className="relative hidden sm:block" ref={langMenuRef}>
                        <button
                            onClick={() => setLangOpen((p) => !p)}
                            className="bg-white border border-brand-green text-[#19211C] hover:bg-green-50 dark:bg-brand-dark-tertiary dark:border-transparent dark:text-white dark:hover:bg-gray-800 flex items-center justify-center space-x-1 px-2 h-8 2xl:h-8 rounded-full font-semibold text-xs 2xl:text-[12px] transition-all cursor-pointer"
                        >
                            <span>{language}</span>
                            <ChevronDownIcon className="w-2.5 h-2.5" />
                        </button>
                        {isLangOpen && (
                            <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-brand-dark-tertiary rounded-lg shadow-xl py-1 ring-1 ring-black ring-opacity-5 z-50 border border-gray-100 dark:border-transparent">
                                <button onClick={() => handleLangChange("ENG")} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-brand-text-primary hover:bg-gray-50 dark:hover:bg-brand-dark-secondary/60">English</button>
                                <button onClick={() => handleLangChange("TAM")} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-brand-text-primary hover:bg-gray-50 dark:hover:bg-brand-dark-secondary/60">Tamil</button>
                            </div>
                        )}
                    </div>

                    {/* 3. Notification: h-8 w-8 (Laptop) / h-9 w-9 (2XL) */}
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
                            <div className="absolute right-0 top-full mt-6 w-[340px] sm:w-[480px] md:w-[540px] glass-card p-0 z-50 border border-gray-100 dark:border-white/10 animate-slide-down overflow-hidden text-gray-900 dark:text-white cursor-default">
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
                                                "Assessment",
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


                    <div className="w-px h-6 lg:h-6 2xl:h-7 bg-gray-300 dark:bg-brand-dark-tertiary hidden lg:block mx-1 2xl:mx-2"></div>

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
                                    className="w-9 h-9 2xl:w-10 2xl:h-10 rounded-full border border-brand-light-tertiary dark:border-white/10"
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
                                        <p className="font-semibold text-sm 2xl:text-sm leading-tight text-[#19211C] dark:text-brand-text-primary">
                                            {user.name || 'Student'}
                                        </p>
                                        <p className="text-xs 2xl:text-[12px] text-[#19211C] dark:text-brand-text-secondary leading-tight">
                                            {user.email || ''}
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
                            <div className="absolute right-0 top-full mt-2 w-72 bg-brand-light-secondary dark:bg-brand-dark-secondary rounded-xl shadow-2xl z-50 border border-brand-light-tertiary dark:border-brand-dark-tertiary/50 overflow-hidden">
                                <div className="px-4 py-3 border-b border-brand-light-tertiary dark:border-brand-dark-tertiary">
                                    <p className="text-sm font-semibold text-[#19211C] dark:text-brand-text-primary truncate">
                                        {user?.name || 'Student'}
                                    </p>
                                    <p className="text-xs text-[#19211C]/60 dark:text-brand-text-secondary truncate mt-0.5">
                                        {user?.email || ''}
                                    </p>
                                </div>

                                {/* AI Counsellor — Buy or Access */}
                                <div className="px-3 py-2 border-b border-brand-light-tertiary dark:border-brand-dark-tertiary">
                                    {counsellorAccess ? (
                                        <button
                                            onClick={() => { setProfileOpen(false); handleCounsellorClick(); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-200 dark:border-emerald-500/20 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-500/15 dark:hover:to-teal-500/15 transition-all cursor-pointer group"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-green to-emerald-500 flex items-center justify-center flex-shrink-0">
                                                <Brain className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="text-left flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 leading-tight">AI Counsellor</p>
                                                <p className="text-[10px] text-emerald-500/70 dark:text-emerald-400/60 leading-tight mt-0.5">
                                                    {counsellorDays !== null ? `${counsellorDays} days remaining` : 'Active — Open counsellor'}
                                                </p>
                                            </div>
                                            <ChevronDownIcon className="w-3 h-3 -rotate-90 text-emerald-400 dark:text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleCounsellorPurchase}
                                            disabled={counsellorPurchasing}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-500/10 dark:to-purple-500/10 border border-violet-200 dark:border-violet-500/20 hover:from-violet-100 hover:to-purple-100 dark:hover:from-violet-500/20 dark:hover:to-purple-500/20 transition-all cursor-pointer group disabled:opacity-60"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                                {counsellorPurchasing ? (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Brain className="w-4 h-4 text-white" />
                                                )}
                                            </div>
                                            <div className="text-left flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 leading-tight">
                                                    {counsellorPurchasing ? 'Processing...' : 'AI Counsellor — ₹350'}
                                                </p>
                                                <p className="text-[10px] text-violet-500/70 dark:text-violet-400/60 leading-tight mt-0.5">90-day personalised career guidance</p>
                                            </div>
                                        </button>
                                    )}
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