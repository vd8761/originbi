"use client";

/**
 * OriginBI – Behavioral Intelligence Architecture & Data Flow
 * Next.js (App Router) + Tailwind CSS + framer-motion
 *   npm i framer-motion
 * Usage: <div className="h-screen"><OriginBIArchitecture /></div>
 */

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/* ───────────────────────── data ───────────────────────── */

const getAppIconUrl = (name: string) => {
  if (name === 'google_drive') return 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg';
  const map: Record<string, string> = {
    slack: 'slack.com',
    jira: 'atlassian.com',
    microsoft_teams: 'teams.microsoft.com',
    clickup: 'clickup.com',
    zoho_crm: 'zoho.com',
    trello: 'trello.com',
    monday: 'monday.com',
    office_365: 'office.com',
  };
  const domain = map[name] || `${name.replace('_', '')}.com`;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
};

const C = { blue: "#3B82F6", orange: "#F97316", violet: "#8B5CF6", green: "#10B981", pink: "#EC4899", cyan: "#06B6D4" };

const TRAITS = ["Focus", "Drive", "Courage", "Agility", "Resilience", "Systemic Alignment", "Pace", "Expression", "Empathy", "Curiosity", "Discipline", "Collaboration", "Ownership", "Adaptability"];

type TNode = {
  id: string; label: string; sub?: string; kind: "pill" | "metrics" | "traits" | "connectors";
  color: string; children?: TNode[]; metrics?: [string, string][]; traits?: any[]; chips?: string[];
};
const entityNode = (data: any, color: string): TNode => ({
  id: data.id, label: data.name, kind: "pill", color, sub: `${data.sampleVolume} tested`,
  children: [
    {
      id: `${data.id}-m`, label: "Key Metrics", kind: "metrics", color,
      metrics: data.metrics.map((m: any) => [m.label, m.value.toString()])
    },
    {
      id: `${data.id}-d`, label: "Behavioral Core", kind: "pill", color, sub: `${(data.discDistribution || data.traits ? Object.entries(data.traits || {}) : []).length || (data.discDistribution || []).length} profiles`,
      children: [{
        id: `${data.id}-t`, label: "Profile Counts", kind: "traits", color,
        traits: data.discDistribution || Object.entries(data.traits || {})
      }]
    },
    {
      id: `${data.id}-c`, label: "Active Workspace Connectors", kind: "pill", color: C.green, sub: `${data.connectedTools.length} connected`,
      children: [{ id: `${data.id}-cc`, label: "Connected workspaces", kind: "connectors", color: C.green, chips: data.connectedTools }]
    }
  ]
});

const INITIAL_TREE: TNode[] = [
  {
    id: "students", label: "Students", sub: "School + college cohorts", kind: "pill", color: C.blue,
    children: [
      {
        id: "school", label: "School (pickmycareer)", kind: "pill", color: C.blue,
        children: [
          entityNode({
            id: "rkmb100c-s2", name: "RKMB100C-S2", subtitle: "School Student", sampleVolume: 16,
            metrics: [{ label: "Assessments Completed", value: 16 }, { label: "Top Profile", value: "CD - Analytical Leader" }],
            discDistribution: [["CD - Analytical Leader", 4], ["SC - Supportive Coordinator", 4], ["SI - Supportive Influencer", 3], ["CS - Structured Supporter", 3], ["DS - Driven Stabilizer", 2]],
            connectedTools: ["OriginBI WebApp"]
          }, C.blue),
          entityNode({
            id: "ramakrishna-mission-school-t-nagar", name: "Ramakrishna Mission School, T Nagar.", subtitle: "School Student", sampleVolume: 12,
            metrics: [{ label: "Assessments Completed", value: 12 }, { label: "Top Profile", value: "CD - Analytical Leader" }],
            discDistribution: [["CD - Analytical Leader", 5], ["DC - Decisive Analyst", 3], ["CS - Structured Supporter", 2], ["IC - Creative Thinker", 2]],
            connectedTools: ["OriginBI WebApp"]
          }, C.blue)
        ],
      },
      {
        id: "college", label: "College (discover)", kind: "pill", color: C.cyan,
        children: [
          entityNode({
            id: "ksrct", name: "KSRCT", subtitle: "College Student", sampleVolume: 304,
            metrics: [{ label: "Assessments Completed", value: 304 }, { label: "Top Profile", value: "DC - Decisive Analyst" }],
            discDistribution: [["DC - Decisive Analyst", 57], ["CD - Analytical Leader", 47], ["SC - Supportive Coordinator", 38], ["SI - Supportive Influencer", 35], ["CS - Structured Supporter", 30], ["IC - Creative Thinker", 26], ["DS - Driven Stabilizer", 22]],
            connectedTools: ["OriginBI WebApp"]
          }, C.cyan),
          entityNode({
            id: "meenakshi-college", name: "MEENAKSHI COLLEGE OF ENGINEERING", subtitle: "College Student", sampleVolume: 254,
            metrics: [{ label: "Assessments Completed", value: 254 }, { label: "Top Profile", value: "DC - Decisive Analyst" }],
            discDistribution: [["DC - Decisive Analyst", 48], ["CD - Analytical Leader", 41], ["SC - Supportive Coordinator", 32], ["SI - Supportive Influencer", 28], ["CS - Structured Supporter", 25]],
            connectedTools: ["OriginBI WebApp"]
          }, C.cyan)
        ],
      },
    ],
  },
  {
    id: "corp", label: "Corporate & Executives (grow)", sub: "Enterprise workforce", kind: "pill", color: C.violet,
    children: [
      {
        id: "ent", label: "Enterprise Companies", kind: "pill", color: C.violet, sub: "Select a company",
        children: [
          entityNode({
            id: "infiniti-software", name: "Infiniti Software", subtitle: "Employee", sampleVolume: 6,
            metrics: [{ label: "Assessments Completed", value: 6 }, { label: "Top Profile", value: "CD - Analytical Leader" }],
            discDistribution: [["CD - Analytical Leader", 3], ["DC - Decisive Analyst", 2], ["IC - Creative Thinker", 1]],
            connectedTools: ["OriginBI WebApp"]
          }, C.violet),
          entityNode({
            id: "rk-mission-counseling", name: "RK Mission Counseling Teachers", subtitle: "Employee", sampleVolume: 2,
            metrics: [{ label: "Assessments Completed", value: 2 }, { label: "Top Profile", value: "CS - Structured Supporter" }],
            discDistribution: [["CS - Structured Supporter", 1], ["IC - Creative Thinker", 1]],
            connectedTools: ["OriginBI WebApp"]
          }, C.violet)
        ],
      },
    ],
  },
];

const DOCK = [
  { name: "Google Drive", id: "google_drive", ab: "GD", color: "#1FA463" }, { name: "Slack", id: "slack", ab: "S", color: "#4A154B" },
  { name: "ClickUp", id: "clickup", ab: "CU", color: "#7B68EE" }, { name: "Trello", id: "trello", ab: "T", color: "#0079BF" },
  { name: "Monday CRM", id: "monday", ab: "M", color: "#FF3D57" }, { name: "Zoho CRM", id: "zoho_crm", ab: "Z", color: "#E42527" },
  { name: "Atlassian / Jira", id: "jira", ab: "J", color: "#2684FF" }, { name: "Microsoft Teams", id: "microsoft_teams", ab: "MT", color: "#5059C9" },
  { name: "Office 365", id: "office_365", ab: "O", color: "#EB3C00" },
];

type Tone = "good" | "warn" | "risk" | "info";
interface Persona {
  id: string; role: string; focus: string; color: string; initials: string; prompt: string;
  metrics: { label: string; value: string; pct: number; tone: Tone }[];
  takeaways: string[];
}

const INITIAL_PERSONAS: Persona[] = [
  {
    id: "rkmb100c-s2", role: "RKMB100C-S2", focus: "School Student", color: C.blue, initials: "RK",
    prompt: "Show me the distribution and top profiles for RKMB100C-S2.",
    metrics: [
      { label: "Assessments Completed", value: "16", pct: 100, tone: "good" },
      { label: "Top Profile", value: "CD - Analytical Leader", pct: 85, tone: "info" },
      { label: "Top Trait (Resilience)", value: "91", pct: 91, tone: "good" },
      { label: "Adaptability", value: "91", pct: 91, tone: "good" },
    ],
    takeaways: ["Primary DISC profile is CD with 4 students, followed by SC.", "High resilience and adaptability observed in this group.", "Focus and Systemic Alignment are also strong indicators."],
  },
  {
    id: "ramakrishna-mission-school-t-nagar", role: "Ramakrishna Mission School", focus: "School Student", color: C.blue, initials: "RM",
    prompt: "Show me the distribution and top profiles for Ramakrishna Mission School, T Nagar.",
    metrics: [
      { label: "Assessments Completed", value: "12", pct: 100, tone: "good" },
      { label: "Top Profile", value: "CD - Analytical Leader", pct: 80, tone: "info" },
      { label: "Top Trait (Empathy)", value: "54", pct: 54, tone: "good" },
      { label: "Resilience", value: "41", pct: 41, tone: "warn" },
    ],
    takeaways: ["Primary DISC profiles are evenly split among CD, CS, SC, SI, ID.", "Empathy and Resilience are the leading behavioral traits.", "Drive and Courage are relatively lower compared to other schools."],
  },
  {
    id: "ksrct", role: "KSRCT", focus: "College Student", color: C.violet, initials: "KS",
    prompt: "Show me the distribution and top profiles for KSRCT.",
    metrics: [
      { label: "Assessments Completed", value: "304", pct: 100, tone: "good" },
      { label: "Top Profile", value: "DC - Decisive Analyst", pct: 90, tone: "info" },
      { label: "Top Trait (Drive)", value: "1586", pct: 95, tone: "good" },
      { label: "Empathy", value: "1570", pct: 94, tone: "good" },
    ],
    takeaways: ["DC is the dominant profile (57 students), closely followed by CD (47).", "Very strong collective Drive, Empathy, and Focus.", "Ownership is the lowest trait across the student body."],
  },
  {
    id: "meenakshi-college", role: "MEENAKSHI COLLEGE OF ENG & TECH", focus: "College Student", color: C.violet, initials: "MC",
    prompt: "Show me the distribution and top profiles for MEENAKSHI COLLEGE OF ENGINEERING AND TECHNOLOGY.",
    metrics: [
      { label: "Assessments Completed", value: "254", pct: 100, tone: "good" },
      { label: "Top Profile", value: "DC - Decisive Analyst", pct: 90, tone: "info" },
      { label: "Top Trait (Drive)", value: "1444", pct: 95, tone: "good" },
      { label: "Empathy", value: "1293", pct: 90, tone: "good" },
    ],
    takeaways: ["DC and CD are the most prominent profiles.", "High Drive and Empathy scores indicate a motivated and socially aware group.", "Agility and Resilience are areas for potential development."],
  },
  {
    id: "infiniti-software", role: "Infiniti Software", focus: "Employee", color: C.orange, initials: "IS",
    prompt: "Show me the distribution and top profiles for Infiniti Software.",
    metrics: [
      { label: "Assessments Completed", value: "6", pct: 100, tone: "good" },
      { label: "Top Profile", value: "CD - Analytical Leader", pct: 75, tone: "info" },
      { label: "Top Trait (Focus)", value: "33", pct: 85, tone: "good" },
      { label: "Empathy", value: "33", pct: 85, tone: "good" },
    ],
    takeaways: ["CD is the leading profile among the team.", "Focus and Empathy are perfectly balanced as the strongest traits.", "Agility is the lowest scoring behavioral trait."],
  },
  {
    id: "rk-mission-counseling", role: "RK Mission Counseling Teachers", focus: "Employee", color: C.orange, initials: "RK",
    prompt: "Show me the distribution and top profiles for RK Mission Counseling Teachers.",
    metrics: [
      { label: "Assessments Completed", value: "2", pct: 100, tone: "good" },
      { label: "Top Profile", value: "CS - Structured Supporter", pct: 80, tone: "info" },
      { label: "Top Trait (Empathy)", value: "12", pct: 90, tone: "good" },
      { label: "Expression", value: "10", pct: 85, tone: "good" },
    ],
    takeaways: ["Profiles observed are ID and CS.", "As expected for counselors, Empathy is the highest trait.", "Ownership and Agility are relatively low in this small sample."],
  },
];

const TONE: Record<Tone, string> = { good: "#10B981", warn: "#F59E0B", risk: "#F43F5E", info: "#0EA5E9" };

/* ───────────────────────── layout ───────────────────────── */

const W = 250, GAP = 18, STEP = 350, ENGINE = { x: -140, y: -80, w: 280, h: 160 };
const MIN_K = 0.2, MAX_K = 2.5;
const PERSONA_X = 400;
const rightEdge = (d: number) => -250 - (d - 1) * STEP;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const heightOf = (n: TNode) =>
  n.kind === "pill" ? 56
  : n.kind === "metrics" ? 44 + Math.ceil(n.metrics!.length / 2) * 42
  : n.kind === "traits" ? 46 + TRAITS.length * 22
  : 44 + Math.ceil(n.chips!.length / 2) * 32;

const kidsOf = (n: TNode, open: Set<string>) => (open.has(n.id) && n.children ? n.children : []);

function measure(n: TNode, open: Set<string>): number {
  const kids = kidsOf(n, open);
  if (!kids.length) return heightOf(n);
  const tot = kids.reduce((a, k) => a + measure(k, open), 0) + GAP * (kids.length - 1);
  return Math.max(heightOf(n), tot);
}

interface Pos { x: number; cy: number; w: number; h: number }
interface Vis { n: TNode; parent: string }

function place(n: TNode, depth: number, top: number, open: Set<string>, pos: Record<string, Pos>, vis: Vis[], parent: string) {
  const th = measure(n, open);
  const kids = kidsOf(n, open);
  let cy = top + th / 2;
  if (kids.length) {
    const tot = kids.reduce((a, k) => a + measure(k, open), 0) + GAP * (kids.length - 1);
    let c = top + (th - tot) / 2;
    const centers: number[] = [];
    kids.forEach((k) => { place(k, depth + 1, c, open, pos, vis, n.id); centers.push(pos[k.id].cy); c += measure(k, open) + GAP; });
    cy = (centers[0] + centers[centers.length - 1]) / 2;
  }
  pos[n.id] = { x: rightEdge(depth) - W, cy, w: W, h: heightOf(n) };
  vis.push({ n, parent });
}

function layoutAll(open: Set<string>, treeData: TNode[], personasData: Persona[]) {
  const pos: Record<string, Pos> = {};
  const vis: Vis[] = [];
  const hs = treeData.map((n) => measure(n, open));
  const total = hs.reduce((a, b) => a + b, 0) + GAP * 2 * (treeData.length - 1);
  let c = -total / 2;
  treeData.forEach((n, i) => { place(n, 1, c, open, pos, vis, "engine"); c += hs[i] + GAP * 2; });

  const dockY = Math.min(-450, -(personasData.length / 2) * 100 - 150);
  let minX = 0, minY = dockY - 150, maxY = Math.max(200, (personasData.length / 2) * 100);
  Object.values(pos).forEach((p) => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.cy - p.h / 2); maxY = Math.max(maxY, p.cy + p.h / 2); });
  const maxX = PERSONA_X + W + 20;
  return { pos, vis, bounds: { x: minX - 20, y: minY - 20, w: maxX - minX + 40, h: maxY - minY + 40 } };
}

const hPath = (x1: number, y1: number, x2: number, y2: number) => {
  const dx = (x2 - x1) / 2;
  return `M${x1} ${y1} C${x1 + dx} ${y1},${x2 - dx} ${y2},${x2} ${y2}`;
};
const vPath = (x1: number, y1: number, x2: number, y2: number) => {
  const dy = (y2 - y1) / 2;
  return `M${x1} ${y1} C${x1} ${y1 + dy},${x2} ${y2 - dy},${x2} ${y2}`;
};

const GLASS = "backdrop-blur-md bg-white/85 border border-slate-200/80 shadow-sm hover:shadow-md transition-all rounded-2xl";

/* ───────────────────────── flow lines ───────────────────────── */

function Flow({ d, color, dur = 3.2, n = 3, reduced }: { d: string; color: string; dur?: number; n?: number; reduced: boolean }) {
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
      <motion.path
        initial={{ d }} animate={{ d }} transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="3 6" strokeLinecap="round"
      />
      {!reduced &&
        Array.from({ length: n }).map((_, i) => {
          const begin = `${(-i * dur) / n}s`;
          return (
            <g key={i}>
              <circle r={7} fill={color} opacity={0.15}>
                <animateMotion dur={`${dur}s`} begin={begin} repeatCount="indefinite" path={d} />
              </circle>
              <circle r={3.2} fill={color} stroke="#fff" strokeWidth={1}>
                <animateMotion dur={`${dur}s`} begin={begin} repeatCount="indefinite" path={d} />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.88;1" dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}
    </motion.g>
  );
}

/* ───────────────────────── tree node ───────────────────────── */

function TreeCard({ n, isOpen, toggle }: { n: TNode; isOpen: boolean; toggle: () => void }) {
  const count = n.children?.length ?? 0;

  if (n.kind === "pill") {
    return (
      <div
        role={count ? "button" : undefined} tabIndex={count ? 0 : undefined} aria-expanded={count ? isOpen : undefined}
        onClick={count ? toggle : undefined}
        onKeyDown={(e) => { if (count && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggle(); } }}
        className={`${GLASS} flex h-full w-full items-center gap-2.5 px-3 outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${count ? "cursor-pointer" : ""}`}
      >
        {count > 0 && (
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border text-sm font-semibold leading-none" style={{ borderColor: n.color, color: n.color }}>
            {isOpen ? "−" : "+"}
          </span>
        )}
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: n.color }} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-slate-800">{n.label}</span>
          {n.sub && <span className="block truncate text-[11px] text-slate-500">{n.sub}</span>}
        </span>
        {count > 0 && !isOpen && <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{count}</span>}
      </div>
    );
  }

  return (
    <div className={`${GLASS} h-full w-full px-3 py-2.5`}>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: n.color }} />
        <span className="truncate text-xs font-semibold text-slate-700">{n.label}</span>
      </div>
      {n.kind === "metrics" && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {n.metrics!.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <div className="truncate text-[10px] text-slate-500">{k}</div>
              <div className="truncate text-sm font-semibold text-slate-900">{v}</div>
            </div>
          ))}
        </div>
      )}
      {n.kind === "traits" && (() => {
        const max = Math.max(...n.traits!.map((t) => t[1]));
        return (
          <ul>
            {n.traits!.map(([t, v]) => (
              <li key={t} className="flex h-[22px] items-center gap-2 text-[11px]">
                <span className="w-[92px] shrink-0 truncate text-slate-600">{t}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <span className="block h-full rounded-full" style={{ width: `${(v / max) * 100}%`, background: n.color, opacity: 0.8 }} />
                </span>
                <span className="w-11 text-right font-medium tabular-nums text-slate-800">{v.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        );
      })()}
      {n.kind === "connectors" && (
        <div className="grid grid-cols-2 gap-1.5">
          {n.chips!.map((c) => (
            <span key={c} className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2 py-1 text-[11px] font-medium text-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="truncate">{c}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── persona flyout ───────────────────────── */

function useTypewriter(text: string, off: boolean, speed = 16) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (off) return;
    setN(0);
    const id = setInterval(() => setN((v) => (v >= text.length ? (clearInterval(id), v) : v + 1)), speed);
    return () => clearInterval(id);
  }, [text, off, speed]);
  return off ? text : text.slice(0, n);
}

function PersonaPanel({ p, onClose, reduced }: { p: Persona; onClose: () => void; reduced: boolean }) {
  const typed = useTypewriter(p.prompt, reduced);
  const done = typed.length === p.prompt.length;
  return (
    <motion.aside
      data-nopan data-scroll key={p.id}
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.3 }}
      className="absolute bottom-4 right-4 top-4 z-30 flex w-[min(400px,calc(100%-2rem))] flex-col overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/90 shadow-xl backdrop-blur-md"
      aria-label={`${p.role} intelligence`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="grid h-7 w-7 place-items-center rounded-lg text-[11px] font-bold text-white" style={{ background: p.color }}>{p.initials}</span>
            {p.role}
          </div>
          <div className="mt-1 text-xs text-slate-500">{p.focus}</div>
        </div>
        <button onClick={onClose} aria-label="Close panel" className="grid h-7 w-7 place-items-center rounded-full text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-sky-400">✕</button>
      </div>

      <div className="p-4">
        <div className="mb-1.5 text-xs font-medium text-slate-500">Executive prompt</div>
        <div className="rounded-xl bg-slate-900 p-3 font-mono text-[12.5px] leading-relaxed text-slate-100">
          <span className="text-emerald-400">› </span>{typed}
          {!done && <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-slate-300 align-middle" />}
        </div>

        <AnimatePresence>
          {done && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <div className="mb-2 mt-4 text-xs font-medium text-slate-500">Intelligence synthesis</div>
              <div className="space-y-3">
                {p.metrics.map((m, i) => (
                  <motion.div key={m.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduced ? 0 : i * 0.1 }}>
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                      <span className="text-slate-600">{m.label}</span>
                      <span className="font-semibold" style={{ color: TONE[m.tone] }}>{m.value}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <motion.div className="h-full rounded-full" style={{ background: TONE[m.tone] }} initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : i * 0.1 }} />
                    </div>
                  </motion.div>
                ))}
              </div>
              <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-[13px] leading-relaxed text-slate-700">
                {p.takeaways.map((t) => (
                  <li key={t} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />{t}</li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] leading-relaxed text-slate-400">Sample output, assumed from a 14-D behavioral scan combined with connected tool telemetry.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}

/* ───────────────────────── main ───────────────────────── */

export default function OriginBIArchitecture() {

  const [treeData, setTreeData] = useState<TNode[]>(INITIAL_TREE);
  const [personasData, setPersonasData] = useState<Persona[]>(INITIAL_PERSONAS);
  const [signals, setSignals] = useState(1528);

  useEffect(() => {
    fetch('http://localhost:4001/mindcore/aggregation')
      .then(res => res.json())
      .then(data => {
        setSignals(data.summary.totalSignalsCollected);
        
        const newTree: TNode[] = [
          {
            id: "students", label: "Students", sub: "School + college cohorts", kind: "pill", color: C.blue,
            children: [
              {
                id: "school", label: "School (pickmycareer)", kind: "pill", color: C.blue,
                children: [
                  ...(INITIAL_TREE[0].children?.[0].children || []),
                  ...data.schools.map((s: any) => entityNode(s, C.blue))
                ]
              },
              {
                id: "college", label: "College (discover)", kind: "pill", color: C.cyan,
                children: [
                  ...(INITIAL_TREE[0].children?.[1].children || []),
                  ...data.colleges.map((c: any) => entityNode(c, C.cyan))
                ]
              }
            ]
          },
          {
            id: "corp", label: "Corporate & Executives (grow)", sub: "Enterprise workforce", kind: "pill", color: C.violet,
            children: [
              {
                id: "ent", label: "Enterprise Companies", kind: "pill", color: C.violet, sub: "Select a company",
                children: [
                  ...(INITIAL_TREE[1].children?.[0].children || []),
                  ...data.corporates.map((c: any) => entityNode(c, C.violet))
                ]
              }
            ]
          }
        ];
        setTreeData(newTree);
        
        const newPersonas: Persona[] = [...INITIAL_PERSONAS];
        const processGroup = (arr: any[], color: string, toneBase: Tone) => {
          arr.forEach(item => {
            newPersonas.push({
              id: item.id, role: item.name, focus: item.subtitle, color, 
              initials: item.name.substring(0, 2).toUpperCase(), 
              prompt: `Show me the distribution and top profiles for ${item.name}.`,
              metrics: [
                { label: "Assessments Completed", value: item.metrics[0].value.toString(), pct: 100, tone: "good" },
                { label: "Top Profile", value: item.metrics[1].value, pct: 85, tone: toneBase }
              ],
              takeaways: ["Analysis generated successfully.", "Consistent behavior patterns identified."]
            });
          });
        };
        processGroup(data.schools, C.blue, "info");
        processGroup(data.colleges, C.cyan, "info");
        processGroup(data.corporates, C.violet, "info");
        setPersonasData(newPersonas);
      })
      .catch(err => console.error("Failed to fetch mindcore data", err));
  }, []);

  const reduced = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 0.8 });
  const [anim, setAnim] = useState(false);
  const [spaceDown, setSpaceDown] = useState(false);
  const [open, setOpen] = useState<Set<string>>(() => new Set(["students", "school", "corp", "ent", "apex"]));
  const [persona, setPersona] = useState<string | null>(null);


  const { pos, vis, bounds } = useMemo(() => layoutAll(open, treeData, personasData), [open, treeData, personasData]);
  const toggle = useCallback((id: string) => setOpen((prev) => { const s = new Set(prev); if (s.has(id)) { s.delete(id); } else { s.add(id); } return s; }), []);

  /* view controls */
  const fit = useCallback((animate = true) => {
    const el = ref.current; if (!el) return;
    const { width: vw, height: vh } = el.getBoundingClientRect();
    const k = clamp(Math.min((vw - 120) / bounds.w, (vh - 120) / bounds.h), MIN_K, MAX_K);
    setAnim(animate);
    setView({ k, x: vw / 2 - (bounds.x + bounds.w / 2) * k, y: vh / 2 - (bounds.y + bounds.h / 2) * k });
  }, [bounds]);

  const reset = useCallback(() => {
    const el = ref.current; if (!el) return;
    const { width: vw, height: vh } = el.getBoundingClientRect();
    setAnim(true);
    setView({ k: 1, x: vw / 2, y: vh * 0.55 });
  }, []);

  const zoomBy = useCallback((f: number) => {
    const el = ref.current; if (!el) return;
    const { width: vw, height: vh } = el.getBoundingClientRect();
    setAnim(true);
    setView((v) => { const k = clamp(v.k * f, MIN_K, MAX_K); const r = k / v.k; return { k, x: vw / 2 - (vw / 2 - v.x) * r, y: vh / 2 - (vh / 2 - v.y) * r }; });
  }, []);

  useLayoutEffect(() => { fit(false); }, [fit]);

  /* wheel / pinch zoom toward cursor */
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest("[data-scroll]")) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      const speed = e.ctrlKey ? 0.01 : 0.0018;
      setAnim(false);
      setView((v) => { const k = clamp(v.k * Math.exp(-e.deltaY * speed), MIN_K, MAX_K); const r = k / v.k; return { k, x: px - (px - v.x) * r, y: py - (py - v.y) * r }; });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /* keyboard: space = grab cursor, F = fit, 0 = reset */
  useEffect(() => {
    const typing = (t: EventTarget | null) => t instanceof HTMLElement && /INPUT|TEXTAREA/.test(t.tagName);
    const down = (e: KeyboardEvent) => {
      if (typing(e.target)) return;
      if (e.code === "Space" && !(e.target instanceof HTMLElement && e.target.getAttribute("role") === "button")) { e.preventDefault(); setSpaceDown(true); }
      if (e.key === "f") fit(); if (e.key === "0") reset();
    };
    const up = (e: KeyboardEvent) => { if (e.code === "Space") setSpaceDown(false); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [fit, reset]);

  /* drag to pan */
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const suppress = useRef(false);
  const [grabbing, setGrabbing] = useState(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.button !== 0 && e.button !== 1) || (e.target as HTMLElement).closest("[data-nopan]")) return;
    drag.current = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < 4) return;
      d.moved = true; setGrabbing(true); setAnim(false);
      ref.current?.setPointerCapture(e.pointerId);
    }
    setView((v) => ({ ...v, x: d.ox + dx, y: d.oy + dy }));
  };
  const endDrag = (e: React.PointerEvent) => {
    if (drag.current?.moved) { suppress.current = true; setTimeout(() => (suppress.current = false), 0); ref.current?.releasePointerCapture(e.pointerId); }
    drag.current = null; setGrabbing(false);
  };

  const active = personasData.find((p) => p.id === persona) ?? null;
  const personaY = (i: number) => (i - (personasData.length - 1) / 2) * 100;
  const dockY = Math.min(-450, -(personasData.length / 2) * 100 - 150);
  const enginePos = { x: -W / 2, cy: 0 };
  const glow = (x: number, y: number, c: string) => ({ boxShadow: `0 0 0 1px ${c}22`, left: x, top: y });

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}
      onClickCapture={(e) => { if (suppress.current) { e.stopPropagation(); e.preventDefault(); } }}
      className={`relative h-[calc(100vh-80px)] min-h-[640px] w-full select-none touch-none overflow-hidden bg-[#F8FAFC] ${grabbing ? "cursor-grabbing" : spaceDown ? "cursor-grab" : "cursor-default"}`}
    >
      {/* soft gradient blurs */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(900px circle at 12% 8%, rgba(34,211,238,.30), transparent 60%), radial-gradient(1000px circle at 92% 96%, rgba(167,139,250,.28), transparent 60%)" }} />
      {/* 24px grid that follows pan/zoom */}
      <div
        aria-hidden className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(to right,#E2E8F0 1px,transparent 1px),linear-gradient(to bottom,#E2E8F0 1px,transparent 1px)",
          backgroundSize: `${24 * view.k}px ${24 * view.k}px`, backgroundPosition: `${view.x}px ${view.y}px`,
          opacity: Math.min(1, view.k * 1.5) * 0.8,
        }}
      />

      {/* world */}
      <div
        className="absolute left-0 top-0 origin-top-left will-change-transform"
        style={{ transform: `translate(${view.x}px,${view.y}px) scale(${view.k})`, transition: anim && !reduced ? "transform 450ms cubic-bezier(.4,0,.2,1)" : "none" }}
      >
        {/* connectors layer */}
        <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={1} height={1} aria-hidden>
          {/* inputs → engine (top dock) */}
          {DOCK.map((d, i) => {
            const cx = (i - (DOCK.length - 1) / 2) * 204;
            const isConnected = d.id === "google_drive";
            return <Flow key={d.name} d={vPath(cx, dockY + 26, (cx / (DOCK.length * 204)) * 120, ENGINE.y)} color={isConnected ? d.color : "#94a3b8"} dur={3 + (i % 3) * 0.4} n={isConnected ? 2 : 1} reduced={reduced} />;
          })}
          {/* tree → engine (left) */}
          <AnimatePresence>
            {vis.map(({ n, parent }) => {
              const p = pos[n.id];
              const t = parent === "engine" ? { x: ENGINE.x, cy: 0 } : pos[parent];
              const x2 = parent === "engine" ? ENGINE.x : t.x;
              return <Flow key={`e-${n.id}`} d={hPath(p.x + p.w, p.cy, x2, t.cy)} color={n.color} dur={3.4} n={n.kind === "pill" ? 2 : 1} reduced={reduced} />;
            })}
          </AnimatePresence>
          {/* engine → personas (right) */}
          {personasData.map((p, i) => (
            <Flow key={p.id} d={hPath(ENGINE.x + ENGINE.w, 0, PERSONA_X, personaY(i))} color={p.color} dur={3 + i * 0.3} n={3} reduced={reduced} />
          ))}
        </svg>

        {/* section labels */}
        <div className="absolute -translate-x-1/2 text-sm font-medium text-slate-500" style={{ left: 0, top: dockY - 70 }}>Connected tools feed the engine</div>
        <div className="absolute text-sm font-medium text-slate-500" style={{ left: rightEdge(1) - W, top: bounds.y + 6 }}>Data ingestion and behavioral telemetry</div>
        <div className="absolute text-sm font-medium text-slate-500" style={{ left: PERSONA_X, top: personaY(0) - 70 }}>Persona intelligence outputs</div>

        {/* top dock */}
        {DOCK.map((d, i) => {
          const cx = (i - (DOCK.length - 1) / 2) * 204;
          return (
            <div key={d.name} className={`${GLASS} absolute flex h-[52px] w-[184px] items-center gap-2.5 px-3`} style={{ left: cx - 92, top: dockY - 26 }}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg shadow-sm border border-slate-100 bg-white overflow-hidden p-1.5">
                <img src={getAppIconUrl(d.id)} alt={d.name} className={`w-full h-full object-contain ${d.id !== 'google_drive' ? 'opacity-50 grayscale' : ''}`} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-[11px] font-bold" style="color: ' + d.color + '">' + d.ab + '</span>'; }} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-slate-800">{d.name}</span>
                {d.id === "google_drive" ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                    <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" /><span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    Not Connected
                  </span>
                )}
              </span>
            </div>
          );
        })}

        {/* engine */}
        <div className="absolute" style={{ left: ENGINE.x, top: ENGINE.y, width: ENGINE.w, height: ENGINE.h }}>
          {!reduced && [0, 1].map((i) => (
            <motion.div key={i} className="absolute inset-0 rounded-3xl border-2 border-cyan-400/50" initial={{ scale: 1, opacity: 0.5 }} animate={{ scale: 1.3, opacity: 0 }} transition={{ duration: 3, repeat: Infinity, delay: i * 1.5, ease: "easeOut" }} />
          ))}
          <div className="relative h-full w-full rounded-3xl border border-white bg-gradient-to-br from-white via-white to-cyan-50 p-4 shadow-2xl shadow-cyan-900/10 ring-1 ring-slate-200/80">
            <div className="text-base font-semibold tracking-tight text-slate-900">OriginBI Intelligence Engine</div>
            <ul className="mt-3 space-y-2 text-[12.5px] text-slate-600">
              <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 motion-safe:animate-pulse" />Overall Aggregation<span className="ml-auto tabular-nums text-slate-400">{signals.toLocaleString()}</span></li>
              <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-500" />14-D Behavioral Core</li>
              <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-500" />Multi-Tenant Realtime Sync</li>
            </ul>
          </div>
        </div>

        {/* left tree */}
        <AnimatePresence>
          {vis.map(({ n, parent }) => {
            const p = pos[n.id];
            const from = parent === "engine" ? enginePos : pos[parent];
            const y = p.cy - p.h / 2;
            return (
              <motion.div
                key={n.id}
                className="absolute left-0 top-0"
                style={{ width: p.w, height: p.h }}
                initial={{ opacity: 0, scale: 0.9, x: from.x, y: from.cy - p.h / 2 }}
                animate={{ opacity: 1, scale: 1, x: p.x, y }}
                exit={{ opacity: 0, scale: 0.9, x: from.x, y: from.cy - p.h / 2 }}
                transition={{ duration: reduced ? 0 : 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                <TreeCard n={n} isOpen={open.has(n.id)} toggle={() => toggle(n.id)} />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* right personas */}
        {personasData.map((p, i) => {
          const sel = persona === p.id;
          return (
            <button
              key={p.id} data-nopan
              onClick={() => setPersona(sel ? null : p.id)} aria-pressed={sel}
              className={`${GLASS} absolute flex h-[72px] items-center gap-3 px-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${sel ? "ring-2" : ""}`}
              style={{ width: W, ...glow(PERSONA_X, personaY(i) - 36, p.color), ...(sel ? ({ "--tw-ring-color": p.color } as React.CSSProperties) : {}) }}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-bold text-white" style={{ background: p.color }}>{p.initials}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-900">{p.role}</span>
                <span className="block truncate text-[11px] text-slate-500">{p.focus}</span>
              </span>
              <span className="ml-auto text-slate-400">›</span>
            </button>
          );
        })}
      </div>

      {/* title + hint */}
      <div data-nopan className="absolute left-4 top-4 z-20 max-w-[320px] rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md">
        <h2 className="text-sm font-semibold text-slate-900">OriginBI behavioral intelligence architecture</h2>
        <p className="mt-0.5 text-xs text-slate-500">Scroll to zoom, drag to pan. Open a branch with +, or select a persona to see its output.</p>
      </div>

      {/* controls */}
      <div data-nopan className="absolute bottom-4 left-4 z-20 flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/85 p-1 shadow-sm backdrop-blur-md">
        <button onClick={() => zoomBy(1 / 1.25)} aria-label="Zoom out" className="h-8 w-8 rounded-xl text-lg text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-sky-400">−</button>
        <span className="w-12 text-center text-xs tabular-nums text-slate-600" aria-live="polite">{Math.round(view.k * 100)}%</span>
        <button onClick={() => zoomBy(1.25)} aria-label="Zoom in" className="h-8 w-8 rounded-xl text-lg text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-sky-400">+</button>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <button onClick={() => fit()} className="h-8 rounded-xl px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-sky-400">Fit to view</button>
        <button onClick={reset} className="h-8 rounded-xl px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-sky-400">Reset view</button>
      </div>

      <AnimatePresence>{active && <PersonaPanel p={active} reduced={reduced} onClose={() => setPersona(null)} />}</AnimatePresence>
    </div>
  );
}
