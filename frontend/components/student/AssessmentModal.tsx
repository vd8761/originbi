
import React, { useState, useRef, useEffect } from 'react';
import { QuestionMarkIcon, TimeIcon } from '@/components/icons';

interface AssessmentData {
  id: string;
  title: string;
  description: string;
  totalQuestions: number;
  completedQuestions: number;
  status: 'completed' | 'in-progress' | 'locked' | 'not-started';
  duration?: string;
}

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
  assessment: AssessmentData | null;
}

const AssessmentModal: React.FC<AssessmentModalProps> = ({ isOpen, onClose, onStart, assessment }) => {
  const [language, setLanguage] = useState('ENG');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };

    if (isLangDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLangDropdownOpen]);

  if (!isOpen || !assessment) return null;

  const isContinue = assessment.status === 'in-progress';
  const progress = Math.round((assessment.completedQuestions / assessment.totalQuestions) * 100);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setIsLangDropdownOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose} 
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-[#1A1D21] rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh] animate-fade-in overflow-hidden">
        
        {/* Scrollable Body */}
        <div className="overflow-y-auto custom-scrollbar flex-1">
            <div className="p-6 sm:p-8">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                    <p className="text-xs text-gray-400 font-medium max-w-[180px] sm:max-w-[240px] leading-relaxed">
                        Every Question Brings You Closer to Your True Strengths
                    </p>
                    
                    {/* Language Selector */}
                    <div className="relative" ref={dropdownRef}>
                        <button 
                            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                            className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-full text-xs font-bold text-white border border-white/10 hover:bg-white/10 transition-colors shrink-0 focus:outline-none"
                        >
                            <span>{language}</span>
                            <svg className={`w-3 h-3 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {isLangDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-24 bg-[#24272B] border border-white/10 rounded-xl shadow-lg overflow-hidden z-50">
                                <button 
                                    onClick={() => handleLanguageChange('ENG')}
                                    className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-white/5 transition-colors ${language === 'ENG' ? 'text-brand-green' : 'text-gray-300'}`}
                                >
                                    English
                                </button>
                                <button 
                                    onClick={() => handleLanguageChange('TAM')}
                                    className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-white/5 transition-colors ${language === 'TAM' ? 'text-brand-green' : 'text-gray-300'}`}
                                >
                                    Tamil
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <h2 className="text-xl sm:text-3xl font-semibold text-white mb-3 pr-8">{assessment.title}</h2>
                
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8">
                {assessment.description}
                </p>

                {/* Meta Info Box */}
                <div className="bg-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 border border-white/5 mb-8">
                    <div className="flex items-center gap-3">
                        <QuestionMarkIcon className="w-6 h-6 text-brand-green shrink-0" />
                        <span className="text-gray-300 text-xs sm:text-sm">The test contains <strong className="text-white">{assessment.totalQuestions} questions</strong></span>
                    </div>
                    <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                    <div className="flex items-center gap-3">
                        <TimeIcon className="w-6 h-6 text-brand-green shrink-0" />
                        <span className="text-gray-300 text-xs sm:text-sm">Average completion time is <strong className="text-white">{assessment.duration || '90 minutes'}</strong></span>
                    </div>
                </div>

                <h4 className="text-white font-semibold mb-3 text-sm sm:text-base">Please Read Carefully</h4>
                <ul className="space-y-2 mb-8">
                    <li className="text-xs sm:text-sm text-gray-400 flex items-start gap-2">
                        <span className="block w-1 h-1 rounded-full bg-gray-500 mt-2 shrink-0"></span>
                        You can pause and continue anytime.
                    </li>
                    <li className="text-xs sm:text-sm text-gray-400 flex items-start gap-2">
                        <span className="block w-1 h-1 rounded-full bg-gray-500 mt-2 shrink-0"></span>
                        Ensure a calm and focused environment before starting.
                    </li>
                    <li className="text-xs sm:text-sm text-gray-400 flex items-start gap-2">
                        <span className="block w-1 h-1 rounded-full bg-gray-500 mt-2 shrink-0"></span>
                        You must <strong className="text-gray-300">answer all questions</strong> for the test to be scored.
                    </li>
                </ul>

                {/* Progress Bar for Continue State */}
                {isContinue && (
                    <div className="mb-8">
                        <div className="flex justify-between text-[10px] sm:text-xs font-bold mb-2">
                            <span className="text-brand-green">{assessment.completedQuestions}/{assessment.totalQuestions} Questions Pending</span>
                            <span className="text-brand-green">{progress}%</span>
                        </div>
                        <div className="h-1.5 sm:h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-green rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Footer Actions - Sticky at bottom */}
        <div className="p-4 sm:p-6 border-t border-white/10 bg-[#1A1D21]">
             <div className="flex justify-end gap-3 sm:gap-4">
                 <button 
                    onClick={onClose}
                    className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-full border border-white/20 text-white text-xs sm:text-sm font-bold hover:bg-white/5 transition-colors"
                 >
                    Go Back
                 </button>
                 <button 
                    onClick={onStart}
                    className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-full bg-brand-green text-white text-xs sm:text-sm font-bold hover:bg-brand-green/90 transition-colors shadow-lg shadow-brand-green/20"
                 >
                    {isContinue ? 'Continue Assessment' : 'Begin Test'}
                 </button>
             </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentModal;
