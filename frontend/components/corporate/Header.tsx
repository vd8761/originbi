"use client";

import React, { useState, useRef, useEffect } from "react";
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
  currentView?: "dashboard" | "assessment" | "registrations" | "jobs" | "origindata" | "settings";
  portalMode?: "student" | "corporate" | "admin";
  onSwitchPortal?: () => void;
  onNavigate?: (view: "dashboard" | "assessment" | "registrations" | "jobs" | "origindata" | "settings") => void;
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
          ? "bg-brand-green text-white shadow-md px-2.5 2xl:px-4"
          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 dark:bg-[#2C3035] dark:border-transparent dark:text-gray-300 dark:hover:bg-[#3A3F45] dark:hover:text-white px-2.5 2xl:px-4"
          }`}
      >
        <div className={`${active ? "text-white" : "text-current"}`}>
          {icon}
        </div>
        <span
          // TEXT SCALING: text-[11px] on Laptop, text-xs on 2XL
          className={`font-medium text-[11px] 2xl:text-xs whitespace-nowrap ml-1.5 2xl:ml-2 ${isMobile ? "inline" : showDesktopText
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

  const handleLangChange = (lang: string) => { setLanguage(lang); setLangOpen(false); };
  const handleNotificationClick = () => { setNotificationsOpen((p) => !p); if (hasNotification) setHasNotification(false); };
  const handleNavClick = (view: "dashboard" | "assessment" | "registrations" | "jobs" | "origindata" | "settings") => { onNavigate?.(view); setMobileMenuOpen(false); };

  const notifications = [
    { icon: <RoadmapIcon className="w-4 h-4 text-brand-text-light-secondary dark:text-brand-text-secondary" />, title: "New Roadmap Unlocked!", time: "2 hours ago", isNew: true },
    { icon: <JobsIcon className="w-4 h-4 text-brand-text-light-secondary dark:text-brand-text-secondary" />, title: "3 new job matches for you", time: "Yesterday", isNew: true },
    { icon: <ProfileIcon className="w-4 h-4 text-brand-text-light-secondary dark:text-brand-text-secondary" />, title: "Your profile is 85% complete", time: "3 days ago", isNew: false },
  ];

  const renderNavItems = (isMobile: boolean) => (
    <>
      {portalMode === "admin" ? (
        <>
          <NavItem icon={<DashboardIcon />} label="Admin Dashboard" active={currentView === "dashboard"} isMobile={isMobile} onClick={() => handleNavClick("dashboard")} />
          <NavItem icon={<ProfileIcon />} label="User Management" isMobile={isMobile} />
          <NavItem icon={<SettingsIcon />} label="System Config" isMobile={isMobile} />
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
    <header className="bg-white dark:bg-brand-dark-secondary px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-50 border-b border-gray-200 dark:border-transparent shadow-sm dark:shadow-none">
      <div className="flex items-center gap-2 lg:gap-2 2xl:gap-4">
        {!hideNav && (
          <button
            id="mobile-menu-btn"
            className="md:hidden text-gray-700 dark:text-white p-1 cursor-pointer"
            onClick={() => setMobileMenuOpen((p) => !p)}
          >
            <MenuIcon className="w-6 h-6" />
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
              <button
                onClick={() => setLangOpen((p) => !p)}
                className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:bg-brand-dark-tertiary dark:border-transparent dark:text-white dark:hover:bg-gray-800 flex items-center justify-center space-x-1.5 px-3 h-8 2xl:h-9 rounded-full font-semibold text-[11px] 2xl:text-xs transition-all cursor-pointer"
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
            </div>

            {/* 3. Notification: h-8 w-8 (Laptop) / h-9 w-9 (2XL) */}
            <div className="relative" ref={notificationsMenuRef}>
              <button
                onClick={handleNotificationClick}
                className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:bg-brand-dark-tertiary dark:border-transparent dark:text-white dark:hover:bg-gray-800 w-8 h-8 2xl:w-9 2xl:h-9 rounded-full flex items-center justify-center transition-all relative cursor-pointer"
              >
                <NotificationIcon className="w-3.5 h-3.5 2xl:w-4 2xl:h-4" />
                {hasNotification && (
                  <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-brand-green rounded-full border border-white dark:border-brand-dark-secondary"></span>
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

            {/* 4. Credits Display: h-8 (Laptop) / h-9 (2XL) */}
            {portalMode === "corporate" && (
              <div
                className="hidden md:flex items-center gap-1.5 px-3 py-0 rounded-full border h-8 2xl:h-9"
                style={{
                  backgroundColor: "rgba(252, 210, 39, 0.4)",
                  borderColor: "#F59E0B",
                }}
              >
                <CoinIcon className="w-3.5 h-3.5 2xl:w-4 2xl:h-4" />
                <span className="font-bold text-brand-yellow text-[11px] 2xl:text-xs min-w-[20px] text-center">
                  {corporateData ? corporateData.available_credits : <span className="animate-pulse">...</span>}
                </span>
              </div>
            )}
          </>
        )}

        <div className="w-px h-6 lg:h-6 2xl:h-8 bg-gray-300 dark:bg-brand-dark-tertiary hidden lg:block mx-2 2xl:mx-3"></div>

        {/* User Profile Section */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 sm:space-x-3 focus:outline-none text-left cursor-pointer"
          >
            {/* 5. Avatar: w-8 h-8 (Laptop) / w-9 h-9 (2XL) */}
            {portalMode === 'corporate' && !corporateData ? (
              <div className="w-8 h-8 2xl:w-9 2xl:h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse border border-brand-light-tertiary dark:border-transparent flex-shrink-0"></div>
            ) : (
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(corporateData?.full_name || (portalMode === 'corporate' ? 'User' : 'Monishwar Rajasekaran'))}&background=random`}
                alt="User Avatar"
                className="w-8 h-8 2xl:w-9 2xl:h-9 rounded-full border border-brand-light-tertiary dark:border-transparent"
              />
            )}
            <div className="hidden xl:block">
              <p className="font-semibold text-[11px] 2xl:text-sm leading-tight text-brand-text-light-primary dark:text-brand-text-primary">
                {portalMode === 'corporate' && !corporateData ? (
                  <span className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1 inline-block"></span>
                ) : (
                  corporateData?.full_name || (portalMode === 'corporate' ? 'User' : 'Monishwar Rajasekaran')
                )}
              </p>
              <p className="text-[10px] 2xl:text-xs text-brand-text-light-secondary dark:text-brand-text-secondary leading-tight">
                {portalMode === 'corporate' && !corporateData ? (
                  <span className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse inline-block"></span>
                ) : (
                  corporateData?.email || (portalMode === 'corporate' ? '' : 'MonishwarRaja@originbi.com')
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
                  {portalMode === 'corporate' ? <ProfileIcon className="w-5 h-5 mr-3" /> : <SettingsIcon className="w-5 h-5 mr-3" />}
                  <span>{portalMode === 'corporate' ? 'View Profile' : 'Switch Portal'}</span>
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLangChange("ENG")}
                      className={`text-xs font-bold px-2 py-1 rounded transition-colors cursor-pointer ${language === "ENG" ? "bg-brand-green text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-brand-dark-tertiary"}`}
                    >
                      ENG
                    </button>
                    <button
                      onClick={() => handleLangChange("TAM")}
                      className={`text-xs font-bold px-2 py-1 rounded transition-colors cursor-pointer ${language === "TAM" ? "bg-brand-green text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-brand-dark-tertiary"}`}
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
