"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftWithoutLineIcon, ArrowRightWithoutLineIcon } from "../icons";
import { getStoredUser } from "../../lib/auth-helpers";
import { corporateDashboardService } from "../../lib/services";

// ---------- Types ----------
interface Bucket {
    key: "action" | "people" | "steady" | "careful";
    label: string;
    tagline: string;
    count: number;
    percentage: number;
    color: string;
}

interface TraitCharacter {
    id: number;
    code: string;
    name: string;
    description: string | null;
    colorRgb: string;
    imageKey: string;
    characterImage: string;
    count: number;
    percentage: number;
    bucket: Bucket["key"] | null;
    keyStrengths: any[];
    roleAlignment: any[];
    keyBehaviors: any[];
}

interface Reliability {
    reliable: number;
    borderline?: number;
    unreliable: number;
    reliablePercentage: number;
    tone: "good" | "mixed" | "weak";
    note: string;
}

interface BehaviouralCohort {
    totalAssessed: number;
    verdict: string;
    buckets: Bucket[];
    traits: TraitCharacter[];
    strengths: string[];
    watchouts: string[];
    reliability: Reliability;
}

interface ThemeDistributionSlice {
    key: "none" | "slight" | "moderate" | "strong";
    label: string;
    count: number;
    percentage: number;
    color: string;
}

interface ThemeCard {
    code: string;
    label: string;
    totalResponses: number;
    distribution: ThemeDistributionSlice[];
    dominantLevel: "none" | "slight" | "moderate" | "strong";
    verdict: string;
    stumbleWords: { word: string; count: number }[];
    reliablePercentage: number;
}

interface InnerPatternsCohort {
    totalCompleted: number;
    verdict: string;
    themes: ThemeCard[];
    reliability: Reliability;
}

// ---------- Helpers ----------
const resolveUserEmail = () =>
    (typeof window !== "undefined"
        ? sessionStorage.getItem("userEmail") ||
          localStorage.getItem("userEmail") ||
          getStoredUser().email
        : "") || "";

const toList = (raw: any[]): string[] => {
    if (!Array.isArray(raw)) return [];
    const out: string[] = [];
    for (const item of raw) {
        if (!item) continue;
        if (typeof item === "string") {
            item.split(/\s*[,;]\s*/).forEach((s) => s.trim() && out.push(s.trim()));
        } else if (typeof item === "object") {
            const v = item.name || item.title || item.desc || item.description || "";
            if (v) out.push(String(v));
        }
    }
    return out;
};

// ---------- Page ----------
type TabKey = "behavioural" | "inner";

const PersonalityOverview: React.FC = () => {
    const router = useRouter();
    const [tab, setTab] = useState<TabKey>("behavioural");

    const [behavioural, setBehavioural] = useState<BehaviouralCohort | null>(null);
    const [inner, setInner] = useState<InnerPatternsCohort | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        (async () => {
            const email = resolveUserEmail();
            if (!email) {
                setError("Unable to identify your account. Please sign in again.");
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const [b, i] = await Promise.all([
                    corporateDashboardService.getBehaviouralCohort(email).catch(() => null),
                    corporateDashboardService.getInnerPatternsCohort(email).catch(() => null),
                ]);
                if (active) {
                    setBehavioural(b);
                    setInner(i);
                }
            } catch (e: any) {
                if (active) setError(e?.message || "Failed to load workforce overview");
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    return (
        <div className="flex flex-col gap-6 font-['Haskoy'] p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div>
                <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
                    <span onClick={() => router.push("/corporate/dashboard")} className="cursor-pointer hover:underline opacity-70">Dashboard</span>
                    <span className="mx-2 text-gray-400 dark:text-gray-600">
                        <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
                    </span>
                    <span className="text-brand-green font-semibold">Workforce Overview</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/corporate/dashboard")}
                        className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeftWithoutLineIcon className="w-6 h-6 text-[#150089] dark:text-white" />
                    </button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-[#150089] dark:text-white leading-tight">
                            Workforce Overview
                        </h1>
                        <p className="text-sm text-[#19211C]/70 dark:text-white/60 mt-1">
                            What kind of people are in your applicant pool - and what their gut-level patterns look like.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab strip */}
            <div className="flex gap-2 border-b border-black/10 dark:border-white/10">
                <TabButton active={tab === "behavioural"} onClick={() => setTab("behavioural")}>
                    Behavioural Personality
                </TabButton>
                <TabButton active={tab === "inner"} onClick={() => setTab("inner")}>
                    Inner Patterns
                </TabButton>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
                </div>
            ) : error ? (
                <div className="glass-card dark:bg-white/[0.08] rounded-[24px] p-12 text-center text-[#19211C] dark:text-white">
                    {error}
                </div>
            ) : tab === "behavioural" ? (
                <BehaviouralPanel data={behavioural} />
            ) : (
                <InnerPanel data={inner} />
            )}
        </div>
    );
};

const TabButton = ({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) => (
    <button
        onClick={onClick}
        className={`px-5 py-3 text-[14px] font-semibold transition-colors border-b-2 -mb-px ${
            active
                ? "border-[#1ED36A] text-[#150089] dark:text-white"
                : "border-transparent text-[#19211C]/60 dark:text-white/60 hover:text-[#19211C] dark:hover:text-white"
        }`}
    >
        {children}
    </button>
);

// =========================================================================
// Behavioural Panel
// =========================================================================
const BehaviouralPanel: React.FC<{ data: BehaviouralCohort | null }> = ({ data }) => {
    if (!data || data.totalAssessed === 0) {
        return (
            <div className="glass-card dark:bg-white/[0.08] rounded-[24px] p-12 text-center text-[#19211C] dark:text-white opacity-70">
                No behavioural data yet. Once people complete their assessments, their personality patterns will show up here.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Hero / verdict */}
            <div className="glass-card shadow-none dark:bg-white/[0.08] rounded-[24px] p-6 flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex-1">
                    <div className="text-[13px] uppercase tracking-wider text-[#19211C]/60 dark:text-white/60 mb-2">
                        At a glance
                    </div>
                    <h2 className="text-[clamp(20px,1.5vw,28px)] font-semibold text-[#150089] dark:text-white leading-snug mb-3">
                        {data.verdict}
                    </h2>
                    <div className="text-[14px] text-[#19211C]/80 dark:text-white/80">
                        Based on <span className="font-semibold">{data.totalAssessed}</span> {data.totalAssessed === 1 ? "person who has" : "people who have"} completed the behavioural check.
                    </div>
                </div>
                <ReliabilityBanner reliability={data.reliability} />
            </div>

            {/* Style buckets */}
            <div className="glass-card shadow-none dark:bg-white/[0.08] rounded-[24px] p-6">
                <h3 className="font-semibold text-[clamp(16px,1.04vw,20px)] text-[#19211C] dark:text-white mb-1">
                    What kind of energy is in this group?
                </h3>
                <p className="text-[13px] text-[#19211C]/60 dark:text-white/60 mb-5">
                    Every person sits naturally in one of four styles. Here's the mix.
                </p>

                {/* Stacked bar */}
                <div className="flex w-full h-5 rounded-full overflow-hidden bg-gray-100 dark:bg-white/5 mb-5">
                    {data.buckets.map((b) => (
                        <div
                            key={b.key}
                            title={`${b.label} - ${b.count} (${b.percentage}%)`}
                            style={{
                                width: `${Math.max(b.percentage, b.count > 0 ? 1 : 0)}%`,
                                backgroundColor: b.color,
                            }}
                            className="h-full first:rounded-l-full last:rounded-r-full transition-all"
                        />
                    ))}
                </div>

                {/* Bucket cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {data.buckets.map((b) => (
                        <div
                            key={b.key}
                            className="rounded-2xl p-4 border"
                            style={{
                                borderColor: `${b.color}40`,
                                backgroundColor: `${b.color}0D`,
                            }}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color }} />
                                <span className="font-semibold text-[14px] text-[#19211C] dark:text-white">{b.label}</span>
                            </div>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-semibold text-[clamp(22px,1.6vw,28px)] text-[#150089] dark:text-[#1ED36A] leading-none">
                                    {b.count}
                                </span>
                                <span className="text-[13px] text-[#19211C]/70 dark:text-white/60">
                                    {b.count === 1 ? "person" : "people"} · {b.percentage}%
                                </span>
                            </div>
                            <p className="text-[12px] leading-snug text-[#19211C]/80 dark:text-white/70">
                                {b.tagline}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Strengths + watchouts */}
            {(data.strengths.length > 0 || data.watchouts.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.strengths.length > 0 && (
                        <CalloutCard
                            tone="positive"
                            title="What this group is naturally good at"
                            items={data.strengths}
                        />
                    )}
                    {data.watchouts.length > 0 && (
                        <CalloutCard
                            tone="warning"
                            title="What to watch out for"
                            items={data.watchouts}
                        />
                    )}
                </div>
            )}

            {/* Character cards */}
            <div>
                <h3 className="font-semibold text-[clamp(16px,1.04vw,20px)] text-[#19211C] dark:text-white mb-1 mt-2">
                    The people in your group
                </h3>
                <p className="text-[13px] text-[#19211C]/60 dark:text-white/60 mb-4">
                    Each character is a recognisable personality pattern. Here's who turned up and how many.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {data.traits.map((t) => (
                        <TraitCard key={t.code} trait={t} />
                    ))}
                </div>
            </div>
        </div>
    );
};

const ReliabilityBanner: React.FC<{ reliability: Reliability }> = ({ reliability }) => {
    const toneClass =
        reliability.tone === "good"
            ? "border-[#1ED36A]/40 bg-[#1ED36A]/10"
            : reliability.tone === "mixed"
            ? "border-[#F1C40F]/40 bg-[#F1C40F]/10"
            : "border-[#E74C3C]/40 bg-[#E74C3C]/10";
    const dotClass =
        reliability.tone === "good"
            ? "bg-[#1ED36A]"
            : reliability.tone === "mixed"
            ? "bg-[#F1C40F]"
            : "bg-[#E74C3C]";
    return (
        <div className={`rounded-2xl border p-4 min-w-[260px] ${toneClass}`}>
            <div className="flex items-center gap-2 mb-1">
                <span className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
                <span className="text-[13px] font-semibold uppercase tracking-wide text-[#19211C] dark:text-white">
                    How much to trust this
                </span>
            </div>
            <div className="text-[14px] text-[#19211C] dark:text-white mb-1">
                <span className="font-semibold">{reliability.reliablePercentage}%</span> of responses look honest and considered.
            </div>
            <div className="text-[12px] text-[#19211C]/70 dark:text-white/70 leading-snug">
                {reliability.note}
            </div>
        </div>
    );
};

const CalloutCard: React.FC<{
    tone: "positive" | "warning";
    title: string;
    items: string[];
}> = ({ tone, title, items }) => {
    const accent = tone === "positive" ? "#1ED36A" : "#F39C12";
    return (
        <div
            className="rounded-2xl border p-5"
            style={{ borderColor: `${accent}40`, backgroundColor: `${accent}0D` }}
        >
            <h4 className="text-[13px] font-semibold uppercase tracking-wide mb-3" style={{ color: accent }}>
                {title}
            </h4>
            <ul className="space-y-2">
                {items.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-[14px] text-[#19211C] dark:text-white leading-snug">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />
                        <span>{s}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const TraitCard = ({ trait }: { trait: TraitCharacter }) => {
    const strengths = toList(trait.keyStrengths).slice(0, 5);
    const roles = toList(trait.roleAlignment).slice(0, 6);
    const behaviors = toList(trait.keyBehaviors).slice(0, 4);

    return (
        <div className="glass-card shadow-none dark:bg-white/[0.08] rounded-[24px] p-6 flex flex-col gap-5 h-full">
            <div className="flex items-start gap-4">
                <div className="relative w-[88px] h-[88px] shrink-0">
                    <div
                        className="absolute inset-0 rounded-full blur-2xl"
                        style={{ backgroundColor: trait.colorRgb, opacity: 0.2 }}
                    />
                    <img
                        src={trait.characterImage}
                        alt={trait.name}
                        className="relative z-10 w-full h-full object-contain drop-shadow-lg"
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                        }}
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: trait.colorRgb }} />
                        <h3 className="font-semibold text-[clamp(16px,1.1vw,20px)] text-[#19211C] dark:text-white leading-tight truncate">
                            {trait.name}
                        </h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-[clamp(22px,1.6vw,28px)] text-[#150089] dark:text-[#1ED36A] leading-none">
                            {trait.count}
                        </span>
                        <span className="text-[13px] text-[#19211C]/70 dark:text-white/60">
                            {trait.count === 1 ? "person" : "people"} · {trait.percentage}%
                        </span>
                    </div>
                    {trait.description && (
                        <p className="text-[13px] text-[#19211C]/80 dark:text-white/70 mt-2 leading-snug line-clamp-3">
                            {trait.description}
                        </p>
                    )}
                </div>
            </div>

            {strengths.length > 0 && (
                <div>
                    <h4 className="text-[13px] font-semibold uppercase tracking-wide text-[#150089] dark:text-[#1ED36A] mb-2">What they bring</h4>
                    <ul className="space-y-1.5">
                        {strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-[14px] text-[#19211C] dark:text-white leading-snug">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-[#19211C] dark:bg-white shrink-0" />
                                <span>{s}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {roles.length > 0 && (
                <div>
                    <h4 className="text-[13px] font-semibold uppercase tracking-wide text-[#150089] dark:text-[#1ED36A] mb-2">Where they fit best</h4>
                    <div className="flex flex-wrap gap-2">
                        {roles.map((r, i) => (
                            <span
                                key={i}
                                className="px-3 py-1 rounded-full text-[12px] font-medium text-[#19211C] dark:text-white border"
                                style={{ borderColor: trait.colorRgb, backgroundColor: `${trait.colorRgb}1A` }}
                            >
                                {r}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {behaviors.length > 0 && (
                <div>
                    <h4 className="text-[13px] font-semibold uppercase tracking-wide text-[#150089] dark:text-[#1ED36A] mb-2">How they show up</h4>
                    <ul className="space-y-1.5">
                        {behaviors.map((b, i) => (
                            <li key={i} className="flex items-start gap-2 text-[14px] text-[#19211C] dark:text-white leading-snug">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-[#19211C] dark:bg-white shrink-0" />
                                <span>{b}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// =========================================================================
// Inner Patterns Panel (Level 3 / IAT - plain English)
// =========================================================================
const InnerPanel: React.FC<{ data: InnerPatternsCohort | null }> = ({ data }) => {
    if (!data || data.totalCompleted === 0) {
        return (
            <div className="glass-card dark:bg-white/[0.08] rounded-[24px] p-12 text-center text-[#19211C] dark:text-white opacity-70">
                No inner-pattern data yet. Once people complete this section of the assessment, their gut-level patterns will show up here.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Hero */}
            <div className="glass-card shadow-none dark:bg-white/[0.08] rounded-[24px] p-6 flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex-1">
                    <div className="text-[13px] uppercase tracking-wider text-[#19211C]/60 dark:text-white/60 mb-2">
                        At a glance
                    </div>
                    <h2 className="text-[clamp(20px,1.5vw,28px)] font-semibold text-[#150089] dark:text-white leading-snug mb-3">
                        {data.verdict}
                    </h2>
                    <div className="text-[14px] text-[#19211C]/80 dark:text-white/80">
                        Based on <span className="font-semibold">{data.totalCompleted}</span> {data.totalCompleted === 1 ? "person who has" : "people who have"} finished the gut-reaction check.
                    </div>
                    <p className="text-[12px] text-[#19211C]/60 dark:text-white/60 mt-3 leading-snug max-w-xl">
                        This part of the assessment measures the snap-second associations people make before thinking. It is a sensitive picture of the group's mindset - not a judgement of any individual.
                    </p>
                </div>
                <ReliabilityBanner reliability={data.reliability} />
            </div>

            {/* Theme cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.themes.map((t) => (
                    <ThemeCardView key={t.code} theme={t} />
                ))}
            </div>
        </div>
    );
};

const ThemeCardView: React.FC<{ theme: ThemeCard }> = ({ theme }) => {
    return (
        <div className="glass-card shadow-none dark:bg-white/[0.08] rounded-[24px] p-6 flex flex-col gap-4">
            {/* Header */}
            <div>
                <div className="text-[13px] uppercase tracking-wider text-[#19211C]/60 dark:text-white/60 mb-1">
                    Theme
                </div>
                <h3 className="font-semibold text-[clamp(16px,1.1vw,20px)] text-[#19211C] dark:text-white leading-tight">
                    {theme.label}
                </h3>
            </div>

            {/* Verdict */}
            <p className="text-[14px] text-[#19211C] dark:text-white leading-snug">
                {theme.verdict}
            </p>

            {/* Distribution bar */}
            <div>
                <div className="flex w-full h-4 rounded-full overflow-hidden bg-gray-100 dark:bg-white/5">
                    {theme.distribution.map((slice) => (
                        <div
                            key={slice.key}
                            title={`${slice.label} - ${slice.count} (${slice.percentage}%)`}
                            style={{
                                width: `${Math.max(slice.percentage, slice.count > 0 ? 1 : 0)}%`,
                                backgroundColor: slice.color,
                            }}
                            className="h-full first:rounded-l-full last:rounded-r-full transition-all"
                        />
                    ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                    {theme.distribution.map((slice) => (
                        <div key={slice.key} className="flex items-center gap-2 text-[12px] text-[#19211C] dark:text-white">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                            <span className="font-medium">{slice.label}</span>
                            <span className="opacity-60">{slice.count} · {slice.percentage}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stumble words */}
            {theme.stumbleWords.length > 0 && (
                <div>
                    <div className="text-[13px] font-semibold uppercase tracking-wide text-[#150089] dark:text-[#1ED36A] mb-2">
                        Words your group hesitated on
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {theme.stumbleWords.map((w) => (
                            <span
                                key={w.word}
                                className="px-3 py-1 rounded-full text-[12px] font-medium text-[#19211C] dark:text-white border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05]"
                                title={`${w.count} ${w.count === 1 ? "person" : "people"} hesitated on this word`}
                            >
                                {w.word}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="text-[12px] text-[#19211C]/60 dark:text-white/60">
                Based on {theme.totalResponses} {theme.totalResponses === 1 ? "response" : "responses"} · {theme.reliablePercentage}% looked clean.
            </div>
        </div>
    );
};

export default PersonalityOverview;
