import React from "react";
import Header from "@/components/student/Header";

interface AssessmentLayoutProps {
  onLogout: () => void;
  children: React.ReactNode;
  hideNav?: boolean;
  showAssessmentOnly?: boolean;
}

const AssessmentLayout: React.FC<AssessmentLayoutProps> = ({ onLogout, children, hideNav, showAssessmentOnly }) => {
  return (
    <div className="bg-brand-light-primary dark:bg-brand-dark-primary h-screen w-screen overflow-hidden flex flex-col">
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
        <div className="flex-1 w-full h-full overflow-y-auto px-2 sm:px-4 lg:px-6 flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AssessmentLayout;