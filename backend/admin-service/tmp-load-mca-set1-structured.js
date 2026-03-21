require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const DEGREE_ID = 23; // MCA
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
    traitCode: 'DI',
    roles: [
      {
        career_role_name: 'Software Product Manager',
        short_description: 'Lead the development and delivery of software products by coordinating tech and business teams.',
        overview: 'Software Product Managers define product vision, manage development teams, and ensure software solutions meet business and user needs. They work with developers, designers, and stakeholders to deliver scalable applications.',
        natural_strengths: 'Your leadership, confidence, and decision-making help you drive product success and align teams effectively.',
        roadmap: {
          foundation: 'Study software development basics, product management, and system design.',
          action_steps: 'Work on product case studies, collaborate with developers, and learn agile methodologies.',
          advancement: 'Move into roles like Product Director or Chief Product Officer.',
          career_entry: 'Product Analyst, Business Analyst, Associate Product Manager.',
        },
        detailed: {
          mindset: ['Think like a product owner', 'Lead teams confidently', 'Focus on user needs', 'Drive innovation'],
          habits: ['Learn product frameworks', 'Analyze user feedback', 'Improve decision-making', 'Study successful products', 'Build leadership skills'],
          weekly: ['Product strategy (8-10 hrs/week)', 'Team collaboration (3-4 hrs/week)', 'Learning tools (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong leadership and user focus define great product managers.',
          events: ['Product Management Conferences', 'Tech Meetups', 'Startup Events', 'Agile Workshops', 'LinkedIn Product Communities'],
          books: ['Inspired by Marty Cagan', 'Lean Product Playbook', 'The Lean Startup', 'Hooked', 'Zero to One'],
        },
        tools: ['Jira', 'Figma', 'Notion', 'Analytics Tools', 'Google Workspace'],
        guidance_tip: 'Your leadership can transform ideas into successful software products.',
      },
      {
        career_role_name: 'Full Stack Development Lead',
        short_description: 'Lead development of web and software applications across frontend and backend systems.',
        overview: 'Full Stack Leads design, develop, and manage complete software solutions using technologies like JavaScript, Node.js, React, Python, and databases.',
        natural_strengths: 'Your confidence and execution ability help you lead development teams and deliver high-quality applications.',
        roadmap: {
          foundation: 'Study programming, databases, and system architecture.',
          action_steps: 'Build projects, contribute to GitHub, and work on real-world applications.',
          advancement: 'Move into roles like Tech Lead or Engineering Manager.',
          career_entry: 'Software Developer, Web Developer.',
        },
        detailed: {
          mindset: ['Think logically and practically', 'Focus on problem-solving', 'Lead development confidently', 'Build scalable systems'],
          habits: ['Code daily', 'Build projects', 'Learn new technologies', 'Debug effectively', 'Stay updated'],
          weekly: ['Coding practice (8-10 hrs/week)', 'Project building (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Consistent coding builds strong technical expertise.',
          events: ['Developer Meetups', 'Hackathons', 'Open Source Communities', 'Tech Conferences', 'GitHub Communities'],
          books: ['Clean Code', 'The Pragmatic Programmer', 'Designing Data-Intensive Applications', 'You Don\'t Know JS', 'System Design Interview'],
        },
        tools: ['VS Code', 'GitHub', 'Docker', 'Postman', 'AWS'],
        guidance_tip: 'Your leadership can build strong and scalable tech solutions.',
      },
      {
        career_role_name: 'AI and Software Solutions Architect',
        short_description: 'Design advanced software systems and AI-driven applications for businesses.',
        overview: 'Solution Architects design system architecture, integrate AI solutions, and ensure scalability and performance of enterprise applications.',
        natural_strengths: 'Your strategic thinking and leadership help design complex systems efficiently.',
        roadmap: {
          foundation: 'Study system design, cloud computing, and AI basics.',
          action_steps: 'Build architecture diagrams, learn cloud platforms, and work on projects.',
          advancement: 'Move into roles like Enterprise Architect or CTO.',
          career_entry: 'Software Engineer, System Engineer.',
        },
        detailed: {
          mindset: ['Think at system level', 'Focus on scalability', 'Solve complex problems', 'Lead technical decisions'],
          habits: ['Study system designs', 'Build architecture models', 'Learn cloud platforms', 'Improve problem-solving', 'Stay updated'],
          weekly: ['System design (8-10 hrs/week)', 'Learning technologies (3-4 hrs/week)', 'Practice (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong architecture skills define high-level tech roles.',
          events: ['Tech Conferences', 'AI Meetups', 'Cloud Events', 'Developer Communities', 'LinkedIn Tech Groups'],
          books: ['Designing Data-Intensive Applications', 'System Design Interview', 'Clean Architecture', 'AI Superpowers', 'The Pragmatic Programmer'],
        },
        tools: ['AWS', 'Azure', 'System Design Tools', 'Docker', 'Kubernetes'],
        guidance_tip: 'Your leadership can design powerful and scalable systems.',
      },
      {
        career_role_name: 'IT Project Manager',
        short_description: 'Lead software projects, manage teams, and ensure timely delivery.',
        overview: 'IT Project Managers plan, execute, and monitor software development projects, ensuring deadlines, budgets, and quality standards are met.',
        natural_strengths: 'Your leadership and decision-making help manage teams and deliver projects successfully.',
        roadmap: {
          foundation: 'Study project management, software lifecycle, and agile methods.',
          action_steps: 'Manage small projects, learn tools, and coordinate teams.',
          advancement: 'Move into roles like Program Manager or Delivery Head.',
          career_entry: 'Project Coordinator, Business Analyst.',
        },
        detailed: {
          mindset: ['Focus on execution', 'Lead teams confidently', 'Manage time effectively', 'Solve problems quickly'],
          habits: ['Plan projects', 'Track progress', 'Communicate clearly', 'Manage risks', 'Stay organized'],
          weekly: ['Project planning (8-10 hrs/week)', 'Team coordination (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong coordination ensures successful project delivery.',
          events: ['Project Management Conferences', 'Agile Meetups', 'Business Events', 'Tech Forums', 'LinkedIn PM Groups'],
          books: ['The Phoenix Project', 'Scrum Guide', 'Lean Startup', 'Good to Great', 'The 7 Habits'],
        },
        tools: ['Jira', 'Trello', 'Asana', 'MS Project', 'Google Workspace'],
        guidance_tip: 'Your leadership ensures projects are delivered successfully.',
      },
      {
        career_role_name: 'Tech Startup Founder / Entrepreneur',
        short_description: 'Build and scale your own software or tech-based business.',
        overview: 'Tech Entrepreneurs identify problems, build digital solutions, and create scalable businesses using technology.',
        natural_strengths: 'Your boldness and leadership make you capable of taking risks and building new ventures.',
        roadmap: {
          foundation: 'Study entrepreneurship, product development, and business models.',
          action_steps: 'Build MVPs, test ideas, and launch startups.',
          advancement: 'Scale business or lead multiple ventures.',
          career_entry: 'Startup Founder, Co-founder.',
        },
        detailed: {
          mindset: ['Think big and bold', 'Take calculated risks', 'Focus on innovation', 'Stay resilient'],
          habits: ['Build products', 'Test ideas', 'Network actively', 'Learn business skills', 'Stay updated'],
          weekly: ['Product building (8-10 hrs/week)', 'Market research (3-4 hrs/week)', 'Networking (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Execution and persistence define startup success.',
          events: ['Startup Events', 'Founder Meetups', 'Tech Conferences', 'Innovation Forums', 'LinkedIn Startup Groups'],
          books: ['The Lean Startup', 'Zero to One', 'The Hard Thing About Hard Things', 'Blue Ocean Strategy', 'Atomic Habits'],
        },
        tools: ['No-code Tools', 'Cloud Platforms', 'Analytics Tools', 'CRM', 'Google Workspace'],
        guidance_tip: 'Your leadership can build innovative tech businesses.',
      },
      {
        career_role_name: 'Chief Technology Officer (CTO - Long-Term Path)',
        short_description: 'Lead technology strategy, development, and innovation at an organizational level.',
        overview: 'CTOs define technical vision, manage engineering teams, and ensure technology aligns with business goals.',
        natural_strengths: 'Your leadership and strategic thinking make you ideal for top-level tech roles.',
        roadmap: {
          foundation: 'Study advanced systems, leadership, and business strategy.',
          action_steps: 'Gain experience across development, architecture, and leadership.',
          advancement: 'Executive leadership roles.',
          career_entry: 'Software Engineer, Tech Lead.',
        },
        detailed: {
          mindset: ['Think strategically', 'Lead innovation', 'Focus on scalability', 'Make data-driven decisions'],
          habits: ['Learn new technologies', 'Build leadership skills', 'Analyze systems', 'Network actively', 'Learn continuously'],
          weekly: ['Strategy and leadership (8-10 hrs/week)', 'Learning (3-4 hrs/week)', 'Networking (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong technical and leadership skills define CTO success.',
          events: ['Tech Leadership Conferences', 'Developer Events', 'AI and Cloud Forums', 'Startup Events', 'LinkedIn Executive Groups'],
          books: ['Clean Architecture', 'The Pragmatic Programmer', 'Good to Great', 'The Lean Startup', 'The 7 Habits'],
        },
        tools: ['Cloud Platforms', 'DevOps Tools', 'Analytics Platforms', 'Project Tools', 'Google Workspace'],
        guidance_tip: 'Your leadership can shape the technological future of organizations.',
      },
    ],
  },
  {
    traitCode: 'DS',
    roles: [
      {
        career_role_name: 'Software Delivery and Implementation Manager',
        short_description: 'Ensure smooth delivery and implementation of software solutions for clients.',
        overview: 'Software Delivery Managers coordinate between development teams and clients to ensure software products are delivered on time, meet requirements, and function effectively in real environments.',
        natural_strengths: 'Your balanced and people-oriented approach helps maintain stability between technical teams and client expectations.',
        roadmap: {
          foundation: 'Study software lifecycle, project management, and client handling.',
          action_steps: 'Manage implementations, coordinate teams, and monitor delivery timelines.',
          advancement: 'Move into roles like Delivery Head or Program Manager.',
          career_entry: 'Implementation Executive, Project Coordinator.',
        },
        detailed: {
          mindset: ['Focus on stability and consistency', 'Maintain strong client relationships', 'Ensure smooth execution', 'Balance technical and business needs'],
          habits: ['Track project progress', 'Communicate with stakeholders', 'Manage timelines', 'Improve coordination', 'Stay organized'],
          weekly: ['Project coordination (8-10 hrs/week)', 'Client communication (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Smooth delivery builds strong client trust.',
          events: ['Project Management Conferences', 'Agile Meetups', 'Tech Forums', 'Business Events', 'LinkedIn Delivery Groups'],
          books: ['The Phoenix Project', 'Scrum Guide', 'The Lean Startup', 'Good to Great', 'Atomic Habits'],
        },
        tools: ['Jira', 'Trello', 'MS Project', 'Slack', 'Google Workspace'],
        guidance_tip: 'Your stability ensures successful and consistent project delivery.',
      },
      {
        career_role_name: 'Business Analyst (IT Systems and Applications)',
        short_description: 'Bridge business requirements and technical solutions in software projects.',
        overview: 'Business Analysts gather requirements, analyze business processes, and translate them into technical specifications for development teams.',
        natural_strengths: 'Your ability to understand people and systems helps you align business needs with technology solutions.',
        roadmap: {
          foundation: 'Study business analysis, system design, and documentation.',
          action_steps: 'Work on requirement gathering, create BRDs, and support development teams.',
          advancement: 'Move into roles like Product Manager or Strategy Analyst.',
          career_entry: 'Junior Analyst, Functional Analyst.',
        },
        detailed: {
          mindset: ['Think from both business and technical perspectives', 'Focus on clarity and structure', 'Maintain consistency', 'Support decision-making'],
          habits: ['Document requirements', 'Analyze processes', 'Communicate clearly', 'Improve problem-solving', 'Stay updated'],
          weekly: ['Requirement analysis (8-10 hrs/week)', 'Documentation (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Clear requirements reduce project risks.',
          events: ['Business Analysis Conferences', 'Agile Meetups', 'Tech Forums', 'Product Events', 'LinkedIn BA Groups'],
          books: ['BABOK Guide', 'Lean Startup', 'Good to Great', 'The 7 Habits', 'Atomic Habits'],
        },
        tools: ['Excel', 'Jira', 'Confluence', 'Visio', 'Google Workspace'],
        guidance_tip: 'Your structured thinking ensures clarity between business and tech teams.',
      },
      {
        career_role_name: 'Customer Success Manager (Tech Products)',
        short_description: 'Ensure customers successfully use software products and achieve their goals.',
        overview: 'Customer Success Managers help clients adopt software solutions, resolve issues, and ensure satisfaction and retention.',
        natural_strengths: 'Your supportive and relationship-focused approach helps build strong customer trust.',
        roadmap: {
          foundation: 'Study customer success, product knowledge, and communication.',
          action_steps: 'Engage clients, solve issues, and improve customer experience.',
          advancement: 'Move into roles like Customer Success Head.',
          career_entry: 'Support Executive, Customer Success Associate.',
        },
        detailed: {
          mindset: ['Focus on customer satisfaction', 'Build long-term relationships', 'Maintain patience', 'Support users effectively'],
          habits: ['Communicate regularly', 'Solve customer issues', 'Track feedback', 'Improve experience', 'Stay updated'],
          weekly: ['Customer support (8-10 hrs/week)', 'Feedback analysis (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Happy customers ensure business growth.',
          events: ['Customer Success Conferences', 'SaaS Meetups', 'Tech Forums', 'Business Events', 'LinkedIn Communities'],
          books: ['Customer Success', 'The Experience Economy', 'The Lean Startup', 'Atomic Habits', 'Good to Great'],
        },
        tools: ['CRM Tools', 'Helpdesk Tools', 'Analytics Tools', 'Excel', 'Google Workspace'],
        guidance_tip: 'Your relationship skills build strong customer loyalty.',
      },
      {
        career_role_name: 'QA and Software Testing Manager',
        short_description: 'Ensure software quality through testing, validation, and process control.',
        overview: 'QA Managers design testing processes, ensure product quality, and prevent defects before release.',
        natural_strengths: 'Your attention to detail and structured approach ensure high-quality outputs.',
        roadmap: {
          foundation: 'Study software testing, QA processes, and automation tools.',
          action_steps: 'Perform testing, build test cases, and automate testing.',
          advancement: 'Move into roles like QA Head or Quality Director.',
          career_entry: 'QA Tester, Test Engineer.',
        },
        detailed: {
          mindset: ['Focus on quality', 'Maintain consistency', 'Ensure accuracy', 'Prevent errors'],
          habits: ['Write test cases', 'Perform testing', 'Learn automation', 'Improve processes', 'Stay updated'],
          weekly: ['Testing (8-10 hrs/week)', 'Automation learning (3-4 hrs/week)', 'Practice (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong testing ensures reliable software.',
          events: ['QA Conferences', 'Testing Meetups', 'Tech Forums', 'Automation Events', 'LinkedIn QA Groups'],
          books: ['Agile Testing', 'Clean Code', 'The Pragmatic Programmer', 'Atomic Habits', 'Good to Great'],
        },
        tools: ['Selenium', 'Postman', 'Jira', 'TestRail', 'Automation Tools'],
        guidance_tip: 'Your consistency ensures high-quality software delivery.',
      },
      {
        career_role_name: 'IT Support and Infrastructure Manager',
        short_description: 'Manage IT systems, networks, and support services for organizations.',
        overview: 'IT Support Managers ensure system uptime, manage infrastructure, and provide technical support across the organization.',
        natural_strengths: 'Your reliability and patience help you maintain stable IT environments.',
        roadmap: {
          foundation: 'Study networking, system administration, and cloud basics.',
          action_steps: 'Manage systems, troubleshoot issues, and maintain infrastructure.',
          advancement: 'Move into roles like IT Head or Infrastructure Director.',
          career_entry: 'IT Support Engineer, System Administrator.',
        },
        detailed: {
          mindset: ['Focus on stability', 'Maintain systems', 'Solve issues patiently', 'Ensure reliability'],
          habits: ['Monitor systems', 'Troubleshoot issues', 'Learn new tools', 'Improve processes', 'Stay updated'],
          weekly: ['System monitoring (8-10 hrs/week)', 'Troubleshooting (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Reliable systems ensure business continuity.',
          events: ['IT Infrastructure Conferences', 'Cloud Meetups', 'Networking Forums', 'Tech Events', 'LinkedIn IT Groups'],
          books: ['The Phoenix Project', 'ITIL Foundation Guide', 'The Pragmatic Programmer', 'Atomic Habits', 'Good to Great'],
        },
        tools: ['Linux', 'AWS', 'Networking Tools', 'Monitoring Tools', 'Google Workspace'],
        guidance_tip: 'Your stability ensures smooth IT operations.',
      },
      {
        career_role_name: 'Program Manager - IT and Digital Solutions (Long-Term Path)',
        short_description: 'Lead multiple IT projects and ensure strategic alignment with business goals.',
        overview: 'Program Managers oversee multiple projects, manage resources, and ensure alignment with organizational objectives.',
        natural_strengths: 'Your balanced leadership helps manage teams and maintain long-term stability.',
        roadmap: {
          foundation: 'Study program management, leadership, and IT systems.',
          action_steps: 'Manage projects, coordinate teams, and align strategies.',
          advancement: 'Executive leadership roles.',
          career_entry: 'Project Manager, Delivery Manager.',
        },
        detailed: {
          mindset: ['Think long-term', 'Maintain stability', 'Lead collaboratively', 'Focus on execution'],
          habits: ['Manage multiple projects', 'Improve coordination', 'Build leadership skills', 'Monitor performance', 'Learn continuously'],
          weekly: ['Program management (8-10 hrs/week)', 'Coordination (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong coordination ensures program success.',
          events: ['Leadership Conferences', 'Project Management Events', 'Tech Forums', 'Business Summits', 'LinkedIn Groups'],
          books: ['The Phoenix Project', 'The Lean Startup', 'Good to Great', 'The 7 Habits', 'Atomic Habits'],
        },
        tools: ['Jira', 'MS Project', 'Power BI', 'Excel', 'Google Workspace'],
        guidance_tip: 'Your balanced leadership ensures long-term project success.',
      },
    ],
  },
  {
    traitCode: 'DC',
    roles: [
      {
        career_role_name: 'Data Analytics and Business Intelligence Manager',
        short_description: 'Lead data-driven decision-making using analytics, dashboards, and business insights.',
        overview: 'Data Analytics Managers analyze large datasets, build dashboards, and provide insights to improve business and product decisions. They work across domains like finance, marketing, and operations.',
        natural_strengths: 'Your analytical thinking and decisiveness help you extract insights and make strong data-backed decisions.',
        roadmap: {
          foundation: 'Study data analytics, statistics, and data visualization.',
          action_steps: 'Build dashboards, analyze datasets, and solve business problems.',
          advancement: 'Move into roles like Analytics Head or Chief Data Officer.',
          career_entry: 'Data Analyst, BI Analyst.',
        },
        detailed: {
          mindset: ['Think analytically and logically', 'Focus on data accuracy', 'Make data-driven decisions', 'Solve problems efficiently'],
          habits: ['Practice data analysis', 'Build dashboards', 'Learn tools regularly', 'Analyze trends', 'Stay updated'],
          weekly: ['Data analysis (8-10 hrs/week)', 'Dashboard building (3-4 hrs/week)', 'Learning tools (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong data skills drive impactful decisions.',
          events: ['Data Analytics Conferences', 'BI Meetups', 'Tech Forums', 'Analytics Communities', 'LinkedIn Data Groups'],
          books: ['Data Science for Business', 'Storytelling with Data', 'Lean Analytics', 'Measure What Matters', 'The Pragmatic Programmer'],
        },
        tools: ['Power BI', 'Tableau', 'Excel', 'SQL', 'Python'],
        guidance_tip: 'Your analytical clarity can transform data into business success.',
      },
      {
        career_role_name: 'Software Architect and System Design Specialist',
        short_description: 'Design scalable, efficient, and high-performance software systems.',
        overview: 'Software Architects define system architecture, choose technologies, and ensure applications are scalable, secure, and maintainable.',
        natural_strengths: 'Your logical thinking and decisive approach help you design strong system structures.',
        roadmap: {
          foundation: 'Study system design, architecture patterns, and cloud computing.',
          action_steps: 'Design systems, build projects, and learn scalable architecture.',
          advancement: 'Move into roles like Enterprise Architect or CTO.',
          career_entry: 'Software Engineer, System Engineer.',
        },
        detailed: {
          mindset: ['Think at system level', 'Focus on scalability', 'Solve complex problems', 'Make technical decisions'],
          habits: ['Study system designs', 'Build architecture models', 'Learn new technologies', 'Improve problem-solving', 'Stay updated'],
          weekly: ['System design (8-10 hrs/week)', 'Learning technologies (3-4 hrs/week)', 'Practice (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong system design defines advanced tech roles.',
          events: ['Tech Conferences', 'Cloud Events', 'Developer Meetups', 'Architecture Forums', 'LinkedIn Tech Groups'],
          books: ['Designing Data-Intensive Applications', 'System Design Interview', 'Clean Architecture', 'The Pragmatic Programmer', 'Domain-Driven Design'],
        },
        tools: ['AWS', 'Azure', 'Docker', 'Kubernetes', 'System Design Tools'],
        guidance_tip: 'Your decisions can shape scalable and robust software systems.',
      },
      {
        career_role_name: 'AI and Machine Learning Solutions Manager',
        short_description: 'Develop and manage AI-driven solutions for business applications.',
        overview: 'AI Managers build machine learning models, automate processes, and create intelligent systems for industries like finance, healthcare, and tech.',
        natural_strengths: 'Your analytical mindset helps you understand complex algorithms and make precise decisions.',
        roadmap: {
          foundation: 'Study machine learning, data science, and Python.',
          action_steps: 'Build ML models, work on datasets, and deploy solutions.',
          advancement: 'Move into roles like AI Head or Chief AI Officer.',
          career_entry: 'Data Scientist, ML Engineer.',
        },
        detailed: {
          mindset: ['Think logically and analytically', 'Focus on problem-solving', 'Use data for decisions', 'Innovate with technology'],
          habits: ['Practice coding', 'Work on datasets', 'Build models', 'Learn algorithms', 'Stay updated'],
          weekly: ['Model building (8-10 hrs/week)', 'Data analysis (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong fundamentals drive AI success.',
          events: ['AI Conferences', 'Data Science Meetups', 'Tech Forums', 'Hackathons', 'LinkedIn AI Groups'],
          books: ['Hands-On Machine Learning', 'Pattern Recognition', 'AI Superpowers', 'Deep Learning', 'The Pragmatic Programmer'],
        },
        tools: ['Python', 'TensorFlow', 'Scikit-learn', 'Jupyter Notebook', 'Cloud Platforms'],
        guidance_tip: 'Your analytical thinking can drive intelligent automation solutions.',
      },
      {
        career_role_name: 'Cybersecurity and Risk Analysis Manager',
        short_description: 'Protect systems and data by identifying and managing security risks.',
        overview: 'Cybersecurity Managers monitor threats, implement security protocols, and ensure data protection in organizations.',
        natural_strengths: 'Your critical thinking helps you identify vulnerabilities and manage risks effectively.',
        roadmap: {
          foundation: 'Study cybersecurity, networking, and ethical hacking.',
          action_steps: 'Learn tools, practice penetration testing, and analyze threats.',
          advancement: 'Move into roles like Security Head or CISO.',
          career_entry: 'Security Analyst, Network Security Engineer.',
        },
        detailed: {
          mindset: ['Think critically', 'Focus on risk prevention', 'Analyze threats', 'Stay alert'],
          habits: ['Monitor systems', 'Learn security tools', 'Practice ethical hacking', 'Analyze vulnerabilities', 'Stay updated'],
          weekly: ['Security analysis (8-10 hrs/week)', 'Tool learning (3-4 hrs/week)', 'Practice (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Proactive security prevents major risks.',
          events: ['Cybersecurity Conferences', 'Ethical Hacking Meetups', 'Tech Forums', 'Security Communities', 'LinkedIn Security Groups'],
          books: ['The Web Application Hacker\'s Handbook', 'Cybersecurity Essentials', 'Hacking: The Art of Exploitation', 'The Phoenix Project', 'Clean Code'],
        },
        tools: ['Kali Linux', 'Wireshark', 'Metasploit', 'Firewalls', 'Security Tools'],
        guidance_tip: 'Your analytical skills can safeguard critical systems.',
      },
      {
        career_role_name: 'IT Strategy and Digital Transformation Consultant',
        short_description: 'Guide organizations in adopting technology and improving digital processes.',
        overview: 'IT Consultants analyze business processes, recommend tech solutions, and lead digital transformation initiatives.',
        natural_strengths: 'Your logical thinking and decision-making help you design effective strategies.',
        roadmap: {
          foundation: 'Study IT strategy, business processes, and consulting frameworks.',
          action_steps: 'Analyze systems, design solutions, and support implementation.',
          advancement: 'Move into roles like Strategy Director or CIO.',
          career_entry: 'IT Analyst, Consultant.',
        },
        detailed: {
          mindset: ['Think strategically', 'Focus on efficiency', 'Solve business problems', 'Make informed decisions'],
          habits: ['Study business cases', 'Analyze systems', 'Improve strategies', 'Communicate clearly', 'Stay updated'],
          weekly: ['Strategy development (8-10 hrs/week)', 'Analysis (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Technology strategy drives business growth.',
          events: ['Consulting Conferences', 'Business Forums', 'Tech Events', 'Strategy Meetups', 'LinkedIn Groups'],
          books: ['The McKinsey Way', 'Good Strategy Bad Strategy', 'Blue Ocean Strategy', 'Lean Startup', 'The 7 Habits'],
        },
        tools: ['Power BI', 'Excel', 'Consulting Framework Tools', 'Presentation Tools', 'Google Workspace'],
        guidance_tip: 'Your decisions can drive large-scale digital transformation.',
      },
      {
        career_role_name: 'Chief Technology Strategist (Future Path)',
        short_description: 'Lead technology strategy and innovation at an organizational level.',
        overview: 'This role focuses on aligning technology with business goals, driving innovation, and leading technical teams at a strategic level.',
        natural_strengths: 'Your analytical leadership helps guide organizations toward technological excellence.',
        roadmap: {
          foundation: 'Study advanced technology, strategy, and leadership.',
          action_steps: 'Gain experience across technical and strategic roles.',
          advancement: 'Executive leadership roles.',
          career_entry: 'Tech Lead, Strategy Manager.',
        },
        detailed: {
          mindset: ['Think strategically', 'Make data-driven decisions', 'Focus on innovation', 'Lead confidently'],
          habits: ['Learn emerging technologies', 'Build leadership skills', 'Analyze systems', 'Network actively', 'Learn continuously'],
          weekly: ['Strategy (8-10 hrs/week)', 'Learning (3-4 hrs/week)', 'Networking (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong strategy and leadership define executive roles.',
          events: ['Tech Leadership Conferences', 'Innovation Forums', 'Business Summits', 'Strategy Events', 'LinkedIn Executive Groups'],
          books: ['Good to Great', 'Clean Architecture', 'The Lean Startup', 'The 7 Habits', 'The Pragmatic Programmer'],
        },
        tools: ['Cloud Platforms', 'Analytics Tools', 'DevOps Tools', 'CRM', 'Google Workspace'],
        guidance_tip: 'Your analytical leadership can shape the future of technology in organizations.',
      },
    ],
  },
  {
    traitCode: 'ID',
    roles: [
      {
        career_role_name: 'Tech Startup Founder / SaaS Entrepreneur',
        short_description: 'Build and scale innovative software products or platforms.',
        overview: 'Tech Entrepreneurs create digital products such as SaaS platforms, mobile apps, or AI tools that solve real-world problems. They focus on innovation, user growth, and scalability.',
        natural_strengths: 'Your energy, creativity, and vision help you identify opportunities and build impactful tech solutions.',
        roadmap: {
          foundation: 'Study entrepreneurship, product development, and market validation.',
          action_steps: 'Build MVPs, test ideas, and launch products.',
          advancement: 'Scale startup or become serial entrepreneur.',
          career_entry: 'Founder, Co-founder, Startup Builder.',
        },
        detailed: {
          mindset: ['Think big and visionary', 'Take calculated risks', 'Focus on innovation', 'Stay adaptable'],
          habits: ['Build products', 'Test ideas', 'Network actively', 'Learn business skills', 'Stay updated'],
          weekly: ['Product building (8-10 hrs/week)', 'Market research (3-4 hrs/week)', 'Networking (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Speed and execution define startup success.',
          events: ['Startup Events', 'Founder Meetups', 'Tech Conferences', 'Innovation Forums', 'LinkedIn Startup Groups'],
          books: ['The Lean Startup', 'Zero to One', 'The Hard Thing About Hard Things', 'Blue Ocean Strategy', 'Atomic Habits'],
        },
        tools: ['No-code Platforms', 'Cloud Services', 'Analytics Tools', 'CRM', 'Google Workspace'],
        guidance_tip: 'Your vision can build innovative and scalable tech businesses.',
      },
      {
        career_role_name: 'AI Product and Innovation Manager',
        short_description: 'Lead development of AI-driven products and innovative software solutions.',
        overview: 'AI Product Managers combine business understanding with technical knowledge to develop AI-powered applications like chatbots, recommendation systems, and automation tools.',
        natural_strengths: 'Your creativity and leadership help you drive cutting-edge innovation.',
        roadmap: {
          foundation: 'Study AI basics, product management, and user experience.',
          action_steps: 'Build AI product case studies, work with tech teams, and analyze user needs.',
          advancement: 'Move into roles like AI Product Head.',
          career_entry: 'Product Analyst, AI Associate.',
        },
        detailed: {
          mindset: ['Think innovatively', 'Focus on user value', 'Lead product vision', 'Stay adaptable'],
          habits: ['Learn AI tools', 'Analyze user behavior', 'Build product cases', 'Collaborate with teams', 'Stay updated'],
          weekly: ['Product development (8-10 hrs/week)', 'Learning AI tools (3-4 hrs/week)', 'Case studies (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'AI + product thinking creates future-ready careers.',
          events: ['AI Conferences', 'Product Meetups', 'Tech Forums', 'Startup Events', 'LinkedIn AI Groups'],
          books: ['Inspired', 'Lean Product Playbook', 'AI Superpowers', 'The Lean Startup', 'Hooked'],
        },
        tools: ['Python', 'AI Tools', 'Jira', 'Figma', 'Analytics Tools'],
        guidance_tip: 'Your innovation can lead the future of AI products.',
      },
      {
        career_role_name: 'Creative Full Stack Developer / Innovator',
        short_description: 'Build innovative web and mobile applications with creative problem-solving.',
        overview: 'This role focuses on designing and developing unique software solutions, combining creativity with strong technical skills.',
        natural_strengths: 'Your creative thinking helps you build unique and impactful applications.',
        roadmap: {
          foundation: 'Study programming, UI/UX, and system design.',
          action_steps: 'Build creative projects, contribute to open source, and explore new tech.',
          advancement: 'Move into roles like Tech Lead or Product Builder.',
          career_entry: 'Developer, UI Developer.',
        },
        detailed: {
          mindset: ['Think creatively', 'Focus on innovation', 'Solve problems differently', 'Build unique solutions'],
          habits: ['Code regularly', 'Build projects', 'Learn new technologies', 'Experiment ideas', 'Stay updated'],
          weekly: ['Coding (8-10 hrs/week)', 'Project building (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Creativity differentiates you in tech.',
          events: ['Hackathons', 'Developer Meetups', 'Open Source Communities', 'Tech Conferences', 'GitHub Communities'],
          books: ['Clean Code', 'The Pragmatic Programmer', 'You Don\'t Know JS', 'Designing Interfaces', 'Atomic Habits'],
        },
        tools: ['VS Code', 'GitHub', 'Figma', 'React', 'Node.js'],
        guidance_tip: 'Your creativity can build standout applications.',
      },
      {
        career_role_name: 'Digital Product Experience Designer (UX + Tech)',
        short_description: 'Design engaging digital experiences combining UX design and technical understanding.',
        overview: 'This role blends design and development to create intuitive, user-friendly digital products.',
        natural_strengths: 'Your creative and people-focused thinking helps design engaging user experiences.',
        roadmap: {
          foundation: 'Study UX/UI design, front-end development, and user psychology.',
          action_steps: 'Design interfaces, test usability, and improve experiences.',
          advancement: 'Move into roles like UX Lead or Product Designer.',
          career_entry: 'UI Designer, UX Developer.',
        },
        detailed: {
          mindset: ['Think user-first', 'Focus on experience', 'Be creative', 'Stay innovative'],
          habits: ['Design regularly', 'Study user behavior', 'Improve interfaces', 'Analyze feedback', 'Stay updated'],
          weekly: ['Design practice (8-10 hrs/week)', 'Research (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Great UX defines product success.',
          events: ['UX Conferences', 'Design Meetups', 'Tech Forums', 'Creative Communities', 'LinkedIn Design Groups'],
          books: ['Don\'t Make Me Think', 'The Design of Everyday Things', 'Hooked', 'Lean UX', 'Sprint'],
        },
        tools: ['Figma', 'Adobe XD', 'Canva', 'Prototyping Tools', 'Google Workspace'],
        guidance_tip: 'Your creativity can shape user-friendly digital products.',
      },
      {
        career_role_name: 'Innovation and Emerging Tech Consultant',
        short_description: 'Guide businesses in adopting new technologies like AI, blockchain, and automation.',
        overview: 'Innovation Consultants help companies stay competitive by identifying and implementing emerging technologies.',
        natural_strengths: 'Your visionary thinking helps you spot future trends and opportunities.',
        roadmap: {
          foundation: 'Study emerging technologies and business strategy.',
          action_steps: 'Analyze trends, propose solutions, and implement innovations.',
          advancement: 'Move into roles like Innovation Head or CTO.',
          career_entry: 'Tech Analyst, Consultant.',
        },
        detailed: {
          mindset: ['Think futuristic', 'Focus on innovation', 'Solve problems creatively', 'Stay adaptable'],
          habits: ['Study trends', 'Learn new tech', 'Analyze business needs', 'Build solutions', 'Stay updated'],
          weekly: ['Research (8-10 hrs/week)', 'Learning tech (3-4 hrs/week)', 'Analysis (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Future-focused thinking creates opportunities.',
          events: ['Tech Conferences', 'Innovation Forums', 'Startup Events', 'AI Meetups', 'LinkedIn Tech Groups'],
          books: ['AI Superpowers', 'Zero to One', 'The Lean Startup', 'The Innovator\'s Dilemma', 'Blue Ocean Strategy'],
        },
        tools: ['AI Tools', 'Cloud Platforms', 'Analytics Tools', 'Presentation Tools', 'Google Workspace'],
        guidance_tip: 'Your vision can drive technological transformation.',
      },
      {
        career_role_name: 'Chief Innovation and Technology Officer (Future Path)',
        short_description: 'Lead innovation, product development, and technology strategy at an executive level.',
        overview: 'This role focuses on driving innovation, leading teams, and aligning technology with future business goals.',
        natural_strengths: 'Your energy and vision make you ideal for leading innovation-driven organizations.',
        roadmap: {
          foundation: 'Study leadership, strategy, and advanced technologies.',
          action_steps: 'Gain experience across development, product, and leadership roles.',
          advancement: 'Executive leadership roles.',
          career_entry: 'Tech Lead, Product Manager.',
        },
        detailed: {
          mindset: ['Think visionary', 'Lead innovation', 'Focus on growth', 'Take bold decisions'],
          habits: ['Learn emerging tech', 'Build leadership skills', 'Network actively', 'Analyze trends', 'Learn continuously'],
          weekly: ['Strategy (8-10 hrs/week)', 'Learning (3-4 hrs/week)', 'Networking (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Innovation leadership defines future success.',
          events: ['Leadership Conferences', 'Tech Events', 'Innovation Forums', 'Startup Meetups', 'LinkedIn Executive Groups'],
          books: ['Good to Great', 'The Lean Startup', 'Zero to One', 'The 7 Habits', 'Blue Ocean Strategy'],
        },
        tools: ['Cloud Platforms', 'AI Tools', 'Analytics Tools', 'DevOps Tools', 'Google Workspace'],
        guidance_tip: 'Your visionary leadership can shape the future of technology.',
      },
    ],
  },
  {
    traitCode: 'IS',
    roles: [
      {
        career_role_name: 'Technical Trainer and Software Educator',
        short_description: 'Train students or professionals in programming, software tools, and emerging technologies.',
        overview: 'Technical Trainers work in colleges, training institutes, or corporates to teach programming, software development, and IT skills. They also design curriculum and conduct workshops.',
        natural_strengths: 'Your supportive and energetic nature helps you explain concepts clearly and motivate learners.',
        roadmap: {
          foundation: 'Study programming languages, teaching methods, and communication skills.',
          action_steps: 'Conduct workshops, create tutorials, and train students.',
          advancement: 'Move into roles like Training Head or EdTech Leader.',
          career_entry: 'Trainer, Teaching Assistant, Instructor.',
        },
        detailed: {
          mindset: ['Focus on helping others learn', 'Be patient and supportive', 'Communicate clearly', 'Inspire learners'],
          habits: ['Teach regularly', 'Create learning content', 'Improve communication', 'Stay updated', 'Practice coding'],
          weekly: ['Teaching (8-10 hrs/week)', 'Content creation (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Teaching strengthens your own technical foundation.',
          events: ['EdTech Conferences', 'Developer Meetups', 'Teaching Workshops', 'Tech Forums', 'LinkedIn Educator Groups'],
          books: ['Teach Like a Pro', 'The Pragmatic Programmer', 'Clean Code', 'Atomic Habits', 'Mindset'],
        },
        tools: ['Google Classroom', 'Zoom', 'OBS Studio', 'Canva', 'VS Code'],
        guidance_tip: 'Your support can shape future tech professionals.',
      },
      {
        career_role_name: 'UI/UX Developer and User Experience Specialist',
        short_description: 'Design and develop user-friendly software interfaces and digital experiences.',
        overview: 'UI/UX Developers create intuitive and visually appealing interfaces while ensuring usability and user satisfaction.',
        natural_strengths: 'Your empathy and creativity help you design solutions that users truly enjoy.',
        roadmap: {
          foundation: 'Study UI/UX design, front-end development, and user psychology.',
          action_steps: 'Build portfolios, design apps, and test user experiences.',
          advancement: 'Move into roles like UX Lead or Product Designer.',
          career_entry: 'UI Developer, UX Designer.',
        },
        detailed: {
          mindset: ['Think user-first', 'Focus on simplicity', 'Be empathetic', 'Stay creative'],
          habits: ['Design regularly', 'Study user behavior', 'Improve interfaces', 'Analyze feedback', 'Stay updated'],
          weekly: ['Design work (8-10 hrs/week)', 'Research (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'User experience defines product success.',
          events: ['UX Conferences', 'Design Meetups', 'Creative Workshops', 'Tech Forums', 'LinkedIn Design Groups'],
          books: ['Don\'t Make Me Think', 'The Design of Everyday Things', 'Hooked', 'Lean UX', 'Sprint'],
        },
        tools: ['Figma', 'Adobe XD', 'HTML/CSS', 'JavaScript', 'Canva'],
        guidance_tip: 'Your empathy can create meaningful user experiences.',
      },
      {
        career_role_name: 'Customer Success and Technical Support Manager',
        short_description: 'Help customers effectively use software products and resolve technical issues.',
        overview: 'Customer Success Managers ensure users adopt products successfully, solve technical problems, and maintain long-term relationships.',
        natural_strengths: 'Your supportive and friendly nature helps you build trust with users.',
        roadmap: {
          foundation: 'Study product knowledge, communication, and customer support systems.',
          action_steps: 'Assist customers, resolve issues, and track feedback.',
          advancement: 'Move into roles like Customer Success Head.',
          career_entry: 'Support Engineer, Customer Success Associate.',
        },
        detailed: {
          mindset: ['Focus on helping users', 'Stay patient and positive', 'Build relationships', 'Solve problems effectively'],
          habits: ['Communicate regularly', 'Track issues', 'Improve solutions', 'Learn products deeply', 'Stay updated'],
          weekly: ['Customer support (8-10 hrs/week)', 'Feedback analysis (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Customer satisfaction drives business success.',
          events: ['Customer Success Conferences', 'SaaS Meetups', 'Tech Forums', 'Business Events', 'LinkedIn Communities'],
          books: ['Customer Success', 'The Experience Economy', 'The Lean Startup', 'Atomic Habits', 'Good to Great'],
        },
        tools: ['CRM Tools', 'Helpdesk Software', 'Analytics Tools', 'Excel', 'Google Workspace'],
        guidance_tip: 'Your support builds lasting customer relationships.',
      },
      {
        career_role_name: 'HR Tech and Learning Systems Specialist',
        short_description: 'Manage and develop learning platforms and HR technology systems.',
        overview: 'This role focuses on implementing LMS platforms, employee training systems, and HR software tools.',
        natural_strengths: 'Your supportive mindset helps improve learning and development systems.',
        roadmap: {
          foundation: 'Study HR systems, LMS platforms, and IT tools.',
          action_steps: 'Manage training platforms, track learning progress, and improve systems.',
          advancement: 'Move into roles like L&D Head or HR Tech Lead.',
          career_entry: 'HR Tech Executive, LMS Coordinator.',
        },
        detailed: {
          mindset: ['Focus on people development', 'Support learning', 'Maintain structure', 'Improve systems'],
          habits: ['Manage platforms', 'Track learning', 'Improve content', 'Learn tools', 'Stay updated'],
          weekly: ['System management (8-10 hrs/week)', 'Learning support (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong learning systems improve organizational growth.',
          events: ['HR Tech Conferences', 'Learning and Development Events', 'Tech Forums', 'EdTech Meetups', 'LinkedIn HR Groups'],
          books: ['Drive', 'Mindset', 'The Lean Startup', 'Atomic Habits', 'Good to Great'],
        },
        tools: ['LMS Platforms', 'CRM', 'Analytics Tools', 'Excel', 'Google Workspace'],
        guidance_tip: 'Your support can enhance learning ecosystems.',
      },
      {
        career_role_name: 'Community Manager (Tech Platforms / Developer Communities)',
        short_description: 'Build and manage online tech communities and user engagement.',
        overview: 'Community Managers engage developers, users, and learners through forums, events, and digital platforms.',
        natural_strengths: 'Your friendly and energetic nature helps build strong communities.',
        roadmap: {
          foundation: 'Study community building, content creation, and engagement strategies.',
          action_steps: 'Manage communities, create content, and engage users.',
          advancement: 'Move into roles like Community Head.',
          career_entry: 'Community Executive, Social Media Executive.',
        },
        detailed: {
          mindset: ['Focus on people engagement', 'Build connections', 'Stay positive', 'Encourage participation'],
          habits: ['Engage users', 'Create content', 'Build relationships', 'Monitor engagement', 'Stay updated'],
          weekly: ['Community engagement (8-10 hrs/week)', 'Content creation (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong communities create brand loyalty.',
          events: ['Developer Meetups', 'Tech Communities', 'Social Media Events', 'Startup Events', 'LinkedIn Groups'],
          books: ['Contagious', 'This is Marketing', 'Hooked', 'The Culture Code', 'Building a StoryBrand'],
        },
        tools: ['Social Platforms', 'CRM', 'Content Tools', 'Analytics Tools', 'Google Workspace'],
        guidance_tip: 'Your energy can build strong and engaged communities.',
      },
      {
        career_role_name: 'People-Centric Tech Leader (Future Path)',
        short_description: 'Lead teams with a focus on people development and technology delivery.',
        overview: 'This role combines leadership, team management, and technical knowledge to build high-performing teams.',
        natural_strengths: 'Your supportive leadership helps teams grow and perform effectively.',
        roadmap: {
          foundation: 'Study leadership, communication, and technical management.',
          action_steps: 'Gain experience managing teams and mentoring others.',
          advancement: 'Leadership roles like Engineering Manager or Delivery Head.',
          career_entry: 'Team Lead, Project Lead.',
        },
        detailed: {
          mindset: ['Focus on people growth', 'Lead with empathy', 'Maintain team harmony', 'Deliver results'],
          habits: ['Mentor team members', 'Build relationships', 'Improve communication', 'Manage teams', 'Learn continuously'],
          weekly: ['Team management (8-10 hrs/week)', 'Mentoring (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Strong people leadership builds successful teams.',
          events: ['Leadership Conferences', 'Tech Forums', 'HR Events', 'Business Meetups', 'LinkedIn Groups'],
          books: ['The 7 Habits', 'Good to Great', 'Drive', 'Atomic Habits', 'Leaders Eat Last'],
        },
        tools: ['Project Tools', 'CRM', 'Communication Tools', 'Analytics Tools', 'Google Workspace'],
        guidance_tip: 'Your supportive leadership can build strong and motivated teams.',
      },
    ],
  },
  {
    traitCode: 'IC',
    roles: [
      {
        career_role_name: 'Creative Software Developer (Frontend and Interactive Apps)',
        short_description: 'Build visually engaging and interactive web/mobile applications.',
        overview: 'Creative Developers focus on designing innovative user interfaces and interactive experiences using technologies like React, animations, and modern UI frameworks.',
        natural_strengths: 'Your creativity and imagination help you build unique and engaging digital products.',
        roadmap: {
          foundation: 'Study front-end development, UI/UX, and animation frameworks.',
          action_steps: 'Build creative projects, experiment with designs, and improve UI skills.',
          advancement: 'Move into roles like UI Architect or Creative Tech Lead.',
          career_entry: 'Frontend Developer, UI Developer.',
        },
        detailed: {
          mindset: ['Think creatively about solutions', 'Focus on user experience', 'Experiment with ideas', 'Build visually appealing products'],
          habits: ['Design and code daily', 'Explore UI trends', 'Build creative projects', 'Improve aesthetics', 'Stay updated'],
          weekly: ['Coding and UI (8-10 hrs/week)', 'Design exploration (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Creativity differentiates you in development.',
          events: ['Frontend Conferences', 'Design Meetups', 'Hackathons', 'Creative Tech Communities', 'LinkedIn Groups'],
          books: ['Don\'t Make Me Think', 'Designing Interfaces', 'Clean Code', 'The Pragmatic Programmer', 'Atomic Habits'],
        },
        tools: ['Figma', 'React', 'CSS Frameworks', 'Canva', 'VS Code'],
        guidance_tip: 'Your creativity can build engaging and modern digital experiences.',
      },
      {
        career_role_name: 'Game Developer and Interactive Media Designer',
        short_description: 'Develop games and interactive digital experiences using creative programming.',
        overview: 'Game Developers design, build, and test games for mobile, PC, and web platforms using engines like Unity or Unreal.',
        natural_strengths: 'Your imagination and creativity help you design engaging gameplay and experiences.',
        roadmap: {
          foundation: 'Study game development, graphics, and programming.',
          action_steps: 'Build games, learn engines, and publish projects.',
          advancement: 'Move into roles like Game Designer or Studio Lead.',
          career_entry: 'Game Developer, Unity Developer.',
        },
        detailed: {
          mindset: ['Think creatively', 'Focus on user engagement', 'Design experiences', 'Stay innovative'],
          habits: ['Build games', 'Learn engines', 'Study gameplay mechanics', 'Improve design', 'Stay updated'],
          weekly: ['Game development (8-10 hrs/week)', 'Learning engines (3-4 hrs/week)', 'Practice (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Creativity drives engaging gaming experiences.',
          events: ['Game Dev Conferences', 'Hackathons', 'Indie Game Communities', 'Tech Forums', 'LinkedIn Groups'],
          books: ['The Art of Game Design', 'Clean Code', 'The Pragmatic Programmer', 'Level Up', 'Atomic Habits'],
        },
        tools: ['Unity', 'Unreal Engine', 'Blender', 'C#', 'Game Tools'],
        guidance_tip: 'Your creativity can build immersive digital experiences.',
      },
      {
        career_role_name: 'UI/UX Designer and Product Experience Specialist',
        short_description: 'Design user-friendly and visually appealing digital products.',
        overview: 'UI/UX Designers focus on creating seamless user journeys, improving usability, and designing visually engaging interfaces.',
        natural_strengths: 'Your creative and empathetic thinking helps you design user-centered solutions.',
        roadmap: {
          foundation: 'Study UX principles, design tools, and user psychology.',
          action_steps: 'Build portfolios, design apps, and test usability.',
          advancement: 'Move into roles like Product Designer or UX Lead.',
          career_entry: 'UI Designer, UX Designer.',
        },
        detailed: {
          mindset: ['Think user-first', 'Focus on simplicity', 'Be creative', 'Design meaningful experiences'],
          habits: ['Design regularly', 'Study user behavior', 'Improve interfaces', 'Analyze feedback', 'Stay updated'],
          weekly: ['Design work (8-10 hrs/week)', 'Research (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Good design improves product adoption.',
          events: ['UX Conferences', 'Design Meetups', 'Creative Workshops', 'Tech Forums', 'LinkedIn Groups'],
          books: ['Don\'t Make Me Think', 'The Design of Everyday Things', 'Lean UX', 'Hooked', 'Sprint'],
        },
        tools: ['Figma', 'Adobe XD', 'Canva', 'Prototyping Tools', 'Google Workspace'],
        guidance_tip: 'Your creativity can enhance user experience significantly.',
      },
      {
        career_role_name: 'Digital Content Creator (Tech Education / YouTube / EdTech)',
        short_description: 'Create engaging tech content for platforms like YouTube, blogs, or courses.',
        overview: 'Tech Content Creators teach programming, tools, and concepts through videos, blogs, and courses, building large online audiences.',
        natural_strengths: 'Your creative expression helps you simplify complex concepts and engage audiences.',
        roadmap: {
          foundation: 'Study communication, content creation, and technical skills.',
          action_steps: 'Create videos, write blogs, and build a personal brand.',
          advancement: 'Move into roles like EdTech Influencer or Course Creator.',
          career_entry: 'Content Creator, Technical Blogger.',
        },
        detailed: {
          mindset: ['Think creatively', 'Focus on audience engagement', 'Simplify concepts', 'Stay consistent'],
          habits: ['Create content regularly', 'Improve storytelling', 'Learn tools', 'Analyze feedback', 'Stay updated'],
          weekly: ['Content creation (8-10 hrs/week)', 'Research (3-4 hrs/week)', 'Learning (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Consistency builds strong personal brands.',
          events: ['Creator Meetups', 'Tech Communities', 'EdTech Events', 'YouTube Communities', 'LinkedIn Groups'],
          books: ['Show Your Work', 'Steal Like an Artist', 'Contagious', 'This is Marketing', 'Atomic Habits'],
        },
        tools: ['YouTube', 'Canva', 'OBS Studio', 'Editing Tools', 'Google Workspace'],
        guidance_tip: 'Your creativity can build a strong digital presence.',
      },
      {
        career_role_name: 'Innovation Lab Developer (AR/VR / Creative Tech)',
        short_description: 'Work on innovative technologies like AR/VR and immersive applications.',
        overview: 'Innovation Developers build experimental projects using AR/VR, simulations, and interactive technologies.',
        natural_strengths: 'Your creativity helps you explore futuristic technologies and ideas.',
        roadmap: {
          foundation: 'Study AR/VR, 3D design, and advanced programming.',
          action_steps: 'Build prototypes, experiment with tools, and create demos.',
          advancement: 'Move into roles like Innovation Lead or Tech Director.',
          career_entry: 'Developer, AR/VR Engineer.',
        },
        detailed: {
          mindset: ['Think futuristic', 'Focus on innovation', 'Experiment freely', 'Solve creatively'],
          habits: ['Build prototypes', 'Learn new tech', 'Experiment ideas', 'Improve design', 'Stay updated'],
          weekly: ['Development (8-10 hrs/week)', 'Learning tech (3-4 hrs/week)', 'Experimentation (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Innovation requires continuous experimentation.',
          events: ['AR/VR Conferences', 'Innovation Labs', 'Tech Meetups', 'Hackathons', 'LinkedIn Groups'],
          books: ['The Innovator\'s Dilemma', 'Zero to One', 'AI Superpowers', 'The Lean Startup', 'Atomic Habits'],
        },
        tools: ['Unity', 'AR/VR Tools', '3D Software', 'Cloud Platforms', 'Analytics Tools'],
        guidance_tip: 'Your creativity can shape the future of immersive tech.',
      },
      {
        career_role_name: 'Chief Creative Technology Officer (Future Path)',
        short_description: 'Lead innovation, design, and technology strategy at an executive level.',
        overview: 'This role combines creativity, leadership, and technology to drive innovation and product vision in organizations.',
        natural_strengths: 'Your creative thinking helps you lead innovation-driven teams.',
        roadmap: {
          foundation: 'Study leadership, innovation, and advanced technologies.',
          action_steps: 'Gain experience across development, design, and leadership.',
          advancement: 'Executive roles.',
          career_entry: 'Developer, Designer, Product Manager.',
        },
        detailed: {
          mindset: ['Think creatively and strategically', 'Lead innovation', 'Focus on growth', 'Take bold ideas'],
          habits: ['Learn emerging tech', 'Build leadership skills', 'Experiment ideas', 'Network actively', 'Learn continuously'],
          weekly: ['Strategy (8-10 hrs/week)', 'Learning (3-4 hrs/week)', 'Networking (2-3 hrs/week)', 'Total (~14-17 hrs/week)'],
          weekly_tip: 'Innovation leadership defines future tech roles.',
          events: ['Tech Leadership Conferences', 'Innovation Forums', 'Design Events', 'Startup Meetups', 'LinkedIn Groups'],
          books: ['The Lean Startup', 'Zero to One', 'Good to Great', 'The 7 Habits', 'Blue Ocean Strategy'],
        },
        tools: ['Cloud Platforms', 'Design Tools', 'AI Tools', 'Dev Tools', 'Google Workspace'],
        guidance_tip: 'Your creativity can lead the next generation of technology innovation.',
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

    console.log('SUCCESS: Loaded MCA (dept 23) DI/DS/DC/ID/IS/IC with structured guidance JSON.');
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
