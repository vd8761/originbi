'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { TestimonialData } from '@/lib/types';
import { QuoteIcon, ArrowLeftIcon, ArrowRightIcon } from '@/components/icons';

const testimonials: TestimonialData[] = [
    {
        quote: "OriginBI has completely revolutionized our hiring process. We're finding better candidates faster.",
        name: 'Elena Rodriguez',
        title: 'VP of People, TechFlow',
        image: '/Slider.png', // Fallback or use a specific image if available
    },
    {
        quote: "The analytics provided by OriginBI help us identify skill gaps and upskill our workforce effectively.",
        name: 'Michael Chen',
        title: 'CTO, DataCorp',
        image: '/Slider.png',
    },
    {
        quote: "A game-changer for campus recruitment. We can now screen thousands of candidates with precision.",
        name: 'Sarah Jenkins',
        title: 'Head of Talent, Innovate Inc.',
        image: '/Slider.png',
    },
];

const CorporateTestimonial: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextTestimonial = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, []);

    const prevTestimonial = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
    }, []);

    const current = testimonials[currentIndex];

    useEffect(() => {
        const timer = setTimeout(nextTestimonial, 5000);
        return () => clearTimeout(timer);
    }, [currentIndex, nextTestimonial]);

    return (
        <div className="relative w-full h-full bg-brand-dark-secondary rounded-3xl overflow-hidden p-6 md:p-8 lg:p-[5%] flex flex-col justify-end shadow-2xl">
            {/* Origin Fav Icon Overlay */}
            <img
                src="/Origin_Fav_Icon.svg"
                alt="Origin BI Icon"
                className="absolute top-8 left-8 w-[clamp(32px,3vw,56px)] h-[clamp(32px,3vw,56px)] z-30 select-none"
            />

            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
                    alt="Corporate background"
                    className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none opacity-40 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#022c22] via-transparent to-transparent opacity-90" />
            </div>

            <div key={currentIndex} className="relative z-20 flex flex-col justify-end h-full">
                {/* Fill Animation Style */}
                <style jsx global>{`
          @keyframes fillProgress {
            from { width: 0%; }
            to { width: 100%; }
          }
          .animate-fill {
            animation: fillProgress 5000ms linear forwards;
          }
        `}</style>

                <div className="mt-auto space-y-3 md:space-y-4">
                    <div className="animate-fade-in space-y-3 md:space-y-4">
                        <QuoteIcon className="w-[clamp(16px,1.5vw,24px)] h-[clamp(16px,1.5vw,24px)] text-brand-green" />

                        <p className="font-sans text-[clamp(16px,1.5vw,28px)] font-normal leading-[1.2] tracking-[0%] text-white">
                            {current.quote}
                        </p>
                    </div>

                    <div className="flex items-end justify-between gap-4">
                        <div className="animate-fade-in">
                            <h4 className="font-sans text-[clamp(14px,1.2vw,20px)] font-semibold text-white leading-tight">
                                {current.name}
                            </h4>
                            <p className="font-sans text-[clamp(12px,1vw,16px)] font-normal text-gray-400 leading-tight">
                                {current.title}
                            </p>
                        </div>

                        <div className="flex gap-3 shrink-0">
                            <button
                                onClick={prevTestimonial}
                                disabled={currentIndex === 0}
                                aria-label="Previous testimonial"
                                className={`rounded-full p-[clamp(8px,0.6vw,12px)] transition-all transform hover:scale-105 ${currentIndex === 0
                                    ? 'bg-white/10 text-white/50 cursor-not-allowed'
                                    : 'bg-brand-green text-white hover:bg-brand-green/90 shadow-lg shadow-brand-green/30'
                                    }`}
                            >
                                <ArrowLeftIcon className="w-[clamp(14px,1vw,20px)] h-[clamp(14px,1vw,20px)]" />
                            </button>
                            <button
                                onClick={nextTestimonial}
                                disabled={currentIndex === testimonials.length - 1}
                                aria-label="Next testimonial"
                                className={`rounded-full p-[clamp(8px,0.6vw,12px)] transition-all transform hover:scale-105 ${currentIndex === testimonials.length - 1
                                    ? 'bg-white/10 text-white/50 cursor-not-allowed'
                                    : 'bg-brand-green text-white hover:bg-brand-green/90 shadow-lg shadow-brand-green/30'
                                    }`}
                            >
                                <ArrowRightIcon className="w-[clamp(14px,1vw,20px)] h-[clamp(14px,1vw,20px)]" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center w-full gap-2 mt-6">
                    {testimonials.map((_, index) => (
                        <div
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className="h-1 flex-1 bg-white rounded-full overflow-hidden cursor-pointer hover:bg-white/90 transition-colors"
                        >
                            <div
                                className={`h-full bg-brand-green rounded-full transition-all duration-300 ${index < currentIndex
                                    ? 'w-full'
                                    : index === currentIndex
                                        ? 'animate-fill'
                                        : 'w-0'
                                    }`}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CorporateTestimonial;
