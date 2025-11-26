import React, { useMemo, useState } from "react";
import {
  CompletedStepIcon,
  CurrentStepIcon,
  PendingStepIcon,
  LockIcon,
} from "@/components/icons";

import AssessmentModal from "@/components/student/AssessmentModal";

// --- Interfaces ---
export interface AssessmentData {
  id: string;
  title: string;
  description: string;
  totalQuestions: number;
  completedQuestions: number;
  status: "completed" | "in-progress" | "locked" | "not-started";
  dateCompleted?: string;
  unlockTime?: string;
  duration?: string;
}

interface AssessmentCardProps extends AssessmentData {
  progress: number;
  onAction: (id: string) => void;
}

type StepStatus = "completed" | "current" | "pending";

interface StepperProps {
  overallProgress: number;
  steps: { label: string; status: StepStatus; progress: number }[];
}

interface AssessmentScreenProps {
  onStartAssessment?: () => void;
}

const Stepper: React.FC<StepperProps> = ({ steps }) => {
  // Number of connecting lines = steps - 1
  const lineCount = Math.max(steps.length - 1, 0);
  const lines = Array.from({ length: lineCount }, (_, i) => i);

  const gap = 5;
  const lineWidth = 29 - gap * 2;

  return (
    <div className="w-full max-w-5xl mx-auto mb-12 px-4">
      <div className="relative grid grid-cols-4 isolate">
        {/* --- DYNAMIC PROGRESS LINE SEGMENTS --- */}
        {lines.map((lineIndex) => {
          const stepForLine = steps[lineIndex];
          if (!stepForLine) return null; // safety

          const assessmentProgress = stepForLine.progress;
          const status = stepForLine.status;

          const leftPosition = 10.5 + lineIndex * 25 + gap;

          return (
            <div
              key={lineIndex}
              className="absolute top-[16px] sm:top-[20px] -translate-y-1/2 h-1 -z-20 transition-colors duration-500 rounded-full overflow-hidden bg-brand-light-tertiary dark:bg-white/10"
              style={{
                left: `${leftPosition}%`,
                width: `${lineWidth}%`,
              }}
            >
              {(status === "current" || status === "completed") && (
                <div
                  className="h-full bg-brand-green rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${assessmentProgress}%` }}
                />
              )}
            </div>
          );
        })}

        {/* --- STEP CIRCLES --- */}
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-3 relative z-10"
          >
            <div className="bg-brand-light-secondary dark:bg-brand-dark-secondary bg-brand-light-tertiary dark:bg-brand-dark-tertiary text-brand-text-light-secondary dark:text-brand-text-secondary rounded-full z-20">
              {step.status === "completed" ? (
                <CompletedStepIcon />
              ) : step.status === "current" ? (
                <CurrentStepIcon />
              ) : (
                <PendingStepIcon />
              )}
            </div>
            <span
              className={`text-xs sm:text-sm font-semibold text-center whitespace-nowrap ${
                step.status === "pending"
                  ? "text-brand-text-light-secondary dark:text-brand-text-secondary opacity-70"
                  : "text-brand-text-light-primary dark:text-brand-text-primary"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LockTimer: React.FC<{ time: string }> = ({ time }) => {
  const radius = 100;
  const stroke = 12;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * Math.PI;
  const progress = 75; // Visual progress for demo
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-[120px] h-[65px] flex-shrink-0">
      <svg className="w-full h-full" viewBox="0 0 224 118">
        {/* Background Track */}
        <path
          className="stroke-brand-light-tertiary dark:stroke-brand-dark-tertiary"
          d="M 12 106 A 100 100 0 0 1 212 106"
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Progress Arc */}
        <path
          className="stroke-brand-green transition-all duration-1000 ease-out"
          d="M 12 106 A 100 100 0 0 1 212 106"
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end mb-1">
        <span className="text-[10px] font-medium text-brand-green py-2 tracking-wide mb-0.5">
          Unlocks In
        </span>
        <span className="text-lg font-bold text-brand-text-light-primary dark:text-white leading-none">
          {time}
        </span>
      </div>
    </div>
  );
};

const AssessmentCard: React.FC<AssessmentCardProps> = ({
  id,
  title,
  description,
  progress,
  totalQuestions,
  completedQuestions,
  status,
  dateCompleted,
  unlockTime,
  onAction,
}) => {
  const isLocked = status === "locked";
  const isNotStarted = status === "not-started";

  // Identify if this card should have the Blur+Lock visual (Locked but NO Timer)
  const showBlurOverlay = isLocked && !unlockTime;

  return (
    <div
      className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 h-full overflow-hidden ${
        isLocked
          ? "bg-brand-light-secondary/50 dark:bg-brand-dark-secondary/50 border-brand-light-tertiary dark:border-brand-dark-tertiary/50"
          : "bg-brand-light-secondary dark:bg-brand-dark-secondary border-brand-light-tertiary dark:border-brand-dark-tertiary hover:border-brand-green/50"
      }`}
    >
      {/* Content Wrapper: Applies Blur/Opacity if locked without timer */}
      {/* Using inline style for filter ensures blur is applied immediately during hydration/loading */}
      <div
        className={`flex flex-col h-full transition-all duration-300 ${
          showBlurOverlay
            ? "opacity-30 select-none pointer-events-none grayscale"
            : isLocked
            ? "opacity-80"
            : ""
        }`}
        style={showBlurOverlay ? { filter: "blur(8px)" } : {}}
      >
        {/* Header Group: Title + Description | Gauge */}
        <div className="flex justify-between items-start mb-6 relative z-20">
          <div className="flex flex-col pr-4 flex-grow">
            <h3 className="text-lg font-semibold text-brand-text-light-primary dark:text-brand-text-primary leading-tight mb-2">
              {title}
            </h3>
            <p className="text-sm w-[85%] text-brand-text-light-secondary dark:text-brand-text-secondary leading-snug">
              {description}
            </p>
          </div>

          {isLocked && unlockTime && <LockTimer time={unlockTime} />}
        </div>

        {/* Individual Card Progress Bar */}
        <div className="mb-4 mt-auto relative z-20">
          <div className="h-3 w-full bg-brand-light-tertiary dark:bg-brand-dark-tertiary rounded-full">
            {!isLocked && !isNotStarted ? (
              <div
                className="h-full bg-brand-green rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            ) : (
              <div className="h-full w-full bg-transparent rounded-full" />
            )}
          </div>
          <div className="flex justify-end mt-1">
            <span className={`text-xs font-semibold text-brand-green`}>
              {(isLocked || isNotStarted) && progress === 0
                ? "NA"
                : `${progress}%`}
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between relative z-20">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-brand-green">
              {completedQuestions}/{totalQuestions}
            </span>
            <span className="text-xs text-brand-text-light-white dark:text-brand-text-white">
              {status === "completed" ? (
                <>
                  Completed in{" "}
                  <span className="text-brand-green font-semibold">
                    {dateCompleted}
                  </span>
                </>
              ) : status === "in-progress" ? (
                "Questions Pending"
              ) : (
                "Questions Completed"
              )}
            </span>
          </div>
          <button
            onClick={() => onAction(id)}
            disabled={status === "completed" || isLocked}
            className={`px-5 py-2 rounded-full text-xs font-medium transition-colors duration-300 ${
              status === "completed"
                ? "bg-brand-light-tertiary dark:bg-brand-dark-tertiary text-brand-text-light-white dark:text-brand-text-white cursor-default"
                : status === "in-progress" || status === "not-started"
                ? "bg-brand-green text-white hover:bg-brand-green/90 shadow-lg shadow-brand-green/20"
                : "bg-brand-light-tertiary dark:bg-brand-dark-tertiary text-brand-text-light-white dark:text-brand-text-white cursor-not-allowed"
            }`}
          >
            {status === "completed"
              ? "Completed"
              : status === "in-progress"
              ? "Continue Assessment"
              : status === "not-started"
              ? "Start Assessment"
              : "Complete Previous"}
          </button>
        </div>
      </div>

      {/* Locked Overlay Logic - Animated Background & Text */}
      {showBlurOverlay && (
        <div className="absolute inset-0 z-30 overflow-hidden rounded-2xl">
          {/* Background Base */}
          <div className="absolute inset-0 bg-brand-dark-primary/90 backdrop-blur-sm z-10" />

          {/* Vector Background Pattern */}
          <svg
            className="absolute inset-0 w-full h-full z-10 opacity-[0.03]"
            width="100%"
            height="100%"
          >
            <pattern
              id="pattern-circles"
              x="0"
              y="0"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
              patternContentUnits="userSpaceOnUse"
            >
              <circle
                id="pattern-circle"
                cx="2"
                cy="2"
                r="1.5"
                fill="currentColor"
                className="text-white"
              />
            </pattern>
            <rect
              id="rect"
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="url(#pattern-circles)"
            />
          </svg>

          {/* Animated Blobs - Using Neutral/Gray colors */}
          <div className="absolute top-0 -left-10 w-72 h-72 bg-white/5 rounded-full mix-blend-screen filter blur-[60px] opacity-30 animate-blob" />
          <div
            className="absolute bottom-0 -right-10 w-72 h-72 bg-white/10 rounded-full mix-blend-screen filter blur-[60px] opacity-20 animate-blob"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-white/5 rounded-full mix-blend-screen filter blur-[60px] opacity-20 animate-blob"
            style={{ animationDelay: "4s" }}
          />

          {/* Content */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center">
            {/* Lock Circle */}
            <div className="relative w-28 h-28 mb-6 rounded-full bg-[#13161B] flex items-center justify-center shadow-2xl border border-white/5">
              <LockIcon className="w-12 h-12 text-[#9CA3AF]" />
            </div>

            <h4 className="text-xl font-bold text-white mb-2 tracking-wide">
              Locked
            </h4>
            <p className="text-sm text-brand-text-secondary max-w-[220px] leading-relaxed">
              Complete previous assessments to unlock this module
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Component ---
const AssessmentScreen: React.FC<AssessmentScreenProps> = ({
  onStartAssessment,
}) => {
  const [selectedAssessment, setSelectedAssessment] =
    useState<AssessmentData | null>(null);

  const assessments: AssessmentData[] = [
    {
      id: "1",
      title: "Unlock Your Mindset",
      description: "See how your thinking style shapes choices and outcomes",
      totalQuestions: 75,
      completedQuestions: 75,
      status: "completed",
      dateCompleted: "12 Aug 2025",
      duration: "60 minutes",
    },
    {
      id: "2",
      title: "Master the Art of Problem Solving",
      description:
        "Tackle real situations with clear logic and confident action.",
      totalQuestions: 75,
      completedQuestions: 25,
      status: "in-progress",
      duration: "90 minutes",
    },
    {
      id: "3",
      title: "Decode Your Behavior",
      description: "Understand how your habits influence teamwork and results",
      totalQuestions: 75,
      completedQuestions: 0,
      status: "locked",
      unlockTime: "23h:45Min",
      duration: "45 minutes",
    },
    {
      id: "4",
      title: "Think Fast Respond Smart",
      description: "Measure your speed, clarity, and accuracy under pressure",
      totalQuestions: 75,
      completedQuestions: 0,
      status: "not-started",
      duration: "30 minutes",
    },
    {
      id: "5",
      title: "Team Dynamics",
      description:
        "Evaluate your ability to perceive and manage emotions effectively.",
      totalQuestions: 75,
      completedQuestions: 0,
      status: "locked",
      duration: "120 minutes",
    },
  ];

  const { totalQuestions, totalCompleted } = useMemo(() => {
    return assessments.reduce(
      (acc, curr) => ({
        totalQuestions: acc.totalQuestions + curr.totalQuestions,
        totalCompleted: acc.totalCompleted + curr.completedQuestions,
      }),
      { totalQuestions: 0, totalCompleted: 0 }
    );
  }, [assessments]);

  const overallPercentage = Math.round((totalCompleted / totalQuestions) * 100);

  const stepperSteps: {
    label: string;
    status: StepStatus;
    progress: number;
  }[] = assessments.slice(0, 4).map((assessment) => {
    const status: StepStatus =
      assessment.status === "completed"
        ? "completed"
        : assessment.status === "in-progress"
        ? "current"
        : "pending";

    return {
      label: assessment.title.split(" ").slice(-1)[0],
      status,
      progress: Math.round(
        (assessment.completedQuestions / assessment.totalQuestions) * 100
      ),
    };
  });

  if (stepperSteps.length > 0) stepperSteps[0].label = "Mindset";
  if (stepperSteps.length > 1) stepperSteps[1].label = "Problem-Solving";
  if (stepperSteps.length > 2) stepperSteps[2].label = "Behavior Patterns";
  if (stepperSteps.length > 3) stepperSteps[3].label = "Think & Respond";

  const handleCardAction = (id: string) => {
    const assessment = assessments.find((a) => a.id === id);
    if (assessment) {
      setSelectedAssessment(assessment);
    }
  };

  const handleStartAssessment = () => {
    if (onStartAssessment) {
      onStartAssessment();
    }
    setSelectedAssessment(null);
  };

  return (
    <div className="flex flex-col gap-4 w-full px-4 md:px-8 lg:px-[80px] pb-10">
      <Stepper overallProgress={overallPercentage} steps={stepperSteps} />

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 gap-y-4 mb-6">
        <div className="w-full md:w-auto">
          <h1 className="text-3xl md:text-4xl font-semibold text-brand-text-light-primary dark:text-brand-text-primary mb-2">
            Hello Monishwar Rajasekaran
          </h1>
          <p className="text-brand-text-light-secondary dark:text-brand-text-secondary text-sm">
            Keep going, you're one step closer to completing your personality
            journey. Unlock upcoming tests as you progress
          </p>
        </div>

        <div
          className="relative overflow-hidden rounded-r-2xl rounded-l-none p-5 min-w-[200px] text-white self-start md:self-center w-full md:w-auto text-right"
          style={{
            background: "linear-gradient(90deg, transparent 0%, #1ED36A 100%)",
          }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
          <p className="text-xs opacity-90 mb-1 text-white">
            Overall Completion
          </p>
          <p className="text-4xl font-semibold text-white">
            {overallPercentage}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {assessments.map((assessment) => (
          <AssessmentCard
            key={assessment.id}
            {...assessment}
            progress={Math.round(
              (assessment.completedQuestions / assessment.totalQuestions) * 100
            )}
            onAction={handleCardAction}
          />
        ))}
      </div>

      <AssessmentModal
        isOpen={!!selectedAssessment}
        assessment={selectedAssessment}
        onClose={() => setSelectedAssessment(null)}
        onStart={handleStartAssessment}
      />
    </div>
  );
};

export default AssessmentScreen;
