/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    AGENTIC RAG — TOOL REGISTRY                           ║
 * ║     Defines the available tools that the Planner Agent can select from   ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Each tool wraps an existing service and exposes it in a standardized    ║
 * ║  interface so the LLM Planner can reason about what to call.             ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────── Interfaces ───────────────────────────

/**
 * Result returned by any tool execution
 */
export interface ToolResult {
  /** Name of the tool that produced this result */
  toolName: string;
  /** Whether the tool execution succeeded */
  success: boolean;
  /** The data/answer produced by the tool */
  data: any;
  /** Human-readable summary of what the tool found */
  summary: string;
  /** Confidence score 0-1 */
  confidence: number;
  /** Extra metadata (row count, SQL used, etc.) */
  metadata?: Record<string, any>;
}

/**
 * Execution plan produced by the Planner Agent
 */
export interface ExecutionPlan {
  /** Tools to execute, in order (tools at the same step can run in parallel) */
  steps: ToolCall[];
  /** Brief reasoning from the planner about why these tools were chosen */
  reasoning: string;
  /** Whether the question requires data synthesis from multiple tools */
  requiresSynthesis: boolean;
}

/**
 * A single tool call within the execution plan
 */
export interface ToolCall {
  /** Name of the tool to call (must match a key in TOOL_DEFINITIONS) */
  tool: string;
  /** Parameters to pass to the tool */
  params: Record<string, any>;
  /** Why this tool was selected (brief) */
  reason: string;
}

// ─────────────────────────── Tool Definitions ───────────────────────────

/**
 * All available tools and their descriptions for the Planner LLM.
 * The descriptions are carefully crafted to help the LLM decide WHEN to use each tool.
 */
export const TOOL_DEFINITIONS = [
  {
    name: 'personal_info',
    description: `Answer personal questions about the currently logged-in user (e.g., "what is my name", "what is my email", "what is my profile"). Use this when the user asks about THEMSELVES directly using first-person pronouns (I, me, my).`,
    whenToUse: [
      'User asks "what is my name", "who am I"',
      'User asks "what is my email", "show my account"',
      'User asks "tell me about myself", "what is my profile"',
      'User asks "what is my personality", "what is my style"',
    ],
    params: {
      question: 'The question about the user',
    },
  },
  {
    name: 'text_to_sql',
    description: `Query the OriginBI database using natural language → SQL translation. Use this for ANY question that needs data from the database: counts, lists, aggregations, comparisons, filtering, statistics, trends, or specific records. This is the most powerful and flexible data tool.`,
    whenToUse: [
      'User asks "how many..." / "count of..." / "total..."',
      'User asks to "list..." / "show all..." / "get..."',
      'User asks about specific data: scores, candidates, companies, groups, assessments',
      'User wants comparisons, averages, rankings, distributions',
      'User asks "who scored highest" / "top performers" / "best candidate"',
      'User asks about corporate accounts, affiliates, programs, batches',
      'ANY question that requires querying the database for actual records',
    ],
    params: {
      question: 'The natural language question to convert to SQL',
    },
  },
  {
    name: 'semantic_search',
    description: `Search the knowledge base using vector similarity + lexical matching. Retrieves relevant documents, guides, and platform knowledge that have been stored as embeddings. Good for fuzzy matching, conceptual queries, and finding relevant context.`,
    whenToUse: [
      'User asks about platform features, policies, or documentation',
      'User asks conceptual questions about career roles, personality types, or assessments',
      'Enriching an answer with relevant background knowledge',
      'COMBINE with other tools to add context to data answers',
    ],
    params: {
      query: 'The search query',
      category: '(optional) Filter by document category',
      limit: '(optional) Max results, default 5',
    },
  },
  {
    name: 'person_lookup',
    description: `Find a specific person (candidate/student/employee) by name in the database. Returns their profile, assessment status, personality style, and basic info. Handles disambiguation when multiple people match.`,
    whenToUse: [
      'User asks about a specific person by name: "tell me about Rahul", "find John Smith"',
      'User asks "who is [name]" in a platform context',
      'User says a person\'s name and wants their details/profile',
    ],
    params: {
      name: 'The person\'s name to search for',
    },
  },
  {
    name: 'career_report',
    description: `Generate a detailed career/assessment report for a specific candidate. Includes their personality profile, career recommendations, agile score analysis, and role fitment. This is a premium feature that produces a comprehensive PDF-style report.`,
    whenToUse: [
      'User explicitly asks for a "report" for a person',
      'User asks "generate career report for [name]"',
      'User asks about career fitment for a specific candidate',
      'User says "career report", "assessment report", or "generate report"',
    ],
    params: {
      name: 'The person\'s name to generate the report for',
    },
  },
  {
    name: 'knowledge_ai',
    description: `Answer career guidance, technology, skill, and general knowledge questions using the AI brain. This tool does NOT query the database — it uses the LLM's training knowledge. Best for advisory content, career paths, skill recommendations, technology explanations, and industry insights.`,
    whenToUse: [
      'User asks career advice: "how to become a data scientist", "skills for web developer"',
      'User asks about technologies, tools, frameworks, or programming concepts',
      'User asks general knowledge questions: "what is Python", "explain machine learning"',
      'User asks for career path comparisons: "frontend vs backend", "data science vs AI"',
      'User asks about personality types, DISC profiles, behavioral styles (general info)',
      'COMBINE with text_to_sql to add career insights to data answers',
    ],
    params: {
      question: 'The question to answer',
    },
  },
  {
    name: 'conversation_context',
    description: `Retrieve conversation history and resolve references (pronouns, "them", "those", "that person"). Use this when the current question references something discussed earlier in the conversation and you need context to understand what they mean.`,
    whenToUse: [
      'User uses pronouns: "tell me about him", "show their scores", "list those"',
      'User says "that person", "that company", "from earlier"',
      'User asks a follow-up that doesn\'t make sense without context',
      'You need to resolve ambiguous references',
    ],
    params: {
      question: 'The question that needs context resolution',
    },
  },
];

/**
 * Build the tools description string for the Planner LLM prompt
 */
export function buildToolsPrompt(): string {
  return TOOL_DEFINITIONS.map((tool, i) => {
    const whenToUseStr = tool.whenToUse.map(u => `    - ${u}`).join('\n');
    const paramsStr = Object.entries(tool.params)
      .map(([k, v]) => `    ${k}: ${v}`)
      .join('\n');

    return `${i + 1}. **${tool.name}**
   ${tool.description}
   WHEN TO USE:
${whenToUseStr}
   PARAMETERS:
${paramsStr}`;
  }).join('\n\n');
}
