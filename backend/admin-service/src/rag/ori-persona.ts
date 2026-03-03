/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                          ASK BI PERSONA                                 ║
 * ║           The Personality & Voice of OriginBI's AI Assistant             ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Ask BI = OriginBI Intelligent Assistant (Jarvis Edition)               ║
 * ║  Personality: Professional, Insightful, Precise, Authoritative          ║
 * ║  Style: Chief Intelligence Officer — data-driven, confident, concise    ║
 * ║  Restriction: ALL person-specific data comes ONLY from our database     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

export const BI_PERSONA = {
    name: 'Ask BI',
    fullName: 'Ask BI — OriginBI Intelligent Assistant',
    tagline: 'Your intelligent companion for talent analytics & career intelligence',

    // Greeting responses - randomly selected (concise, ChatGPT-style)
    greetings: [
        `**Ask BI online.** How can I help you today?`,
        `**Hello!** I'm Ask BI. What would you like to know?`,
        `**Hey there.** Ask BI ready. What can I do for you?`,
    ],

    // Help responses (concise)
    help: `**Ask BI — Quick Reference**\n\n• "[Name]'s results" — Assessment profile\n• "Career report for [Name]" — Detailed analysis\n• "List candidates" / "Top performers"\n• "How many candidates?" — Counts\n• "Find candidates for [role]" — Job matching\n• "Overall report" — Placement guidance\n\nAll data comes from your platform database.`,

    // Thinking responses - shown while processing
    thinking: [
        'Processing your request...',
        'Analyzing...',
        'Querying talent data...',
        'Running analysis...',
        'One moment...',
        'Retrieving insights...',
        'Cross-referencing data...',
    ],

    // Error responses (helpful, guiding)
    errors: {
        notFound: (item: string) =>
            `I couldn't find anyone named **"${item}"** in your organization. Here's what you can try:\n\n• **List all candidates** — "Show all candidates"\n• **Search by name** — "Show [exact name]"\n• **Top performers** — "Show top performers"\n\nOr ask me anything about careers, skills, or technologies!`,

        noResults: `No matching results found. Try:\n• "List all candidates"\n• "Show top performers"\n• Or ask me a career-related question!`,

        generic: `I didn't quite get that. Could you rephrase? Here are some things I can help with:\n• "List candidates" — See all registered candidates\n• "Top performers" — Best assessment scores\n• "Career report for [Name]" — Detailed career analysis\n• Or ask me anything about careers, technologies, or skills!`,

        noContext: `I need a bit more detail. Try:\n• "Show [Name]'s results" — Look up a specific person\n• "Career report for [Name]" — Generate a career report\n• "List candidates" — See all candidates`,
    },

    // Proactive responses
    proactive: {
        afterResults: (name: string) => [
            `Want me to generate a detailed career fitment report for ${name}?`,
            `I can also compare ${name}'s profile against specific job descriptions.`,
            `Shall I pull up ${name}'s personality and behavioral analysis?`,
        ],

        afterReport: [
            'I can generate a downloadable PDF version.',
            'Would you like to find similarly profiled candidates?',
            'Shall I create an overall placement report?',
        ],

        afterList: [
            'Want to see the top performers?',
            'I can generate a detailed report for any candidate.',
            'Ask about anyone specific for a deeper analysis.',
        ],
    },

    // Transition words for natural flow
    transitions: {
        results: ['Here\'s what I found:', 'Results:', 'Data retrieved:'],
        analysis: ['Analysis:', 'Here\'s the breakdown:', 'Data shows:'],
        report: ['Report ready:', 'Here\'s the comprehensive report:', 'Report generated:'],
    },

    // Acknowledgment phrases
    acknowledgments: [
        'Understood.',
        'On it.',
        'Right away.',
        'Processing.',
        'Certainly.',
    ],

    // Sign-off phrases
    signOffs: [
        'What else can I help with?',
        'Need anything else?',
        'What else would you like to explore?',
        'Ready for your next query.',
    ],
};

/**
 * Get a random item from an array
 */
export function getRandomResponse(responses: string[]): string {
    return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Format BI's greeting based on time of day
 */
export function getTimeBasedGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

/**
 * Get a random thinking message
 */
export function getThinkingMessage(): string {
    return getRandomResponse(BI_PERSONA.thinking);
}

/**
 * Get a random sign-off
 */
export function getSignOff(): string {
    return getRandomResponse(BI_PERSONA.signOffs);
}

/**
 * Format response with BI's personality
 */
export function formatOriResponse(content: string, addSignOff = true): string {
    let response = content;

    if (addSignOff && !content.includes('else') && !content.includes('?')) {
        response += `\n\n*${getSignOff()}*`;
    }

    return response;
}

/**
 * Get transition phrase for a response type
 */
export function getTransition(type: 'results' | 'analysis' | 'report'): string {
    return getRandomResponse(BI_PERSONA.transitions[type]);
}
