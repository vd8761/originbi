/* Icon set for the Metaphor exam page (ported from the design bundle). */
import React from "react";

type IconProps = { className?: string };
const _s = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
};

export const MicIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" {..._s}>
        <rect x="9" y="2.5" width="6" height="12" rx="3" />
        <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
        <line x1="12" y1="17.5" x2="12" y2="21" /><line x1="8.5" y1="21" x2="15.5" y2="21" />
    </svg>
);
export const MicOffIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" {..._s}>
        <path d="M9 9v-3.5a3 3 0 0 1 5.5-1.7" /><path d="M15 11.3V11" />
        <path d="M17 11a5 5 0 0 1-.4 2M12 17a6.5 6.5 0 0 1-6.5-6.5" />
        <line x1="12" y1="17.5" x2="12" y2="21" /><line x1="8.5" y1="21" x2="15.5" y2="21" />
        <line x1="3" y1="3" x2="21" y2="21" />
    </svg>
);
export const StopIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2.5" /></svg>
);
export const GlobeIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" {..._s}>
        <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18" />
    </svg>
);
export const ChevronDownIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" {..._s}><polyline points="6 9 12 15 18 9" /></svg>
);
export const CheckIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" {..._s} strokeWidth={2.4}><polyline points="20 6 9 17 4 12" /></svg>
);
export const CheckCircleIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.16" />
        <path d="M8 12.2l2.6 2.6L16 9.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
);
export const ExpandIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" {..._s}>
        <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
    </svg>
);
export const CloseIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" {..._s}><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
);
export const TrashIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" {..._s}>
        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
);
export const ReRecordIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" {..._s}>
        <path d="M20 11a8 8 0 1 0-1.6 5.5" /><polyline points="20 5 20 11 14 11" />
    </svg>
);
export const StartOverIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" {..._s}>
        <path d="M4 12a8 8 0 1 1 2.3 5.6" /><polyline points="4 18 4 12 10 12" />
    </svg>
);
export const CaptureIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" {..._s}><path d="M6 3h12v18l-6-4-6 4V3z" /></svg>
);
export const ClockIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" {..._s}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></svg>
);
export const ArrowRightIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" {..._s}><line x1="4" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" /></svg>
);
export const ArrowLeftIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" {..._s}><line x1="20" y1="12" x2="5" y2="12" /><polyline points="11 6 5 12 11 18" /></svg>
);
export const FlagFinishIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" {..._s}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></svg>
);
export const ImageOffIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" {..._s}>
        <path d="M21 15l-5-5L9 17" /><path d="M21 5v12a2 2 0 0 1-2 2H7" /><path d="M3 7v10a2 2 0 0 0 2 2" /><circle cx="9" cy="9" r="1.5" /><line x1="3" y1="3" x2="21" y2="21" />
    </svg>
);
export const WifiOffIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" {..._s}>
        <path d="M2 8.5a16 16 0 0 1 7-3.4M22 8.5a16 16 0 0 0-5-2.9" /><path d="M5 12a11 11 0 0 1 3-1.9M19 12a11 11 0 0 0-4-2.3" /><path d="M8.5 15.5a6 6 0 0 1 5.5-0.6" /><line x1="12" y1="19" x2="12" y2="19.01" /><line x1="2" y1="2" x2="22" y2="22" />
    </svg>
);
export const InfoIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" {..._s}><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><line x1="12" y1="8" x2="12" y2="8.01" /></svg>
);
export const WarnIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" {..._s}><path d="M10.3 3.8L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13.5" /><line x1="12" y1="17" x2="12" y2="17.01" /></svg>
);
export const LockIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" {..._s}><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></svg>
);
