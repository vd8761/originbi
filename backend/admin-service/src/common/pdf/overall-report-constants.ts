// Overall Report Constants - Matching Reference PDF Structure

export const OVERALL_REPORT_TOC = [
    'Executive Summary & Report Index',
    'Candidate Profile Snapshots',
    'Behavioral Alignment Analysis',
    'Skill-wise Capability Assessment',
    'Future Role Readiness Mapping',
    'Role Fitment Analysis',
    'Industry-Specific Suitability',
    'Transition Requirements',
    'Origin BI Executive Insights',
    'Appendix & Legend'
];

export const READINESS_LEGEND = [
    {
        range: 'High',
        label: 'High Readiness - Ready for immediate transition',
        color: '#e6ffe6',
        textColor: '#006400'
    },
    {
        range: 'Moderate',
        label: 'Moderate Readiness - Transitionable with support',
        color: '#fff5e6',
        textColor: '#cc7000'
    },
    {
        range: 'Low',
        label: 'Low Readiness - Significant gaps exist',
        color: '#ffe6e6',
        textColor: '#8b0000'
    }
];

export const FITMENT_SCORE_LEGEND = [
    {
        range: 'Strong',
        label: 'Strong Fit - Highly recommended for role',
        color: '#e6ffe6'
    },
    {
        range: 'Conditional Strong',
        label: 'Conditional Strong Fit - Recommended with minor development',
        color: '#e6f7ff'
    },
    {
        range: 'Moderate',
        label: 'Moderate Fit - Possible with significant development',
        color: '#fff5e6'
    },
    {
        range: 'Weak',
        label: 'Weak Fit - Not recommended without major changes',
        color: '#ffe6e6'
    }
];

export const ABOUT_REPORT = `
<p>This comprehensive report provides a detailed analysis of candidates' career fitment and future role readiness. It leverages Origin BI's proprietary assessment methodology to evaluate behavioral alignment, skill capabilities, and transition potential.</p>
<p>The report is designed to assist HR professionals, hiring managers, and organizational leaders in making informed decisions about talent placement, development, and succession planning.</p>
`;

export const REPORT_PURPOSE = [
    'Assess candidates\' readiness for target roles within the organization',
    'Identify strengths and development areas for each candidate',
    'Provide actionable insights for talent development planning',
    'Support data-driven succession and placement decisions',
    'Enable personalized coaching and development roadmaps'
];

export const METHODOLOGY_OVERVIEW = `
<p>Our assessment methodology combines behavioral analysis, skill evaluation, and role-specific competency mapping to provide a holistic view of each candidate's fitment.</p>
<p>The analysis considers multiple dimensions including:</p>
`;

export const METHODOLOGY_DIMENSIONS = [
    'Behavioral Style Analysis using DISC framework',
    'Technical and Functional Skill Assessment',
    'Leadership and Management Competencies',
    'Industry and Domain Knowledge',
    'Cultural Fit and Team Dynamics',
    'Growth Potential and Adaptability'
];

export const DISCLAIMER_TEXT = `
<p><b>Important Disclaimer:</b></p>
<p>This report is generated based on assessment data and algorithmic analysis. While the insights provided are data-driven and research-backed, they should be used as one input among many in making career and placement decisions.</p>
<p>Individual circumstances, organizational context, and other qualitative factors should also be considered. Origin BI recommends using this report in conjunction with interviews, reference checks, and other evaluation methods.</p>
<p>Past performance and assessment results are not guarantees of future success. Candidates can and do grow and develop over time.</p>
`;

// Behavioral Profile Templates based on DISC
export const BEHAVIORAL_TEMPLATES = {
    D: {
        summary: 'displays a <b>dominant and results-driven style</b>. They are assertive, decisive, and focused on achieving objectives. They thrive in leadership roles and are effective at driving change.',
        strengths: ['Decisive leadership', 'Goal-oriented approach', 'Comfortable with challenges', 'Direct communication'],
        development: ['Active listening skills', 'Patience with team members', 'Collaborative decision-making']
    },
    I: {
        summary: 'displays an <b>influential and enthusiastic style</b>. They are optimistic, persuasive, and excel at building relationships. They bring energy and creativity to their teams.',
        strengths: ['Relationship building', 'Persuasive communication', 'Team motivation', 'Creative problem-solving'],
        development: ['Detail orientation', 'Follow-through on tasks', 'Time management']
    },
    S: {
        summary: 'displays a <b>steady and supportive style</b>. They are reliable, patient, and create harmonious team environments. They excel at maintaining stability and supporting colleagues.',
        strengths: ['Team collaboration', 'Consistency and reliability', 'Conflict resolution', 'Supportive leadership'],
        development: ['Adaptability to change', 'Assertiveness', 'Decision-making under pressure']
    },
    C: {
        summary: 'displays a <b>conscientious and analytical style</b>. They are detail-oriented, systematic, and focused on quality. They excel in roles requiring precision and expertise.',
        strengths: ['Analytical thinking', 'Quality focus', 'Systematic approach', 'Technical expertise'],
        development: ['Flexibility', 'Quick decision-making', 'Big-picture thinking']
    },
    DI: {
        summary: 'displays a <b>dominant and influential style (Di)</b>. They combine assertiveness with persuasiveness, making them effective at leading teams and driving results through people.',
        strengths: ['Visionary leadership', 'Persuasive communication', 'Action-oriented', 'Team inspiration'],
        development: ['Patience', 'Detail attention', 'Listening to opposing views']
    },
    DS: {
        summary: 'displays a <b>dominant and steady style (Ds)</b>. They balance results-focus with team stability, providing consistent leadership while maintaining team morale.',
        strengths: ['Balanced leadership', 'Strategic thinking', 'Team stability', 'Goal achievement'],
        development: ['Flexibility', 'Delegation', 'Innovation encouragement']
    },
    DC: {
        summary: 'displays a <b>dominant and conscientious style (Dc)</b>. They combine drive with analytical precision, excelling in roles that require both leadership and technical expertise.',
        strengths: ['Strategic analysis', 'Quality-driven leadership', 'Precise execution', 'Expert authority'],
        development: ['Interpersonal warmth', 'Team collaboration', 'Patience with process']
    },
    IS: {
        summary: 'displays an <b>influential and steady style (Is)</b>. They combine enthusiasm with stability, creating positive team environments while maintaining consistent performance.',
        strengths: ['Team motivation', 'Relationship building', 'Consistent performance', 'Positive culture'],
        development: ['Confronting issues', 'Decision firmness', 'Urgency when needed']
    },
    IC: {
        summary: 'displays an <b>influential and conscientious style (Ic)</b>. They balance creativity with precision, bringing innovative ideas while ensuring quality execution.',
        strengths: ['Creative problem-solving', 'Quality awareness', 'Communication skills', 'Attention to detail'],
        development: ['Time management', 'Task prioritization', 'Direct communication']
    },
    SC: {
        summary: 'displays a <b>steady and conscientious style (Sc)</b>. They combine reliability with attention to detail, excelling in roles requiring consistency and precision.',
        strengths: ['Reliable execution', 'Quality focus', 'Process improvement', 'Technical competence'],
        development: ['Initiative taking', 'Change adaptation', 'Quick decision-making']
    }
};

// Role Adjacency Types
export const ADJACENCY_TYPES = {
    DIRECT: {
        label: 'Direct Adjacency',
        description: 'Current role directly prepares for target role. Minimal transition required.',
        color: '#e6ffe6'
    },
    NEAR: {
        label: 'Near Adjacency',
        description: 'Strong overlap with target role requirements. Moderate transition effort needed.',
        color: '#e6f7ff'
    },
    MODERATE: {
        label: 'Moderate Adjacency',
        description: 'Some transferable skills exist. Significant development required.',
        color: '#fff5e6'
    },
    FAR: {
        label: 'Far Adjacency',
        description: 'Limited overlap with target role. Major transition and development needed.',
        color: '#ffe6e6'
    }
};

// Skill Categories for Assessment
export const SKILL_CATEGORIES = [
    'Leadership & Management',
    'Technical Expertise',
    'Strategic Thinking',
    'Communication Skills',
    'Problem Solving',
    'Team Collaboration',
    'Innovation & Creativity',
    'Domain Knowledge'
];

// Industry Types
export const INDUSTRY_SUITABILITY_TEMPLATE = {
    HIGH: 'Deep expertise and strong track record in this industry. Highly suitable for roles within this domain.',
    MODERATE: 'Transferable skills and foundational knowledge present. Can adapt with industry-specific training.',
    LOW: 'Limited industry exposure. Would require significant ramp-up time and domain learning.'
};
