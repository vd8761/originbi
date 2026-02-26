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

    useEffect(() => { setIsNavigating(false); }, [pathname]);
    useEffect(() => { const t = setTimeout(() => setMounted(true), 400); return () => clearTimeout(t); }, []);

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
                @keyframes botEntry {
                    0% { opacity: 0; transform: translateY(30px) scale(0.7) rotate(-10deg); }
                    60% { opacity: 1; transform: translateY(-4px) scale(1.05) rotate(2deg); }
                    100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
                }
                @keyframes botFloat {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                @keyframes eyeBlink {
                    0%, 42%, 44%, 100% { transform: scaleY(1); }
                    43% { transform: scaleY(0.1); }
                }
                @keyframes eyeGlow {
                    0%, 100% { filter: drop-shadow(0 0 2px rgba(52,211,153,0.3)); }
                    50% { filter: drop-shadow(0 0 5px rgba(52,211,153,0.7)); }
                }
                @keyframes antennaWave {
                    0%, 100% { transform: rotate(-8deg); }
                    50% { transform: rotate(8deg); }
                }
                @keyframes antennaPulse {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.3); }
                }
            `}</style>

            <button
                onClick={handleRedirect}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                disabled={isNavigating}
                className="fixed right-5 bottom-5 z-50 group cursor-pointer focus:outline-none disabled:cursor-wait"
                aria-label="Open Ask BI Assistant"
                style={{
                    animation: mounted
                        ? 'botEntry 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, botFloat 3s ease-in-out 0.7s infinite'
                        : 'none',
                    opacity: mounted ? undefined : 0,
                }}
            >
                <div className="relative">
                    {/* Soft shadow underneath */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/10 rounded-full blur-sm transition-all duration-300 group-hover:w-10 group-hover:bg-black/15" />

                    {/* 3D Bot SVG */}
                    <svg width="48" height="52" viewBox="0 0 48 52" fill="none" className="transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                        <defs>
                            {/* Body gradient - 3D emerald metallic */}
                            <linearGradient id="botBody" x1="8" y1="12" x2="40" y2="48">
                                <stop offset="0%" stopColor="#34d399" />
                                <stop offset="40%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#047857" />
                            </linearGradient>
                            {/* Head highlight */}
                            <linearGradient id="botHead" x1="10" y1="10" x2="38" y2="38">
                                <stop offset="0%" stopColor="#6ee7b7" />
                                <stop offset="35%" stopColor="#34d399" />
                                <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                            {/* Visor/face plate */}
                            <linearGradient id="visor" x1="14" y1="20" x2="34" y2="34">
                                <stop offset="0%" stopColor="#064e3b" />
                                <stop offset="100%" stopColor="#022c22" />
                            </linearGradient>
                            {/* Shine */}
                            <linearGradient id="shine" x1="12" y1="12" x2="20" y2="22">
                                <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="white" stopOpacity="0" />
                            </linearGradient>
                            {/* Eye glow */}
                            <radialGradient id="eyeGlow" cx="0.5" cy="0.5" r="0.5">
                                <stop offset="0%" stopColor="#6ee7b7" />
                                <stop offset="100%" stopColor="#34d399" />
                            </radialGradient>
                        </defs>

                        {/* Antenna stem */}
                        <g style={{ transformOrigin: '24px 10px', animation: isHovered ? 'antennaWave 0.6s ease-in-out infinite' : 'none' }}>
                            <line x1="24" y1="10" x2="24" y2="3" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                            {/* Antenna ball */}
                            <circle cx="24" cy="2.5" r="2.5" fill="#34d399" />
                            <circle cx="24" cy="2.5" r="2.5" fill="#6ee7b7" opacity="0.5" style={{ animation: isHovered ? 'antennaPulse 1s ease-in-out infinite' : 'none' }} />
                            <circle cx="23.2" cy="1.8" r="0.8" fill="white" opacity="0.5" />
                        </g>

                        {/* Ears / side panels */}
                        <rect x="5" y="22" width="4" height="8" rx="2" fill="url(#botBody)" />
                        <rect x="39" y="22" width="4" height="8" rx="2" fill="url(#botBody)" />
                        {/* Ear highlights */}
                        <rect x="5.5" y="22.5" width="1.5" height="4" rx="0.75" fill="white" opacity="0.2" />
                        <rect x="39.5" y="22.5" width="1.5" height="4" rx="0.75" fill="white" opacity="0.2" />

                        {/* Head - main rounded square */}
                        <rect x="9" y="10" width="30" height="28" rx="8" fill="url(#botHead)" />
                        {/* 3D edge (bottom/right darker) */}
                        <rect x="9" y="10" width="30" height="28" rx="8" fill="url(#botBody)" opacity="0.3" />

                        {/* Top highlight - 3D shine */}
                        <rect x="12" y="12" width="16" height="8" rx="4" fill="url(#shine)" />

                        {/* Face plate / visor */}
                        <rect x="13" y="19" width="22" height="14" rx="5" fill="url(#visor)" />
                        {/* Visor inner glow */}
                        <rect x="14" y="20" width="20" height="12" rx="4" fill="none" stroke="#34d399" strokeWidth="0.5" opacity="0.3" />

                        {/* Eyes */}
                        <g style={{ animation: 'eyeBlink 4s ease-in-out infinite', transformOrigin: '24px 25px' }}>
                            {/* Left eye */}
                            <ellipse cx="19.5" cy="25" rx="2.5" ry="2.5" fill="url(#eyeGlow)" style={{ animation: 'eyeGlow 2s ease-in-out infinite' }} />
                            <circle cx="19" cy="24.2" r="0.8" fill="white" opacity="0.7" />
                            {/* Right eye */}
                            <ellipse cx="28.5" cy="25" rx="2.5" ry="2.5" fill="url(#eyeGlow)" style={{ animation: 'eyeGlow 2s ease-in-out 0.5s infinite' }} />
                            <circle cx="28" cy="24.2" r="0.8" fill="white" opacity="0.7" />
                        </g>

                        {/* Mouth - friendly smile */}
                        <path d="M21 29.5 Q24 32, 27 29.5" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" fill="none" />

                        {/* Body bottom */}
                        <rect x="15" y="38" width="18" height="8" rx="4" fill="url(#botBody)" />
                        {/* Body highlight */}
                        <rect x="17" y="39" width="8" height="3" rx="1.5" fill="white" opacity="0.15" />
                        {/* Chest indicator */}
                        <circle cx="24" cy="42" r="1.5" fill="#6ee7b7" opacity="0.8">
                            <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
                        </circle>

                        {/* Feet */}
                        <rect x="16" y="45" width="5" height="3" rx="1.5" fill="#059669" />
                        <rect x="27" y="45" width="5" height="3" rx="1.5" fill="#059669" />
                    </svg>

                    {/* "Ask BI" tooltip */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-900 text-white text-[9px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-lg tracking-wide">
                        Ask BI
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gray-900 rotate-45" />
                    </div>
                </div>
            </button>
        </>
    );
}
