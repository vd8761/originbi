// reports/placement/placementConstants.ts

export const PLACEMENT_CONTENT = {
    toc_title: "Table of Contents",
    executive_summary_title: "Executive Summary",
    executive_summary_text: (count: number) =>
        `<p>This handbook summarizes the career assessment conducted for <b>${count} students</b>. Each student has been mapped to a personality type and a corresponding leadership style. The data assists placement officers in aligning students with job opportunities that best fit their individual strengths.</p>`,

    chart_description:
        "The visual shows the distribution of students among the 12 personality types, highlighting the most common behavioral tendencies within the group.",

    testimonials: [
        {
            text: "As a placement officer, this handbook gave me a fresh perspective on how to match students with roles that fit not just their skills but also their personality. It helped reduce mismatches during campus recruitment.",
            author: "- Mr. Rajendran K, Placement Officer, PERI Institute of Technology",
        },
        {
            text: "The clarity with which each student’s career path was laid out made our internal guidance sessions much more targeted and meaningful.",
            author: "- Ms. Kavitha S, Career Development Cell Head",
        },
        {
            text: "For the first time, I could confidently advise companies on which student profiles aligned with their role expectations. This handbook is a game-changer!",
            author: "- Dr. Venkatesh M, HOD - IT Department",
        },
    ],

    about: {
        title: "2. About",
        text: "<p>The College Placement Officer Handbook is a career-mapping tool developed by Origin BI, in collaboration with institutional partners. It leverages behavioral intelligence, AI-generated assessments, and role-personality alignment frameworks to help placement officers make informed decisions. This guide analyzes core strengths, decision-making styles, and student aspirations to provide a structured and predictive placement strategy-ensuring each candidate is matched with a career that suits not only their academic qualifications but also their unique personality.</p>",
    },

    disclaimer: {
        title: "3. Disclaimer",
        text1: "<p>This handbook is intended for internal use by placement officers, training and placement cells, and authorized academic staff. The assessments and career recommendations are generated using predictive models and AI-based tools. While every effort has been made to ensure accuracy and relevance, final decisions regarding placement should consider individual circumstances, market trends, and employer expectations.</p>",
        text2: "<p>The information provided in this document is confidential and proprietary to Origin BI. Unauthorized reproduction, distribution, or sharing of any part of this handbook is strictly prohibited.</p>",
    },

    services: {
        title: "4. Services Include",
        bullets: [
            "Personality-Based Career Mapping",
            "Customized Roadmaps for 12 Personality Profiles",
            "Toolkits for Role Preparation (e.g., Product Management, Cybersecurity, AI/ML)",
            "Faculty and Placement Officer Training Workshops",
            "Student Insight Reports with Job Fit Recommendations",
            "AI-Powered Assessment Reports & Dashboard Integration",
            "Recruiter Engagement and Talent Mapping Services",
        ],
    },

    contact: {
        title: "5. Contact Information",
        intro: "For partnerships, training sessions, or access to individual student reports, please contact:",
        details: `<p>Origin BI - Beyond Intelligence
Website: www.originbi.com
Email: info@originbi.com
Phone: +91 9094496385/ 9840141206
Address: No.21 B, 5th Cross Street (South Phase), Thiru Vi Ka Industrial Estate, Guindy,
Chennai, Tamil Nadu, India, 600032
Follow us: @OriginBI on LinkedIn | Instagram | X (Twitter)</p>`,
    },
};

export const ACI_CONFIG = [
    {
        level: "Agile Naturalist",
        minScore: 100,
        rangeLabel: "100-125",
        color: "#e2f0d9",
        strategy: "Prioritize Tier-1 recruiters",
        readiness: "High Corporate Ready",
        readinessAction: "Deployment (Immediate)",
        companyTier: "Tier-1 MNC",
    },
    {
        level: "Agile Adaptive",
        minScore: 75,
        rangeLabel: "75-99",
        color: "#fff2cc",
        strategy: "Ready with minor coaching",
        readiness: "Ready with Guidance",
        readinessAction: "Mentoring (1-Month)",
        companyTier: "Mid-Size Enterprise", // Note: Logic handles >90 split separately
    },
    {
        level: "Agile Learner",
        minScore: 50,
        rangeLabel: "50-74",
        color: "#fce4d6",
        strategy: "Groom before high-pressure interviews",
        readiness: "Require Grooming",
        readinessAction: "Training Boot Camp",
        companyTier: "Service-Based Company",
    },
    {
        level: "Agile Resistant",
        minScore: 0,
        rangeLabel: "0-49",
        color: "#f8d7da",
        strategy: "Needs Improvement",
        readiness: "Developing",
        readinessAction: "Skill Building", // Inferred/Default
        companyTier: "Developing",
    },
];

export const DISC_COLORS: { [key: string]: string } = {
    D: "#D82A29", // Red
    I: "#FEDD10", // Yellow
    C: "#01AADB", // Blue
    S: "#4FB965", // Green
};

export const DISC_TEXT_COLORS: { [key: string]: string } = {
    D: "#FFFFFF",
    I: "#000000",
    C: "#FFFFFF",
    S: "#FFFFFF",
};

export const ORDERED_STYLES = [
    "Charismatic Leader", // 1 DI
    "Strategic Stabilizer", // 2 DS
    "Decisive Analyst", // 3 DC
    "Energetic Visionary", // 4 ID
    "Supportive Energizer", // 5 IS
    "Creative Thinker", // 6 IC
    "Reliable Executor", // 7 SD
    "Collaborative Optimist", // 8 SI
    "Dependable Specialist", // 9 SC
    "Analytical Leader", // 10 CD
    "Logical Innovator", // 11 CI
    "Structured Supporter", // 12 CS
];

export const TABLE_STYLES = {
    headerColor: "#eef1fb",
    headerTextColor: "#1c2a5f",
    rowColor: "#ffffff",
    rowTextColor: "#222222",
    alternateRowColor: "#fafafa",
    borderColor: "#cfcfe6",
};
