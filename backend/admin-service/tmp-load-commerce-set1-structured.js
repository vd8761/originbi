require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const DEGREE_ID = 21; // Commerce - B.Com
const TARGET_TRAITS = ['DI', 'DS', 'DC', 'ID', 'IS', 'IC'];

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
        {
          subtitle: 'What mindset helps you excel?',
          bullets: role.detailed.mindset,
        },
        {
          subtitle: 'What habits build your expertise?',
          bullets: role.detailed.habits,
        },
        {
          subtitle: 'Weekly effort for mastery:',
          bullets: role.detailed.weekly,
          tip: role.detailed.weekly_tip,
        },
        {
          subtitle: 'Must-attend events in India:',
          bullets: role.detailed.events,
        },
        {
          subtitle: 'Books to read:',
          bullets: role.detailed.books,
        },
        {
          subtitle: 'Essential tools to master:',
          bullets: role.tools,
        },
      ],
    },
    { title: 'Guidance Tip', content: role.guidance_tip },
  ];
}

const DATA = [
  {
    traitCode: 'DI',
    roles: [
      {
        career_role_name: 'Financial Strategy Manager',
        short_description: 'Analyze business performance and financial data to guide high-impact growth decisions.',
        overview:
          'Financial Strategy Managers analyze business performance, market trends, and financial data to guide companies in making high-impact decisions that drive growth and profitability.',
        natural_strengths:
          'Your leadership mindset, confidence, and decision-making ability help you take ownership of financial strategies and influence business outcomes effectively.',
        roadmap: {
          foundation: 'Learn financial management, corporate finance, business strategy, and market analysis.',
          action_steps:
            'Participate in finance clubs, case competitions, and internships in financial analysis or consulting.',
          advancement:
            'Pursue certifications like CFA Level 1 or Financial Modeling programs and build strategic case portfolios.',
          career_entry: 'Financial Analyst, Strategy Associate, Business Analyst.',
        },
        detailed: {
          mindset: [
            'Think like a business decision-maker, not just a student.',
            'Focus on outcomes and measurable financial impact.',
            'Take initiative and lead financial discussions confidently.',
            'Stay competitive and always look for growth opportunities.',
          ],
          habits: [
            'Analyze business news and financial reports daily.',
            'Practice financial modeling and forecasting regularly.',
            'Participate in business case competitions.',
            'Build a portfolio of strategy-based projects.',
            'Network with finance professionals and mentors.',
          ],
          weekly: [
            'Financial analysis and modeling (8-10 hrs/week)',
            'Case study practice and strategy learning (4-6 hrs/week)',
            'Networking and leadership activities (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip:
            'Focus on solving real-world business problems instead of only studying theory.',
          events: [
            'CFA Society India Events',
            'NASSCOM Business Summit',
            'Startup India Meetups',
            'College finance clubs',
            'LinkedIn finance communities',
          ],
          books: [
            'The Intelligent Investor by Benjamin Graham',
            'Good to Great by Jim Collins',
            'Financial Modeling by Simon Benninga',
            'Zero to One by Peter Thiel',
            'Measure What Matters by John Doerr',
          ],
        },
        tools: ['Microsoft Excel', 'Power BI', 'Tableau', 'QuickBooks', 'Google Sheets'],
        guidance_tip:
          'Your leadership combined with financial insight can drive major business impact. Focus on making decisions, not just analyzing numbers.',
      },
      {
        career_role_name: 'Investment Banking Analyst',
        short_description: 'Support capital raising, M&A, and large-scale financial decision-making.',
        overview:
          'Investment Banking Analysts support companies in raising capital, managing mergers and acquisitions, and making large-scale financial decisions.',
        natural_strengths:
          'Your ambition, confidence, and ability to handle pressure make you suitable for fast-paced, high-stakes financial environments.',
        roadmap: {
          foundation: 'Study corporate finance, valuation techniques, and financial markets.',
          action_steps:
            'Intern in investment firms, practice valuation models, and work on real-world financial cases.',
          advancement: 'Clear CFA exams or pursue MBA Finance and specialize in deal structuring.',
          career_entry:
            'Investment Banking Analyst, Equity Research Analyst, Financial Analyst.',
        },
        detailed: {
          mindset: [
            'Stay competitive and performance-driven.',
            'Handle pressure with confidence and clarity.',
            'Focus on results and deal success.',
            'Be proactive in learning complex financial concepts.',
          ],
          habits: [
            'Practice financial valuation models regularly.',
            'Track stock markets and economic trends daily.',
            'Read investment reports and case studies.',
            'Build strong Excel and financial modeling skills.',
            'Network with finance professionals and alumni.',
          ],
          weekly: [
            'Financial modeling and valuation (8-10 hrs/week)',
            'Market research and analysis (4-6 hrs/week)',
            'Networking and learning (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip:
            'Start building strong financial modeling skills early to stand out in competitive roles.',
          events: [
            'CFA Institute Events',
            'Investment Banking Workshops',
            'Finance Clubs',
            'Stock Market Communities',
            'LinkedIn finance groups',
          ],
          books: [
            'Investment Banking by Joshua Rosenbaum',
            'The Intelligent Investor by Benjamin Graham',
            'Valuation by McKinsey and Company',
            'Liar’s Poker by Michael Lewis',
            'Common Stocks and Uncommon Profits by Philip Fisher',
          ],
        },
        tools: ['Microsoft Excel', 'Bloomberg Terminal', 'Power BI', 'Capital IQ', 'Google Sheets'],
        guidance_tip:
          'Your energy and ambition are your biggest assets. Combine them with strong technical skills to excel in high-pressure finance roles.',
      },
      {
        career_role_name: 'Entrepreneur / Business Owner',
        short_description: 'Build and scale ventures by identifying opportunities and leading execution.',
        overview:
          'Entrepreneurs create and manage their own businesses, identifying market opportunities and building scalable solutions.',
        natural_strengths:
          'Your risk-taking ability, leadership, and persuasive skills help you lead teams and bring business ideas to life.',
        roadmap: {
          foundation: 'Learn business fundamentals, marketing, finance, and entrepreneurship.',
          action_steps: 'Start small ventures, participate in startup events, and build MVPs.',
          advancement: 'Scale your business, secure funding, and expand operations.',
          career_entry: 'Startup Founder, Business Owner, Growth Manager.',
        },
        detailed: {
          mindset: [
            'Embrace risk and uncertainty as growth opportunities.',
            'Stay focused on long-term vision.',
            'Learn from failures quickly.',
            'Be confident in decision-making.',
          ],
          habits: [
            'Generate and test business ideas regularly.',
            'Track business performance metrics.',
            'Network with entrepreneurs and mentors.',
            'Learn from startup case studies.',
            'Reflect on business outcomes consistently.',
          ],
          weekly: [
            'Business development and execution (10-12 hrs/week)',
            'Networking and pitching (3-5 hrs/week)',
            'Learning and market research (2-3 hrs/week)',
            'Total (about 15-20 hrs/week)',
          ],
          weekly_tip: 'Start small but act fast. Real learning comes from execution.',
          events: [
            'Startup India',
            'TiE Global',
            'College incubators',
            'Founder meetups',
            'Entrepreneurship clubs',
          ],
          books: [
            'The Lean Startup by Eric Ries',
            'Zero to One by Peter Thiel',
            'The Hard Thing About Hard Things by Ben Horowitz',
            'Founders at Work by Jessica Livingston',
            'Rich Dad Poor Dad by Robert Kiyosaki',
          ],
        },
        tools: ['Notion', 'Canva', 'Trello', 'Google Workspace', 'Shopify'],
        guidance_tip:
          'Your leadership and bold thinking make you a natural entrepreneur. Keep building, testing, and scaling your ideas.',
      },
      {
        career_role_name: 'Sales and Business Development Manager',
        short_description: 'Drive revenue through client relationships, opportunity creation, and deal closure.',
        overview:
          'Sales Managers drive revenue by building client relationships, identifying business opportunities, and closing deals.',
        natural_strengths:
          'Your communication skills, confidence, and persuasion ability help you influence clients and achieve targets.',
        roadmap: {
          foundation: 'Learn sales strategies, marketing fundamentals, and customer behavior.',
          action_steps:
            'Take part in sales internships, campus marketing roles, and client interaction projects.',
          advancement:
            'Move into leadership roles managing sales teams and large accounts.',
          career_entry: 'Sales Executive, Business Development Associate, Account Manager.',
        },
        detailed: {
          mindset: [
            'Stay goal-oriented and target-driven.',
            'Focus on building strong relationships.',
            'Be confident in communication and negotiation.',
            'Adapt quickly to different client needs.',
          ],
          habits: [
            'Practice pitching and communication daily.',
            'Learn negotiation techniques.',
            'Track sales performance metrics.',
            'Build a strong professional network.',
            'Study customer behavior patterns.',
          ],
          weekly: [
            'Sales practice and communication (8-10 hrs/week)',
            'Market and customer research (4-6 hrs/week)',
            'Networking and learning (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip:
            'Every conversation is a sales opportunity. Practice influencing people daily.',
          events: [
            'Sales conferences',
            'Marketing meetups',
            'Startup networking events',
            'LinkedIn sales communities',
            'College marketing clubs',
          ],
          books: [
            'Sell or Be Sold by Grant Cardone',
            'To Sell is Human by Daniel Pink',
            'SPIN Selling by Neil Rackham',
            'The Psychology of Selling by Brian Tracy',
            'Influence by Robert Cialdini',
          ],
        },
        tools: ['CRM Software (Salesforce)', 'HubSpot', 'LinkedIn Sales Navigator', 'Excel', 'Google Sheets'],
        guidance_tip:
          'Your ability to influence people is your biggest strength. Refine it to become a top-performing business leader.',
      },
      {
        career_role_name: 'Corporate Finance Manager',
        short_description: 'Lead budgeting, planning, and investment decisions within organizations.',
        overview:
          'Corporate Finance Managers handle budgeting, financial planning, and investment decisions within organizations.',
        natural_strengths:
          'Your decision-making ability and leadership mindset help you manage financial operations efficiently.',
        roadmap: {
          foundation: 'Study financial accounting, corporate finance, and investment analysis.',
          action_steps:
            'Work on budgeting projects, internships in finance departments, and analysis tasks.',
          advancement: 'Pursue CA, CMA, or MBA Finance and move into leadership roles.',
          career_entry: 'Finance Executive, Financial Analyst, Accounts Executive.',
        },
        detailed: {
          mindset: [
            'Focus on accuracy and accountability.',
            'Think long-term in financial decisions.',
            'Take ownership of financial outcomes.',
            'Stay disciplined in financial planning.',
          ],
          habits: [
            'Practice financial analysis regularly.',
            'Track company financial performance.',
            'Learn budgeting and forecasting techniques.',
            'Stay updated on economic trends.',
            'Build strong Excel skills.',
          ],
          weekly: [
            'Financial analysis practice (8-10 hrs/week)',
            'Learning finance concepts (4-6 hrs/week)',
            'Networking and development (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip:
            'Strong fundamentals in finance will give you long-term career stability.',
          events: [
            'ICAI Events',
            'Finance summits',
            'Corporate finance workshops',
            'LinkedIn finance groups',
            'College commerce associations',
          ],
          books: [
            'Corporate Finance by Ross Westerfield',
            'Financial Statements by Thomas Ittelson',
            'The Intelligent Investor by Benjamin Graham',
            'Rich Dad Poor Dad by Robert Kiyosaki',
            'Principles by Ray Dalio',
          ],
        },
        tools: ['Excel', 'SAP', 'Tally', 'Power BI', 'QuickBooks'],
        guidance_tip:
          'Your leadership combined with financial discipline can position you for top corporate roles. Focus on both accuracy and decision-making.',
      },
      {
        career_role_name: 'Business Consultant',
        short_description: 'Improve organizational performance through analysis and strategic recommendations.',
        overview:
          'Business Consultants help organizations improve performance by analyzing problems and providing strategic solutions.',
        natural_strengths:
          'Your leadership, communication, and analytical thinking help you guide businesses toward better performance.',
        roadmap: {
          foundation: 'Learn business strategy, operations management, and consulting frameworks.',
          action_steps: 'Work on case studies, internships, and consulting projects.',
          advancement:
            'Pursue MBA or consulting certifications and build client experience.',
          career_entry: 'Business Analyst, Consultant Trainee, Process Analyst.',
        },
        detailed: {
          mindset: [
            'Think from a problem-solving perspective.',
            'Focus on delivering measurable results.',
            'Be adaptable to different industries.',
            'Stay confident in presenting solutions.',
          ],
          habits: [
            'Practice solving business case studies.',
            'Analyze company performance reports.',
            'Improve presentation skills.',
            'Build strong networking habits.',
            'Reflect on project outcomes.',
          ],
          weekly: [
            'Case study practice (8-10 hrs/week)',
            'Research and analysis (4-6 hrs/week)',
            'Networking and learning (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip:
            'Learn to simplify complex business problems. That is your biggest consulting skill.',
          events: [
            'Consulting workshops',
            'Business conferences',
            'LinkedIn consulting groups',
            'Campus consulting clubs',
            'Startup meetups',
          ],
          books: [
            'The McKinsey Way by Ethan Rasiel',
            'Good Strategy Bad Strategy by Richard Rumelt',
            'The Pyramid Principle by Barbara Minto',
            'Case Interview Secrets by Victor Cheng',
            'Blue Ocean Strategy by W. Chan Kim',
          ],
        },
        tools: ['Power BI', 'Excel', 'Tableau', 'MS PowerPoint', 'Google Sheets'],
        guidance_tip:
          'Your confidence and leadership can make you a strong consultant. Focus on delivering clear, impactful solutions.',
      },
    ],
  },
  {
    traitCode: 'DS',
    roles: [
      {
        career_role_name: 'Relationship Manager - Banking and Finance',
        short_description: 'Build trust-based client portfolios and deliver consistent banking relationship outcomes.',
        overview:
          'Relationship Managers in banking and finance focus on maintaining long-term client relationships, managing portfolios, and ensuring consistent service delivery while driving business growth.',
        natural_strengths:
          'Your ability to build trust, maintain stability, and communicate calmly makes you excellent at managing client relationships and ensuring long-term satisfaction.',
        roadmap: {
          foundation:
            'Learn banking fundamentals, financial products, customer relationship management, and communication skills.',
          action_steps:
            'Intern in banks or NBFCs, participate in client interaction projects, and learn CRM tools.',
          advancement:
            'Gain certifications in banking or finance and move into senior relationship or portfolio management roles.',
          career_entry: 'Relationship Executive, Banking Associate, Client Service Officer.',
        },
        detailed: {
          mindset: [
            'Focus on building long-term trust over short-term gains.',
            'Stay calm and consistent in handling clients.',
            'Prioritize relationship stability and customer satisfaction.',
            'Be dependable and responsive to client needs.',
          ],
          habits: [
            'Maintain regular follow-ups with clients.',
            'Learn about financial products in detail.',
            'Practice communication and listening skills.',
            'Track customer preferences and behaviors.',
            'Build a strong professional network.',
          ],
          weekly: [
            'Customer relationship practice (8-10 hrs/week)',
            'Financial product learning (4-6 hrs/week)',
            'Networking and communication (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip:
            'Consistency in communication builds stronger client trust than occasional efforts.',
          events: [
            'Banking and Finance Conferences',
            'NBFC networking events',
            'LinkedIn finance groups',
            'College commerce clubs',
            'Customer service workshops',
          ],
          books: [
            'How to Win Friends and Influence People by Dale Carnegie',
            'The Trusted Advisor by David Maister',
            'Customer Success by Nick Mehta',
            'The Psychology of Money by Morgan Housel',
            'Give and Take by Adam Grant',
          ],
        },
        tools: ['CRM Software (Salesforce)', 'MS Excel', 'HubSpot', 'Google Sheets', 'Zoho CRM'],
        guidance_tip:
          'Your strength lies in trust and consistency. Focus on relationships, and success will naturally follow.',
      },
      {
        career_role_name: 'Financial Planner',
        short_description: 'Guide clients in planning investments, taxes, and long-term wealth security.',
        overview:
          'Financial Planners help individuals and families manage their finances, investments, insurance, and long-term wealth planning.',
        natural_strengths:
          'Your patience, reliability, and attention to people’s needs help you guide clients in making stable and secure financial decisions.',
        roadmap: {
          foundation:
            'Learn personal finance, investment planning, taxation, and insurance basics.',
          action_steps: 'Assist financial advisors, practice creating financial plans, and work with clients.',
          advancement: 'Obtain CFP certification and build a strong client base.',
          career_entry: 'Financial Advisor, Wealth Management Associate, Insurance Advisor.',
        },
        detailed: {
          mindset: [
            'Focus on long-term financial stability for clients.',
            'Be patient and thorough in financial planning.',
            'Build trust through honesty and transparency.',
            'Prioritize client needs over commissions.',
          ],
          habits: [
            'Study financial products and investment options regularly.',
            'Track market trends and economic updates.',
            'Practice creating financial plans.',
            'Build relationships with clients.',
            'Continuously update financial knowledge.',
          ],
          weekly: [
            'Financial planning practice (8-10 hrs/week)',
            'Market and product learning (4-6 hrs/week)',
            'Client interaction and networking (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip:
            'Focus on trust and consistency. Clients value advisors who genuinely care about their future.',
          events: [
            'CFP Board India Events',
            'Wealth Management Seminars',
            'Financial Planning Workshops',
            'Investment Communities',
            'LinkedIn finance groups',
          ],
          books: [
            'The Psychology of Money by Morgan Housel',
            'Rich Dad Poor Dad by Robert Kiyosaki',
            'The Millionaire Next Door by Thomas Stanley',
            'Your Money or Your Life by Vicki Robin',
            'The Intelligent Investor by Benjamin Graham',
          ],
        },
        tools: ['MS Excel', 'QuickBooks', 'Moneycontrol', 'Personal Finance Apps', 'Google Sheets'],
        guidance_tip:
          'Your calm and supportive nature makes you a trusted financial guide. Focus on helping clients build secure futures.',
      },
      {
        career_role_name: 'HR and Payroll Specialist',
        short_description: 'Manage HR records, payroll processing, compliance, and people operations stability.',
        overview:
          'HR and Payroll Specialists manage employee records, salary processing, compliance, and workplace policies, ensuring smooth organizational operations.',
        natural_strengths:
          'Your structured approach, patience, and people-centric mindset help maintain stability and accuracy in HR processes.',
        roadmap: {
          foundation: 'Learn HR basics, payroll systems, labor laws, and compliance.',
          action_steps: 'Intern in HR departments, handle employee data, and assist in payroll processing.',
          advancement:
            'Specialize in HR analytics or payroll management and move into HR leadership roles.',
          career_entry: 'HR Executive, Payroll Assistant, HR Coordinator.',
        },
        detailed: {
          mindset: [
            'Focus on consistency and accuracy.',
            'Be empathetic towards employee needs.',
            'Maintain confidentiality and professionalism.',
            'Ensure fairness in HR practices.',
          ],
          habits: [
            'Maintain organized employee records.',
            'Learn payroll software systems.',
            'Stay updated on labor laws.',
            'Communicate clearly with employees.',
            'Develop problem-solving skills.',
          ],
          weekly: [
            'HR and payroll learning (8-10 hrs/week)',
            'System and compliance practice (4-6 hrs/week)',
            'Communication and development (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Accuracy and consistency are more important than speed in HR roles.',
          events: [
            'NHRD Network Events',
            'HR Conferences',
            'Payroll Workshops',
            'LinkedIn HR communities',
            'College HR clubs',
          ],
          books: [
            'HR from the Outside In by Dave Ulrich',
            'The HR Scorecard by Becker',
            'Work Rules by Laszlo Bock',
            'Drive by Daniel Pink',
            'First Break All the Rules by Marcus Buckingham',
          ],
        },
        tools: ['Tally', 'HRMS Software', 'MS Excel', 'Zoho People', 'SAP HR'],
        guidance_tip:
          'Your reliability and structured thinking make you an excellent HR professional. Focus on consistency and people care.',
      },
      {
        career_role_name: 'Operations Executive',
        short_description: 'Optimize workflows and day-to-day operations for process consistency and efficiency.',
        overview:
          'Operations Executives ensure smooth day-to-day business processes, optimize workflows, and maintain efficiency across departments.',
        natural_strengths:
          'Your ability to stay organized, follow systems, and maintain stability helps you manage operations effectively.',
        roadmap: {
          foundation: 'Learn operations management, supply chain basics, and process optimization.',
          action_steps: 'Work on process improvement projects, internships, and operational roles.',
          advancement: 'Move into operations management and leadership roles.',
          career_entry: 'Operations Executive, Process Associate, Operations Analyst.',
        },
        detailed: {
          mindset: [
            'Focus on efficiency and consistency.',
            'Be detail-oriented in process management.',
            'Stay calm under operational pressure.',
            'Aim for continuous improvement.',
          ],
          habits: [
            'Track workflow processes regularly.',
            'Identify and fix inefficiencies.',
            'Maintain documentation of operations.',
            'Learn operational tools and systems.',
            'Collaborate with different teams.',
          ],
          weekly: [
            'Process learning and execution (8-10 hrs/week)',
            'Analysis and improvement (4-6 hrs/week)',
            'Communication and coordination (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Small improvements in processes can create big impact over time.',
          events: [
            'Operations Management Conferences',
            'Supply Chain Events',
            'Process Improvement Workshops',
            'LinkedIn operations groups',
            'College commerce clubs',
          ],
          books: [
            'The Goal by Eliyahu Goldratt',
            'Operations Management by Heizer',
            'Lean Thinking by James Womack',
            'Good to Great by Jim Collins',
            'Atomic Habits by James Clear',
          ],
        },
        tools: ['Excel', 'ERP Software', 'SAP', 'Power BI', 'Google Sheets'],
        guidance_tip:
          'Your structured approach can create highly efficient systems. Focus on improving processes consistently.',
      },
      {
        career_role_name: 'Account Manager - Corporate Clients',
        short_description: 'Grow and retain corporate relationships through dependable account stewardship.',
        overview:
          'Account Managers maintain and grow relationships with corporate clients, ensuring satisfaction and business continuity.',
        natural_strengths:
          'Your stability, communication, and relationship-building skills make you ideal for managing long-term business accounts.',
        roadmap: {
          foundation: 'Learn client management, business communication, and sales fundamentals.',
          action_steps: 'Handle client accounts, internships in sales/account roles, and CRM systems.',
          advancement: 'Move into senior account management and key client roles.',
          career_entry: 'Account Executive, Client Relationship Executive, Sales Associate.',
        },
        detailed: {
          mindset: [
            'Focus on long-term client value.',
            'Build trust through consistency.',
            'Stay responsive and dependable.',
            'Understand client business deeply.',
          ],
          habits: [
            'Maintain regular client communication.',
            'Track client performance and needs.',
            'Improve negotiation skills.',
            'Document client interactions.',
            'Build strong professional relationships.',
          ],
          weekly: [
            'Client management and communication (8-10 hrs/week)',
            'Business understanding and research (4-6 hrs/week)',
            'Networking and development (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Strong relationships create long-term business success.',
          events: [
            'Sales and client management events',
            'Business networking groups',
            'LinkedIn communities',
            'Corporate meetups',
            'College clubs',
          ],
          books: [
            'How to Win Friends and Influence People',
            'The Trusted Advisor',
            'Never Split the Difference',
            'Give and Take',
            'The Challenger Sale',
          ],
        },
        tools: ['CRM Software', 'Excel', 'HubSpot', 'LinkedIn', 'Google Sheets'],
        guidance_tip:
          'Your strength is consistency. Focus on maintaining trust and delivering value to clients.',
      },
      {
        career_role_name: 'Compliance and Audit Associate',
        short_description: 'Ensure regulatory compliance, process discipline, and audit-ready financial documentation.',
        overview:
          'Compliance and Audit Associates ensure that organizations follow regulations, maintain proper documentation, and reduce financial risks.',
        natural_strengths:
          'Your attention to detail, patience, and structured thinking help you ensure accuracy and compliance.',
        roadmap: {
          foundation: 'Learn auditing, accounting standards, and regulatory compliance.',
          action_steps: 'Assist in audits, internships in CA firms, and compliance checks.',
          advancement: 'Pursue CA/CMA and move into audit leadership roles.',
          career_entry: 'Audit Assistant, Compliance Executive, Accounts Associate.',
        },
        detailed: {
          mindset: [
            'Focus on accuracy and discipline.',
            'Be detail-oriented and patient.',
            'Maintain integrity in all work.',
            'Follow structured processes consistently.',
          ],
          habits: [
            'Practice auditing and accounting regularly.',
            'Learn compliance rules and regulations.',
            'Maintain organized documentation.',
            'Stay updated with legal changes.',
            'Improve analytical skills.',
          ],
          weekly: [
            'Accounting and audit practice (8-10 hrs/week)',
            'Compliance learning (4-6 hrs/week)',
            'Skill development (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip:
            'Consistency and accuracy are your biggest strengths in compliance roles.',
          events: [
            'ICAI Events',
            'Audit Workshops',
            'Compliance Seminars',
            'LinkedIn finance groups',
            'Commerce associations',
          ],
          books: [
            'Auditing by Arens',
            'Accounting Made Simple',
            'Financial Statements by Thomas Ittelson',
            'The Intelligent Investor',
            'Principles by Ray Dalio',
          ],
        },
        tools: ['Tally', 'Excel', 'SAP', 'Audit Software', 'QuickBooks'],
        guidance_tip:
          'Your structured mindset makes you a strong compliance professional. Focus on accuracy and consistency.',
      },
    ],
  },
  {
    traitCode: 'DC',
    roles: [
      {
        career_role_name: 'Financial Data Analyst',
        short_description: 'Interpret financial datasets into clear, decision-ready business insights.',
        overview:
          'Financial Data Analysts interpret complex financial data to help businesses make informed decisions, optimize performance, and identify trends.',
        natural_strengths:
          'Your analytical thinking, precision, and ability to make logical decisions help you uncover insights and drive data-backed financial strategies.',
        roadmap: {
          foundation: 'Learn financial analysis, statistics, Excel, and data visualization basics.',
          action_steps:
            'Work on datasets, participate in analytics competitions, and intern in finance or analytics roles.',
          advancement:
            'Learn advanced tools like Python and Power BI, and pursue certifications in data analytics.',
          career_entry: 'Data Analyst, Financial Analyst, MIS Executive.',
        },
        detailed: {
          mindset: [
            'Focus on logic and data-driven decisions.',
            'Question assumptions and validate with evidence.',
            'Maintain accuracy in every analysis.',
            'Stay objective and unbiased in conclusions.',
          ],
          habits: [
            'Practice data analysis daily using real datasets.',
            'Learn Excel and visualization tools deeply.',
            'Study financial reports and trends.',
            'Work on analytics projects and case studies.',
            'Continuously improve problem-solving skills.',
          ],
          weekly: [
            'Data analysis and practice (8-10 hrs/week)',
            'Learning tools and concepts (4-6 hrs/week)',
            'Projects and portfolio building (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip:
            'Focus on accuracy and clarity. Good analysis is simple, precise, and actionable.',
          events: [
            'Data Analytics Meetups',
            'Finance and Analytics Conferences',
            'Kaggle Competitions',
            'LinkedIn data communities',
            'College analytics clubs',
          ],
          books: [
            'Data Science for Business by Foster Provost',
            'Naked Statistics by Charles Wheelan',
            'Financial Intelligence by Karen Berman',
            'The Signal and the Noise by Nate Silver',
            'Storytelling with Data by Cole Knaflic',
          ],
        },
        tools: ['Excel', 'Power BI', 'Tableau', 'Python', 'Google Sheets'],
        guidance_tip:
          'Your strength lies in turning numbers into insights. Focus on clarity and logic to become a valuable decision-maker.',
      },
      {
        career_role_name: 'Internal Auditor',
        short_description: 'Review controls and financial records to strengthen risk discipline and compliance.',
        overview:
          'Internal Auditors evaluate company processes, financial records, and compliance systems to ensure accuracy, efficiency, and risk control.',
        natural_strengths:
          'Your attention to detail, critical thinking, and structured approach make you highly effective in identifying risks and improving systems.',
        roadmap: {
          foundation: 'Learn auditing standards, accounting principles, and compliance frameworks.',
          action_steps: 'Assist in audit projects, intern in CA firms, and practice audit case studies.',
          advancement:
            'Pursue CA, CMA, or CIA certifications and move into senior audit roles.',
          career_entry: 'Audit Assistant, Internal Auditor Trainee, Accounts Executive.',
        },
        detailed: {
          mindset: [
            'Focus on accuracy and compliance.',
            'Question processes and identify risks.',
            'Stay disciplined and systematic.',
            'Maintain integrity in all findings.',
          ],
          habits: [
            'Practice auditing and accounting regularly.',
            'Review financial statements critically.',
            'Learn compliance rules and updates.',
            'Maintain detailed documentation.',
            'Improve analytical reasoning skills.',
          ],
          weekly: [
            'Audit practice and accounting (8-10 hrs/week)',
            'Compliance learning (4-6 hrs/week)',
            'Case study analysis (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Always verify before concluding. Accuracy is your strongest asset in auditing.',
          events: [
            'ICAI Events',
            'Audit and Compliance Workshops',
            'Finance Conferences',
            'LinkedIn audit groups',
            'Commerce associations',
          ],
          books: [
            'Auditing by Arens',
            'Internal Auditing by Moeller',
            'Financial Statements by Thomas Ittelson',
            'Accounting Made Simple',
            'Principles by Ray Dalio',
          ],
        },
        tools: ['Tally', 'Excel', 'SAP', 'Audit Software', 'QuickBooks'],
        guidance_tip:
          'Your analytical and detail-oriented nature makes you a strong auditor. Focus on precision and structured thinking.',
      },
      {
        career_role_name: 'Risk Analyst',
        short_description: 'Identify, model, and reduce financial and operational risk exposure.',
        overview:
          'Risk Analysts identify financial, operational, and market risks and help organizations minimize potential losses.',
        natural_strengths:
          'Your logical thinking and ability to evaluate scenarios help you predict risks and recommend preventive strategies.',
        roadmap: {
          foundation: 'Learn risk management, financial markets, and probability concepts.',
          action_steps:
            'Analyze case studies, intern in banks or finance firms, and work on risk models.',
          advancement: 'Pursue FRM certification and specialize in financial risk management.',
          career_entry: 'Risk Analyst, Credit Analyst, Financial Analyst.',
        },
        detailed: {
          mindset: [
            'Think ahead and anticipate risks.',
            'Stay logical and data-driven.',
            'Focus on prevention over reaction.',
            'Maintain objectivity in decisions.',
          ],
          habits: [
            'Analyze market trends regularly.',
            'Study financial risk models.',
            'Practice scenario analysis.',
            'Track economic indicators.',
            'Improve quantitative skills.',
          ],
          weekly: [
            'Risk analysis practice (8-10 hrs/week)',
            'Market research (4-6 hrs/week)',
            'Learning and development (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip:
            'Always think what can go wrong. This mindset defines a great risk analyst.',
          events: [
            'Risk Management Conferences',
            'FRM Events',
            'Finance Meetups',
            'LinkedIn finance groups',
            'College commerce clubs',
          ],
          books: [
            'Against the Gods by Peter Bernstein',
            'The Black Swan by Nassim Taleb',
            'Risk Management by Michel Crouhy',
            'Thinking Fast and Slow by Daniel Kahneman',
            'The Intelligent Investor',
          ],
        },
        tools: ['Excel', 'R', 'Python', 'Power BI', 'Tableau'],
        guidance_tip:
          'Your ability to analyze and predict makes you valuable. Focus on identifying risks before they become problems.',
      },
      {
        career_role_name: 'Business Intelligence Analyst',
        short_description: 'Build dashboards and convert business data into practical performance insights.',
        overview:
          'Business Intelligence Analysts convert data into actionable insights to help organizations improve decision-making and performance.',
        natural_strengths:
          'Your structured thinking and analytical ability help you transform complex data into clear business insights.',
        roadmap: {
          foundation: 'Learn data analytics, business intelligence tools, and database concepts.',
          action_steps: 'Work on dashboards, participate in analytics projects, and internships.',
          advancement: 'Master BI tools and move into senior analytics roles.',
          career_entry: 'BI Analyst, Data Analyst, MIS Analyst.',
        },
        detailed: {
          mindset: [
            'Focus on clarity and data accuracy.',
            'Think in terms of insights and impact.',
            'Stay logical and structured.',
            'Be curious about data patterns.',
          ],
          habits: [
            'Build dashboards regularly.',
            'Analyze datasets for insights.',
            'Learn visualization techniques.',
            'Practice SQL queries.',
            'Stay updated with BI trends.',
          ],
          weekly: [
            'Data and dashboard practice (8-10 hrs/week)',
            'Learning BI tools (4-6 hrs/week)',
            'Projects and networking (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Focus on presenting insights clearly, not just analyzing data.',
          events: [
            'Data Visualization Meetups',
            'Analytics Conferences',
            'Power BI Communities',
            'LinkedIn data groups',
            'College analytics clubs',
          ],
          books: [
            'Storytelling with Data',
            'Data Science for Business',
            'The Big Book of Dashboards',
            'Naked Statistics',
            'Competing on Analytics',
          ],
        },
        tools: ['Power BI', 'Tableau', 'SQL', 'Excel', 'Python'],
        guidance_tip:
          'Your strength is clarity through data. Focus on making insights simple and actionable.',
      },
      {
        career_role_name: 'Tax Consultant',
        short_description: 'Support compliant tax planning, filing accuracy, and optimization decisions.',
        overview:
          'Tax Consultants help individuals and businesses manage taxes, ensure compliance, and optimize tax savings.',
        natural_strengths:
          'Your attention to detail and logical thinking help you handle complex tax rules and ensure compliance.',
        roadmap: {
          foundation: 'Learn taxation laws, accounting, and financial regulations.',
          action_steps: 'Work under CA firms, assist in tax filing, and learn compliance systems.',
          advancement: 'Pursue CA or CMA and specialize in taxation.',
          career_entry: 'Tax Assistant, Accounts Executive, Audit Assistant.',
        },
        detailed: {
          mindset: [
            'Focus on accuracy and compliance.',
            'Stay updated with changing tax laws.',
            'Be detail-oriented and disciplined.',
            'Maintain integrity in financial reporting.',
          ],
          habits: [
            'Practice tax calculations regularly.',
            'Study tax laws and updates.',
            'Work on real tax cases.',
            'Maintain organized records.',
            'Improve analytical skills.',
          ],
          weekly: [
            'Tax practice and learning (8-10 hrs/week)',
            'Law updates and research (4-6 hrs/week)',
            'Case handling practice (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Accuracy and compliance are critical. Never rush tax-related work.',
          events: [
            'ICAI Tax Seminars',
            'Finance Workshops',
            'Tax Conferences',
            'LinkedIn finance groups',
            'Commerce associations',
          ],
          books: [
            'Income Tax Law and Practice',
            'Direct Taxes by Girish Ahuja',
            'Taxation Made Simple',
            'Accounting Made Easy',
            'Financial Statements',
          ],
        },
        tools: ['Tally', 'Excel', 'Tax Software', 'QuickBooks', 'SAP'],
        guidance_tip:
          'Your precision makes you reliable. Focus on mastering laws and accuracy.',
      },
      {
        career_role_name: 'Management Accountant',
        short_description: 'Drive cost, budgeting, and planning insights for performance-focused management.',
        overview:
          'Management Accountants support business decisions through budgeting, cost analysis, and financial planning.',
        natural_strengths:
          'Your analytical thinking and structured approach help you provide accurate financial insights for decision-making.',
        roadmap: {
          foundation: 'Learn cost accounting, budgeting, and financial planning.',
          action_steps: 'Work on budgeting projects, internships, and cost analysis tasks.',
          advancement: 'Pursue CMA and move into leadership roles.',
          career_entry: 'Accounts Executive, Cost Analyst, Finance Associate.',
        },
        detailed: {
          mindset: [
            'Focus on cost efficiency and planning.',
            'Think analytically in financial decisions.',
            'Stay disciplined and organized.',
            'Aim for long-term financial stability.',
          ],
          habits: [
            'Practice cost analysis regularly.',
            'Learn budgeting techniques.',
            'Analyze company financial data.',
            'Improve Excel skills.',
            'Stay updated on financial trends.',
          ],
          weekly: [
            'Cost analysis practice (8-10 hrs/week)',
            'Learning financial concepts (4-6 hrs/week)',
            'Projects and development (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip:
            'Strong fundamentals in cost and finance will make you highly valuable in organizations.',
          events: [
            'CMA Events',
            'Finance Conferences',
            'Accounting Workshops',
            'LinkedIn finance groups',
            'Commerce clubs',
          ],
          books: [
            'Cost Accounting by Horngren',
            'Financial Intelligence',
            'Accounting Made Simple',
            'Principles by Ray Dalio',
            'The Intelligent Investor',
          ],
        },
        tools: ['Excel', 'Tally', 'SAP', 'Power BI', 'QuickBooks'],
        guidance_tip:
          'Your analytical mindset is your strength. Focus on precision and structured financial planning.',
      },
    ],
  },
  {
    traitCode: 'ID',
    roles: [
      {
        career_role_name: 'Startup Growth Manager',
        short_description: 'Scale customer acquisition and revenue with rapid growth experimentation.',
        overview:
          'Startup Growth Managers focus on scaling businesses by driving customer acquisition, marketing strategies, and revenue growth in fast-paced environments.',
        natural_strengths:
          'Your high energy, creativity, and ability to take initiative help you experiment with ideas and drive rapid business growth.',
        roadmap: {
          foundation: 'Learn marketing fundamentals, business growth strategies, and digital marketing concepts.',
          action_steps:
            'Work on startup projects, internships in growth or marketing roles, and experiment with campaigns.',
          advancement: 'Build a strong portfolio of growth experiments and move into leadership roles.',
          career_entry: 'Growth Executive, Marketing Associate, Business Development Executive.',
        },
        detailed: {
          mindset: [
            'Think big and focus on scaling ideas quickly.',
            'Stay open to experimentation and change.',
            'Be proactive in taking initiative.',
            'Focus on growth and results over perfection.',
          ],
          habits: [
            'Test new marketing and growth ideas regularly.',
            'Analyze campaign performance and metrics.',
            'Stay updated with digital marketing trends.',
            'Build a portfolio of growth experiments.',
            'Network with startup founders and marketers.',
          ],
          weekly: [
            'Campaign building and testing (8-10 hrs/week)',
            'Learning growth strategies (4-6 hrs/week)',
            'Networking and idea generation (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Growth comes from experimentation. Fail fast, learn faster.',
          events: [
            'Startup India Events',
            'GrowthHackers Community',
            'Digital Marketing Meetups',
            'College entrepreneurship clubs',
            'LinkedIn startup groups',
          ],
          books: [
            'Hacking Growth by Sean Ellis',
            'The Lean Startup by Eric Ries',
            'Contagious by Jonah Berger',
            'Zero to One by Peter Thiel',
            'Traction by Gabriel Weinberg',
          ],
        },
        tools: ['Google Analytics', 'Meta Ads Manager', 'HubSpot', 'Canva', 'Notion'],
        guidance_tip:
          'Your energy and creativity are your strengths. Channel them into consistent experiments to drive business growth.',
      },
      {
        career_role_name: 'Brand Manager',
        short_description: 'Build brand positioning, messaging, and campaigns that shape customer perception.',
        overview:
          'Brand Managers create and manage a company’s brand image, positioning, and communication strategies to attract and retain customers.',
        natural_strengths:
          'Your creativity, enthusiasm, and ability to influence people help you build strong brand identities and connect with audiences.',
        roadmap: {
          foundation:
            'Learn branding, marketing communication, consumer behavior, and advertising principles.',
          action_steps:
            'Work on brand campaigns, internships in marketing agencies, and college branding projects.',
          advancement: 'Move into senior brand roles by managing campaigns and brand portfolios.',
          career_entry: 'Marketing Executive, Brand Executive, Social Media Manager.',
        },
        detailed: {
          mindset: [
            'Think creatively and emotionally connect with audiences.',
            'Focus on building a strong brand story.',
            'Stay adaptable to changing market trends.',
            'Prioritize customer perception and experience.',
          ],
          habits: [
            'Analyze successful brand campaigns.',
            'Create and test marketing content regularly.',
            'Stay updated with social media trends.',
            'Build creative portfolios.',
            'Network with marketing professionals.',
          ],
          weekly: [
            'Campaign creation and branding work (8-10 hrs/week)',
            'Learning marketing strategies (4-6 hrs/week)',
            'Networking and idea generation (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Strong brands are built through consistent messaging and creativity.',
          events: [
            'Advertising and Marketing Conferences',
            'Brand Strategy Workshops',
            'Social Media Communities',
            'LinkedIn marketing groups',
            'College marketing clubs',
          ],
          books: [
            'Building a StoryBrand by Donald Miller',
            'Contagious by Jonah Berger',
            'This is Marketing by Seth Godin',
            'Purple Cow by Seth Godin',
            'Hooked by Nir Eyal',
          ],
        },
        tools: ['Canva', 'Adobe Photoshop', 'Google Analytics', 'Meta Ads Manager', 'Hootsuite'],
        guidance_tip:
          'Your creativity can shape powerful brands. Focus on storytelling and consistency.',
      },
      {
        career_role_name: 'Digital Marketing Strategist',
        short_description: 'Design and optimize digital campaigns for traffic, engagement, and conversions.',
        overview:
          'Digital Marketing Strategists design and execute online marketing campaigns to drive traffic, engagement, and sales.',
        natural_strengths:
          'Your innovative thinking and enthusiasm help you create impactful digital campaigns and adapt quickly to trends.',
        roadmap: {
          foundation: 'Learn SEO, social media marketing, content marketing, and analytics.',
          action_steps: 'Run campaigns, build social media pages, and work on freelance projects.',
          advancement: 'Specialize in performance marketing or strategy roles.',
          career_entry: 'Digital Marketing Executive, SEO Analyst, Content Strategist.',
        },
        detailed: {
          mindset: [
            'Stay creative and experimental.',
            'Focus on measurable results.',
            'Adapt quickly to digital trends.',
            'Think from the customer perspective.',
          ],
          habits: [
            'Run digital campaigns regularly.',
            'Analyze campaign performance metrics.',
            'Stay updated with SEO and marketing trends.',
            'Build a portfolio of projects.',
            'Engage in online marketing communities.',
          ],
          weekly: [
            'Campaign execution (8-10 hrs/week)',
            'Learning and optimization (4-6 hrs/week)',
            'Networking and content creation (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Focus on results. Track everything and improve continuously.',
          events: [
            'Digital Marketing Summits',
            'SEO Meetups',
            'Social Media Communities',
            'LinkedIn groups',
            'College marketing clubs',
          ],
          books: [
            'Digital Marketing for Dummies',
            'Jab, Jab, Jab, Right Hook by Gary Vee',
            'Contagious by Jonah Berger',
            'Made to Stick by Chip Heath',
            'Influence by Robert Cialdini',
          ],
        },
        tools: ['Google Analytics', 'SEMrush', 'Ahrefs', 'Meta Ads Manager', 'Mailchimp'],
        guidance_tip:
          'Your energy and creativity can drive strong campaigns. Focus on testing and optimizing continuously.',
      },
      {
        career_role_name: 'Business Development Executive',
        short_description: 'Create partnerships and pipeline growth through proactive outreach and negotiation.',
        overview:
          'Business Development Executives identify new opportunities, build partnerships, and drive company growth through strategic deals.',
        natural_strengths:
          'Your communication skills, confidence, and enthusiasm help you connect with people and build business relationships.',
        roadmap: {
          foundation: 'Learn sales, negotiation, and business strategy basics.',
          action_steps:
            'Participate in sales internships, networking events, and client interaction roles.',
          advancement: 'Move into senior business development or partnership roles.',
          career_entry: 'Sales Executive, Business Development Associate, Account Executive.',
        },
        detailed: {
          mindset: [
            'Stay proactive in finding opportunities.',
            'Focus on building strong relationships.',
            'Be confident in communication.',
            'Stay goal-oriented and growth-focused.',
          ],
          habits: [
            'Practice pitching and negotiation skills.',
            'Network with professionals regularly.',
            'Track leads and business opportunities.',
            'Learn from successful deals.',
            'Improve communication skills daily.',
          ],
          weekly: [
            'Client interaction and pitching (8-10 hrs/week)',
            'Market research (4-6 hrs/week)',
            'Networking (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Every conversation can open a new opportunity. Stay active and engaged.',
          events: [
            'Business networking events',
            'Startup meetups',
            'Sales workshops',
            'LinkedIn communities',
            'College business clubs',
          ],
          books: [
            'How to Win Friends and Influence People',
            'The Challenger Sale',
            'To Sell is Human',
            'Never Split the Difference',
            'Sell or Be Sold',
          ],
        },
        tools: ['CRM Software', 'LinkedIn', 'Excel', 'HubSpot', 'Google Sheets'],
        guidance_tip:
          'Your enthusiasm is your advantage. Use it to build strong networks and close opportunities.',
      },
      {
        career_role_name: 'E-commerce Business Manager',
        short_description: 'Manage online store growth, performance marketing, and conversion-focused operations.',
        overview:
          'E-commerce Managers handle online store operations, sales strategies, and customer experience to drive revenue.',
        natural_strengths:
          'Your creativity and adaptability help you manage dynamic online businesses and respond quickly to trends.',
        roadmap: {
          foundation: 'Learn e-commerce platforms, digital marketing, and business operations.',
          action_steps: 'Create online stores, manage products, and run campaigns.',
          advancement: 'Scale businesses and manage multiple product lines.',
          career_entry: 'E-commerce Executive, Online Store Manager, Digital Sales Associate.',
        },
        detailed: {
          mindset: [
            'Focus on growth and scalability.',
            'Stay adaptable to market trends.',
            'Think from customer perspective.',
            'Be proactive in decision-making.',
          ],
          habits: [
            'Manage online stores regularly.',
            'Track sales and performance metrics.',
            'Experiment with marketing strategies.',
            'Improve product listings.',
            'Stay updated with e-commerce trends.',
          ],
          weekly: [
            'Store management and sales (8-10 hrs/week)',
            'Marketing and optimization (4-6 hrs/week)',
            'Learning and networking (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip:
            'Small improvements in online stores can significantly increase sales.',
          events: [
            'E-commerce Conferences',
            'Amazon Seller Meetups',
            'Digital Marketing Events',
            'LinkedIn communities',
            'Startup groups',
          ],
          books: [
            'DotCom Secrets by Russell Brunson',
            'The Lean Startup',
            'Crushing It by Gary Vee',
            'Contagious',
            'Influence',
          ],
        },
        tools: ['Shopify', 'Amazon Seller Central', 'Google Analytics', 'Canva', 'Meta Ads Manager'],
        guidance_tip:
          'Your energy and adaptability help you succeed. Focus on continuous improvement and scaling.',
      },
      {
        career_role_name: 'Advertising Campaign Manager',
        short_description: 'Plan and optimize advertising campaigns with creative plus performance discipline.',
        overview:
          'Advertising Campaign Managers plan, execute, and optimize marketing campaigns to promote products and services.',
        natural_strengths:
          'Your creativity and communication skills help you design engaging campaigns and capture audience attention.',
        roadmap: {
          foundation: 'Learn advertising principles, campaign planning, and media strategies.',
          action_steps: 'Work on ad campaigns, internships in agencies, and marketing projects.',
          advancement: 'Move into senior campaign or marketing leadership roles.',
          career_entry: 'Advertising Executive, Campaign Manager, Media Planner.',
        },
        detailed: {
          mindset: [
            'Think creatively and strategically.',
            'Focus on audience engagement.',
            'Stay adaptable to trends.',
            'Aim for measurable campaign success.',
          ],
          habits: [
            'Analyze advertising campaigns regularly.',
            'Create and test ad creatives.',
            'Track campaign performance.',
            'Stay updated with marketing trends.',
            'Build a creative portfolio.',
          ],
          weekly: [
            'Campaign creation and execution (8-10 hrs/week)',
            'Learning and analysis (4-6 hrs/week)',
            'Networking and creativity (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Creativity combined with data leads to successful campaigns.',
          events: [
            'Advertising Conferences',
            'Marketing Meetups',
            'Creative Communities',
            'LinkedIn marketing groups',
            'College clubs',
          ],
          books: [
            'Ogilvy on Advertising',
            'Made to Stick',
            'Contagious',
            'This is Marketing',
            'Hooked',
          ],
        },
        tools: ['Google Ads', 'Meta Ads Manager', 'Canva', 'Adobe Photoshop', 'Google Analytics'],
        guidance_tip:
          'Your creativity is your strength. Combine it with data to create impactful campaigns.',
      },
    ],
  },
  {
    traitCode: 'IS',
    roles: [
      {
        career_role_name: 'Customer Success Manager',
        short_description: 'Build adoption, retention, and satisfaction through proactive customer support.',
        overview:
          'Customer Success Managers ensure that clients achieve maximum value from products or services by providing continuous support, onboarding, and relationship management.',
        natural_strengths:
          'Your supportive nature, energy, and ability to connect with people help you build strong relationships and ensure customer satisfaction.',
        roadmap: {
          foundation: 'Learn customer success principles, communication skills, and basic business operations.',
          action_steps: 'Intern in support or client-facing roles, manage customer interactions, and learn CRM tools.',
          advancement: 'Move into senior customer success or account management roles.',
          career_entry: 'Customer Support Executive, Client Success Associate, Account Coordinator.',
        },
        detailed: {
          mindset: [
            'Focus on helping customers succeed genuinely.',
            'Be patient and empathetic in interactions.',
            'Build trust through consistent support.',
            'Stay positive and solution-oriented.',
          ],
          habits: [
            'Follow up with customers regularly.',
            'Understand customer pain points deeply.',
            'Improve communication and listening skills.',
            'Track customer feedback and satisfaction.',
            'Build long-term client relationships.',
          ],
          weekly: [
            'Customer interaction and support (8-10 hrs/week)',
            'Learning tools and communication (4-6 hrs/week)',
            'Networking and development (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip:
            'Always focus on long-term relationships rather than short-term solutions.',
          events: [
            'Customer Success Meetups',
            'SaaS Communities',
            'LinkedIn customer success groups',
            'Business networking events',
            'College commerce clubs',
          ],
          books: [
            'Customer Success by Nick Mehta',
            'The Effortless Experience',
            'How to Win Friends and Influence People',
            'The Trusted Advisor',
            'Never Split the Difference',
          ],
        },
        tools: ['Salesforce', 'HubSpot', 'Zoho CRM', 'Freshdesk', 'Google Sheets'],
        guidance_tip:
          'Your strength lies in empathy and energy. Use it to create meaningful and lasting customer relationships.',
      },
      {
        career_role_name: 'Human Resource Executive',
        short_description: 'Support hiring, employee engagement, and workplace stability.',
        overview:
          'HR Executives manage employee relations, recruitment, and workplace culture, ensuring smooth organizational functioning.',
        natural_strengths:
          'Your people-centric mindset and supportive nature help you handle employee needs and maintain a positive work environment.',
        roadmap: {
          foundation: 'Learn HR fundamentals, recruitment processes, and labor laws.',
          action_steps: 'Intern in HR roles and assist in hiring and engagement activities.',
          advancement: 'Specialize in HR functions and move into HR management roles.',
          career_entry: 'HR Executive, Recruitment Coordinator, HR Assistant.',
        },
        detailed: {
          mindset: [
            'Focus on people well-being and fairness.',
            'Be empathetic and approachable.',
            'Maintain professionalism and confidentiality.',
            'Build a positive work culture.',
          ],
          habits: [
            'Improve communication skills.',
            'Learn HR systems and tools.',
            'Stay updated on labor laws.',
            'Engage with employees regularly.',
            'Develop conflict resolution skills.',
          ],
          weekly: [
            'HR learning and operations (8-10 hrs/week)',
            'Communication and employee engagement (4-6 hrs/week)',
            'Development and networking (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Listening is the most powerful HR skill. Practice it daily.',
          events: ['NHRD Events', 'HR Conferences', 'Recruitment Workshops', 'LinkedIn HR groups', 'College HR clubs'],
          books: [
            'Work Rules by Laszlo Bock',
            'Drive by Daniel Pink',
            'First Break All the Rules',
            'HR from the Outside In',
            'Leaders Eat Last',
          ],
        },
        tools: ['Zoho People', 'SAP HR', 'MS Excel', 'HRMS Software', 'LinkedIn'],
        guidance_tip:
          'Your ability to understand people makes you valuable. Focus on building trust and strong workplace relationships.',
      },
      {
        career_role_name: 'Training and Development Coordinator',
        short_description: 'Design learning programs that improve skills, engagement, and performance.',
        overview:
          'Training Coordinators design and manage employee training programs to improve skills and performance within organizations.',
        natural_strengths:
          'Your enthusiasm and supportive approach help you motivate others and create engaging learning environments.',
        roadmap: {
          foundation: 'Learn training methods, communication, and organizational behavior.',
          action_steps: 'Conduct workshops, assist trainers, and create learning content.',
          advancement: 'Move into corporate training or L and D leadership roles.',
          career_entry: 'Training Assistant, L and D Coordinator, HR Trainer.',
        },
        detailed: {
          mindset: [
            'Focus on helping others grow.',
            'Stay energetic and engaging.',
            'Be patient with learners.',
            'Encourage continuous improvement.',
          ],
          habits: [
            'Create training content regularly.',
            'Conduct small workshops.',
            'Improve presentation skills.',
            'Gather feedback and improve sessions.',
            'Stay updated with learning trends.',
          ],
          weekly: [
            'Training and content creation (8-10 hrs/week)',
            'Learning and development (4-6 hrs/week)',
            'Networking and practice (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Teaching others helps you learn faster. Practice regularly.',
          events: ['L and D Conferences', 'Training Workshops', 'HR Communities', 'LinkedIn groups', 'College clubs'],
          books: ['The Art of Training', 'Drive by Daniel Pink', 'Make It Stick', 'Talk Like TED', 'Atomic Habits'],
        },
        tools: ['Canva', 'PowerPoint', 'Google Classroom', 'Zoom', 'Notion'],
        guidance_tip:
          'Your energy can inspire others. Focus on creating engaging and impactful learning experiences.',
      },
      {
        career_role_name: 'Retail Store Manager',
        short_description: 'Lead store operations, team performance, and customer experience quality.',
        overview:
          'Retail Store Managers oversee daily store operations, customer service, and sales performance in retail businesses.',
        natural_strengths:
          'Your people skills and energy help you manage teams and ensure a positive customer experience.',
        roadmap: {
          foundation: 'Learn retail management, sales strategies, and operations.',
          action_steps: 'Work in retail environments, manage teams, and handle customer interactions.',
          advancement: 'Move into regional or corporate retail management roles.',
          career_entry: 'Store Executive, Sales Associate, Retail Supervisor.',
        },
        detailed: {
          mindset: [
            'Focus on customer satisfaction.',
            'Be energetic and approachable.',
            'Lead teams with positivity.',
            'Stay consistent in operations.',
          ],
          habits: [
            'Monitor store performance regularly.',
            'Improve customer interaction skills.',
            'Train and support team members.',
            'Track sales and targets.',
            'Maintain store standards.',
          ],
          weekly: [
            'Store operations and management (8-10 hrs/week)',
            'Team coordination (4-6 hrs/week)',
            'Learning and improvement (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Happy customers and motivated teams drive retail success.',
          events: [
            'Retail Conferences',
            'Sales Workshops',
            'Customer service training events',
            'LinkedIn retail groups',
            'Commerce clubs',
          ],
          books: [
            'Retail Management by Levy',
            'The Customer Experience Book',
            'Leaders Eat Last',
            'Atomic Habits',
            'The Psychology of Selling',
          ],
        },
        tools: ['POS Systems', 'Excel', 'CRM Software', 'Inventory Software', 'Google Sheets'],
        guidance_tip:
          'Your energy and people skills can transform customer experiences. Focus on service and team leadership.',
      },
      {
        career_role_name: 'Event and Relationship Coordinator',
        short_description: 'Plan and execute client-facing events while strengthening relationship outcomes.',
        overview:
          'Event Coordinators manage business events, corporate programs, and client engagement activities.',
        natural_strengths:
          'Your enthusiasm, communication skills, and ability to connect with people make you excellent at organizing and managing events.',
        roadmap: {
          foundation: 'Learn event management, communication, and coordination skills.',
          action_steps: 'Organize college events, internships, and corporate programs.',
          advancement: 'Move into event management leadership roles.',
          career_entry: 'Event Coordinator, Program Executive, Client Coordinator.',
        },
        detailed: {
          mindset: [
            'Focus on creating positive experiences.',
            'Stay organized and proactive.',
            'Be adaptable to changes.',
            'Maintain strong relationships.',
          ],
          habits: [
            'Plan and organize events regularly.',
            'Improve coordination skills.',
            'Build vendor and client networks.',
            'Track event performance.',
            'Learn from each event experience.',
          ],
          weekly: [
            'Event planning and execution (8-10 hrs/week)',
            'Coordination and networking (4-6 hrs/week)',
            'Learning and improvement (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Attention to detail makes events successful. Focus on planning thoroughly.',
          events: [
            'Event Management Conferences',
            'Corporate networking events',
            'LinkedIn communities',
            'College clubs',
            'Startup meetups',
          ],
          books: ['Event Planning by Judy Allen', 'The Art of Gathering', 'Leaders Eat Last', 'Atomic Habits', 'Start with Why'],
        },
        tools: ['Google Calendar', 'Trello', 'Canva', 'Excel', 'Event Management Software'],
        guidance_tip:
          'Your ability to connect and energize people makes you a natural coordinator. Focus on execution and relationships.',
      },
      {
        career_role_name: 'Client Service Executive',
        short_description: 'Resolve client issues quickly and maintain dependable service quality.',
        overview:
          'Client Service Executives handle customer queries, provide solutions, and ensure smooth service delivery.',
        natural_strengths:
          'Your supportive nature and communication skills help you maintain strong client relationships and satisfaction.',
        roadmap: {
          foundation: 'Learn customer service principles, communication, and CRM tools.',
          action_steps: 'Intern in service roles, handle customer interactions, and solve client issues.',
          advancement: 'Move into client success or account management roles.',
          career_entry: 'Customer Support Executive, Client Service Associate, Helpdesk Executive.',
        },
        detailed: {
          mindset: [
            'Focus on solving customer problems.',
            'Stay calm and patient.',
            'Build trust through communication.',
            'Maintain a positive attitude.',
          ],
          habits: [
            'Respond to customer queries promptly.',
            'Improve listening skills.',
            'Track customer feedback.',
            'Learn problem-solving techniques.',
            'Build strong client relationships.',
          ],
          weekly: [
            'Customer interaction (8-10 hrs/week)',
            'Learning tools and communication (4-6 hrs/week)',
            'Development and networking (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Quick and effective communication builds strong client trust.',
          events: [
            'Customer Service Conferences',
            'CRM Workshops',
            'LinkedIn groups',
            'Business networking events',
            'College clubs',
          ],
          books: [
            'The Effortless Experience',
            'Customer Success',
            'How to Win Friends and Influence People',
            'Never Split the Difference',
            'The Trusted Advisor',
          ],
        },
        tools: ['Freshdesk', 'Zoho CRM', 'Salesforce', 'Excel', 'Google Sheets'],
        guidance_tip:
          'Your empathy and energy are your strengths. Focus on delivering consistent and reliable customer experiences.',
      },
    ],
  },
  {
    traitCode: 'IC',
    roles: [
      {
        career_role_name: 'Marketing Strategist',
        short_description: 'Design creative, data-backed campaigns that improve brand growth and sales.',
        overview:
          'Marketing Strategists design creative campaigns and business strategies to attract customers, build brand presence, and drive sales growth.',
        natural_strengths:
          'Your combination of creativity and analytical thinking helps you generate innovative ideas while ensuring they align with business goals.',
        roadmap: {
          foundation:
            'Learn marketing principles, consumer behavior, branding, and digital marketing basics.',
          action_steps: 'Work on marketing campaigns, internships, and social media projects.',
          advancement: 'Specialize in strategic marketing roles and manage large-scale campaigns.',
          career_entry: 'Marketing Executive, Campaign Analyst, Brand Associate.',
        },
        detailed: {
          mindset: [
            'Think creatively while staying aligned with business goals.',
            'Focus on understanding customer psychology deeply.',
            'Balance innovation with practicality.',
            'Stay curious about trends and ideas.',
          ],
          habits: [
            'Analyze successful campaigns regularly.',
            'Create marketing ideas and test them.',
            'Study customer behavior patterns.',
            'Build a portfolio of creative strategies.',
            'Engage in marketing communities.',
          ],
          weekly: [
            'Campaign planning and execution (8-10 hrs/week)',
            'Learning marketing concepts (4-6 hrs/week)',
            'Creative thinking and networking (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Creativity becomes powerful when backed by data. Always measure your ideas.',
          events: [
            'Marketing Conferences',
            'Brand Strategy Workshops',
            'Digital Marketing Meetups',
            'LinkedIn marketing groups',
            'College marketing clubs',
          ],
          books: [
            'This is Marketing by Seth Godin',
            'Contagious by Jonah Berger',
            'Made to Stick by Chip Heath',
            'Hooked by Nir Eyal',
            'Purple Cow by Seth Godin',
          ],
        },
        tools: ['Google Analytics', 'Canva', 'Meta Ads Manager', 'HubSpot', 'Notion'],
        guidance_tip:
          'Your creativity can drive powerful strategies. Focus on turning ideas into measurable results.',
      },
      {
        career_role_name: 'Creative Business Consultant',
        short_description: 'Solve business problems with a mix of strategic logic and creative design.',
        overview:
          'Creative Business Consultants help organizations solve problems using innovative approaches, combining strategy with creative thinking.',
        natural_strengths:
          'Your ability to think differently and analyze situations helps you provide unique solutions to business challenges.',
        roadmap: {
          foundation:
            'Learn business strategy, problem-solving frameworks, and creative thinking techniques.',
          action_steps: 'Work on business case studies, internships, and consulting projects.',
          advancement:
            'Move into senior consulting roles or specialize in innovation consulting.',
          career_entry: 'Business Analyst, Consultant Trainee, Strategy Associate.',
        },
        detailed: {
          mindset: [
            'Approach problems with creativity and logic.',
            'Focus on innovative yet practical solutions.',
            'Stay open to new ideas and perspectives.',
            'Think from a business impact viewpoint.',
          ],
          habits: [
            'Solve business case studies regularly.',
            'Practice brainstorming innovative ideas.',
            'Analyze company strategies.',
            'Improve presentation skills.',
            'Network with industry professionals.',
          ],
          weekly: [
            'Case study solving (8-10 hrs/week)',
            'Learning business frameworks (4-6 hrs/week)',
            'Networking and ideation (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip:
            'The best solutions are simple, creative, and impactful. Focus on clarity.',
          events: [
            'Consulting Workshops',
            'Innovation Conferences',
            'Startup Meetups',
            'LinkedIn consulting groups',
            'College consulting clubs',
          ],
          books: [
            'The McKinsey Way',
            'Blue Ocean Strategy',
            'Thinkertoys by Michael Michalko',
            'Good Strategy Bad Strategy',
            'The Pyramid Principle',
          ],
        },
        tools: ['PowerPoint', 'Miro', 'Notion', 'Excel', 'Canva'],
        guidance_tip:
          'Your ability to think differently makes you valuable. Focus on solving real business problems creatively.',
      },
      {
        career_role_name: 'Content and Business Communication Specialist',
        short_description: 'Create persuasive business content and communication systems for engagement.',
        overview:
          'Content Specialists create business content, reports, and communication strategies that help organizations connect with audiences.',
        natural_strengths:
          'Your creativity and communication skills help you present ideas clearly and engagingly.',
        roadmap: {
          foundation: 'Learn content writing, business communication, and storytelling techniques.',
          action_steps: 'Create blogs, reports, and social media content.',
          advancement: 'Move into content strategy or communication leadership roles.',
          career_entry: 'Content Writer, Communication Executive, Copywriter.',
        },
        detailed: {
          mindset: [
            'Focus on clarity and storytelling.',
            'Think from the audience perspective.',
            'Stay creative in communication.',
            'Aim for impactful messaging.',
          ],
          habits: [
            'Write content regularly.',
            'Analyze successful communication strategies.',
            'Improve storytelling skills.',
            'Build a content portfolio.',
            'Stay updated with content trends.',
          ],
          weekly: [
            'Content creation (8-10 hrs/week)',
            'Learning communication skills (4-6 hrs/week)',
            'Networking and idea generation (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Clear communication is more powerful than complex ideas. Keep it simple.',
          events: [
            'Content Marketing Conferences',
            'Writing Workshops',
            'LinkedIn content groups',
            'Blogging communities',
            'College media clubs',
          ],
          books: [
            'Everybody Writes by Ann Handley',
            'Made to Stick',
            'On Writing Well',
            'Building a StoryBrand',
            'The Copywriter’s Handbook',
          ],
        },
        tools: ['Grammarly', 'Canva', 'Notion', 'Google Docs', 'WordPress'],
        guidance_tip:
          'Your words can influence decisions. Focus on clarity, creativity, and impact.',
      },
      {
        career_role_name: 'Advertising and Media Planner',
        short_description: 'Plan channel strategy and ad mixes to maximize campaign reach and ROI.',
        overview:
          'Media Planners design advertising strategies, choose platforms, and optimize campaigns to reach the right audience.',
        natural_strengths:
          'Your creative thinking and analytical ability help you design effective advertising strategies.',
        roadmap: {
          foundation: 'Learn advertising principles, media planning, and digital marketing.',
          action_steps: 'Work on ad campaigns, internships in agencies, and marketing projects.',
          advancement: 'Move into senior media planning roles.',
          career_entry: 'Media Planner, Advertising Executive, Campaign Analyst.',
        },
        detailed: {
          mindset: [
            'Think creatively and strategically.',
            'Focus on audience targeting.',
            'Balance creativity with data.',
            'Stay adaptable to trends.',
          ],
          habits: [
            'Analyze advertising campaigns.',
            'Create and test ad strategies.',
            'Track campaign performance.',
            'Learn media platforms.',
            'Build a portfolio.',
          ],
          weekly: [
            'Campaign planning (8-10 hrs/week)',
            'Learning platforms (4-6 hrs/week)',
            'Networking and creativity (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Creativity works best when supported by data insights.',
          events: [
            'Advertising Conferences',
            'Marketing Meetups',
            'Creative Communities',
            'LinkedIn groups',
            'College clubs',
          ],
          books: [
            'Ogilvy on Advertising',
            'Contagious',
            'This is Marketing',
            'Made to Stick',
            'Hooked',
          ],
        },
        tools: ['Google Ads', 'Meta Ads Manager', 'Canva', 'Adobe Photoshop', 'Google Analytics'],
        guidance_tip:
          'Your creative thinking can drive impactful campaigns. Focus on both design and performance.',
      },
      {
        career_role_name: 'Innovation Manager - Business Solutions',
        short_description: 'Design practical, high-impact innovations to solve business process challenges.',
        overview:
          'Innovation Managers develop new business ideas, improve processes, and create innovative solutions within organizations.',
        natural_strengths:
          'Your ability to think creatively and analytically helps you design unique solutions for business challenges.',
        roadmap: {
          foundation:
            'Learn innovation management, business strategy, and problem-solving techniques.',
          action_steps: 'Work on innovation projects, startup ideas, and business challenges.',
          advancement: 'Move into leadership roles managing innovation teams.',
          career_entry: 'Innovation Analyst, Strategy Associate, Business Analyst.',
        },
        detailed: {
          mindset: [
            'Think beyond traditional solutions.',
            'Focus on solving real problems.',
            'Stay curious and open-minded.',
            'Balance creativity with practicality.',
          ],
          habits: [
            'Brainstorm ideas regularly.',
            'Work on innovation projects.',
            'Study successful innovations.',
            'Build prototypes or concepts.',
            'Network with innovators.',
          ],
          weekly: [
            'Idea development and projects (8-10 hrs/week)',
            'Learning innovation frameworks (4-6 hrs/week)',
            'Networking and exploration (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Innovation comes from solving real problems. Focus on practical ideas.',
          events: [
            'Innovation Conferences',
            'Startup Meetups',
            'Entrepreneurship Events',
            'LinkedIn groups',
            'College innovation clubs',
          ],
          books: [
            'Blue Ocean Strategy',
            'The Lean Startup',
            'Thinkertoys',
            'Zero to One',
            'Creative Confidence',
          ],
        },
        tools: ['Miro', 'Notion', 'Canva', 'Trello', 'Google Workspace'],
        guidance_tip:
          'Your creative thinking is your edge. Focus on building solutions that create real value.',
      },
      {
        career_role_name: 'Social Media Business Manager',
        short_description: 'Grow digital brand visibility through engagement strategy and campaign execution.',
        overview:
          'Social Media Managers handle brand presence, engagement strategies, and digital campaigns to grow business visibility online.',
        natural_strengths:
          'Your creativity and understanding of people help you create engaging content and build online communities.',
        roadmap: {
          foundation: 'Learn social media marketing, content creation, and analytics.',
          action_steps: 'Manage social media pages, create content, and run campaigns.',
          advancement: 'Move into strategy and brand leadership roles.',
          career_entry: 'Social Media Executive, Content Manager, Digital Marketing Associate.',
        },
        detailed: {
          mindset: [
            'Think creatively and stay trend-focused.',
            'Focus on audience engagement.',
            'Be consistent in content creation.',
            'Stay adaptable to platform changes.',
          ],
          habits: [
            'Create content regularly.',
            'Analyze engagement metrics.',
            'Stay updated with trends.',
            'Experiment with formats.',
            'Build a portfolio.',
          ],
          weekly: [
            'Content creation (8-10 hrs/week)',
            'Learning and analysis (4-6 hrs/week)',
            'Networking and engagement (2-3 hrs/week)',
            'Total (about 14-19 hrs/week)',
          ],
          weekly_tip: 'Consistency and creativity are key to social media success.',
          events: [
            'Social Media Conferences',
            'Digital Marketing Meetups',
            'Creator Communities',
            'LinkedIn groups',
            'College clubs',
          ],
          books: [
            'Jab, Jab, Jab, Right Hook',
            'Contagious',
            'This is Marketing',
            'Hooked',
            'Crushing It',
          ],
        },
        tools: ['Canva', 'Meta Ads Manager', 'Hootsuite', 'Google Analytics', 'Buffer'],
        guidance_tip:
          'Your creativity can build strong online brands. Focus on consistency and audience connection.',
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
      throw new Error('Required traits DI, DS, DC, ID, IS, IC are not fully available.');
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

      if (!traitId) {
        throw new Error(`Trait missing: ${block.traitCode}`);
      }

      if (block.roles.length !== 6) {
        throw new Error(`Trait ${block.traitCode} must contain exactly 6 roles.`);
      }

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
               SELECT 1
               FROM jsonb_array_elements(g.section_content) e
               WHERE e->>'title' = 'Detailed Guidelines'
                 AND jsonb_typeof(e->'content') = 'array'
             )
           ) AS has_detailed_guidelines
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
         COUNT(*) FILTER (WHERE has_detailed_guidelines > 0) AS roles_with_detailed_guidelines
       FROM role_checks`,
      [DEGREE_ID, TARGET_TRAITS]
    );

    await client.query('COMMIT');

    console.log('SUCCESS: Loaded Commerce (dept 21) DI/DS/DC/ID/IS/IC with structured guidance JSON.');
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
