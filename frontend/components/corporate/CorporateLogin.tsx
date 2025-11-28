import React from "react";
import Logo from "@/components/ui/Logo";
import LoginForm from "@/components/corporate/LoginForm";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";
import { QuoteIcon } from "@/components/icons";

interface CorporateLoginProps {
  onLoginSuccess: () => void;
  onBack: () => void;
  portalMode?: string;
}

const CorporateLogin: React.FC<CorporateLoginProps> = ({
  onLoginSuccess,
  onBack,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    // Main Container: Uses h-[100dvh] to ensure it fits exactly on mobile viewports without browser bar interference
    <div className="flex h-[100dvh] w-full bg-brand-light-primary dark:bg-brand-dark-primary font-sans transition-colors duration-300 overflow-hidden">
      {/* 
        -------------------------------------------
        LEFT PANEL - Brand Showcase 
        (Visible on Large Screens lg+)
        -------------------------------------------
      */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[55%] relative flex-col justify-between p-12 text-white bg-[#022c22]">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
            alt="Corporate Architecture"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#022c22] via-[#064e3b]/80 to-[#022c22]/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/40" />
        </div>

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="max-w-2xl mt-6">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4 tracking-tight">
              Transform Your Workforce With{" "}
              <span className="text-brand-green">Intelligent Insights.</span>
            </h1>
            <p className="text-lg text-green-100/90 leading-relaxed font-light border-l-2 border-brand-green pl-6">
              Access comprehensive analytics, manage recruitment pipelines, and
              unlock the potential of your organization.
            </p>
          </div>

          {/* Testimonial */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl max-w-xl">
            <div className="flex gap-4 items-start">
              <QuoteIcon className="w-6 h-6 text-brand-green shrink-0" />
              <div>
                <p className="text-base font-medium italic text-white/90 font-normal mb-3 leading-relaxed">
                  "OriginBI has completely revolutionized our hiring process.
                  We're finding better candidates faster."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center font-semibold text-brand-text-primary text-xs">
                    ER
                  </div>
                  <div>
                    <div className="font-semibold text-brand-text-primary text-sm">
                      Elena Rodriguez
                    </div>
                    <div className="text-[10px] text-green-200 uppercase tracking-wider">
                      VP of People, TechFlow
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Footer: Fixed Height - Always visible */}
          <p className="text-center text-xs text-brand-text-light-secondary dark:text-brand-text-secondary">
            &copy; 2025 Origin BI. All rights reserved.{" "}
            <span className="hidden sm:inline">
              <span className="mx-1 opacity-50">|</span>{" "}
              <button
                onClick={() => {
                  onBack?.();
                  // simple client-side redirect
                  window.location.href = "/home";
                }}
                className="hover:text-brand-green dark:hover:text-brand-green transition-colors"
              >
                Back to Portal
              </button>{" "}
              <span className="mx-1 opacity-50">|</span>{" "}
              <a
                href="#"
                className="hover:text-brand-green dark:hover:text-brand-green transition-colors"
              >
                Privacy
              </a>{" "}
              <span className="mx-1 opacity-50">|</span>{" "}
              <a
                href="#"
                className="hover:text-brand-green dark:hover:text-brand-green transition-colors"
              >
                Help
              </a>
            </span>
          </p>
          
        </div>
      </div>

      {/* 
        -------------------------------------------
        RIGHT PANEL - Login Form
        Structure: Header (Fixed) -> Main (Flex-1) -> Footer (Fixed)
        This ensures the footer stays at bottom and form stays centered without scrolling on most screens.
        -------------------------------------------
      */}
      <div className="w-full lg:w-[45%] xl:w-[45%] flex flex-col h-full relative bg-brand-light-primary dark:bg-brand-dark-primary transition-colors duration-300">
        {/* 1. Header: Fixed Height - Always visible */}
        <div className="w-full flex justify-between items-center px-8 py-6 flex-shrink-0 z-20">
          <Logo />
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>

        {/* 2. Main Content: Flex-1 fills available space */}
        <div className="flex-1 flex flex-col justify-center items-center w-full px-8 overflow-y-auto scrollbar-hide">
          <div className="w-full max-w-md space-y-6">
            {/* Title Section */}
            <div className="space-y-1 text-center lg:text-left">
              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-brand-text-light-primary dark:text-white">
                Corporate Login
              </h2>
              <p className="text-brand-text-light-secondary dark:text-brand-text-secondary text-sm">
                Enter your credentials to access the admin portal.
              </p>
            </div>

            {/* Login Form Component */}
            <LoginForm onLoginSuccess={onLoginSuccess} portalMode="corporate" />

            {/* Registration Link */}
            <div className="border-brand-light-tertiary dark:border-brand-dark-tertiary  text-center">
              <p className="text-center text-sm text-brand-text-light-secondary dark:text-brand-text-secondary">
                Join Us?{" "}
                <a
                  href="#"
                  className="text-brand-green font-medium hover:text-brand-green/80 transition-colors"
                >
                  Register your organization
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporateLogin;
