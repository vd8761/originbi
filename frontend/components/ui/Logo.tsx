'use client';

import React from 'react';
const Logo: React.FC = () => {
  return (
    <>
      {/* Light Theme Logo (Hidden in Dark Mode) */}
      <img
        src="/Origin-BI-Logo-01.png"
        alt="OriginBI Logo"
        className="h-9 select-none dark:hidden block"
        draggable={false}
      />
      {/* Dark Theme Logo (Visible in Dark Mode) */}
      <img
        src="/Origin-BI-white-logo.png"
        alt="OriginBI Logo"
        className="h-9 select-none hidden dark:block"
        draggable={false}
      />
    </>
  );
};

export default Logo;