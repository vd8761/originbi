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
    <div className="w-full bg-brand-light-primary dark:bg-brand-dark-primary h-[100dvh] grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
      {/* Left Column: Grid Layout [Header, Content, Footer] */}
      <div className="order-1 flex flex-col justify-between gap-[clamp(24px,2vw,40px)] p-[clamp(16px,1.5vw,32px)] relative overflow-y-auto lg:overflow-hidden h-full">
        {/* Background Gradients (Subtle) */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-green/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
        {/* Row 1: Header (Aligned with Form) */}
        <header className="w-full max-w-[480px] xl:max-w-[540px] self-center flex items-center justify-between z-10 shrink-0 mb-8 lg:mb-0">
          <div className="w-[clamp(120px,12vw,160px)]">
            <Logo className="w-full h-auto object-contain" />
          </div>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </header>

        {/* Row 2: Main Content (Mobile: Top Adjusted / Desktop: Centered) */}
        <div className="w-full max-w-[480px] xl:max-w-[540px] self-center flex flex-col justify-center mt-[clamp(24px,2vw,40px)] lg:mt-0 lg:my-auto">

          <div className="text-left w-full mb-[clamp(24px,2.5vw,48px)]">
            <h1 className="font-sans font-semibold text-brand-text-light-primary dark:text-brand-text-primary tracking-[0%] leading-none mb-2 text-[clamp(24px,2.5vw,48px)]">
              Login to your account
            </h1>
            <p className="font-sans font-normal text-brand-text-light-secondary dark:text-brand-text-white text-[clamp(14px,1.05vw,20px)] leading-none tracking-[0px]">
              Discover, connect, and grow with OriginBI
            </p>
            {/* Divider Line */}
            <div className="w-full h-px bg-brand-light-tertiary dark:bg-white/10 mt-[clamp(24px,2.08vw,40px)]" />
          </div>

          <LoginForm onLoginSuccess={onLoginSuccess} />
        </div>

        <footer className="w-full max-w-[480px] xl:max-w-[540px] self-center flex flex-col-reverse sm:flex-row items-center justify-between text-[clamp(12px,0.73vw,14px)] font-medium leading-none tracking-[0px] text-brand-green gap-4 mt-auto lg:mt-0 shrink-0">
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-brand-green/80 transition-colors text-right underline decoration-solid decoration-0 underline-offset-2">Privacy Policy</a>
            <span className="border-r border-brand-light-tertiary dark:border-white/20 h-3 hidden sm:block"></span>
            <a href="#" className="hover:text-brand-green/80 transition-colors text-right underline decoration-solid decoration-0 underline-offset-2">Terms & Conditions</a>
          </div>
          <span className="opacity-100 text-brand-text-light-secondary dark:text-white">&copy; OriginBI 2025</span>
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
