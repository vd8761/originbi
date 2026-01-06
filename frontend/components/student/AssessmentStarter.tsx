"use client";

import React, { useState, useEffect, useRef } from "react";
import { CheckCircleIcon, StepperUpArrowIcon, StepperDownArrowIcon, StepperPendingDotIcon } from '@/components/icons';
import { useLanguage } from "@/contexts/LanguageContext";
import { studentService } from "@/lib/services/student.service";

// --- Interfaces ---

interface APIOption {
  id: string; // or number, handled as string
  option_text: string; // fallback
  option_text_en?: string;
  option_text_ta?: string;
  is_correct?: boolean;
}

interface APIQuestion {
  id: string; // or number, handled as string
  question: string; // fallback
  question_text_en?: string;
  question_text_ta?: string;
  context_text_en?: string;
  context_text_ta?: string;
  options?: APIOption[];
  images?: { image_url: string }[];
}

interface APIAssessmentAnswer {
  id: string;
  main_question?: APIQuestion;
  open_question?: APIQuestion;
  main_option_id?: number | string; // From Backend
  open_option_id?: number | string; // From Backend
  status?: string;
}

interface Option {
  id: string;
  textEn: string;
  textTa?: string;
}

interface Question {
  id: string;
  contextTextEn?: string;
  contextTextTa?: string;
  textEn: string;
  textTa?: string;
  options: Option[];
  assessmentAnswerId: string;
}

interface AssessmentRunnerProps {
  onBack: () => void;
  onGoToDashboard?: () => void;
  attemptId?: string;
}

// --- Success Modal Component ---
const SuccessModal: React.FC<{
  onBack: () => void;
  onDashboard: () => void;
}> = ({ onBack, onDashboard }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />
    <div className="relative bg-white dark:bg-[#1A1D21] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-brand-light-tertiary dark:border-white/10 text-center flex flex-col items-center">
      <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mb-6 border border-brand-green/20">
        <div className="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center shadow-lg shadow-brand-green/30">
          <CheckCircleIcon className="w-6 h-6 text-white" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-brand-text-light-primary dark:text-white mb-2">
        Assessment Completed!
      </h2>
      <p className="text-brand-text-light-secondary dark:text-gray-400 mb-8 text-sm">
        Great job! You've successfully completed the assessment. Your results
        are being processed.
      </p>

      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={onDashboard}
          className="w-full py-3.5 rounded-full bg-brand-green text-white font-bold text-sm hover:bg-brand-green/90 transition-colors shadow-lg shadow-brand-green/20"
        >
          Go to Dashboard
        </button>
        <button
          onClick={onBack}
          className="w-full py-3.5 rounded-full border border-brand-light-tertiary dark:border-white/20 text-brand-text-light-primary dark:text-white font-bold text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          Back to Assessments
        </button>
      </div>
    </div>
  </div>
);

// --- VerticalStepper Component ---
const VerticalStepper: React.FC<{
  currentStep: number;
  totalSteps: number;
}> = ({ currentStep, totalSteps }) => {
  const windowSize = 6;

  let start = currentStep - 4;
  if (start < 1) start = 1;
  let end = start + windowSize - 1;

  if (end > totalSteps) {
    end = totalSteps;
    start = Math.max(1, end - windowSize + 1);
  }

  const renderSteps = () => {
    const steps = [];

    for (let i = start; i <= end; i++) {
      const isActive = i === currentStep;
      const isCompleted = i < currentStep;
      const isLineActive = isCompleted;

      // Previously requested "Tick symbol" is removed. 
      // Logic: 
      // Completed: Green Background, White Text (Number)
      // Active: White Background, Green Border, Green Text (Number)
      // Upcoming: Default (Grey Text)

      steps.push(
        <div
          key={i}
          className="flex flex-col items-center relative shrink-0 z-10"
        >
          <div
            className={`
                rounded-full flex items-center justify-center font-semibold transition-all duration-300 relative
                w-[clamp(32px,2.4vw,44px)] h-[clamp(32px,2.4vw,44px)]
                text-[clamp(11px,1.1vw,15px)]
                ${isCompleted
                ? "bg-[#1ED36A] text-white border border-[#1ED36A]" // Completed
                : "bg-white dark:bg-[#24272B] border border-brand-light-tertiary dark:border-white/10 text-brand-text-light-secondary dark:text-[#718096]" // Active & Upcoming (Container Style)
              } 
              `}
          >
            {/* Render Content */}
            {isActive ? (
              <div className="w-2.5 h-2.5 rounded-full bg-[#1ED36A] shadow-[0_0_10px_1px_rgba(30,211,106,0.8)]" />
            ) : (
              <span className="relative z-10">{i}</span>
            )}
          </div>

          {/* Line connecting to next step */}
          {i !== end && (
            <div
              className={`w-[1.5px] h-[clamp(12px,1.5vw,30px)] my-1 rounded-full relative -z-10 transition-colors duration-500 ${isLineActive
                ? "bg-[#1ED36A]"
                : "bg-brand-light-tertiary dark:bg-[#303438]"
                }`}
            />
          )}
        </div>
      );
    }
    return steps;
  };

  const isTopLineActive = start > 1;
  const isBottomLineActive = end < totalSteps;

  return (
    <div className="flex flex-col items-center h-full justify-start shrink-0 select-none relative z-0 pt-2">
      <button className="flex items-center justify-center hover:opacity-80 transition-opacity z-20 group cursor-pointer">
        <div className="w-[clamp(32px,2.4vw,44px)] h-[clamp(32px,2.4vw,44px)] rounded-full bg-white dark:bg-[#1A3A2C] border border-[#1ED36A] flex items-center justify-center group-hover:bg-[#1ED36A] transition-colors">
          <StepperUpArrowIcon className="w-[35%] h-[20%] dark:text-[#FFFFFF] text-[#1ED36A] group-hover:text-white transition-colors" />
        </div>
      </button>

      <div
        className={`w-[1.5px] h-[clamp(12px,1.5vw,30px)] my-1 rounded-full transition-colors duration-500 ${isTopLineActive ? "bg-[#1ED36A]" : "bg-brand-light-tertiary dark:bg-[#303438]"
          }`}
      />

      <div className="flex flex-col items-center">{renderSteps()}</div>

      <div
        className={`w-[1.5px] h-[clamp(12px,1.5vw,30px)] my-1 rounded-full transition-colors duration-500 ${isBottomLineActive ? "bg-[#1ED36A]" : "bg-brand-light-tertiary dark:bg-[#303438]"
          }`}
      />

      <button className="flex items-center justify-center hover:opacity-80 transition-opacity z-20 group cursor-pointer">
        <div className="w-[clamp(32px,2.4vw,44px)] h-[clamp(32px,2.4vw,44px)] rounded-full bg-white dark:bg-[#1A3A2C] border border-[#1ED36A] flex items-center justify-center group-hover:bg-[#1ED36A] transition-colors">
          <StepperDownArrowIcon className="w-[35%] h-[22%] dark:text-[#FFFFFF] text-[#1ED36A] group-hover:text-white transition-colors" />
        </div>
      </button>
    </div>
  );
};

// --- CircularProgress Component ---
const CircularProgress: React.FC<{
  current: number;
  total: number;
  className?: string;
}> = ({
  current,
  total,
  className = "w-20 h-20 lg:w-[135px] lg:h-[135px]",
}) => {
    // Calculate percentage based on COMPLETED questions (current - 1)
    const completedCount = current > 0 ? current - 1 : 0;
    const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    // UI Display
    const size = 120;
    const stroke = 6;
    const center = size / 2;
    const radius = (size - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div
        className={`relative flex items-center justify-center rounded-full ${className}`}
      >
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90">
          {/* Background Circle */}
          <circle
            className="stroke-gray-200 dark:stroke-white/10"
            style={{
              stroke: '',
              fill: 'transparent'
            }}
            strokeWidth={stroke}
            r={radius}
            cx={center}
            cy={center}
          />
          {/* Progress Circle */}
          <circle
            stroke="#1ED36A"
            strokeWidth={stroke}
            strokeDasharray={circumference + " " + circumference}
            style={{
              strokeDashoffset,
              transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            strokeLinecap="butt"
            fill="transparent"
            r={radius}
            cx={center}
            cy={center}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-right py-1">
          <span
            className="text-[clamp(20px,2.5vmin,32px)] font-semibold text-brand-text-light-primary dark:text-white tracking-tight"
            style={{
              fontFamily: "'Haskoy', 'Inter', sans-serif",
              fontWeight: 600,
              lineHeight: '1.1'
            }}
          >
            {percentage}%
          </span>
          <span
            className="text-[clamp(11px,1.2vmin,15px)] text-brand-text-light-secondary dark:text-white/70 font-normal mt-[clamp(2px,0.4vmin,6px)]"
            style={{
              fontFamily: "'Haskoy', 'Inter', sans-serif",
              fontWeight: 400,
              lineHeight: '1'
            }}
          >
            {current}/{total}
          </span>
        </div>
      </div>
    );
  };

// --- AssessmentRunner Component ---
const AssessmentRunner: React.FC<AssessmentRunnerProps> = ({
  onBack,
  onGoToDashboard,
  attemptId = "123",
}) => {
  // State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // Persistent Answers Map
  const [selectedOption, setSelectedOption] = useState<string | null>(null); // Current selected

  const [isCompleted, setIsCompleted] = useState(false);
  const [changeCount, setChangeCount] = useState(0);

  // Language Context
  const { language } = useLanguage();

  // Refs for logic
  const startTimeRef = useRef<number>(Date.now());
  const initialLoadRef = useRef(false);

  // Sync selectedOption when Question Index or Answers change
  useEffect(() => {
    if (questions.length > 0) {
      const currentQ = questions[currentQIndex];
      if (currentQ) {
        // Retrieve saved answer
        const savedAnswer = answers[String(currentQ.id)];
        if (savedAnswer) {
          setSelectedOption(savedAnswer);
        } else {
          setSelectedOption(null);
        }
      }
    }
  }, [currentQIndex, questions, answers]);

  // Fetch Questions
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    const fetchQuestions = async () => {
      console.log(`[AssessmentRunner] Fetching questions for attempt: ${attemptId}`);

      try {
        // 1. Get User Email
        const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
        if (!email) {
          throw new Error("User not logged in (email missing)");
        }

        // 2. Fetch Profile to get numeric Student ID
        const profile = await studentService.getProfile(email);
        if (!profile || !profile.id) {
          throw new Error("Failed to fetch user profile or ID invalid");
        }

        const studentId = Number(profile.id);
        const examId = Number(attemptId) || 0;

        const payload = {
          student_id: studentId, // Real User ID
          exam_id: examId,
        };

        const response = await fetch("http://localhost:4005/api/v1/exam/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || `Failed to load assessment. Status: ${response.status}`);
        }

        const data = await response.json();
        const apiAnswers: APIAssessmentAnswer[] = data.data || [];

        if (apiAnswers.length === 0) {
          throw new Error("No questions returned from the server.");
        }

        // Initialize Answers Map from API Data
        const initialAnswers: Record<string, string> = {};

        // Map API response to UI Question format
        const mappedQuestions: Question[] = apiAnswers.map((ans) => {
          const qData = ans.main_question || ans.open_question;

          if (!qData) {
            return {
              id: ans.id,
              textEn: "Error loading question",
              options: [],
              assessmentAnswerId: ans.id
            };
          }

          const qId = String(qData.id);

          // Check if already answered in DB
          if (ans.main_option_id) {
            initialAnswers[qId] = String(ans.main_option_id);
          } else if (ans.open_option_id) {
            initialAnswers[qId] = String(ans.open_option_id);
          }

          return {
            id: qId,
            textEn: qData.question_text_en || qData.question,
            textTa: qData.question_text_ta,
            contextTextEn: qData.context_text_en,
            contextTextTa: qData.context_text_ta,
            options: qData.options?.map((opt) => ({
              id: String(opt.id),
              textEn: opt.option_text_en || opt.option_text,
              textTa: opt.option_text_ta,
            })) || [],
            assessmentAnswerId: ans.id,
          };
        });

        setAnswers(initialAnswers);
        setQuestions(mappedQuestions);

        // Find first unanswered question ROBUSTLY
        console.log("Answers Data for Resume:", apiAnswers);

        const firstUnansweredIndex = mappedQuestions.findIndex((_, index) => {
          const ans = apiAnswers[index];
          if (!ans) return true;

          // Check Status (Case Insensitive)
          const statusUpper = ans.status ? String(ans.status).toUpperCase() : '';
          const isConfirmedAnswered = statusUpper === 'ANSWERED';

          // Check Option Presence (Fallback)
          const hasOption = !!ans.main_option_id || !!ans.open_option_id;

          // If EITHER is true, it is answered. We return true if NOT answered.
          return !(isConfirmedAnswered || hasOption);
        });

        // If -1 (all answered), set to length (fully complete). Else index.
        const resumeIndex = firstUnansweredIndex >= 0 ? firstUnansweredIndex : mappedQuestions.length;
        console.log("Calculated Resume Index:", resumeIndex);

        setCurrentQIndex(resumeIndex);
        setLoading(false);

        startTimeRef.current = Date.now();
      } catch (err: any) {
        console.error("[AssessmentRunner] error:", err);
        setError(err.message || "Something went wrong");
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [attemptId]);

  const currentQuestion = questions[currentQIndex];
  const totalQuestions = questions.length;
  const currentNumber = currentQIndex + 1;

  // Derive Display Text based on Language
  const getDisplayText = (enText: string, taText?: string) => {
    return language === "TAM" && taText ? taText : enText;
  };

  const displayQuestionText = currentQuestion ? getDisplayText(currentQuestion.textEn, currentQuestion.textTa) : "";
  const displayContextText = currentQuestion ? (language === "TAM" && currentQuestion.contextTextTa ? currentQuestion.contextTextTa : currentQuestion.contextTextEn) : null;

  // Handle Option Select
  const handleOptionSelect = (id: string) => {
    if (selectedOption && selectedOption !== id) {
      setChangeCount((prev) => prev + 1);
    }
    // Update Persistent State
    if (currentQuestion) {
      setAnswers(prev => ({
        ...prev,
        [String(currentQuestion.id)]: id
      }));
    }
    setSelectedOption(id);
  };

  // Submit Answer & Next
  const handleNext = async () => {
    if (!currentQuestion || !selectedOption) return;

    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

    const payload = {
      attempt_id: Number(attemptId),
      question_id: Number(currentQuestion.id),
      selected_option: Number(selectedOption),
      time_taken: timeSpent,
      answer_change_count: changeCount,
    };

    try {
      await fetch("http://localhost:4005/api/v1/exam/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (currentNumber < totalQuestions) {
        setCurrentQIndex((prev) => prev + 1);
        // setSelectedOption handled by useEffect
        setChangeCount(0);
        startTimeRef.current = Date.now();
      } else {
        setIsCompleted(true);
      }
    } catch (err) {
      console.error("Failed to submit answer:", err);
    }
  };

  const handlePrevious = () => {
    if (currentNumber > 1) {
      setCurrentQIndex((prev) => prev - 1);
      // setSelectedOption handled by useEffect
      setChangeCount(0);
      startTimeRef.current = Date.now();
    } else {
      onBack();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-xl font-semibold text-brand-green mb-2">Loading assessment...</div>
        <div className="text-sm text-gray-500">Attempt ID: {attemptId}</div>
      </div>
    );
  }

  if (error || !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-xl font-semibold text-red-500">Error loading assessment</div>
        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 rounded-lg max-w-lg">
          <p className="text-gray-700 dark:text-red-200 mb-2 font-mono text-sm">{error}</p>
          <p className="text-xs text-gray-500">Attempt ID: {attemptId}</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-brand-green text-white rounded-full hover:bg-brand-green/90">Retry</button>
          <button onClick={onBack} className="px-6 py-2 border border-brand-light-tertiary text-gray-600 rounded-full hover:bg-gray-100">Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center bg-transparent w-full h-full max-w-[2000px] mx-auto px-4 lg:px-[4%] 2xl:px-[5%]">
      {isCompleted && (
        <SuccessModal
          onBack={onBack}
          onDashboard={() => onGoToDashboard && onGoToDashboard()}
        />
      )}

      {/* Grid Layout - 12 Columns according to design grid */}
      <div className="w-full h-full grid grid-cols-12">

        {/* Column 1: Vertical Stepper */}
        <div className="hidden lg:flex col-span-1 justify-center border-brand-light-tertiary/20 dark:border-white/5 h-full pt-2 lg:pt-4 pb-10">
          <VerticalStepper
            currentStep={currentNumber}
            totalSteps={totalQuestions}
          />
        </div>

        {/* Columns 2-11: Main Content */}
        <div className="col-span-12 lg:col-span-10 relative h-full flex flex-col px-4 lg:px-[clamp(20px,3vw,60px)]">

          {/* Progress for Mobile */}
          <div className="lg:hidden flex justify-end mb-1 pr-1 pt-4">
            <CircularProgress current={currentNumber} total={totalQuestions} className="w-[clamp(70px,7vw,90px)] h-[clamp(70px,7vw,90px)]" />
          </div>

          {/* Content Area - Fluid Scaling */}
          <div className="flex-grow flex flex-col justify-start w-full pt-[clamp(10px,2vw,30px)]">
            <div className="flex flex-col w-full">

              {/* Text Section - Aligned with designs */}
              <div className="mb-4 lg:mb-6 animate-fade-in relative flex flex-col justify-start items-start gap-4">
                <div className="flex-grow">
                  {/* Context Text Display */}
                  {displayContextText && (
                    <p className="text-[clamp(14px,1.2vw,22px)] text-gray-700 dark:text-gray-300 mb-3 lg:mb-4 font-normal leading-relaxed">
                      {displayContextText}
                    </p>
                  )}

                  {/* Question Text Display */}
                  <h1 className="text-[clamp(18px,2vw,32px)] font-semibold text-brand-text-light-primary dark:text-white leading-tight">
                    {displayQuestionText}
                  </h1>
                </div>
              </div>

              {/* Options Section */}
              <div
                className="space-y-[clamp(8px,1vw,16px)] animate-fade-in w-full"
                style={{ animationDelay: "100ms" }}
              >
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOption === option.id;
                  const optionLabel = getDisplayText(option.textEn, option.textTa);

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(option.id)}
                      className={`
                        w-full p-[clamp(10px,1.2vw,18px)] rounded-xl lg:rounded-2xl text-left flex items-center gap-[clamp(10px,1.5vw,24px)] transition-all duration-200 border group relative overflow-hidden cursor-pointer
                        ${isSelected
                          ? "bg-[#1ED36A] border-[#1ED36A] shadow-[0_4px_16px_rgba(30,211,106,0.2)]"
                          : "bg-white dark:bg-[#24272B] border-brand-light-tertiary dark:border-white/5 hover:bg-gray-50 dark:hover:bg-[#2D3136]"
                        }
                      `}
                    >
                      <div className="flex-shrink-0 z-10">
                        {isSelected ? (
                          <CheckCircleIcon className="w-[clamp(18px,1.8vw,28px)] h-[clamp(18px,1.8vw,28px)] text-white" />
                        ) : (
                          <div className="w-[clamp(18px,1.8vw,28px)] h-[clamp(18px,1.8vw,28px)] rounded-full border-[1.5px] border-gray-300 dark:border-[#3E4247] bg-transparent group-hover:border-[#555] transition-colors" />
                        )}
                      </div>

                      <span
                        className={`text-[clamp(13px,1.1vw,18px)] font-normal z-10 ${isSelected
                          ? "text-white"
                          : "text-brand-text-light-primary dark:text-gray-100"
                          }`}
                      >
                        {optionLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note: I'm relying on the tool to match the context properly. The closing tags above are for context. */}
          </div>

          {/* Navigation Actions */}
          <div className="w-full flex justify-between items-center mt-auto pt-6 pb-6 lg:pb-10 shrink-0">
            <button
              onClick={handlePrevious}
              className="px-[clamp(20px,2vw,32px)] py-[clamp(6px,0.8vw,12px)] rounded-full border border-brand-light-tertiary dark:border-[#303438] text-brand-text-light-secondary dark:text-white transition-colors hover:bg-gray-100 dark:hover:bg-[#24272B] text-[clamp(11px,0.9vw,15px)] font-medium cursor-pointer"
            >
              {currentNumber === 1 ? "Back" : "Previous"}
            </button>

            <button
              onClick={handleNext}
              disabled={!selectedOption}
              className={`
                px-[clamp(24px,2.5vw,40px)] py-[clamp(6px,0.8vw,12px)] rounded-full text-white transition-all shadow-lg text-[clamp(11px,0.9vw,15px)] font-medium
                ${selectedOption
                  ? "bg-[#1ED36A] hover:bg-[#1ED36A]/90 shadow-[#1ED36A]/20 cursor-pointer transform hover:-translate-y-0.5"
                  : "bg-gray-300 dark:bg-[#303438] text-gray-500 dark:text-[#718096] cursor-not-allowed"
                }
              `}
            >
              {currentNumber === totalQuestions
                ? "Finish Assessment"
                : "Next Question"}
            </button>
          </div>
        </div>

        {/* Column 12: Progress Circle (Aligned with Header Row) */}
        <div className="hidden lg:flex col-span-1 justify-end items-start pt-0 pr-2 lg:pr-4">
          <CircularProgress
            current={currentNumber}
            total={totalQuestions}
            className="w-[clamp(120px,12vw,140px)] h-[clamp(120px,12vw,140px)]"
          />
        </div>

      </div>
    </div>
  );
};

export default AssessmentRunner;
