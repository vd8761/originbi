import React from "react";
import Header from "./Header";

interface AssessmentLayoutProps {
  onLogout: () => void;
  children: React.ReactNode;
  hideNav?: boolean;
  showAssessmentOnly?: boolean;
}

import { LanguageProvider } from "../../contexts/LanguageContext";

const AssessmentLayout: React.FC<AssessmentLayoutProps> = ({ onLogout, children, hideNav, showAssessmentOnly }) => {
  return (
    <div className="bg-brand-light-primary dark:bg-brand-dark-primary h-screen w-screen overflow-hidden flex flex-col relative">
      {/* Green Glow Effect - Dark Mode Only - Bottom Full Width - Large Ambient */}
      <div
        className="hidden dark:block absolute bottom-0 left-0 right-0 h-[65vh] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 130% 100% at 50% 100%, rgba(30, 211, 106, 0.22) 0%, rgba(30, 211, 106, 0.15) 30%, rgba(30, 211, 106, 0.08) 55%, rgba(30, 211, 106, 0.01) 80%, transparent 100%)',
          filter: 'blur(60px)',
        }}
      />





      <Header
        onLogout={onLogout}
        currentView="assessment"
        hideNav={hideNav}
        showAssessmentOnly={showAssessmentOnly}
      />
      {/* 
          Main Content Area:
          - pt-[72px] to clear Fixed Header
          - h-full to take remaining space
          - overflow-hidden to prevent body scroll (scrolling handled inside if needed)
        */}
      <main className="flex-1 flex flex-col pt-[50px] lg:pt-[70px] h-full overflow-hidden relative">
        <div className="flex-1 w-full h-full overflow-y-auto flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AssessmentLayout;