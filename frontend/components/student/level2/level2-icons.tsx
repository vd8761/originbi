import React from "react";

type IconProps = { className?: string; style?: React.CSSProperties };
const _s = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.0,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
};

export const ChevronDownIcon = ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" {..._s}><polyline points="6 9 12 15 18 9" /></svg>
);

export const CheckIcon = ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" {..._s} strokeWidth={2.4}><polyline points="20 6 9 17 4 12" /></svg>
);

export const CheckCircleIcon = ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.16" />
        <path d="M8 12.2l2.6 2.6L16 9.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
);

export const ClockIcon = ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" {..._s}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></svg>
);

export const ArrowRightIcon = ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" {..._s}><line x1="4" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" /></svg>
);

export const ArrowLeftIcon = ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" {..._s}><line x1="20" y1="12" x2="5" y2="12" /><polyline points="11 6 5 12 11 18" /></svg>
);

export const FlagFinishIcon = ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" {..._s}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></svg>
);

export const InfoIcon = ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" {..._s}><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><line x1="12" y1="8" x2="12" y2="8.01" /></svg>
);

export const WarnIcon = ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" {..._s}><path d="M10.3 3.8L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13.5" /><line x1="12" y1="17" x2="12" y2="17.01" /></svg>
);

export const LockIcon = ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" {..._s}><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></svg>
);

export const ModuleIcon = ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" {..._s}>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
);

export const StepIcon = ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" {..._s}>
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth={3} />
        <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth={3} />
        <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth={3} />
    </svg>
);

export const TrialIcon = ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" {..._s}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
    </svg>
);
