# MBA Specialization Suitability — Short Report (2 pages)

## Context

The originbi admin panel already exports a **Short Report** for School and College students (commit `ecf6a92`). MBA students need their own specialization-focused short report because the existing college short report doesn't speak to MBA-specific outcomes (Finance / HR / Business Analytics / Operations / Marketing). The full MBA report exists conceptually in [MBA Specialization Suitability Report.pdf](MBA%20Specialization%20Suitability%20Report.pdf); the short version is a 2-page distilled output for quick admin distribution and student/placement-officer consumption.

This plan covers **only the content design** of the MBA Short Report. Implementation, plus the two follow-on features (group user management + consolidated MBA report), will be scoped after the design is locked.

---

## Inputs available (from assessment)

- Student identity: name, program, department/specialization-of-study, group, assessment date
- Behavioral Orientation (derived label — e.g., "People-Oriented & Action-Driven")
- 5 Work Readiness Indicators, each scored x/25 → converted to %:
  1. Ownership & Responsibility
  2. Goal Focus & Consistency
  3. Learning Adaptability
  4. Collaboration & Professional Maturity
  5. Confidence & Initiative
- Computed: Suitability ranking across 5 MBA specializations + Fit Level per specialization (Excellent / Good / Moderate / Low) + Behavioral Alignment per specialization (Strong / Moderate / Low)

---

## Page 1 — Profile Snapshot & Recommendation

**Goal:** Within 5 seconds of opening, the reader knows the recommended specialization, the student's readiness profile, and *why*.

### 1.1 Header Strip
- OriginBi logo (left) · Report title: **"MBA Specialization Suitability — Short Report"** (center) · Assessment date (right)
- Thin accent rule below

### 1.2 Student Bar
A single horizontal strip with:
- Full Name (bold, large) · Program: MBA · Specialization-of-study (if captured) · Group Name (if any) · Report ID (small, muted)

### 1.3 Hero Recommendation Card (top half of page)
The visual centerpiece. A wide card with three zones:

| Left zone | Center zone | Right zone |
|---|---|---|
| **Best-Fit Specialization** label + large name (e.g., "Human Resources") + colored specialization icon | **Fit Level badge** — pill-shaped, color-coded (Excellent=green, Good=blue, Moderate=amber, Low=grey) | **Behavioral Orientation** — short label (e.g., "People-Oriented & Action-Driven") |

Below the three zones, one sentence: *"Best match for people interaction, communication, responsibility, and professional maturity."*

### 1.4 Work Readiness Snapshot
Title: **Work Readiness Profile**

Five horizontal bars, one per readiness indicator:
- Left: indicator name
- Bar: filled to % value, colored by band (≥80% green, 60–79% blue, 40–59% amber, <40% red)
- Right: % value + level word ("Excellent" / "Good" / "Developing" / "Needs Focus")

This replaces the raw "x/25" numbers — the documentation says to hide raw scoring from student-facing reports.

### 1.5 Why This Recommendation (paragraph)
3–4 lines, plain language. Template:

> *[Student first name] shows a [behavioral orientation] profile, with particular strength in [top 2 readiness areas]. This naturally aligns with the [recommended specialization] specialization, which rewards [2–3 specialization-specific traits]. Areas to develop before placement: [top 1–2 development areas].*

---

## Page 2 — Ranking, Career Direction & Development

**Goal:** Give the placement officer (and the student) the next-step view: where they rank across all 5, what jobs to aim for, what to work on.

### 2.1 Specialization Ranking Table
Title: **All 5 Specializations — Suitability Ranking**

Compact 5-row table:

| Rank | Specialization | Fit | One-line reason |
|---|---|---|---|
| 1 | Human Resources | 🟢 Excellent Fit | Best match for people interaction… |
| 2 | Operations | 🟢 Excellent Fit | Strong match for planning, coordination… |
| 3 | Marketing | 🔵 Good Fit | Suitable, but confidence and persuasion need improvement |
| 4 | Finance | 🔵 Good Fit | Possible with strong finance interest |
| 5 | Business Analytics | 🔵 Good Fit | Possible with strong data and tool interest |

The fit cell is a small color dot/pill so the eye can scan the column in one pass.

### 2.2 Two-Column Block — Strengths & Development

Two equal-width columns side by side:

**Left: Strength Areas** (top 3 strengths, derived from highest readiness scores)
- Each item: bold strength name + one-line explanation
  - e.g., *Responsibility — Takes assigned work seriously and completes with ownership*

**Right: Development Focus** (top 2–3 areas, derived from lowest readiness scores + recommendation gaps)
- Each item: bold area name + one-line "why it matters"
  - e.g., *Confidence — Needed for interviews, presentations, and leadership communication*

### 2.3 Career Direction Strip
Title: **Suitable Career Paths**

A wrapping row of pill-shaped chips, each a role name from the recommended specialization's job-role pool. Show 5–7 chips:
- HR Executive · Talent Acquisition Associate · L&D Coordinator · Employee Engagement Executive · HR Operations Associate · Training Coordinator · Client Coordination Executive

Chips share the recommended-specialization accent color.

### 2.4 Placement Officer Note (footer block)
Title: **Placement Officer Summary** (small, distinguishing background tint so it's visually a separate block)

2–3 sentences:
> *Strong potential for people-facing, coordination-based, and responsibility-driven roles. Recommended placement areas: HR, Recruitment Coordination, Training Support, Employee Engagement, Operations Coordination. Grooming support recommended in: public speaking, interview confidence, assertive communication.*

### 2.5 Page Footer
- Disclaimer line (reuse the existing one from college short report)
- Page number (Page 2 of 2)
- Generated-on timestamp

---

## Visual System Recommendations

### Specialization accent colors (suggested — designer can override)
| Specialization | Accent |
|---|---|
| Finance | Deep navy |
| Human Resources | Teal |
| Business Analytics | Purple |
| Operations | Burnt orange |
| Marketing | Magenta/pink |

The recommended specialization's accent flows through: hero card border, career chips background, ranking row #1 highlight.

### Fit Level palette
- Excellent Fit — Green (#2E7D32 family)
- Good Fit — Blue (#1976D2 family)
- Moderate Fit — Amber (#ED6C02 family)
- Low Fit — Grey (#757575 family)

### Typography
Mirror the existing reports: Sora Bold for headings, Sora Regular for body, Sora Semibold for emphasis (already loaded in [BaseReport.ts](backend/student-service/src/report/reports/BaseReport.ts)).

### What is intentionally **excluded** (per documentation §16)
- Raw `/25` scores
- Internal trait codes (Commitment, Focus, Openness, Respect, Courage)
- Weightage matrix / formula
- Behavioral alignment per specialization (Strong/Moderate/Low table) — keep this internal; on the short report we only surface the *result* of the alignment via the final ranking

---

## Open Questions for the User (before design handoff)

1. Should the short report cover the **placement officer summary** on page 2, or is the short report **student-facing only** (officer gets the full report)?
2. For students currently studying MBA with a **declared specialization-of-study** (e.g., already enrolled in HR track), do we want a sub-note when the recommendation differs from their declared track? Or treat declared track as informational only?
3. Career role pool per specialization — do you already have these lists curated somewhere, or should I propose them as part of the implementation plan?
4. Should the 5-specialization ranking show **all 5 rows** always, or only the recommended + top alternates (e.g., top 3)?

---

## Out of Scope (for this plan)

The user has named two follow-on features to be tackled **after** this short report is shipped. They are intentionally not designed here — listed only so we don't lose them:

1. **Group user management improvements**
   - Add existing user to a group post-creation
   - Convert "group name" text input on user creation to a *type-or-select* combobox
   - "Add Existing User" button on assessment preview tab → email/name search modal → confirm-and-add, gated by: user not already in a group AND user's program matches the group's program
2. **Consolidated MBA report** — generates department-level / specialization-level reports for college MBA students (analog to existing bulk/group reports)

---

## Verification (once implemented)

- Render a sample MBA short report for a known assessment record and visually compare against the design
- Test all 5 specializations appearing as #1 recommendation (5 fixture students)
- Confirm fit badges render correct colors for all four levels (Excellent/Good/Moderate/Low)
- Verify the report stays within 2 pages for all input variations (longest behavioral orientation label, longest career role names, group name with 60+ chars)
- Confirm password protection inherits from existing PDF encryption flow in [reportFactory.ts](backend/student-service/src/report/helpers/reportFactory.ts)
- Wire the download button visibility in [AssessmentResultPreview.tsx](frontend/components/admin/AssessmentResultPreview.tsx) for MBA program code
