import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { studentService } from "@/lib/services/student.service";
import { Spinner } from "@/components/icons";
import AssessmentModal from "@/components/student/AssessmentModal";

// --- Custom Lock Icon ---
const CustomLockIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 12 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.5 6H10V4C10 1.794 8.206 0 6 0C3.794 0 2 1.794 2 4V6H1.5C0.673333 6 0 6.67267 0 7.5V14.5C0 15.3273 0.673333 16 1.5 16H10.5C11.3267 16 12 15.3273 12 14.5V7.5C12 6.67267 11.3267 6 10.5 6ZM3.33333 4C3.33333 2.52933 4.52933 1.33333 6 1.33333C7.47067 1.33333 8.66667 2.52933 8.66667 4V6H3.33333V4ZM6.66667 11.148V12.6667C6.66667 13.0347 6.36867 13.3333 6 13.3333C5.63133 13.3333 5.33333 13.0347 5.33333 12.6667V11.148C4.93667 10.9167 4.66667 10.4913 4.66667 10C4.66667 9.26467 5.26467 8.66667 6 8.66667C6.73533 8.66667 7.33333 9.26467 7.33333 10C7.33333 10.4913 7.06333 10.9167 6.66667 11.148Z"
      fill="currentColor"
    />
  </svg>
);

export interface AssessmentData {
  id: string;
  attemptId?: string; // UUID from backend
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

// Updated StepStatus to include more states
type StepStatus = "completed" | "in-progress" | "not-started" | "locked";

interface StepperProps {
  overallProgress: number;
  steps: { label: string; status: StepStatus; progress: number }[];
}

interface AssessmentScreenProps {
  onStartAssessment?: () => void;
}

const Stepper: React.FC<StepperProps> = ({ steps }) => {
  const lineCount = Math.max(steps.length - 1, 0);
  const lines = Array.from({ length: lineCount }, (_, i) => i);
  const gap = 3;
  const colCount = steps.length || 1;
  const colWidth = 100 / colCount;
  const maxContainerWidth = Math.min(steps.length * 280, 1000);

  return (
    <div className="w-full flex justify-center mb-6">
      <div
        className="relative grid isolate min-w-[600px] md:min-w-0 md:mx-auto w-full transition-all duration-300"
        style={{
          maxWidth: `${maxContainerWidth}px`,
          gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`
        }}
      >
        {lines.map((lineIndex) => {
          const stepForLine = steps[lineIndex];
          if (!stepForLine) return null;

          const assessmentProgress = stepForLine.progress;
          const status = stepForLine.status;

          const center = (colWidth / 2) + (lineIndex * colWidth);
          const leftPosition = center + gap;
          const width = colWidth - (gap * 2);

          return (
            <div
              key={lineIndex}
              className="absolute top-[20px] -translate-y-1/2 h-1 -z-20 transition-colors duration-500 rounded-full overflow-hidden bg-brand-light-tertiary dark:bg-white/10"
              style={{
                left: `${leftPosition}%`,
                width: `${width}%`,
              }}
            >
              {(status === "completed") && (
                <div
                  className="h-full bg-brand-green rounded-full transition-all duration-700 ease-out"
                  style={{ width: `100%` }}
                />
              )}
              {(status === "in-progress") && (
                <div
                  className="h-full bg-brand-green rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${assessmentProgress}%` }}
                />
              )}
            </div>
          );
        })}

        {steps.map((step, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-1.5 relative z-10"
          >
            <div className="bg-brand-light-primary dark:bg-brand-dark-primary rounded-full z-20 p-1">
              {step.status === "completed" ? (
                /* Completed - Check Icon */
                <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center shadow-[0_0_12px_rgba(30,211,106,0.4)]">
                  <svg className="w-4 h-4 text-[#13161B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : step.status === "in-progress" ? (
                /* In Progress - Green Dot */
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center border border-brand-green/20 dark:border-brand-green/20">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-green shadow-[0_0_8px_#1ED36A]" />
                </div>
              ) : step.status === "not-started" ? (
                /* Not Started - Grey Dot (New Request) */
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-white/30" />
                </div>
              ) : (
                /* Locked - Lock Icon */
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center transition-all duration-300">
                  <CustomLockIcon className="w-3.5 h-3.5 text-gray-400 dark:text-white/30" />
                </div>
              )}
            </div>
            <span
              className={`text-[clamp(9px,0.8vw,11px)] font-semibold text-center mt-1 px-1 break-words max-w-[100px] ${step.status === "locked"
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
  // Static for now, can be made dynamic
  const radius = 100;
  const stroke = 12;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * Math.PI;
  const strokeDashoffset = circumference - (75 / 100) * circumference;

  return (
    <div className="relative w-[100px] h-[55px] flex-shrink-0">
      <svg className="w-full h-full" viewBox="0 0 224 118">
        <path
          className="stroke-brand-light-tertiary dark:stroke-brand-dark-tertiary"
          d="M 12 106 A 100 100 0 0 1 212 106"
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
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
        <span className="text-[9px] font-medium text-brand-green py-1.5 tracking-wide mb-0">
          Unlocks In
        </span>
        <span className="text-base font-bold text-brand-text-light-primary dark:text-white leading-none">
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
  const showBlurOverlay = isLocked && !unlockTime;

  return (
    <div
      className={`relative flex flex-col p-5 rounded-2xl border transition-all duration-300 h-full overflow-hidden ${isLocked
        ? "bg-brand-light-secondary/50 dark:bg-brand-dark-secondary/50 border-brand-light-tertiary dark:border-brand-dark-tertiary/50"
        : "bg-brand-light-secondary dark:bg-brand-dark-secondary border-brand-light-tertiary dark:border-brand-dark-tertiary hover:border-brand-green/50"
        }`}
    >
      <div
        className={`flex flex-col h-full transition-all duration-300 ${showBlurOverlay
          ? "opacity-0"
          : isLocked
            ? "opacity-80"
            : ""
          }`}
        aria-hidden={showBlurOverlay}
      >
        <div className="flex justify-between items-start mb-4 relative z-20">
          <div className="flex flex-col pr-4 flex-grow">
            <h3 className="text-[clamp(13px,1.1vw,16px)] font-bold text-brand-text-light-primary dark:text-brand-text-primary leading-tight mb-2">
              {title}
            </h3>
            <p className="text-[clamp(10px,0.8vw,12px)] w-[90%] text-brand-text-light-secondary dark:text-brand-text-secondary leading-normal">
              {description}
            </p>
          </div>
          {isLocked && unlockTime && <LockTimer time={unlockTime} />}
        </div>

        <div className="mb-4 mt-auto relative z-20">
          <div className="h-2 w-full bg-brand-light-tertiary dark:bg-brand-dark-tertiary rounded-full">
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
            <span className={`text-[10px] font-semibold text-brand-green`}>
              {(isLocked || isNotStarted) && progress === 0
                ? "NA"
                : `${progress}%`}
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between relative z-20">
          <div className="flex flex-col gap-0.5">
            <span className="text-[clamp(10px,0.9vw,13px)] font-semibold text-brand-green">
              {completedQuestions}/{totalQuestions}
            </span>
            <span className="text-[clamp(8px,0.7vw,11px)] text-brand-text-light-white dark:text-brand-text-white">
              {status === 'completed' ? `Completed on ${dateCompleted}` : 'Questions Pending'}
            </span>
          </div>
          <button
            onClick={() => onAction(id)}
            disabled={status === "completed" || isLocked}
            className={`px-4 py-1.5 rounded-full text-[clamp(8px,0.75vw,11px)] font-medium transition-colors duration-300 ${status === "completed"
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

      {showBlurOverlay && (
        <div className="absolute inset-0 z-30 overflow-hidden rounded-2xl flex flex-col items-center justify-center p-4 text-center">
          <div className="absolute inset-0 bg-white/95 dark:bg-brand-dark-primary/95 backdrop-blur-md z-10" />
          <svg className="absolute inset-0 w-full h-full z-10 opacity-[0.05]" width="100%" height="100%">
            <pattern id="pattern-circles" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="currentColor" className="text-brand-text-light-primary dark:text-white" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#pattern-circles)" />
          </svg>

          <div className="relative z-20 w-16 h-16 mb-4 rounded-3xl bg-gray-100 dark:bg-[#1A1D21] flex items-center justify-center shadow-lg border border-gray-200 dark:border-white/5">
            <CustomLockIcon className="w-6 h-8 text-gray-400 dark:text-[#9CA3AF]" />
          </div>

          <h4 className="relative z-20 text-lg font-bold text-brand-text-light-primary dark:text-white mb-2 tracking-wide">
            Locked
          </h4>
          <p className="relative z-20 text-xs text-brand-text-light-secondary dark:text-brand-text-secondary max-w-[200px] leading-relaxed">
            Complete previous assessments to unlock this module
          </p>
        </div>
      )}
    </div>
  );
};

const AssessmentScreen: React.FC<AssessmentScreenProps> = ({
  onStartAssessment,
}) => {
  const router = useRouter();
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentData | null>(null);
  const [fetchedSteps, setFetchedSteps] = useState<any[]>([]);
  const [userName, setUserName] = useState("Student");
  const [loading, setLoading] = useState(true);

  // Dynamic API URL for Mobile Support
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;
      return `${protocol}//${hostname}:4004`;
    }
    return 'http://localhost:4004';
  };

  useEffect(() => {
    // studentService.API_URL = getBaseUrl(); // Removed: Property does not exist and internal var is const

    const fetchProgress = async () => {
      const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
      console.log("Fetching progress for:", email); // Debug log
      if (email) {
        try {
          const [progressData, profileData] = await Promise.all([
            studentService.getAssessmentProgress(email),
            studentService.getProfile(email)
          ]);

          console.log("Progress Data:", progressData); // Debug log

          if (progressData && Array.isArray(progressData)) {
            setFetchedSteps(progressData);
          }
          if (profileData && profileData.metadata?.fullName) {
            setUserName(profileData.metadata.fullName);
          }
        } catch (err) {
          console.error("Error fetching assessment data:", err);
        }
      }
      setLoading(false);
    };
    fetchProgress();
  }, []);

  const assessments: AssessmentData[] = useMemo(() => {
    if (fetchedSteps.length === 0) return [];

    return fetchedSteps.map((step, index) => {
      console.log("Mapping step - RAW:", JSON.stringify(step, null, 2)); // Debug log

      let status: "completed" | "in-progress" | "locked" | "not-started" = "not-started";
      if (step.status === 'COMPLETED') status = 'completed';
      else if (step.status === 'IN_PROGRESS') status = 'in-progress';
      else status = 'not-started';

      const prev = fetchedSteps[index - 1];
      if (index > 0) {
        if (prev && prev.status !== 'COMPLETED' && status !== 'completed' && status !== 'in-progress') {
          status = 'locked';
        }
      }

      // Robust ID Mapping
      const foundAttemptId = step.id || step.attempt_id || step.assessment_attempt_id || step.uuid;

      return {
        id: String(step.levelNumber || index + 1),
        attemptId: foundAttemptId,
        title: step.stepName,
        description: step.description || step.stepName,
        totalQuestions: 75,
        completedQuestions: status === 'completed' ? 75 : (status === 'in-progress' ? 10 : 0),
        status: status,
        duration: "30 minutes"
      };
    });
  }, [fetchedSteps]);

  const { totalQuestions, totalCompleted } = useMemo(() => {
    return assessments.reduce(
      (acc, curr) => ({
        totalQuestions: acc.totalQuestions + curr.totalQuestions,
        totalCompleted: acc.totalCompleted + curr.completedQuestions,
      }),
      { totalQuestions: 0, totalCompleted: 0 }
    );
  }, [assessments]);

  const overallPercentage = totalQuestions > 0 ? Math.round((totalCompleted / totalQuestions) * 100) : 0;

  const stepperSteps = useMemo(() => assessments.map((assessment) => {
    const isLocked = assessment.status === 'locked';

    let status: StepStatus = 'locked';
    if (assessment.status === 'completed') status = 'completed';
    else if (assessment.status === 'in-progress') status = 'in-progress';
    else if (assessment.status === 'not-started') status = 'not-started';

    if (isLocked) status = 'locked';

    return {
      label: isLocked ? 'Locked' : assessment.title,
      status,
      progress: Math.round(
        (assessment.completedQuestions / assessment.totalQuestions) * 100
      ),
    };
  }), [assessments]);

  const handleCardAction = (id: string) => {
    const assessment = assessments.find((a) => a.id === id);
    if (assessment) {
      setSelectedAssessment(assessment);
    }
  };

  const handleStartAssessment = () => {
    console.log("Starting Assessment with data:", selectedAssessment); // Debug log

    if (selectedAssessment?.attemptId) {
      console.log("Redirecting to assessment...");
      router.push(`/student/assessment/start?attempt_id=${selectedAssessment.attemptId}`);
    } else {
      console.error("No attempt ID found. Selected Assessment:", selectedAssessment);
      alert("Error: Unable to start assessment. No Assessment Attempt ID found. Please check console (F12) for details.");
    }

    if (onStartAssessment) {
      onStartAssessment();
    }
    setSelectedAssessment(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] w-full">
        <Spinner className="w-10 h-10 text-brand-green" />
      </div>
    );
  }

  if (!loading && assessments.length === 0) {
    return <div className="p-20 text-center text-brand-text-light-primary dark:text-white text-lg">No Assessments Found.</div>;
  }

  return (
    <div className="flex flex-col gap-4 w-full px-4 md:px-8 lg:px-[80px] pb-10 max-w-[1920px] mx-auto pt-6 lg:pt-10">
      <div className="mb-6 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide md:overflow-visible md:pb-0 md:mx-0 md:px-0">
        <Stepper overallProgress={overallPercentage} steps={stepperSteps} />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <div className="w-full md:w-auto">
          <h1 className="text-[clamp(18px,1.8vw,28px)] font-semibold text-brand-text-light-primary dark:text-brand-text-primary mb-1">
            Hello {userName}
          </h1>
          <p className="text-brand-text-light-secondary dark:text-brand-text-secondary text-[clamp(10px,0.8vw,12px)] max-w-xl">
            Keep going, you're one step closer to completing your personality
            journey. Unlock upcoming tests as you progress
          </p>
        </div>

        <div
          className="relative overflow-hidden rounded-r-2xl rounded-l-none p-3 min-w-[160px] text-white self-start md:self-center w-full md:w-auto text-right"
          style={{
            background: "linear-gradient(90deg, transparent 0%, #1ED36A 100%)",
          }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
          <p className="text-[clamp(8px,0.7vw,10px)] opacity-90 mb-0.5 text-white">
            Overall Completion
          </p>
          <p className="text-[clamp(16px,1.5vw,22px)] font-semibold text-white">
            {overallPercentage}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
