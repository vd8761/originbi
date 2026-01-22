import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, Language } from "@/contexts/LanguageContext";

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

const modalTranslations = {
  ENG: {
    header: "Every Question Brings You Closer to Your True Strengths",
    questions: "questions",
    contains: "The test contains",
    averageTime: "Average completion time is",
    minutes: "minutes",
    readCarefully: "Please Read Carefully",
    point1: "You can pause and continue anytime.",
    point2: "Ensure a calm and focused environment before starting.",
    point3: "You must answer all questions for the test to be scored.",
    goBack: "Go Back",
    begin: "Begin Test",
    continue: "Continue Assessment",
    pending: "Questions Pending"
  },
  TAM: {
    header: "Ovvoru kelviyum ungal unmaiyaana balathai kandaria uthavum",
    questions: "kelvigal",
    contains: "Indha thervil ullathu",
    averageTime: "Sarasari neram",
    minutes: "nimidangal",
    readCarefully: "Dayavu seidhu kavanithu padikkavum",
    point1: "Neengal eppothu vendumaanalum idai niruthi thodaalam.",
    point2: "Thervai thodangum mun amaithiyaana suzhalai uruvaakkavum.",
    point3: "Mathipeedu seiyya anaithu kelvigalukkum bathilalikka vendum.",
    goBack: "Pin sella",
    begin: "Thervai Thodanga",
    continue: "Thodara",
    pending: "Meedhamulla Kelvigal"
  }
};

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
  const { language, setLanguage } = useLanguage();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const t = modalTranslations[language] || modalTranslations.ENG;

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

  // Extract number from duration string (e.g. "60 minutes" -> "60")
  const durationVal = assessment.duration ? String(assessment.duration).replace(/minutes?/i, '').trim() : '30';

  const handleLanguageChange = (lang: Language) => {
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
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#1A1D21] rounded-3xl shadow-2xl border border-brand-light-tertiary dark:border-white/10 flex flex-col max-h-[90vh] animate-fade-in overflow-hidden transition-colors duration-300 font-sans">

        {/* Scrollable Body - Reduced Padding/Margins to prevent scroll */}
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <div className="p-5 sm:p-6">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-4">
              <p className="text-[14px] sm:text-[24px] text-brand-text-light-secondary dark:text-gray-400 font-light max-w-[200px] sm:max-w-[400px] leading-tight">
                {t.header}
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

            <div className="h-px w-full bg-brand-light-tertiary dark:bg-white/10 mb-6 sm:mb-8" />

            <h2 className="text-[24px] sm:text-[clamp(28px,4vw,44px)] font-semibold text-brand-text-light-primary dark:text-white mb-3 sm:mb-4 leading-tight tracking-tight">{assessment.title}</h2>

            <p className="text-brand-text-light-secondary dark:text-gray-400 text-[13px] sm:text-[clamp(14px,1.2vw,18px)] leading-relaxed mb-5 sm:mb-6">
              {assessment.description}
            </p>

            {/* Meta Info Box */}
            <div className="bg-brand-light-primary dark:bg-white/5 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 border border-brand-light-tertiary dark:border-white/5 mb-6 sm:mb-8">

              {/* Questions */}
              <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand-green flex items-center justify-center shrink-0`}>
                  <CustomQuestionIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-[14px] sm:text-[18px] font-medium text-brand-text-light-secondary dark:text-gray-300 leading-tight">
                  {t.contains} <strong className="text-brand-text-light-primary dark:text-white font-bold block sm:inline">{assessment.totalQuestions} {t.questions}</strong>
                </span>
              </div>

              <div className="w-full h-px sm:w-px sm:h-12 bg-brand-light-tertiary dark:bg-white/10 block"></div>

              {/* Time */}
              <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand-green flex items-center justify-center shrink-0`}>
                  <CustomTimeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-[14px] sm:text-[18px] font-medium text-brand-text-light-secondary dark:text-gray-300 leading-tight">
                  {t.averageTime} <strong className="text-brand-text-light-primary dark:text-white font-bold block sm:inline">{durationVal} {t.minutes}</strong>
                </span>
              </div>

            </div>

            <h4 className="text-brand-text-light-primary dark:text-white font-semibold mb-3 sm:mb-4 text-[16px] sm:text-[20px]">{t.readCarefully}</h4>
            <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
              <li className="text-[12px] sm:text-[16px] text-brand-text-light-secondary dark:text-gray-400 flex items-start gap-3 sm:gap-4">
                <span className="block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400 dark:bg-gray-500 mt-1.5 sm:mt-2 shrink-0"></span>
                {t.point1}
              </li>
              <li className="text-[12px] sm:text-[16px] text-brand-text-light-secondary dark:text-gray-400 flex items-start gap-3 sm:gap-4">
                <span className="block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400 dark:bg-gray-500 mt-1.5 sm:mt-2 shrink-0"></span>
                {t.point2}
              </li>
              <li className="text-[12px] sm:text-[16px] text-brand-text-light-secondary dark:text-gray-400 flex items-start gap-3 sm:gap-4">
                <span className="block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400 dark:bg-gray-500 mt-1.5 sm:mt-2 shrink-0"></span>
                {t.point3}
              </li>
            </ul>

            {/* Progress Bar for Continue State */}
            {isContinue && (
              <div className="mb-4">
                <div className="flex justify-between text-[10px] sm:text-xs font-bold mb-2">
                  <span className="text-brand-green">{assessment.completedQuestions}/{assessment.totalQuestions} {t.pending}</span>
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
        <div className="p-5 sm:p-7 border-t border-brand-light-tertiary dark:border-white/10 bg-white dark:bg-[#1A1D21]">
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
            <button
              onClick={onClose}
              className="w-full sm:w-auto sm:min-w-[120px] h-[40px] sm:h-[44px] px-6 sm:px-8 rounded-full border border-brand-light-tertiary dark:border-white/40 text-brand-text-light-primary dark:text-white text-[13px] sm:text-[14px] font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center justify-center whitespace-nowrap"
            >
              {t.goBack}
            </button>
            <button
              onClick={onStart}
              className="w-full sm:w-auto sm:min-w-[140px] h-[40px] sm:h-[44px] px-6 sm:px-8 rounded-full bg-brand-green text-white text-[13px] sm:text-[14px] font-medium hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/10 flex items-center justify-center whitespace-nowrap"
            >
              {isContinue ? t.continue : t.begin}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentModal;
