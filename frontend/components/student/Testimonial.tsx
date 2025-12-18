'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { TestimonialData } from '@/lib/types';
import { QuoteIcon, ArrowLeftIcon, ArrowRightIcon } from '@/components/icons';

const testimonials: TestimonialData[] = [
  {
    quote:
      'An invaluable tool for any student feeling lost about their career. The insights are practical and immediately actionable.',
    name: 'Amit',
    title: 'B.Com, Delhi',
    image: '/Slider.png',
  },
  {
    quote:
      "Origin BI's test gave me clarity on my strengths, and the roadmap guided me step-by-step toward UI/UX design.",
    name: 'Sneha',
    title: 'B.Sc. Computer Science, Chennai',
    image: '/Slider.png',
  },
  {
    quote:
      'The personalized feedback was a game-changer. I finally understood where to focus my learning efforts for a career in data science.',
    name: 'Rajesh',
    title: 'B.Tech IT, Bangalore',
    image: '/Slider.png',
  },
  {
    quote:
      'I never thought I could pivot into product management, but OriginBI provided the exact guidance I needed to start my journey.',
    name: 'Priya',
    title: 'MBA, Mumbai',
    image: '/Slider.png',
  },
];

const Testimonial: React.FC = () => {
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
    <div className="relative w-full h-full bg-brand-dark-secondary rounded-3xl overflow-hidden p-6 md:p-8 lg:p-[5%] flex flex-col justify-end">
      {/* Origin Fav Icon Overlay */}
      <img
        src="/Origin_Fav_Icon.svg"
        alt="Origin BI Icon"
        className="absolute top-8 left-8 w-8 h-8 md:w-10 md:h-10 z-30 select-none"
      />
      <div className="absolute inset-0 z-0">
        <img
          key={currentIndex}
          src={`${current.image}?id=${currentIndex}`}
          alt={`Testimonial background for ${current.name}`}
          className="absolute inset-0 w-full h-full object-cover object-top animate-fade-in"
          loading={currentIndex === 0 ? 'eager' : 'lazy'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
      </div>

      <div className="relative z-20 space-y-4 text-white">
        <div className="space-y-3 md:space-y-4">
          <QuoteIcon className="w-5 h-5 md:w-6 md:h-6 text-brand-green" />
          <p className="font-sans text-[clamp(18px,1.67vw,32px)] font-normal leading-[1.2] tracking-[0%]">
            {current.quote}
          </p>
        </div>
        <div>
          <p className="font-sans text-[clamp(16px,1.25vw,24px)] font-semibold leading-none tracking-[0%] mb-1">{current.name},</p>
          <p className="font-sans text-[clamp(14px,1.05vw,20px)] font-normal leading-none tracking-[0%] text-white">{current.title}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {testimonials.map((_, index) => (
              <div
                key={index}
                aria-label={`Go to testimonial ${index + 1}`}
                role="button"
                tabIndex={0}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${index === currentIndex ? 'bg-brand-green w-8' : 'bg-gray-500 w-4'
                  }`}
              />
            ))}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={prevTestimonial}
              aria-label="Previous testimonial"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full p-2 transition-all transform hover:scale-105"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={nextTestimonial}
              aria-label="Next testimonial"
              className="bg-brand-green hover:bg-brand-green/90 text-white rounded-full p-2 transition-all transform hover:scale-105 shadow-lg shadow-brand-green/30"
            >
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonial;
