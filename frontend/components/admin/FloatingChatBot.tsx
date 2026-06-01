'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

interface FloatingChatBotProps {
    userRole?: 'ADMIN' | 'CORPORATE' | 'STUDENT';
    apiUrl?: string;
}

// Crisp Abstract Isometric Data Layer Logo (Professional Enterprise Monogram)
const ProfessionalLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
            d="M12 2L20.66 7v10L12 22L3.34 17V7L12 2z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
        <path 
            d="M12 2v10M12 22v-10M3.34 7L12 12M20.66 17L12 12M3.34 17L12 12M20.66 7L12 12" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            opacity="0.85"
        />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
);

export default function FloatingChatBot({
    userRole = 'ADMIN',
}: FloatingChatBotProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isNavigating, setIsNavigating] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [showLabel, setShowLabel] = useState(true);

    // Draggable position coordinates
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [constraints, setConstraints] = useState({ left: -1000, right: 53, top: -1000, bottom: 53 });
    const [dockedEdge, setDockedEdge] = useState<'left' | 'right' | 'top' | 'bottom' | null>(null);
    const [dockedOffset, setDockedOffset] = useState<number>(200); //px position from screen top/left

    useEffect(() => { setIsNavigating(false); }, [pathname]);

    useEffect(() => {
        // Load persisted coordinates safely and clamp to viewport
        if (typeof window !== 'undefined') {
            const savedX = localStorage.getItem('bi_assistant_fab_x');
            const savedY = localStorage.getItem('bi_assistant_fab_y');
            const savedDocked = localStorage.getItem('bi_assistant_docked');
            const savedOffset = localStorage.getItem('bi_assistant_docked_offset');

            if (savedDocked) {
                setDockedEdge(savedDocked as any);
                if (savedOffset) setDockedOffset(parseFloat(savedOffset));
            }

            const handleResize = () => {
                const limit = 53; // Allows at most half of the FAB (66px) to go offscreen
                const maxLeft = -window.innerWidth + limit;
                const maxTop = -window.innerHeight + limit;

                setConstraints({
                    left: maxLeft,
                    right: limit,
                    top: maxTop,
                    bottom: limit
                });

                if (savedX && savedY) {
                    let parsedX = parseFloat(savedX);
                    let parsedY = parseFloat(savedY);

                    // Clamp to the half-hidden boundaries
                    if (parsedX < maxLeft) parsedX = maxLeft;
                    if (parsedX > limit) parsedX = limit;
                    if (parsedY < maxTop) parsedY = maxTop;
                    if (parsedY > limit) parsedY = limit;

                    setPosition({ x: parsedX, y: parsedY });
                }
            };
            handleResize();
            window.addEventListener('resize', handleResize);
            
            // Set 5 seconds timer to hide welcome label
            const labelTimer = setTimeout(() => {
                setShowLabel(false);
            }, 5000);

            setMounted(true);

            return () => {
                window.removeEventListener('resize', handleResize);
                clearTimeout(labelTimer);
            };
        }
    }, []);

    if (pathname?.includes('/assistant')) return null;

    const handleRedirect = () => {
        setIsNavigating(true);
        setTimeout(() => {
            if (pathname?.includes('/corporate/')) router.push('/corporate/assistant');
            else if (pathname?.includes('/student/')) router.push('/student/assistant');
            else router.push('/admin/assistant');
        }, 100);
    };

    const handleDragEnd = (event: any, info: any) => {
        if (typeof window !== 'undefined') {
            const x = info.offset.x;
            const y = info.offset.y;

            localStorage.setItem('bi_assistant_fab_x', x.toString());
            localStorage.setItem('bi_assistant_fab_y', y.toString());
            setPosition({ x, y });

            // Detect absolute screen edge proximity for docking
            const screenX = info.point.x;
            const screenY = info.point.y;
            const threshold = 65; // px from screen edge triggers dock

            if (screenX < threshold) {
                setDockedEdge('left');
                const clampedY = Math.max(80, Math.min(window.innerHeight - 80, screenY));
                setDockedOffset(clampedY);
                localStorage.setItem('bi_assistant_docked', 'left');
                localStorage.setItem('bi_assistant_docked_offset', clampedY.toString());
            } else if (screenX > window.innerWidth - threshold) {
                setDockedEdge('right');
                const clampedY = Math.max(80, Math.min(window.innerHeight - 80, screenY));
                setDockedOffset(clampedY);
                localStorage.setItem('bi_assistant_docked', 'right');
                localStorage.setItem('bi_assistant_docked_offset', clampedY.toString());
            } else if (screenY < threshold) {
                setDockedEdge('top');
                const clampedX = Math.max(80, Math.min(window.innerWidth - 80, screenX));
                setDockedOffset(clampedX);
                localStorage.setItem('bi_assistant_docked', 'top');
                localStorage.setItem('bi_assistant_docked_offset', clampedX.toString());
            } else if (screenY > window.innerHeight - threshold) {
                setDockedEdge('bottom');
                const clampedX = Math.max(80, Math.min(window.innerWidth - 80, screenX));
                setDockedOffset(clampedX);
                localStorage.setItem('bi_assistant_docked', 'bottom');
                localStorage.setItem('bi_assistant_docked_offset', clampedX.toString());
            } else {
                setDockedEdge(null);
                localStorage.removeItem('bi_assistant_docked');
                localStorage.removeItem('bi_assistant_docked_offset');
            }
        }
    };

    const undock = () => {
        setDockedEdge(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('bi_assistant_docked');
            localStorage.removeItem('bi_assistant_docked_offset');

            const limit = 53;
            const maxLeft = -window.innerWidth + limit;
            const maxTop = -window.innerHeight + limit;

            let newX = position.x;
            let newY = position.y;

            if (dockedEdge === 'left') newX = maxLeft + 40;
            else if (dockedEdge === 'right') newX = 0;
            else if (dockedEdge === 'top') newY = maxTop + 40;
            else if (dockedEdge === 'bottom') newY = 0;

            setPosition({ x: newX, y: newY });
            localStorage.setItem('bi_assistant_fab_x', newX.toString());
            localStorage.setItem('bi_assistant_fab_y', newY.toString());
        }
    };

    // Label visibility: visible for 5s on mount, or when cursor is hovering near it
    const labelVisible = showLabel || isHovered;

    return (
        <>
            <style jsx>{`
                @keyframes fabFloat {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes ringPulse {
                    0% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(2.2); opacity: 0; }
                }
                @keyframes ringPulse2 {
                    0% { transform: scale(1); opacity: 0.4; }
                    100% { transform: scale(2.8); opacity: 0; }
                }
                @keyframes sparkle1 {
                    0%, 100% { transform: translate(0, 0) scale(0.8); opacity: 0.3; }
                    25% { transform: translate(-8px, -10px) scale(1.2); opacity: 0.9; }
                    50% { transform: translate(-4px, -14px) scale(0.6); opacity: 0.4; }
                    75% { transform: translate(4px, -8px) scale(1); opacity: 0.7; }
                }
                @keyframes sparkle2 {
                    0%, 100% { transform: translate(0, 0) scale(0.6); opacity: 0.2; }
                    33% { transform: translate(8px, -6px) scale(1.1); opacity: 0.8; }
                    66% { transform: translate(4px, -12px) scale(0.7); opacity: 0.3; }
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
            `}</style>

            {/* Draggable motion wrapper */}
            {mounted && !dockedEdge && (
                <motion.div
                    drag
                    dragConstraints={constraints}
                    dragElastic={0.1}
                    dragMomentum={false}
                    onDragEnd={handleDragEnd}
                    initial={{ 
                        opacity: 0, 
                        scale: 0.8,
                        x: position.x,
                        y: position.y
                    }}
                    animate={{ 
                        opacity: 1, 
                        scale: 1,
                        x: position.x,
                        y: position.y
                    }}
                    transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                    whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
                    className="fixed right-5 bottom-5 z-50 flex items-center cursor-grab select-none active:cursor-grabbing"
                >
                    {/* Inner floating wrapper to isolate CSS transform translation from Framer Motion's coordinate dragging */}
                    <div 
                        className="flex items-center gap-3"
                        style={{
                            animation: 'fabFloat 4.5s ease-in-out infinite'
                        }}
                    >
                    {/* "Ask BI" welcome/hover label - Clean white glossy look with green status light */}
                    <AnimatePresence>
                        {labelVisible && (
                            <motion.div
                                initial={{ opacity: 0, x: 12, scale: 0.92 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 12, scale: 0.92 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="px-4 py-2 rounded-full border shadow-lg backdrop-blur-md pointer-events-none select-none"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(245, 248, 250, 0.92) 100%)',
                                    borderColor: isHovered ? 'rgba(30, 211, 106, 0.5)' : 'rgba(0, 0, 0, 0.08)',
                                    boxShadow: isHovered 
                                        ? '0 6px 24px rgba(30, 211, 106, 0.12), inset 0 1px 2px rgba(255, 255, 255, 1)'
                                        : '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 1)',
                                }}
                            >
                                <span className="flex items-center gap-2 text-slate-800 text-xs font-bold tracking-wider uppercase">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1ED36A] opacity-65" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1ED36A]" />
                                    </span>
                                    Ask BI
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* The circular FAB button - Highly professional bright white glass theme */}
                    <div
                        onClick={(e) => {
                            if (!isNavigating) handleRedirect();
                        }}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        className={`relative group focus:outline-none pointer-events-auto ${isNavigating ? 'cursor-wait opacity-50' : 'cursor-pointer'}`}
                        role="button"
                        aria-label="Open Ask BI Assistant"
                    >
                        <div className="relative">
                            {/* Glowing brand-green pulse rings */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-[66px] h-[66px] rounded-full border-2 border-[#1ED36A]/30"
                                    style={{ animation: 'ringPulse 3.5s ease-out infinite' }} />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-[66px] h-[66px] rounded-full border border-[#1ED36A]/15"
                                    style={{ animation: 'ringPulse2 3.5s ease-out 1.5s infinite' }} />
                            </div>

                            {/* Floating subtle green particles */}
                            <div className="absolute -top-1 left-0 w-1.5 h-1.5 rounded-full bg-[#1ED36A]/60 pointer-events-none"
                                style={{ animation: 'sparkle1 6s ease-in-out infinite', filter: 'blur(0.2px)' }} />
                            <div className="absolute top-0 -right-1 w-1.5 h-1.5 rounded-full bg-[#6ee7b7]/60 pointer-events-none"
                                style={{ animation: 'sparkle2 5s ease-in-out 0.8s infinite', filter: 'blur(0.2px)' }} />

                            {/* Premium Metallic Silver Outer Ring */}
                            <div
                                className="rounded-full p-[3px] transition-all duration-300 group-hover:scale-110 group-active:scale-95"
                                style={{
                                    background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                                    boxShadow: isHovered
                                        ? '0 0 0 2px rgba(30, 211, 106, 0.4), 0 8px 24px rgba(30, 211, 106, 0.25), 0 0 16px rgba(30, 211, 106, 0.1)'
                                        : '0 0 0 1px rgba(0, 0, 0, 0.05), 0 4px 16px rgba(0, 0, 0, 0.1)',
                                    transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                                }}
                            >
                                {/* Inner Glossy Bright White Circle */}
                                <div
                                    className="relative rounded-full flex items-center justify-center overflow-hidden transition-all duration-300"
                                    style={{
                                        width: '58px',
                                        height: '58px',
                                        background: isHovered 
                                            ? 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)'
                                            : 'linear-gradient(145deg, #f8fafc 0%, #ffffff 100%)',
                                    }}
                                >
                                    {/* Shimmer overlay */}
                                    <div className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: 'linear-gradient(120deg, transparent 35%, rgba(255, 255, 255, 0.8) 50%, transparent 65%)',
                                            backgroundSize: '200% 100%',
                                            animation: 'shimmer 4.5s ease-in-out infinite',
                                        }} />

                                    {/* Professional Isometric Logo Icon - Bright green theme */}
                                    <div className={`transform transition-all duration-300 ${isHovered ? 'scale-110 rotate-3 text-[#16b058]' : 'text-[#1ED36A]'}`}>
                                        <ProfessionalLogo />
                                    </div>
                                </div>
                            </div>

                            {/* Active Notification Badge */}
                            <div className="absolute -top-0.5 -right-0.5 flex items-center justify-center">
                                <span className="absolute inline-flex h-3.5 w-3.5 rounded-full bg-[#1ED36A] opacity-40 animate-ping" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#1ED36A] border border-white shadow-sm" />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
            )}

            {/* Edge Docking Pull-Tabs */}
            {mounted && dockedEdge && (
                <AnimatePresence>
                    {dockedEdge === 'left' && (
                        <motion.div
                            initial={{ x: -40, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -40, opacity: 0 }}
                            onClick={undock}
                            className="fixed left-0 z-50 cursor-pointer flex items-center justify-center bg-white/95 dark:bg-[#121614]/95 border-y border-r border-[#1ED36A]/20 dark:border-white/[0.08] rounded-r-2xl shadow-[4px_0_24px_rgba(30,211,106,0.06)] backdrop-blur-xl pl-1 pr-3 py-5 hover:pr-4.5 group/tab transition-all"
                            style={{ top: dockedOffset, transform: 'translateY(-50%)' }}
                            title="Restore Chat Assistant"
                        >
                            <ChevronRight className="w-5.5 h-5.5 text-[#1ED36A] animate-pulse group-hover/tab:scale-110 transition-transform stroke-[2.5]" />
                        </motion.div>
                    )}
                    {dockedEdge === 'right' && (
                        <motion.div
                            initial={{ x: 40, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 40, opacity: 0 }}
                            onClick={undock}
                            className="fixed right-0 z-50 cursor-pointer flex items-center justify-center bg-white/95 dark:bg-[#121614]/95 border-y border-l border-[#1ED36A]/20 dark:border-white/[0.08] rounded-l-2xl shadow-[-4px_0_24px_rgba(30,211,106,0.06)] backdrop-blur-xl pr-1 pl-3 py-5 hover:pl-4.5 group/tab transition-all"
                            style={{ top: dockedOffset, transform: 'translateY(-50%)' }}
                            title="Restore Chat Assistant"
                        >
                            <ChevronLeft className="w-5.5 h-5.5 text-[#1ED36A] animate-pulse group-hover/tab:scale-110 transition-transform stroke-[2.5]" />
                        </motion.div>
                    )}
                    {dockedEdge === 'top' && (
                        <motion.div
                            initial={{ y: -40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -40, opacity: 0 }}
                            onClick={undock}
                            className="fixed top-0 z-50 cursor-pointer flex flex-col items-center justify-center bg-white/95 dark:bg-[#121614]/95 border-x border-b border-[#1ED36A]/20 dark:border-white/[0.08] rounded-b-2xl shadow-[0_4px_24px_rgba(30,211,106,0.06)] backdrop-blur-xl pt-1 pb-3 px-5 hover:pb-4.5 group/tab transition-all"
                            style={{ left: dockedOffset, transform: 'translateX(-50%)' }}
                            title="Restore Chat Assistant"
                        >
                            <ChevronDown className="w-5.5 h-5.5 text-[#1ED36A] animate-pulse group-hover/tab:scale-110 transition-transform stroke-[2.5]" />
                        </motion.div>
                    )}
                    {dockedEdge === 'bottom' && (
                        <motion.div
                            initial={{ y: 40, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 40, opacity: 0 }}
                            onClick={undock}
                            className="fixed bottom-0 z-50 cursor-pointer flex flex-col items-center justify-center bg-white/95 dark:bg-[#121614]/95 border-x border-t border-[#1ED36A]/20 dark:border-white/[0.08] rounded-t-2xl shadow-[0_-4px_24px_rgba(30,211,106,0.06)] backdrop-blur-xl pb-1 pt-3 px-5 hover:pt-4.5 group/tab transition-all"
                            style={{ left: dockedOffset, transform: 'translateX(-50%)' }}
                            title="Restore Chat Assistant"
                        >
                            <ChevronUp className="w-5.5 h-5.5 text-[#1ED36A] animate-pulse group-hover/tab:scale-110 transition-transform stroke-[2.5]" />
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </>
    );
}
