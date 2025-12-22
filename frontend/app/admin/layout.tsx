import React from 'react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen w-full bg-cover bg-fixed bg-center bg-no-repeat font-sans selection:bg-brand-green/20 overflow-x-hidden lg:[zoom:0.85] xl:[zoom:0.9] 2xl:[zoom:1.0]">

            {/* --- BACKGROUND ELEMENTS --- */}
            {/* Previous animated wave and blobs removed to prioritize the requested Theme SVG */}
            {/* You can re-enable them if overlap is desired, but 'Overall Background' implies replacement */}

            {/* --- CONTENT LAYER --- */}
            <div className="relative z-10 w-full min-h-screen pt-[90px] sm:pt-[98px] lg:pt-[105px]">
                {/* Responsive Container for Auto-Scaling feel */}
                <div className="w-full h-full px-4 sm:px-6 lg:px-8 2xl:px-12 max-w-[2000px] mx-auto transition-all duration-300 relative">
                    {/* --- DEV GRID OVERLAY: Inspect > Click 'grid' badge to see columns --- */}
                    <div className="absolute inset-x-4 sm:inset-x-6 lg:inset-x-8 2xl:inset-x-12 top-0 bottom-0 grid grid-cols-4 lg:grid-cols-12 gap-4 lg:gap-6 pointer-events-none z-0 opacity-0" aria-hidden="true">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="bg-red-500/10 h-full w-full border-x border-red-500/20"></div>
                        ))}
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
