require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const DEGREE_ID = 21; // Commerce - B.Com
const TARGET_TRAITS = ['SD', 'SI', 'SC', 'CD', 'CI', 'CS'];

function buildSectionContent(role) {
  return [
    { title: 'Overview', content: role.overview },
    { title: 'Natural Strengths', content: role.natural_strengths },
    {
      title: 'Roadmap & Fundamental Learning',
      content: [
        { subtitle: 'Foundation', text: role.roadmap.foundation },
        { subtitle: 'Action Steps', text: role.roadmap.action_steps },
        { subtitle: 'Advancement', text: role.roadmap.advancement },
        { subtitle: 'Career Entry', text: role.roadmap.career_entry },
      ],
    },
    {
      title: 'Detailed Guidelines',
      content: [
        { subtitle: 'What mindset helps you excel?', bullets: role.detailed.mindset },
        { subtitle: 'What habits build your expertise?', bullets: role.detailed.habits },
        { subtitle: 'Weekly effort for mastery:', bullets: role.detailed.weekly, tip: role.detailed.weekly_tip },
        { subtitle: 'Must-attend events in India:', bullets: role.detailed.events },
        { subtitle: 'Books to read:', bullets: role.detailed.books },
        { subtitle: 'Essential tools to master:', bullets: role.tools },
      ],
    },
    { title: 'Guidance Tip', content: role.guidance_tip },
  ];
}

const DATA = [
  {
    traitCode: 'SD',
    roles: [
      {
        career_role_name: 'Operations Manager',
        short_description: 'Ensure daily operations run smoothly, efficiently, and consistently across teams.',
        overview: 'Operations Managers ensure that daily business activities run smoothly, efficiently, and consistently across departments.',
        natural_strengths: 'Your reliability, discipline, and execution focus make you strong in managing structured operations.',
        roadmap: {
          foundation: 'Learn operations management, supply chain basics, and process optimization.',
          action_steps: 'Work on operational tasks, internships, and process improvement projects.',
          advancement: 'Move into senior operations and management roles.',
          career_entry: 'Operations Executive, Process Associate, Operations Analyst.',
        },
        detailed: {
          mindset: [
            'Focus on consistency and efficiency in execution.',
            'Take responsibility for completing tasks accurately.',
            'Stay calm and organized under pressure.',
            'Aim for continuous process improvement.',
          ],
          habits: [
            'Track and improve workflows regularly.',
            'Maintain detailed documentation.',
            'Follow structured processes strictly.',
            'Learn operational tools and systems.',
            'Collaborate with teams effectively.',
          ],
          weekly: [
            'Operations management practice (8-10 hrs/week)',
            'Process improvement learning (4-6 hrs/week)',
            'Coordination and communication (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Small improvements in execution can lead to big efficiency gains over time.',
          events: [
            'Operations Management Conferences',
            'Supply Chain Meetups',
            'Process Improvement Workshops',
            'LinkedIn operations groups',
            'College commerce clubs',
          ],
          books: [
            'The Goal by Eliyahu Goldratt',
            'Operations Management by Heizer',
            'Lean Thinking by James Womack',
            'Atomic Habits by James Clear',
            'Good to Great by Jim Collins',
          ],
        },
        tools: ['Excel', 'ERP Systems', 'SAP', 'Power BI', 'Google Sheets'],
        guidance_tip: 'Your strength lies in execution. Focus on delivering consistent and efficient results.',
      },
      {
        career_role_name: 'Accounts Executive',
        short_description: 'Manage bookkeeping and financial records with high accuracy and compliance discipline.',
        overview: 'Accounts Executives manage financial transactions, bookkeeping, and ensure accurate financial records for organizations.',
        natural_strengths: 'Your attention to detail and consistency help you maintain accurate financial records and avoid errors.',
        roadmap: {
          foundation: 'Learn accounting principles, bookkeeping, and financial reporting.',
          action_steps: 'Practice accounting entries, internships in finance departments, and work with accounting software.',
          advancement: 'Pursue CA/CMA and move into senior accounting roles.',
          career_entry: 'Accounts Assistant, Junior Accountant, Billing Executive.',
        },
        detailed: {
          mindset: [
            'Focus on accuracy and discipline.',
            'Be consistent in financial reporting.',
            'Maintain accountability in work.',
            'Follow structured accounting processes.',
          ],
          habits: [
            'Practice accounting regularly.',
            'Maintain organized records.',
            'Learn accounting software tools.',
            'Stay updated with financial regulations.',
            'Double-check financial entries.',
          ],
          weekly: [
            'Accounting practice (8-10 hrs/week)',
            'Learning financial concepts (4-6 hrs/week)',
            'Skill development (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Accuracy and consistency are more important than speed in accounting.',
          events: ['ICAI Events', 'Accounting Workshops', 'Finance Conferences', 'LinkedIn accounting groups', 'Commerce associations'],
          books: [
            'Accounting Made Simple',
            'Financial Statements by Thomas Ittelson',
            'The Intelligent Investor',
            'Principles by Ray Dalio',
            'Cost Accounting by Horngren',
          ],
        },
        tools: ['Tally', 'Excel', 'QuickBooks', 'SAP', 'Google Sheets'],
        guidance_tip: 'Your consistency and discipline make you a strong accountant. Focus on accuracy and reliability.',
      },
      {
        career_role_name: 'Supply Chain Coordinator',
        short_description: 'Coordinate logistics, procurement, and inventory flow with dependable execution.',
        overview: 'Supply Chain Coordinators manage logistics, inventory, and procurement processes to ensure smooth product flow.',
        natural_strengths: 'Your structured approach and reliability help maintain smooth and efficient supply chain operations.',
        roadmap: {
          foundation: 'Learn supply chain management, logistics, and inventory control.',
          action_steps: 'Work on logistics operations, internships, and warehouse management systems.',
          advancement: 'Move into supply chain management roles.',
          career_entry: 'Logistics Executive, Supply Chain Analyst, Inventory Coordinator.',
        },
        detailed: {
          mindset: [
            'Focus on efficiency and accuracy.',
            'Stay organized in handling processes.',
            'Be proactive in solving delays.',
            'Maintain consistency in operations.',
          ],
          habits: [
            'Track inventory and logistics regularly.',
            'Learn supply chain tools.',
            'Analyze process inefficiencies.',
            'Maintain proper documentation.',
            'Coordinate with vendors and teams.',
          ],
          weekly: [
            'Supply chain operations (8-10 hrs/week)',
            'Learning logistics systems (4-6 hrs/week)',
            'Coordination and improvement (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Efficient coordination is the backbone of a strong supply chain.',
          events: ['Supply Chain Conferences', 'Logistics Meetups', 'Operations Workshops', 'LinkedIn supply chain groups', 'Commerce clubs'],
          books: [
            'Supply Chain Management by Chopra',
            'The Goal by Eliyahu Goldratt',
            'Lean Thinking',
            'Operations Management',
            'Good to Great',
          ],
        },
        tools: ['ERP Systems', 'SAP', 'Excel', 'Inventory Software', 'Power BI'],
        guidance_tip: 'Your structured execution ensures smooth operations. Focus on coordination and efficiency.',
      },
      {
        career_role_name: 'Banking Operations Officer',
        short_description: 'Run banking transactions and controls with high compliance and operational accuracy.',
        overview: 'Banking Operations Officers manage internal banking processes such as transactions, compliance, and customer service operations.',
        natural_strengths: 'Your reliability and discipline help you manage financial operations with accuracy and consistency.',
        roadmap: {
          foundation: 'Learn banking processes, financial operations, and compliance rules.',
          action_steps: 'Intern in banks, handle transactions, and learn operational systems.',
          advancement: 'Move into senior banking or branch management roles.',
          career_entry: 'Banking Executive, Operations Associate, Clerk.',
        },
        detailed: {
          mindset: [
            'Focus on accuracy and compliance.',
            'Maintain discipline in processes.',
            'Be consistent in execution.',
            'Ensure customer service quality.',
          ],
          habits: [
            'Practice banking operations regularly.',
            'Learn compliance requirements.',
            'Improve customer handling skills.',
            'Maintain proper documentation.',
            'Stay updated with banking rules.',
          ],
          weekly: [
            'Banking operations practice (8-10 hrs/week)',
            'Learning compliance (4-6 hrs/week)',
            'Skill development (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Accuracy and discipline are key in banking roles. Avoid errors at all costs.',
          events: ['Banking Conferences', 'Finance Workshops', 'RBI Awareness Programs', 'LinkedIn finance groups', 'Commerce clubs'],
          books: ['Banking Theory and Practice', 'The Intelligent Investor', 'Financial Intelligence', 'Principles by Ray Dalio', 'Rich Dad Poor Dad'],
        },
        tools: ['Core Banking Software', 'Excel', 'Tally', 'SAP', 'Google Sheets'],
        guidance_tip: 'Your consistency and discipline make you ideal for banking operations. Focus on accuracy and process excellence.',
      },
      {
        career_role_name: 'Administrative Manager',
        short_description: 'Manage office operations, coordination, and process discipline for organizational efficiency.',
        overview: 'Administrative Managers oversee office operations, manage resources, and ensure organizational efficiency.',
        natural_strengths: 'Your structured approach and reliability help you manage administrative tasks efficiently.',
        roadmap: {
          foundation: 'Learn business administration, office management, and coordination skills.',
          action_steps: 'Handle administrative tasks, internships, and office coordination roles.',
          advancement: 'Move into senior administration roles.',
          career_entry: 'Admin Executive, Office Coordinator, Operations Assistant.',
        },
        detailed: {
          mindset: ['Focus on organization and efficiency.', 'Be dependable in handling tasks.', 'Stay disciplined and consistent.', 'Support team productivity.'],
          habits: ['Maintain organized records.', 'Manage schedules effectively.', 'Improve coordination skills.', 'Learn administrative tools.', 'Communicate clearly with teams.'],
          weekly: [
            'Administrative tasks and coordination (8-10 hrs/week)',
            'Learning and development (4-6 hrs/week)',
            'Communication and improvement (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Organization and consistency are your biggest strengths. Use them daily.',
          events: ['Business Administration Conferences', 'Office Management Workshops', 'LinkedIn communities', 'Commerce clubs', 'Networking events'],
          books: ['Getting Things Done', 'Atomic Habits', 'The 7 Habits of Highly Effective People', 'Good to Great', 'Essentialism'],
        },
        tools: ['MS Office', 'Google Workspace', 'Trello', 'Notion', 'Excel'],
        guidance_tip: 'Your structured execution helps organizations run smoothly. Focus on consistency and coordination.',
      },
      {
        career_role_name: 'Procurement Executive',
        short_description: 'Manage purchasing, vendor performance, and cost efficiency with process reliability.',
        overview: 'Procurement Executives manage purchasing, vendor relationships, and cost optimization for organizations.',
        natural_strengths: 'Your disciplined approach and reliability help you manage procurement processes effectively.',
        roadmap: {
          foundation: 'Learn procurement processes, vendor management, and cost analysis.',
          action_steps: 'Work with vendors, handle purchase orders, and internships in procurement roles.',
          advancement: 'Move into procurement management roles.',
          career_entry: 'Procurement Assistant, Purchase Executive, Vendor Coordinator.',
        },
        detailed: {
          mindset: ['Focus on cost efficiency and quality.', 'Be consistent in vendor management.', 'Stay disciplined in processes.', 'Build reliable supplier relationships.'],
          habits: ['Track procurement processes regularly.', 'Analyze costs and vendor performance.', 'Maintain vendor records.', 'Improve negotiation skills.', 'Learn procurement systems.'],
          weekly: [
            'Procurement and vendor management (8-10 hrs/week)',
            'Cost analysis learning (4-6 hrs/week)',
            'Coordination and development (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Strong vendor relationships lead to better business outcomes.',
          events: ['Procurement Conferences', 'Supply Chain Events', 'Vendor Meetups', 'LinkedIn groups', 'Commerce clubs'],
          books: ['Supply Chain Management', 'The Goal', 'Negotiation Genius', 'Good to Great', 'Atomic Habits'],
        },
        tools: ['ERP Systems', 'SAP', 'Excel', 'Procurement Software', 'Google Sheets'],
        guidance_tip: 'Your discipline ensures reliable execution. Focus on efficiency and strong vendor coordination.',
      },
    ],
  },
  {
    traitCode: 'SI',
    roles: [
      {
        career_role_name: 'Team Coordinator - Business Operations',
        short_description: 'Coordinate cross-team execution and maintain smooth operational collaboration.',
        overview: 'Team Coordinators support business operations by ensuring smooth collaboration between departments, managing tasks, and maintaining workflow efficiency.',
        natural_strengths: 'Your cooperative nature, positivity, and people skills help create a supportive and productive team environment.',
        roadmap: {
          foundation: 'Learn business operations, coordination skills, and communication techniques.',
          action_steps: 'Participate in team projects, internships, and coordination roles in college or organizations.',
          advancement: 'Move into operations or project management roles.',
          career_entry: 'Operations Coordinator, Team Assistant, Project Assistant.',
        },
        detailed: {
          mindset: ['Focus on teamwork and collaboration.', 'Maintain a positive and supportive attitude.', 'Be adaptable in working with different teams.', 'Value consistency and smooth coordination.'],
          habits: ['Communicate clearly with team members.', 'Track tasks and deadlines regularly.', 'Support team members proactively.', 'Maintain organized workflows.', 'Build strong working relationships.'],
          weekly: [
            'Team coordination and tasks (8-10 hrs/week)',
            'Learning operations and tools (4-6 hrs/week)',
            'Communication and development (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Strong teamwork and communication create efficient and successful operations.',
          events: ['Business Networking Events', 'Operations Workshops', 'LinkedIn communities', 'College commerce clubs', 'Team leadership programs'],
          books: ['The 7 Habits of Highly Effective People', 'Leaders Eat Last', 'Atomic Habits', 'Getting Things Done', 'Good to Great'],
        },
        tools: ['Trello', 'Notion', 'Google Workspace', 'Excel', 'Slack'],
        guidance_tip: 'Your ability to bring people together is your strength. Focus on building strong and supportive teams.',
      },
      {
        career_role_name: 'Client Relationship Executive',
        short_description: 'Maintain long-term client trust through responsive communication and service reliability.',
        overview: 'Client Relationship Executives manage ongoing communication with clients, ensuring satisfaction and long-term partnerships.',
        natural_strengths: 'Your friendly nature, optimism, and communication skills help you build trust and maintain positive client relationships.',
        roadmap: {
          foundation: 'Learn customer relationship management, communication, and service strategies.',
          action_steps: 'Intern in client-facing roles, handle communication, and learn CRM tools.',
          advancement: 'Move into account management or customer success roles.',
          career_entry: 'Client Executive, Customer Success Associate, Account Coordinator.',
        },
        detailed: {
          mindset: ['Focus on building long-term relationships.', 'Stay positive and approachable.', 'Be responsive to client needs.', 'Value trust and consistency.'],
          habits: ['Maintain regular client communication.', 'Understand client requirements deeply.', 'Track feedback and satisfaction.', 'Improve communication skills.', 'Build strong professional networks.'],
          weekly: [
            'Client interaction and follow-ups (8-10 hrs/week)',
            'Learning CRM tools and strategies (4-6 hrs/week)',
            'Networking and development (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Positive relationships drive long-term business success.',
          events: ['Customer Success Meetups', 'Business Networking Events', 'LinkedIn communities', 'Commerce associations', 'College clubs'],
          books: ['How to Win Friends and Influence People', 'The Trusted Advisor', 'Customer Success', 'Never Split the Difference', 'Give and Take'],
        },
        tools: ['Salesforce', 'Zoho CRM', 'HubSpot', 'Excel', 'Google Sheets'],
        guidance_tip: 'Your positivity builds trust. Focus on maintaining strong and meaningful client relationships.',
      },
      {
        career_role_name: 'HR Engagement Specialist',
        short_description: 'Strengthen workplace culture through employee engagement and collaboration programs.',
        overview: 'HR Engagement Specialists focus on employee engagement, workplace culture, and improving employee satisfaction.',
        natural_strengths: 'Your supportive and collaborative nature helps you connect with employees and create a positive work environment.',
        roadmap: {
          foundation: 'Learn HR principles, employee engagement strategies, and organizational behavior.',
          action_steps: 'Participate in HR activities, internships, and engagement programs.',
          advancement: 'Move into HR management or culture leadership roles.',
          career_entry: 'HR Executive, Engagement Coordinator, HR Associate.',
        },
        detailed: {
          mindset: ['Focus on employee well-being.', 'Stay empathetic and approachable.', 'Build a positive workplace culture.', 'Encourage collaboration and teamwork.'],
          habits: ['Engage with employees regularly.', 'Plan team-building activities.', 'Gather feedback and improve processes.', 'Improve communication skills.', 'Learn HR tools and systems.'],
          weekly: [
            'HR activities and engagement (8-10 hrs/week)',
            'Learning HR systems (4-6 hrs/week)',
            'Communication and development (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'A positive workplace leads to better performance and retention.',
          events: ['HR Conferences', 'Employee Engagement Workshops', 'LinkedIn HR groups', 'Commerce clubs', 'Networking events'],
          books: ['Work Rules', 'Drive', 'Leaders Eat Last', 'First Break All the Rules', 'The Culture Code'],
        },
        tools: ['Zoho People', 'HRMS Software', 'Excel', 'Google Forms', 'Slack'],
        guidance_tip: 'Your supportive nature helps build strong teams. Focus on creating a positive work culture.',
      },
      {
        career_role_name: 'Event and Program Manager',
        short_description: 'Plan and execute events that build engagement for clients and teams.',
        overview: 'Event Managers plan and execute corporate events, programs, and business activities to engage clients and employees.',
        natural_strengths: 'Your energy, teamwork, and coordination skills help you manage events effectively and create positive experiences.',
        roadmap: {
          foundation: 'Learn event management, planning, and coordination skills.',
          action_steps: 'Organize college events, internships, and corporate programs.',
          advancement: 'Move into senior event or program management roles.',
          career_entry: 'Event Coordinator, Program Executive, Event Assistant.',
        },
        detailed: {
          mindset: ['Focus on creating positive experiences.', 'Stay organized and adaptable.', 'Work collaboratively with teams.', 'Maintain attention to detail.'],
          habits: ['Plan events regularly.', 'Build vendor and client networks.', 'Track event performance.', 'Improve coordination skills.', 'Learn from each event.'],
          weekly: [
            'Event planning and execution (8-10 hrs/week)',
            'Coordination and networking (4-6 hrs/week)',
            'Learning and improvement (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Successful events depend on strong planning and teamwork.',
          events: ['Event Management Conferences', 'Business Networking Events', 'Startup Meetups', 'LinkedIn communities', 'College clubs'],
          books: ['The Art of Gathering', 'Event Planning', 'Leaders Eat Last', 'Atomic Habits', 'Start with Why'],
        },
        tools: ['Trello', 'Google Calendar', 'Canva', 'Excel', 'Event Software'],
        guidance_tip: 'Your collaborative energy creates memorable experiences. Focus on coordination and execution.',
      },
      {
        career_role_name: 'Retail Experience Manager',
        short_description: 'Improve store performance through customer experience and team collaboration.',
        overview: 'Retail Experience Managers focus on enhancing customer experience, managing store operations, and improving customer satisfaction.',
        natural_strengths: 'Your friendly and supportive nature helps you create positive customer experiences and maintain strong relationships.',
        roadmap: {
          foundation: 'Learn retail management, customer service, and operations.',
          action_steps: 'Work in retail roles, manage teams, and handle customer interactions.',
          advancement: 'Move into senior retail or regional management roles.',
          career_entry: 'Retail Executive, Store Supervisor, Customer Experience Associate.',
        },
        detailed: {
          mindset: ['Focus on customer satisfaction.', 'Stay positive and approachable.', 'Support team collaboration.', 'Maintain consistency in service.'],
          habits: ['Monitor customer feedback.', 'Improve service quality.', 'Train and support team members.', 'Track sales and performance.', 'Maintain store standards.'],
          weekly: [
            'Customer service and operations (8-10 hrs/week)',
            'Team coordination (4-6 hrs/week)',
            'Learning and improvement (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'A great customer experience builds long-term loyalty.',
          events: ['Retail Conferences', 'Customer Service Workshops', 'LinkedIn communities', 'Commerce clubs', 'Networking events'],
          books: ['The Customer Experience Book', 'Leaders Eat Last', 'Atomic Habits', 'The Psychology of Selling', 'Start with Why'],
        },
        tools: ['POS Systems', 'CRM Software', 'Excel', 'Google Sheets', 'Inventory Tools'],
        guidance_tip: 'Your positivity enhances customer experiences. Focus on service excellence and teamwork.',
      },
      {
        career_role_name: 'Community and Engagement Manager',
        short_description: 'Build active communities through consistent engagement and relationship care.',
        overview: 'Community Managers build and manage online or offline communities, ensuring engagement, interaction, and brand loyalty.',
        natural_strengths: 'Your ability to connect with people and maintain positive interactions helps you build strong communities.',
        roadmap: {
          foundation: 'Learn community management, communication, and engagement strategies.',
          action_steps: 'Manage online communities, social groups, and engagement activities.',
          advancement: 'Move into brand or community leadership roles.',
          career_entry: 'Community Executive, Social Media Coordinator, Engagement Associate.',
        },
        detailed: {
          mindset: ['Focus on building meaningful connections.', 'Stay positive and engaging.', 'Encourage community participation.', 'Maintain consistency in communication.'],
          habits: ['Engage with community members regularly.', 'Create interactive content.', 'Track engagement metrics.', 'Build relationships with members.', 'Stay updated with trends.'],
          weekly: [
            'Community engagement (8-10 hrs/week)',
            'Content and interaction (4-6 hrs/week)',
            'Learning and networking (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Strong communities grow through consistent interaction and trust.',
          events: ['Community Management Meetups', 'Social Media Events', 'LinkedIn groups', 'Creator communities', 'College clubs'],
          books: ['Jab, Jab, Jab, Right Hook', 'Contagious', 'This is Marketing', 'Building a StoryBrand', 'Crushing It'],
        },
        tools: ['Hootsuite', 'Buffer', 'Canva', 'Meta Ads Manager', 'Google Analytics'],
        guidance_tip: 'Your collaborative nature builds strong communities. Focus on engagement and consistency.',
      },
    ],
  },
  {
    traitCode: 'SC',
    roles: [
      {
        career_role_name: 'Chartered Accountant (CA)',
        short_description: 'Deliver high-precision accounting, audit, and tax compliance for organizations.',
        overview: 'Chartered Accountants manage financial reporting, auditing, taxation, and compliance, ensuring financial accuracy and legal adherence for businesses.',
        natural_strengths: 'Your precision, patience, and structured thinking make you highly effective in handling complex financial systems and ensuring compliance.',
        roadmap: {
          foundation: 'Learn accounting principles, taxation, auditing, and financial laws.',
          action_steps: 'Enroll in CA program, complete articleship, and practice accounting and audit work.',
          advancement: 'Qualify CA exams and specialize in audit, tax, or corporate finance.',
          career_entry: 'Audit Assistant, Accounts Executive, Tax Associate.',
        },
        detailed: {
          mindset: ['Focus on accuracy and perfection in financial work.', 'Be disciplined and consistent in preparation.', 'Follow structured processes strictly.', 'Maintain integrity in all financial decisions.'],
          habits: ['Practice accounting problems daily.', 'Revise concepts regularly.', 'Stay updated with tax laws.', 'Maintain detailed notes and records.', 'Solve past exam papers consistently.'],
          weekly: [
            'Accounting and taxation study (8-10 hrs/week)',
            'Practice and revision (4-6 hrs/week)',
            'Concept strengthening (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Consistency in preparation is the key to clearing professional exams like CA.',
          events: ['ICAI Student Events', 'Accounting Workshops', 'Tax Seminars', 'Commerce Associations', 'LinkedIn finance groups'],
          books: ['Accounting Standards by ICAI', 'Taxation Laws and Practice', 'Auditing and Assurance', 'Financial Reporting by ICAI', 'The Intelligent Investor'],
        },
        tools: ['Tally', 'Excel', 'QuickBooks', 'SAP', 'Google Sheets'],
        guidance_tip: 'Your attention to detail is your biggest strength. Focus on mastering fundamentals and consistency.',
      },
      {
        career_role_name: 'Financial Reporting Analyst',
        short_description: 'Prepare clear, accurate financial statements and reporting insights.',
        overview: 'Financial Reporting Analysts prepare and analyze financial statements, ensuring accurate reporting for business decision-making.',
        natural_strengths: 'Your structured thinking and attention to detail help you produce accurate financial reports and insights.',
        roadmap: {
          foundation: 'Learn financial accounting, reporting standards, and analysis.',
          action_steps: 'Work on financial statements, internships, and reporting tools.',
          advancement: 'Specialize in financial reporting or corporate finance roles.',
          career_entry: 'Accounts Analyst, Financial Analyst, Reporting Executive.',
        },
        detailed: {
          mindset: ['Focus on precision and clarity.', 'Maintain consistency in reporting.', 'Be detail-oriented in analysis.', 'Follow structured processes.'],
          habits: ['Practice financial statement preparation.', 'Analyze company reports.', 'Learn reporting standards (IFRS/GAAP).', 'Improve Excel skills.', 'Maintain organized data records.'],
          weekly: [
            'Financial reporting practice (8-10 hrs/week)',
            'Learning standards (4-6 hrs/week)',
            'Data analysis (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Clear and accurate reporting builds trust in financial roles.',
          events: ['Finance Conferences', 'Accounting Workshops', 'Reporting Seminars', 'LinkedIn finance groups', 'Commerce clubs'],
          books: ['Financial Statements by Thomas Ittelson', 'Accounting Made Simple', 'Corporate Finance by Ross', 'Financial Intelligence', 'Principles by Ray Dalio'],
        },
        tools: ['Excel', 'Power BI', 'SAP', 'Tally', 'Google Sheets'],
        guidance_tip: 'Your precision ensures reliable reporting. Focus on accuracy and clarity in every detail.',
      },
      {
        career_role_name: 'Taxation Specialist',
        short_description: 'Manage tax planning, filings, and compliance with disciplined legal accuracy.',
        overview: 'Taxation Specialists handle tax planning, compliance, and advisory for individuals and businesses.',
        natural_strengths: 'Your discipline and attention to detail help you manage complex tax regulations and ensure compliance.',
        roadmap: {
          foundation: 'Learn direct and indirect taxation, accounting, and laws.',
          action_steps: 'Assist in tax filing, internships in CA firms, and compliance work.',
          advancement: 'Specialize in taxation and move into advisory roles.',
          career_entry: 'Tax Assistant, Accounts Executive, Audit Assistant.',
        },
        detailed: {
          mindset: ['Focus on compliance and accuracy.', 'Stay disciplined in calculations.', 'Be detail-oriented in documentation.', 'Maintain ethical standards.'],
          habits: ['Practice tax calculations regularly.', 'Study updated tax laws.', 'Work on real tax cases.', 'Maintain proper records.', 'Improve analytical skills.'],
          weekly: [
            'Tax practice and learning (8-10 hrs/week)',
            'Law updates and research (4-6 hrs/week)',
            'Case study work (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Staying updated with tax laws is critical for long-term success.',
          events: ['ICAI Tax Seminars', 'Finance Conferences', 'Tax Workshops', 'LinkedIn finance groups', 'Commerce associations'],
          books: ['Direct Taxes by Girish Ahuja', 'Income Tax Law and Practice', 'GST Guide', 'Accounting Made Simple', 'Financial Intelligence'],
        },
        tools: ['Tally', 'Excel', 'Tax Software', 'QuickBooks', 'SAP'],
        guidance_tip: 'Your discipline makes you reliable. Focus on mastering laws and maintaining accuracy.',
      },
      {
        career_role_name: 'Compliance Officer',
        short_description: 'Enforce legal and policy compliance through risk-aware process discipline.',
        overview: 'Compliance Officers ensure that organizations follow legal regulations, internal policies, and industry standards.',
        natural_strengths: 'Your structured thinking and attention to rules help you maintain compliance and reduce risks.',
        roadmap: {
          foundation: 'Learn compliance laws, regulations, and corporate governance.',
          action_steps: 'Assist in compliance audits, documentation, and reporting.',
          advancement: 'Move into compliance management and risk roles.',
          career_entry: 'Compliance Executive, Audit Associate, Risk Analyst.',
        },
        detailed: {
          mindset: ['Focus on rules and accuracy.', 'Maintain discipline in processes.', 'Be detail-oriented.', 'Ensure ethical practices.'],
          habits: ['Study compliance laws regularly.', 'Maintain proper documentation.', 'Track regulatory updates.', 'Conduct internal audits.', 'Improve analytical skills.'],
          weekly: [
            'Compliance study and practice (8-10 hrs/week)',
            'Documentation and analysis (4-6 hrs/week)',
            'Skill development (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Strong documentation and discipline are key in compliance roles.',
          events: ['Compliance Conferences', 'Audit Workshops', 'Finance Seminars', 'LinkedIn groups', 'Commerce clubs'],
          books: ['Corporate Governance', 'Auditing by Arens', 'Compliance Management Guide', 'Financial Intelligence', 'Principles'],
        },
        tools: ['Excel', 'SAP', 'Compliance Software', 'Tally', 'Google Sheets'],
        guidance_tip: 'Your attention to rules ensures organizational stability. Focus on accuracy and ethical standards.',
      },
      {
        career_role_name: 'Cost Accountant',
        short_description: 'Optimize cost structures and budgeting decisions for better profitability.',
        overview: 'Cost Accountants analyze production costs, budgeting, and cost control to improve business profitability.',
        natural_strengths: 'Your analytical and detail-oriented nature helps you track and optimize costs effectively.',
        roadmap: {
          foundation: 'Learn cost accounting, budgeting, and financial analysis.',
          action_steps: 'Work on cost analysis projects, internships, and financial planning.',
          advancement: 'Pursue CMA and move into senior roles.',
          career_entry: 'Cost Analyst, Accounts Executive, Finance Associate.',
        },
        detailed: {
          mindset: ['Focus on cost efficiency.', 'Be analytical in decision-making.', 'Maintain discipline in calculations.', 'Aim for long-term financial stability.'],
          habits: ['Practice cost calculations regularly.', 'Analyze financial data.', 'Learn budgeting techniques.', 'Improve Excel skills.', 'Stay updated on industry costs.'],
          weekly: [
            'Cost analysis practice (8-10 hrs/week)',
            'Learning financial concepts (4-6 hrs/week)',
            'Skill development (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Understanding cost structures gives you strong control over business decisions.',
          events: ['CMA Events', 'Finance Conferences', 'Accounting Workshops', 'LinkedIn groups', 'Commerce clubs'],
          books: ['Cost Accounting by Horngren', 'Financial Intelligence', 'Accounting Made Simple', 'Principles', 'The Intelligent Investor'],
        },
        tools: ['Excel', 'Tally', 'SAP', 'Power BI', 'QuickBooks'],
        guidance_tip: 'Your analytical discipline helps control costs. Focus on precision and structured analysis.',
      },
      {
        career_role_name: 'Audit and Assurance Specialist',
        short_description: 'Validate financial records and controls for transparency and compliance confidence.',
        overview: 'Audit Specialists verify financial records, ensure compliance, and assess business processes for accuracy and transparency.',
        natural_strengths: 'Your detail-oriented mindset and structured approach help you identify discrepancies and ensure reliability.',
        roadmap: {
          foundation: 'Learn auditing standards, accounting, and compliance systems.',
          action_steps: 'Work in audit firms, assist audits, and handle documentation.',
          advancement: 'Move into senior audit and advisory roles.',
          career_entry: 'Audit Assistant, Accounts Executive, Compliance Associate.',
        },
        detailed: {
          mindset: ['Focus on accuracy and verification.', 'Be detail-oriented and patient.', 'Maintain integrity in findings.', 'Follow structured audit processes.'],
          habits: ['Practice auditing regularly.', 'Review financial statements critically.', 'Maintain documentation.', 'Learn audit standards.', 'Improve analytical thinking.'],
          weekly: [
            'Audit practice and learning (8-10 hrs/week)',
            'Compliance and standards (4-6 hrs/week)',
            'Case analysis (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Always verify every detail. Accuracy defines your credibility.',
          events: ['ICAI Events', 'Audit Conferences', 'Finance Workshops', 'LinkedIn groups', 'Commerce clubs'],
          books: ['Auditing by Arens', 'Internal Auditing', 'Financial Statements', 'Accounting Made Simple', 'Principles'],
        },
        tools: ['Tally', 'Excel', 'Audit Software', 'SAP', 'QuickBooks'],
        guidance_tip: 'Your attention to detail builds trust. Focus on accuracy and consistency in every audit.',
      },
    ],
  },
  {
    traitCode: 'CD',
    roles: [
      {
        career_role_name: 'Financial Planning and Analysis (FP&A) Manager',
        short_description: 'Lead forecasting and strategic finance decisions using analytical leadership.',
        overview: 'FP&A Managers analyze financial data, prepare forecasts, and guide business leaders in strategic financial planning and decision-making.',
        natural_strengths: 'Your ability to combine analytical thinking with leadership helps you interpret data and confidently guide financial decisions.',
        roadmap: {
          foundation: 'Learn financial planning, budgeting, forecasting, and business analytics.',
          action_steps: 'Work on financial models, internships in finance teams, and analyze company reports.',
          advancement: 'Pursue certifications like CFA or MBA Finance and move into leadership roles.',
          career_entry: 'Financial Analyst, FP&A Analyst, Business Analyst.',
        },
        detailed: {
          mindset: ['Think strategically while relying on data.', 'Focus on long-term financial planning.', 'Lead decisions with logic and clarity.', 'Stay objective in financial evaluations.'],
          habits: ['Practice financial forecasting regularly.', 'Analyze company financial statements.', 'Build financial models.', 'Stay updated with market trends.', 'Improve presentation of insights.'],
          weekly: [
            'Financial modeling and analysis (8-10 hrs/week)',
            'Learning planning concepts (4-6 hrs/week)',
            'Strategy and reporting (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Strong financial insights combined with clear communication make you a valuable leader.',
          events: ['CFA Society Events', 'Finance Leadership Summits', 'Business Strategy Conferences', 'LinkedIn finance groups', 'Commerce associations'],
          books: ['Financial Intelligence', 'The Intelligent Investor', 'Good to Great', 'Principles by Ray Dalio', 'Measure What Matters'],
        },
        tools: ['Excel', 'Power BI', 'Tableau', 'SAP', 'Google Sheets'],
        guidance_tip: 'Your strength lies in combining data with leadership. Focus on making informed strategic decisions.',
      },
      {
        career_role_name: 'Management Consultant',
        short_description: 'Solve complex business challenges with structured analysis and leadership communication.',
        overview: 'Management Consultants help organizations solve complex business problems, improve performance, and implement strategic changes.',
        natural_strengths: 'Your analytical thinking and leadership skills allow you to evaluate situations and confidently recommend solutions.',
        roadmap: {
          foundation: 'Learn business strategy, consulting frameworks, and problem-solving methods.',
          action_steps: 'Practice case studies, internships, and participate in consulting projects.',
          advancement: 'Pursue MBA and move into senior consulting roles.',
          career_entry: 'Business Analyst, Consultant Trainee, Strategy Associate.',
        },
        detailed: {
          mindset: ['Focus on solving problems logically.', 'Think strategically across industries.', 'Lead discussions with confidence.', 'Deliver measurable results.'],
          habits: ['Solve business case studies regularly.', 'Analyze company performance.', 'Improve presentation skills.', 'Learn consulting frameworks.', 'Build professional networks.'],
          weekly: [
            'Case study practice (8-10 hrs/week)',
            'Learning frameworks (4-6 hrs/week)',
            'Networking and discussions (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Break complex problems into simple steps to create impactful solutions.',
          events: ['Consulting Workshops', 'Business Strategy Conferences', 'LinkedIn consulting groups', 'Campus consulting clubs', 'Startup meetups'],
          books: ['The McKinsey Way', 'Good Strategy Bad Strategy', 'Blue Ocean Strategy', 'The Pyramid Principle', 'Case Interview Secrets'],
        },
        tools: ['PowerPoint', 'Excel', 'Miro', 'Notion', 'Google Sheets'],
        guidance_tip: 'Your analytical leadership makes you a strong consultant. Focus on clarity and structured thinking.',
      },
      {
        career_role_name: 'Business Intelligence Manager',
        short_description: 'Lead BI strategy and analytics teams to convert data into business decisions.',
        overview: 'BI Managers lead teams that convert data into insights to support business decision-making and strategy.',
        natural_strengths: 'Your ability to analyze data and lead teams helps you drive data-driven decisions across organizations.',
        roadmap: {
          foundation: 'Learn data analytics, BI tools, and database concepts.',
          action_steps: 'Build dashboards, work on data projects, and internships.',
          advancement: 'Move into leadership roles managing analytics teams.',
          career_entry: 'BI Analyst, Data Analyst, MIS Analyst.',
        },
        detailed: {
          mindset: ['Focus on data-driven decision-making.', 'Lead teams with clarity and logic.', 'Stay curious about data insights.', 'Ensure accuracy in analysis.'],
          habits: ['Build dashboards regularly.', 'Analyze large datasets.', 'Learn advanced BI tools.', 'Improve SQL and analytics skills.', 'Stay updated with data trends.'],
          weekly: [
            'Data analysis and dashboards (8-10 hrs/week)',
            'Learning tools and systems (4-6 hrs/week)',
            'Strategy and leadership (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Data is valuable only when it leads to actionable insights.',
          events: ['Data Analytics Conferences', 'Power BI Communities', 'LinkedIn data groups', 'Tech meetups', 'College analytics clubs'],
          books: ['Storytelling with Data', 'Data Science for Business', 'Competing on Analytics', 'The Signal and the Noise', 'Naked Statistics'],
        },
        tools: ['Power BI', 'Tableau', 'SQL', 'Excel', 'Python'],
        guidance_tip: 'Your strength is leading with data. Focus on turning insights into decisions.',
      },
      {
        career_role_name: 'Corporate Strategy Manager',
        short_description: 'Define long-term strategic direction with market and financial intelligence.',
        overview: 'Corporate Strategy Managers define long-term business strategies, identify growth opportunities, and guide organizational direction.',
        natural_strengths: 'Your leadership and analytical thinking help you evaluate business scenarios and drive strategic decisions.',
        roadmap: {
          foundation: 'Learn business strategy, market analysis, and corporate finance.',
          action_steps: 'Work on strategy projects, case studies, and internships.',
          advancement: 'Move into senior leadership roles.',
          career_entry: 'Strategy Analyst, Business Analyst, Planning Executive.',
        },
        detailed: {
          mindset: ['Think long-term and strategically.', 'Focus on business impact.', 'Lead with data and insights.', 'Stay adaptable to market changes.'],
          habits: ['Analyze industry trends.', 'Study competitor strategies.', 'Work on strategic case studies.', 'Improve decision-making skills.', 'Build business knowledge.'],
          weekly: [
            'Strategy analysis (8-10 hrs/week)',
            'Market research (4-6 hrs/week)',
            'Learning and networking (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Strategic thinking comes from understanding both data and business context.',
          events: ['Business Strategy Conferences', 'Corporate Leadership Events', 'LinkedIn groups', 'Commerce associations', 'Startup meetups'],
          books: ['Good Strategy Bad Strategy', 'Blue Ocean Strategy', 'Playing to Win', 'Measure What Matters', 'Good to Great'],
        },
        tools: ['Excel', 'PowerPoint', 'Power BI', 'Tableau', 'Google Sheets'],
        guidance_tip: 'Your ability to lead with analysis makes you a strong strategist. Focus on long-term impact.',
      },
      {
        career_role_name: 'Investment Analyst',
        short_description: 'Evaluate assets and risks to guide long-term investment decisions.',
        overview: 'Investment Analysts evaluate stocks, bonds, and other assets to guide investment decisions for individuals or institutions.',
        natural_strengths: 'Your analytical mindset and decision-making ability help you assess risks and opportunities effectively.',
        roadmap: {
          foundation: 'Learn financial markets, valuation techniques, and portfolio management.',
          action_steps: 'Analyze stocks, build portfolios, and internships in finance firms.',
          advancement: 'Pursue CFA and specialize in investment roles.',
          career_entry: 'Equity Analyst, Research Analyst, Financial Analyst.',
        },
        detailed: {
          mindset: ['Focus on data-driven investment decisions.', 'Stay disciplined in analysis.', 'Evaluate risks carefully.', 'Think long-term in investments.'],
          habits: ['Track stock markets daily.', 'Analyze company financials.', 'Practice valuation models.', 'Read investment reports.', 'Build mock portfolios.'],
          weekly: [
            'Market analysis (8-10 hrs/week)',
            'Learning finance concepts (4-6 hrs/week)',
            'Portfolio building (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Successful investing requires patience and disciplined analysis.',
          events: ['CFA Events', 'Investment Workshops', 'Stock Market Communities', 'LinkedIn finance groups', 'Commerce clubs'],
          books: ['The Intelligent Investor', 'Security Analysis', 'Common Stocks and Uncommon Profits', 'One Up on Wall Street', 'Principles'],
        },
        tools: ['Excel', 'Bloomberg Terminal', 'Power BI', 'Capital IQ', 'Google Sheets'],
        guidance_tip: 'Your analytical strength helps you make smart investment decisions. Focus on discipline and long-term thinking.',
      },
      {
        career_role_name: 'Risk and Compliance Manager',
        short_description: 'Lead risk prevention and regulatory compliance with structured governance practices.',
        overview: 'Risk and Compliance Managers identify risks, ensure regulatory compliance, and help organizations avoid financial and operational issues.',
        natural_strengths: 'Your structured thinking and leadership ability help you assess risks and enforce compliance effectively.',
        roadmap: {
          foundation: 'Learn risk management, compliance laws, and financial regulations.',
          action_steps: 'Work on compliance audits, risk analysis, and internships.',
          advancement: 'Pursue certifications like FRM and move into leadership roles.',
          career_entry: 'Risk Analyst, Compliance Executive, Audit Associate.',
        },
        detailed: {
          mindset: ['Focus on risk prevention.', 'Stay disciplined and structured.', 'Analyze situations logically.', 'Maintain ethical standards.'],
          habits: ['Study compliance regulations.', 'Analyze risk scenarios.', 'Maintain documentation.', 'Track industry changes.', 'Improve analytical skills.'],
          weekly: [
            'Risk analysis practice (8-10 hrs/week)',
            'Compliance learning (4-6 hrs/week)',
            'Case studies and development (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Anticipating risks early helps prevent major business issues.',
          events: ['Risk Management Conferences', 'Compliance Workshops', 'Finance Seminars', 'LinkedIn groups', 'Commerce associations'],
          books: ['The Black Swan', 'Risk Management by Crouhy', 'Thinking Fast and Slow', 'Principles', 'Financial Intelligence'],
        },
        tools: ['Excel', 'Power BI', 'SAP', 'Risk Software', 'Google Sheets'],
        guidance_tip: 'Your analytical leadership ensures stability. Focus on identifying risks and maintaining compliance.',
      },
    ],
  },
  {
    traitCode: 'CI',
    roles: [
      {
        career_role_name: 'Business Analyst',
        short_description: 'Analyze processes and design practical, logic-driven business improvements.',
        overview: 'Business Analysts evaluate business processes, identify problems, and design logical solutions to improve efficiency and performance.',
        natural_strengths: 'Your combination of logical thinking and curiosity helps you analyze systems deeply and propose innovative improvements.',
        roadmap: {
          foundation: 'Learn business analysis, process mapping, data analysis, and documentation.',
          action_steps: 'Work on case studies, internships, and real-world business problem-solving.',
          advancement: 'Gain certifications like CBAP and move into senior analyst roles.',
          career_entry: 'Business Analyst, Process Analyst, Junior Consultant.',
        },
        detailed: {
          mindset: ['Think logically while staying open to new ideas.', 'Focus on solving problems with structured approaches.', 'Question existing processes and improve them.', 'Balance innovation with practical implementation.'],
          habits: ['Practice analyzing business case studies.', 'Create process flow diagrams regularly.', 'Improve documentation skills.', 'Learn data analysis tools.', 'Engage in problem-solving discussions.'],
          weekly: [
            'Business analysis practice (8-10 hrs/week)',
            'Learning tools and frameworks (4-6 hrs/week)',
            'Projects and networking (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Focus on simplifying complex business problems into clear solutions.',
          events: ['Business Analyst Meetups', 'NASSCOM Events', 'Consulting Workshops', 'LinkedIn analyst groups', 'College commerce clubs'],
          books: ['Business Analysis for Dummies', 'The Pyramid Principle', 'The McKinsey Way', 'Good Strategy Bad Strategy', 'Thinking Fast and Slow'],
        },
        tools: ['Excel', 'Power BI', 'MS Visio', 'Jira', 'Google Sheets'],
        guidance_tip: 'Your logical thinking is your strength. Focus on solving real business problems with clarity and innovation.',
      },
      {
        career_role_name: 'Financial Systems Analyst',
        short_description: 'Bridge finance and technology by optimizing system workflows and integrations.',
        overview: 'Financial Systems Analysts manage and improve financial software systems, ensuring smooth integration between finance and technology.',
        natural_strengths: 'Your analytical mindset and curiosity about systems help you optimize financial technologies and processes.',
        roadmap: {
          foundation: 'Learn financial systems, ERP tools, accounting, and data management.',
          action_steps: 'Work with financial software, internships, and system improvement projects.',
          advancement: 'Move into system consulting or ERP specialist roles.',
          career_entry: 'Systems Analyst, ERP Executive, Finance Analyst.',
        },
        detailed: {
          mindset: ['Think logically about systems and workflows.', 'Focus on efficiency and integration.', 'Stay curious about technology improvements.', 'Ensure accuracy in financial systems.'],
          habits: ['Learn ERP and accounting systems.', 'Practice system analysis regularly.', 'Improve technical and financial knowledge.', 'Work on integration projects.', 'Stay updated with fintech trends.'],
          weekly: [
            'System learning and practice (8-10 hrs/week)',
            'Technical and financial concepts (4-6 hrs/week)',
            'Projects and exploration (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Understanding both finance and systems gives you a strong career advantage.',
          events: ['Fintech Conferences', 'ERP Workshops', 'Technology Meetups', 'LinkedIn tech groups', 'Commerce clubs'],
          books: ['Financial Intelligence', 'ERP Demystified', 'Data Science for Business', 'The Phoenix Project', 'Competing on Analytics'],
        },
        tools: ['SAP', 'Oracle ERP', 'Excel', 'Power BI', 'SQL'],
        guidance_tip: 'Your ability to connect finance and technology makes you unique. Focus on systems thinking.',
      },
      {
        career_role_name: 'Product Analyst - Fintech',
        short_description: 'Use product and user analytics to improve fintech product performance.',
        overview: 'Product Analysts in fintech companies analyze product performance, user behavior, and data to improve financial products.',
        natural_strengths: 'Your logical thinking and curiosity help you understand user behavior and improve product performance.',
        roadmap: {
          foundation: 'Learn product analytics, financial products, and data analysis.',
          action_steps: 'Work on fintech products, internships, and analytics projects.',
          advancement: 'Move into product management or senior analytics roles.',
          career_entry: 'Product Analyst, Data Analyst, Business Analyst.',
        },
        detailed: {
          mindset: ['Focus on user behavior and data insights.', 'Think logically about product improvements.', 'Stay curious about product performance.', 'Balance data with user experience.'],
          habits: ['Analyze product data regularly.', 'Track user engagement metrics.', 'Work on product improvement ideas.', 'Learn analytics tools.', 'Stay updated with fintech trends.'],
          weekly: [
            'Product analysis (8-10 hrs/week)',
            'Learning analytics tools (4-6 hrs/week)',
            'Projects and research (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Data-driven decisions improve product success. Track and analyze everything.',
          events: ['Fintech Meetups', 'Product Management Events', 'Analytics Communities', 'LinkedIn groups', 'College clubs'],
          books: ['Inspired by Marty Cagan', 'Lean Analytics', 'Hooked', 'Data Science for Business', 'Measure What Matters'],
        },
        tools: ['Google Analytics', 'Mixpanel', 'Power BI', 'Excel', 'SQL'],
        guidance_tip: 'Your analytical curiosity helps improve products. Focus on understanding user data deeply.',
      },
      {
        career_role_name: 'Operations Strategy Analyst',
        short_description: 'Improve operational systems through data analysis and practical optimization.',
        overview: 'Operations Strategy Analysts evaluate business processes and design strategies to improve efficiency and performance.',
        natural_strengths: 'Your ability to think logically and innovate helps you optimize operations and create better systems.',
        roadmap: {
          foundation: 'Learn operations management, strategy, and process improvement.',
          action_steps: 'Work on operational projects, internships, and case studies.',
          advancement: 'Move into strategy or operations leadership roles.',
          career_entry: 'Operations Analyst, Process Analyst, Strategy Associate.',
        },
        detailed: {
          mindset: ['Focus on improving systems logically.', 'Think about efficiency and scalability.', 'Stay curious about better processes.', 'Balance innovation with practicality.'],
          habits: ['Analyze workflows regularly.', 'Identify inefficiencies.', 'Work on process improvements.', 'Learn operational tools.', 'Study industry practices.'],
          weekly: [
            'Process analysis (8-10 hrs/week)',
            'Learning operations concepts (4-6 hrs/week)',
            'Projects and networking (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Small process improvements can lead to big efficiency gains.',
          events: ['Operations Conferences', 'Supply Chain Meetups', 'LinkedIn groups', 'Commerce clubs', 'Business workshops'],
          books: ['The Goal', 'Operations Management', 'Lean Thinking', 'Good to Great', 'Atomic Habits'],
        },
        tools: ['Excel', 'Power BI', 'ERP Systems', 'SAP', 'Google Sheets'],
        guidance_tip: 'Your logical approach helps optimize systems. Focus on improving processes continuously.',
      },
      {
        career_role_name: 'Market Research Analyst',
        short_description: 'Study market behavior and customer patterns to support better strategy decisions.',
        overview: 'Market Research Analysts study market trends, customer preferences, and competitors to help businesses make informed decisions.',
        natural_strengths: 'Your analytical thinking and curiosity help you uncover insights and understand market behavior.',
        roadmap: {
          foundation: 'Learn market research methods, data analysis, and consumer behavior.',
          action_steps: 'Conduct surveys, analyze data, and work on research projects.',
          advancement: 'Move into senior research or strategy roles.',
          career_entry: 'Research Analyst, Data Analyst, Marketing Analyst.',
        },
        detailed: {
          mindset: ['Stay curious about market trends.', 'Focus on data-driven insights.', 'Think logically about customer behavior.', 'Be objective in analysis.'],
          habits: ['Conduct surveys and research regularly.', 'Analyze consumer data.', 'Study market reports.', 'Improve analytical skills.', 'Stay updated with trends.'],
          weekly: [
            'Research and analysis (8-10 hrs/week)',
            'Learning concepts (4-6 hrs/week)',
            'Projects and reporting (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Strong research leads to better business decisions. Focus on accuracy.',
          events: ['Market Research Conferences', 'Marketing Meetups', 'LinkedIn groups', 'Research communities', 'College clubs'],
          books: ['Marketing Research by Malhotra', 'Data Science for Business', 'Thinking Fast and Slow', 'Competing on Analytics', 'The Signal and the Noise'],
        },
        tools: ['Excel', 'SPSS', 'Power BI', 'Google Analytics', 'Tableau'],
        guidance_tip: 'Your curiosity helps uncover insights. Focus on turning data into meaningful conclusions.',
      },
      {
        career_role_name: 'Financial Innovation Consultant',
        short_description: 'Design practical fintech and business-model innovations in finance.',
        overview: 'Financial Innovation Consultants design new financial solutions, products, and business models using innovative approaches.',
        natural_strengths: 'Your ability to combine logic with creativity helps you develop new ideas in finance and business.',
        roadmap: {
          foundation: 'Learn financial markets, innovation frameworks, and fintech concepts.',
          action_steps: 'Work on innovative projects, fintech startups, and research ideas.',
          advancement: 'Move into consulting or fintech leadership roles.',
          career_entry: 'Financial Analyst, Innovation Analyst, Consultant.',
        },
        detailed: {
          mindset: ['Think beyond traditional financial solutions.', 'Focus on innovation and improvement.', 'Stay curious about new ideas.', 'Balance creativity with logic.'],
          habits: ['Study fintech innovations.', 'Work on new business ideas.', 'Analyze financial trends.', 'Build innovative solutions.', 'Network with professionals.'],
          weekly: [
            'Innovation projects (8-10 hrs/week)',
            'Learning fintech concepts (4-6 hrs/week)',
            'Networking and research (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Innovation comes from combining ideas. Explore across domains.',
          events: ['Fintech Conferences', 'Startup Meetups', 'Innovation Workshops', 'LinkedIn groups', 'Commerce clubs'],
          books: ['Zero to One', 'The Lean Startup', 'Blue Ocean Strategy', 'Creative Confidence', 'Financial Intelligence'],
        },
        tools: ['Excel', 'Power BI', 'Notion', 'Miro', 'Google Workspace'],
        guidance_tip: 'Your logical creativity can drive innovation. Focus on building practical and scalable solutions.',
      },
    ],
  },
  {
    traitCode: 'CS',
    roles: [
      {
        career_role_name: 'Accounts and Compliance Officer',
        short_description: 'Ensure accurate records and legal compliance through disciplined finance execution.',
        overview: 'Accounts and Compliance Officers ensure that financial records are accurate and that businesses follow regulatory and legal requirements.',
        natural_strengths: 'Your structured approach, patience, and reliability help you maintain accurate records and ensure compliance without errors.',
        roadmap: {
          foundation: 'Learn accounting, taxation, compliance laws, and financial regulations.',
          action_steps: 'Work in accounting roles, assist audits, and handle compliance documentation.',
          advancement: 'Pursue CA/CMA or specialize in compliance management.',
          career_entry: 'Accounts Executive, Compliance Assistant, Audit Associate.',
        },
        detailed: {
          mindset: ['Focus on accuracy and structured processes.', 'Follow rules and compliance strictly.', 'Be patient and detail-oriented.', 'Maintain consistency in financial work.'],
          habits: ['Maintain organized financial records.', 'Practice accounting regularly.', 'Stay updated with compliance laws.', 'Double-check work for accuracy.', 'Improve documentation skills.'],
          weekly: [
            'Accounting and compliance practice (8-10 hrs/week)',
            'Learning regulations and updates (4-6 hrs/week)',
            'Documentation and improvement (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Consistency and accuracy will build your reputation in finance roles.',
          events: ['ICAI Events', 'Compliance Workshops', 'Accounting Seminars', 'LinkedIn finance groups', 'Commerce associations'],
          books: ['Accounting Made Simple', 'Auditing by Arens', 'Financial Statements', 'Taxation Laws', 'Principles'],
        },
        tools: ['Tally', 'Excel', 'QuickBooks', 'SAP', 'Google Sheets'],
        guidance_tip: 'Your structured mindset ensures reliability. Focus on accuracy and consistency in every task.',
      },
      {
        career_role_name: 'Payroll and HR Operations Specialist',
        short_description: 'Handle payroll and HR operations with confidentiality, accuracy, and timeliness.',
        overview: 'Payroll and HR Specialists manage employee salaries, benefits, and HR processes while ensuring compliance with labor laws.',
        natural_strengths: 'Your attention to detail and supportive nature help you handle sensitive employee data accurately and responsibly.',
        roadmap: {
          foundation: 'Learn payroll systems, HR operations, and labor laws.',
          action_steps: 'Work in HR departments, process payroll, and manage employee data.',
          advancement: 'Move into HR operations or payroll leadership roles.',
          career_entry: 'Payroll Executive, HR Operations Executive, HR Assistant.',
        },
        detailed: {
          mindset: ['Focus on accuracy and confidentiality.', 'Be structured in handling data.', 'Support employee needs responsibly.', 'Follow compliance rules strictly.'],
          habits: ['Learn payroll software tools.', 'Maintain accurate employee records.', 'Stay updated with labor laws.', 'Improve communication skills.', 'Ensure timely processing.'],
          weekly: [
            'Payroll processing practice (8-10 hrs/week)',
            'Learning HR systems (4-6 hrs/week)',
            'Communication and coordination (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Accuracy and timeliness are critical in payroll management.',
          events: ['HR Conferences', 'Payroll Workshops', 'NHRD Events', 'LinkedIn HR groups', 'Commerce clubs'],
          books: ['HR from the Outside In', 'Work Rules', 'Drive', 'First Break All the Rules', 'The Culture Code'],
        },
        tools: ['Zoho People', 'SAP HR', 'Excel', 'HRMS Software', 'Google Sheets'],
        guidance_tip: 'Your structured support ensures smooth HR operations. Focus on accuracy and reliability.',
      },
      {
        career_role_name: 'Audit Documentation Specialist',
        short_description: 'Maintain audit-ready records and process documentation with precision.',
        overview: 'Audit Documentation Specialists manage and maintain detailed audit records, ensuring all financial processes are properly documented.',
        natural_strengths: 'Your detail-oriented mindset and structured thinking help you maintain precise and organized audit documentation.',
        roadmap: {
          foundation: 'Learn auditing standards, accounting, and documentation practices.',
          action_steps: 'Assist auditors, maintain records, and learn audit procedures.',
          advancement: 'Move into audit or compliance leadership roles.',
          career_entry: 'Audit Assistant, Documentation Executive, Accounts Associate.',
        },
        detailed: {
          mindset: ['Focus on accuracy in documentation.', 'Be consistent and disciplined.', 'Follow structured audit processes.', 'Maintain attention to detail.'],
          habits: ['Maintain proper audit records.', 'Learn audit procedures.', 'Review documents carefully.', 'Stay updated with standards.', 'Improve organizational skills.'],
          weekly: [
            'Audit documentation work (8-10 hrs/week)',
            'Learning audit standards (4-6 hrs/week)',
            'Practice and review (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Well-organized documentation makes audits smooth and efficient.',
          events: ['ICAI Events', 'Audit Workshops', 'Finance Conferences', 'LinkedIn groups', 'Commerce associations'],
          books: ['Auditing by Arens', 'Internal Auditing', 'Accounting Made Simple', 'Financial Statements', 'Principles'],
        },
        tools: ['Excel', 'Audit Software', 'Tally', 'SAP', 'Google Sheets'],
        guidance_tip: 'Your structured thinking ensures clarity. Focus on maintaining organized and accurate records.',
      },
      {
        career_role_name: 'Banking Back-Office Executive',
        short_description: 'Execute internal banking transactions and documentation with process discipline.',
        overview: 'Banking Back-Office Executives handle internal operations such as transactions, documentation, and compliance in banking institutions.',
        natural_strengths: 'Your reliability and structured work style help you manage banking processes with precision and consistency.',
        roadmap: {
          foundation: 'Learn banking operations, financial transactions, and compliance rules.',
          action_steps: 'Intern in banks, handle documentation, and learn core banking systems.',
          advancement: 'Move into operations or branch management roles.',
          career_entry: 'Banking Executive, Operations Associate, Clerk.',
        },
        detailed: {
          mindset: ['Focus on accuracy in operations.', 'Follow processes strictly.', 'Maintain discipline in work.', 'Ensure compliance with rules.'],
          habits: ['Practice banking operations regularly.', 'Learn compliance procedures.', 'Maintain proper records.', 'Improve efficiency in tasks.', 'Stay updated with banking systems.'],
          weekly: [
            'Banking operations practice (8-10 hrs/week)',
            'Learning compliance systems (4-6 hrs/week)',
            'Skill development (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Consistency and discipline are key in banking operations.',
          events: ['Banking Conferences', 'Finance Workshops', 'RBI Programs', 'LinkedIn finance groups', 'Commerce clubs'],
          books: ['Banking Theory and Practice', 'Financial Intelligence', 'The Intelligent Investor', 'Principles', 'Rich Dad Poor Dad'],
        },
        tools: ['Core Banking Software', 'Excel', 'Tally', 'SAP', 'Google Sheets'],
        guidance_tip: 'Your reliability ensures smooth operations. Focus on accuracy and disciplined execution.',
      },
      {
        career_role_name: 'Inventory and Finance Coordinator',
        short_description: 'Align stock and financial records for accurate operational decision-making.',
        overview: 'Inventory and Finance Coordinators manage stock records, financial tracking, and ensure alignment between inventory and financial data.',
        natural_strengths: 'Your structured approach and attention to detail help maintain accurate inventory and financial records.',
        roadmap: {
          foundation: 'Learn inventory management, accounting, and supply chain basics.',
          action_steps: 'Work on inventory systems, tracking, and financial reconciliation.',
          advancement: 'Move into operations or supply chain management roles.',
          career_entry: 'Inventory Executive, Accounts Assistant, Operations Associate.',
        },
        detailed: {
          mindset: ['Focus on accuracy and consistency.', 'Be detail-oriented in tracking data.', 'Maintain discipline in processes.', 'Ensure smooth coordination.'],
          habits: ['Track inventory regularly.', 'Reconcile financial records.', 'Learn inventory systems.', 'Maintain proper documentation.', 'Improve coordination skills.'],
          weekly: [
            'Inventory tracking and finance (8-10 hrs/week)',
            'Learning systems and tools (4-6 hrs/week)',
            'Coordination and improvement (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Accurate tracking prevents major operational issues.',
          events: ['Supply Chain Conferences', 'Operations Workshops', 'Finance Meetups', 'LinkedIn groups', 'Commerce clubs'],
          books: ['Supply Chain Management', 'The Goal', 'Accounting Made Simple', 'Financial Intelligence', 'Good to Great'],
        },
        tools: ['ERP Systems', 'SAP', 'Excel', 'Inventory Software', 'Google Sheets'],
        guidance_tip: 'Your structured approach ensures smooth coordination. Focus on accuracy and consistency.',
      },
      {
        career_role_name: 'Documentation and Process Executive',
        short_description: 'Create SOPs and process documentation to improve execution consistency.',
        overview: 'Documentation and Process Executives ensure all business processes are properly documented, standardized, and followed efficiently.',
        natural_strengths: 'Your attention to detail and structured thinking help you maintain clear and organized business processes.',
        roadmap: {
          foundation: 'Learn process documentation, operations, and quality standards.',
          action_steps: 'Create SOPs, assist in process improvement, and document workflows.',
          advancement: 'Move into quality management or operations leadership roles.',
          career_entry: 'Process Executive, Documentation Specialist, Operations Assistant.',
        },
        detailed: {
          mindset: ['Focus on clarity and structure.', 'Maintain consistency in processes.', 'Be detail-oriented in documentation.', 'Aim for process efficiency.'],
          habits: ['Document processes regularly.', 'Review workflows for improvements.', 'Maintain organized records.', 'Learn quality standards.', 'Improve attention to detail.'],
          weekly: [
            'Documentation and process work (8-10 hrs/week)',
            'Learning standards (4-6 hrs/week)',
            'Improvement and review (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Clear documentation ensures smooth business operations.',
          events: ['Quality Management Workshops', 'Operations Conferences', 'LinkedIn groups', 'Commerce clubs', 'Business seminars'],
          books: ['The Goal', 'Operations Management', 'Atomic Habits', 'Good to Great', 'Essentialism'],
        },
        tools: ['MS Word', 'Excel', 'Notion', 'Trello', 'Google Workspace'],
        guidance_tip: 'Your structured support ensures efficiency. Focus on clarity, consistency, and organization.',
      },
    ],
  },
];

async function main() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const degreeCheck = await client.query(
      `SELECT dd.id, d.name, d.short_name
       FROM department_degrees dd
       JOIN departments d ON d.id = dd.department_id
       WHERE dd.id = $1`,
      [DEGREE_ID]
    );

    if (degreeCheck.rows.length === 0) {
      throw new Error(`department_degree_id ${DEGREE_ID} not found.`);
    }

    const traits = await client.query(
      `SELECT id, code
       FROM personality_traits
       WHERE code = ANY($1::text[])
         AND is_active = true
         AND is_deleted = false`,
      [TARGET_TRAITS]
    );

    if (traits.rows.length !== TARGET_TRAITS.length) {
      throw new Error('Required traits SD, SI, SC, CD, CI, CS are not fully available.');
    }

    const traitIdByCode = Object.fromEntries(traits.rows.map((r) => [r.code, Number(r.id)]));

    await client.query(
      `DELETE FROM career_role_guidance_sections
       WHERE career_role_id IN (
         SELECT cr.id
         FROM career_roles cr
         JOIN personality_traits pt ON pt.id = cr.trait_id
         WHERE cr.department_degree_id = $1
           AND pt.code = ANY($2::text[])
       )`,
      [DEGREE_ID, TARGET_TRAITS]
    );

    await client.query(
      `DELETE FROM career_role_tools
       WHERE career_role_id IN (
         SELECT cr.id
         FROM career_roles cr
         JOIN personality_traits pt ON pt.id = cr.trait_id
         WHERE cr.department_degree_id = $1
           AND pt.code = ANY($2::text[])
       )`,
      [DEGREE_ID, TARGET_TRAITS]
    );

    await client.query(
      `DELETE FROM career_roles
       WHERE department_degree_id = $1
         AND trait_id = ANY($2::bigint[])`,
      [DEGREE_ID, Object.values(traitIdByCode)]
    );

    let insertedRoles = 0;
    let insertedGuidance = 0;
    let insertedTools = 0;

    for (const block of DATA) {
      const traitId = traitIdByCode[block.traitCode];

      if (!traitId) throw new Error(`Trait missing: ${block.traitCode}`);
      if (block.roles.length !== 6) throw new Error(`Trait ${block.traitCode} must contain exactly 6 roles.`);

      for (const role of block.roles) {
        if (!Array.isArray(role.tools) || role.tools.length !== 5) {
          throw new Error(`${role.career_role_name} must have exactly 5 tools.`);
        }

        const sectionContent = buildSectionContent(role);

        const roleRes = await client.query(
          `INSERT INTO career_roles (
             department_degree_id,
             trait_id,
             career_role_name,
             short_description,
             metadata,
             is_active,
             is_deleted,
             created_at,
             updated_at
           ) VALUES ($1, $2, $3, $4, '{}'::jsonb, true, false, NOW(), NOW())
           RETURNING id`,
          [DEGREE_ID, traitId, role.career_role_name, role.short_description]
        );

        const roleId = Number(roleRes.rows[0].id);
        insertedRoles += 1;

        await client.query(
          `INSERT INTO career_role_guidance_sections (
             career_role_id,
             section_content,
             metadata,
             is_active,
             is_deleted,
             created_at,
             updated_at
           ) VALUES ($1, $2::jsonb, '{}'::jsonb, true, false, NOW(), NOW())`,
          [roleId, JSON.stringify(sectionContent)]
        );
        insertedGuidance += 1;

        for (const tool of role.tools) {
          await client.query(
            `INSERT INTO career_role_tools (
               career_role_id,
               tool_name,
               metadata,
               is_active,
               is_deleted,
               created_at,
               updated_at
             ) VALUES ($1, $2, '{}'::jsonb, true, false, NOW(), NOW())`,
            [roleId, tool]
          );
          insertedTools += 1;
        }
      }
    }

    const verifyByTrait = await client.query(
      `SELECT
         pt.code AS trait_code,
         COUNT(DISTINCT cr.id) AS roles,
         COUNT(DISTINCT g.id) AS guidance,
         COUNT(DISTINCT t.id) AS tools
       FROM career_roles cr
       JOIN personality_traits pt ON pt.id = cr.trait_id
       LEFT JOIN career_role_guidance_sections g
         ON g.career_role_id = cr.id
        AND g.is_active = true
        AND g.is_deleted = false
       LEFT JOIN career_role_tools t
         ON t.career_role_id = cr.id
        AND t.is_active = true
        AND t.is_deleted = false
       WHERE cr.department_degree_id = $1
         AND pt.code = ANY($2::text[])
         AND cr.is_active = true
         AND cr.is_deleted = false
       GROUP BY pt.code
       ORDER BY pt.code`,
      [DEGREE_ID, TARGET_TRAITS]
    );

    const structureCheck = await client.query(
      `WITH role_checks AS (
         SELECT
           cr.id AS role_id,
           COUNT(DISTINCT g.id) AS guidance_rows,
           COUNT(DISTINCT t.id) AS tool_rows,
           MAX(CASE WHEN g.section_content IS NOT NULL THEN jsonb_array_length(g.section_content) ELSE 0 END) AS top_sections,
           COUNT(*) FILTER (
             WHERE EXISTS (
               SELECT 1 FROM jsonb_array_elements(g.section_content) e
               WHERE e->>'title' = 'Detailed Guidelines' AND jsonb_typeof(e->'content') = 'array'
             )
           ) AS has_detailed
         FROM career_roles cr
         JOIN personality_traits pt ON pt.id = cr.trait_id
         LEFT JOIN career_role_guidance_sections g
           ON g.career_role_id = cr.id
          AND g.is_active = true
          AND g.is_deleted = false
         LEFT JOIN career_role_tools t
           ON t.career_role_id = cr.id
          AND t.is_active = true
          AND t.is_deleted = false
         WHERE cr.department_degree_id = $1
           AND pt.code = ANY($2::text[])
           AND cr.is_active = true
           AND cr.is_deleted = false
         GROUP BY cr.id
       )
       SELECT
         COUNT(*) AS total_roles,
         COUNT(*) FILTER (WHERE guidance_rows = 1) AS roles_with_1_guidance,
         COUNT(*) FILTER (WHERE tool_rows = 5) AS roles_with_5_tools,
         COUNT(*) FILTER (WHERE top_sections = 5) AS roles_with_5_top_sections,
         COUNT(*) FILTER (WHERE has_detailed > 0) AS roles_with_detailed_guidelines
       FROM role_checks`,
      [DEGREE_ID, TARGET_TRAITS]
    );

    await client.query('COMMIT');

    console.log('SUCCESS: Loaded Commerce (dept 21) SD/SI/SC/CD/CI/CS with structured guidance JSON.');
    console.log(`inserted_roles=${insertedRoles}, inserted_guidance=${insertedGuidance}, inserted_tools=${insertedTools}`);
    console.table(verifyByTrait.rows);
    console.log('STRUCTURE CHECK:', structureCheck.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('FAILED: Transaction rolled back.');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
