"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftWithoutLineIcon, ArrowRightWithoutLineIcon } from "../icons";
import { getStoredUser } from "../../lib/auth-helpers";
import { corporateDashboardService } from "../../lib/services";

interface TraitOverview {
    code: string;
    name: string;
    description: string | null;
    colorRgb: string;
    imageKey: string;
    characterImage: string;
    count: number;
    percentage: number;
    keyStrengths: any[];
    roleAlignment: any[];
    keyBehaviors: any[];
}

interface OverviewData {
    totalWithTraits: number;
    distinctTraits: number;
    traits: TraitOverview[];
}

const resolveUserEmail = () =>
    (typeof window !== "undefined"
        ? sessionStorage.getItem("userEmail") ||
          localStorage.getItem("userEmail") ||
          getStoredUser().email
        : "") || "";

// Trait content (strengths / roles / behaviours) can be stored as plain
// strings, comma-joined strings, or { name | title | desc } objects. Flatten
// any of those shapes into a clean string list for display.
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

const PersonalityOverview: React.FC = () => {
    const router = useRouter();
    const [data, setData] = useState<OverviewData | null>(null);
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
                const res = await corporateDashboardService.getPersonalityOverview(email);
                if (active) setData(res as OverviewData);
            } catch (e: any) {
                if (active) setError(e?.message || "Failed to load personality overview");
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    const traits = useMemo(() => data?.traits ?? [], [data]);
    const total = data?.totalWithTraits ?? 0;
    const topTrait = traits[0];

    return (
        <div className="flex flex-col gap-6 font-['Haskoy'] p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div>
                <div className="flex items-center text-xs text-black dark:text-white mb-1.5 font-normal flex-wrap">
                    <span onClick={() => router.push("/corporate/dashboard")} className="cursor-pointer hover:underline opacity-70">Dashboard</span>
                    <span className="mx-2 text-gray-400 dark:text-gray-600">
                        <ArrowRightWithoutLineIcon className="w-3 h-3 text-black dark:text-white" />
                    </span>
                    <span className="text-brand-green font-semibold">Personality Overview</span>
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
                            Workforce Personality Overview
                        </h1>
                        <p className="text-sm text-[#19211C]/70 dark:text-white/60 mt-1">
                            How your people are distributed across personality types — at a glance, for leadership.
                        </p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
                </div>
            ) : error ? (
                <div className="glass-card dark:bg-white/[0.08] rounded-[24px] p-12 text-center text-[#19211C] dark:text-white">
                    {error}
                </div>
            ) : traits.length === 0 ? (
                <div className="glass-card dark:bg-white/[0.08] rounded-[24px] p-12 text-center text-[#19211C] dark:text-white opacity-70">
                    No personality data yet. Once employees complete their assessments, their personality types will appear here.
                </div>
            ) : (
                <>
                    {/* Summary strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <SummaryCard label="Employees Assessed" value={String(total)} />
                        <SummaryCard label="Personality Types" value={String(data?.distinctTraits ?? traits.length)} />
                        <SummaryCard
                            label="Most Common Type"
                            value={topTrait?.name || "—"}
                            accent={topTrait?.colorRgb}
                            sub={topTrait ? `${topTrait.count} ${topTrait.count === 1 ? "person" : "people"} · ${topTrait.percentage}%` : undefined}
                        />
                    </div>

                    {/* Distribution bar */}
                    <div className="glass-card shadow-none dark:bg-white/[0.08] rounded-[24px] p-6">
                        <h3 className="font-semibold text-[clamp(16px,1.04vw,20px)] text-[#19211C] dark:text-white mb-4">
                            Distribution Across the Company
                        </h3>
                        <div className="flex w-full h-4 rounded-full overflow-hidden bg-gray-100 dark:bg-white/5">
                            {traits.map((t) => (
                                <div
                                    key={t.code}
                                    title={`${t.name} — ${t.count} (${t.percentage}%)`}
                                    style={{ width: `${Math.max(t.percentage, total > 0 ? 1 : 0)}%`, backgroundColor: t.colorRgb }}
                                    className="h-full first:rounded-l-full last:rounded-r-full transition-all"
                                />
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                            {traits.map((t) => (
                                <div key={t.code} className="flex items-center gap-2 text-[13px] text-[#19211C] dark:text-white">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.colorRgb }} />
                                    <span className="font-medium">{t.name}</span>
                                    <span className="opacity-60">{t.count} · {t.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Comparison cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {traits.map((t) => (
                            <TraitCard key={t.code} trait={t} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const SummaryCard = ({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) => (
    <div className="glass-card shadow-none dark:bg-white/[0.08] rounded-[24px] p-6 flex flex-col gap-2">
        <span className="text-[13px] font-normal text-[#19211C]/70 dark:text-white/60">{label}</span>
        <div className="flex items-center gap-2">
            {accent && <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: accent }} />}
            <span className="font-semibold text-[clamp(20px,1.6vw,28px)] text-[#150089] dark:text-[#1ED36A] leading-tight">{value}</span>
        </div>
        {sub && <span className="text-[13px] text-[#19211C]/70 dark:text-white/60">{sub}</span>}
    </div>
);

const TraitCard = ({ trait }: { trait: TraitOverview }) => {
    const strengths = toList(trait.keyStrengths).slice(0, 5);
    const roles = toList(trait.roleAlignment).slice(0, 6);
    const behaviors = toList(trait.keyBehaviors).slice(0, 4);

    return (
        <div className="glass-card shadow-none dark:bg-white/[0.08] rounded-[24px] p-6 flex flex-col gap-5 h-full">
            {/* Header: character + name + count */}
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
                            {trait.count === 1 ? "employee" : "employees"} · {trait.percentage}%
                        </span>
                    </div>
                    {trait.description && (
                        <p className="text-[13px] text-[#19211C]/80 dark:text-white/70 mt-2 leading-snug line-clamp-3">
                            {trait.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Key strengths */}
            {strengths.length > 0 && (
                <div>
                    <h4 className="text-[13px] font-semibold uppercase tracking-wide text-[#150089] dark:text-[#1ED36A] mb-2">Key Strengths</h4>
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

            {/* Role alignment */}
            {roles.length > 0 && (
                <div>
                    <h4 className="text-[13px] font-semibold uppercase tracking-wide text-[#150089] dark:text-[#1ED36A] mb-2">Best-Fit Roles</h4>
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

            {/* Key behaviours */}
            {behaviors.length > 0 && (
                <div>
                    <h4 className="text-[13px] font-semibold uppercase tracking-wide text-[#150089] dark:text-[#1ED36A] mb-2">Typical Behaviours</h4>
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

export default PersonalityOverview;
