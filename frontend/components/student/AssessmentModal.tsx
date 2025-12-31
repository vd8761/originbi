import React, { useState, useRef, useEffect } from 'react';

// --- Local Icons ---
const CustomTimeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CustomQuestionIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

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

      {/* Modal Content - Compact Layout */}
      <div className="relative w-full max-w-xl bg-white dark:bg-[#1A1D21] rounded-3xl shadow-2xl border border-brand-light-tertiary dark:border-white/10 flex flex-col max-h-[90vh] animate-fade-in overflow-hidden transition-colors duration-300">

        {/* Scrollable Body - Reduced Padding/Margins to prevent scroll */}
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <div className="p-5 sm:p-6">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] sm:text-xs text-brand-text-light-secondary dark:text-gray-400 font-medium max-w-[200px] leading-relaxed">
                Every Question Brings You Closer to Your True Strengths
              </p>

              {/* Language Selector */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                  className="flex items-center space-x-2 bg-brand-light-primary dark:bg-white/5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold text-brand-text-light-primary dark:text-white border border-brand-light-tertiary dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0 focus:outline-none"
                >
                  <span>{language}</span>
                  <svg className={`w-3 h-3 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isLangDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-24 bg-white dark:bg-[#24272B] border border-brand-light-tertiary dark:border-white/10 rounded-xl shadow-lg overflow-hidden z-50">
                    <button
                      onClick={() => handleLanguageChange('ENG')}
                      className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${language === 'ENG' ? 'text-brand-green' : 'text-brand-text-light-primary dark:text-gray-300'}`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => handleLanguageChange('TAM')}
                      className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${language === 'TAM' ? 'text-brand-green' : 'text-brand-text-light-primary dark:text-gray-300'}`}
                    >
                      Tamil
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-[clamp(18px,2vw,28px)] font-semibold text-brand-text-light-primary dark:text-white mb-2 leading-tight tracking-tight">{assessment.title}</h2>

            <p className="text-brand-text-light-secondary dark:text-gray-400 text-[clamp(11px,0.9vw,14px)] leading-relaxed mb-5">
              {assessment.description}
            </p>

            {/* Meta Info Box */}
            <div className="bg-brand-light-primary dark:bg-white/5 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-6 border border-brand-light-tertiary dark:border-white/5 mb-5">

              {/* Questions */}
              <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                <div className={`w-8 h-8 rounded-full bg-brand-green flex items-center justify-center shrink-0`}>
                  <CustomQuestionIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[clamp(11px,0.9vw,14px)] font-medium text-brand-text-light-secondary dark:text-gray-300">
                  The test contains <strong className="text-brand-text-light-primary dark:text-white font-bold">{assessment.totalQuestions} questions</strong>
                </span>
              </div>

              <div className="w-full h-px sm:w-px sm:h-8 bg-brand-light-tertiary dark:bg-white/10 block"></div>

              {/* Time */}
              <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                <div className={`w-8 h-8 rounded-full bg-brand-green flex items-center justify-center shrink-0`}>
                  <CustomTimeIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[clamp(11px,0.9vw,14px)] font-medium text-brand-text-light-secondary dark:text-gray-300">
                  Average completion time is <strong className="text-brand-text-light-primary dark:text-white font-bold">{assessment.duration || '30 minutes'}</strong>
                </span>
              </div>

            </div>

            <h4 className="text-brand-text-light-primary dark:text-white font-semibold mb-2 text-[clamp(12px,1vw,15px)]">Please Read Carefully</h4>
            <ul className="space-y-1.5 mb-2">
              <li className="text-[clamp(10px,0.8vw,13px)] text-brand-text-light-secondary dark:text-gray-400 flex items-start gap-3">
                <span className="block w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mt-1.5 shrink-0"></span>
                You can pause and continue anytime.
              </li>
              <li className="text-[clamp(10px,0.8vw,13px)] text-brand-text-light-secondary dark:text-gray-400 flex items-start gap-3">
                <span className="block w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mt-1.5 shrink-0"></span>
                Ensure a calm and focused environment before starting.
              </li>
              <li className="text-[clamp(10px,0.8vw,13px)] text-brand-text-light-secondary dark:text-gray-400 flex items-start gap-3">
                <span className="block w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mt-1.5 shrink-0"></span>
                You must <strong className="text-brand-text-light-primary dark:text-gray-300">answer all questions</strong> for the test to be scored.
              </li>
            </ul>

            {/* Progress Bar for Continue State */}
            {isContinue && (
              <div className="mb-4">
                <div className="flex justify-between text-[10px] sm:text-xs font-bold mb-2">
                  <span className="text-brand-green">{assessment.completedQuestions}/{assessment.totalQuestions} Questions Pending</span>
                  <span className="text-brand-green">{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-brand-light-primary dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-green rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-brand-light-tertiary dark:border-white/10 bg-white dark:bg-[#1A1D21]">
          <div className="flex justify-end gap-3 sm:gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-full border border-brand-light-tertiary dark:border-white/20 text-brand-text-light-primary dark:text-white text-[clamp(11px,0.9vw,14px)] font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={onStart}
              className="px-8 py-2 rounded-full bg-brand-green text-white text-[clamp(11px,0.9vw,14px)] font-bold hover:bg-brand-green/90 transition-colors shadow-lg shadow-brand-green/20"
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
