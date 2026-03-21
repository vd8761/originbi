require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const DEGREE_ID = 23; // MCA
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
        career_role_name: 'Software Development Team Lead',
        short_description: 'Lead development teams to build reliable and scalable software applications.',
        overview: 'Software Development Leads manage coding, team coordination, and delivery of applications while ensuring quality and timelines are maintained.',
        natural_strengths: 'Your disciplined and execution-focused mindset ensures consistent and reliable development output.',
        roadmap: {
          foundation: 'Study programming, system design, and development workflows.',
          action_steps: 'Build projects, lead small teams, and manage development cycles.',
          advancement: 'Move into roles like Engineering Manager or Tech Head.',
          career_entry: 'Software Developer, Senior Developer.',
        },
        detailed: {
          mindset: ['Focus on execution and delivery', 'Maintain consistency', 'Lead by example', 'Ensure quality'],
          habits: ['Code regularly', 'Review code', 'Manage tasks', 'Improve systems', 'Stay updated'],
          weekly: ['Coding and development (8-10 hrs/week)', 'Team coordination (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Consistent execution builds strong technical leadership.',
          events: ['Developer Meetups', 'Tech Conferences', 'Agile Workshops', 'Coding Communities', 'LinkedIn Developer Groups'],
          books: ['Clean Code', 'The Pragmatic Programmer', 'Designing Data-Intensive Applications', 'The Phoenix Project', 'Atomic Habits'],
        },
        tools: ['VS Code', 'GitHub', 'Docker', 'Jira', 'AWS'],
        guidance_tip: 'Your consistency ensures strong and reliable development output.',
      },
      {
        career_role_name: 'QA Automation and Testing Manager',
        short_description: 'Ensure software quality through structured testing and automation.',
        overview: 'QA Managers design testing strategies, implement automation, and ensure defect-free software delivery.',
        natural_strengths: 'Your attention to detail ensures accuracy and high-quality outputs.',
        roadmap: {
          foundation: 'Study software testing, QA processes, and automation tools.',
          action_steps: 'Build test cases, automate testing, and improve quality frameworks.',
          advancement: 'Move into roles like QA Head or Quality Director.',
          career_entry: 'QA Engineer, Test Engineer.',
        },
        detailed: {
          mindset: ['Focus on quality', 'Maintain discipline', 'Ensure accuracy', 'Prevent errors'],
          habits: ['Write test cases', 'Automate testing', 'Analyze bugs', 'Improve processes', 'Stay updated'],
          weekly: ['Testing (8-10 hrs/week)', 'Automation (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Quality control ensures reliable software.',
          events: ['QA Conferences', 'Testing Meetups', 'Automation Events', 'Tech Forums', 'LinkedIn QA Groups'],
          books: ['Agile Testing', 'Clean Code', 'The Pragmatic Programmer', 'Atomic Habits', 'The Phoenix Project'],
        },
        tools: ['Selenium', 'Postman', 'Jira', 'TestRail', 'Automation Tools'],
        guidance_tip: 'Your precision ensures high-quality product delivery.',
      },
      {
        career_role_name: 'IT Operations and DevOps Manager',
        short_description: 'Manage deployment, infrastructure, and system reliability using DevOps practices.',
        overview: 'DevOps Managers ensure smooth deployment pipelines, manage infrastructure, and maintain system uptime.',
        natural_strengths: 'Your reliability helps maintain stable and efficient systems.',
        roadmap: {
          foundation: 'Study DevOps tools, cloud computing, and system administration.',
          action_steps: 'Build CI/CD pipelines, manage infrastructure, and automate processes.',
          advancement: 'Move into roles like DevOps Head or Cloud Architect.',
          career_entry: 'DevOps Engineer, System Administrator.',
        },
        detailed: {
          mindset: ['Focus on stability', 'Ensure system reliability', 'Improve efficiency', 'Maintain consistency'],
          habits: ['Monitor systems', 'Automate workflows', 'Learn cloud tools', 'Improve pipelines', 'Stay updated'],
          weekly: ['System management (8-10 hrs/week)', 'Automation (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong DevOps ensures seamless delivery.',
          events: ['DevOps Conferences', 'Cloud Meetups', 'Tech Forums', 'Infrastructure Events', 'LinkedIn Groups'],
          books: ['The Phoenix Project', 'The DevOps Handbook', 'Clean Code', 'Atomic Habits', 'The Pragmatic Programmer'],
        },
        tools: ['Docker', 'Kubernetes', 'AWS', 'Jenkins', 'Linux'],
        guidance_tip: 'Your consistency ensures reliable and scalable systems.',
      },
      {
        career_role_name: 'Database Administrator (DBA) and Data Systems Manager',
        short_description: 'Manage databases, ensure data integrity, and optimize performance.',
        overview: 'DBAs maintain databases, manage backups, optimize queries, and ensure secure and efficient data storage.',
        natural_strengths: 'Your structured approach ensures accuracy and reliability in data management.',
        roadmap: {
          foundation: 'Study databases, SQL, and data systems.',
          action_steps: 'Manage databases, optimize queries, and ensure backups.',
          advancement: 'Move into roles like Data Architect or Data Manager.',
          career_entry: 'Database Analyst, SQL Developer.',
        },
        detailed: {
          mindset: ['Focus on accuracy', 'Maintain data integrity', 'Ensure reliability', 'Think systematically'],
          habits: ['Practice SQL', 'Optimize queries', 'Monitor databases', 'Improve performance', 'Stay updated'],
          weekly: ['Database management (8-10 hrs/week)', 'Optimization (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong data systems ensure business continuity.',
          events: ['Data Conferences', 'DBA Meetups', 'Tech Forums', 'Cloud Events', 'LinkedIn Data Groups'],
          books: ['SQL Performance Explained', 'Designing Data-Intensive Applications', 'Clean Code', 'Atomic Habits', 'The Pragmatic Programmer'],
        },
        tools: ['MySQL', 'PostgreSQL', 'Oracle', 'SQL Server', 'Data Tools'],
        guidance_tip: 'Your precision ensures reliable data systems.',
      },
      {
        career_role_name: 'Software Maintenance and Support Manager',
        short_description: 'Ensure smooth functioning, updates, and support for software systems.',
        overview: 'This role focuses on maintaining existing systems, fixing issues, and ensuring long-term stability of applications.',
        natural_strengths: 'Your dependable nature ensures continuous and stable system performance.',
        roadmap: {
          foundation: 'Study software maintenance, debugging, and system monitoring.',
          action_steps: 'Maintain systems, fix bugs, and improve performance.',
          advancement: 'Move into roles like Support Head or Operations Manager.',
          career_entry: 'Support Engineer, Maintenance Engineer.',
        },
        detailed: {
          mindset: ['Focus on stability', 'Maintain consistency', 'Solve issues patiently', 'Ensure reliability'],
          habits: ['Debug regularly', 'Monitor systems', 'Fix issues', 'Improve performance', 'Stay updated'],
          weekly: ['Maintenance (8-10 hrs/week)', 'Issue resolution (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Stable systems build long-term trust.',
          events: ['Tech Support Forums', 'IT Operations Events', 'Developer Meetups', 'System Admin Groups', 'LinkedIn Communities'],
          books: ['The Phoenix Project', 'Clean Code', 'The Pragmatic Programmer', 'Atomic Habits', 'Good to Great'],
        },
        tools: ['Monitoring Tools', 'Debugging Tools', 'CRM', 'Ticketing Systems', 'Google Workspace'],
        guidance_tip: 'Your reliability ensures continuous system performance.',
      },
      {
        career_role_name: 'Chief Operations Technology Officer (Future Path)',
        short_description: 'Lead technology operations, execution, and delivery at an organizational level.',
        overview: 'This role focuses on managing execution, operations, and technology delivery across large teams and systems.',
        natural_strengths: 'Your disciplined and execution-focused mindset makes you ideal for leading operations.',
        roadmap: {
          foundation: 'Study operations management, leadership, and IT systems.',
          action_steps: 'Gain experience across development, operations, and leadership.',
          advancement: 'Executive leadership roles.',
          career_entry: 'Tech Lead, Operations Manager.',
        },
        detailed: {
          mindset: ['Focus on execution excellence', 'Maintain discipline', 'Ensure efficiency', 'Think long-term'],
          habits: ['Improve systems', 'Manage teams', 'Monitor performance', 'Build leadership', 'Learn continuously'],
          weekly: ['Operations strategy (8-10 hrs/week)', 'Learning (3-4 hrs/week)', 'Networking (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong execution ensures business success.',
          events: ['Leadership Conferences', 'Tech Operations Events', 'Business Summits', 'DevOps Forums', 'LinkedIn Groups'],
          books: ['Good to Great', 'The Phoenix Project', 'The Lean Startup', 'The 7 Habits', 'Atomic Habits'],
        },
        tools: ['ERP Systems', 'Cloud Platforms', 'Analytics Tools', 'Project Tools', 'Google Workspace'],
        guidance_tip: 'Your execution excellence can drive large-scale success.',
      },
    ],
  },
  {
    traitCode: 'SI',
    roles: [
      {
        career_role_name: 'Customer Success Manager (SaaS / Tech Products)',
        short_description: 'Build strong customer relationships and ensure successful product adoption.',
        overview: 'Customer Success Managers work closely with clients to help them use software effectively, improve satisfaction, and increase retention.',
        natural_strengths: 'Your collaborative and positive nature helps you build trust and maintain long-term relationships.',
        roadmap: {
          foundation: 'Study product knowledge, CRM systems, and communication skills.',
          action_steps: 'Engage customers, resolve issues, and improve user experience.',
          advancement: 'Move into roles like Customer Success Head or CX Director.',
          career_entry: 'Customer Success Associate, Support Executive.',
        },
        detailed: {
          mindset: ['Focus on customer happiness', 'Build long-term relationships', 'Maintain positivity', 'Support users proactively'],
          habits: ['Communicate regularly', 'Track feedback', 'Improve customer experience', 'Build trust', 'Stay updated'],
          weekly: ['Customer engagement (8-10 hrs/week)', 'Feedback analysis (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong relationships drive customer retention.',
          events: ['Customer Success Conferences', 'SaaS Meetups', 'Tech Forums', 'Business Events', 'LinkedIn Communities'],
          books: ['Customer Success', 'The Experience Economy', 'The Lean Startup', 'Atomic Habits', 'Good to Great'],
        },
        tools: ['CRM Tools', 'Helpdesk Software', 'Analytics Tools', 'Excel', 'Google Workspace'],
        guidance_tip: 'Your collaboration builds long-term customer loyalty.',
      },
      {
        career_role_name: 'IT Project Coordinator / Agile Scrum Facilitator',
        short_description: 'Coordinate teams and ensure smooth execution of software projects.',
        overview: 'Scrum Facilitators help teams follow agile practices, manage workflows, and ensure timely delivery of software projects.',
        natural_strengths: 'Your team-oriented mindset helps maintain harmony and improve collaboration.',
        roadmap: {
          foundation: 'Study Agile, Scrum, and project coordination.',
          action_steps: 'Support teams, manage sprints, and track progress.',
          advancement: 'Move into roles like Scrum Master or Project Manager.',
          career_entry: 'Project Coordinator, Scrum Assistant.',
        },
        detailed: {
          mindset: ['Focus on teamwork', 'Maintain positive collaboration', 'Ensure smooth execution', 'Support team members'],
          habits: ['Track tasks', 'Facilitate meetings', 'Improve coordination', 'Communicate clearly', 'Stay organized'],
          weekly: ['Team coordination (8-10 hrs/week)', 'Meetings and tracking (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong coordination improves project success.',
          events: ['Agile Meetups', 'Scrum Workshops', 'Tech Forums', 'Project Management Events', 'LinkedIn Groups'],
          books: ['Scrum Guide', 'The Phoenix Project', 'The Lean Startup', 'Atomic Habits', 'Good to Great'],
        },
        tools: ['Jira', 'Trello', 'Asana', 'Slack', 'Google Workspace'],
        guidance_tip: 'Your collaboration ensures smooth project execution.',
      },
      {
        career_role_name: 'Technical Account Manager',
        short_description: 'Manage relationships between clients and technical teams.',
        overview: 'Technical Account Managers ensure clients get value from products while coordinating with internal teams for support and improvements.',
        natural_strengths: 'Your friendly and supportive nature helps maintain strong professional relationships.',
        roadmap: {
          foundation: 'Study product knowledge, communication, and account management.',
          action_steps: 'Manage accounts, coordinate support, and track performance.',
          advancement: 'Move into roles like Account Director or Customer Success Head.',
          career_entry: 'Account Executive, Support Analyst.',
        },
        detailed: {
          mindset: ['Focus on relationship building', 'Maintain trust', 'Support clients', 'Solve problems collaboratively'],
          habits: ['Communicate regularly', 'Track client needs', 'Improve service quality', 'Build trust', 'Stay updated'],
          weekly: ['Client management (8-10 hrs/week)', 'Coordination (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong relationships drive business growth.',
          events: ['Business Networking Events', 'SaaS Meetups', 'Tech Forums', 'Customer Success Events', 'LinkedIn Groups'],
          books: ['Never Split the Difference', 'The Experience Economy', 'Good to Great', 'Atomic Habits', 'The Lean Startup'],
        },
        tools: ['CRM', 'Helpdesk Tools', 'Analytics Tools', 'Excel', 'Google Workspace'],
        guidance_tip: 'Your relationships can drive long-term business success.',
      },
      {
        career_role_name: 'Community and Developer Relations Manager',
        short_description: 'Build and manage developer or user communities around products.',
        overview: 'Developer Relations Managers engage developers, conduct events, and build communities that support product growth.',
        natural_strengths: 'Your social and positive nature helps you build active and engaged communities.',
        roadmap: {
          foundation: 'Study community management, communication, and tech basics.',
          action_steps: 'Host events, create content, and engage users.',
          advancement: 'Move into roles like Community Head or DevRel Lead.',
          career_entry: 'Community Executive, Developer Advocate.',
        },
        detailed: {
          mindset: ['Focus on engagement', 'Build connections', 'Encourage participation', 'Stay positive'],
          habits: ['Engage users', 'Create content', 'Build relationships', 'Monitor engagement', 'Stay updated'],
          weekly: ['Community engagement (8-10 hrs/week)', 'Content creation (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong communities drive product adoption.',
          events: ['Developer Meetups', 'Tech Conferences', 'Hackathons', 'Community Events', 'LinkedIn Groups'],
          books: ['Contagious', 'The Culture Code', 'This is Marketing', 'Hooked', 'Building a StoryBrand'],
        },
        tools: ['Social Platforms', 'CRM', 'Content Tools', 'Analytics Tools', 'Google Workspace'],
        guidance_tip: 'Your energy can build thriving tech communities.',
      },
      {
        career_role_name: 'HR Tech and Employee Experience Specialist',
        short_description: 'Enhance employee engagement through technology systems.',
        overview: 'This role focuses on HR platforms, employee engagement tools, and improving workplace experience using technology.',
        natural_strengths: 'Your supportive nature helps improve employee satisfaction and collaboration.',
        roadmap: {
          foundation: 'Study HR systems, employee engagement, and analytics.',
          action_steps: 'Implement tools, analyze feedback, and improve processes.',
          advancement: 'Move into roles like HR Tech Lead or L&D Head.',
          career_entry: 'HR Tech Executive, Analyst.',
        },
        detailed: {
          mindset: ['Focus on people', 'Build positive environments', 'Support teams', 'Maintain consistency'],
          habits: ['Analyze feedback', 'Improve systems', 'Support employees', 'Learn tools', 'Stay updated'],
          weekly: ['System management (8-10 hrs/week)', 'Engagement activities (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Happy employees improve productivity.',
          events: ['HR Tech Conferences', 'Business Events', 'Learning Forums', 'Tech Meetups', 'LinkedIn Groups'],
          books: ['Drive', 'The Culture Code', 'Good to Great', 'Atomic Habits', 'The Lean Startup'],
        },
        tools: ['HR Systems', 'CRM', 'Analytics Tools', 'Excel', 'Google Workspace'],
        guidance_tip: 'Your support can improve workplace experience.',
      },
      {
        career_role_name: 'People-Centric Technology Leader (Future Path)',
        short_description: 'Lead teams with a focus on collaboration, growth, and technology delivery.',
        overview: 'This role focuses on managing teams, improving collaboration, and delivering successful technology solutions.',
        natural_strengths: 'Your collaborative leadership helps teams perform effectively.',
        roadmap: {
          foundation: 'Study leadership, communication, and team management.',
          action_steps: 'Gain experience in team leadership and mentoring.',
          advancement: 'Leadership roles like Engineering Manager or Delivery Head.',
          career_entry: 'Team Lead, Project Lead.',
        },
        detailed: {
          mindset: ['Focus on people growth', 'Lead collaboratively', 'Maintain positivity', 'Deliver results'],
          habits: ['Mentor teams', 'Improve communication', 'Build relationships', 'Manage teams', 'Learn continuously'],
          weekly: ['Team management (8-10 hrs/week)', 'Mentoring (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong team culture drives success.',
          events: ['Leadership Conferences', 'Tech Forums', 'HR Events', 'Business Meetups', 'LinkedIn Groups'],
          books: ['Leaders Eat Last', 'The 7 Habits', 'Good to Great', 'Drive', 'Atomic Habits'],
        },
        tools: ['Project Tools', 'CRM', 'Communication Tools', 'Analytics Tools', 'Google Workspace'],
        guidance_tip: 'Your collaboration can build strong and successful teams.',
      },
    ],
  },
  {
    traitCode: 'SC',
    roles: [
      {
        career_role_name: 'Software Quality Assurance (QA) Specialist',
        short_description: 'Ensure software reliability through structured testing and validation processes.',
        overview: 'QA Specialists are responsible for testing applications, identifying bugs, and ensuring software meets quality standards before release. They play a critical role in delivering error-free products.',
        natural_strengths: 'Your attention to detail and structured thinking ensure accuracy and consistency in software quality.',
        roadmap: {
          foundation: 'Study software testing, QA methodologies, and automation basics.',
          action_steps: 'Write test cases, perform manual and automated testing, and document defects.',
          advancement: 'Move into roles like QA Manager or Quality Director.',
          career_entry: 'QA Tester, Test Engineer.',
        },
        detailed: {
          mindset: ['Focus on accuracy', 'Maintain consistency', 'Ensure quality standards', 'Prevent errors proactively'],
          habits: ['Write test cases regularly', 'Analyze defects', 'Improve testing processes', 'Learn automation tools', 'Stay updated'],
          weekly: ['Testing activities (8-10 hrs/week)', 'Automation learning (3-4 hrs/week)', 'Practice (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong testing ensures reliable software delivery.',
          events: ['QA Conferences', 'Testing Meetups', 'Automation Events', 'Tech Forums', 'LinkedIn QA Groups'],
          books: ['Agile Testing', 'Clean Code', 'The Pragmatic Programmer', 'Atomic Habits', 'The Phoenix Project'],
        },
        tools: ['Selenium', 'Postman', 'Jira', 'TestRail', 'Automation Tools'],
        guidance_tip: 'Your precision ensures high-quality and reliable systems.',
      },
      {
        career_role_name: 'Database and Data Integrity Specialist',
        short_description: 'Manage databases and ensure accurate, secure, and consistent data systems.',
        overview: 'Database Specialists maintain structured data, optimize queries, and ensure data integrity across systems, which is critical for business operations.',
        natural_strengths: 'Your disciplined and detail-oriented nature ensures high data accuracy and reliability.',
        roadmap: {
          foundation: 'Study databases, SQL, and data structures.',
          action_steps: 'Manage databases, optimize performance, and ensure data security.',
          advancement: 'Move into roles like Data Architect or Database Manager.',
          career_entry: 'Database Analyst, SQL Developer.',
        },
        detailed: {
          mindset: ['Focus on data accuracy', 'Maintain consistency', 'Ensure system reliability', 'Think systematically'],
          habits: ['Practice SQL', 'Monitor databases', 'Optimize queries', 'Maintain backups', 'Stay updated'],
          weekly: ['Database management (8-10 hrs/week)', 'Optimization (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong data systems support business continuity.',
          events: ['Data Conferences', 'DBA Meetups', 'Cloud Events', 'Tech Forums', 'LinkedIn Data Groups'],
          books: ['SQL Performance Explained', 'Designing Data-Intensive Applications', 'Clean Code', 'Atomic Habits', 'The Pragmatic Programmer'],
        },
        tools: ['MySQL', 'PostgreSQL', 'Oracle', 'SQL Server', 'Data Tools'],
        guidance_tip: 'Your accuracy ensures strong and reliable data systems.',
      },
      {
        career_role_name: 'Technical Documentation and Process Specialist',
        short_description: 'Create and maintain technical documentation and standardized processes.',
        overview: 'This role involves documenting software systems, APIs, user manuals, and internal processes to ensure clarity and consistency across teams.',
        natural_strengths: 'Your structured approach ensures clarity, accuracy, and consistency in documentation.',
        roadmap: {
          foundation: 'Study technical writing, system documentation, and software workflows.',
          action_steps: 'Create manuals, document APIs, and maintain knowledge bases.',
          advancement: 'Move into roles like Documentation Lead or Process Manager.',
          career_entry: 'Technical Writer, Documentation Analyst.',
        },
        detailed: {
          mindset: ['Focus on clarity', 'Maintain structure', 'Ensure accuracy', 'Support teams'],
          habits: ['Write documentation', 'Review processes', 'Improve clarity', 'Maintain records', 'Stay updated'],
          weekly: ['Documentation (8-10 hrs/week)', 'Review (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Clear documentation improves team efficiency.',
          events: ['Technical Writing Communities', 'Documentation Conferences', 'Tech Forums', 'Developer Meetups', 'LinkedIn Groups'],
          books: ['The Pyramid Principle', 'Clean Code', 'The Pragmatic Programmer', 'Atomic Habits', 'The Phoenix Project'],
        },
        tools: ['Confluence', 'Notion', 'Markdown Tools', 'Google Docs', 'Diagram Tools'],
        guidance_tip: 'Your clarity helps teams work efficiently and consistently.',
      },
      {
        career_role_name: 'IT Compliance and Security Process Analyst',
        short_description: 'Ensure IT systems follow security standards and compliance frameworks.',
        overview: 'Compliance Analysts monitor IT systems, ensure adherence to policies, and maintain data security standards like ISO, GDPR, and internal controls.',
        natural_strengths: 'Your careful and structured thinking helps prevent risks and ensure compliance.',
        roadmap: {
          foundation: 'Study cybersecurity basics, compliance frameworks, and risk management.',
          action_steps: 'Audit systems, monitor compliance, and enforce standards.',
          advancement: 'Move into roles like Compliance Head or Security Manager.',
          career_entry: 'Compliance Analyst, Security Analyst.',
        },
        detailed: {
          mindset: ['Focus on security', 'Maintain discipline', 'Ensure compliance', 'Prevent risks'],
          habits: ['Audit systems', 'Monitor risks', 'Maintain documentation', 'Improve processes', 'Stay updated'],
          weekly: ['Compliance checks (8-10 hrs/week)', 'Risk monitoring (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong compliance ensures secure systems.',
          events: ['Cybersecurity Conferences', 'Compliance Forums', 'IT Governance Events', 'Tech Meetups', 'LinkedIn Groups'],
          books: ['Cybersecurity Essentials', 'The Checklist Manifesto', 'Clean Code', 'Atomic Habits', 'The Phoenix Project'],
        },
        tools: ['Security Tools', 'Audit Tools', 'Monitoring Systems', 'Excel', 'Google Workspace'],
        guidance_tip: 'Your discipline ensures secure and compliant IT environments.',
      },
      {
        career_role_name: 'Software Maintenance and Stability Engineer',
        short_description: 'Maintain and improve existing software systems for long-term reliability.',
        overview: 'This role focuses on fixing bugs, improving performance, and ensuring software runs smoothly over time.',
        natural_strengths: 'Your dependable nature ensures system stability and long-term performance.',
        roadmap: {
          foundation: 'Study debugging, system monitoring, and software maintenance.',
          action_steps: 'Maintain systems, fix bugs, and improve performance.',
          advancement: 'Move into roles like Operations Manager or Support Head.',
          career_entry: 'Support Engineer, Maintenance Engineer.',
        },
        detailed: {
          mindset: ['Focus on stability', 'Maintain consistency', 'Solve issues patiently', 'Ensure reliability'],
          habits: ['Debug systems', 'Monitor performance', 'Fix issues', 'Improve systems', 'Stay updated'],
          weekly: ['Maintenance (8-10 hrs/week)', 'Debugging (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Stability builds long-term trust in systems.',
          events: ['IT Operations Events', 'Developer Communities', 'Tech Forums', 'Support Groups', 'LinkedIn Communities'],
          books: ['The Phoenix Project', 'Clean Code', 'The Pragmatic Programmer', 'Atomic Habits', 'Good to Great'],
        },
        tools: ['Monitoring Tools', 'Debugging Tools', 'CRM', 'Ticketing Systems', 'Google Workspace'],
        guidance_tip: 'Your consistency ensures smooth and reliable system performance.',
      },
      {
        career_role_name: 'Chief Quality and Systems Assurance Officer (Future Path)',
        short_description: 'Lead quality, compliance, and system reliability at an organizational level.',
        overview: 'This role ensures all systems, processes, and technologies meet high standards of quality, security, and performance.',
        natural_strengths: 'Your structured and disciplined approach makes you ideal for ensuring system excellence.',
        roadmap: {
          foundation: 'Study quality management, compliance, and leadership.',
          action_steps: 'Gain experience across QA, compliance, and operations.',
          advancement: 'Executive leadership roles.',
          career_entry: 'QA Lead, Compliance Manager.',
        },
        detailed: {
          mindset: ['Focus on quality and standards', 'Maintain discipline', 'Ensure system stability', 'Think long-term'],
          habits: ['Improve processes', 'Monitor systems', 'Build leadership', 'Maintain documentation', 'Learn continuously'],
          weekly: ['Quality strategy (8-10 hrs/week)', 'Learning (3-4 hrs/week)', 'Networking (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong quality systems ensure business success.',
          events: ['Quality Management Conferences', 'IT Governance Forums', 'Business Summits', 'Tech Events', 'LinkedIn Groups'],
          books: ['The Checklist Manifesto', 'Good to Great', 'The Lean Startup', 'The 7 Habits', 'Atomic Habits'],
        },
        tools: ['Quality Tools', 'Compliance Systems', 'Analytics Tools', 'ERP', 'Google Workspace'],
        guidance_tip: 'Your structured leadership ensures long-term system excellence.',
      },
    ],
  },
  {
    traitCode: 'CD',
    roles: [
      {
        career_role_name: 'Data Science and Analytics Lead',
        short_description: 'Lead data-driven decision-making using advanced analytics and machine learning.',
        overview: 'Data Science Leads analyze large datasets, build predictive models, and guide organizations in making strategic decisions using data insights across domains like finance, healthcare, and technology.',
        natural_strengths: 'Your analytical thinking and leadership ability help you solve complex problems and guide data-driven strategies.',
        roadmap: {
          foundation: 'Study statistics, machine learning, and data analysis.',
          action_steps: 'Build models, work on datasets, and develop real-world projects.',
          advancement: 'Move into roles like Head of Analytics or Chief Data Officer.',
          career_entry: 'Data Analyst, Data Scientist.',
        },
        detailed: {
          mindset: ['Think analytically and logically', 'Focus on problem-solving', 'Use data for decision-making', 'Lead with clarity'],
          habits: ['Practice data analysis', 'Build machine learning models', 'Learn new tools', 'Analyze trends', 'Stay updated'],
          weekly: ['Data analysis (8-10 hrs/week)', 'Model building (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong analytical skills drive impactful insights.',
          events: ['Data Science Conferences', 'Analytics Meetups', 'Tech Forums', 'AI Communities', 'LinkedIn Data Groups'],
          books: ['Hands-On Machine Learning', 'Data Science for Business', 'Pattern Recognition', 'Deep Learning', 'The Pragmatic Programmer'],
        },
        tools: ['Python', 'R', 'SQL', 'Power BI', 'TensorFlow'],
        guidance_tip: 'Your analytical leadership can transform data into strategic advantage.',
      },
      {
        career_role_name: 'Software Architecture and Engineering Manager',
        short_description: 'Design system architecture and lead engineering teams to build scalable software.',
        overview: 'Engineering Managers oversee development teams, define architecture, and ensure software systems are efficient, scalable, and maintainable.',
        natural_strengths: 'Your logical thinking and leadership help you design strong systems and guide teams effectively.',
        roadmap: {
          foundation: 'Study system design, software engineering, and cloud computing.',
          action_steps: 'Build scalable systems, manage teams, and improve architecture.',
          advancement: 'Move into roles like Engineering Director or CTO.',
          career_entry: 'Software Engineer, Senior Developer.',
        },
        detailed: {
          mindset: ['Think at system level', 'Focus on scalability', 'Solve complex problems', 'Lead technical decisions'],
          habits: ['Study system designs', 'Review code', 'Improve architecture', 'Learn new technologies', 'Stay updated'],
          weekly: ['System design (8-10 hrs/week)', 'Team management (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong architecture defines long-term success.',
          events: ['Tech Conferences', 'Cloud Events', 'Developer Meetups', 'Architecture Forums', 'LinkedIn Tech Groups'],
          books: ['Designing Data-Intensive Applications', 'Clean Architecture', 'The Pragmatic Programmer', 'Domain-Driven Design', 'The Phoenix Project'],
        },
        tools: ['AWS', 'Azure', 'Docker', 'Kubernetes', 'GitHub'],
        guidance_tip: 'Your leadership can build scalable and efficient systems.',
      },
      {
        career_role_name: 'AI and Automation Strategy Manager',
        short_description: 'Drive AI and automation initiatives to improve business efficiency.',
        overview: 'AI Strategy Managers design automation systems, implement machine learning solutions, and optimize processes across industries.',
        natural_strengths: 'Your analytical mindset helps you design intelligent and efficient solutions.',
        roadmap: {
          foundation: 'Study AI, automation, and data science.',
          action_steps: 'Build AI models, automate workflows, and implement solutions.',
          advancement: 'Move into roles like AI Head or Chief AI Officer.',
          career_entry: 'ML Engineer, Data Scientist.',
        },
        detailed: {
          mindset: ['Think logically', 'Focus on efficiency', 'Innovate with technology', 'Solve complex problems'],
          habits: ['Build models', 'Learn AI tools', 'Analyze data', 'Improve systems', 'Stay updated'],
          weekly: ['Model building (8-10 hrs/week)', 'Data analysis (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Automation increases efficiency and scalability.',
          events: ['AI Conferences', 'Automation Meetups', 'Tech Forums', 'Data Communities', 'LinkedIn Groups'],
          books: ['AI Superpowers', 'Deep Learning', 'Hands-On Machine Learning', 'The Lean Startup', 'The Pragmatic Programmer'],
        },
        tools: ['Python', 'TensorFlow', 'Automation Tools', 'Cloud Platforms', 'Analytics Tools'],
        guidance_tip: 'Your analytical thinking can drive intelligent automation.',
      },
      {
        career_role_name: 'Cybersecurity and Risk Strategy Leader',
        short_description: 'Lead cybersecurity strategies and protect systems from threats.',
        overview: 'Cybersecurity Leaders design security frameworks, monitor threats, and ensure data protection across systems.',
        natural_strengths: 'Your critical thinking helps identify risks and design secure systems.',
        roadmap: {
          foundation: 'Study cybersecurity, networking, and risk management.',
          action_steps: 'Analyze threats, implement security protocols, and monitor systems.',
          advancement: 'Move into roles like CISO.',
          career_entry: 'Security Analyst, Network Security Engineer.',
        },
        detailed: {
          mindset: ['Think critically', 'Focus on security', 'Analyze risks', 'Stay proactive'],
          habits: ['Monitor threats', 'Learn security tools', 'Practice ethical hacking', 'Improve systems', 'Stay updated'],
          weekly: ['Security analysis (8-10 hrs/week)', 'Tool learning (3-4 hrs/week)', 'Practice (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Prevention is key in cybersecurity.',
          events: ['Cybersecurity Conferences', 'Ethical Hacking Meetups', 'Tech Forums', 'Security Communities', 'LinkedIn Groups'],
          books: ['The Web Application Hacker\'s Handbook', 'Cybersecurity Essentials', 'Hacking: The Art of Exploitation', 'Clean Code', 'The Phoenix Project'],
        },
        tools: ['Kali Linux', 'Wireshark', 'Metasploit', 'Firewalls', 'Security Tools'],
        guidance_tip: 'Your analytical mindset can safeguard critical systems.',
      },
      {
        career_role_name: 'IT Strategy and Digital Transformation Leader',
        short_description: 'Lead digital transformation initiatives using technology solutions.',
        overview: 'IT Strategy Leaders guide organizations in adopting new technologies and improving business processes through digital solutions.',
        natural_strengths: 'Your logical thinking helps you align technology with business goals.',
        roadmap: {
          foundation: 'Study IT strategy, business processes, and consulting frameworks.',
          action_steps: 'Analyze systems, design strategies, and implement solutions.',
          advancement: 'Move into roles like CIO or Strategy Director.',
          career_entry: 'IT Analyst, Consultant.',
        },
        detailed: {
          mindset: ['Think strategically', 'Focus on efficiency', 'Solve business problems', 'Make informed decisions'],
          habits: ['Analyze systems', 'Study business cases', 'Improve strategies', 'Communicate clearly', 'Stay updated'],
          weekly: ['Strategy development (8-10 hrs/week)', 'Analysis (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Technology strategy drives growth.',
          events: ['Consulting Conferences', 'Business Forums', 'Tech Events', 'Strategy Meetups', 'LinkedIn Groups'],
          books: ['The McKinsey Way', 'Good Strategy Bad Strategy', 'Blue Ocean Strategy', 'The Lean Startup', 'The 7 Habits'],
        },
        tools: ['Power BI', 'Excel', 'Consulting Tools', 'Presentation Tools', 'Google Workspace'],
        guidance_tip: 'Your decisions can drive large-scale transformation.',
      },
      {
        career_role_name: 'Chief Technology and Strategy Officer (Future Path)',
        short_description: 'Lead overall technology strategy, innovation, and execution at an executive level.',
        overview: 'This role combines leadership, strategy, and technology expertise to guide organizations toward long-term success.',
        natural_strengths: 'Your analytical leadership helps align business and technology effectively.',
        roadmap: {
          foundation: 'Study advanced technologies, leadership, and strategy.',
          action_steps: 'Gain experience across engineering, strategy, and leadership roles.',
          advancement: 'Executive leadership positions.',
          career_entry: 'Tech Lead, Strategy Manager.',
        },
        detailed: {
          mindset: ['Think strategically', 'Focus on innovation', 'Make data-driven decisions', 'Lead confidently'],
          habits: ['Learn emerging tech', 'Build leadership skills', 'Analyze systems', 'Network actively', 'Learn continuously'],
          weekly: ['Strategy (8-10 hrs/week)', 'Learning (3-4 hrs/week)', 'Networking (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong leadership defines executive success.',
          events: ['Leadership Conferences', 'Tech Summits', 'Innovation Forums', 'Business Events', 'LinkedIn Executive Groups'],
          books: ['Good to Great', 'Clean Architecture', 'The Lean Startup', 'The 7 Habits', 'The Pragmatic Programmer'],
        },
        tools: ['Cloud Platforms', 'Analytics Tools', 'DevOps Tools', 'CRM', 'Google Workspace'],
        guidance_tip: 'Your analytical leadership can shape the future of technology.',
      },
    ],
  },
  {
    traitCode: 'CI',
    roles: [
      {
        career_role_name: 'Data Scientist and AI Problem Solver',
        short_description: 'Analyze data and build intelligent models to solve real-world problems.',
        overview: 'Data Scientists work with large datasets, apply machine learning algorithms, and build predictive systems used in industries like finance, healthcare, and technology.',
        natural_strengths: 'Your logical thinking combined with curiosity helps you solve complex problems innovatively.',
        roadmap: {
          foundation: 'Study statistics, Python, and machine learning.',
          action_steps: 'Work on datasets, build models, and participate in competitions like Kaggle.',
          advancement: 'Move into roles like AI Specialist or Data Science Lead.',
          career_entry: 'Data Analyst, Junior Data Scientist.',
        },
        detailed: {
          mindset: ['Think logically and analytically', 'Stay curious about data', 'Focus on problem-solving', 'Innovate with insights'],
          habits: ['Practice coding', 'Work on datasets', 'Learn algorithms', 'Build models', 'Stay updated'],
          weekly: ['Data analysis (8-10 hrs/week)', 'Model building (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong fundamentals in math and logic are key to success.',
          events: ['Data Science Conferences', 'AI Meetups', 'Hackathons', 'Kaggle Communities', 'LinkedIn Data Groups'],
          books: ['Hands-On Machine Learning', 'Data Science for Business', 'Deep Learning', 'Pattern Recognition', 'The Pragmatic Programmer'],
        },
        tools: ['Python', 'TensorFlow', 'Jupyter Notebook', 'SQL', 'Power BI'],
        guidance_tip: 'Your logic can turn data into intelligent solutions.',
      },
      {
        career_role_name: 'Software Engineer (Backend / System Logic Specialist)',
        short_description: 'Build robust backend systems and business logic for applications.',
        overview: 'Backend Engineers develop APIs, databases, and core application logic that powers software systems.',
        natural_strengths: 'Your logical thinking helps you design efficient and optimized systems.',
        roadmap: {
          foundation: 'Study programming, data structures, and backend frameworks.',
          action_steps: 'Build APIs, work on projects, and contribute to open source.',
          advancement: 'Move into roles like Tech Lead or System Architect.',
          career_entry: 'Software Developer, Backend Developer.',
        },
        detailed: {
          mindset: ['Think logically', 'Focus on efficiency', 'Solve problems systematically', 'Build scalable systems'],
          habits: ['Code regularly', 'Practice problem-solving', 'Optimize systems', 'Learn frameworks', 'Stay updated'],
          weekly: ['Coding (8-10 hrs/week)', 'System design (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong backend logic powers reliable applications.',
          events: ['Developer Meetups', 'Hackathons', 'Open Source Communities', 'Tech Conferences', 'GitHub Communities'],
          books: ['Clean Code', 'The Pragmatic Programmer', 'Designing Data-Intensive Applications', 'System Design Interview', 'Atomic Habits'],
        },
        tools: ['Java / Python / Node.js', 'GitHub', 'Docker', 'Postman', 'AWS'],
        guidance_tip: 'Your logical strength builds strong application foundations.',
      },
      {
        career_role_name: 'Research and Development Engineer (Emerging Technologies)',
        short_description: 'Work on innovative technologies like AI, blockchain, and advanced computing.',
        overview: 'R&D Engineers explore new technologies, build prototypes, and contribute to innovation in research labs or tech companies.',
        natural_strengths: 'Your curiosity and logic help you explore and innovate new solutions.',
        roadmap: {
          foundation: 'Study advanced computing, AI, and research methodologies.',
          action_steps: 'Work on research projects, publish papers, and build prototypes.',
          advancement: 'Move into roles like Research Scientist or Innovation Lead.',
          career_entry: 'Research Assistant, Developer.',
        },
        detailed: {
          mindset: ['Stay curious', 'Think innovatively', 'Focus on problem-solving', 'Explore new ideas'],
          habits: ['Read research papers', 'Build prototypes', 'Experiment ideas', 'Learn new technologies', 'Stay updated'],
          weekly: ['Research (8-10 hrs/week)', 'Experimentation (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Innovation comes from continuous learning.',
          events: ['Research Conferences', 'AI Meetups', 'Innovation Labs', 'Hackathons', 'LinkedIn Groups'],
          books: ['AI Superpowers', 'Deep Learning', 'The Innovator\'s Dilemma', 'Zero to One', 'The Pragmatic Programmer'],
        },
        tools: ['Python', 'AI Tools', 'Cloud Platforms', 'Simulation Tools', 'Analytics Tools'],
        guidance_tip: 'Your curiosity can drive technological innovation.',
      },
      {
        career_role_name: 'Cybersecurity Analyst and Ethical Hacker',
        short_description: 'Protect systems by identifying vulnerabilities and preventing cyber threats.',
        overview: 'Cybersecurity Analysts monitor systems, detect threats, and secure applications using ethical hacking techniques.',
        natural_strengths: 'Your logical thinking helps identify vulnerabilities and secure systems effectively.',
        roadmap: {
          foundation: 'Study networking, cybersecurity, and ethical hacking.',
          action_steps: 'Practice penetration testing, learn tools, and analyze threats.',
          advancement: 'Move into roles like Security Architect or CISO.',
          career_entry: 'Security Analyst, Ethical Hacker.',
        },
        detailed: {
          mindset: ['Think critically', 'Focus on security', 'Analyze risks', 'Stay alert'],
          habits: ['Practice ethical hacking', 'Learn tools', 'Monitor threats', 'Analyze systems', 'Stay updated'],
          weekly: ['Security analysis (8-10 hrs/week)', 'Tool learning (3-4 hrs/week)', 'Practice (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Security requires continuous vigilance.',
          events: ['Cybersecurity Conferences', 'Ethical Hacking Meetups', 'Tech Forums', 'Security Communities', 'LinkedIn Groups'],
          books: ['The Web Application Hacker\'s Handbook', 'Cybersecurity Essentials', 'Hacking: The Art of Exploitation', 'Clean Code', 'The Phoenix Project'],
        },
        tools: ['Kali Linux', 'Wireshark', 'Metasploit', 'Burp Suite', 'Security Tools'],
        guidance_tip: 'Your analytical skills can protect critical systems.',
      },
      {
        career_role_name: 'Automation and Process Optimization Engineer',
        short_description: 'Automate business and technical processes to improve efficiency.',
        overview: 'Automation Engineers design scripts, workflows, and systems that reduce manual work and improve operational efficiency.',
        natural_strengths: 'Your logical and systematic thinking helps optimize processes effectively.',
        roadmap: {
          foundation: 'Study scripting, automation tools, and system workflows.',
          action_steps: 'Build automation scripts, optimize systems, and improve processes.',
          advancement: 'Move into roles like Automation Lead or DevOps Architect.',
          career_entry: 'Automation Engineer, DevOps Engineer.',
        },
        detailed: {
          mindset: ['Think systematically', 'Focus on efficiency', 'Solve problems logically', 'Optimize processes'],
          habits: ['Write scripts', 'Automate tasks', 'Improve workflows', 'Learn tools', 'Stay updated'],
          weekly: ['Automation (8-10 hrs/week)', 'Learning tools (3-4 hrs/week)', 'Practice (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Automation saves time and improves productivity.',
          events: ['DevOps Conferences', 'Automation Meetups', 'Tech Forums', 'Cloud Events', 'LinkedIn Groups'],
          books: ['The DevOps Handbook', 'Clean Code', 'The Pragmatic Programmer', 'Atomic Habits', 'The Phoenix Project'],
        },
        tools: ['Python', 'Shell Scripting', 'Docker', 'Jenkins', 'AWS'],
        guidance_tip: 'Your logic can streamline complex systems.',
      },
      {
        career_role_name: 'Chief Innovation and Systems Architect (Future Path)',
        short_description: 'Lead system design, innovation, and technology strategy at an executive level.',
        overview: 'This role focuses on designing advanced systems, driving innovation, and aligning technology with long-term business goals.',
        natural_strengths: 'Your logical innovation helps you design future-ready solutions.',
        roadmap: {
          foundation: 'Study advanced systems, leadership, and innovation strategy.',
          action_steps: 'Gain experience across development, architecture, and leadership.',
          advancement: 'Executive leadership roles.',
          career_entry: 'Software Engineer, Architect.',
        },
        detailed: {
          mindset: ['Think logically and strategically', 'Focus on innovation', 'Solve complex problems', 'Lead confidently'],
          habits: ['Learn emerging tech', 'Build leadership skills', 'Analyze systems', 'Network actively', 'Learn continuously'],
          weekly: ['Strategy (8-10 hrs/week)', 'Learning (3-4 hrs/week)', 'Networking (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Innovation and logic together define leadership success.',
          events: ['Tech Leadership Conferences', 'Innovation Forums', 'AI Events', 'Business Summits', 'LinkedIn Groups'],
          books: ['Clean Architecture', 'Good to Great', 'The Lean Startup', 'The 7 Habits', 'The Pragmatic Programmer'],
        },
        tools: ['Cloud Platforms', 'AI Tools', 'DevOps Tools', 'Analytics Tools', 'Google Workspace'],
        guidance_tip: 'Your logical innovation can shape future technologies.',
      },
    ],
  },
  {
    traitCode: 'CS',
    roles: [
      {
        career_role_name: 'IT Systems and Process Administrator',
        short_description: 'Manage and maintain structured IT systems, workflows, and organizational processes.',
        overview: 'IT Systems Administrators ensure that software systems, internal tools, and workflows operate smoothly and consistently. They manage configurations, monitor performance, and maintain system stability.',
        natural_strengths: 'Your structured and dependable nature helps maintain organized systems and consistent operations.',
        roadmap: {
          foundation: 'Study system administration, networking, and IT processes.',
          action_steps: 'Manage systems, monitor performance, and maintain configurations.',
          advancement: 'Move into roles like IT Operations Manager or Infrastructure Head.',
          career_entry: 'System Administrator, IT Support Engineer.',
        },
        detailed: {
          mindset: ['Focus on structure and discipline', 'Maintain consistency', 'Ensure system stability', 'Follow processes carefully'],
          habits: ['Monitor systems regularly', 'Maintain documentation', 'Follow standard procedures', 'Improve processes', 'Stay updated'],
          weekly: ['System management (8-10 hrs/week)', 'Monitoring and support (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong systems ensure smooth business operations.',
          events: ['IT Infrastructure Conferences', 'System Admin Meetups', 'Tech Forums', 'Cloud Events', 'LinkedIn IT Groups'],
          books: ['The Phoenix Project', 'ITIL Foundation Guide', 'Clean Code', 'Atomic Habits', 'The Pragmatic Programmer'],
        },
        tools: ['Linux', 'Windows Server', 'Monitoring Tools', 'AWS', 'Google Workspace'],
        guidance_tip: 'Your structured approach ensures reliable IT operations.',
      },
      {
        career_role_name: 'QA Process and Documentation Specialist',
        short_description: 'Ensure quality standards through structured testing and documentation.',
        overview: 'This role focuses on maintaining quality processes, documenting test cases, and ensuring all software follows defined standards and procedures.',
        natural_strengths: 'Your attention to detail and structured thinking ensure high-quality and consistent outputs.',
        roadmap: {
          foundation: 'Study QA methodologies, testing processes, and documentation standards.',
          action_steps: 'Write test cases, maintain QA documentation, and support testing teams.',
          advancement: 'Move into roles like QA Manager or Quality Head.',
          career_entry: 'QA Analyst, Documentation Specialist.',
        },
        detailed: {
          mindset: ['Focus on quality and standards', 'Maintain discipline', 'Ensure accuracy', 'Follow structured processes'],
          habits: ['Document processes', 'Write test cases', 'Review systems', 'Improve workflows', 'Stay updated'],
          weekly: ['QA documentation (8-10 hrs/week)', 'Testing support (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Structured quality processes prevent errors.',
          events: ['QA Conferences', 'Testing Meetups', 'Documentation Communities', 'Tech Forums', 'LinkedIn QA Groups'],
          books: ['Agile Testing', 'The Checklist Manifesto', 'Clean Code', 'Atomic Habits', 'The Phoenix Project'],
        },
        tools: ['Jira', 'TestRail', 'Confluence', 'Excel', 'Google Workspace'],
        guidance_tip: 'Your discipline ensures consistent quality delivery.',
      },
      {
        career_role_name: 'Database Operations and Reporting Specialist',
        short_description: 'Manage structured data systems and generate accurate reports.',
        overview: 'This role involves maintaining databases, generating reports, and ensuring data integrity across systems.',
        natural_strengths: 'Your systematic approach ensures accuracy and reliability in data handling.',
        roadmap: {
          foundation: 'Study databases, SQL, and reporting tools.',
          action_steps: 'Manage data, generate reports, and maintain consistency.',
          advancement: 'Move into roles like Data Manager or BI Analyst.',
          career_entry: 'Database Analyst, Reporting Analyst.',
        },
        detailed: {
          mindset: ['Focus on accuracy', 'Maintain structure', 'Ensure data consistency', 'Think systematically'],
          habits: ['Practice SQL', 'Build reports', 'Monitor data', 'Improve accuracy', 'Stay updated'],
          weekly: ['Data management (8-10 hrs/week)', 'Reporting (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Accurate data drives correct decisions.',
          events: ['Data Conferences', 'BI Meetups', 'Tech Forums', 'Analytics Communities', 'LinkedIn Groups'],
          books: ['Data Science for Business', 'Storytelling with Data', 'SQL Performance Explained', 'Atomic Habits', 'The Pragmatic Programmer'],
        },
        tools: ['MySQL', 'SQL Server', 'Power BI', 'Excel', 'Tableau'],
        guidance_tip: 'Your structured thinking ensures reliable data systems.',
      },
      {
        career_role_name: 'IT Compliance and Governance Specialist',
        short_description: 'Ensure IT systems follow organizational policies and regulatory standards.',
        overview: 'IT Compliance Specialists manage audits, enforce policies, and ensure systems meet standards like ISO, GDPR, and internal governance frameworks.',
        natural_strengths: 'Your disciplined nature helps maintain strict compliance and avoid risks.',
        roadmap: {
          foundation: 'Study IT governance, compliance frameworks, and cybersecurity basics.',
          action_steps: 'Conduct audits, monitor systems, and enforce policies.',
          advancement: 'Move into roles like Compliance Head or Risk Manager.',
          career_entry: 'Compliance Analyst, IT Auditor.',
        },
        detailed: {
          mindset: ['Focus on discipline', 'Ensure compliance', 'Maintain accuracy', 'Prevent risks'],
          habits: ['Audit systems', 'Maintain records', 'Monitor compliance', 'Improve processes', 'Stay updated'],
          weekly: ['Compliance checks (8-10 hrs/week)', 'Documentation (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong compliance protects organizations.',
          events: ['IT Governance Conferences', 'Cybersecurity Events', 'Compliance Forums', 'Tech Meetups', 'LinkedIn Groups'],
          books: ['The Checklist Manifesto', 'Cybersecurity Essentials', 'Clean Code', 'Atomic Habits', 'The Phoenix Project'],
        },
        tools: ['Audit Tools', 'Security Tools', 'Monitoring Systems', 'Excel', 'Google Workspace'],
        guidance_tip: 'Your discipline ensures secure and compliant systems.',
      },
      {
        career_role_name: 'Software Support and Service Delivery Specialist',
        short_description: 'Provide structured support and ensure smooth operation of software systems.',
        overview: 'Support Specialists handle issue resolution, user support, and system monitoring to ensure smooth service delivery.',
        natural_strengths: 'Your patience and structured approach help maintain consistent support quality.',
        roadmap: {
          foundation: 'Study software systems, support processes, and troubleshooting.',
          action_steps: 'Resolve issues, track tickets, and improve service processes.',
          advancement: 'Move into roles like Support Manager or Service Delivery Head.',
          career_entry: 'Support Engineer, Service Analyst.',
        },
        detailed: {
          mindset: ['Focus on service quality', 'Maintain consistency', 'Solve issues patiently', 'Support users effectively'],
          habits: ['Track issues', 'Resolve problems', 'Improve processes', 'Communicate clearly', 'Stay updated'],
          weekly: ['Support activities (8-10 hrs/week)', 'Issue tracking (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Reliable support builds trust and retention.',
          events: ['IT Support Forums', 'Service Delivery Events', 'Tech Communities', 'Business Meetups', 'LinkedIn Groups'],
          books: ['The Phoenix Project', 'ITIL Guide', 'Atomic Habits', 'Good to Great', 'The Pragmatic Programmer'],
        },
        tools: ['Ticketing Systems', 'CRM', 'Monitoring Tools', 'Excel', 'Google Workspace'],
        guidance_tip: 'Your consistency ensures smooth service delivery.',
      },
      {
        career_role_name: 'Chief Systems and Process Officer (Future Path)',
        short_description: 'Lead system processes, governance, and operational efficiency at an executive level.',
        overview: 'This role focuses on building structured systems, ensuring process excellence, and managing large-scale IT operations across the organization.',
        natural_strengths: 'Your structured and disciplined mindset makes you ideal for leading system-driven organizations.',
        roadmap: {
          foundation: 'Study operations, governance, and leadership.',
          action_steps: 'Gain experience across IT systems, compliance, and operations roles.',
          advancement: 'Executive leadership roles.',
          career_entry: 'Operations Manager, IT Manager.',
        },
        detailed: {
          mindset: ['Focus on structure and systems', 'Maintain discipline', 'Ensure efficiency', 'Think long-term'],
          habits: ['Improve processes', 'Monitor systems', 'Build leadership skills', 'Maintain documentation', 'Learn continuously'],
          weekly: ['Strategy and operations (8-10 hrs/week)', 'Learning (3-4 hrs/week)', 'Networking (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong systems ensure scalable success.',
          events: ['Leadership Conferences', 'IT Governance Forums', 'Business Summits', 'Tech Events', 'LinkedIn Executive Groups'],
          books: ['Good to Great', 'The Checklist Manifesto', 'The Lean Startup', 'The 7 Habits', 'Atomic Habits'],
        },
        tools: ['ERP Systems', 'Analytics Tools', 'Cloud Platforms', 'Process Tools', 'Google Workspace'],
        guidance_tip: 'Your structured leadership can build efficient and scalable systems.',
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

    console.log('SUCCESS: Loaded MCA (dept 23) SD/SI/SC/CD/CI/CS with structured guidance JSON.');
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
