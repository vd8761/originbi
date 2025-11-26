'use client';

import React from 'react';
import Logo from '@/components/ui/Logo';
import LoginForm from '@/components/student/LoginForm';
import Testimonial from '@/components/student/Testimonial';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="w-full bg-brand-light-primary dark:bg-brand-dark-primary grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      <div className="order-2 lg:order-1 flex flex-col justify-between p-6 sm:p-8 md:p-12">
        <header className="w-full">
          <nav className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-4">
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </div>
          </nav>
        </header>

        <div className="w-full max-w-2xl mx-auto flex-grow flex flex-col justify-center py-8">
          <div className="text-left mb-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-brand-text-light-primary dark:text-brand-text-primary tracking-tight leading-tight">
              Login to your account
            </h1>
            <p className="mt-4 text-lg md:text-xl text-brand-text-light-secondary dark:text-brand-text-secondary">
              Discover, connect, and grow with OriginBI
            </p>
          </div>
          <LoginForm onLoginSuccess={onLoginSuccess} />
        </div>

        <footer className="w-full text-sm">
          <div className="flex flex-col sm:flex-row justify-between items-center text-brand-text-light-secondary dark:text-brand-text-secondary gap-4">
            <div>
              <a
                href="#"
                className="hover:text-brand-green dark:hover:text-brand-green transition-colors pr-4 border-r border-brand-light-tertiary dark:border-brand-dark-tertiary"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="hover:text-brand-green dark:hover:text-brand-green transition-colors pl-4"
              >
                Terms & Conditions
              </a>
            </div>
            <span>&copy; OriginBI 2025</span>
          </div>
        </footer>
      </div>

      <div className="order-1 lg:order-2 flex items-center justify-center p-4 sm:p-6 md:p-8 min-h-[400px] lg:min-h-0">
        <Testimonial />
      </div>
    </div>
  );
};

export default Login;
