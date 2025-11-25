"use client";

import React, { useState } from "react";
import { CheckCircleIcon, StepperUpArrowIcon, StepperDownArrowIcon, StepperPendingDotIcon, CheckIcon } from '@/components/icons';

// --- Interfaces & Mock Data ---

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: number;
  preamble?: string;
  text: string;
  options: Option[];
}

interface AssessmentRunnerProps {
  onBack: () => void;
  onGoToDashboard?: () => void;
}

const questions: Question[] = [
  {
    id: 1,
    preamble: "You walk into a lab and see a glowing blue liquid.",
    text: "What do you do?",
    options: [
      { id: "a", text: "Ask the scientist what it is" },
      { id: "b", text: "Watch from distance" },
      { id: "c", text: "Take notes – could be useful later" },
      { id: "d", text: "Wonder if it's safe to touch" },
    ],
  },
  {
    id: 2,
    preamble:
      "You want to finish a task early, but your team prefers last-minute work.",
    text: "How do you deal with it?",
    options: [
      { id: "a", text: "Take notes - could be useful later" },
      { id: "b", text: "Ask the scientist what it is" },
      { id: "c", text: "Watch from distance" },
      { id: "d", text: "Wonder if it's safe to touch" },
    ],
  },
  {
    id: 3,
    preamble: "Your project deadline is moved up by two weeks suddenly.",
    text: "What is your immediate reaction?",
    options: [
      { id: "a", text: "Panic initially, then plan" },
      { id: "b", text: "Immediately rally the team" },
      { id: "c", text: "Negotiate for more resources" },
      { id: "d", text: "Work extra hours silently" },
    ],
  },
  {
    id: 4,
    preamble: "A team member disagrees with your proposal in a meeting.",
    text: "How do you respond?",
    options: [
      { id: "a", text: "Defend your idea aggressively" },
      { id: "b", text: "Ask them to explain their view" },
      { id: "c", text: "Suggest discussing it offline" },
      { id: "d", text: "Ignore the comment" },
    ],
  },
  {
    id: 5,
    preamble: "You spot a significant error in a report sent to the client.",
    text: "What is your next step?",
    options: [
      { id: "a", text: "Inform the client immediately" },
      { id: "b", text: "Fix it quietly if possible" },
      { id: "c", text: "Blame the person responsible" },
      { id: "d", text: "Wait for them to notice" },
    ],
  },
  {
    id: 6,
    preamble: "You are asked to lead a new initiative with unclear goals.",
    text: "How do you proceed?",
    options: [
      { id: "a", text: "Ask for clarification first" },
      { id: "b", text: "Start with what you know" },
      { id: "c", text: "Decline until goals are set" },
      { id: "d", text: "Create your own goals" },
    ],
  },
  {
    id: 7,
    preamble: "A colleague takes credit for your work.",
    text: "How do you handle this?",
    options: [
      { id: "a", text: "Confront them publicly" },
      { id: "b", text: "Speak to them privately" },
      { id: "c", text: "Inform the manager" },
      { id: "d", text: "Let it go this time" },
    ],
  },
];

// --- Success Modal Component ---
const SuccessModal: React.FC<{
  onBack: () => void;
  onDashboard: () => void;
}> = ({ onBack, onDashboard }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
    <div className="relative bg-brand-light-primary dark:bg-brand-dark-secondary rounded-3xl p-8 max-w-md w-full shadow-2xl border border-brand-light-tertiary dark:border-white/10 text-center flex flex-col items-center">
      <div className="w-20 h-20 bg-brand-green/20 rounded-full flex items-center justify-center mb-6">
        <div className="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center shadow-lg shadow-brand-green/30">
          <CheckIcon className="w-6 h-6 text-white" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-brand-text-light-primary dark:text-white mb-2">
        Assessment Completed!
      </h2>
      <p className="text-brand-text-light-secondary dark:text-brand-text-secondary mb-8">
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
          className="w-full py-3.5 rounded-full border border-brand-light-tertiary dark:border-white/20 text-brand-text-light-primary dark:text-white font-bold text-sm hover:bg-brand-light-tertiary dark:hover:bg-white/5 transition-colors"
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

  // Sliding Window Logic
  let start = currentStep - 1;
  let end = start + windowSize - 1;

  if (end > totalSteps) {
    end = totalSteps;
    start = end - windowSize + 1;
  }

  if (start < 1) {
    start = 1;
    end = Math.min(start + windowSize - 1, totalSteps);
  }

  const renderSteps = () => {
    const steps = [];

    for (let i = start; i <= end; i++) {
      const isActive = i === currentStep;
      const isCompleted = i < currentStep;

      // Line logic: Connect i to i+1.
      // Color is green if this step (i) is completed.
      const isLineActive = isCompleted;

      steps.push(
        <div
          key={i}
          className="flex flex-col items-center relative shrink-0 z-10"
        >
          {/* Step Circle */}
          <div
            className={`
              rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 relative
              w-10 h-10 text-xs sm:text-sm
              ${
                isCompleted
                  ? "bg-[#1ED36A] text-white"
                  : isActive
                  ? "" // Active uses the SVG Icon directly
                  : "bg-brand-light-tertiary dark:bg-[#24272B] text-brand-text-light-secondary dark:text-[#718096]"
              } 
            `}
          >
            {isActive ? (
              <StepperPendingDotIcon className="w-10 h-10" />
            ) : (
              <span>{i}</span>
            )}
          </div>

          {/* Connection Line (Draws DOWN from current step to next) */}
          {/* Only render if not the last item in the WINDOW */}
          {i < end && (
            <div
              className={`w-[2px] h-6 sm:h-8 my-1 rounded-full relative -z-10 transition-colors duration-500 ${
                isLineActive
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

  // Logic for lines connecting to arrows
  const isTopLineActive = true; // Always green from top
  const isBottomLineActive = end < currentStep;

  return (
    <div className="flex flex-col items-center w-16 h-full justify-center py-4 shrink-0 select-none relative z-0">
      {/* Up Arrow Button */}
      <button className="flex items-center justify-center hover:opacity-80 transition-opacity z-20 mb-1 group">
        <div className="w-10 h-10 rounded-full bg-[#E8F5E9] dark:bg-[#1A3A2C] border border-[#1ED36A] flex items-center justify-center group-hover:bg-[#1ED36A] transition-colors">
          <StepperUpArrowIcon className="w-[14px] h-[7px] text-[#1ED36A] group-hover:text-white transition-colors" />
        </div>
      </button>

      {/* Connection Line from Up Arrow to First Visible Step */}
      <div
        className={`w-[2px] h-6 sm:h-8 my-1 rounded-full transition-colors duration-500 ${
          isTopLineActive
            ? "bg-[#1ED36A]"
            : "bg-brand-light-tertiary dark:bg-[#303438]"
        }`}
      />

      {/* Stepper Steps Container */}
      <div className="flex flex-col items-center">{renderSteps()}</div>

      {/* Connection Line from Last Visible Step to Down Arrow */}
      <div
        className={`w-[2px] h-6 sm:h-8 my-1 rounded-full transition-colors duration-500 ${
          isBottomLineActive
            ? "bg-[#1ED36A]"
            : "bg-brand-light-tertiary dark:bg-[#303438]"
        }`}
      />

      {/* Down Arrow Button */}
      <button className="flex items-center justify-center hover:opacity-80 transition-opacity z-20 mt-1 group">
        <div className="w-10 h-10 rounded-full bg-[#E8F5E9] dark:bg-[#1A3A2C] border border-[#1ED36A] flex items-center justify-center group-hover:bg-[#1ED36A] transition-colors">
          <StepperDownArrowIcon className="w-[14px] h-[8px] text-[#1ED36A] group-hover:text-white transition-colors" />
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
  className = "w-16 h-16 lg:w-[105px] lg:h-[105px]",
}) => {
  const percentage = Math.round((current / total) * 100);

  // Use a 100x100 coordinate system for consistent scaling
  const size = 120;
  const stroke = 6;
  const center = size / 2;
  // Calculate radius to fit within the viewbox with padding
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;

  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={`relative flex items-center justify-center bg-brand-light-secondary dark:bg-[#1A1D21] rounded-full shadow-xl border-brand-light-tertiary dark:border-[#24272B] ${className}`}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full transform -rotate-90"
      >
        {/* Background Track */}
        <circle
          className="stroke-brand-light-tertiary dark:stroke-[#303438]"
          strokeWidth={stroke}
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
        />
        {/* Progress Indicator */}
        <circle
          stroke="#1ED36A"
          strokeWidth={stroke}
          strokeDasharray={circumference + " " + circumference}
          style={{
            strokeDashoffset,
            transition: "stroke-dashoffset 0.5s ease-in-out",
          }}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center leading-none">
        <span className="text-sm lg:text-2xl font-bold text-brand-text-light-primary dark:text-white mb-0.5">
          {percentage}%
        </span>
        <span className="text-[10px] lg:text-sm text-brand-text-light-secondary dark:text-[#A0AEC0] font-semibold tracking-wide">
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
}) => {
  const [currentQIndex, setCurrentQIndex] = useState(0); // start from Q1
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQuestion = questions[currentQIndex % questions.length];
  const totalQuestions = 75;
  const currentNumber = currentQIndex + 1;

  const handleOptionSelect = (id: string) => {
    setSelectedOption(id);
  };

  const handleNext = () => {
    if (currentNumber < totalQuestions) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentNumber > 1) {
      setCurrentQIndex((prev) => prev - 1);
      setSelectedOption(null);
    } else {
      onBack();
    }
  };

  return (
    // Main Container
    <div className="flex justify-center bg-transparent w-full h-full overflow-hidden">
      {isCompleted && (
        <SuccessModal
          onBack={onBack}
          onDashboard={() => onGoToDashboard && onGoToDashboard()}
        />
      )}

      <div className="flex flex-col lg:flex-row w-full h-full max-w-[1450px] gap-4 lg:gap-10 xl:gap-16">
        {/* Left Sidebar - Vertical Stepper */}
        <div className="hidden lg:flex flex-col items-center w-16 xl:w-24 shrink-0 h-full justify-center pt-4">
          <VerticalStepper
            currentStep={currentNumber}
            totalSteps={totalQuestions}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative min-w-0 h-full">
          {/* Top Progress Indicator (Desktop) */}
          <div className="absolute top-2 right-0 lg:right-10 hidden lg:block z-20">
            <CircularProgress current={currentNumber} total={totalQuestions} />
          </div>

          {/* Mobile/Tablet Progress */}
          <div className="lg:hidden flex justify-end mb-1 mt-1 pr-1">
            <CircularProgress
              current={currentNumber}
              total={totalQuestions}
              className="w-14 h-14"
            />
          </div>

          {/* Question Scrollable Container */}
          <div className="flex-grow flex flex-col w-full max-w-5xl lg:pr-10 overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {/* Inner wrapper */}
            <div className="flex flex-col justify-center min-h-full py-4 sm:py-6 my-auto">
              {/* Text Section */}
              <div className="mb-5 sm:mb-8 lg:mb-10 animate-fade-in">
                {currentQuestion.preamble && (
                  <p className="text-sm sm:text-base lg:text-xl text-brand-text-light-secondary dark:text-[#A0AEC0] mb-2 sm:mb-3 font-normal leading-relaxed">
                    {currentQuestion.preamble}
                  </p>
                )}
                <h1 className="text-xl sm:text-2xl lg:text-[34px] xl:text-[38px] font-semibold text-brand-text-light-primary dark:text-white leading-snug">
                  {currentQuestion.text}
                </h1>
              </div>

              {/* Options List */}
              <div
                className="space-y-2 sm:space-y-3 lg:space-y-4 animate-fade-in"
                style={{ animationDelay: "100ms" }}
              >
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOption === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(option.id)}
                      className={`
                                            w-full p-3 sm:p-4 lg:p-5 rounded-xl text-left flex items-center gap-3 sm:gap-4 lg:gap-6 transition-all duration-200 border group relative overflow-hidden
                                            ${
                                              isSelected
                                                ? "bg-[#1ED36A] border-[#1ED36A] shadow-[0_4px_20px_rgba(30,211,106,0.3)]"
                                                : "bg-brand-light-secondary dark:bg-[#24272B] border-transparent hover:bg-brand-light-tertiary dark:hover:bg-[#2D3136]"
                                            }
                                        `}
                    >
                      <div className="flex-shrink-0 z-10">
                        {isSelected ? (
                          <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                        ) : (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 rounded-full border-[1.5px] border-brand-light-tertiary dark:border-[#3E4247] bg-brand-light-primary dark:bg-[#303438] group-hover:border-[#555] transition-colors" />
                        )}
                      </div>

                      <span
                        className={`text-sm sm:text-base lg:text-lg xl:text-xl font-medium z-10 ${
                          isSelected
                            ? "text-white"
                            : "text-brand-text-light-primary dark:text-[#E2E8F0]"
                        }`}
                      >
                        {option.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="w-full max-w-5xl flex justify-between items-center mt-auto pt-3 pb-1 shrink-0 lg:pr-10">
            <button
              onClick={handlePrevious}
              className="px-5 py-2 sm:px-6 sm:py-2.5 lg:px-8 lg:py-3 rounded-full border border-brand-light-tertiary dark:border-[#303438] text-brand-text-light-secondary dark:text-white transition-colors hover:bg-brand-light-tertiary dark:hover:bg-[#24272B] text-xs sm:text-sm lg:text-base font-medium"
            >
              {currentNumber === 1 ? "Back" : "Previous"}
            </button>

            <button
              onClick={handleNext}
              disabled={!selectedOption}
              className={`
                            px-6 py-2 sm:px-8 sm:py-2.5 lg:px-10 lg:py-3 rounded-full text-white transition-all shadow-lg text-xs sm:text-sm lg:text-base font-medium
                            ${
                              selectedOption
                                ? "bg-[#1ED36A] hover:bg-[#1ED36A]/90 shadow-[#1ED36A]/20 cursor-pointer transform hover:-translate-y-0.5"
                                : "bg-brand-dark-tertiary dark:bg-[#303438] text-[#718096] cursor-not-allowed"
                            }
                        `}
            >
              {currentNumber === totalQuestions
                ? "Finish Assessment"
                : "Next Question"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentRunner;
