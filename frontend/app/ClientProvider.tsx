'use client';

import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { configureAmplify } from '@/lib/aws-amplify-config';

// Initialize Amplify once
configureAmplify();

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
