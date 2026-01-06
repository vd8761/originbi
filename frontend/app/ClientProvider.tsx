'use client';

import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { configureAmplify } from '@/lib/aws-amplify-config';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Initialize Amplify once
configureAmplify();

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </ThemeProvider>
  );
}
