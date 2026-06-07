// reports/placement/mbaPlacementConstants.ts
//
// Copy + styling for the MBA Placement Report. Mirrors the structure of
// placementConstants.ts but the content is scoped to an MBA cohort organized by
// specialization fit (Finance, HR, Business Analytics, Operations, Marketing).

import { FitLevel } from '../college/mbaConstants';

export const MBA_PLACEMENT_CONTENT = {
  cover_label: 'Placement Guidance',
  toc_title: 'Table of Contents',

  executive_summary_title: 'Executive Summary',
  executive_summary_text: (count: number) =>
    `<p>This handbook summarizes the MBA specialization assessment conducted for <b>${count} students</b>. Each student is matched to the MBA specialization where their work-readiness profile and behavioral orientation fit best, and grouped accordingly. It helps placement officers target the right recruiters and plan focused grooming before campus drives.</p>`,

  spec_chart_title: 'Specialization Distribution',
  spec_chart_description:
    'The distribution shows how the cohort’s best-fit specializations are spread across Finance, HR, Business Analytics, Operations, and Marketing - highlighting where the batch’s strengths concentrate.',

  readiness_band_title: 'Placement-Readiness Distribution',
  readiness_band_description:
    'Students are banded by their best-fit suitability score. Excellent/Good Fit students are largely deploy-ready; Moderate/Low Fit students benefit from focused grooming before high-pressure interviews.',

  behavioral_mix_title: 'Working Style Mix',

  priorities_title: 'Placement Priorities',
  deploy_ready_title: 'Deploy-Ready Shortlist',
  deploy_ready_text:
    'Students with an Excellent or Good best-fit score - prioritize these for early, higher-tier recruiter drives.',
  grooming_title: 'Grooming List',
  grooming_text:
    'Students with a Moderate or Low best-fit score - plan structured coaching on their weaker readiness areas before interviews.',

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

/** The four fit-level bands surfaced in the readiness distribution table, in order. */
export const FIT_BANDS: { level: FitLevel; color: string; meaning: string }[] =
  [
    {
      level: 'Excellent Fit',
      color: '#e2f0d9',
      meaning: 'Deploy-ready - prioritize for top-tier drives',
    },
    {
      level: 'Good Fit',
      color: '#dbeafe',
      meaning: 'Ready with light coaching',
    },
    {
      level: 'Moderate Fit',
      color: '#fff2cc',
      meaning: 'Groom before high-pressure interviews',
    },
    {
      level: 'Low Fit',
      color: '#f8d7da',
      meaning: 'Needs focused skill building',
    },
  ];
