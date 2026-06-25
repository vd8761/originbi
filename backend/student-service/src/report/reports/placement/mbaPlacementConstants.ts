// reports/placement/mbaPlacementConstants.ts
//
// Copy + styling for the MBA Placement Report. Mirrors the structure of
// placementConstants.ts but the content is scoped to an MBA cohort organized by
// specialization fit (Finance, HR, Business Analytics, Operations, Marketing).

export const MBA_PLACEMENT_CONTENT = {
  cover_label: 'Placement Guidance',
  toc_title: 'Table of Contents',

  executive_summary_title: 'Executive Summary',
  executive_summary_text: (count: number) =>
    `<p>This handbook profiles <b>${count} students </b> from their behavioural (DISC) assessment. Every student resolves to one of sixteen MBA characters - the four pure traits (D, I, S, C) and their twelve blends - and each character carries an MBA reading: the specialization it fits best, the future roles it points to, and how to groom for them. The radar and grid below show how the cohort is spread across all sixteen characters; the sections that follow take each character in turn.</p>`,

  // ── Executive-summary visuals ──────────────────────────────────────────────
  character_radar_title: 'Character Distribution',
  character_radar_description:
    'Each spoke is one of the sixteen MBA characters; the further the point, the more students share that character. All sixteen are shown - an unlabelled spoke simply means no student resolved to it.',
  character_grid_title: 'Cohort Composition',
  character_grid_description:
    'The same distribution as a colour-coded count under each character - the four pure traits (D, I, S, C) first, then the twelve blends.',

  // ── Per-character specialization-fit ranking ───────────────────────────────
  elective_rank_title: 'Specialization Fit Ranking',
  elective_rank_intro:
    'All five MBA specializations in their standard elective order. The more filled dots, the stronger the fit for this character - the highlighted row is the best fit.',

  spec_chart_title: 'Specialization Fitment Overview',
  spec_chart_description:
    'Each character maps to a best-fit MBA specialization; this pie rolls the cohort up to that specialization. It shows where the batch’s strengths concentrate across Finance, HR, Business Analytics, Operations, and Marketing.',
  /** Leading "reveal the result first" sentence under the specialization pie. */
  spec_reveal_intro: (top: string, topN: number, total: number) =>
    `<p>Up front: this cohort leans <b>${top}</b> - ${topN} of ${total} students map there as their best-fit specialization. The full split is below, and the character-by-character sections that follow explain who sits where and why.</p>`,

  elective_title: 'Elective-Wise Placement Fit',
  elective_intro:
    'A quick guide to the five MBA specializations this cohort is mapped against, and how many students fit each one best.',
  elective_about_title: 'About the Electives',
  elective_headcount_title: 'Strongest-Fit Headcount by Elective',
  elective_legend: (n: number) =>
    `Each student’s strongest-fit specialization is counted once  ·  Total students: ${n}.`,

  master_grid_title: 'Specialization Master Grid',
  master_grid_intro:
    'Every student on a single page - their character and best-fit ranking across the five MBA specializations (1 = strongest fit), with the top future roles their profile points to.',
  master_grid_legend:
    '1 = Strongest Fit   ·   5 = Weakest Fit   ·   Each student’s strongest-fit specialization is highlighted in green.',

  testimonials: [
    {
      text: 'Grouping our MBA students by specialization fit instead of generic personality types changed how we run placements. We finally knew which students to push toward finance roles versus marketing roles - and why.',
      author:
        '- Mr. Rajendran K, Placement Officer, PERI Institute of Technology',
    },
    {
      text: 'The deploy-ready and grooming lists let us plan our recruiter outreach and our pre-placement coaching in one sitting, instead of two separate exercises.',
      author: '- Ms. Kavitha S, Career Development Cell Head',
    },
    {
      text: 'Having target roles and a preparation focus per specialization made our pre-placement grooming far more structured and recruiter-aligned.',
      author: '- Dr. Venkatesh M, HOD - Management Studies',
    },
  ],

  about: {
    title: 'About',
    text: '<p>The MBA Placement Handbook is a specialization-mapping tool developed by Origin BI. It applies a work-readiness assessment and working-style profile to rank each student across the five core MBA specializations, then aggregates the cohort by best-fit specialization. The result is a structured, predictive placement strategy that aligns each candidate with the specialization, roles, and recruiters that suit not only their academic track but also their demonstrated strengths.</p>',
  },

  disclaimer: {
    title: 'Disclaimer',
    text1:
      '<p>This handbook is intended for internal use by placement officers, training and placement cells, and authorized academic staff. Specialization fit is generated using predictive models based on a work-readiness assessment and working-style profile. Final placement and counseling decisions should also consider individual circumstances, academic performance, market trends, and employer expectations.</p>',
    text2:
      '<p>The information in this document is confidential and proprietary to Origin BI. Unauthorized reproduction, distribution, or sharing of any part of this handbook is strictly prohibited.</p>',
  },

  services: {
    title: 'Services Include',
    bullets: [
      'MBA Specialization-Fit Mapping (Finance, HR, Business Analytics, Operations, Marketing)',
      'Cohort Placement Strategy & Recruiter Targeting by Specialization',
      'Specialization-wise Preparation Roadmaps & Grooming Plans',
      'Faculty and Placement Officer Training Workshops',
      'Individual Student Specialization-Fit Reports',
      'AI-Powered Assessment Reports & Dashboard Integration',
    ],
  },

  contact: {
    title: 'Contact Information',
    intro:
      'For partnerships, training sessions, or access to individual student specialization reports, please contact:',
    details: `<p>Origin BI - Beyond Intelligence
Website: www.originbi.com
Email: info@originbi.com
Phone: +91 9094496385/ 9840141206
Address: No.21 B, 5th Cross Street (South Phase), Thiru Vi Ka Industrial Estate, Guindy,
Chennai, Tamil Nadu, India, 600032
Follow us: @OriginBI on LinkedIn | Instagram | X (Twitter)</p>`,
  },
};

/** Closing "About Us" page (About / Vision / Mission / Core Values / Services). */
export const END_PAGE = {
  about_title: 'About Us',
  about_text:
    'Origin BI is a pioneering educational technology company specializing in AI-driven personality assessment and career guidance solutions for higher education institutions. Founded with the vision of bridging the gap between academic learning and industry requirements, the company leverages advanced behavioural analytics, psychometric analysis, and insights on industry trends and emerging technology skills to create personalized career roadmaps for students. Origin BI has helped thousands of students discover their ideal career paths and align their education with future job market opportunities.',

  vision_title: 'Our Vision',
  vision_text:
    'To become the leading career assessment platform that transforms how educational institutions approach student placement and career development',
  mission_title: 'Our Mission',
  mission_text:
    'To empower every student with personalized career guidance that aligns with their natural strengths and market opportunities.',

  core_values_title: 'Core Values',
  core_values: [
    'Data-driven insights for personalized guidance',
    'Commitment to student success and career satisfaction',
    'Continuous innovation in assessment methodologies',
    'Ethical use of AI and student data protection',
  ],

  services_title: 'Our Services',
  services: [
    {
      icon: 'school' as const,
      title: 'Schools',
      text: 'Age-appropriate personality assessments, personalized learning profiles, and tailored career roadmaps help students from Grades 9 to 12 explore future career possibilities. Parents, teachers, and counsellors are supported with practical resources to guide student development, all aligned with evolving industry trends',
    },
    {
      icon: 'cap' as const,
      title: 'Colleges',
      text: 'Comprehensive personality and leadership assessments create personalized career pathways and industry-fit profiles for college students. Placement officers and counsellors benefit from tools and insights that connect student strengths to in-demand roles, certifications, and emerging opportunities',
    },
    {
      icon: 'people' as const,
      title: 'Employees',
      text: 'Personality and behavioural assessments empower employees with individualized career development roadmaps and actionable guidance on skill growth and leadership readiness. Managers and HR teams gain resources to shape effective learning programs that evolve with market trends and organizational goals',
    },
    {
      icon: 'exec' as const,
      title: 'CXOs',
      text: 'Executive personality insights and leadership assessments inform tailored development plans and coaching strategies for CXOs and senior leaders. These resources align leadership approaches with organizational culture and strategic direction while supporting ongoing professional growth',
    },
  ],

  disclaimer_label: 'Disclaimer:',
  disclaimer_text:
    'The information, assessments, and recommendations provided in this handbook are based on AI-generated analyses and self-reported data from students. While every effort has been made to ensure accuracy and relevance, results and suggestions may vary for each individual. The handbook is intended for guidance purposes only and should not be considered as the sole determinant in career or placement decisions. Neither the authors nor the institution assumes liability for outcomes resulting from the use of this handbook. Users are encouraged to supplement these insights with professional judgment and additional resources.',
};

/**
 * Count-grid colours per character. The 12 blends keep the established
 * personality-grid palette (matching the Standard Placement Report); the 4
 * Pure Traits use their DISC family colour (red / yellow / green / blue), per
 * the senior's direction to give D/I/S/C their own unique colours.
 */
export const CHARACTER_GRID_COLORS: Record<
  string,
  { bg: string; text: string }
> = {
  // Pure Traits - DISC colours.
  D: { bg: '#D82A29', text: '#FFFFFF' },
  I: { bg: '#F2C200', text: '#000000' },
  S: { bg: '#3FA45A', text: '#FFFFFF' },
  C: { bg: '#01AADB', text: '#FFFFFF' },
  // High-D blends.
  DI: { bg: '#EA3324', text: '#FFFFFF' },
  DS: { bg: '#FF7331', text: '#FFFFFF' },
  DC: { bg: '#FFB61F', text: '#000000' },
  // High-I blends.
  ID: { bg: '#FFD500', text: '#000000' },
  IS: { bg: '#FFE800', text: '#000000' },
  IC: { bg: '#DDD730', text: '#000000' },
  // High-S blends.
  SD: { bg: '#00BACC', text: '#FFFFFF' },
  SI: { bg: '#00C889', text: '#FFFFFF' },
  SC: { bg: '#00B355', text: '#FFFFFF' },
  // High-C blends.
  CD: { bg: '#0097E6', text: '#FFFFFF' },
  CI: { bg: '#7C4DCC', text: '#FFFFFF' },
  CS: { bg: '#B5377E', text: '#FFFFFF' },
};
