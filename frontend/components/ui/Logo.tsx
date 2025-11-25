'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const Logo: React.FC = () => {
  const { theme } = useTheme();

  const logoSrc = theme === 'dark'
    ? '/Origin-BI-white-logo.png'
    : '/Origin-BI-Logo-01.png';

  return (
    <img
      src={logoSrc}
      alt="OriginBI Logo"
      className="h-9 select-none"
      draggable={false}
    />
  );
};

export default Logo;