import React, { useState, useEffect } from 'react';
import LoginForm from '@/components/admin/LoginForm';
import Logo from '@/components/ui/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { LockIcon } from '@/components/icons';
interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBack: () => void;
  portalMode?: string;
}

const SystemStatusWidget = () => {
  const [serverLoad, setServerLoad] = useState<number>(34);
  const [dbUptime, setDbUptime] = useState<number>(99.99);

  useEffect(() => {
    const interval = setInterval(() => {
      setServerLoad((prev: number) => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.min(Math.max(prev + delta, 25), 45); // Clamp between 25 and 45
      });
      setDbUptime((prev: number) => {
         const noise = (Math.random() - 0.5) * 0.001;
         return parseFloat((prev + noise).toFixed(4));
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0F172A]/60 backdrop-blur-xl border border-brand-green/20 p-6 rounded-2xl w-full max-w-[400px] shadow-2xl animate-fade-in relative z-20">
        <div className="flex justify-between items-center mb-5">
        <h3 className="text-white font-bold text-xs tracking-[0.15em] uppercase">System Status</h3>
        <div className="flex items-center gap-2 bg-brand-green/10 px-2 py-1 rounded border border-brand-green/20">
            <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
            </span>
            <span className="text-brand-green text-[10px] font-mono font-bold tracking-wide">OPERATIONAL</span>
        </div>
        </div>
        
        <div className="space-y-5">
        <div>
            <div className="flex justify-between text-[11px] font-medium text-gray-300 mb-2 font-mono">
            <span>Server Load</span>
            <span>{serverLoad}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div 
                className="h-full bg-gradient-to-r from-brand-green/60 to-brand-green rounded-full shadow-[0_0_10px_rgba(30,211,106,0.4)] transition-all duration-1000 ease-out" 
                style={{ width: `${serverLoad}%` }}
            />
            </div>
        </div>
        <div>
            <div className="flex justify-between text-[11px] font-medium text-gray-300 mb-2 font-mono">
            <span>Database Uptime</span>
            <span>{dbUptime}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-green/60 to-brand-green w-[99.9%] rounded-full shadow-[0_0_10px_rgba(30,211,106,0.4)]" />
            </div>
        </div>
        </div>
    </div>
  );
}

const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBack,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    // Main Container
    <div className="flex h-[100dvh] w-full bg-brand-light-primary dark:bg-brand-dark-primary font-sans transition-colors duration-300 overflow-hidden">
      
      {/* 
        -------------------------------------------
        LEFT PANEL - Admin System View
        -------------------------------------------
      */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[55%] relative flex-col p-12 text-white bg-[#020408] overflow-hidden">
        
        {/* Static Professional Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
             <img 
                src="https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1470&auto=format&fit=crop" 
                alt="Server Room Data Center" 
                className="w-full h-full object-cover opacity-50"
             />
             {/* Gradient Overlays for Readability and Theme */}
             <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40" />
        </div>

        {/* Content Layer */}
        <div className="relative z-20 flex flex-col h-full justify-between pointer-events-none">
          {/* Header Badge & Title */}
          <div className="pointer-events-auto">
           
            <h1 className="text-4xl xl:text-6xl font-extrabold leading-tight mb-6 tracking-tight text-white drop-shadow-2xl">
              Central Administration<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-200">Origin BI Console</span>
            </h1>
            
            <p className="text-lg text-gray-300 leading-relaxed font-light max-w-lg border-l-2 border-brand-green pl-6 backdrop-blur-sm">
              Manage users, configure system parameters, and monitor platform health from a centralized secure dashboard.
            </p>
          </div>

          {/* Bottom Section: Widget & Info */}
          <div className="flex flex-col gap-8 pointer-events-auto ms-6 mt-6">
             <SystemStatusWidget />
             
             <div className="flex items-center gap-4 text-[10px] text-gray-500 font-mono tracking-wider">
                <span>AUTH NODE: <span className="text-gray-400">US-EAST-1A</span></span>
                <span>•</span>
                <span>V4.2.0</span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-brand-green"><span className="w-1 h-1 bg-brand-green rounded-full"></span>SECURE CONNECTION</span>
             </div>
          </div>
        </div>
      </div>

      {/* 
        -------------------------------------------
        RIGHT PANEL - Login Form
        -------------------------------------------
      */}
      <div className="w-full lg:w-[45%] xl:w-[45%] flex flex-col h-full relative bg-brand-light-primary dark:bg-brand-dark-primary transition-colors duration-300">
        
        {/* Header */}
        <div className="w-full flex justify-between items-center px-8 py-6 flex-shrink-0 z-20">
          <div className="scale-95 origin-left opacity-90 hover:opacity-100 transition-opacity">
             <Logo />
          </div>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center items-center w-full px-8 overflow-y-auto scrollbar-hide">
          <div className="w-full max-w-md space-y-8">
            
            {/* Title Section */}
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-3xl font-bold tracking-tight text-brand-text-light-primary dark:text-white">
                Admin Login
              </h2>
              <p className="text-brand-text-light-secondary dark:text-brand-text-secondary text-sm">
                Restricted access. Please verify your credentials.
              </p>
            </div>

            {/* Login Form Component */}
            <LoginForm 
                onLoginSuccess={onLoginSuccess} 
                portalMode="admin" 
                buttonClass="bg-brand-green hover:bg-brand-green/90 focus:ring-brand-green/30 text-white font-bold h-12 shadow-lg shadow-brand-green/20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-8 py-6 text-center lg:text-left border-t border-brand-light-tertiary dark:border-white/5 lg:border-none">
          <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-brand-text-light-secondary dark:text-gray-500 gap-2">
            <span>&copy; 2025 Origin BI. Restricted Access.</span>
            <button
                onClick={onBack}
                className="hover:text-brand-text-light-primary dark:hover:text-white transition-colors flex items-center gap-1"
            >
                Back to Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
