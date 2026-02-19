interface TechSkill {
    label: string;
    start: number; // e.g., 29 for 2029
    end: number; // e.g., 35 for 2035
}

export const COLLEGE_TOC_CONTENT = [
    "About the Origin BI Self-Discovery Assessment",
    "Why Understanding Your Learning and Growth Style Matters",
    "Personalized Insights for $full_name",
    "Your Key Strengths – How You Stand Out",
    "Agile Compatibility Index (ACI)",
    "Your Personalized Behavioral Snapshot",
    "What Drives You – Motivations and Needs for Growth",
    "Applying Self-Discovery to Your Academic and Career Choices",
    "Tech Areas That Will Matter in 2030 - 2035",
    "Future Industry Glimpse (2035)",
    "Mapping Your Strengths to Future Academic and Career Goals",
    "Disclaimer",
];

export const CONTENT = {
    // D, I, S, C content now includes specific sections from the college report
    D: {
        // Section: Personalized Insights
        general_characteristics_for_student_1: `<p>The following description provides an overview of your behavioral tendencies, setting the tone for the insights in this report. It offers a framework to help you understand and reflect on your unique traits. Included are coaching suggestions to help you channel your strengths and maximize your potential for personal and professional success.</p>`,

        general_characteristics_for_student_2: `<p>You exhibit a natural drive to take charge and achieve results. Your strong determination and goal-oriented mindset make you highly effective in navigating challenges and overcoming obstacles. You thrive in environments where decisions need to be made quickly and decisively, and you have the confidence to lead others toward achieving desired outcomes. However, your focus on results may sometimes come across as too direct or assertive. We encourage you to balance this intensity by considering the perspectives and feelings of others.</p><p>Your responses suggest that you are highly motivated by challenges and enjoy taking calculated risks to achieve your goals. You have a natural ability to identify inefficiencies and implement solutions, which makes you a valuable asset in dynamic and fast-paced settings. Your decisiveness and focus on action ensure that tasks are completed efficiently, even under pressure.</p><p>You are someone who thrives in situations that demand authority and control. You prefer to be in charge of your environment and enjoy taking the lead in projects or initiatives. However, it’s important to recognize that collaboration and delegation can amplify your effectiveness as a leader. By involving others and valuing their input, you can foster a stronger sense of teamwork and loyalty.</p><p>One of your key strengths is your resilience and ability to maintain focus on objectives, even in the face of setbacks or resistance. This determination inspires confidence in those around you and motivates them to follow your lead. While your assertive style can be highly effective, remember that adapting your approach to different situations and people can enhance your influence and create stronger relationships.</p><p>Your bold and decisive nature is a powerful asset. By combining it with a thoughtful approach to collaboration and communication, you can achieve remarkable success while fostering trust and respect within your team or organization.</p>`,

        // Section: Understanding Yourself
        understanding_yourself_who_i_am_1: `<p>You are a natural leader who thrives on challenges and takes charge in situations that require direction and decisive action. Your strong-willed nature and confidence in your abilities often make you the one others look to for guidance. You have an innate drive to achieve results, and your determination ensures that obstacles are seen as opportunities rather than setbacks. However, it’s important to temper your assertiveness with empathy to ensure your leadership is both effective and inclusive.</p><p>You are highly focused on achieving goals and are not easily deterred by setbacks. Your ability to stay determined, even under pressure, is one of your greatest strengths. At times, your strong desire for progress may lead you to overlook other's perspectives or emotions. A word of advice is to actively listen to your team and seek input to foster collaboration and a sense of shared ownership.</p>
<p>You are comfortable taking calculated risks to move forward, and your willingness to take bold steps often inspires confidence in others. While this trait is essential for driving innovation and progress, be mindful of balancing risk-taking with careful evaluation to avoid unnecessary pitfalls. Your decisiveness is an asset, but occasionally pausing to consider alternate approaches or gather more information can enhance the outcomes of your decisions.</p>`,

        understanding_yourself_who_i_am_2: `<p>You have a straightforward and results-oriented communication style. While this ensures clarity and efficiency, it’s important to adapt your approach when working with those who may prefer a more measured or collaborative tone. Your ability to set high standards and expectations often motivates those around you, but remember to celebrate small wins and acknowledge others’ contributions to maintain morale and loyalty.</p>
<p>Your relentless focus on results and ability to take charge makes you a force to be reckoned with. By balancing your drive with an openness to collaboration and empathy for others, you can not only achieve your goals but also foster strong and lasting relationships that amplify your success.</p>`,

        // Section: Your Key Strengths
        your_strength_what_you_bring_to_the_organization_1: `
<p>You bring a results-driven and decisive approach to your organization, making you a natural leader who thrives in challenging situations. Your ability to take charge and focus on achieving goals inspires those around you to perform at their best. Your work style emphasizes efficiency, action, and achieving measurable outcomes.</p>`,

        your_strength_what_you_bring_to_the_organization_2: [
            "Quickly set and pursue clear, ambitious goals.",
            "Focus on overcoming obstacles with practical and effective solutions.",
            "Drive efficiency and ensure progress through decisive action.",
            "Demonstrate resilience and remain focused under pressure.",
            "Motivate others by setting high standards and leading by example.",
        ],

        // Natural Bar Chart Data (Array for drawing the graph)
        natural_bar_chart_data: [
            ["D", 85, [255, 49, 49]], // Red color
            ["I", 30, [232, 178, 54]], // Yellow color
            ["S", 25, [0, 173, 76]], // Green color
            ["C", 40, [74, 198, 234]], // Blue color
        ],

        // Section: Motivations and Needs
        motivations_and_need_your_personalized_insights_1: `
    <p>$full_name is a decisive, results-driven individual with a natural ability to lead and inspire action. Your energy comes from achieving goals, overcoming challenges, and driving success in everything you do. You excel in environments where you can take charge, create structure, and see measurable results from your efforts. People admire your ability to focus on the big picture, make bold decisions, and push through obstacles with determination and clarity.</p>`,

        motivations_and_need_your_personalized_insights_what_drives:
            "What Drives $full_name",

        motivations_and_need_your_personalized_insights_desc_1: `
    <p>At your core, you are motivated by challenges and opportunities to demonstrate your capabilities. Whether it’s tackling a tough project or leading a team through adversity, you thrive when you are in control and can actively contribute to achieving meaningful outcomes. Success and recognition for your accomplishments keep you energized and focused.</p>
    <p>You are also driven by efficiency and forward momentum. You dislike unnecessary delays or ambiguity and prefer to operate in environments where processes are clear, and action is prioritized. Achieving results quickly and effectively is a key driver for you, and you find satisfaction in being the person others rely on to get things done.</p>`,

        motivations_and_need_your_personalized_insights_unique_needs:
            "Your Unique Needs",

        motivations_and_need_your_personalized_insights_desc_2: `
    <p>While you thrive on challenges, you also need the freedom to make decisions and operate autonomously. Having the authority to lead and determine the best course of action is essential to your success. Environments that stifle your independence or slow you down with excessive bureaucracy can feel frustrating.</p>
    <p>You also need clear objectives and measurable outcomes to stay focused. Ambiguity can be draining, so having well-defined goals helps you channel your energy effectively. Although collaboration can enhance your impact, it’s important to work with like-minded individuals who share your drive and commitment to results.</p>`,

        motivations_and_need_your_personalized_insights_communication_tips:
            "Communication Tips for Connecting With $full_name",

        motivations_and_need_your_personalized_insights_communication_with_others:
            "How Others Can Best Communicate With $full_name",

        motivations_and_need_your_personalized_insights_desc_3: `
    <p>You appreciate conversations that are direct, concise, and focused on achieving objectives. When others respect your time and provide clear, actionable information, you feel valued and engaged. Sharing ideas that align with your goals and offering opportunities for leadership or decision-making appeal to your strengths. Acknowledging your achievements also builds trust and motivation.</p>`,

        when_communicating_with_student_dos_title:
            "<p>When communicating with $full_name, DO’s</p>",

        when_communicating_with_student_dos: [
            "Be direct and to the point.",
            "Focus on results and outcomes.",
            "Present actionable solutions or ideas.",
            "Respect their time and decision-making ability.",
            "Show confidence and be assertive in your communication.",
        ],

        motivations_and_need_your_personalized_insights_2: `
    <p>You are less receptive to vague or overly detailed discussions that lack focus. Excessive small talk or indecision can frustrate you, as you prefer to move forward quickly and efficiently. Avoid micromanaging or questioning your abilities, as this can undermine your confidence and hinder your effectiveness. Respecting your autonomy is key to fostering productive interactions.</p>`,

        motivations_and_need_your_personalized_what_others_should_avoid:
            "What Others Should Avoid",

        when_communicating_with_student_dont: [
            "Avoid vague or unclear messages.",
            "Don’t dwell on small talk or unnecessary details.",
            "Avoid questioning their authority or decisions.",
            "Don’t focus too much on feelings or personal concerns.",
            "Avoid micromanaging or slowing down their progress.",
        ],

        motivations_and_need_your_personalized_insights_3:
            "<p>When communicating with $full_name, DON’T</p>",

        // Section: Growth Areas
        motivations_and_need_your_personalized_insights_4: `
    <p>Your drive and determination are among your greatest strengths, but like any strong trait, they can become challenges if not balanced. To continue growing and achieving your full potential, here are some personalized recommendations for you:</p>
    <ol>
        <li><b style="font-family:sorasemib;">Balancing Assertiveness with Empathy </b>
            <p style="line-height:2px;">&nbsp;</p>
            <p style="font-family:inter_18pt; text-align:justify;">While your directness is effective in driving results, balancing it with empathy can strengthen your relationships. Taking time to listen to others and understand their perspectives helps build trust and collaboration.</p>
        </li>
        <li><b style="font-family:sorasemib;">Delegating Effectively </b>
            <p style="line-height:2px;">&nbsp;</p>
            <p style="font-family:inter_18pt; text-align:justify;">Your preference for control may lead you to take on too much responsibility. Delegating tasks and trusting others can lighten your workload and empower your team to contribute meaningfully.</p>
        </li>
        <li><b style="font-family:sorasemib;">Managing Impatience </b>
            <p style="line-height:2px;">&nbsp;</p>
            <p style="font-family:inter_18pt; text-align:justify;">Your results-oriented nature may lead to impatience with slower processes or differing opinions. Developing patience and flexibility can help you navigate complex situations more effectively.</p>
        </li>
        <li><b style="font-family:sorasemib;">Considering Long-Term Impacts </b>
            <p style="line-height:2px;">&nbsp;</p>
            <p style="font-family:inter_18pt; text-align:justify;">Your focus on immediate results can sometimes overshadow long-term considerations. Taking time to assess the broader impact of decisions ensures sustainable success.</p>
        </li>
        <li><b style="font-family:sorasemib;">Practicing Active Listening </b>
            <p style="line-height:2px;">&nbsp;</p>
            <p style="font-family:inter_18pt; text-align:justify;">While you are a strong communicator, actively listening to others fosters mutual respect and ensures that all voices are heard. This strengthens your leadership and enhances team cohesion.</p>
        </li>
    </ol>`,

        // Section: Behavioral Snapshot
        your_personalized_behavioral_charts_1: `
    <p>Your ability to take charge, inspire confidence, and deliver results sets you apart as a natural leader. You excel in high-pressure situations and are often the person others rely on to make bold decisions and drive progress. By balancing your strengths with a thoughtful approach to collaboration and empathy, you can achieve even greater success while building lasting relationships. Your journey is one of purpose and determination, and the possibilities ahead are limitless.</p>
    <p>Your <b style="font-family:inter_18ptsemib;">Adapted Style </b> shows that you rely more on behaviors aligned with assertiveness and decision-making, traits typical of a <b style="font-family:inter_18ptsemib;">D </b> style, in your current focus area (work, social, or family). Your <b style="font-family:inter_18ptsemib;">Natural Style </b> graph indicates that you naturally tend to approach situations with confidence, a results-oriented mindset, and a drive to take charge.</p>`,

        your_personalized_behavioral_understanding_the_graphs:
            "Understanding the Graphs:",

        your_personalized_behavioral_understanding_the_graphs_list: [
            `<b style="font-family:inter_18ptsemib;">Adapted Style (Graph I): </b> Reflects how you adjust your behavior to meet the demands of your environment. This may vary based on roles or situations, like responding decisively to high-pressure challenges.`,
            `<b style="font-family:inter_18ptsemib;">Natural Style (Graph II): </b> Represents your innate traits, which remain consistent over time and may surface under stress. People close to you may notice your decisive and goal-focused nature more often in informal settings.`,
        ],

        your_personalized_behavioral_key_insights: "Key Insights:",

        your_personalized_behavioral_key_insights_list: [
            `When the two graphs are similar, your approach is consistent-what you see is what you get.`,
            `If Graph I shows significantly higher or lower points than Graph II, it may indicate you are adapting to meet external expectations, especially if you're constantly taking charge or driving results without adequate support.`,
            `Such adaptation can lead to stress if not balanced. Ensure those you work with understand your natural strengths and the importance of clear, goal-oriented collaboration.`,
        ],

        // Respond Parameter Table Data (from end of file logic)
        respond_parameter_table_data_HTML: `
        <tr>
            <td>$trait_combination</td>
            <td>Tackles conflicts head-on, prefers quick resolutions, and focuses on achieving results.</td>
            <td>Drives change decisively, sees it as an opportunity, but may overlook team readiness.</td>
            <td>Takes charge, provides direction, ensures goals are met, but might dominate discussions.</td>
            <td>Direct, action-oriented, goal-focused, but can be perceived as blunt.</td>
            <td>Implements bold strategies with measurable results, but may prioritize short-term wins.</td>
            <td>Focuses on high-impact initiatives aligned with organizational goals.</td>
        </tr>`,
        trait_combination: ["Dominance"],
        role_suggestions: [
            "Tackles conflicts head-on, prefers quick resolutions, and focuses on achieving results.",
        ],
        stress_areas: [
            "Drives change decisively, sees it as an opportunity, but may overlook team readiness.",
        ],
        recommended_focus_areas: [
            "Takes charge, provides direction, ensures goals are met, but might dominate discussions.",
        ],
        communication: [
            "Direct, action-oriented, goal-focused, but can be perceived as blunt.",
        ],
        sustainability: [
            "Implements bold strategies with measurable results, but may prioritize short-term wins.",
        ],
        social_responsibility: [
            "Focuses on high-impact initiatives aligned with organizational goals.",
        ],
        respond_parameter_row: [
            "Tackles conflicts head-on, prefers quick resolutions, and focuses on achieving results.",
            "Drives change decisively, sees it as an opportunity, but may overlook team readiness.",
            "Takes charge, provides direction, ensures goals are met, but might dominate discussions.",
            "Direct, action-oriented, goal-focused, but can be perceived as blunt.",
            "Implements bold strategies with measurable results, but may prioritize short-term wins.",
            "Focuses on high-impact initiatives aligned with organizational goals.",
        ],
    },

    I: {
        general_characteristics_for_student_1: `
    <p>The description below offers an overview of your behavioral tendencies, serving as a foundation for the insights presented in this report. It provides a framework to help you understand and reflect on your unique traits. Throughout the report, you will find coaching suggestions designed to help you leverage your strengths to achieve personal and professional success.</p>`,

        general_characteristics_for_student_2: `
    <p>You possess a strong confidence in your ability to inspire and motivate others to achieve desired outcomes. Your persuasive approach is not manipulative but rather focused on keeping the team engaged and aligned toward common goals. At times, you may feel disheartened when others don’t respond as expected. It’s important to remember that not everyone is equally receptive, and this should not diminish your belief in your motivational abilities.</p>
    <p>Your responses suggest that you exhibit a high energy level, especially in social situations, and excel at connecting with new people. This stems from a combination of qualities: a genuine interest in others, strong communication skills, a balanced sense of urgency, and an approachable demeanor. These traits enable you to effortlessly strike up conversations, even in casual settings, making you naturally adept at forming connections.</p>
    <p>You demonstrate a calm and composed approach to solving pressing problems, which is a significant strength during high-pressure situations. You have a talent for using humor or lighthearted remarks to ease tension and help the team refocus on the task at hand. Additionally, your ability to think on your feet and articulate your thoughts fluently makes you an effective contributor in dynamic environments.</p>
    <p>One of your standout qualities is the ability to transition seamlessly between seriousness and a more relaxed, lighthearted tone. This rare skill allows you to alleviate stress without undermining the gravity of the situation or offending others. Your thoughtful approach not only diffuses tension but also encourages creativity and problem-solving within the team, fostering a collaborative and productive atmosphere.</p>`,

        understanding_yourself_who_i_am_1: `
    <p>You have a natural ability to build and maintain a wide network of contacts, thanks to your sociable nature and ease in connecting with others. This extensive network can be a valuable asset to you, your team, and your organization, especially when problem-solving or brainstorming solutions. However, it’s worth noting that while sharing your connections is helpful, overemphasizing them in casual conversations might come across as name-dropping. Maintaining a mental list of contacts is beneficial, but there’s no need to over-discuss them with others.</p>
    <p>You are highly people-oriented, thriving on meaningful interactions and a desire to be liked by those around you. This makes you an empathetic and approachable individual. However, this strong connection to others can sometimes put you on an emotional roller coaster. When relationships are harmonious, you feel uplifted, but when there’s conflict or dissatisfaction, it can weigh heavily on you. In such situations, taking proactive steps to address concerns directly with those involved can help restore balance and strengthen relationships.</p>
    <p>Your willingness to take moderate to significant risks adds energy and spontaneity to your work and interactions. You occasionally surprise others with unexpected actions or ideas, keeping things dynamic and exciting. While this trait brings vitality to your environment, it’s important to stay mindful of its impact and ensure it doesn’t detract from your overall responsibilities. Playfulness and humor are great for lifting spirits, but maintaining reliability is key to earning trust and respect from your peers.</p>`,

        understanding_yourself_who_i_am_2: `
    <p>You are generally easy to get along with, showing genuine interest in others and approaching situations with optimism and patience. This makes you a natural fit for team environments, where your collaborative spirit and positive attitude are valued. Your ability to create a pleasant and productive atmosphere often makes you a go-to person for group projects or committee work. You consistently ensure tasks are completed effectively while fostering an enjoyable experience for everyone involved.</p>`,

        your_strength_what_you_bring_to_the_organization_1: `
    <p>You consistently demonstrate strength in building relationships, inspiring others, and fostering collaboration within your organization. These qualities enable you to thrive in team settings and contribute positively to organizational goals. Your natural tendencies and work style preferences provide valuable insights into how you operate and excel in your professional and personal endeavors.</p>`,

        your_strength_what_you_bring_to_the_organization_2: [
            `Frequently review and align your goals to stay focused and motivated.`,
            `Continuously seek ways to improve and refine your processes.`,
            `Stay informed about the latest trends and developments in your industry.`,
            `Actively seek constructive feedback from peers and mentors to grow and develop.`,
            `Adapt your strategies to remain effective in changing circumstance`,
        ],

        natural_bar_chart_data: [
            ["D", 30, [255, 49, 49]], // Red color
            ["I", 80, [232, 178, 54]], // Yellow color
            ["S", 50, [0, 173, 76]], // Green color
            ["C", 30, [74, 198, 234]], // Blue color
        ],

        motivations_and_need_your_personalized_insights_1: `
    <p>You are a vibrant and people-oriented individual who thrives on connections, recognition, and opportunities to express yourself. You have an innate ability to bring energy to any environment, making you a natural motivator and influencer. Your enthusiasm is contagious, and it’s clear that you find joy in inspiring others, sharing ideas, and making a meaningful impact in both personal and professional spaces.</p>`,

        motivations_and_need_your_personalized_insights_what_drives:
            "What Drives $full_name",

        motivations_and_need_your_personalized_insights_desc_1: `
    <p>At your core, you are motivated by the opportunity to shine and be recognized for your contributions. Whether it’s receiving praise for your creative ideas or being acknowledged for your efforts, these moments validate your hard work and keep you energized. Your ability to engage with others and create strong interpersonal bonds is one of your standout qualities. You find fulfillment in being part of dynamic teams or communities where you can make meaningful connections.</p>
    <p>Additionally, you are someone who values variety and excitement in your day-to-day activities. The thought of working on diverse projects or exploring new opportunities excites you. You thrive in environments where there’s room to innovate, contribute fresh perspectives, and feel like your voice is being heard. Being surrounded by people who share your passion for growth and creativity is essential for your motivation.</p>`,

        motivations_and_need_your_personalized_insights_unique_needs:
            "Your Unique Needs",

        motivations_and_need_your_personalized_insights_desc_2: `
    <p>While your motivations reflect your drive for connection and recognition, your needs center around finding balance and structure to support your ambitions. Feeling valued as an integral part of a team is essential to your sense of purpose. You perform best when you have confidence in the project, goals, and leadership around you.</p>
    <p>You also need frequent communication and collaboration to stay engaged. You excel in environments where discussions flow freely, and people are open to brainstorming and sharing ideas. At the same time, balancing creativity with practicality can help you stay grounded. A touch of organization in your work ensures that your enthusiasm is channeled effectively, avoiding unnecessary clutter or distractions.</p>`,

        motivations_and_need_your_personalized_insights_communication_tips:
            "Communication Tips for Connecting With $full_name",

        motivations_and_need_your_personalized_insights_communication_with_others:
            "How Others Can Best Communicate With $full_name",

        motivations_and_need_your_personalized_insights_desc_3: `
    <p>You appreciate conversations that are engaging, inspiring, and tailored to your goals. When others talk about your aspirations or provide testimonials from people you admire, you feel encouraged and understood. Clear instructions for next steps help you stay focused and confident, while social interactions and a friendly tone keep you engaged. Personal touches, like a genuine compliment or time for informal chats, build trust and strengthen relationships.</p>`,

        when_communicating_with_student_dos_title:
            "<p>When communicating with $full_name, DO’s</p>",

        when_communicating_with_student_dos: [
            "Use a positive and engaging tone to keep them interested.",
            "Show genuine interest in their ideas and encourage open discussion.",
            "Recognize and appreciate their contributions frequently.",
            "Allow them to brainstorm and share creative solutions.",
            "Use relatable examples, stories, or anecdotes to convey your message.",
        ],

        motivations_and_need_your_personalized_insights_2: `
    <p>You are less receptive to conversations that feel overly rigid or impersonal. Excessive focus on facts and figures can drain your energy, while criticism without constructive feedback may feel discouraging. Similarly, leaving decisions open-ended or failing to follow through on plans can frustrate you. You value closure and clarity, and being treated with respect and empathy goes a long way in ensuring productive interactions.</p>`,

        motivations_and_need_your_personalized_what_others_should_avoid:
            "What Others Should Avoid",

        when_communicating_with_student_dont: [
            "Don’t ignore or dismiss their ideas, even if they seem impractical at first.",
            "Avoid being overly serious or formal in your communication.",
            "Don’t focus solely on facts or data; include a personal touch.",
            "Avoid limiting their enthusiasm with rigid rules or restrictions.",
            "Don’t forget to acknowledge their need for recognition and feedback.",
        ],

        motivations_and_need_your_personalized_insights_3:
            "<p>When communicating with $full_name, DON’T</p>",

        motivations_and_need_your_personalized_insights_4: `
    <p>Your vibrant personality and optimistic outlook are among your greatest assets, but like any strength, they can be overextended. To ensure you continue to grow, here are some tailored recommendations for you:</p>
    <ol>
        <li><b style="font-family:sorasemib;">Delivering on Promises </b>
            <p style="line-height:2px;">&nbsp;</p>
            <p style="font-family:inter_18pt; text-align:justify;">Your enthusiasm can sometimes lead you to take on more than you can realistically manage. By learning to prioritize and set boundaries, you can ensure your commitments are met without feeling overwhelmed.</p>
        </li>
        <li><b style="font-family:sorasemib;">Active Listening </b>
            <p style="line-height:2px;">&nbsp;</p>
            <p style="font-family:inter_18pt; text-align:justify;">While your conversational skills are excellent, focusing more on listening can help you build deeper connections. Taking the time to fully understand other’s perspectives will enhance your relationships and decision-making.</p>
        </li>
        <li><b style="font-family:sorasemib;">Staying Focused </b>
            <p style="line-height:2px;">&nbsp;</p>
            <p style="font-family:inter_18pt; text-align:justify;">Your excitement about new ideas can occasionally distract you from existing priorities. Adopting tools like task lists or scheduling techniques can help you channel your energy effectively and maintain consistent productivity.</p>
        </li>
        <li><b style="font-family:sorasemib;">Digging Deeper </b>
            <p style="line-height:2px;">&nbsp;</p>
            <p style="font-family:inter_18pt; text-align:justify;">Your natural optimism might lead you to make quick decisions without analyzing all the details. Developing the habit of gathering more information before acting will strengthen your problem-solving skills.</p>
        </li>
        <li><b style="font-family:sorasemib;">Time Management </b>
            <p style="line-height:2px;">&nbsp;</p>
            <p style="font-family:inter_18pt; text-align:justify;">With your packed schedule and multiple interests, time management is key. Setting clear timelines and avoiding overcommitment will allow you to balance your aspirations with your well-being.</p>
        </li>
    </ol>`,

        your_personalized_behavioral_charts_1: `
    <p>Your ability to connect with others and inspire action is truly remarkable. You bring a unique energy that lifts those around you and fosters collaboration in any environment. Whether it’s through your creativity, leadership, or interpersonal skills, you leave a lasting impact wherever you go.</p>
    <p>As you continue to grow and develop, remember that your motivations and strengths are the foundation of your success. By staying mindful of your needs and areas for improvement, you can achieve even greater balance, productivity, and fulfillment. You are destined for greatness, and the journey ahead is yours to shape.</p>
    <p>Your <b style="font-family:inter_18ptsemib;">Adapted Style </b> highlights that you tend to adopt behaviors typical of an <b style="font-family:inter_18ptsemib;">I </b> style, focusing on enthusiasm, communication, and relationship-building in your current focus. Your <b style="font-family:inter_18ptsemib;">Natural Style </b> graph suggests that you instinctively rely on sociability, creativity, and an optimistic approach to situations.</p>`,

        your_personalized_behavioral_understanding_the_graphs:
            "Understanding the Graphs:",

        your_personalized_behavioral_understanding_the_graphs_list: [
            `<b style="font-family:inter_18ptsemib;">Adapted Style (Graph I): </b> Shows how you adjust to connect with others and maintain a lively, engaging atmosphere in different environments. This may shift when circumstances or expectations change.`,
            `<b style="font-family:inter_18ptsemib;">Natural Style (Graph II): </b> Reflects your core behaviors, which center around fostering relationships, motivating others, and bringing positivity. These traits often shine in casual or stress-free settings.`,
        ],

        your_personalized_behavioral_key_insights: "Key Insights:",

        your_personalized_behavioral_key_insights_list: [
            `When the two graphs align, your behavior is authentic, and others experience your natural charisma.`,
            `A significant difference between the graphs might mean you\'re pushing yourself to engage socially or maintain energy levels in ways that feel draining.`,
            `Balancing enthusiasm with practicality can help reduce stress while still leveraging your natural strengths in communication and collaboration.`,
        ],

        respond_parameter_table_data_HTML: `
        <tr>
            <td>$trait_combination</td>
            <td>Uses charm and optimism to diffuse tension but may avoid addressing deeper issues.</td>
            <td>Inspires excitement and enthusiasm for change but may overlook planning and details.</td>
            <td>Acts as a motivator, fosters collaboration, and keeps the team energized.</td>
            <td>Enthusiastic and engaging, often uses stories or examples to connect with others.</td>
            <td>Advocates for sustainability by raising awareness but needs to balance inspiration with execution.</td>
            <td>Builds strong community relationships and promotes causes with energy and passion.</td>
        </tr>`,
        trait_combination: ["Influence"],
        role_suggestions: [
            "Uses charm and optimism to diffuse tension but may avoid addressing deeper issues.",
        ],
        stress_areas: [
            "Inspires excitement and enthusiasm for change but may overlook planning and details.",
        ],
        recommended_focus_areas: [
            "Acts as a motivator, fosters collaboration, and keeps the team energized.",
        ],
        communication: [
            "Enthusiastic and engaging, often uses stories or examples to connect with others.",
        ],
        sustainability: [
            "Advocates for sustainability by raising awareness but needs to balance inspiration with execution.",
        ],
        social_responsibility: [
            "Builds strong community relationships and promotes causes with energy and passion.",
        ],
        respond_parameter_row: [
            "Uses charm and optimism to diffuse tension but may avoid addressing deeper issues.",
            "Inspires excitement and enthusiasm for change but may overlook planning and details.",
            "Acts as a motivator, fosters collaboration, and keeps the team energized.",
            "Enthusiastic and engaging, often uses stories or examples to connect with others.",
            "Advocates for sustainability by raising awareness but needs to balance inspiration with execution.",
            "Builds strong community relationships and promotes causes with energy and passion.",
        ],
    },

    S: {
        general_characteristics_for_student_1: `<p>The description below outlines your general behavioral tendencies, providing a foundation for the insights shared in this report. It serves as a guide to help you understand and reflect on your unique traits. Coaching suggestions are included to help you harness your strengths and achieve greater personal and professional success.</p>`,

        general_characteristics_for_student_2: `<p>You are naturally dependable and supportive, with a strong focus on maintaining harmony and stability in your environment. Your calm and steady demeanor makes you a source of reassurance for those around you. You thrive in situations where consistency and teamwork are valued, and you are often seen as the glue that holds a group together. However, you may occasionally avoid confrontation to maintain peace, and we encourage you to assert yourself when necessary to ensure your needs and opinions are heard.</p><p>Your responses indicate that you value loyalty and long-term relationships. You take pride in being a reliable and trustworthy team member who can be counted on to follow through on commitments. Your preference for predictable routines and structured environments allows you to perform effectively and contribute to a cohesive team dynamic. While change may feel uncomfortable at times, your adaptability and patience ensure that you can navigate transitions successfully when needed.</p>
<p>You have a strong inclination to support others and prioritize their needs, often going out of your way to create a sense of comfort and security. This makes you an excellent collaborator and someone who fosters positive relationships in both personal and professional settings. However, it’s important to strike a balance between helping others and taking care of your own goals and well-being.</p>
<p>One of your standout traits is your ability to remain calm and composed, even in stressful situations. Your steady nature provides a stabilizing influence on your team, enabling others to feel confident and focused during challenging times. While you may sometimes shy away from the spotlight, your quiet strength and dedication make a significant impact on those you work with.</p>
<p>Your consistent, thoughtful approach and commitment to creating harmonious environments are powerful assets. By embracing opportunities to step out of your comfort zone and assert your ideas more confidently, you can further enhance your contributions and achieve even greater success in your personal and professional endeavors.</p>`,

        understanding_yourself_who_i_am_1: `
    <p>You are a steady, reliable individual who values harmony and consistency in your environment. Your calm and composed nature makes you a trusted presence in any team, as others often look to you for stability and support during times of uncertainty. You thrive in environments where relationships are valued and teamwork is encouraged, and your patience ensures that you approach challenges with a thoughtful, measured response.</p>
    <p>You are deeply loyal and committed, forming strong connections with those you work with. This dedication often makes you the backbone of a team, ensuring that tasks are completed with care and attention to detail. However, your preference for maintaining peace may lead you to avoid confrontation or difficult conversations. While this helps to preserve harmony, addressing issues directly when needed can strengthen relationships and prevent misunderstandings.</p>
    <p>Your natural tendency to prioritize others’ needs makes you a valuable team player who ensures everyone feels included and supported. You excel in creating a sense of community and trust within your group. At times, however, it’s important to remember to balance your focus on others with self-care and personal goals to avoid feeling overextended.</p>`,

        understanding_yourself_who_i_am_2: `
    <p>You are highly adaptable and can handle change, though you prefer transitions to be gradual and well-communicated. Your ability to remain composed under pressure helps you navigate uncertainty effectively, but you may find sudden or unexpected changes challenging. Embracing flexibility and focusing on the bigger picture can help you thrive in more dynamic environments.</p>
    <p>Your dependable and empathetic nature makes you a stabilizing force in any setting. By combining your strength in fostering relationships with a proactive approach to addressing challenges, you can not only ensure harmony but also contribute to the growth and success of your team or organization.</p>`,

        your_strength_what_you_bring_to_the_organization_1: `
    <p>You bring a calming and stabilizing presence to your organization, excelling in teamwork and collaboration. Your ability to build trust and maintain harmony helps create a positive and productive work environment. Your consistent and dependable work style ensures that tasks are completed with care and precision.</p>`,

        your_strength_what_you_bring_to_the_organization_2: [
            "Approach tasks with a steady and methodical focus to ensure high-quality outcomes.",
            "Foster strong, long-term relationships based on trust and reliability.",
            "Act as a calming influence during stressful situations, helping maintain team morale.",
            "Demonstrate patience and persistence in achieving long-term goals.",
            "Show loyalty and commitment to team and organizational objectives.",
        ],

        natural_bar_chart_data: [
            ["D", 25, [255, 49, 49]], // Red color
            ["I", 35, [232, 178, 54]], // Yellow color
            ["S", 85, [0, 173, 76]], // Green color
            ["C", 40, [74, 198, 234]], // Blue color
        ],

        motivations_and_need_your_personalized_insights_1: `
    <p>You are a dependable and loyal individual who values harmony, stability, and meaningful relationships. Your calm and steady demeanor provides a sense of security to those around you, making you a natural collaborator and a trusted presence in both personal and professional settings. You find fulfillment in contributing to collective goals and fostering an environment where everyone feels valued and supported.</p>`,

        motivations_and_need_your_personalized_insights_what_drives:
            "What Drives $full_name",

        motivations_and_need_your_personalized_insights_desc_1: `
    <p>At your core, you are driven by the desire to create a stable and supportive environment for yourself and others. You find motivation in being part of a team where trust and mutual respect are the foundation of success. Knowing that your efforts are making a tangible difference in the lives of those around you gives you purpose and satisfaction.</p>
    <p>You are also motivated by the opportunity to form and nurture long-lasting relationships. Whether through your personal connections or professional partnerships, you take pride in the bonds you create and the positive impact you have on others. Challenges that align with your values and allow for consistent, thoughtful progress inspire you to perform at your best.</p>`,

        motivations_and_need_your_personalized_insights_unique_needs:
            "Your Unique Needs",

        motivations_and_need_your_personalized_insights_desc_2: `
    <p>Your needs center around maintaining stability, predictability, and clarity. Environments with clear expectations and minimal surprises are where you thrive. While you are adaptable to change, you prefer transitions that are gradual and well-communicated. This helps you feel secure and prepared.</p>
    <p>Feeling appreciated for your contributions is essential to your sense of purpose. While you don’t actively seek recognition, knowing that your efforts are valued reinforces your motivation. Balancing your focus on supporting others with attention to your personal goals is also key to maintaining your well-being and sense of fulfillment.</p>`,

        motivations_and_need_your_personalized_insights_communication_tips:
            "Communication Tips for Connecting With $full_name",

        motivations_and_need_your_personalized_insights_communication_with_others:
            "How Others Can Best Communicate With $full_name",

        motivations_and_need_your_personalized_insights_desc_3: `
    <p>You value conversations that are thoughtful, empathetic, and focused on collaboration. When others take the time to explain changes or decisions clearly, it helps you feel more confident and engaged. Encouragement and acknowledgment of your contributions build trust and reinforce your commitment to shared goals.</p>`,

        when_communicating_with_student_dos_title:
            "<p>When communicating with $full_name, DO’s</p>",

        when_communicating_with_student_dos: [
            "Take a calm and steady approach when discussing any topic.",
            "Emphasize teamwork and collaboration in your communication.",
            "Provide clear, step-by-step instructions or guidelines.",
            "Be empathetic and show that you value their perspective.",
            "Allow them time to process information and adapt to new ideas.",
        ],

        motivations_and_need_your_personalized_insights_2: `
    <p>You are less receptive to abrupt or overly critical communication. Rapid changes without context or explanation can feel unsettling, as you prefer to approach transitions with a clear plan. Avoid dismissing your concerns or rushing through discussions, as this can make you feel undervalued or unprepared.</p>`,

        motivations_and_need_your_personalized_what_others_should_avoid:
            "What Others Should Avoid",

        when_communicating_with_student_dont: [
            "Don’t pressure them for quick decisions or immediate actions.",
            "Avoid introducing abrupt changes without adequate preparation.",
            "Don’t create unnecessary conflict; instead, address issues gently.",
            "Avoid overlooking their efforts or contributions to the team.",
            "Don’t be too aggressive or forceful in your approach.",
        ],

        motivations_and_need_your_personalized_insights_3:
            "<p>When communicating with $full_name, DON’T</p>",

        motivations_and_need_your_personalized_insights_4: `
    <p>While your steadiness and loyalty are among your greatest strengths, there are areas where you can grow and enhance your impact. Here are some personalized recommendations for you:</p>
    <ol>
        <li><b style="font-family:sorasemib;">Building Assertiveness </b>
            <p style="line-height:2px;">&nbsp;</p>
            <p style="font-family:inter_18pt; text-align:justify;">Your preference for harmony can sometimes lead to avoiding conflict or difficult conversations. Practicing assertiveness ensures your needs and opinions are heard while maintaining respect for others.</p>
        </li>
        <li><b style="font-family:sorasemib;">Embracing Change </b>
            <p style="line-height:2px;">&nbsp;</p>
            <p style="font-family:inter_18pt; text-align:justify;">While you thrive in stable environments, being open to change and innovation can help you adapt more easily to dynamic situations. Viewing change as an opportunity for growth can strengthen your resilience.</p>
        </li>
        <li><b style="font-family:sorasemib;">Balancing Support with Self-Care </b>
            <p style="line-height:2px;">&nbsp;</p>
            <p style="font-family:inter_18pt; text-align:justify;">Your dedication to supporting others may lead you to neglect your own goals or well-being. Setting boundaries and prioritizing self-care ensures you can sustain your contributions.</p>
        </li>
        <li><b style="font-family:sorasemib;">Taking Initiative </b>
            <p style="line-height:2px;">&nbsp;</p>
            <p style="font-family:inter_18pt; text-align:justify;">While you are a strong team player, stepping into leadership roles or taking initiative in new areas can expand your impact and boost your confidence.</p>
        </li>
    </ol>`,

        your_personalized_behavioral_charts_1: `
    <p>Your steady, supportive nature and commitment to fostering harmony make you an invaluable asset to any team. By balancing your focus on relationships with assertiveness and adaptability, you can continue to thrive and inspire those around you. Your thoughtful approach and genuine care for others ensure that you leave a lasting, positive impression wherever you go.</p>
    <p>Your <b style="font-family:inter_18ptsemib;">Adapted Style </b> suggests that you focus on behaviors that align with the <b style="font-family:inter_18ptsemib;">S </b> style-showing patience, reliability, and supportiveness in your selected focus area. Your <b style="font-family:inter_18ptsemib;">Natural Style </b> graph indicates that you are naturally inclined toward creating harmony and maintaining stability in relationships and tasks.</p>`,

        your_personalized_behavioral_understanding_the_graphs:
            "Understanding the Graphs:",

        your_personalized_behavioral_understanding_the_graphs_list: [
            `<b style="font-family:inter_18ptsemib;">Adapted Style (Graph I): </b> Represents how you adjust your behaviors to support others, avoid conflict, and create balance in demanding environments. This might change as roles or expectations shift.`,
            `<b style="font-family:inter_18ptsemib;">Natural Style (Graph II): </b> Reflects your default approach, which values steadiness, loyalty, and a methodical approach to handling situations. These traits often surface in familiar or low-pressure settings.`,
        ],

        your_personalized_behavioral_key_insights: "Key Insights:",

        your_personalized_behavioral_key_insights_list: [
            `When both graphs are similar, your behavior aligns with your natural strengths, ensuring stability for yourself and those around you.`,
            `If the points differ significantly, it could indicate you\'re over-adapting to meet other\'s demands, especially if you\'re constantly trying to accommodate rapid changes or high-pressure tasks.`,
            `Recognize the importance of steady workflows and clear communication to minimize stress and maintain balance.`,
        ],

        respond_parameter_table_data_HTML: `
        <tr>
            <td>$trait_combination</td>
            <td>Avoids conflict, promotes harmony, and seeks peaceful resolutions, sometimes at the expense of assertiveness.</td>
            <td>Prefers gradual and well-communicated change, focusing on stability and reassurance.</td>
            <td>Provides calm, steady support and ensures harmony within the team.</td>
            <td>Patient, supportive, focused on listening but may hesitate to voice strong opinions.</td>
            <td>Supports long-term, consistent initiatives and ensures a balanced approach to sustainability.</td>
            <td>Builds trust and long-term commitment to social causes, focusing on steady progress.</td>
        </tr>`,
        trait_combination: ["Steadiness"],
        role_suggestions: [
            "Avoids conflict, promotes harmony, and seeks peaceful resolutions, sometimes at the expense of assertiveness.",
        ],
        stress_areas: [
            "Prefers gradual and well-communicated change, focusing on stability and reassurance.",
        ],
        recommended_focus_areas: [
            "Provides calm, steady support and ensures harmony within the team.",
        ],
        communication: [
            "Patient, supportive, focused on listening but may hesitate to voice strong opinions.",
        ],
        sustainability: [
            "Supports long-term, consistent initiatives and ensures a balanced approach to sustainability.",
        ],
        social_responsibility: [
            "Builds trust and long-term commitment to social causes, focusing on steady progress.",
        ],
        respond_parameter_row: [
            "Avoids conflict, promotes harmony, and seeks peaceful resolutions, sometimes at the expense of assertiveness.",
            "Prefers gradual and well-communicated change, focusing on stability and reassurance.",
            "Provides calm, steady support and ensures harmony within the team.",
            "Patient, supportive, focused on listening but may hesitate to voice strong opinions.",
            "Supports long-term, consistent initiatives and ensures a balanced approach to sustainability.",
            "Builds trust and long-term commitment to social causes, focusing on steady progress.",
        ],
    },

    C: {
        general_characteristics_for_student_1: `
    <p>The description below outlines your behavioral tendencies, offering a foundation for the insights in this report. It helps you reflect on your unique traits and how they influence your interactions and decisions. Coaching suggestions are provided to help you leverage your strengths for personal and professional growth.</p>`,

        general_characteristics_for_student_2: `
    <p>You have a natural inclination toward precision, quality, and structure. Your analytical mindset and attention to detail ensure that tasks are approached thoughtfully and executed with a high degree of accuracy. You thrive in environments where rules and processes are clearly defined, and you take pride in producing work that meets or exceeds expectations. While your standards are a key strength, it’s important to remain flexible when situations call for adaptability.</p>
    <p>Your responses indicate a strong preference for logic and objectivity when making decisions. You excel at analyzing information, identifying patterns, and solving complex problems. These skills make you highly effective in roles that require careful planning and systematic execution. However, your focus on getting things "just right " may sometimes lead to overanalysis or hesitation to act quickly. We encourage you to trust your instincts and take calculated risks when necessary.</p>
    <p>You are naturally inclined to follow established procedures and maintain high standards of excellence. This makes you a reliable and trustworthy team member who ensures that work is completed with integrity and thoroughness. While your preference for structure is a strength, being open to alternative methods or innovative approaches can further enhance your effectiveness and adaptability.</p>
    <p>One of your key traits is your ability to remain composed and methodical under pressure. You bring a sense of stability and order to your team, ensuring that even in challenging situations, tasks are approached systematically and with care. Your conscientious nature fosters trust among colleagues and superiors, as they know they can rely on your meticulous work ethic.</p>
    <p>Your commitment to accuracy, logical thinking, and maintaining high standards is a significant strength. By balancing your need for structure with a willingness to embrace change and collaborate more openly, you can achieve remarkable results while building strong and dynamic relationships within your team or organization.</p>`,

        understanding_yourself_who_i_am_1: `
    <p>You are a detail-oriented and methodical individual who values structure, accuracy, and quality in all that you do. Your strong focus on precision ensures that tasks are completed to a high standard, and you take pride in producing work that reflects thoroughness and excellence. You thrive in environments where expectations are clear, processes are well-defined, and rules are followed, as this aligns with your natural preference for order and consistency.</p>
    <p>Your analytical mindset allows you to approach problems logically and objectively, making you skilled at identifying potential issues and developing well-thought-out solutions. This makes you a valuable asset in roles that require critical thinking and attention to detail. However, your commitment to perfection may sometimes lead to overanalyzing situations or delaying decisions. Balancing your desire for accuracy with the need to act promptly can enhance your effectiveness.</p>
    <p>You tend to approach tasks with a strong sense of responsibility, ensuring that every detail is accounted for and that nothing is overlooked. While this dedication is one of your strengths, it’s important to recognize that not everyone shares the same level of focus on details. Learning to delegate and trust others can help you manage your workload and foster stronger collaboration.</p>`,

        understanding_yourself_who_i_am_2: `
    <p>Your preference for following established processes and adhering to guidelines ensures that your work is consistent and reliable. While this makes you a dependable team member, being open to new methods and innovative approaches can help you adapt to changing circumstances and explore fresh opportunities for growth.</p>
    <p>You excel in environments that value careful planning and high standards. By balancing your focus on precision with a willingness to embrace flexibility and collaboration, you can achieve outstanding results while building strong, dynamic relationships with those around you. Your conscientious nature and commitment to quality are powerful assets that contribute significantly to your personal and professional success.</p>`,

        your_strength_what_you_bring_to_the_organization_1: `
    <p>You bring a high level of precision, organization, and analytical thinking to your organization. Your commitment to quality and thoroughness ensures that tasks are completed accurately and consistently. Your work style is grounded in logic, structure, and a strong sense of responsibility.</p>`,

        your_strength_what_you_bring_to_the_organization_2: [
            "Analyze problems thoroughly and develop well-reasoned solutions.",
            "Maintain a high standard of accuracy and attention to detail in your work.",
            "Follow established processes and guidelines to ensure consistency and reliability.",
            "Remain composed and focused, even under pressure or tight deadlines.",
            "Demonstrate responsibility and dedication to delivering high-quality outcomes.",
        ],

        natural_bar_chart_data: [
            ["D", 20, [255, 49, 49]], // Red color
            ["I", 25, [232, 178, 54]], // Yellow color
            ["S", 40, [0, 173, 76]], // Green color
            ["C", 90, [74, 198, 234]], // Blue color
        ],

        motivations_and_need_your_personalized_insights_1: `
    <p>You are a meticulous and detail-oriented individual who thrives on structure, precision, and quality. Your analytical mindset and commitment to excellence ensure that your contributions are thoughtful, reliable, and impactful. You find fulfillment in solving complex problems and creating systems that enhance efficiency and accuracy.</p>`,

        motivations_and_need_your_personalized_insights_what_drives:
            "What Drives $full_name",

        motivations_and_need_your_personalized_insights_desc_1: `
    <p>At your core, you are motivated by the desire to produce high-quality work and make well-informed decisions. Whether it’s analyzing data, improving processes, or ensuring accuracy, you take pride in your ability to create order and deliver results that meet or exceed expectations.</p>
    <p>Recognition for your expertise and logical approach is a key driver for you. Being valued for your thoroughness and attention to detail keeps you engaged and inspired. Challenges that allow you to apply your critical thinking skills and focus on meaningful details align perfectly with your natural tendencies.</p>`,

        motivations_and_need_your_personalized_insights_unique_needs:
            "Your Unique Needs",

        motivations_and_need_your_personalized_insights_desc_2: `
    <p>To thrive, you need an environment that values structure, clear expectations, and consistency. Ambiguity or last-minute changes can feel overwhelming, so having a clear plan and well-defined objectives helps you stay focused and confident. You also need time to process information and evaluate options before making decisions, as this ensures that your conclusions are thorough and well-founded.</p>
    <p>While you may prefer to work independently, collaborating with others who respect your expertise and precision can enhance your impact. Balancing your focus on perfection with flexibility allows you to adapt to dynamic situations and embrace new opportunities.</p>`,

        motivations_and_need_your_personalized_insights_communication_tips:
            "Communication Tips for Connecting With $full_name",

        motivations_and_need_your_personalized_insights_communication_with_others:
            "How Others Can Best Communicate With $full_name",

        motivations_and_need_your_personalized_insights_desc_3: `
    <p>You appreciate communication that is clear, logical, and well-organized. Providing detailed explanations and justifications for decisions or changes helps you feel confident and engaged. Acknowledging your attention to detail and the value of your contributions builds trust and reinforces your motivation.</p>`,

        when_communicating_with_student_dos_title:
            "<p>When communicating with $full_name, DO’s</p>",

        when_communicating_with_student_dos: [
            "Communicate clearly and provide all the necessary details.",
            "Use logic and evidence to support your points, as they prefer objective reasoning.",
            "Be prepared with structured plans and accurate information.",
            "Respect their focus on precision and high-quality work.",
            "Give them sufficient time to analyze information and make decisions.",
        ],

        motivations_and_need_your_personalized_insights_2: `
    <p>You are less receptive to vague or emotional communication that lacks structure or clarity. Rushed decisions or last-minute changes without adequate explanation can feel stressful. Avoid dismissing your need for thoroughness or undervaluing the importance of precision in your work.</p>`,

        motivations_and_need_your_personalized_what_others_should_avoid:
            "What Others Should Avoid",

        when_communicating_with_student_dont: [
            "Avoid being vague or imprecise in your communication.",
            "Don’t rush them into making quick decisions without proper analysis.",
            "Avoid emotional arguments or subjective reasoning.",
            "Don’t ignore established rules or processes they rely on.",
            "Avoid disrupting their workflow unnecessarily or creating ambiguity.",
        ],

        motivations_and_need_your_personalized_insights_3:
            "<p>When communicating with $full_name, DON’T</p>",

        motivations_and_need_your_personalized_insights_4: `
    <p>Your analytical and perfectionist tendencies are among your greatest strengths, but they can sometimes create challenges. To continue growing and achieving your full potential, consider the following recommendations:</p>
    <ol>
        <li><b style="font-family:sorasemib;">Balancing Perfection with Action </b>
            <p style="line-height:2px;">&nbsp;</p>
            <p style="font-family:inter_18pt; text-align:justify;">While striving for excellence is admirable, learning to accept “good enough” when necessary allows you to move forward without overanalyzing.</p>
        </li>
        <li><b style="font-family:sorasemib;">Embracing Flexibility </b>
            <p style="line-height:2px;">&nbsp;</p>
            <p style="font-family:inter_18pt; text-align:justify;">Being open to new methods or ideas, even if they deviate from your usual approach, can help you adapt more easily to change and innovation.</p>
        </li>
        <li><b style="font-family:sorasemib;">Strengthening Collaboration </b>
            <p style="line-height:2px;">&nbsp;</p>
            <p style="font-family:inter_18pt; text-align:justify;">While you excel independently, building stronger collaborative skills enhances your ability to work with diverse teams and leverage others" perspectives.</p>
        </li>
        <li><b style="font-family:sorasemib;">Prioritizing Time Management </b>
            <p style="line-height:2px;">&nbsp;</p>
            <p style="font-family:inter_18pt; text-align:justify;">Your focus on details can sometimes lead to spending more time than necessary on tasks. Developing time management strategies ensures that your productivity is maximized.</p>
        </li>
        <li><b style="font-family:sorasemib;">Building Confidence in Decision-Making </b>
            <p style="line-height:2px;">&nbsp;</p>
            <p style="font-family:inter_18pt; text-align:justify;">Trusting your expertise and intuition allows you to make decisions more confidently, even when all the details aren’t perfectly aligned.</p>
        </li>
    </ol>`,

        your_personalized_behavioral_charts_1: `
    <p>Your commitment to excellence, logical thinking, and attention to detail set you apart as a true expert in your field. By balancing your precision with adaptability and collaboration, you can achieve even greater impact while building meaningful relationships. Your journey is one of precision and purpose, and the possibilities ahead are limitless.</p>
    <p>Your <b style="font-family:inter_18ptsemib;">Adapted Style </b> shows that you emphasize behaviors aligned with the <b style="font-family:inter_18ptsemib;">C </b> style, focusing on precision, structure, and attention to detail in your current focus area. Your <b style="font-family:inter_18ptsemib;">Natural Style </b> graph highlights your instinctive preference for quality, accuracy, and logical decision-making.</p>`,

        your_personalized_behavioral_understanding_the_graphs:
            "Understanding the Graphs:",

        your_personalized_behavioral_understanding_the_graphs_list: [
            `<b style="font-family:inter_18ptsemib;">Adapted Style (Graph I): </b> Reflects how you adjust to meet expectations, possibly prioritizing thoroughness and compliance in specific roles. These behaviors may vary based on changing requirements or environments.`,
            `<b style="font-family:inter_18ptsemib;">Natural Style (Graph II): </b> Reveals your intrinsic traits, including a methodical and analytical approach. These tendencies often emerge when you\'re relaxed or under stress.`,
        ],

        your_personalized_behavioral_key_insights: "Key Insights:",

        your_personalized_behavioral_key_insights_list: [
            `If both graphs align, it indicates your behavior is consistent, and you’re able to rely on your natural strengths in precision and logic.`,
            `Significant differences between the graphs might suggest you\'re over-adapting to meet external demands, such as responding to ambiguous or unstructured situations that require creativity over accuracy.`,
            `Creating systems or clarifying expectations can help reduce stress and allow you to focus on your strengths in producing high-quality work.`,
        ],

        respond_parameter_table_data_HTML: `
        <tr>
            <td>$trait_combination</td>
            <td>Analyzes conflicts objectively, uses facts to resolve issues but may seem emotionally detached.</td>
            <td>Evaluates change carefully, focuses on planning and minimizing risks, but may delay action.</td>
            <td>Provides structure, ensures accuracy, and focuses on quality but may struggle with flexibility.</td>
            <td>Precise, factual, and data-driven, but may lack emotional warmth.</td>
            <td>Develops detailed, data-backed strategies, ensures compliance, and measures success accurately.</td>
            <td>Focuses on structured, evidence-based initiatives with clear accountability.</td>
        </tr>`,
        trait_combination: ["Conscientiousness"],
        role_suggestions: [
            "Analyzes conflicts objectively, uses facts to resolve issues but may seem emotionally detached.",
        ],
        stress_areas: [
            "Evaluates change carefully, focuses on planning and minimizing risks, but may delay action.",
        ],
        recommended_focus_areas: [
            "Provides structure, ensures accuracy, and focuses on quality but may struggle with flexibility.",
        ],
        communication: [
            "Precise, factual, and data-driven, but may lack emotional warmth.",
        ],
        sustainability: [
            "Develops detailed, data-backed strategies, ensures compliance, and measures success accurately.",
        ],
        social_responsibility: [
            "Focuses on structured, evidence-based initiatives with clear accountability.",
        ],
        respond_parameter_row: [
            "Analyzes conflicts objectively, uses facts to resolve issues but may seem emotionally detached.",
            "Evaluates change carefully, focuses on planning and minimizing risks, but may delay action.",
            "Provides structure, ensures accuracy, and focuses on quality but may struggle with flexibility.",
            "Precise, factual, and data-driven, but may lack emotional warmth.",
            "Develops detailed, data-backed strategies, ensures compliance, and measures success accurately.",
            "Focuses on structured, evidence-based initiatives with clear accountability.",
        ],
    },

    // STATIC SECTIONS FROM obicollegereport.php
    about_report: `The <b>Origin BI Self Discovery Report </b> is designed to provide deep insights into an individual’s behavioral tendencies, strengths, motivations, and areas for growth. By understanding these unique traits through the lens of the DISC framework (Dominance, Influence, Steadiness, and Conscientiousness), this Report empowers individuals to make informed decisions about their personal and professional lives.`,

    purpose_items: [
        "To enhance self-awareness by identifying behavioral patterns and preferences.",
        "To provide actionable insights into how individuals interact with others and approach challenges.",
        "To align career goals with inherent strengths and behavioral traits.",
        "To foster personal growth by highlighting areas for improvement and offering guidance for development.",
    ],

    why_matters: `In a world where personal and professional success is closely tied to understanding oneself and others, the Origin BI Self Discovery Report acts as a guiding tool. It helps individuals:`,
    why_matters_items: [
        `Discover their natural work style and communication preferences.`,
        `Build stronger relationships by understanding how they and others function in various environments.`,
        `Leverage their unique traits to excel in chosen career paths.`,
    ],

    what_you_gain: [
        "A comprehensive analysis of your DISC profile.",
        "Personalized strategies for growth and success.",
        "Tailored career recommendations to align with your natural strengths.",
        "Insights to improve teamwork, leadership, and overall effectiveness",
    ],

    about_obi_self_discovery_report: `At <b>Origin BI </b>, we believe every individual has the potential to excel when they are equipped with the right knowledge and tools. The <b>Origin BI Self Discovery Report </b> is our step toward unlocking that potential.`,

    benefits_identifying_suitable_career_paths: `Choosing the right career path is a transformative decision that can shape your life, providing both personal fulfillment and professional growth. In today’s dynamic world, where the lines between work, passion, and purpose often blur, aligning your career with your strengths and values is crucial. The <b>Origin BI Self Discovery Report </b> empowers you with deep insights to navigate this journey with clarity, confidence, and a sense of purpose.`,

    benefits_identifying_suitable_career_paths_para_2: `Identifying a career that matches your unique behavioral traits is not just about finding a job - it’s about discovering where you can thrive, make a meaningful impact, and feel genuinely valued.A well-chosen career enhances your ability to excel, adapt, and find joy in the work you do, fostering resilience in a world that demands flexibility and innovation.`,

    why_identifying_right_career: `A career that aligns with your natural strengths and personality can lead to higher productivity and a greater sense of achievement. It allows you to leverage your inherent abilities, perform at your best, and create a sense of purpose. Beyond personal success, understanding your behavioral tendencies can help you foster strong relationships, collaborate effectively, and adapt seamlessly to diverse work environments.In a fast-paced and competitive world, these traits are essential for both personal satisfaction and professional success.`,

    why_identifying_right_career_para_2: `Moreover, identifying the right career path opens doors to continuous learning and growth. With a deeper understanding of your motivators and work preferences, you can proactively seek opportunities that challenge and inspire you, ultimately helping you build a fulfilling and sustainable career.`,

    how_this_report_helps_you: `This Report offers a personalized analysis of your behavioral tendencies, motivators, and areas of improvement. It provides clarity on:`,
    how_this_report_helps_list: [
        "The roles and work environments where you are most likely to excel.",
        "The key drivers behind your success and satisfaction.",
        "Practical recommendations to align your career with your DISC profile.",
    ],
    how_this_report_helps_you_para_2: `The insights gained from this report serve as a foundational guide to help you explore career paths that suit your unique traits. Whether you're at the beginning of your career journey or looking to pivot in a new direction, this report is a tool to inform and inspire your next steps.`,
    important_note:
        "This report is not a definitive answer to your career decisions but a thoughtful starting point. It highlights possibilities rather than limiting options, reminding you that the world is full of opportunities waiting to be explored.While the suggested roles align with your DISC profile, your career journey will be shaped by your experiences, passions, and evolving aspirations. Embrace this report as a stepping stone to self-discovery, and remain open to the boundless opportunities that lie ahead.",

    disclaimer: `The Origin BI Self Discovery Report is designed as a self-evaluation tool to provide insights into your behavioral characteristics and traits. It is intended to serve as a guide for self-discovery and personal reflection, particularly in the context of career exploration and guidance. Please note that the traits and characteristics identified in this Report are based on your responses and may evolve over time with changes in circumstances, roles, or experiences. This report is not definitive and should not be considered a substitute for professional advice.`,
    limitations: [
        "This report offers an indicative understanding of your behavioral tendencies. It is not an absolute or unchanging representation of your personality or abilities.",
        "The results should be viewed as a starting point for personal and professional growth, not as a final judgment on your potential or future capabilities.",
        "Career-related decisions should always be supported by additional research, consultation, and exploration beyond the scope of this Report.",
    ],
    warranties_1: `1. Origin BI makes no warranties, express or implied, regarding the accuracy, adequacy, interpretation, or usefulness of the Origin BI Self Discovery Report.`,
    warranties_2: `2. The use of this Report is at your own discretion, and Origin BI shall not be held liable for:`,
    warranty_list: [
        "Your use or application of the Report results.",
        "The adequacy, accuracy, or interpretation of the information provided.",
        "Any decisions made or actions taken based on the Report.",
    ],
    indemnity_desc_1: `By using this Report, you agree to waive any claims or rights of recourse against Origin BI. You also agree to indemnify and hold Origin BI harmless from any claims, liabilities, demands, or suits brought by third parties arising from:`,
    indemnity_desc_2: `This waiver and indemnity apply to all claims for personal injury, property damage, or other loss or liability, whether arising from contract, tort (including negligence), or other legal theories.`,
    indemnity_list: [
        "Your use or application of the Report.",
        "The results or information derived from it.",
    ],
    damages_desc_1: `Origin BI shall not be held responsible for any indirect, incidental, consequential, or punitive damages, including but not limited to loss of profits or claims made by third parties, even if advised of the possibility of such damages.`,
    damages_desc_2: `This Assessment is intended solely as a tool to provide insight and foster self-awareness. While it can support career guidance, decisions should be made with a comprehensive understanding of all influencing factors. Please consider this as one of many resources in your journey of self-discovery and professional development.`,
    word_sketch_1: `This Word Sketch chart represents your Natural Graph - how you are when you are “at home” or relaxed. It also may be how you are under sudden pressure. Make note if the same graph points at work is 30% higher or lower than these on the Graph I chart.`,
    word_sketch_2: `Do you know why? Is it your job? Use words on this page to describe yourself and give examples of what’s most important to you when it comes to being in charge of (D)ominating Problems, (I)nfluencing People, (S)teadying the Pace of Activity, and (C)omplying to Procedures.`,
    word_sketch_3: `Use the highlighted blocks of words and describe how this style works for you. If you need or want to change something so you could get different results, which words on this chart would you use more - or less often? Behavior is always a choice. If your natural style is working for you, keep it. If not, use this chart to practice making new choices.`,
};

export const MAPPING: { [key: string]: TechSkill[] } = {
    DI: [
        { label: "Quantum Strategy Consultant", start: 29, end: 35 },
        { label: "Web3", start: 30, end: 35 },
        { label: "Synthetic Biology", start: 30, end: 35 },
        { label: "Brain-Computer Interfaces", start: 32, end: 35 },
        { label: "AI Product Intelligence", start: 27, end: 35 },
        { label: "Metaverse", start: 30, end: 35 },
    ],
    DS: [
        { label: "AgriTech", start: 29, end: 35 },
        { label: "EdTech Experience", start: 30, end: 35 },
        { label: "Remote Work Tech", start: 30, end: 35 },
        { label: "FinTech Experience", start: 30, end: 35 },
        { label: "Workforce Scaling Tech", start: 28, end: 35 },
        { label: "Digital Transformation", start: 27, end: 35 },
    ],
    DC: [
        { label: "Space Systems", start: 30, end: 35 },
        { label: "Blockchain Infrastructure", start: 28, end: 35 },
        { label: "Quantum Computing", start: 29, end: 35 },
        { label: "Autonomous Systems", start: 32, end: 35 },
        { label: "Financial Risk Intelligence", start: 27, end: 35 },
        { label: "Precision Medicine", start: 30, end: 35 },
    ],
    ID: [
        { label: "Web3 Branding", start: 29, end: 35 },
        { label: "AI Business Acceleration", start: 28, end: 35 },
        { label: "Digital Influence", start: 27, end: 35 },
        { label: "Synthetic Identity", start: 32, end: 35 },
        { label: "AI Startup Acceleration", start: 30, end: 35 },
        { label: "Immersive Influence", start: 34, end: 35 },
    ],
    IS: [
        { label: "Tech Mentorship", start: 27, end: 35 },
        { label: "Emotional AI", start: 30, end: 35 },
        { label: "Community Innovation", start: 32, end: 35 },
        { label: "Workplace Wellbeing Tech", start: 29, end: 35 },
        { label: "Developer Communities", start: 27, end: 35 },
        { label: "Human-AI Collaboration", start: 33, end: 35 },
    ],
    IC: [
        { label: "Technology Branding", start: 27, end: 35 },
        { label: "Virtual Brand Experience", start: 30, end: 35 },
        { label: "Neurotechnology Interfaces", start: 33, end: 35 },
        { label: "AI Communication", start: 29, end: 35 },
        { label: "Developer Relations", start: 27, end: 35 },
        { label: "Innovation Storytelling", start: 28, end: 35 },
    ],
    SI: [
        { label: "Collaborative Tech", start: 27, end: 35 },
        { label: "Empathy-Driven Interfaces", start: 28, end: 35 },
        { label: "Virtual Mentorship", start: 29, end: 35 },
        { label: "Emotional Intelligence AI", start: 31, end: 35 },
        { label: "Purpose-Driven Innovation", start: 33, end: 35 },
        { label: "Inclusive Design", start: 30, end: 35 },
    ],
    SD: [
        { label: "Operational Intelligence", start: 27, end: 35 },
        { label: "Supply Chain Analytics", start: 28, end: 35 },
        { label: "Autonomous Supply Networks", start: 32, end: 35 },
        { label: "Cloud Infrastructure", start: 29, end: 35 },
        { label: "Self-Optimizing Systems", start: 34, end: 35 },
        { label: "AI-Driven Process Control", start: 31, end: 35 },
    ],
    SC: [
        { label: "Quality Engineering", start: 27, end: 35 },
        { label: "IT Service Delivery", start: 28, end: 35 },
        { label: "Infrastructure Management", start: 32, end: 35 },
        { label: "Technology Lifecycle Planning", start: 34, end: 35 },
        { label: "Sustainable Process Design", start: 30, end: 35 },
        { label: "Data Governance", start: 28, end: 35 },
    ],
    CD: [
        { label: "Enterprise Architecture", start: 27, end: 35 },
        { label: "Digital Operations", start: 29, end: 35 },
        { label: "Predictive Compliance", start: 32, end: 35 },
        { label: "IT Governance Automation", start: 34, end: 35 },
        { label: "AI Decision Support", start: 30, end: 35 },
        { label: "Change Management", start: 28, end: 35 },
    ],
    CI: [
        { label: "Product Strategy", start: 28, end: 35 },
        { label: "Developer Experience", start: 27, end: 35 },
        { label: "Knowledge Intelligence", start: 29, end: 35 },
        { label: "Compliance Automation", start: 31, end: 35 },
        { label: "Self-Auditing Systems", start: 33, end: 35 },
        { label: "Data Storytelling", start: 30, end: 35 },
    ],
    CS: [
        { label: "Sustainable Processes", start: 30, end: 35 },
        { label: "Infrastructure Management", start: 32, end: 35 },
        { label: "Data Governance", start: 28, end: 35 },
        { label: "Software Maintenance", start: 27, end: 35 },
        { label: "Tech Lifecycle Planning", start: 34, end: 35 },
        { label: "Workload Optimization", start: 33, end: 35 },
    ],
};

export const blendedTraits: {
    [key: string]: {
        name: string;
        description: string;
        suggestions: string;
        key_behaviours: string[];
        typical_scenarios: string[];
        trait_mapping1: string[][];
        trait_mapping2: string[][];
    };
} = {
    DI: {
        name: "Charismatic Leader",
        description:
            "You are a bold and energetic leader who thrives on challenges and excels at inspiring others. Your charisma and drive for results make you a standout in dynamic, high-impact environments.",
        suggestions:
            "Startup Founder, Business Strategist, Metaverse Brand Architect, Public Relations Director",
        key_behaviours: [
            "Takes charge confidently and motivates teams with enthusiasm.",
            "Thrives on challenges, consistently aiming for ambitious goals.",
            "Combines vision with execution, ensuring impactful results.",
            "Builds strong relationships through persuasive communication.",
            "Adapts quickly to changing circumstances and thinks on their feet.",
            "Encourages creativity and innovation within teams.",
            "Leads by example and earns trust through action.",
            "Enjoys recognition for accomplishments and uses it as motivation.",
        ],
        typical_scenarios: [
            "Leading a sales team to secure a high-stakes deal.",
            "Spearheading a marketing campaign that drives brand awareness.",
            "Managing a fast-paced project with tight deadlines and dynamic teams.",
            "Motivating a team to achieve ambitious growth targets during a product launch.",
        ],
        trait_mapping1: [
            [
                "Charismatic Leader",
                "Visionary Leader, Business Development Head, Strategic Consultant, Sales Director, Innovation Catalyst",
                "Overconfidence, impatience, difficulty delegating tasks",
                "Leadership, business strategy, innovation mindset",
            ],
        ],
        trait_mapping2: [
            [
                "Charismatic Leader",
                "Visionary Leader, Business Development Head, Strategic Consultant, Sales Director, Innovation Catalyst",
                "Routine tasks, compliance, and long-term planning.",
                "Driving innovation, inspiring teams, building partnerships.",
            ],
        ],
    },
    DS: {
        name: "Strategic Stabilizer",
        description:
            "You are a decisive yet dependable individual who balances results with long-term stability. Your ability to create harmony while driving progress makes you a natural mediator and strategic thinker.",
        suggestions:
            "Sustainability Engineer, Smart Logistics Manager, Urban Planner, ESG Consultant",
        key_behaviours: [
            "Balances assertiveness with thoughtfulness and patience.",
            "Thrives in roles requiring long-term planning and structured decision-making.",
            "Acts as a stabilizing force during challenging situations.",
            "Encourages collaboration and ensures team alignment.",
            "Resolves conflicts with a practical, solution-oriented approach.",
            "Focuses on sustainable success rather than short-term wins.",
            "Adapts to shifting priorities without losing sight of objectives.",
            "Demonstrates loyalty and consistency in professional relationships.",
        ],
        typical_scenarios: [
            "Managing a cross-functional team to deliver a complex project.",
            "Overseeing operations during a company restructuring process.",
            "Resolving conflicts between teams to ensure smooth project execution.",
            "Leading a program to streamline workflows while maintaining team morale.",
        ],
        trait_mapping1: [
            [
                "Strategic Stabilizer",
                "Operations Architect, Project Manager, Growth Strategist, Supply Chain Manager, Program Director",
                "Resistance to change, risk aversion, overcommitting to plans",
                "Long-term project execution, risk management, reliability",
            ],
        ],
        trait_mapping2: [
            [
                "Strategic Stabilizer",
                "Operations Architect, Project Manager, Growth Strategist, Supply Chain Manager, Program Director",
                "High-pressure environments, rapid decision-making, or risk-heavy ventures.",
                "Reliability, scalability, long-term operational strategy.",
            ],
        ],
    },
    DC: {
        name: "Decisive Analyst",
        description:
            "You are a results-oriented thinker who thrives in roles requiring precision and strategy. Your analytical skills and focus on quality ensure that you consistently deliver outstanding results.",
        suggestions:
            "AI Integration Lead, Smart Systems Designer, Robotics Project Manager, Data Strategist",
        key_behaviours: [
            "Relies on data-driven insights to make informed decisions.",
            "Maintains high standards of quality and precision.",
            "Thrives in structured environments with clear expectations.",
            "Solves problems by analyzing root causes and proposing solutions.",
            "Balances big-picture thinking with attention to detail.",
            "Sets clear expectations for themselves and their teams.",
            "Drives efficiency through well-planned strategies.",
            "Adapts quickly to technological advancements and new methodologies.",
        ],
        typical_scenarios: [
            "Leading a team to develop a new product based on market analysis.",
            "Implementing a quality assurance program to ensure compliance.",
            "Designing data-driven strategies for organizational growth.",
            "Overseeing a precision-driven project with critical deadlines.",
        ],
        trait_mapping1: [
            [
                "Decisive Analyst",
                "Analytical Strategist, Chief Operating Officer (COO), Financial Strategist, Data-Driven Leader, Policy Planner",
                "Perfectionism, analysis paralysis, difficulty in collaboration",
                "Analytical thinking, structured problem-solving, automation",
            ],
        ],
        trait_mapping2: [
            [
                "Decisive Analyst",
                "Analytical Strategist, Chief Operating Officer (COO), Financial Strategist, Data-Driven Leader, Policy Planner",
                "Emotional team conflicts, creative problem-solving, and flexible brainstorming.",
                "Data-driven growth, structured decision-making, precision.",
            ],
        ],
    },
    ID: {
        name: "Energetic Visionary",
        description:
            "A charismatic and bold leader focused on achieving goals while engaging and inspiring others.",
        suggestions:
            "Influencer Campaign Manager, Creative Director, Brand Storyteller, Media Entrepreneur",
        key_behaviours: [
            "Inspires others with a compelling vision.",
            "Balances high energy with a results-oriented mindset.",
            "Communicates persuasively to align teams with objectives.",
            "Takes calculated risks to achieve significant outcomes.",
            "Encourages collaboration and creativity within teams.",
        ],
        typical_scenarios: [
            "Launching a startup or innovative project.",
            "Designing and executing impactful marketing strategies.",
            "Motivating a sales team to exceed ambitious targets.",
            "Representing a company or brand at industry events.",
        ],
        trait_mapping1: [
            [
                "Energetic Visionary",
                "Chief Growth Officer (CGO), Entrepreneur, Marketing Head, Brand Leader, Product Evangelist",
                "Impulsiveness, lack of focus, chasing too many ideas",
                "Persuasion, product-market fit, business acumen",
            ],
        ],
        trait_mapping2: [
            [
                "Energetic Visionary",
                "Chief Growth Officer (CGO), Entrepreneur, Marketing Head, Brand Leader, Product Evangelist",
                "Data-driven analysis, routine processes, and structured financial management.",
                "Spearheading marketing/sales, inspiring teams, partnerships.",
            ],
        ],
    },
    IS: {
        name: "Supportive Energizer",
        description:
            "You are a warm, empathetic individual who thrives on fostering harmony and collaboration. Your focus on relationships and positivity makes you an invaluable team player and connector.",
        suggestions:
            "Therapist, Social Impact Consultant, Career Counselor, Behavioral Wellness Specialist",
        key_behaviours: [
            "Builds meaningful relationships and fosters trust within teams.",
            "Creates a collaborative environment where everyone feels valued.",
            "Acts as a calming presence in high-stress situations.",
            "Thrives in people-focused roles that require empathy and engagement.",
            "Encourages creativity and collaboration to achieve goals.",
            "Supports team members in their growth and development.",
            "Balances optimism with practicality in decision-making.",
            "Commits to long-term success and loyalty within organizations.",
        ],
        typical_scenarios: [
            "Coordinating a team-building initiative to boost morale.",
            "Leading a customer success program to improve retention rates.",
            "Acting as a mentor to help colleagues achieve their potential.",
            "Supporting recruitment efforts by creating a welcoming candidate experience.",
        ],
        trait_mapping1: [
            [
                "Supportive Energizer",
                "Cultural Catalyst, Human Resources Leader, Employee Engagement Specialist, Client Success Manager, Team Builder",
                "Avoiding conflicts, difficulty in saying no, people-pleasing",
                "People management, engagement, soft skills",
            ],
        ],
        trait_mapping2: [
            [
                "Supportive Energizer",
                "Cultural Catalyst, Human Resources Leader, Employee Engagement Specialist, Client Success Manager, Team Builder",
                "High-pressure deadlines, aggressive growth strategies, and rapidly changing business environments.",
                "Employee engagement, team motivation, organizational culture.",
            ],
        ],
    },
    IC: {
        name: "Creative Thinker",
        description:
            "Creative and logical individuals who excel at balancing innovative ideas with structured execution.",
        suggestions:
            "UX Researcher, Creative Technologist, Interaction Designer, AI Content Designer",
        key_behaviours: [
            "Brings fresh perspectives and creative solutions to problems.",
            "Balances people-oriented communication with task focus.",
            "Leverages analytical skills to create innovative strategies.",
            "Thrives in collaborative and detail-driven environments.",
            "Communicates ideas effectively to diverse audiences.",
        ],
        typical_scenarios: [
            "Designing creative campaigns for marketing or branding.",
            "Leading brainstorming sessions for product innovation.",
            "Developing structured plans for creative projects.",
            "Presenting innovative solutions to stakeholders.",
        ],
        trait_mapping1: [
            [
                "Creative Thinker",
                "Brand Strategist Leader, Public Relations Head, Event Director, Content Strategist, Creative Designer",
                "Struggling with rigid structures, overanalyzing decisions",
                "User experience design, cognitive psychology, interface optimization",
            ],
        ],
        trait_mapping2: [
            [
                "Creative Thinker",
                "Brand Strategist Leader, Public Relations Head, Event Director, Content Strategist, Creative Designer",
                "Interpersonal relationship management, emotional conflict resolution, and dynamic team motivation.",
                "Brand identity, creative marketing, alignment with vision.",
            ],
        ],
    },
    SI: {
        name: "Collaborative Optimist",
        description:
            "A friendly and supportive individual who builds strong relationships and prioritizes harmony and teamwork.",
        suggestions:
            "Educational Program Coordinator, Community Builder, Travel Planner, Lifestyle Advisor",
        key_behaviours: [
            "Creates a positive and encouraging atmosphere for collaboration.",
            "Builds trust and rapport easily with diverse teams.",
            "Promotes inclusivity and values others' contributions.",
            "Focuses on resolving conflicts to maintain harmony.",
            "Encourages open communication and teamwork.",
            "Provides consistent emotional support to team members.",
        ],
        typical_scenarios: [
            "Organizing team meetings to promote collaboration and alignment.",
            "Mediating disputes to ensure smooth workflows and strong relationships.",
            "Supporting colleagues during stressful project phases.",
            "Creating community-focused initiatives within an organization.",
        ],
        trait_mapping1: [
            [
                "Collaborative Optimist",
                "Employee Advocate, Relationship Manager, Community Engagement Leader, Corporate Trainer, Partnership Coordinator",
                "Struggle with assertiveness, over-reliance on teamwork",
                "Collaboration, conflict resolution, motivation",
            ],
        ],
        trait_mapping2: [
            [
                "Collaborative Optimist",
                "Employee Advocate, Relationship Manager, Community Engagement Leader, Corporate Trainer, Partnership Coordinator",
                "Handling ambiguity, managing large-scale dynamic campaigns, and market analysis.",
                "Relationship management, internal/external communication.",
            ],
        ],
    },
    SD: {
        name: "Reliable Executor",
        description:
            "A loyal and dependable leader who balances stability with assertive action when needed.",
        suggestions:
            "HR Director, Learning and Development Specialist, Well-being Consultant, Organizational Coach",
        key_behaviours: [
            "Builds a stable and supportive team environment.",
            "Takes decisive action to address urgent priorities.",
            "Balances short-term tasks with long-term planning.",
            "Fosters trust and dependability in teams.",
            "Ensures project goals are met consistently and on time.",
        ],
        typical_scenarios: [
            "Managing a team through tight deadlines with care.",
            "Ensuring seamless operations during transitions.",
            "Implementing policies that improve team efficiency.",
            "Handling customer issues with patience and assertiveness.",
        ],
        trait_mapping1: [
            [
                "Reliable Executor",
                "Organizational Stabilizer, Risk Manager, Process Improvement Head, Resource Planner, Transformation Leader",
                "Struggle with adaptability, rigid adherence to plans, burnout risk",
                "Process improvement, system design, quality control",
            ],
        ],
        trait_mapping2: [
            [
                "Reliable Executor",
                "Organizational Stabilizer, Risk Manager, Process Improvement Head, Resource Planner, Transformation Leader",
                "Aggressive goal-setting, fast decision-making, and high-stakes innovation.",
                "Consistent growth strategies, balanced approach to scaling.",
            ],
        ],
    },
    SC: {
        name: "Dependable Specialist",
        description:
            "You are a systematic, detail-oriented individual who excels in structured environments. Your focus on precision and reliability ensures that tasks are completed accurately and efficiently.",
        suggestions:
            "Operations Analyst, Business Process Manager, Financial Planner, Workflow Auditor",
        key_behaviours: [
            "Brings a methodical and organized approach to every task.",
            "Ensures consistency and reliability in workflows.",
            "Thrives in structured environments with well-defined processes.",
            "Focuses on long-term goals and sustainable success.",
            "Balances a calm demeanor with a keen eye for detail.",
            "Adapts to changes methodically when given time and resources.",
            "Maintains high standards for quality and accuracy.",
            "Demonstrates patience and persistence in achieving objectives.",
        ],
        typical_scenarios: [
            "Managing compliance audits to ensure regulatory adherence.",
            "Designing and improving workflows to enhance productivity.",
            "Supporting operational tasks with well-organized systems.",
            "Analyzing data to forecast trends and drive decision-making.",
        ],
        trait_mapping1: [
            [
                "Dependable Specialist",
                "Chief Process Officer (CPO), Operations Coordinator, Quality Control Leader, Audit Manager, Team Efficiency Expert",
                "Fear of failure, slow decision-making, preference for stability",
                "Coding efficiency, debugging, structured programming",
            ],
        ],
        trait_mapping2: [
            [
                "Dependable Specialist",
                "Chief Process Officer (CPO), Operations Coordinator, Quality Control Leader, Audit Manager, Team Efficiency Expert",
                "Rapid innovation cycles, managing creative brainstorming, and dynamic interpersonal team building.",
                "Sustainable systems, process optimization, efficient operations.",
            ],
        ],
    },
    CD: {
        name: "Analytical Leader",
        description:
            "A precise and results-driven leader who balances attention to detail with a focus on achieving measurable goals.",
        suggestions:
            "Legal Advisor, Cyber Law Expert, Policy Consultant, Regulatory Analyst",
        key_behaviours: [
            "Analyzes data and processes thoroughly to make informed decisions.",
            "Sets clear and measurable goals for teams and projects.",
            "Communicates expectations with precision and clarity.",
            "Focuses on achieving high-quality outcomes within structured environments.",
            "Balances leadership with technical expertise, ensuring practical solutions.",
        ],
        typical_scenarios: [
            "Leading a team to execute complex projects with a focus on quality.",
            "Analyzing data to optimize workflows and drive efficiency.",
            "Managing resources to achieve strategic objectives within deadlines.",
            "Ensuring adherence to standards while delivering innovative results.",
        ],
        trait_mapping1: [
            [
                "Analytical Leader",
                "Risk and Strategy Specialist, Chief Financial Officer (CFO), Policy Advisor, Governance Leader, Compliance Director",
                "Highly critical of self and others, difficulty handling unpredictability",
                "System security, protocols, resilience planning",
            ],
        ],
        trait_mapping2: [
            [
                "Analytical Leader",
                "Risk and Strategy Specialist, Chief Financial Officer (CFO), Policy Advisor, Governance Leader, Compliance Director",
                "Managing emotional team dynamics, handling marketing creativity, and customer-facing ambiguity.",
                "Compliance, risk mitigation, strategic precision.",
            ],
        ],
    },
    CI: {
        name: "Logical Innovator",
        description:
            "A creative and structured individual who balances analytical thinking with engaging communication and innovation.",
        suggestions:
            "Cross-Cultural Strategist, Digital Learning Architect, Behavioral Consultant, Communication Trainer",
        key_behaviours: [
            "Thinks critically and logically to solve complex problems.",
            "Combines creativity with an organized approach to planning and execution.",
            "Communicates effectively, using logic and clarity to persuade others.",
            "Values innovation and structure in equal measure.",
            "Balances technical expertise with the ability to engage and inspire teams.",
        ],
        typical_scenarios: [
            "Leading the design of innovative technical solutions for business challenges.",
            "Explaining detailed processes to diverse audiences with clarity.",
            "Analyzing data to generate creative marketing or product strategies.",
            "Managing innovation-focused projects with attention to detail.",
        ],
        trait_mapping1: [
            [
                "Logical Innovator",
                "Strategic Communicator, Marketing Analyst, Learning and Development Consultant, Data-Driven Storyteller, Brand Architect",
                "Struggle balancing creativity with structure, overanalyzing social interactions",
                "Data-driven decision making, client interactions, domain expertise",
            ],
        ],
        trait_mapping2: [
            [
                "Logical Innovator",
                "Strategic Communicator, Marketing Analyst, Learning and Development Consultant, Data-Driven Storyteller, Brand Architect",
                "Resolving interpersonal issues, flexible problem-solving, and motivational leadership.",
                "Stakeholder alignment, analytics-driven communication.",
            ],
        ],
    },
    CS: {
        name: "Structured Supporter",
        description:
            "A systematic and reliable individual who values harmony, consistency, and accuracy in work and relationships.",
        suggestions:
            "Health Records Manager, Compliance Officer, Data Entry Quality Controller, Admin Services Specialist",
        key_behaviours: [
            "Creates and follows structured workflows to ensure efficiency.",
            "Provides consistent support to teams, ensuring stability and reliability.",
            "Focuses on delivering accurate and high-quality results.",
            "Balances interpersonal relationships with a focus on structure and detail.",
            "Values long-term planning and steady progress toward goals.",
        ],
        typical_scenarios: [
            "Developing and maintaining detailed project documentation.",
            "Ensuring compliance with organizational standards and policies.",
            "Supporting teams during large-scale organizational transitions.",
            "Managing operational processes to maintain accuracy and stability.",
        ],
        trait_mapping1: [
            [
                "Structured Supporter",
                "Chief Quality Officer, Research Leader, Operations Strategist, Documentation Specialist, Knowledge Management Leader",
                "Over-reliance on routine, resistance to new ideas, lack of flexibility",
                "Sustainability, planning, execution focus",
            ],
        ],
        trait_mapping2: [
            [
                "Structured Supporter",
                "Chief Quality Officer, Research Leader, Operations Strategist, Documentation Specialist, Knowledge Management Leader",
                "High-stakes decision-making, rapid market shifts, and dynamic product development cycles.",
                "Operational excellence, quality assurance, sustainable growth.",
            ],
        ],
    },
};
