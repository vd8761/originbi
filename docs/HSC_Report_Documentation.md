# HSC School Report — Complete Documentation

> **Report Category:** School Level → HSC (Class 11/12, `school_level_id === 2`)
> **Source file:** `backend/student-service/src/report/reports/school/SchoolReport.ts`
> **Constants file:** `backend/student-service/src/report/reports/school/schoolConstants.ts`

---

## Table of Contents

1. [Overview](#1-overview)
2. [Input Data Model](#2-input-data-model)
3. [Report Section Map (HSC)](#3-report-section-map-hsc)
4. [Shared vs HSC-exclusive Sections](#4-shared-vs-hsc-exclusive-sections)
5. [Content Generation — HSC-Specific Sections](#5-content-generation--hsc-specific-sections)
   - 5.1 Future Pathways: Your Stream
   - 5.2 Career Odyssey Roadmap
   - 5.3 Course Compatibility Matrix
   - 5.4 Your Reach Institutions
6. [Shared Sections (Referenced from SSLC Doc)](#6-shared-sections)
7. [Content Variations](#7-content-variations)
8. [Technical Reference — HSC-specific Logic](#8-technical-reference--hsc-specific-logic)
9. [Comparison: SSLC vs HSC](#9-comparison-sslc-vs-hsc)

---

## 1. Overview

The **HSC Report** is generated for Class 11/12 students (`school_level_id === 2`). It shares the entire common personality/behavioral pipeline with SSLC but diverges in its academic sections to focus on the **student's actual enrolled stream** (not a recommendation engine) and adds **Reach Institutions** (NIRF-ranked colleges) relevant to their stream and personality.

The HSC report is unique from SSLC in that it:
- Uses the student's **enrolled stream** (`school_stream_id`) — not a computed recommendation
- Shows **only the enrolled stream's** content page and roadmap (not all 6 streams)
- Includes the **Course Compatibility Matrix** using their actual stream (DB-driven, full list)
- Includes **Your Reach Institutions** — NIRF-ranked colleges filtered by stream and personality
- Does **not** include "Where You Fit Best" stream recommendation section
- Does **not** show all 6 stream selection content pages

---

## 2. Input Data Model

Identical to SSLC with one key difference:

| Field | Type | HSC Usage |
|---|---|---|
| `school_level_id` | `2` | Triggers HSC branch |
| `school_stream_id` | `number` (1–6) | **Required for HSC** — identifies enrolled stream |
| All other fields | Same as SSLC | See SSLC documentation |

**Stream ID mapping:**

| `school_stream_id` | Short Name | Full Name |
|---|---|---|
| 1 | PCMB | PCMB |
| 2 | PCB | PCB |
| 3 | PCM | PCM |
| 4 | PCBZ | PCBZ |
| 5 | Commerce | Commerce / Management |
| 6 | Humanities | Arts / Humanities |

---

## 3. Report Section Map (HSC)

```
1.  Cover Page                                              [SHARED]
2.  Table of Contents (HSC variant — 18 items)              [HSC-variant]
3.  Introductory Pages                                      [SHARED]
4.  General Characteristics [DISC-typed]                    [SHARED]
5.  Core Personality Profile [Pattern-typed]                [SHARED]
6.  Understanding Yourself [DISC-typed]                     [SHARED]
7.  Strengths + Nature Style Chart [DISC-typed]             [SHARED]
8.  Nature Style Graph (side-by-side)                       [SHARED]
9.  Future Industry Glimpse (image)                         [SHARED]
10. Career Popularity (image)                               [SHARED]
11. Tech Areas 2027–2035 [DISC-trait chart]                 [SHARED]
12. Future Outlook Venn diagram                             [SHARED]
13. Behavioral Capability Profile (Radar)                   [SHARED]
14. 360° Impact Assessment (Rings)                          [SHARED]
15. Stress Response Model                                   [SHARED]
16. Agile Maturity Analysis (Balance scale)                 [SHARED]
17. Professional Skill Heatmap                              [SHARED]
18. Motivations & Needs [DISC-typed]                        [SHARED]
19. Communication Tips [DISC-typed]                         [SHARED]
20. Growth Areas [DISC-typed]                               [SHARED]
21. Agile Compatibility Index (ACI)                         [SHARED]
22. Behavioral Charts Intro [DISC-typed]                    [SHARED]
23. Mapping Strengths (Blended DISC)                        [SHARED]
24. ── HSC BRANCH BEGINS ──
25. Career Alignment Index (Gauge)                          [SHARED]
26. Career Fit Analysis (4 circles)                         [SHARED]
27. Future Role Direction (Domain table)                    [SHARED]
28. Future Pathways: Your Stream (single stream content)    [HSC-exclusive]
29. Career Odyssey Roadmap (single stream wave graph)       [HSC-exclusive]
30. Course Compatibility Matrix (DB-driven, full stream)    [HSC-exclusive]
31. Your Reach Institutions (NIRF ranked colleges)          [HSC-exclusive]
32. Career Flight Path (DISC × agile timeline)              [SHARED]
33. Development Acceleration Zones                          [SHARED]
34. ── SHARED END ──
35. Word Sketch                                             [SHARED]
36. Disclaimer                                             [SHARED]
```

---

## 4. Shared vs HSC-exclusive Sections

| Section | SSLC | HSC | Notes |
|---|---|---|---|
| Cover Page | ✅ | ✅ | Identical |
| TOC | ✅ (17 items) | ✅ (18 items) | Different constant arrays |
| Introductory Pages | ✅ | ✅ | Identical |
| General Characteristics | ✅ | ✅ | DISC-typed, identical |
| Strengths & ACI | ✅ | ✅ | Identical |
| Behavioral Charts | ✅ | ✅ | Radar/Rings/Stress/Agile/Heatmap — identical |
| Blended Style Mapping | ✅ | ✅ | 12 combinations, identical |
| Career Alignment Index | ✅ | ✅ | Identical |
| Career Fit Analysis | ✅ | ✅ | Identical |
| Career Domain Table | ✅ | ✅ | Identical |
| Career Flight Path | ✅ | ✅ | Identical |
| Development Zones | ✅ | ✅ | Identical |
| Word Sketch | ✅ | ✅ | Identical |
| Disclaimer | ✅ | ✅ | Identical |
| **Where You Fit Best** | ✅ | ❌ | SSLC-only |
| **Compatible Courses (recommended stream)** | ✅ | ❌ | SSLC-only |
| **Stream Selection Intro** | ✅ | ❌ | SSLC-only |
| **All 6 stream content pages** | ✅ | ❌ | SSLC-only |
| **All 6 stream odyssey roadmaps** | ✅ | ❌ | SSLC-only |
| **Single stream content page** | ❌ | ✅ | Uses enrolled `school_stream_id` |
| **Single stream odyssey roadmap** | ❌ | ✅ | Uses enrolled `school_stream_id` |
| **Course Compatibility Matrix** | ❌ | ✅ | DB-driven for enrolled stream |
| **Reach Institutions** | ❌ | ✅ | NIRF-ranked colleges |

---

## 5. Content Generation — HSC-Specific Sections

### 5.1 Future Pathways: Your Stream *(HSC-exclusive)*
**Method:** `generateStreamSelectionContent(streamKey)`

Called once using the student's enrolled stream (`STREAM_NAMES[school_stream_id]`).

**What it generates (identical to SSLC's per-stream page but only once):**
- New page with stream shortName + full title + stream icon image
- Vibe text paragraph
- 2×2 card grid: 4 field cards, each showing:
  - Icon image (from `public/assets/images/school/`)
  - Field name (bold, deep blue)
  - Field vibe description
  - Bulleted list of mapped degrees

**If `school_stream_id` is null/undefined:** This section is silently skipped.

**Stream-to-field mapping (same data as SSLC documentation):**

| Stream (`school_stream_id`) | Field 1 | Field 2 | Field 3 | Field 4 |
|---|---|---|---|---|
| 1 — PCMB | Engineering & Technology | Medicine & Allied Health | Research & Pure Sciences | Mathematics & Data |
| 2 — PCB | Medicine & Allied Health | Biosciences & Biotechnology | Environmental & Agricultural | Pharmacy & Nutrition |
| 3 — PCM | Engineering & Technology | Mathematics & Computing | Architecture & Design | Data Science & AI |
| 4 — PCBZ | Zoology & Wildlife | Environmental Science | Veterinary & Animal Sciences | Biotechnology |
| 5 — Commerce | Business & Management | Finance & Accounting | Economics & Policy | Marketing & Media |
| 6 — Humanities | Social Sciences | Languages & Literature | Law & Governance | Arts, Design & Media |

Each field card also has:
- A field-specific `vibe` description sentence (tone/personality of that field)
- Comma-separated `mappedDegrees` parsed into individual bullet items

---

### 5.2 Career Odyssey Roadmap *(HSC-exclusive)*
**Method:** `generateStreamOdysseyRoadmap(streamKey)`

Called once using the student's enrolled stream.

**What it generates:**
- Winding cosine wave path across the page
- Nodes alternating above/below the wave on dashed stub lines
- Each node: green filled circle, node label (year/phase), title, subtitle
- Tagline shown as H3 header above the wave

**Dynamic layout rules:**
- If ≥40% page space available → normal scale (amplitude = 30)
- If <40% space → amplitude reduced by 10%
- If still not fitting (wave + all text) → forced new page

**Node rendering:**
- Odd-indexed nodes: text above the wave
- Even-indexed nodes: text below the wave
- Dashed connector line (18px dash-chain) between node circle and text block
- Label (year/phase) in indigo bold
- Title in semibold dark
- Subtitle in regular grey

**Data source:** `STREAM_ODYSSEY_ROADMAP[streamKey]` which provides `{ tagline, nodes[] }`. Each node has `{ label, title, subtitle }`.

---

### 5.3 Course Compatibility Matrix *(HSC-exclusive)*
**Method:** `generateCourseCompatibility()`

Fetched asynchronously from DB: `getCompatibilityMatrixDetails(traitCode, school_stream_id)`

**What it generates:**

**H1: "Course Compatibility Matrix"**
- Color legend (two colored circle swatches):
  - Primary trait color = bar color for scores ≥70%
  - Secondary trait color = bar color for scores <70%
- Per-department sections:
  - H3: department name
  - All courses for that department rendered as horizontal bar rows

**Bar chart layout (standard mode — not 3-column like SSLC):**
- Y-axis line + X-axis baseline
- X-axis ticks from 50 to 100 (every 10)
- One row per course: short tick → colored bar → course name (right-aligned) → % label
- Bar color: primary DISC trait color if ≥70%, secondary if <70%

**Note:** HSC uses the full course list (no top-6 cap per department), and uses the student's actual `school_stream_id` instead of a recommended stream.

**Color coding:**

| Trait | Color |
|---|---|
| D | `#D82A29` |
| I | `#FEDD10` |
| S | `#4FB965` |
| C | `#01AADB` |

**After all departments:** Disclaimer paragraph (same text as SSLC).

**If DB unavailable/errors:** Section is silently skipped with a log warning.

---

### 5.4 Your Reach Institutions *(HSC-exclusive)*
**Method:** `generateReachInstitutions()`

Fetched asynchronously from DB: `getTopCollegesForStudent(traitCode, school_stream_id)`

**What it generates:**

**H1: "Your Reach Institutions"**
**H2: "College Compatibility Matrix"**

Introduction paragraph explaining which NIRF parameters were used for ranking based on primary trait:

| Primary Trait | Primary NIRF Parameter | Secondary NIRF Parameter |
|---|---|---|
| D | Graduation Outcomes (GO) | Perception (PR) |
| I | Outreach & Inclusivity (OI) | Perception (PR) |
| S | Teaching, Learning & Resources (TLR) | Outreach & Inclusivity (OI) |
| C | Research & Professional Practice (RPC) | Teaching, Learning & Resources (TLR) |

Intro text template: *"Based on your Personality trait, the institutions below have been selected and ranked using **[primary]** as the primary parameter and **[secondary]** as the secondary parameter. Results are filtered for **[stream name]** and ordered by NIRF national rank after selection."*

**Table columns:** S.No | Institution Name | City | State | NIRF Score | NIRF Rank

**Table formatting:**
- Header: deep navy `#150089` background, white text
- Column widths: S.No=fit, Institution Name=fill, City/State/Score/Rank=fit
- Border: `#CCCCCC`, 0.5pt
- Cell padding: 5pt
- Font: 8pt

**Two rendering modes depending on `school_stream_id`:**

#### Mode A — Specific Stream (school_stream_id is set)
Colleges are grouped by `department_name` from the DB result (the SQL already applies per-department limits and backfill logic). For each group:
- **Subheader row** (merged across all 6 columns): department name; dark navy `#2c2a7d` background, white Sora Semibold 8pt
- Numbered data rows (S.No resets to 1 per department)

#### Mode B — All Streams (school_stream_id is null)
Colleges grouped by stream ID (1–6) in fixed order. Each stream group gets:
- Subheader row with label like "PCMB Institutions", "PCB Institutions", etc.
- **Limit per group** based on number of non-empty groups:
  - 1 group → 10 per group
  - 2 groups → 5 per group
  - 3–4 groups → 4 per group
  - 5–6 groups → 3 per group

**Deduplication:** Colleges with duplicate names (case-insensitive, whitespace-normalized) are filtered to show only the first occurrence.

**Footer note** (italic, 8pt, centered):
*"Note: This list is based on objective, publicly available NIRF 2025 data. Rankings are subject to change. This does not constitute a guaranteed admission or a direct endorsement of any specific institution."*

---

## 6. Shared Sections

All sections listed as `[SHARED]` in Section 3 are documented in detail in the **SSLC Report Documentation**. Below is a cross-reference:

| Section | SSLC Doc Reference |
|---|---|
| General Characteristics | §4.4 |
| Core Personality Profile | §4.4 |
| Strengths (incl. nature chart) | §4.5 |
| Motivations & Communication | §4.6 |
| Growth Areas | §4.6 |
| ACI (Agile Compatibility Index) | §4.7 |
| Behavioral Charts Intro | §4.8 |
| Nature Graph (side by side) | §4.9 |
| Future Industry / Career Popularity | §4.10 |
| Tech Areas 2027–2035 | §4.11 |
| Future Outlook (Venn) | §4.12 |
| Behavioral Capability Radar | §4.13 |
| 360° Impact Rings | §4.14 |
| Stress Response | §4.15 |
| Agile Maturity | §4.16 |
| Skill Heatmap | §4.17 |
| Blended DISC Style Mapping | §4.18 |
| Career Alignment Index (gauge) | §4.23 |
| Career Fit (circle rings) | §4.24 |
| Career Domain Table | §4.25 |
| Career Flight Path | §4.26 |
| Development Zones | §4.27 |
| Word Sketch | §4.28 |
| Disclaimer | §4.29 |

---

## 7. Content Variations

HSC shares all content variation logic with SSLC. The only HSC-specific variations are:

### 7.1 Table of Contents (HSC variant — 18 items)
```
1.  About the Origin BI Self-Discovery Report
2.  Benefits of Understanding Your Ideal Learning and Growth Paths
3.  General Characteristics for [Student Name]
4.  YOUR STRENGTHS - What You Bring to Your Learning Journey
5.  Motivations and Needs - Insights Personalized for You
6.  Agile Compatibility Index (ACI)
7.  Your Personalized Behavioral Charts
8.  Future Industry Glimpse (2035)
9.  Career Popularity
10. Tech Areas That Will Matter in 2030 - 2035
11. Behavioral Capability Profile
12. Mapping Your Strengths to Future Academic and Career Goals
13. Career Alignment Index
14. Future Pathways: Your Stream        ← HSC-specific label
15. Course Compatibility Matrix          ← HSC-exclusive item
16. Your Reach Institutions - Top Colleges for You  ← HSC-exclusive
17. Career Flight Path
18. Disclaimer
```

Differences from SSLC TOC:
- Item 14: "Future Pathways: **Your Stream**" (singular) vs "Future Pathways: Stream Selection"
- Item 15: "Course Compatibility Matrix" (new, HSC-only)
- Item 16: "Your Reach Institutions..." (new, HSC-only)
- Item 15 in SSLC ("Where You Fit Best") is absent from HSC
- Item 16 in SSLC ("Future Pathways: Stream Selection") is replaced

### 7.2 Stream Content Pages
SSLC renders all 6 stream content pages; HSC renders only the enrolled stream. The **content of each stream page is identical** — only the selection differs.

### 7.3 Course Bar Chart Mode
- **SSLC:** 3-column quadrant mode (compact, 6 courses/department max, illustrative colors based on top agile dimension stream)
- **HSC:** Single-column standard mode with Y/X axis lines, all courses per department, student's enrolled stream

### 7.4 Reach Institutions Trait-to-NIRF Parameter Mapping (4 variations)
Based on primary DISC trait (D/I/S/C), different NIRF ranking parameters are emphasized in the intro text.

---

## 8. Technical Reference — HSC-specific Logic

### 8.1 Stream Branching

**Entry point:** `generate()` method, line ~151:
```typescript
if (this.data.school_level_id === 1) {
  await this.generateSSLCSections();   // SSLC path
} else {
  await this.generateHSCSections();    // HSC path
}
```

**`generateHSCSections()` call order:**
```typescript
async generateHSCSections(): Promise<void> {
  this.ci_generateCareerAlignmentIndex();   // 1. Career Alignment
  this.ci_generateCareerFit();              // 2. Career Fit
  this.ci_generateCareerDomainTable();      // 3. Domain Table
  // 4. Single stream content page
  const streamKey = STREAM_NAMES[this.data.school_stream_id ?? 0];
  if (streamKey) this.generateStreamSelectionContent(streamKey);
  // 5. Single stream odyssey roadmap
  this.generateStreamOdysseyRoadmap(streamKey);
  // 6. Full course compatibility (enrolled stream)
  await this.generateCourseCompatibility();
  // 7. Reach institutions
  await this.generateReachInstitutions();
  // 8. Career Flight Path
  this.generateCareerFlightPath();
  // 9. Development Zones
  this.ci_generateDevelopmentZones();
}
```

### 8.2 DB Calls in HSC

| Method | DB Query | Inputs |
|---|---|---|
| `generateCourseCompatibility()` | `getCompatibilityMatrixDetails()` | `traitCode` (e.g. `"SD"`), `school_stream_id` (1–6) |
| `generateReachInstitutions()` | `getTopCollegesForStudent()` | `traitCode`, `school_stream_id` |

Both calls are wrapped in try/catch — if DB is unavailable the section is silently skipped and a warning is logged.

### 8.3 Deduplication Logic for Reach Institutions

```typescript
private dedupeReachInstitutionsByName(colleges: UniversityData[]): UniversityData[] {
  const seen = new Set<string>();
  return colleges.filter(college => {
    const normalizedName = college.name.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!normalizedName || seen.has(normalizedName)) return false;
    seen.add(normalizedName);
    return true;
  });
}
```

Prevents the same institution appearing twice (e.g. from different departments). Case-insensitive, whitespace-normalized comparison.

### 8.4 Course Compatibility Threshold

- **SSLC:** Uses `SSLC_THRESHOLD = 86%` as the cutoff between primary/secondary trait bar colors
- **HSC:** Uses default threshold of `70%` (function parameter default)

---

## 9. Comparison: SSLC vs HSC

| Characteristic | SSLC | HSC |
|---|---|---|
| `school_level_id` | 1 | 2 |
| Stream source | Computed (agile compatibility ranking) | Student's enrolled `school_stream_id` |
| Stream content pages | All 6 streams shown | Only enrolled stream |
| Stream odyssey roadmaps | All 6 streams | Only enrolled stream |
| Course data | Recommended stream, top 6/dept, 3-col compact | Enrolled stream, all courses, standard chart |
| Color threshold | 86% | 70% |
| Reach Institutions | ❌ Not shown | ✅ NIRF-ranked bank, grouped by dept |
| TOC items | 17 | 18 |
| "Where You Fit Best" | ✅ | ❌ |
| Stream Selection Intro | ✅ | ❌ |
| DB calls | 1 (course compat for rec. stream) | 2 (course compat + colleges) |
| Section ordering | CAI after stream selection | CAI before stream content |

### Execution Flow Difference

**SSLC order within branch:**
```
Where You Fit Best →
Compatible Courses (rec. stream) →
Stream Selection Intro →
[×6] Stream Content + Odyssey Roadmap →
Career Alignment Index →
Career Fit →
Domain Table →
Career Flight Path →
Development Zones
```

**HSC order within branch:**
```
Career Alignment Index →
Career Fit →
Domain Table →
Stream Content (enrolled stream) →
Career Odyssey Roadmap (enrolled stream) →
Course Compatibility Matrix (enrolled stream) →
Reach Institutions →
Career Flight Path →
Development Zones
```

---

## Appendix A — DISC Content Quick Reference

> All detailed DISC-typed content is documented in **SSLC_Report_Documentation.md §6**. Both reports use identical content for shared sections.

### DISC Primary Personality Types (4)
| Type | Core Profile |
|---|---|
| **D (Dominance)** | Results-oriented, decisive, direct, challenge-seeking, risk-taking |
| **I (Influence)** | People-oriented, enthusiastic, inspiring, optimistic, relationship-building |
| **S (Steadiness)** | Calm, loyal, dependable, harmony-seeking, consistent, patient |
| **C (Conscientiousness)** | Analytical, precise, detail-oriented, process-driven, quality-focused |

### Blended DISC Styles (12)
DI=Charismatic Leader, DS=Strategic Stabilizer, DC=Decisive Analyst, ID=Energetic Visionary, IS=Supportive Energizer, IC=Insightful Communicator, SD=Reliable Driver, SI=Empathetic Catalyst, SC=Thoughtful Executor, CD=Structured Achiever, CI=Creative Analyst, CS=Systematic Supporter

### Agile Patterns (6)
`assertive-risk`, `cautious-respect`, `execution-engine`, `creative-instability`, `steady-execution`, `balanced`

### Stress Types (4)
`assertive`, `overthink`, `withdrawal`, `balanced`

### Career Alignment Confidence (3)
`High` (score gap ≥8%), `Moderate` (≥4%), `Exploratory` (<4%)

---

*Documentation generated from source: `schoolReport.ts` (6341 lines) + `schoolConstants.ts`*
*Report category: HSC (school_level_id = 2)*
