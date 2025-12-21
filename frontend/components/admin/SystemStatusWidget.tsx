'use client';

import React, { useState, useEffect } from 'react';

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
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-xl w-full max-w-[360px] shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-fade-in relative z-20 group hover:border-brand-green/30 transition-colors duration-500">

            {/* Decorative Corner Accents */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t border-l border-brand-green/50 rounded-tl opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b border-r border-brand-green/50 rounded-br opacity-50 group-hover:opacity-100 transition-opacity" />

            <div className="flex justify-between items-end mb-4 relative z-10">
                <h3 className="text-[10px] font-sans font-bold tracking-wider text-green-500 uppercase flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    System Status
                </h3>
                <span className="text-[10px] font-sans font-bold text-green-500/80 border border-green-500/20 px-1.5 py-0.5 rounded bg-green-500/5">
                    OPERATIONAL
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-gray-500 font-sans font-medium">
                        <span>Server Load</span>
                        <span className="text-white">{serverLoad}%</span>
                    </div>
                    {/* CPU Bar Graph */}
                    <div className="flex gap-0.5 h-1.5 overflow-hidden">
                        {[...Array(10)].map((_, i) => (
                            <div
                                key={i}
                                className={`flex-1 rounded-sm transition-all duration-500 ${i < Math.floor(serverLoad / 10)
                                        ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]'
                                        : 'bg-white/10'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-gray-500 font-sans font-medium">
                        <span>Database Uptime</span>
                        <span className="text-green-400">{dbUptime}%</span>
                    </div>
                    {/* Uptime Line */}
                    <div className="h-1.5 w-full bg-white/10 rounded-sm overflow-hidden relative">
                        <div className="absolute inset-y-0 left-0 bg-green-500 w-[99%] shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse-slow" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SystemStatusWidget;
