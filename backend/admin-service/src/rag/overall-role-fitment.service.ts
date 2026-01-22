/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatGroq } from '@langchain/groq';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║    OVERALL ROLE FITMENT REPORT SERVICE                                     ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Generates group-based Role Fitment Reports for Placement Guidance         ║
 * ║  Groups students by personality types with role recommendations            ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

export interface GroupReportInput {
  groupId?: number;
  groupCode?: string;
  programId?: number;
  corporateId?: number;
  title?: string;
}

export interface PersonalityGroup {
  personalityName: string;
  personalityDescription: string;
  topRoles: RoleFitment[];
  eligibleRoles: EligibleRole[];
  students: StudentEntry[];
}

export interface RoleFitment {
  roleDesignation: string;
  department: string;
  requiredSkills: string;
  toolsTech: string;
  certifications: string;
}

export interface EligibleRole {
  roleDesignation: string;
  legend: 'strong' | 'possible' | 'not_recommended';
}

export interface StudentEntry {
  name: string;
  yearOfStudy: string;
  reportNumber: string;
}

export interface OverallRoleFitmentReport {
  reportId: string;
  title: string;
  generatedAt: Date;
  totalStudents: number;
  personalityGroups: PersonalityGroup[];
  fullReportText: string;
}

// Personality type descriptions from DISC
const PERSONALITY_TYPES: Record<
  string,
  { description: string; topRoles: RoleFitment[] }
> = {
  'Charismatic Leader': {
    description:
      'Dynamic, confident, and people-centric, Charismatic Leaders chase ambitious goals while rallying others around a compelling vision. They are decisive, comfortable with risk, and quick to initiate change. Their enthusiasm is contagious, but they may overlook details or become impatient when others need more time to buy in.',
    topRoles: [
      {
        roleDesignation: 'Associate Product Manager',
        department: 'Product & Business',
        requiredSkills: 'Roadmaps, Prioritization',
        toolsTech: 'JIRA, Trello',
        certifications: 'Product Mgmt Cert',
      },
      {
        roleDesignation: 'Growth Hacker',
        department: 'Sales & Marketing',
        requiredSkills: 'Experiments, Data-driven Marketing',
        toolsTech: 'Mixpanel, HubSpot',
        certifications: 'Growth Hacking Cert',
      },
      {
        roleDesignation: 'Junior Product Manager',
        department: 'Product & Business',
        requiredSkills: 'Product Roadmaps',
        toolsTech: 'JIRA, Trello',
        certifications: 'Product Mgmt Cert',
      },
      {
        roleDesignation: 'Sales Engineer (Pre-Sales)',
        department: 'Sales & Tech',
        requiredSkills: 'Tech Demos, Client mgmt',
        toolsTech: 'CRM, PPT',
        certifications: 'Pre-Sales Cert',
      },
      {
        roleDesignation: 'Startup Tech Generalist',
        department: 'Startups',
        requiredSkills: 'Multi-role exposure',
        toolsTech: 'Slack, GitHub',
        certifications: 'Startup Bootcamp',
      },
      {
        roleDesignation: 'Innovation Analyst',
        department: 'R&D/Product',
        requiredSkills: 'Trend spotting, Experiments',
        toolsTech: 'Miro, Trello',
        certifications: 'Innovation Cert',
      },
    ],
  },
  'Strategic Stabilizer': {
    description:
      'Strategic Stabilizers pair a results-oriented mindset with steady, methodical execution. They set clear targets and then build practical processes to reach them, paying attention to team harmony as much as to deadlines. Under heavy pressure they can appear blunt or inflexible, yet their calm resolve helps groups stay focused during turbulence.',
    topRoles: [
      {
        roleDesignation: 'Scrum Master (Junior)',
        department: 'Agile & Operations',
        requiredSkills: 'Agile, Scrum, Kanban basics',
        toolsTech: 'JIRA, Confluence',
        certifications: 'PSM I, CSM',
      },
      {
        roleDesignation: 'Implementation Engineer',
        department: 'Product & Operations',
        requiredSkills: 'ERP/CRM configuration',
        toolsTech: 'SAP, Salesforce',
        certifications: 'ERP Associate Cert',
      },
      {
        roleDesignation: 'Operations Analyst',
        department: 'Operations & Support',
        requiredSkills: 'Process Optimization, ITIL',
        toolsTech: 'ServiceNow, Excel',
        certifications: 'ITIL Foundation',
      },
      {
        roleDesignation: 'Service Delivery Coordinator',
        department: 'Operations',
        requiredSkills: 'Incident Mgmt, SLA tracking',
        toolsTech: 'ServiceNow, JIRA',
        certifications: 'ITSM Cert',
      },
    ],
  },
  'Decisive Analyst': {
    description:
      'Analytical and forceful, Decisive Analysts demand logical, data-backed solutions delivered at speed. They challenge assumptions, slice through ambiguity, and set high performance bars. Their perfectionism drives excellence, though it can also create unrealistic expectations or strain relationships if diplomacy is neglected.',
    topRoles: [
      {
        roleDesignation: 'Full-Stack Developer',
        department: 'Development & Engineering',
        requiredSkills: 'Frontend + Backend + Databases',
        toolsTech: 'VS Code, GitHub, Docker',
        certifications: 'Full-Stack Specialization',
      },
      {
        roleDesignation: 'Cloud Engineer',
        department: 'Cloud & Infra',
        requiredSkills: 'AWS, Azure, GCP basics',
        toolsTech: 'Cloud Console, Terraform',
        certifications: 'AWS Cloud Practitioner',
      },
      {
        roleDesignation: 'DevOps Engineer',
        department: 'Cloud & Infra',
        requiredSkills: 'CI/CD, Docker, Kubernetes',
        toolsTech: 'Jenkins, GitHub Actions',
        certifications: 'Docker/K8s Cert',
      },
      {
        roleDesignation: 'Ethical Hacking Associate',
        department: 'Cybersecurity',
        requiredSkills: 'Pen Testing',
        toolsTech: 'Kali Linux, Burp Suite',
        certifications: 'CEH',
      },
    ],
  },
  'Analytical Leader': {
    description:
      'Analytical Leaders couple rigorous logic with a drive for measurable achievement. They see patterns quickly, devise structured strategies, and hold teams accountable to objective metrics. Their unemotional style promotes fairness, yet it can be perceived as detached if interpersonal nuances are overlooked.',
    topRoles: [
      {
        roleDesignation: 'Backend Developer',
        department: 'Development & Engineering',
        requiredSkills: 'Node.js, Django, Spring Boot',
        toolsTech: 'Postman, MySQL, Git',
        certifications: 'Backend Nanodegree',
      },
      {
        roleDesignation: 'Automation Tester',
        department: 'Testing & QA',
        requiredSkills: 'Java/Python, Selenium, Cypress',
        toolsTech: 'Selenium, Jenkins',
        certifications: 'Selenium Cert',
      },
      {
        roleDesignation: 'Data Engineer',
        department: 'Data & Analytics',
        requiredSkills: 'SQL, Python, Spark',
        toolsTech: 'AWS/GCP Data Tools',
        certifications: 'Databricks, AWS Data Eng',
      },
      {
        roleDesignation: 'ML Engineer',
        department: 'Data & Analytics',
        requiredSkills: 'Python, ML Frameworks',
        toolsTech: 'TensorFlow, PyTorch',
        certifications: 'ML Specialization',
      },
      {
        roleDesignation: 'AI Associate',
        department: 'Data & Analytics',
        requiredSkills: 'Deep Learning, NLP',
        toolsTech: 'Keras, HuggingFace',
        certifications: 'AI Certification',
      },
    ],
  },
  'Creative Thinker': {
    description:
      'Creative Thinkers pair imaginative flair with thoughtful analysis. They enjoy brainstorming novel solutions, then polishing them with careful research and aesthetic sensitivity. Their high standards for both originality and accuracy can slow delivery if they become trapped in ideation or meticulous refinement.',
    topRoles: [
      {
        roleDesignation: 'Web Developer (Frontend)',
        department: 'Development & Engineering',
        requiredSkills: 'HTML, CSS, JavaScript, React/Angular',
        toolsTech: 'VS Code, GitHub',
        certifications: 'FreeCodeCamp, Meta Frontend',
      },
      {
        roleDesignation: 'Mobile App Developer',
        department: 'Development & Engineering',
        requiredSkills: 'Kotlin, Swift, Flutter, React Native',
        toolsTech: 'Android Studio, Xcode',
        certifications: 'Google Associate Android Dev',
      },
      {
        roleDesignation: 'Business Analyst',
        department: 'Product & Business',
        requiredSkills: 'Requirement Gathering',
        toolsTech: 'MS Office, Lucidchart',
        certifications: 'ECBA (IIBA)',
      },
      {
        roleDesignation: 'UI/UX Designer',
        department: 'Design & Content',
        requiredSkills: 'Figma, Wireframes',
        toolsTech: 'Figma, Adobe XD',
        certifications: 'Google UX Cert',
      },
    ],
  },
  'Supportive Energizer': {
    description:
      'Warm, encouraging, and service-minded, Supportive Energizers cultivate a positive team spirit while keeping an eye on practical needs. They excel at informal coaching and fostering collaboration. Conflict avoidance and difficulty saying "no" can sometimes lead to over-commitment or delayed tough decisions.',
    topRoles: [
      {
        roleDesignation: 'Customer Success Associate',
        department: 'Customer Support',
        requiredSkills: 'Client Handling',
        toolsTech: 'CRM Tools',
        certifications: 'CSM Cert',
      },
      {
        roleDesignation: 'Partner/Channel Associate',
        department: 'Sales & Marketing',
        requiredSkills: 'B2B Partnerships',
        toolsTech: 'CRM Tools',
        certifications: 'Channel Sales Cert',
      },
      {
        roleDesignation: 'Customer Experience Analyst',
        department: 'Customer Success',
        requiredSkills: 'CX metrics, feedback loops',
        toolsTech: 'CRM, SurveyMonkey',
        certifications: 'CX Cert',
      },
      {
        roleDesignation: 'Campus Recruiter (Tech)',
        department: 'HR & Recruitment',
        requiredSkills: 'College hiring drives',
        toolsTech: 'ATS Tools',
        certifications: 'Recruiter Cert',
      },
    ],
  },
  'Reliable Executor': {
    description:
      'Dependable and goal-driven, Reliable Executors convert strategic plans into orderly, trackable actions. They value consistency, outline clear procedures, and persevere until results are reached. When faced with sudden change they may resist altering proven methods, but once convinced they carry out new directives diligently.',
    topRoles: [
      {
        roleDesignation: 'Release Coordinator (Software Delivery)',
        department: 'Operations & Delivery',
        requiredSkills: 'Release planning, coordination',
        toolsTech: 'JIRA, Azure DevOps',
        certifications: 'ITIL/Change Mgmt Cert',
      },
      {
        roleDesignation: 'Compliance Operations Analyst',
        department: 'Governance & Compliance',
        requiredSkills: 'Policy adherence, audit readiness',
        toolsTech: 'Confluence, Excel',
        certifications: 'ISO 27001 Foundation',
      },
      {
        roleDesignation: 'Quality Process Analyst (CMMI/ISO)',
        department: 'Process Excellence',
        requiredSkills: 'Process mapping, CAPA, audits',
        toolsTech: 'Visio/Lucidchart',
        certifications: 'CMMI Associate',
      },
    ],
  },
  'Dependable Specialist': {
    description:
      'Precise, loyal, and process-oriented, Dependable Specialists deliver high-quality work by adhering to standards and anticipating risks. They prefer stable environments where expertise is valued and roles are well defined. Excessive caution or reluctance to delegate may limit agility under fast-changing conditions.',
    topRoles: [
      {
        roleDesignation: 'Manual Tester',
        department: 'Testing & QA',
        requiredSkills: 'Test cases, SDLC',
        toolsTech: 'JIRA, TestRail',
        certifications: 'ISTQB Foundation',
      },
      {
        roleDesignation: 'System Administrator',
        department: 'Cloud & Infra',
        requiredSkills: 'Linux, Windows Admin',
        toolsTech: 'Ansible, Shell',
        certifications: 'RHCSA',
      },
      {
        roleDesignation: 'Network Engineer',
        department: 'Cloud & Infra',
        requiredSkills: 'Networking, Firewalls',
        toolsTech: 'Cisco Packet Tracer',
        certifications: 'CCNA',
      },
      {
        roleDesignation: 'Technical Support Engineer',
        department: 'Customer Support',
        requiredSkills: 'Troubleshooting, OS Basics',
        toolsTech: 'Freshdesk, Zendesk',
        certifications: 'ITIL Foundation',
      },
    ],
  },
  'Logical Innovator': {
    description:
      'Logical Innovators integrate systematic reasoning with imaginative "what-if" exploration. They enjoy stretching boundaries while ensuring every concept is technically sound. Socially engaging but still evidence-based, they can spend too long perfecting models or convincing skeptics of unconventional ideas.',
    topRoles: [
      {
        roleDesignation: 'Chatbot Developer',
        department: 'Data & Analytics',
        requiredSkills: 'Python, NLP',
        toolsTech: 'Dialogflow, Rasa',
        certifications: 'Conversational AI Cert',
      },
      {
        roleDesignation: 'Product Designer',
        department: 'Design & Product',
        requiredSkills: 'Design + Logic',
        toolsTech: 'Figma, Adobe XD',
        certifications: 'UX Design Cert',
      },
      {
        roleDesignation: 'UI Developer',
        department: 'Development & Engineering',
        requiredSkills: 'HTML, CSS, JS, React',
        toolsTech: 'Figma, VS Code',
        certifications: 'Frontend Cert',
      },
      {
        roleDesignation: 'Data Visualization Specialist',
        department: 'Data & Analytics',
        requiredSkills: 'Power BI, Tableau, SQL',
        toolsTech: 'Power BI, Tableau',
        certifications: 'Microsoft Data Viz Cert',
      },
    ],
  },
  'Structured Supporter': {
    description:
      'Structured Supporters are meticulous planners who keep teams grounded with well-documented workflows, risk logs, and clear quality checks. Courteous and patient, they provide quiet stability behind the scenes. Aversion to conflict and a preference for certainty may slow decisions when rapid action is required.',
    topRoles: [
      {
        roleDesignation: 'Software Developer',
        department: 'Development & Engineering',
        requiredSkills: 'Java, Python, .NET, C++',
        toolsTech: 'Eclipse, VS Code, Git',
        certifications: 'Oracle Java, Microsoft C#',
      },
      {
        roleDesignation: 'QA Engineer',
        department: 'Testing & QA',
        requiredSkills: 'Agile, Testing Strategies',
        toolsTech: 'JIRA, Confluence',
        certifications: 'ISTQB Advanced',
      },
      {
        roleDesignation: 'Data Analyst',
        department: 'Data & Analytics',
        requiredSkills: 'SQL, Excel, Power BI',
        toolsTech: 'Tableau, Power BI',
        certifications: 'Google Data Analytics',
      },
      {
        roleDesignation: 'Technical Writer',
        department: 'Design & Content',
        requiredSkills: 'Documentation',
        toolsTech: 'MS Word, Confluence',
        certifications: 'Tech Writing Cert',
      },
    ],
  },
};

@Injectable()
export class OverallRoleFitmentService {
  private readonly logger = new Logger(OverallRoleFitmentService.name);
  private llm: ChatGroq | null = null;

  constructor(private dataSource: DataSource) { }

  private getLlm(): ChatGroq {
    if (!this.llm) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error('GROQ_API_KEY not set');
      this.llm = new ChatGroq({
        apiKey,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
      });
    }
    return this.llm;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN REPORT GENERATION
  // ═══════════════════════════════════════════════════════════════════════════
  async generateReport(
    input: GroupReportInput,
  ): Promise<OverallRoleFitmentReport> {
    this.logger.log(`📊 Generating Overall Role Fitment Report`);

    // Fetch students grouped by personality type
    const studentsData = await this.fetchStudentsByPersonality(input);

    if (!studentsData.length) {
      throw new Error('No students found for the specified criteria');
    }

    const reportId = this.generateReportId(input);
    const personalityGroups = this.buildPersonalityGroups(studentsData);
    const fullReportText = this.formatFullReport(personalityGroups, input);

    return {
      reportId,
      title: input.title || 'Placement Guidance Report',
      generatedAt: new Date(),
      totalStudents: studentsData.length,
      personalityGroups,
      fullReportText,
    };
  }

  private async fetchStudentsByPersonality(
    input: GroupReportInput,
  ): Promise<any[]> {
    let whereClause = 'WHERE registrations.is_deleted = false';

    if (input.groupId) {
      whereClause += ` AND registrations.group_id = ${input.groupId}`;
    }
    if (input.programId) {
      whereClause += ` AND assessment_attempts.program_id = ${input.programId}`;
    }
    if (input.corporateId) {
      whereClause += ` AND registrations.corporate_id = ${input.corporateId}`;
    }

    const query = `
            SELECT 
                registrations.id,
                registrations.full_name,
                registrations.group_id,
                groups.name as group_name,
                assessment_attempts.total_score,
                personality_traits.blended_style_name as personality_type,
                personality_traits.blended_style_desc as personality_description
            FROM registrations
            LEFT JOIN groups ON registrations.group_id = groups.id
            LEFT JOIN assessment_attempts ON assessment_attempts.registration_id = registrations.id
            LEFT JOIN personality_traits ON assessment_attempts.dominant_trait_id = personality_traits.id
            ${whereClause}
            AND personality_traits.blended_style_name IS NOT NULL
            ORDER BY personality_traits.blended_style_name, registrations.full_name
        `;

    return await this.dataSource.query(query);
  }

  private buildPersonalityGroups(studentsData: any[]): PersonalityGroup[] {
    const groupedByPersonality = new Map<string, any[]>();

    // Group students by personality type
    for (const student of studentsData) {
      const personality = student.personality_type || 'Unknown';
      if (!groupedByPersonality.has(personality)) {
        groupedByPersonality.set(personality, []);
      }
      groupedByPersonality.get(personality)!.push(student);
    }

    const groups: PersonalityGroup[] = [];

    for (const [personalityName, students] of groupedByPersonality) {
      const typeInfo = PERSONALITY_TYPES[personalityName] || {
        description:
          students[0]?.personality_description || 'No description available',
        topRoles: [],
      };

      groups.push({
        personalityName,
        personalityDescription: typeInfo.description,
        topRoles: typeInfo.topRoles,
        eligibleRoles: this.generateEligibleRoles(personalityName),
        students: students.map((s: any, index: number) => ({
          name: s.full_name,
          yearOfStudy: 'Year 0',
          reportNumber: this.generateStudentReportNumber(s, index),
        })),
      });
    }

    return groups;
  }

  private generateEligibleRoles(personalityName: string): EligibleRole[] {
    // Generate eligible roles based on personality type
    const strongRoles =
      PERSONALITY_TYPES[personalityName]?.topRoles.map(
        (r) => r.roleDesignation,
      ) || [];

    const allRoles = [
      'Associate Product Manager',
      'Growth Hacker',
      'Junior Product Manager',
      'Sales Engineer (Pre-Sales)',
      'Full-Stack Developer',
      'Backend Developer',
      'Frontend Developer',
      'Mobile App Developer',
      'DevOps Engineer',
      'Cloud Engineer',
      'Data Engineer',
      'ML Engineer',
      'AI Associate',
      'QA Engineer',
      'Automation Tester',
      'Manual Tester',
      'Business Analyst',
      'Scrum Master',
      'UI/UX Designer',
      'Product Designer',
      'Technical Writer',
      'Customer Success Associate',
    ];

    return allRoles.slice(0, 20).map((role) => ({
      roleDesignation: role,
      legend: strongRoles.includes(role)
        ? ('strong' as const)
        : Math.random() > 0.5
          ? ('possible' as const)
          : ('not_recommended' as const),
    }));
  }

  private generateReportId(input: GroupReportInput): string {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const groupCode = input.groupCode || 'G' + (input.groupId || '1');
    return `OBI-${groupCode}-${month}/${year}-OVERALL`;
  }

  private generateStudentReportNumber(student: any, index: number): string {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const seq = String(index + 1).padStart(4, '0');
    return `OBI-G${student.group_id || '1'}-${month}/${year}-${seq}`;
  }

  private formatFullReport(
    groups: PersonalityGroup[],
    input: GroupReportInput,
  ): string {
    let report = `
═══════════════════════════════════════════════════════════════════════════════
                            ROLE FITMENT REPORT
                            ${input.title || 'Placement Guidance'}
═══════════════════════════════════════════════════════════════════════════════

`;
    let pageNum = 1;

    for (const group of groups) {
      report += `
═══════════════════════════════════════════════════════════════════════════════
${group.personalityName}
═══════════════════════════════════════════════════════════════════════════════

${group.personalityDescription}

📋 ROLE FITMENT
───────────────────────────────────────────────────────────────────────────────
`;
      // Add top roles table
      report += `| S.No | Role / Designation | Department | Required Skills | Tools/Tech | Certifications |
|------|-------------------|------------|----------------|-----------|----------------|
`;
      group.topRoles.forEach((role, i) => {
        report += `| ${i + 1} | ${role.roleDesignation} | ${role.department} | ${role.requiredSkills} | ${role.toolsTech} | ${role.certifications} |
`;
      });

      // Add eligible roles
      report += `

📊 ELIGIBLE ROLES
───────────────────────────────────────────────────────────────────────────────
Legend: 🟢 Strong natural fit | 🟡 Possible fit | 🔴 Not recommended

`;
      group.eligibleRoles.forEach((role, i) => {
        const legend =
          role.legend === 'strong'
            ? '🟢'
            : role.legend === 'possible'
              ? '🟡'
              : '🔴';
        report += `${i + 1}. ${role.roleDesignation} ${legend}
`;
      });

      // Add students list
      report += `

👥 STUDENTS LIST (${group.students.length} students)
───────────────────────────────────────────────────────────────────────────────
| S.No | Name | Year of Study | Report Number |
|------|------|---------------|---------------|
`;
      group.students.forEach((student, i) => {
        report += `| ${i + 1} | ${student.name} | ${student.yearOfStudy} | ${student.reportNumber} |
`;
      });

      report += `
───────────────────────────────────────────────────────────────────────────────
Origin BI # Page ${pageNum++}
`;
    }

    report += `
═══════════════════════════════════════════════════════════════════════════════
`;

    return report;
  }

  // Format for chat display (summary version)
  formatForChat(report: OverallRoleFitmentReport): string {
    let summary = `**📊 Overall Role Fitment Report**\n\n`;
    summary += `**Report ID:** ${report.reportId}\n`;
    summary += `**Total Students:** ${report.totalStudents}\n`;
    summary += `**Personality Types:** ${report.personalityGroups.length}\n\n`;

    summary += `**Breakdown by Personality:**\n`;
    for (const group of report.personalityGroups) {
      summary += `• **${group.personalityName}:** ${group.students.length} students\n`;
    }

    summary += `\n---\n\n${report.fullReportText}`;
    return summary;
  }
}
