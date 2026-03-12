'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface FloatingChatBotProps {
    userRole?: 'ADMIN' | 'CORPORATE' | 'STUDENT';
    apiUrl?: string;
}

export default function FloatingChatBot({
    userRole = 'ADMIN',
}: FloatingChatBotProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isNavigating, setIsNavigating] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [pulseCount, setPulseCount] = useState(0);

    useEffect(() => { setIsNavigating(false); }, [pathname]);
    useEffect(() => { const t = setTimeout(() => setMounted(true), 400); return () => clearTimeout(t); }, []);

    // Periodic attention-grab every 6 seconds
    useEffect(() => {
        const interval = setInterval(() => setPulseCount(p => p + 1), 6000);
        return () => clearInterval(interval);
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

    return (
        <>
            <style jsx>{`
                @keyframes fabEntry {
                    0% { opacity: 0; transform: translateY(50px) scale(0.2); }
                    60% { opacity: 1; transform: translateY(-6px) scale(1.08); }
                    80% { transform: translateY(2px) scale(0.97); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes fabFloat {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes ringPulse {
                    0% { transform: scale(1); opacity: 0.5; }
                    100% { transform: scale(2.4); opacity: 0; }
                }
                @keyframes ringPulse2 {
                    0% { transform: scale(1); opacity: 0.3; }
                    100% { transform: scale(3); opacity: 0; }
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
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
                @keyframes sparkle3 {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
                    50% { transform: translate(-6px, -8px) scale(1.4); opacity: 0.9; }
                }
                @keyframes nudge {
                    0%, 100% { transform: scale(1) rotate(0deg); }
                    20% { transform: scale(1.12) rotate(-3deg); }
                    40% { transform: scale(0.96) rotate(2deg); }
                    60% { transform: scale(1.06) rotate(-1deg); }
                    80% { transform: scale(1); }
                }
                @keyframes labelReveal {
                    0% { opacity: 0; transform: translateX(12px) scale(0.9); }
                    100% { opacity: 1; transform: translateX(0) scale(1); }
                }
                @keyframes corePulse {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.15); }
                }
                @keyframes orbitDot {
                    0% { transform: rotate(0deg) translateX(36px) rotate(0deg); }
                    100% { transform: rotate(360deg) translateX(36px) rotate(-360deg); }
                }
                @keyframes brainWave {
                    0%, 100% { d: path("M16 22 C20 18, 26 26, 30 22 S38 18, 40 22"); }
                    50% { d: path("M16 22 C20 26, 26 18, 30 22 S38 26, 40 22"); }
                }
            `}</style>

            {/* Main wrapper — positions the FAB and the label together */}
            <div
                className="fixed right-5 bottom-5 z-50 flex items-center gap-3"
                style={{
                    animation: mounted
                        ? `fabEntry 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, fabFloat 4s ease-in-out 1.5s infinite${pulseCount > 0 ? ', nudge 0.7s ease-in-out' : ''}`
                        : 'none',
                    opacity: mounted ? undefined : 0,
                }}
                key={pulseCount}
            >
                {/* "Ask BI" label — LEFT of the icon, always visible */}
                <div
                    className="px-4 py-2 rounded-full shadow-lg pointer-events-none select-none"
                    style={{
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                        border: '1px solid rgba(147,197,253,0.25)',
                        animation: mounted ? 'labelReveal 0.5s ease-out 0.8s both' : 'none',
                        boxShadow: '0 4px 20px rgba(30,58,138,0.35), 0 0 0 1px rgba(255,255,255,0.08) inset',
                    }}
                >
                    <span className="flex items-center gap-2 text-white text-xs font-semibold tracking-wide">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
                        </span>
                        Ask BI
                    </span>
                </div>

                {/* The circular FAB button */}
                <button
                    onClick={handleRedirect}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    disabled={isNavigating}
                    className="relative group cursor-pointer focus:outline-none disabled:cursor-wait"
                    aria-label="Open Ask BI Assistant"
                >
                    <div className="relative">
                        {/* Animated pulse rings */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[66px] h-[66px] rounded-full border-2 border-blue-400/40"
                                style={{ animation: 'ringPulse 3s ease-out infinite' }} />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[66px] h-[66px] rounded-full border border-cyan-400/25"
                                style={{ animation: 'ringPulse2 3s ease-out 1.2s infinite' }} />
                        </div>

                        {/* Floating sparkle particles */}
                        <div className="absolute -top-1 left-0 w-1.5 h-1.5 rounded-full bg-cyan-300 pointer-events-none"
                            style={{ animation: 'sparkle1 5s ease-in-out infinite', filter: 'blur(0.3px)' }} />
                        <div className="absolute top-0 -right-1 w-1 h-1 rounded-full bg-blue-300 pointer-events-none"
                            style={{ animation: 'sparkle2 4s ease-in-out 0.5s infinite', filter: 'blur(0.3px)' }} />
                        <div className="absolute -bottom-0.5 left-1 w-1 h-1 rounded-full bg-indigo-300 pointer-events-none"
                            style={{ animation: 'sparkle3 6s ease-in-out 1s infinite', filter: 'blur(0.3px)' }} />

                        {/* Outer white ring */}
                        <div
                            className="rounded-full p-[3px] transition-all duration-300 group-hover:scale-110 group-active:scale-95"
                            style={{
                                background: 'white',
                                boxShadow: isHovered
                                    ? '0 0 0 2px rgba(59,130,246,0.3), 0 8px 32px rgba(30,58,138,0.4), 0 0 20px rgba(59,130,246,0.2)'
                                    : '0 0 0 1px rgba(59,130,246,0.15), 0 4px 20px rgba(30,58,138,0.25)',
                                transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                            }}
                        >
                            {/* Inner dark-blue gradient circle */}
                            <div
                                className="relative rounded-full flex items-center justify-center overflow-hidden"
                                style={{
                                    width: '58px',
                                    height: '58px',
                                    background: 'linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)',
                                }}
                            >
                                {/* Shimmer overlay */}
                                <div className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)',
                                        backgroundSize: '200% 100%',
                                        animation: 'shimmer 4s ease-in-out infinite',
                                    }} />

                                {/* Orbiting dot */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-1 h-1 rounded-full bg-cyan-300"
                                        style={{
                                            animation: 'orbitDot 8s linear infinite',
                                            opacity: 0.6,
                                            filter: 'blur(0.3px)',
                                        }} />
                                </div>

                                {/* Modern AI / Brain + Chat icon */}
                                <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <linearGradient id="iconGrad" x1="8" y1="8" x2="40" y2="40">
                                            <stop offset="0%" stopColor="#e0f2fe" />
                                            <stop offset="50%" stopColor="#bae6fd" />
                                            <stop offset="100%" stopColor="#7dd3fc" />
                                        </linearGradient>
                                        <filter id="iconGlow">
                                            <feGaussianBlur stdDeviation="1.5" result="blur" />
                                            <feMerge>
                                                <feMergeNode in="blur" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    </defs>

                                    {/* Chat bubble shape */}
                                    <path d="M10 14 C10 10.7, 12.7 8, 16 8 L32 8 C35.3 8, 38 10.7, 38 14 L38 28 C38 31.3, 35.3 34, 32 34 L20 34 L14 39 L14 34 L16 34 C12.7 34, 10 31.3, 10 28 Z"
                                        fill="url(#iconGrad)" opacity="0.95" filter="url(#iconGlow)" />

                                    {/* Inner: AI sparkle brain pattern */}
                                    {/* Central node */}
                                    <circle cx="24" cy="20" r="2.5" fill="#1e40af">
                                        <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
                                    </circle>

                                    {/* Connection lines radiating from center */}
                                    <line x1="24" y1="20" x2="17" y2="15" stroke="#1e40af" strokeWidth="1.2" opacity="0.5" />
                                    <line x1="24" y1="20" x2="31" y2="15" stroke="#1e40af" strokeWidth="1.2" opacity="0.5" />
                                    <line x1="24" y1="20" x2="18" y2="26" stroke="#1e40af" strokeWidth="1.2" opacity="0.5" />
                                    <line x1="24" y1="20" x2="30" y2="26" stroke="#1e40af" strokeWidth="1.2" opacity="0.5" />

                                    {/* Outer nodes */}
                                    <circle cx="17" cy="15" r="1.5" fill="#2563eb" opacity="0.8">
                                        <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" begin="0.3s" repeatCount="indefinite" />
                                    </circle>
                                    <circle cx="31" cy="15" r="1.5" fill="#2563eb" opacity="0.8">
                                        <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" begin="0.8s" repeatCount="indefinite" />
                                    </circle>
                                    <circle cx="18" cy="26" r="1.5" fill="#2563eb" opacity="0.8">
                                        <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" begin="1.2s" repeatCount="indefinite" />
                                    </circle>
                                    <circle cx="30" cy="26" r="1.5" fill="#2563eb" opacity="0.8">
                                        <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
                                    </circle>

                                    {/* Sparkle stars */}
                                    <g opacity="0.7">
                                        <path d="M15 21 L15.5 19.5 L16 21 L17.5 21.5 L16 22 L15.5 23.5 L15 22 L13.5 21.5 Z"
                                            fill="#1e40af">
                                            <animate attributeName="opacity" values="0.3;0.9;0.3" dur="3s" repeatCount="indefinite" />
                                        </path>
                                        <path d="M32 19 L32.4 17.8 L32.8 19 L34 19.4 L32.8 19.8 L32.4 21 L32 19.8 L30.8 19.4 Z"
                                            fill="#1e40af">
                                            <animate attributeName="opacity" values="0.3;0.9;0.3" dur="3s" begin="1s" repeatCount="indefinite" />
                                        </path>
                                    </g>
                                </svg>
                            </div>
                        </div>

                        {/* Notification badge */}
                        <div className="absolute -top-0.5 -right-0.5 flex items-center justify-center">
                            <span className="absolute inline-flex h-3.5 w-3.5 rounded-full bg-cyan-400 opacity-40 animate-ping" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 border border-white shadow-sm" />
                        </div>
                    </div>
                </button>
            </div>
        </>
    );
}
