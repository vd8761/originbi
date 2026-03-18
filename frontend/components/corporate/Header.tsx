"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import ThemeToggle from "../ui/ThemeToggle";
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
  UsersIcon,
  HistoryIcon,
  CheckCircleIcon,
  CompletedStepIcon,
  CandidateIcon,
  MarkAllReadIcon,
  NoNotificationsIcon,
} from "../icons";
import { corporateDashboardService } from "../../lib/services";
import { CorporateAccount } from "../../lib/types";
import { capitalizeWords, formatRelativeTime } from "../../lib/utils";
import { useNotifications } from "../../lib/hooks/useNotifications";
import Script from "next/script";
import BuyCreditsModal from "./BuyCreditsModal";

import { useTheme } from "../../contexts/ThemeContext";

interface HeaderProps {
  onLogout: () => void;
  currentView?:
  | "dashboard"
  | "assessment"
  | "registrations"
  | "jobs"
  | "origindata"
  | "settings";
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
  const spacingClass = isMobile ? "gap-3" : "justify-center gap-2";

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        // SCALING:
        // LG/XL: Ultra-Compact Mode (h-8, px-2.5) to fit 5 items on laptop
        // 2XL: Robust Mode (h-10, px-6) for large screens
        className={`flex items-center ${spacingClass} rounded-full transition-all duration-200 w-full ${isMobile ? "py-3.5" : "lg:h-10 2xl:h-10"} cursor-pointer ${active
          ? `bg-brand-green text-white border border-transparent shadow-none ${isMobile ? "px-4" : "px-2.5 2xl:px-3"}`
          : `bg-white border border-gray-200 text-[#19211C] hover:bg-gray-50 hover:text-black hover:border-gray-300 dark:bg-transparent dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5 dark:hover:text-white ${isMobile ? "px-4" : "px-2.5 2xl:px-3"}`
          }`}
      >
        <div
          className={`${active ? "text-white" : "text-brand-green dark:text-white"}`}
        >
          {icon}
        </div>
        <span
          // TEXT SCALING: text-[10.5px] on Laptop, text-[11.5px] on 2XL
          className={`font-medium ${isMobile ? "text-sm" : "text-[10.5px] 2xl:text-[11.5px]"} whitespace-nowrap ${isMobile ? "inline" : showDesktopText
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
  type: string;
  time?: string;
  isNew?: boolean;
  onClick?: () => void;
}> = ({ icon, title, message, type, time, isNew, onClick }) => {
  const isWarning = type === "EXAM_EXPIRATION" || type === "LOW_CREDITS";
  const colorClass = "text-brand-green";

  return (
    <div
      onClick={onClick}
      className="flex items-start justify-between p-3 px-1.5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors duration-200 cursor-pointer border-b border-gray-100 dark:border-white/5 last:border-0"
    >
      <div className="flex items-start space-x-3 min-w-0 pr-4 w-full">
        {icon && (
          <div
            className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 ${colorClass}`}
          >
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
          <div
            className="w-2 h-2 bg-brand-green shadow-[0_0_8px_rgba(30,211,106,0.6)] rounded-full"
          ></div>
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
};

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
  const [activeTab, setActiveTab] = useState("All");
  const [language, setLanguage] = useState("ENG");
  const {
    unreadCount,
    notifications: realNotifications,
    fetchNotifications,
    markAllAsRead,
    markAsRead,
  } = useNotifications();

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const notificationsMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [corporateData, setCorporateData] = useState<any>(null);
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);

  const handleBuyCredits = async (amount: number, cost: number) => {
    if (!corporateData || !corporateData.email) return;

    try {
      const order = await corporateDashboardService.createOrder(
        corporateData.email,
        amount,
        "Top-up via Header",
      );

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "Origin BI",
        description: "Credit Purchase",
        order_id: order.orderId,
        handler: async function (response: any) {
          try {
            await corporateDashboardService.verifyPayment(corporateData.email, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Update local state
            setCorporateData((prev: any) => ({
              ...prev,
              available_credits: (
                parseFloat(prev.available_credits) + amount
              ).toString(),
            }));

            setIsBuyCreditsOpen(false);
            alert("Payment successful! Credits added.");
          } catch (e) {
            console.error("Verification failed", e);
            alert("Payment verification failed.");
          }
        },
        prefill: {
          email: corporateData.email,
          name: corporateData.full_name,
        },
        theme: { color: "#1ED36A" },
      };

      if (!(window as any).Razorpay) {
        alert("Razorpay SDK not loaded. Please try again in a moment.");
        return;
      }
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", async function (response: any) {
        await corporateDashboardService.recordPaymentFailure(
          order.orderId,
          response.error.description,
        );
        alert(`Payment Failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (e) {
      console.error("Order failed", e);
      alert("Failed to initiate payment");
    }
  };

  useEffect(() => {
    if (portalMode === "corporate") {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setCorporateData({
            full_name: parsed.name,
            email: parsed.email,
            ...parsed,
          });
        }
      } catch (e) {
        /* empty */
      }

      import("../../lib/services").then(({ corporateDashboardService }) => {
        const email =
          sessionStorage.getItem("userEmail") ||
          localStorage.getItem("userEmail");
        let queryEmail = email;
        if (!queryEmail) {
          const u = localStorage.getItem("user");
          if (u) queryEmail = JSON.parse(u).email;
        }

        if (queryEmail) {
          corporateDashboardService
            .getProfile(queryEmail)
            .then((data) => {
              setCorporateData((prev: any) => ({ ...prev, ...data }));
            })
            .catch((err) => console.error("Failed to fetch header data", err));
        }
      });
    }
  }, [portalMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
      if (
        langMenuRef.current &&
        !langMenuRef.current.contains(event.target as Node)
      ) {
        setLangOpen(false);
      }
      if (
        notificationsMenuRef.current &&
        !notificationsMenuRef.current.contains(event.target as Node)
      ) {
        if (isNotificationsOpen) {
          if (unreadCount > 0) markAllAsRead();
          setNotificationsOpen(false);
          setActiveTab("All");
        }
      }
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        const target = event.target as Element;
        if (!target.closest("#mobile-menu-btn")) {
          setMobileMenuOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen, isNotificationsOpen, unreadCount, markAllAsRead]);

  const pathname = usePathname();
  const activeView = (() => {
    // Corporate "Smart" Active View Logic
    if (pathname.includes("/dashboard")) return "dashboard";
    if (pathname.includes("/registrations")) return "registrations";
    if (pathname.includes("/jobs")) return "jobs";
    if (pathname.includes("/candidates")) return "candidates";
    if (pathname.includes("/counselling")) return "counselling";
    if (pathname.includes("/origindata")) return "origindata";
    if (pathname.includes("/settings")) return "settings";
    return currentView;
  })();

  const handleLangChange = (lang: string) => {
    setLanguage(lang);
    setLangOpen(false);
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
  const handleNavClick = (view: any) => {
    onNavigate?.(view);
    setMobileMenuOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    const iconClass = "w-4 h-4 text-brand-green";
    switch (type) {
      case "STUDENT_REFERRAL_REGISTRATION":
      case "STUDENT_DIRECT_REGISTRATION":
        return <ProfileIcon className={iconClass} />;
      case "NEW_CORPORATE_SIGNUP":
        return <UsersIcon className={iconClass} />;
      case "LOW_CREDITS":
      case "CREDITS_ADDED":
        return <CoinIcon className={iconClass} />;
      case "EXAM_EXPIRATION":
        return <NotificationIcon className={`${iconClass} font-bold`} />;
      case "EMPLOYEE_TEST_COMPLETED":
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
          if (activeTab === "Credits")
            return (
              typeStr.includes("CREDIT") ||
              typeStr.includes("COIN")
            );
          if (activeTab === "Assessment")
            return (
              typeStr.includes("TEST") ||
              typeStr.includes("EXAM") ||
              typeStr.includes("ASSESSMENT")
            );

          return true;
        }

        return false;
      })
      : [];

  const displayNotifications = filteredNotificationsByType.map((n) => ({
    id: n.id,
    icon: getNotificationIcon(n.type),
    title:
      n.title ||
      capitalizeWords((n.type || "").toLowerCase().replace(/_/g, " ")),
    message: n.message,
    type: n.type,
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

    const groups = displayNotifications.reduce((acc, n) => {
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
      {} as Record<string, typeof displayNotifications>
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
      {portalMode === "admin" ? (
        <>
          <NavItem
            icon={<DashboardIcon />}
            label="Admin Dashboard"
            active={currentView === "dashboard"}
            isMobile={isMobile}
            onClick={() => handleNavClick("dashboard")}
          />
          <NavItem
            icon={<ProfileIcon />}
            label="User Management"
            isMobile={isMobile}
          />
          <NavItem
            icon={<SettingsIcon />}
            label="System Config"
            isMobile={isMobile}
          />
        </>
      ) : portalMode === "corporate" ? (
        <>
          <NavItem
            icon={<DashboardIcon className="w-4 h-4" />}
            label="Dashboard"
            active={activeView === "dashboard"}
            isMobile={isMobile}
            onClick={() => handleNavClick("dashboard")}
          />
          <NavItem
            icon={<MyEmployeesIcon className="w-4 h-4" />}
            label="My Employees"
            active={activeView === "registrations"}
            isMobile={isMobile}
            onClick={() => handleNavClick("registrations")}
          />
          <NavItem
            icon={<JobsIcon className="w-4 h-4" />}
            label="Jobs"
            active={activeView === "jobs"}
            isMobile={isMobile}
            onClick={() => handleNavClick("jobs")}
          />
          <NavItem
            icon={<CandidateIcon className="w-4 h-4" />}
            label="Candidates"
            active={activeView === "candidates"}
            isMobile={isMobile}
            onClick={() => handleNavClick("candidates")}
          />
          <NavItem
            icon={<OriginDataIcon className="w-4 h-4" />}
            label="Origin Data"
            active={activeView === "origindata"}
            isMobile={isMobile}
            onClick={() => handleNavClick("origindata")}
          />
          <NavItem
            icon={<SettingsIcon className="w-4 h-4" />}
            label="Settings"
            active={activeView === "settings"}
            isMobile={isMobile}
            onClick={() => handleNavClick("settings")}
          />
        </>
      ) : (
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
          <NavItem
            icon={<RoadmapIcon />}
            label="Road Map"
            isMobile={isMobile}
          />
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
    <header className={`fixed top-0 left-0 right-0 w-full z-50 transition-all ${isNotificationsOpen ? "duration-150" : "duration-300"} bg-transparent dark:bg-[#19211C]/40 ${isNotificationsOpen ? "" : "backdrop-blur-xl dark:backdrop-blur-[200px]"} border-b border-[#E0E0E0] dark:border-white/[0.08] shadow-none`}>
      <Script
        id="razorpay-checkout-js-header"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      {isNotificationsOpen && (
        <div className="absolute top-full left-0 w-full h-[100vh] bg-black/20 dark:bg-black/40 z-[-1] animate-fade-in-fast" />
      )}
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

          {/* Logo Scaling: h-5 (Laptop) -> h-6 (2XL) */}
          <img
            src="/Origin-BI-Logo-01.png"
            alt="OriginBI Logo"
            className="h-5 lg:h-5.5 2xl:h-6 w-auto dark:hidden"
          />
          <img
            src="/Origin-BI-white-logo.png"
            alt="OriginBI Logo"
            className="h-5 lg:h-5.5 2xl:h-6 w-auto hidden dark:block"
          />

          {!hideNav && (
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-1 2xl:space-x-1.5 ml-1.5 lg:ml-1.5 2xl:ml-3">
              {renderNavItems(false)}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1 lg:gap-1.5 2xl:gap-1.5">
          <div className="hidden sm:block">
            {/* Theme Toggle: Scale to h-8 (Laptop) / h-9 (2XL) */}
            <div className="scale-90 lg:scale-100 2xl:scale-100 origin-right">
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </div>
          </div>

          {!hideNav && (
            <>
              {/* 2. Language: h-8 (Laptop) / h-9 (2XL) */}
              <div className="relative hidden sm:block" ref={langMenuRef}>
                {portalMode === "corporate" && !corporateData ? (
                  <div className="h-8 2xl:h-9 w-[4.5rem] bg-gray-200 dark:bg-gray-700/50 rounded-full animate-pulse border border-transparent" />
                ) : (
                  <>
                    <button
                      onClick={() => setLangOpen((p) => !p)}
                      className="bg-white border border-brand-green text-[#19211C] hover:bg-green-50 dark:bg-brand-dark-tertiary dark:border-transparent dark:text-white dark:hover:bg-gray-800 flex items-center justify-center space-x-1 px-2 h-8 2xl:h-8 rounded-full font-semibold text-xs 2xl:text-[12px] transition-all cursor-pointer"
                    >
                      <span>{language}</span>
                      <ChevronDownIcon className="w-3 h-3" />
                    </button>
                    {isLangOpen && (
                      <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-brand-dark-tertiary rounded-lg shadow-xl py-1 ring-1 ring-black ring-opacity-5 z-50 border border-gray-100 dark:border-transparent">
                        <button
                          onClick={() => handleLangChange("ENG")}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-brand-text-primary hover:bg-gray-50 dark:hover:bg-brand-dark-secondary/60"
                        >
                          English
                        </button>
                        <button
                          onClick={() => handleLangChange("TAM")}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-brand-text-primary hover:bg-gray-50 dark:hover:bg-brand-dark-secondary/60"
                        >
                          Tamil
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 3. Notification: h-8 w-8 (Laptop) / h-9 w-9 (2XL) */}
              <div className="relative" ref={notificationsMenuRef}>
                <button
                  onClick={handleNotificationClick}
                  className={`w-8 h-8 2xl:w-8 2xl:h-8 rounded-full flex items-center justify-center transition-all relative cursor-pointer ${isNotificationsOpen
                    ? "bg-[#1ED36A] text-white border-transparent"
                    : "bg-white border border-gray-200 text-[#150089] hover:bg-gray-50 hover:border-gray-300 dark:bg-brand-dark-tertiary dark:border-transparent dark:text-white dark:hover:bg-gray-800"
                    }`}
                >
                  <NotificationIcon className="w-[15px] h-[15px] 2xl:w-[19px] 2xl:h-[19px] fill-current" />
                  {unreadCount > 0 && (
                    <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center ${isNotificationsOpen ? "bg-white text-[#1ED36A] border-transparent" : "bg-brand-green text-white border-white dark:border-brand-dark-secondary"} border-2 text-[10px] font-bold rounded-full px-1`}>
                      {unreadCount > 9 ? "9+" : unreadCount}
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
                            "Credits",
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

              {/* 4. Credits Display: h-8 (Laptop) / h-9 (2XL) */}
              {portalMode === "corporate" && (
                <>
                  <div className="relative group hidden md:block">
                    <div
                      className="flex items-center gap-1.5 px-2 py-0 rounded-full border h-8 2xl:h-8 cursor-pointer"
                      style={{
                        backgroundColor: "rgba(252, 210, 39, 0.4)",
                        borderColor: "#F59E0B",
                      }}
                    >
                      <CoinIcon className="w-3.5 h-3.5 2xl:w-4 2xl:h-4" />
                      <span className="font-bold text-brand-yellow text-[11px] 2xl:text-xs min-w-[20px] text-center">
                        {corporateData ? (
                          corporateData.available_credits
                        ) : (
                          <div className="h-2.5 w-6 bg-yellow-600/20 dark:bg-yellow-400/20 rounded animate-pulse" />
                        )}
                      </span>
                    </div>

                    {/* Credits Hover Popover - Horizontal Layout */}
                    <div className="absolute top-[80%] left-1/2 -translate-x-1/2 pt-6 min-w-[340px] opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50">
                      {/* Card Content */}
                      <div className="relative bg-white dark:bg-[#19211C] rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-100 dark:border-white/5 p-5 flex items-center justify-between gap-6 text-left font-['Haskoy']">
                        {/* Triangle Arrow - Centered */}
                        <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-[#19211C] rotate-45 border-l border-t border-gray-100 dark:border-white/5 rounded-tl-[2px]"></div>

                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-[42px] text-[#150089] dark:text-white leading-none tracking-tight">
                            {corporateData?.available_credits
                              ? Math.floor(
                                Number(corporateData.available_credits) || 0,
                              )
                              : 0}
                          </span>

                          <div className="flex flex-col text-[13px] leading-[1.1] text-[#19211C] dark:text-gray-300 font-medium whitespace-nowrap opacity-90">
                            <span>Credits</span>
                            <span>available</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setIsBuyCreditsOpen(true)}
                          className="bg-[#1ED36A] hover:bg-[#16b058] text-white px-6 py-2.5 rounded-full font-semibold text-[13px] transition-all active:scale-[0.98] whitespace-nowrap"
                        >
                          Buy Credits
                        </button>
                      </div>
                    </div>
                  </div>

                  <BuyCreditsModal
                    isOpen={isBuyCreditsOpen}
                    onClose={() => setIsBuyCreditsOpen(false)}
                    currentBalance={
                      corporateData?.available_credits
                        ? Number(corporateData.available_credits) || 0
                        : 0
                    }
                    onBuy={handleBuyCredits}
                  />
                </>
              )}
            </>
          )}

          <div className="w-px h-6 lg:h-6 2xl:h-7 bg-gray-300 dark:bg-brand-dark-tertiary hidden lg:block mx-1 2xl:mx-2"></div>

          {/* User Profile Section */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-1.5 lg:gap-2 focus:outline-none text-left cursor-pointer"
            >
              {/* 5. Avatar: w-8 h-8 (Laptop) / w-9 h-9 (2XL) */}
              {portalMode === "corporate" && !corporateData ? (
                <div className="w-8 h-8 2xl:w-9 2xl:h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse border border-brand-light-tertiary dark:border-transparent flex-shrink-0"></div>
              ) : (
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(corporateData?.full_name || (portalMode === "corporate" ? "User" : "Student User"))}&background=150089&color=fff`}
                  alt="User Avatar"
                  className="w-9 h-9 2xl:w-9 2xl:h-9 rounded-full border border-brand-light-tertiary dark:border-transparent"
                />
              )}
              <div className="hidden xl:block">
                <p className="font-semibold text-sm 2xl:text-sm leading-tight text-[#19211C] dark:text-brand-text-primary">
                  {portalMode === "corporate" && !corporateData ? (
                    <span className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1 inline-block"></span>
                  ) : (
                    corporateData?.full_name ||
                    (portalMode === "corporate" ? "User" : "Student User")
                  )}
                </p>
                <p className="text-xs 2xl:text-[12px] text-[#19211C] dark:text-brand-text-secondary leading-tight">
                  {portalMode === "corporate" && !corporateData ? (
                    <span className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse inline-block"></span>
                  ) : (
                    corporateData?.email ||
                    (portalMode === "corporate" ? "" : "student@originbi.com")
                  )}
                </p>
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
                    onClick={() => {
                      onSwitchPortal?.();
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-brand-text-light-primary dark:text-white rounded-lg hover:bg-brand-light-tertiary dark:hover:bg-brand-dark-tertiary transition-colors"
                  >
                    {portalMode === "corporate" ? (
                      <ProfileIcon className="w-5 h-5 mr-3" />
                    ) : (
                      <SettingsIcon className="w-5 h-5 mr-3" />
                    )}
                    <span>
                      {portalMode === "corporate"
                        ? "View Profile"
                        : "Switch Portal"}
                    </span>
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

        {isMobileMenuOpen && !hideNav && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            ></div>

            {/* Menu Container */}
            <div
              id="mobile-menu"
              ref={mobileMenuRef}
              className="md:hidden absolute top-full left-0 w-full bg-brand-light-secondary dark:bg-[#19211C]/40 dark:backdrop-blur-[200px] shadow-none z-40 border-t border-brand-light-tertiary dark:border-white/[0.08] animate-fade-in max-h-[85vh] overflow-y-auto"
            >
              <nav className="flex flex-col p-4 space-y-2">
                {renderNavItems(true)}

                {/* Mobile Bottom Section */}
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
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${language === "ENG" ? "bg-brand-green text-white shadow-none" : "text-brand-text-light-secondary dark:text-brand-text-secondary"}`}
                      >
                        ENG
                      </button>
                      <button
                        onClick={() => setLanguage("TAM")}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${language === "TAM" ? "bg-brand-green text-white shadow-none" : "text-brand-text-light-secondary dark:text-brand-text-secondary"}`}
                      >
                        TAM
                      </button>
                    </div>
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

export default Header;
