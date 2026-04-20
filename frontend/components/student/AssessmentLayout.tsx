import React from "react";

interface AssessmentLayoutProps {
  children: React.ReactNode;
}

const AssessmentLayout: React.FC<AssessmentLayoutProps> = ({
  children,
}) => {
  return (
    <div className="bg-transparent min-h-screen w-full relative">
      {/* 
          Main Content Area:
          - pt to clear the persistent student header
          - no nested fullscreen/hidden overflow so page scroll matches dashboard
        */}
      <main className="relative z-10 flex min-h-screen flex-col pt-[clamp(70px,7.6vh,100px)]">
        <div className="flex w-full flex-col">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AssessmentLayout;