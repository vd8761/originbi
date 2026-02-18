export const SCHOOL_LEVEL_ID = {
    SSLC: 1,
    HSC: 2,
};

export const SCHOOL_STREAM_ID = {
    SCIENCE: 1,
    COMMERCE: 2,
    HUMANITIES: 3,
};

export const DISCLAIMER: Record<string, any> = {
    aci_description:
        "Discover how naturally your mindset aligns with Agile values of <b>Commitment, Focus, Openness, Respect </b>, and <b>Courage </b>.",
};

export const ACI_SCORE: Record<string, any> = {
    "100": {
        title: "Agile Naturalist",
        compatibility_tag:
            "Embodies agility instinctively; thrives in collaboration and adapts with ease.",
        interpretation:
            "You live the Agile mindset naturally - showing balance between speed, empathy, and accountability. You take initiative, adapt fast, and sustain performance even under pressure. Continue mentoring others to bring this maturity into your team culture.",
    },
    "75": {
        title: "Agile Adaptive",
        compatibility_tag:
            "Shows strong energy, adaptability, and creative courage with growing consistency.",
        interpretation:
            "You’re quick to learn and adjust to change. You work well in dynamic situations and often motivate others through your enthusiasm. Focus on sustaining effort over time and grounding your pace with structure - that’s where long-term excellence will grow.",
    },
    "50": {
        title: "Agile Learner",
        compatibility_tag:
            "Understands Agile values conceptually but applies them inconsistently.",
        interpretation:
            "You show openness to Agile ideas and collaboration but may need guidance or structured environments to stay consistent. Practice patience, feedback acceptance, and steady follow-through - agility will grow stronger with discipline and reflection.",
    },
    "0": {
        title: "Agile Resistant",
        compatibility_tag:
            "Prefers control and predictability; finds comfort in fixed systems and routines.",
        interpretation:
            "You may feel uncertain when faced with change or fast-moving teamwork. This doesn’t mean resistance to learning - it indicates the need for more trust and gradual exposure to flexible environments. Begin with small experiments: shorter plans, open discussions, and shared decisions.",
    },
};

export const ACI: Record<string, any> = {
    DI: {
        trait_title: "The Dynamic Influencer",
        agile_desc_1: `<p>The Agile Compatibility Index (ACI) is designed to help you understand how your natural behaviour aligns with Agile principles - not as a process, but as a mindset. Agility isn’t just about working faster; it’s about thinking flexibly, adapting to change, respecting collaboration, and having the courage to take responsibility.</p><p>ACI captures how you respond when faced with real-world challenges - whether you stay consistent when motivation dips, stay open when ideas are challenged, or maintain respect when opinions differ.</p><p>Your score reveals how easily you can live by Agile values in everyday situations, helping you grow from instinctive reactions to intentional choices.</p>`,
        personalized_insight: `<p>You bring a natural spark of energy, curiosity, and expression into everything you do. When something excites you, you commit fully - bringing people together, inspiring action, and setting things in motion. You thrive in environments that allow creativity, freedom, and collaboration. Change doesn’t intimidate you; it energizes you.</p><p>The Agile Compatibility Index reveals how this passion transforms into outcomes - how well you stay anchored when excitement fades, how you manage focus amidst multiple ideas, and how you respond when others question your perspective.</p><p>Your results reflect a personality that leads through inspiration and initiative. You’re likely to voice new ideas fearlessly and adapt quickly to shifting priorities. Your openness to experiences and willingness to take risks are among your strongest Agile strengths.</p><p>At times, your challenge lies in sustaining momentum once the initial spark fades. You may find it harder to stay consistent when results take longer or when appreciation is missing. Building rhythm, focus, and steady routines helps you turn enthusiasm into reliability - converting bright starts into strong finishes.</p><p>When your ACI score is high, it shows that you have learned to combine passion with discipline - leading others with both energy and accountability. A moderate or developing score points to the next level of growth: slowing down, listening deeply, and committing to completion even when it’s not exciting.</p><p>Agile maturity for you means learning the art of balance - staying expressive without overpowering others, staying spontaneous without losing direction, and staying courageous without losing empathy. It’s about transforming energy into endurance and confidence into quiet, focused leadership.</p>`,
        agile_wise_breakdown: {
            commitment: {
                behavioural_note:
                    "Strong intent but needs consistent finish across all tasks.",
                behavioural_description:
                    "You start with strong passion and high energy, but consistency dips once the excitement fades. Your intent is genuine, yet follow-through needs more rhythm and patience.",
                suggested_micro_habit:
                    "End every day by finishing one unfinished task - even a small one. Build the identity of someone who always closes loops.",
            },
            focus: {
                behavioural_note:
                    "Creative energy scattered; needs structure to sustain attention.",
                behavioural_description:
                    "You juggle multiple ideas and love the buzz of creativity, but this can scatter your attention. Focus deepens your influence when you learn to manage your pace and silence distractions.",
                suggested_micro_habit:
                    "Practice 25-minute “focus sprints” - one task, no multitasking, no phone. Repeat twice daily.",
            },
            openness: {
                behavioural_note: "Thrives on new ideas and adapts quickly.",
                behavioural_description:
                    "You’re naturally open to people, ideas, and feedback - but only when it doesn’t challenge your pace. True openness is the ability to listen, slow down, and adapt without ego.",
                suggested_micro_habit:
                    "Ask one person for feedback each week - not to defend, but to truly understand their view.",
            },
            respect: {
                behavioural_note:
                    "Expressive and confident; learning deeper listening improves balance.",
                behavioural_description:
                    "Your confidence inspires others, but sometimes your expression can overpower quieter voices. Respect grows when you balance your enthusiasm with empathy and listening.",
                suggested_micro_habit:
                    "In every meeting, let others speak first. Summarize their view before sharing yours.",
            },
            courage: {
                behavioural_note:
                    "Bold and outspoken; learning tact strengthens leadership impact.",
                behavioural_description:
                    "You’re bold, expressive, and unafraid to speak your truth. The next level of courage is showing honesty with empathy - challenging ideas, not people.",
                suggested_micro_habit:
                    "Once a week, speak up for fairness or clarity - but do it calmly and with respect.",
            },
        },
        reflection_summary:
            "<p>Your natural strength lies in movement, creativity, and influence. You think fast, act fast, and motivate others through your energy. But true agility emerges when you sustain that same energy with discipline and calm.</p><p>Each Agile value builds a bridge between who you are and who you can become - helping you express ideas with clarity, act with focus, and lead with empathy. As you practise the suggested micro-habits, you’ll begin to notice a subtle shift: your ideas will land deeper, your actions will last longer, and your influence will create real change.</p><p>Agility for you is not just speed - it’s <b>consistency with soul </b>. Keep your spark alive, but let patience and rhythm turn that spark into lasting light.</p>",
    },
    DS: {
        trait_title: "The Directive Achiever",
        agile_desc_1: `<p>For you, agility is about channeling ambition through adaptability. The Agile Compatibility Index reveals how your strong execution focus balances with collaboration, patience, and flexibility in leadership.</p><p>It’s a measure of how effectively you move from commanding to connecting - from directing tasks to developing people.</p>`,
        personalized_insight: `<p>You’re a natural achiever - ambitious, competitive, and decisive. You move fast, think clear, and act with intent. Teams often rely on you to cut through confusion and make things happen.</p><p>The Agile Compatibility Index reflects how your leadership-driven mindset adapts to change, feedback, and shared control. You bring vision, energy, and determination, but true agility for you lies in slowing down enough to listen, include, and empower.</p><p>When your ACI score is high, it shows you’ve learned to balance drive with empathy - a leader who wins through collaboration, not command. A developing score indicates the need to delegate trust and invite others into your clarity.</p><p>Agility for you is <b>directing through dialogue </b> - staying bold, but building belief.</p>`,
        agile_wise_breakdown: {
            commitment: {
                behavioural_note: "Strong performer; owns outcomes fully.",
                behavioural_description: "You own every goal personally.",
                suggested_micro_habit:
                    "Schedule weekly “team accountability reviews” instead of solo planning.",
            },
            focus: {
                behavioural_note: "Handles pressure with clarity and speed.",
                behavioural_description: "You act decisively under stress.",
                suggested_micro_habit:
                    "Pause 10 seconds before reacting in tense situations.",
            },
            openness: {
                behavioural_note: "Learning to slow down and share control.",
                behavioural_description: "You prefer your methods first.",
                suggested_micro_habit:
                    "Ask one team member weekly, “What do you think?” before deciding.",
            },
            respect: {
                behavioural_note: "Confident; working on patience and tone.",
                behavioural_description: "You’re assertive by nature.",
                suggested_micro_habit:
                    "Add a short appreciation before giving direction.",
            },
            courage: {
                behavioural_note: "Fearless and accountable in tough calls.",
                behavioural_description: "You lead with conviction.",
                suggested_micro_habit:
                    "Use courage to defend others’ ideas, not just your own.",
            },
        },
        // 100: {
        //     title: "Agile Naturalist",
        //     compatibility_tag: "",
        //     interpretation: "",
        // },
        // 75: {
        //     title: "Agile Adaptive",
        //     compatibility_tag: "",
        //     interpretation: "",
        // },
        // 50: {
        //     title: "Agile Learner",
        //     compatibility_tag: "",
        //     interpretation: "",
        // },
        // 0: {
        //     title: "Agile Resistant",
        //     compatibility_tag: "",
        //     interpretation: "",
        // },
        reflection_summary: `<p>You are the engine that keeps momentum alive - fast, fearless, and focused on results. True agility for you lies in shifting from command to connection - seeing leadership as facilitation, not domination.</p><p>Each Agile value pushes you to blend direction with inclusion, clarity with calm, and speed with empathy. When you do, you evolve from achiever to transformational leader - driving outcomes through inspiration, not authority.</p><p>You are the leader of purposeful performance.</p>`,
    },
    DC: {
        trait_title: "The Driving Challenger",
        agile_desc_1: `<p>The Agile Compatibility Index (ACI) evaluates how effectively you balance drive with adaptability.</p><p>Agility is not just about speed - it’s about <b>discipline, collaboration </b>, and the <b>courage </b> to face uncertainty.</p><p>This report explores how you respond when faced with challenges - whether you persist through complexity, accept feedback, or balance assertiveness with empathy.</p><p>Your score reflects your readiness to evolve from control to collaboration, from pressure to progress.</p>`,
        agile_desc_2: "",
        personalized_insight: `<p>You are driven by clarity, goals, and achievement. You lead with strength, set clear expectations, and motivate others through results.</p><p>Your confidence helps teams move faster, and your decisiveness ensures nothing remains unclear. The Agile Compatibility Index reveals how your structured, goal-oriented mindset aligns with flexibility, openness, and people dynamics.</p><p>You have an instinct to lead, challenge norms, and question inefficiency - making you a strong driver of change. At times, your focus on results can overshadow patience with slower or less confident teammates.</p><p>True agility for you means leading <b>with precision and empathy together </b> - staying assertive without shutting out perspectives that could add value.</p><p>When your ACI score is high, it shows a mature balance between strength and adaptability. You stay firm on purpose but flexible in process. A developing score suggests you’re still learning to delegate trust and accept different working rhythms.</p><p>Your growth lies in seeing collaboration not as compromise, but as <b>collective acceleration </b> - where your standards uplift everyone, not just outcomes.</p>`,
        agile_wise_breakdown: {
            commitment: {
                behavioural_note:
                    "Highly disciplined; strong follow-through and ownership.",
                behavioural_description:
                    "You finish what you start and expect others to do the same.",
                suggested_micro_habit:
                    "Once a week, mentor a teammate to strengthen shared accountability.",
            },
            focus: {
                behavioural_note: "Excellent concentration and prioritization.",
                behavioural_description:
                    "You excel at prioritizing but must allow flexibility.",
                suggested_micro_habit:
                    "Pause 10 minutes before reacting under pressure - clarity beats speed.",
            },
            openness: {
                behavioural_note: "Learns to accept input without judgment.",
                behavioural_description:
                    "You prefer logic to emotion - learning empathy amplifies impact.",
                suggested_micro_habit:
                    "Ask one teammate weekly for improvement ideas, and try one suggestion.",
            },
            respect: {
                behavioural_note:
                    "Driven communicator; working on balancing firmness and empathy.",
                behavioural_description:
                    "You value performance, sometimes over patience.",
                suggested_micro_habit:
                    "Acknowledge one good intent before offering correction.",
            },
            courage: {
                behavioural_note:
                    "Fearless in taking responsibility and addressing conflict.",
                behavioural_description:
                    "You speak truth to power and lead with integrity.",
                suggested_micro_habit:
                    "Keep being bold, but pair every critique with a constructive alternative.",
            },
        },
        // 100: {
        //     title: "Agile Naturalist",
        //     compatibility_tag: "",
        //     interpretation: "",
        // },
        // 75: {
        //     title: "Agile Adaptive",
        //     compatibility_tag: "",
        //     interpretation: "",
        // },
        // 50: {
        //     title: "Agile Learner",
        //     compatibility_tag: "",
        //     interpretation: "",
        // },
        // 0: {
        //     title: "Agile Resistant",
        //     compatibility_tag: "",
        //     interpretation: "",
        // },
        reflection_summary:
            "<p>Your drive defines you - ambitious, disciplined, and unafraid of challenge. The next level of agility for you is learning the <b>grace behind strength </b> - using your clarity not just to push outcomes, but to guide people.</p><p>Every Agile value invites you to expand your influence: lead firmly but listen softly, plan precisely but stay open to change.</p><p>When your decisiveness meets empathy, you don’t just achieve results - you build resilient teams that can achieve them again and again. Your leadership shines brightest when <b>control becomes confidence </b> and <b>pressure turns into purpose </b>.</p>",
    },
    ID: {
        trait_title: "The Expressive Initiator",
        agile_desc_1: `<p>The Agile Compatibility Index (ACI) helps you see how your behaviour aligns with Agile principles not as a process, but as a mindset. Agility isn’t about speed alone; it’s about adaptability, respect, accountability, and courage in collaboration.</p><p>Through real-life scenarios, ACI reflects how you act when faced with uncertainty whether you stay committed when recognition fades, stay open when challenged, or maintain respect while voicing bold ideas.</p><p>Your score represents how easily you translate energy into impact and how ready you are to grow through agility in thought and action.</p>`,
        agile_desc_2: "",
        personalized_insight: `<p>You naturally carry enthusiasm that energizes others. You enjoy expressing ideas, sharing experiences, and bringing people together around a cause. Your communication builds instant connections, and your confidence helps you lead initiatives with warmth and conviction.</p><p>The Agile Compatibility Index reveals how this expressive energy translates into sustained outcomes whether your openness to new experiences is matched by patience, focus, and thoughtful listening. You are often the one who gets people started a motivator, a storyteller, and a social anchor.</p><p>Your courage to speak up and your openness to collaboration make you a natural fit for Agile environments. At times, you may find yourself reacting faster than you reflect. The desire to share, impress, or stay visible might pull you away from deep focus or steady completion.</p><p>Learning to listen without preparing a reply and committing fully to closure will make your agility truly powerful. A high ACI score shows a communicator who balances confidence with consistency expressive yet grounded. A developing score reflects a growing need to refine attention and presence. True agility for you lies in expressing ideas not louder, but clearer and turning excitement into endurance.</p>`,
        agile_wise_breakdown: {
            commitment: {
                behavioural_note:
                    "Passionate starter, needs structure for steady finish.",
                behavioural_description:
                    "You're eager to start, but sustaining pace requires structure.",
                suggested_micro_habit:
                    'Set a fixed "finish ritual" no new task until one old task is closed.',
            },
            focus: {
                behavioural_note:
                    "Highly engaged but easily distracted by social stimuli.",
                behavioural_description:
                    "You thrive on engagement, but too many interactions dilute productivity.",
                suggested_micro_habit:
                    'Try one "silent hour" daily no calls, no chats, only core work.',
            },
            openness: {
                behavioural_note:
                    "Welcomes feedback and loves exploring new ideas.",
                behavioural_description:
                    "You embrace new ideas easily, yet balance comes when you listen before responding.",
                suggested_micro_habit:
                    "In every feedback moment, pause 3 seconds before replying.",
            },
            respect: {
                behavioural_note:
                    "Empathetic communicator; learning to pause before reacting.",
                behavioural_description:
                    "You care deeply about people but can overexpress or interrupt in excitement.",
                suggested_micro_habit:
                    "Let others share their complete thought before adding yours.",
            },
            courage: {
                behavioural_note:
                    "Expressive and bold, thrives in open discussion.",
                behavioural_description:
                    "You lead from the front and speak truth. Refine it with empathy to strengthen influence.",
                suggested_micro_habit:
                    'Once a week, practice assertive honesty with kindness "what\'s true" + "why it matters."',
            },
        },
        reflection_summary:
            "<p>Your natural charm and expressiveness make you the spark in any collaborative setting. You lift energy, connect people, and inspire dialogue. The next step in your Agile evolution is not to speak more - but to listen deeper, focus longer, and finish stronger.</p><p>Each Agile value guides you to use your voice as a bridge, not a spotlight where your courage meets empathy, and your enthusiasm meets execution.</p><p>Agility for you is the art of leading conversations that create progress. Stay expressive, but add steadiness; <b>stay visible, but stay grounded </b>. That's how your influence turns into impact.</p>",
    },
    IS: {
        trait_title: "The Social Encourager",
        agile_desc_1: `<p>Agility for you is about people - creating emotional balance, building trust, and maintaining motivation through relationships. The Agile Compatibility Index highlights how your empathy and supportiveness translate into collaboration and adaptability.</p><p>Your steady optimism helps others through change, while ACI shows how to match that warmth with assertive courage and sharper focus.</p>`,
        agile_desc_2: "",
        personalized_insight: `<p>You bring kindness, connection, and encouragement wherever you go. You naturally sense others’ emotions and create safe spaces for collaboration. People find you approachable, understanding, and easy to trust.</p><p>The Agile Compatibility Index reflects how your people-first approach aligns with Agile responsiveness. You thrive in teamwork and value harmony, but sometimes hesitate to push boundaries or assert your own pace.</p><p>A high ACI score reveals that you blend empathy with accountability - caring deeply while keeping consistency. A developing score suggests that you may sometimes prioritise comfort over completion or avoid conflict for peace.</p><p>True agility for you means leading with both heart and firmness - supporting others while speaking your truth and holding steady focus on results.</p>`,
        agile_wise_breakdown: {
            commitment: {
                behavioural_note:
                    "Consistent contributor; follows through when emotionally engaged.",
                behavioural_description:
                    "You stay consistent when emotionally involved.",
                suggested_micro_habit:
                    "Write down three daily priorities and finish them before new tasks.",
            },
            focus: {
                behavioural_note:
                    "Socially active; focus dips when balancing relationships.",
                behavioural_description:
                    "You’re people-oriented and easily pulled into social moments.",
                suggested_micro_habit:
                    "Schedule 30-minute quiet blocks daily for distraction-free work.",
            },
            openness: {
                behavioural_note: "Welcomes change with empathy and curiosity.",
                behavioural_description: "You adapt and listen beautifully.",
                suggested_micro_habit:
                    "Ask for constructive feedback every week - it deepens growth.",
            },
            respect: {
                behavioural_note:
                    "Deeply respectful and emotionally intelligent.",
                behavioural_description:
                    "You uplift people through warmth and patience.",
                suggested_micro_habit:
                    "Listen fully without interrupting - validation builds trust.",
            },
            courage: {
                behavioural_note:
                    "Learns to express disagreement more directly.",
                behavioural_description:
                    "You avoid confrontation to keep peace.",
                suggested_micro_habit:
                    "Speak up once per week, even on small topics - your calm voice has weight.",
            },
        },
        reflection_summary:
            "<p>You make work feel human. Your ability to bring warmth and unity creates trust, loyalty, and collaboration in any setting. Agility for you isn’t about speed - it’s about presence, empathy, and the quiet power to move people forward together.</p><p>Each Agile value guides you to add gentle structure to your compassion - to act with clarity while keeping your heart open.</p><p>When care meets courage, your influence becomes transformational. You are not just a contributor - you are the <b>emotional compass of agility </b>.</p>",
    },
    IC: {
        trait_title: "The Creative Planner",
        agile_desc_1: `<p>The Agile Compatibility Index explores how your balance of logic and creativity translates into agility. It reflects how you blend curiosity with discipline - experimenting boldly but also maintaining order and reasoning.</p>`,
        personalized_insight: `<p>You bring a rare balance of imagination and intellect. You’re creative, observant, and thoughtful in your decisions - equally drawn to analysis and artistic problem-solving.</p><p>The Agile Compatibility Index reveals how your structured creativity connects with adaptability and courage. You think deeply, design clearly, and execute carefully - your work often carries both elegance and accuracy.</p><p>Your growth opportunity lies in commitment and collaboration - following through till completion, sharing ownership openly, and involving others early in your creative process.</p><p>A high ACI score means you merge creativity with accountability - you don’t just dream; you deliver. A developing score shows a need to move from “thinking” to “acting” more decisively. Agility for you is turning reflection into results - trusting the process as much as the idea.</p>`,
        agile_wise_breakdown: {
            commitment: {
                behavioural_note:
                    "Driven by ideas, but needs consistency till closure.",
                behavioural_description:
                    "You love ideation more than execution.",
                suggested_micro_habit:
                    "End each day by finishing one open loop - no creative drift.",
            },
            focus: {
                behavioural_note:
                    "Deeply analytical; maintains sustained attention.",
                behavioural_description:
                    "You work best in calm, structured settings.",
                suggested_micro_habit:
                    "Schedule one “no-meeting” focus block daily.",
            },
            openness: {
                behavioural_note: "Curious and receptive to diverse input.",
                behavioural_description:
                    "You appreciate fresh inputs and new data.",
                suggested_micro_habit:
                    "Ask one person weekly to challenge your ideas.",
            },
            respect: {
                behavioural_note:
                    "Courteous communicator; sometimes prefers independence.",
                behavioural_description: "You’re courteous but private.",
                suggested_micro_habit:
                    "Ask for opinions early to build inclusivity.",
            },
            courage: {
                behavioural_note:
                    "Ready to take initiative with creative risk.",
                behavioural_description: "You prefer logic over confrontation.",
                suggested_micro_habit:
                    "Share one bold suggestion weekly, regardless of risk.",
            },
        },
        reflection_summary:
            "<p>Your creativity has purpose - it’s thoughtful, grounded, and methodical. You think before acting, and when you act, it’s with clarity and precision. Agility for you is not about speed but flow - learning to move ideas from perfection to progress faster.</p><p>Each Agile value invites you to stretch your creative discipline: commit deeper, express bolder, and collaborate sooner. When imagination meets structure, you don’t just adapt - you redefine how agility looks in action.</p>",
    },
    SD: {
        trait_title: "The Reliable Executor",
        agile_desc_1: `<p>For you, agility is about responsibility and steadiness - staying consistent when others change direction.</p><p>The Agile Compatibility Index helps reveal how your loyalty and structure can evolve into adaptability and initiative while preserving reliability.</p>`,
        personalized_insight: `<p>You are dependable, disciplined, and loyal - someone who brings calm and order wherever you go. You follow systems faithfully and execute with quiet excellence.</p><p>The Agile Compatibility Index reflects how your reliability transforms into agility when paired with openness and courage.</p><p>You prefer predictability and trust established methods, but true growth for you lies in embracing new tools and stepping out of comfort zones. A high ACI score reflects stability with adaptability - strong follow-through balanced with flexibility.</p><p>A developing score indicates the need to speak up sooner, take initiative beyond assigned tasks, and accept change as part of progress. True agility for you is steady evolution - not about rushing, but about growing stronger with every shift.</p>`,
        agile_wise_breakdown: {
            commitment: {
                behavioural_note: "Exceptionally reliable and disciplined. ",
                behavioural_description: "You never miss deadlines. ",
                suggested_micro_habit:
                    "Volunteer once a month for a new, unfamiliar project. ",
            },
            focus: {
                behavioural_note:
                    "Maintains attention and order in all tasks. ",
                behavioural_description: "You’re composed under workload. ",
                suggested_micro_habit:
                    "Review your top three priorities every morning before work. ",
            },
            openness: {
                behavioural_note:
                    "Adapts slowly; needs comfort with unpredictability. ",
                behavioural_description: "You prefer routines. ",
                suggested_micro_habit:
                    "Say “yes” to one unexpected idea weekly - explore without fear. ",
            },
            respect: {
                behavioural_note: "Humble and kind; values others’ efforts. ",
                behavioural_description:
                    "You treat people with sincerity and warmth. ",
                suggested_micro_habit:
                    "Appreciate one teammate’s hidden effort each week. ",
            },
            courage: {
                behavioural_note:
                    "Hesitant to take risks or voice opinions first. ",
                behavioural_description: "You hesitate to take the lead. ",
                suggested_micro_habit:
                    "Speak up or take initiative once a week - even on small matters. ",
            },
        },
        reflection_summary:
            "<p>You are the foundation every team needs - consistent, steady, and dependable.  Agility for you means learning to move confidently through change while staying grounded in principles. </p><p>Each Agile value expands your strength - helping you evolve from stable executor to adaptive leader.  When courage meets commitment and openness meets order, your reliability becomes unstoppable.  You are the anchor of sustainable agility - steady in storms, adaptable in calm. </p>",
    },
    SI: {
        trait_title: "The Interactive Supporter [cite: 99, 102]",
        agile_desc_1: `<p>For you, agility grows through connection. The ACI highlights how your sociable, cooperative style adapts to change while maintaining teamwork and trust. Your challenge is balancing social warmth with consistent execution - keeping enthusiasm focused on outcomes, not just interaction.</p>`,
        personalized_insight: `<p>You’re a natural connector - approachable, encouraging, and always ready to make teamwork enjoyable. People feel comfortable sharing ideas around you because you make collaboration feel effortless .</p><p>The Agile Compatibility Index shows how your inclusive communication strengthens Agile culture. You adapt easily, empathize quickly, and bridge gaps in diverse groups.</p><p>At times, your openness and social energy can pull focus from completion or make it hard to say “no”. Developing a little more firmness and structure will help you convert collaboration into consistent delivery .</p><p>A high ACI score shows you can balance people skills with accountability - a communicator who leads by inclusion and reliability. A developing score suggests focusing on time discipline and courageous honesty when harmony tempts silence. True agility for you is using your social presence as a driver of steady action - where friendliness meets follow-through.</p>`,
        agile_wise_breakdown: {
            commitment: {
                behavioural_note:
                    "Keeps promises, though motivation can depend on social energy.",
                behavioural_description:
                    "You’re enthusiastic at start but need end-of-task discipline.",
                suggested_micro_habit:
                    "Before day ends, close at least one open loop.",
            },
            focus: {
                behavioural_note:
                    "Highly interactive; needs structure to maintain attention.",
                behavioural_description:
                    "You draw energy from interaction; distraction is your challenge.",
                suggested_micro_habit:
                    "Block two 25-minute silent sprints daily.",
            },
            openness: {
                behavioural_note: "Warm, accepting, and adaptive to new ideas.",
                behavioural_description: "You embrace diversity easily.",
                suggested_micro_habit:
                    "Invite one dissenting opinion per week - it strengthens adaptability.",
            },
            respect: {
                behavioural_note: "Strong listener; builds harmony naturally.",
                behavioural_description:
                    "You treat people kindly and include everyone.",
                suggested_micro_habit:
                    "Ask a quieter teammate’s view in every meeting.",
            },
            courage: {
                behavioural_note:
                    "Learning to express opinions with confidence.",
                behavioural_description:
                    "You prefer agreement to confrontation.",
                suggested_micro_habit:
                    "State one honest opinion weekly - with empathy and clarity.",
            },
        },
        reflection_summary:
            "<p>Your gift is people. You turn workplaces into communities and projects into partnerships. Agility for you is not about working alone faster - it’s about growing together smarter .</p><p>Each Agile value teaches you to channel empathy into consistency, kindness into courage, and inclusion into impact. When your communication gains firmness and your collaboration gains focus, you become the teammate everyone wants beside them during change. You are the heart of collaboration - steady, social, and supportive.</p>",
    },
    SC: {
        trait_title: "The Supportive Coordinator",
        agile_desc_1: `<p>The Agile Compatibility Index reflects how you respond to change while staying grounded in reliability. It reveals how well you adapt to evolving priorities, embrace feedback, and contribute to a stable, collaborative environment. Your steadiness is your strength - ACI shows how that stability transforms into agile flexibility without losing balance.</p>`,
        personalized_insight: `<p>You bring calm, order, and dependability into every situation. People trust you because you deliver without drama. You listen before acting, prefer clarity over chaos, and find satisfaction in teamwork and mutual support.</p><p>The Agile Compatibility Index highlights how your patience and consistency contribute to collective success. You’re the kind of person others rely on during uncertain times.</p><p>Your growth journey in agility lies in building courage and openness - learning to speak up sooner, experiment more freely, and accept that mistakes are part of progress. Agility for you isn’t abandoning structure - it’s adding responsiveness to it.</p><p>A high ACI score means you combine patience with initiative - dependable yet adaptive. A developing score suggests learning to trust change faster and take confident risks. True agility for you means turning stability into strength while embracing motion.</p>`,
        agile_wise_breakdown: {
            commitment: {
                behavioural_note:
                    "Reliable and consistent; delivers on promises.",
                behavioural_description:
                    "Your reliability is admired. Consistency defines your work ethic.",
                suggested_micro_habit:
                    "Take one small stretch goal weekly - step outside comfort but finish it fully.",
            },
            focus: {
                behavioural_note:
                    "Calm under workload; maintains steady attention.",
                behavioural_description: "You stay composed amid distractions.",
                suggested_micro_habit:
                    "Use a 10-minute daily reflection on “what truly mattered” to refine focus.",
            },
            openness: {
                behavioural_note:
                    "Gradually accepts change; learning to adapt faster.",
                behavioural_description: "You accept change gradually.",
                suggested_micro_habit:
                    "Try one new method each week, no matter how small.",
            },
            respect: {
                behavioural_note: "Highly empathetic and cooperative.",
                behavioural_description:
                    "You treat everyone with dignity and fairness.",
                suggested_micro_habit:
                    "Give one compliment per day - appreciation fuels respect.",
            },
            courage: {
                behavioural_note: "Needs to express thoughts more assertively.",
                behavioural_description: "You prefer harmony to confrontation.",
                suggested_micro_habit:
                    "Speak up once a week in meetings - your calm voice adds wisdom.",
            },
        },
        reflection_summary:
            "<p>Your dependability anchors teams - people trust you because you bring steadiness where others bring speed. True agility for you begins when stability meets courage - when your reliability turns into quiet leadership.</p><p>Each Agile value guides you to blend calm with conviction, patience with initiative, and empathy with assertiveness. When you balance kindness with confidence, your influence extends beyond support - it becomes transformation. Agility, for you, is courageous stability - the art of adapting without losing who you are.</p>",
    },
    CD: {
        trait_title: "The Detail Commander",
        agile_desc_1: `<p>The Agile Compatibility Index (ACI) explores how you balance structure with adaptability and quality with speed. Agility is about precision with progress - knowing when to hold standards and when to let flexibility lead.</p><p>Your responses reveal how you act when plans change, deadlines shift, or others don’t match your pace. It highlights how you can turn your discipline into collaboration without losing excellence.</p>`,
        personalized_insight: `<p>You are methodical and detail-oriented, someone who finds clarity in structure and confidence in accuracy. You prefer systems that work, data that proves, and results that speak for themselves. The Agile Compatibility Index reflects how your commitment to precision translates into collaboration and adaptability. You take pride in delivering flawless outcomes and holding teams to high standards.</p><p>Yet, true Agile growth for you lies in allowing imperfection during experimentation and trusting the process of learning. Letting go of over-control does not weaken you - it multiplies your impact. A high ACI score shows a mature balance between structure and adaptability - someone who leads through quality and inspires confidence. A developing score indicates you may still feel uneasy with ambiguity or slower performers. Agility for you is about learning to value progress over perfection and collaboration over control.</p>`,
        agile_wise_breakdown: {
            commitment: {
                behavioural_note: "Deeply dedicated and consistent.",
                behavioural_description:
                    "You never compromise on delivery quality. Consistency is your signature.",
                suggested_micro_habit:
                    "Set a weekly “done review” to celebrate completed tasks before starting new ones.",
            },
            focus: {
                behavioural_note:
                    "Exceptionally attentive to detail and priority.",
                behavioural_description:
                    "Your clarity is a strength; flexibility will add speed.",
                suggested_micro_habit:
                    "Schedule short “review cut-off” times to avoid over-analysis.",
            },
            openness: {
                behavioural_note:
                    "Learning to adapt and welcome diverse approaches.",
                behavioural_description:
                    "You tend to value facts over feelings.",
                suggested_micro_habit:
                    "Ask a peer for one creative idea each week and try it without judging outcome.",
            },
            respect: {
                behavioural_note:
                    "Professional tone with scope to show empathy.",
                behavioural_description:
                    "You communicate formally; adding warmth builds connection.",
                suggested_micro_habit:
                    "Start feedback with appreciation before suggesting improvement.",
            },
            courage: {
                behavioural_note:
                    "Honest and principled; leads through integrity.",
                behavioural_description: "You hold strong ethical standards.",
                suggested_micro_habit:
                    "Encourage others to speak truth by modeling calm, transparent dialogue.",
            },
        },
        reflection_summary:
            "<p>Your precision is your power. You excel in creating clarity, stability, and standards that people trust.</p><p>The next step of Agility for you is to embrace movement without losing method - to let progress replace perfection. Each Agile value draws you toward a broader influence: to guide others not only through accuracy but through adaptability. As you learn to loosen the control, you find that your discipline becomes a foundation for team growth rather than a barrier to speed.</p>",
    },
    CI: {
        trait_title: "The Analytical Designer",
        agile_desc_1: `<p>The Agile Compatibility Index explores how your disciplined logic blends with adaptability, how you manage detail without resisting innovation, and how you grow from control to collaboration. For you, agility is about structure with sensitivity - maintaining precision without rigidity .</p><p>You are a designer of systems and ideas - practical, analytical, and grounded in accuracy. True agility for you lies in using structure as a strength, not a shield - opening your mind to other perspectives while maintaining quality and balance.</p>`,
        personalized_insight: `<p>You think clearly, plan meticulously, and execute with a calm sense of logic. You’re consistent, disciplined, and reliable - someone who values facts over opinions and standards over shortcuts. The Agile Compatibility Index reveals how your analytical precision supports collaboration and responsiveness. You excel in structure and accuracy, but sometimes hesitate when faced with fast, ambiguous change .</p><p>A high ACI score means you’ve learned to apply logic with empathy - balancing data-driven thinking with trust and adaptability. A developing score reflects an opportunity to ease control and embrace experimentation without losing quality. True agility for you is precision guided by openness - learning that progress sometimes begins before everything is perfect.</p>`,
        agile_wise_breakdown: {
            commitment: {
                behavioural_note: "Dedicated to completion and accuracy.",
                behavioural_description: "You never compromise on quality.",
                suggested_micro_habit:
                    "End each week by reviewing what’s complete vs. pending.",
            },
            focus: {
                behavioural_note:
                    "Exceptional concentration; stays deeply engaged.",
                behavioural_description: "You immerse deeply in logical work.",
                suggested_micro_habit:
                    "Take a 10-minute walk every 2 hours to refresh focus.",
            },
            openness: {
                behavioural_note: "Adapts gradually; prefers predictability.",
                behavioural_description:
                    "You value stability over spontaneity.",
                suggested_micro_habit:
                    "Try one suggestion outside your norm weekly.",
            },
            respect: {
                behavioural_note:
                    "Direct and logical; learning softer communication.",
                behavioural_description:
                    "You communicate with clarity but can sound firm.",
                suggested_micro_habit:
                    "Add one empathetic phrase before critique.",
            },
            courage: {
                behavioural_note: "Assertive in ethical or logical conflicts.",
                behavioural_description: "You lead with ethics and truth.",
                suggested_micro_habit:
                    "Share a new improvement idea openly each week.",
            },
        },
        reflection_summary:
            "<p>Each Agile value invites you to widen your lens: commit fully, focus deeply, listen openly, respect kindly, and act courageously. When logic meets empathy, you become not just accurate - but inspiringly adaptable. You are the architect of precision-led agility.</p>",
    },
    CS: {
        trait_title: "The Careful Stabilizer",
        agile_desc_1: `<p>The Agile Compatibility Index reflects how your natural caution and sense of order work alongside flexibility and experimentation. Agility for you is about balancing steadiness with curiosity. Your responses reveal how you stay grounded under pressure, maintain structure amid change, and adapt without losing control.</p>`,
        personalized_insight: `<p>You bring consistency, discipline, and patience to your environment; people rely on you for your attention to detail and calm, organized nature. You prefer clarity, avoid chaos, and like following tested systems that guarantee results. The Agile Compatibility Index shows how your careful nature aligns with Agile adaptability. While you are steady, reliable, and precise, you may sometimes feel hesitant to take risks or shift from your comfort zone .</p><p>A high ACI score reflects your ability to blend consistency with responsiveness-maintaining order while adapting gracefully to new ideas. A developing score indicates the need to experiment more, speak up sooner, and trust others’ styles even when they differ. True agility for you lies in confidence over caution-learning that progress sometimes begins where plans feel incomplete.</p>`,
        agile_wise_breakdown: {
            commitment: {
                behavioural_note:
                    "Reliable and steady in fulfilling obligations.",
                behavioural_description:
                    "You stay true to deadlines and values.",
                suggested_micro_habit:
                    "Take one new responsibility every week to stretch beyond comfort.",
            },
            focus: {
                behavioural_note:
                    "Maintains deep attention with minimal distractions.",
                behavioural_description:
                    "You manage distractions well through discipline.",
                suggested_micro_habit:
                    "Try 30-minute time-boxed deep work sessions with zero interruption.",
            },
            openness: {
                behavioural_note:
                    "Gradually accepting new ideas; hesitant to change quickly.",
                behavioural_description: "You prefer stability to spontaneity.",
                suggested_micro_habit:
                    "Once a week, try a teammate’s suggestion even if it feels unfamiliar.",
            },
            respect: {
                behavioural_note:
                    "Patient communicator; values people and harmony.",
                behavioural_description: "You maintain warmth and patience.",
                suggested_micro_habit:
                    "Ask one colleague each week what support they need from you.",
            },
            courage: {
                behavioural_note:
                    "Needs to express views with more assertiveness.",
                behavioural_description: "You avoid spotlight moments.",
                suggested_micro_habit:
                    "Speak your opinion once a week in meetings-your perspective adds balance.",
            },
        },
        reflection_summary:
            "<p>Your thoughtful nature creates stability where others find uncertainty. True agility for you is not abandoning precision but trusting adaptability-blending logic with courage and comfort with curiosity. Each Agile value encourages you to loosen your careful rhythm just enough to let innovation in. When you do, you become the stabilizer who not only maintains balance but guides transformation with wisdom and grace.</p>",
    },
};
