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
  const { theme, toggleTheme, isInitialized } = useTheme();

  return (
    <div className="w-full bg-brand-light-primary dark:bg-brand-dark-primary min-h-[100dvh] grid grid-cols-1 lg:grid-cols-2 overflow-x-hidden">
      {/* Left Column: Grid Layout [Header, Content, Footer] */}
      <div className="order-1 grid grid-rows-[auto_1fr_auto] p-[clamp(1rem,2vw,2rem)] relative">
        {/* Row 1: Header */}
        <header className="w-full max-w-[480px] justify-self-center flex items-center justify-between z-10 h-16">
          <div className="w-[clamp(110px,15vw,150px)]">
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </div>
          </div>
        </header>

        {/* Row 2: Main Content (Centered) */}
        <div className="w-full max-w-[480px] justify-self-center self-center flex flex-col justify-center space-y-[clamp(1rem,2.5vw,2.5rem)]">
          <div className="text-left space-y-[clamp(0.5rem,0.8vw,0.75rem)]">
            <h1 className="font-semibold text-brand-text-light-primary dark:text-brand-text-primary tracking-tight leading-[1.1]"
              style={{ fontSize: 'clamp(2rem, 3.5vw, 3.25rem)' }}>
              Login to your account
            </h1>
            <p className="text-brand-text-light-secondary dark:text-brand-text-secondary"
              style={{ fontSize: 'clamp(0.95rem, 1.2vw, 1.25rem)' }}>
              Discover, connect, and grow with OriginBI
            </p>
          </div>
          <LoginForm onLoginSuccess={onLoginSuccess} />
        </div>

        {/* Row 3: Footer */}
        <footer className="w-full max-w-[480px] justify-self-center flex flex-col sm:flex-row items-center justify-between text-[clamp(0.7rem,1vw,0.875rem)] text-brand-text-light-secondary dark:text-brand-text-secondary gap-4">
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="hover:text-brand-green dark:hover:text-brand-green transition-colors border-r border-brand-light-tertiary dark:border-brand-dark-tertiary pr-4 leading-none"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="hover:text-brand-green dark:hover:text-brand-green transition-colors leading-none"
            >
              Terms & Conditions
            </a>
          </div>
          <span className="opacity-80">&copy; OriginBI 2025</span>
        </footer>
      </div>

      {/* Right Column: Testimonial/Hero Image */}
      <div className="order-2 hidden lg:flex h-full p-[clamp(1rem,1.5vw,2rem)] items-center justify-center">
        <div className="w-full h-full rounded-[clamp(1.5rem,2.5vw,2.5rem)] overflow-hidden relative shadow-2xl">
          <Testimonial />
        </div>
      </div>

      {/* Mobile visible Testimonial - ONLY if screen is tall enough, otherwise hidden to save space? 
         User wants "all element scalable". 
         On mobile, h-[100dvh] might be too small for Form + Testimonial.
         I will HIDE testimonial on mobile landscape or small screens to strictly ensure NO SCROLLING on the form view.
         Or I will make the grid allow scroll only if needed. But user said "scrolling enabled... [unwanted]".
         I will keep it hidden on mobile for now as per "Login" focus, or make it a background?
         Let's stick to hiding it on `lg:hidden` but maybe show it if `min-h` allows.
         Actually, I'll remove the mobile testimonial block to enforce the "No Scroll" strictness and clean "Login app" feel unless requested. 
         Wait, user screenshot shows mobile view (stacked).
         I'll put it back but with `overflow-y-auto` on the PARENT if it exceeds 100vh.
         But `h-[100dvh]` on root prevents that.
         I'll make the ROOT generic, and the columns handle height.
         Actually, to Fix Scroll, I need to ensure content fits. 
         I will remove mobile testimonial to prioritize the form scaling.
      */}
      <div className="order-2 lg:hidden hidden">
        {/* Hidden on mobile to prioritize perfect scale Form */}
      </div>
    </div>
  );
};

export default Login;
