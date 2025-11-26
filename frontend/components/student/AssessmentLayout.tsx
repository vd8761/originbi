import React from "react";
import Header from "@/components/student/Header";

interface AssessmentLayoutProps {
  onLogout: () => void;
  children: React.ReactNode;
  hideNav?: boolean;
}

const AssessmentLayout: React.FC<AssessmentLayoutProps> = ({ onLogout, children, hideNav }) => {
  return (
    <div className="bg-brand-light-primary dark:bg-brand-dark-primary min-h-screen flex flex-col">
      <Header 
        onLogout={onLogout} 
        currentView="assessment" 
        hideNav={hideNav} 
      />
      <main className="flex-1 p-4 sm:p-6 flex flex-col">
        {children}
      </main>
    </div>
  );
};

export default AssessmentLayout;