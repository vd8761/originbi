/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { EmbeddingsService } from './embeddings.service';
import { TextToSqlService } from './text-to-sql.service';
import { OriIntelligenceService } from './ori-intelligence.service';
import { ChatMemoryService } from './chat-memory.service';
import { ConversationService } from './conversation.service';
import { FutureRoleReportService } from './future-role-report.service';
import { UserContext } from '../common/interfaces/user-context.interface';

import {
  ToolResult,
  ExecutionPlan,
  ToolCall,
  buildToolsPrompt,
} from './tools/tool-registry';
import { getTokenTrackerCallback } from './utils/token-tracker';
import { invokeWithFallback } from './utils/llm-fallback';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║              🤖 AGENTIC RAG ORCHESTRATOR v2.0 — ADVANCED                 ║
 * ║       LLM Planner → Tool Selection → Parallel Execution → Synthesis     ║
 * ║       + ReAct Self-Reflection · Adaptive Chaining · Complexity Scoring  ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  HOW IT WORKS:                                                           ║
 * ║    1. Query Complexity Analyzer scores question difficulty               ║
 * ║    2. Planner Agent (LLM) selects 1-3 tools with chain-of-thought       ║
 * ║    3. Executor runs tools in parallel with adaptive chaining             ║
 * ║    4. ReAct Reflector evaluates output quality → retry if needed         ║
 * ║    5. Synthesizer Agent merges multi-tool results into one answer        ║
 * ║    6. Telemetry records full execution trace for observability           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

interface AgentResult {
  answer: string;
  searchType: string;
  confidence: number;
  sources?: any;
  evidence?: Record<string, any>;
  toolsUsed: string[];
  planningTimeMs: number;
  executionTimeMs: number;
  complexityScore?: number;
  reflectionApplied?: boolean;
  chainedTools?: string[];
}

/** Telemetry entry for each tool execution */
interface ToolTelemetry {
  toolName: string;
  durationMs: number;
  success: boolean;
  confidence: number;
  chained: boolean;
}

/** Query complexity assessment */
interface ComplexityAssessment {
  score: number;       // 1-10
  isMultiPart: boolean;
  needsData: boolean;
  needsAnalysis: boolean;
  needsPersonLookup: boolean;
  suggestedToolCount: number;
}

@Injectable()
export class AgentOrchestratorService {
  private readonly logger = new Logger('AgentRAG');
  private plannerLlm: ChatGoogleGenerativeAI | null = null;
  private synthesizerLlm: ChatGoogleGenerativeAI | null = null;
  private reflectorLlm: ChatGoogleGenerativeAI | null = null;
  private plannerFallbackLlm: ChatGroq | null = null;
  private synthesizerFallbackLlm: ChatGroq | null = null;
  private reflectorFallbackLlm: ChatGroq | null = null;

  // Telemetry buffer — last N executions for observability
  private readonly telemetryBuffer: Array<{
    question: string;
    tools: ToolTelemetry[];
    totalMs: number;
    timestamp: Date;
  }> = [];
  private readonly MAX_TELEMETRY = 100;

  constructor(
    private readonly dataSource: DataSource,
    private readonly embeddingsService: EmbeddingsService,
    private readonly textToSqlService: TextToSqlService,
    private readonly oriIntelligence: OriIntelligenceService,
    private readonly chatMemory: ChatMemoryService,
    private readonly conversationService: ConversationService,
    private readonly futureRoleReportService: FutureRoleReportService,
  ) {
    this.logger.log('🤖 Agentic RAG Orchestrator v2.0 (ReAct + Adaptive Chaining) initialized');
  }

  // ─────────────── LLM Instances ───────────────

  private getPlannerLlm(): ChatGoogleGenerativeAI {
    if (!this.plannerLlm) {
      const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GOOGLE_API_KEY/GEMINI_API_KEY not set');
      const plannerModel =
        process.env.GEMINI_PLANNER_MODEL ||
        process.env.GEMINI_LLM_MODEL ||
        'gemini-2.0-flash';
      const plannerMaxTokens = Math.max(180, Number(process.env.AGENT_PLANNER_MAX_OUTPUT_TOKENS || 320));
      this.plannerLlm = new ChatGoogleGenerativeAI({
        apiKey,
        model: plannerModel,
        temperature: 0,       // Deterministic planning
        maxOutputTokens: plannerMaxTokens, // Plans are compact JSON
        callbacks: [getTokenTrackerCallback('Agent Planner')],
      });
    }
    return this.plannerLlm;
  }

  private getPlannerFallbackLlm(): ChatGroq {
    if (!this.plannerFallbackLlm) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error('GROQ_API_KEY not set for fallback');
      const plannerMaxTokens = Math.max(180, Number(process.env.AGENT_PLANNER_MAX_OUTPUT_TOKENS || 420));
      this.plannerFallbackLlm = new ChatGroq({
        apiKey,
        model: 'llama-3.3-70b-versatile',
        temperature: 0,
        maxTokens: plannerMaxTokens,
        timeout: 10000,
        callbacks: [getTokenTrackerCallback('Agent Planner (Groq Fallback)')],
      });
    }
    return this.plannerFallbackLlm;
  }

  private getSynthesizerLlm(): ChatGoogleGenerativeAI {
    if (!this.synthesizerLlm) {
      const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GOOGLE_API_KEY/GEMINI_API_KEY not set');
      const synthesizerModel = process.env.GEMINI_SYNTH_MODEL || 'gemini-2.5-flash';
      const synthesizerMaxTokens = Math.max(260, Number(process.env.AGENT_SYNTH_MAX_OUTPUT_TOKENS || 700));
      this.synthesizerLlm = new ChatGoogleGenerativeAI({
        apiKey,
        model: synthesizerModel,
        temperature: 0.2,
        maxOutputTokens: synthesizerMaxTokens,
        callbacks: [getTokenTrackerCallback('Agent Synthesizer')],
      });
    }
    return this.synthesizerLlm;
  }

  private getSynthesizerFallbackLlm(): ChatGroq {
    if (!this.synthesizerFallbackLlm) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error('GROQ_API_KEY not set for fallback');
      const synthesizerMaxTokens = Math.max(260, Number(process.env.AGENT_SYNTH_MAX_OUTPUT_TOKENS || 700));
      this.synthesizerFallbackLlm = new ChatGroq({
        apiKey,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        maxTokens: synthesizerMaxTokens,
        timeout: 15000,
        callbacks: [getTokenTrackerCallback('Agent Synthesizer (Groq Fallback)')],
      });
    }
    return this.synthesizerFallbackLlm;
  }

  private getReflectorLlm(): ChatGoogleGenerativeAI {
    if (!this.reflectorLlm) {
      const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GOOGLE_API_KEY/GEMINI_API_KEY not set');
      const reflectorModel =
        process.env.GEMINI_REFLECTOR_MODEL ||
        process.env.GEMINI_LLM_MODEL ||
        'gemini-2.0-flash';
      const reflectorMaxTokens = Math.max(120, Number(process.env.AGENT_REFLECTOR_MAX_OUTPUT_TOKENS || 180));
      this.reflectorLlm = new ChatGoogleGenerativeAI({
        apiKey,
        model: reflectorModel,
        temperature: 0,
        maxOutputTokens: reflectorMaxTokens, // Reflections are very compact
        callbacks: [getTokenTrackerCallback('Agent Reflector')],
      });
    }
    return this.reflectorLlm;
  }

  private getReflectorFallbackLlm(): ChatGroq {
    if (!this.reflectorFallbackLlm) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error('GROQ_API_KEY not set for fallback');
      const reflectorMaxTokens = Math.max(120, Number(process.env.AGENT_REFLECTOR_MAX_OUTPUT_TOKENS || 180));
      this.reflectorFallbackLlm = new ChatGroq({
        apiKey,
        model: 'llama-3.3-70b-versatile',
        temperature: 0,
        maxTokens: reflectorMaxTokens,
        timeout: 8000,
        callbacks: [getTokenTrackerCallback('Agent Reflector (Groq Fallback)')],
      });
    }
    return this.reflectorFallbackLlm;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN ENTRY POINT — Called by RagService.query()
  // ═══════════════════════════════════════════════════════════════════════════
  async agentQuery(
    question: string,
    user: UserContext,
    conversationId: number = 0,
    conversationHistory: string = '',
  ): Promise<AgentResult> {
    const startTime = Date.now();
    this.logger.log(`\n${'═'.repeat(70)}`);
    this.logger.log(`🤖 Agentic RAG v2.0: "${question}" [${user.role}]`);

    const telemetryEntries: ToolTelemetry[] = [];

    try {
      // ── STEP 0: QUERY COMPLEXITY ANALYSIS ──
      const complexity = this.analyzeQueryComplexity(question);
      this.logger.log(`📊 Complexity: ${complexity.score}/10 (data=${complexity.needsData} analysis=${complexity.needsAnalysis} person=${complexity.needsPersonLookup} multiPart=${complexity.isMultiPart})`);

      // ── STEP 1: PLAN — LLM decides which tools to use ──
      const planStart = Date.now();
      const plan = await this.plan(question, user, conversationHistory, complexity);
      const planningTimeMs = Date.now() - planStart;
      this.logger.log(`📋 Plan: ${plan.steps.map(s => s.tool).join(' + ')} (${planningTimeMs}ms)`);
      this.logger.log(`💭 Reasoning: ${plan.reasoning}`);

      // ── STEP 2: EXECUTE — Run selected tools ──
      const execStart = Date.now();
      let results = await this.execute(plan, question, user, conversationId, conversationHistory);
      const executionTimeMs = Date.now() - execStart;
      this.logger.log(`⚡ Executed ${results.length} tools in ${executionTimeMs}ms`);

      const disambiguationResult = results.find(
        (r) => r.toolName === 'person_lookup' && r.success && r.data?.disambiguationNeeded,
      );
      if (disambiguationResult) {
        const matches = Array.isArray(disambiguationResult.data?.allMatches)
          ? disambiguationResult.data.allMatches
          : [];
        const options = matches
          .map((m: any) => m?.full_name)
          .filter((n: any) => typeof n === 'string' && n.trim().length > 0)
          .slice(0, 10);

        return {
          answer: disambiguationResult.summary,
          searchType: 'disambiguation',
          confidence: 0.7,
          sources: {
            disambiguation: {
              handler: 'person_lookup',
              searchTerm: disambiguationResult.data?.queryName || this.extractNameFromQuestion(question) || question,
              options,
            },
          },
          toolsUsed: ['person_lookup'],
          planningTimeMs,
          executionTimeMs,
          complexityScore: complexity.score,
        };
      }

      // Record telemetry for executed tools
      for (const r of results) {
        telemetryEntries.push({
          toolName: r.toolName,
          durationMs: r.metadata?.executionTimeMs || 0,
          success: r.success,
          confidence: r.confidence,
          chained: false,
        });
      }

      // ── STEP 2.5: ADAPTIVE CHAINING — Auto-supplement low-confidence results ──
      const primaryResult = results.find(r => r.toolName !== 'conversation_context');
      let chainedTools: string[] = [];
      if (primaryResult && primaryResult.confidence < 0.5 && primaryResult.toolName === 'text_to_sql') {
        this.logger.log(`🔗 Adaptive chain: text_to_sql confidence=${primaryResult.confidence} → chaining knowledge_ai`);
        const fallbackResult = await this.executeKnowledgeAI(question, user, conversationHistory);
        if (fallbackResult.success && fallbackResult.confidence > primaryResult.confidence) {
          results.push(fallbackResult);
          chainedTools.push('knowledge_ai');
          plan.requiresSynthesis = true;
          telemetryEntries.push({
            toolName: 'knowledge_ai',
            durationMs: 0,
            success: fallbackResult.success,
            confidence: fallbackResult.confidence,
            chained: true,
          });
        }
      } else if (primaryResult && primaryResult.confidence < 0.5 && primaryResult.toolName === 'knowledge_ai') {
        this.logger.log(`🔗 Adaptive chain: knowledge_ai confidence=${primaryResult.confidence} → chaining text_to_sql`);
        const fallbackResult = await this.executeTextToSql(question, user, conversationHistory);
        if (fallbackResult.success && fallbackResult.confidence > primaryResult.confidence) {
          results.push(fallbackResult);
          chainedTools.push('text_to_sql');
          plan.requiresSynthesis = true;
          telemetryEntries.push({
            toolName: 'text_to_sql',
            durationMs: fallbackResult.metadata?.executionTimeMs || 0,
            success: fallbackResult.success,
            confidence: fallbackResult.confidence,
            chained: true,
          });
        }
      }

      // ── STEP 3: SYNTHESIZE — Combine results ──
      let answer = await this.synthesize(question, plan, results, user);

      // ── STEP 4: ReAct SELF-REFLECTION — Validate answer quality ──
      let reflectionApplied = false;
      if (complexity.score >= 8 && answer.length > 140 && results.length > 1) {
        const reflection = await this.reflectOnAnswer(question, answer, results);
        if (reflection.needsImprovement && reflection.improvedAnswer) {
          this.logger.log(`🔄 ReAct reflection applied: ${reflection.reason}`);
          answer = reflection.improvedAnswer;
          reflectionApplied = true;
        }
      }

      answer = this.postProcessAnswer(answer);

      const toolsUsed = results.map(r => r.toolName);
      const maxConfidence = Math.max(...results.map(r => r.confidence), 0.5);
      const evidence = this.buildEvidence(results, toolsUsed, planningTimeMs, executionTimeMs);

      // Record telemetry
      this.recordTelemetry(question, telemetryEntries, Date.now() - startTime);

      this.logger.log(`✅ Agent complete: ${toolsUsed.join(' + ')} (confidence: ${maxConfidence}${reflectionApplied ? ' +reflected' : ''}${chainedTools.length > 0 ? ` +chained:${chainedTools.join(',')}` : ''})`);
      this.logger.log(`${'═'.repeat(70)}\n`);

      return {
        answer,
        searchType: `agent:${toolsUsed.join('+')}`,
        confidence: maxConfidence,
        sources: this.extractSources(results),
        evidence,
        toolsUsed,
        planningTimeMs,
        executionTimeMs,
        complexityScore: complexity.score,
        reflectionApplied,
        chainedTools: chainedTools.length > 0 ? chainedTools : undefined,
      };
    } catch (error) {
      this.logger.error(`❌ Agent orchestrator failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: PLANNER — LLM selects tools based on the question
  // ═══════════════════════════════════════════════════════════════════════════
  private async plan(
    question: string,
    user: UserContext,
    conversationHistory: string,
    complexity?: ComplexityAssessment,
  ): Promise<ExecutionPlan> {
    const toolsPrompt = buildToolsPrompt();

    const systemPrompt = `You are the Planner Agent for OriginBI's Ask BI system. Your ONLY job is to decide which tools to call to answer the user's question.

═══ AVAILABLE TOOLS ═══
${toolsPrompt}

═══ YOUR TASK ═══
Given the user's question, conversation context, and their role, output a JSON plan selecting 1-3 tools.

═══ RULES ═══
1. SELECT THE MINIMUM TOOLS NEEDED. Don't add tools unless they're truly needed.
2. For simple data questions (counts, lists, filters), use ONLY "text_to_sql".
3. For person-specific questions ("tell me about X"), use ONLY "person_lookup".
4. For career advice, use ONLY "knowledge_ai".
5. For COMPLEX questions that need BOTH data AND analysis/advice:
   - Example: "Show top performers and suggest training" → ["text_to_sql", "knowledge_ai"]
   - Example: "Find Rahul and give career advice" → ["person_lookup", "knowledge_ai"]
6. Use "conversation_context" ONLY if the question contains pronouns (him/her/them/those/that) or seems like a follow-up needing context.
7. Use "semantic_search" ONLY when the question asks about platform documentation or needs knowledge base enrichment alongside another tool.
8. Use "career_report" ONLY if the user explicitly asks for a "report" or "generate report".
9. For "how many", "count", "total", "list", "show all" → ALWAYS "text_to_sql".
10. For "what is [technology/concept]", "how to become", "skills for" → ALWAYS "knowledge_ai".

═══ USER CONTEXT ═══
- User Role: ${user.role}
- User ID: ${user.id}
${user.corporateId ? `- Corporate ID: ${user.corporateId}` : ''}
${conversationHistory ? `\n═══ CONVERSATION HISTORY (use to understand follow-ups) ═══\n${conversationHistory.slice(0, 600)}\n` : ''}

═══ OUTPUT FORMAT ═══
Output ONLY valid JSON, no markdown, no explanation. Format:
{
  "steps": [
    {"tool": "tool_name", "params": {"key": "value"}, "reason": "brief reason"}
  ],
  "reasoning": "1-line explanation of the overall plan",
  "requiresSynthesis": true/false
}

Set requiresSynthesis=true ONLY when using 2+ tools that produce different types of content to combine.`;

    try {
      const response = await invokeWithFallback({
        logger: this.logger,
        context: 'Agent planner',
        invokePrimary: () =>
          this.getPlannerLlm().invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(question),
          ]),
        invokeFallback: () =>
          this.getPlannerFallbackLlm().invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(question),
          ]),
      });

      const rawOutput = response.content.toString().trim();
      const plan = this.parsePlannerOutput(rawOutput, question);
      return this.optimizePlanForComplexity(plan, question, complexity);
    } catch (error) {
      this.logger.warn(`Planner LLM failed: ${error.message} — using fallback plan`);
      const fallbackPlan = this.getFallbackPlan(question, user);
      return this.optimizePlanForComplexity(fallbackPlan, question, complexity);
    }
  }

  /**
   * Parse the Planner LLM's JSON output into a typed ExecutionPlan
   */
  private parsePlannerOutput(rawOutput: string, question: string): ExecutionPlan {
    try {
      // Clean the output — remove code fences if present
      let cleaned = rawOutput
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      // Extract JSON from any surrounding text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }

      const parsed = JSON.parse(cleaned);

      // Validate the structure
      if (!parsed.steps || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
        throw new Error('No steps in plan');
      }

      const validToolNames = new Set([
        'text_to_sql', 'semantic_search', 'person_lookup',
        'career_report', 'knowledge_ai', 'conversation_context', 'personal_info',
      ]);

      // Filter out invalid tools and cap at 3
      const validSteps: ToolCall[] = parsed.steps
        .filter((step: any) => validToolNames.has(step.tool))
        .slice(0, 3)
        .map((step: any) => ({
          tool: step.tool,
          params: step.params || {},
          reason: step.reason || '',
        }));

      if (validSteps.length === 0) {
        throw new Error('No valid tools selected');
      }

      // Inject the question into tool params where needed
      for (const step of validSteps) {
        if (step.tool === 'text_to_sql' && !step.params.question) {
          step.params.question = question;
        }
        if (step.tool === 'knowledge_ai' && !step.params.question) {
          step.params.question = question;
        }
        if (step.tool === 'semantic_search' && !step.params.query) {
          step.params.query = question;
        }
        if (step.tool === 'conversation_context' && !step.params.question) {
          step.params.question = question;
        }
        if (step.tool === 'person_lookup' && !step.params.name) {
          // Try to extract name from the question
          step.params.name = this.extractNameFromQuestion(question);
        }
        if (step.tool === 'career_report' && !step.params.name) {
          step.params.name = this.extractNameFromQuestion(question);
        }
      }

      return {
        steps: validSteps,
        reasoning: parsed.reasoning || 'Plan generated',
        requiresSynthesis: parsed.requiresSynthesis === true && validSteps.length > 1,
      };
    } catch (parseError) {
      this.logger.warn(`Plan parse error: ${parseError.message} — raw: ${rawOutput.slice(0, 200)}`);
      const recovered = this.recoverPlanFromMalformedOutput(rawOutput, question);
      if (recovered) {
        this.logger.log(`🛠️ Recovered plan from malformed output: ${recovered.steps.map(s => s.tool).join(' + ')}`);
        return recovered;
      }
      return this.getFallbackPlan(question, {} as UserContext);
    }
  }

  private recoverPlanFromMalformedOutput(rawOutput: string, question: string): ExecutionPlan | null {
    const raw = (rawOutput || '').toLowerCase();
    const detectedSteps: ToolCall[] = [];

    const addStep = (tool: ToolCall['tool'], params: Record<string, any>, reason: string) => {
      if (!detectedSteps.find(s => s.tool === tool)) {
        detectedSteps.push({ tool, params, reason });
      }
    };

    if (raw.includes('conversation_context')) {
      addStep('conversation_context', { question }, 'Recovered from malformed planner output');
    }
    if (raw.includes('text_to_sql')) {
      addStep('text_to_sql', { question }, 'Recovered from malformed planner output');
    }
    if (raw.includes('semantic_')) {
      addStep('semantic_search', { query: question }, 'Recovered from malformed planner output');
    }
    if (raw.includes('person_lookup')) {
      addStep('person_lookup', { name: this.extractNameFromQuestion(question) }, 'Recovered from malformed planner output');
    }
    if (raw.includes('career_report')) {
      addStep('career_report', { name: this.extractNameFromQuestion(question) || question }, 'Recovered from malformed planner output');
    }
    if (raw.includes('knowledge_ai')) {
      addStep('knowledge_ai', { question }, 'Recovered from malformed planner output');
    }
    if (raw.includes('personal_info')) {
      addStep('personal_info', { question }, 'Recovered from malformed planner output');
    }

    if (detectedSteps.length === 0) return null;

    return {
      steps: detectedSteps.slice(0, 3),
      reasoning: 'Recovered malformed planner output using tool-name extraction',
      requiresSynthesis: detectedSteps.length > 1,
    };
  }

  private optimizePlanForComplexity(
    plan: ExecutionPlan,
    question: string,
    complexity?: ComplexityAssessment,
  ): ExecutionPlan {
    if (!complexity) {
      return plan;
    }

    const steps = [...plan.steps];
    const hasTool = (tool: ToolCall['tool']) => steps.some(s => s.tool === tool);
    const addStep = (step: ToolCall) => {
      if (!hasTool(step.tool) && steps.length < 3) {
        steps.push(step);
      }
    };

    // Force data grounding for data-heavy or multi-part questions.
    if (complexity.needsData && !hasTool('text_to_sql')) {
      addStep({
        tool: 'text_to_sql',
        params: { question },
        reason: 'Complexity optimizer: requires deterministic data grounding',
      });
    }

    // Add analysis for mixed ask (data + guidance) so synthesis can produce an actionable answer.
    if ((complexity.needsAnalysis || complexity.isMultiPart) && !hasTool('knowledge_ai')) {
      addStep({
        tool: 'knowledge_ai',
        params: { question },
        reason: 'Complexity optimizer: requires analytical layer for multi-intent query',
      });
    }

    const extractedName = this.extractNameFromQuestion(question);
    if (complexity.needsPersonLookup && extractedName && !hasTool('person_lookup')) {
      addStep({
        tool: 'person_lookup',
        params: { name: extractedName },
        reason: 'Complexity optimizer: explicit person lookup detected',
      });
    }

    // Add lightweight context resolution for clear follow-up pronouns.
    if (this.shouldUseConversationContext(question) && !hasTool('conversation_context')) {
      addStep({
        tool: 'conversation_context',
        params: { question },
        reason: 'Complexity optimizer: pronoun-based follow-up context required',
      });
    }

    const priority: Record<ToolCall['tool'], number> = {
      conversation_context: 1,
      person_lookup: 2,
      personal_info: 3,
      text_to_sql: 4,
      semantic_search: 5,
      knowledge_ai: 6,
      career_report: 7,
    };

    const sorted = steps
      .sort((a, b) => (priority[a.tool] ?? 99) - (priority[b.tool] ?? 99))
      .slice(0, 3);

    const dataToolUsed = sorted.some(s => s.tool === 'text_to_sql' || s.tool === 'person_lookup' || s.tool === 'personal_info');
    const analysisToolUsed = sorted.some(s => s.tool === 'knowledge_ai' || s.tool === 'semantic_search' || s.tool === 'career_report');
    const requiresSynthesis = sorted.length > 1 && (analysisToolUsed || dataToolUsed);

    return {
      steps: sorted,
      reasoning: plan.reasoning,
      requiresSynthesis,
    };
  }

  private shouldUseConversationContext(question: string): boolean {
    return /\b(him|her|them|those|that one|that person|same person|previous|above|earlier)\b/i.test(question);
  }

  /**
   * Fallback plan when the Planner LLM fails — uses keyword heuristics
   */
  private getFallbackPlan(question: string, _user: UserContext): ExecutionPlan {
    const q = question.toLowerCase();

    // Direct personal profile/self questions
    if (/\b(what is my name|who am i|my profile|my email|my account|about me)\b/i.test(q)) {
      return {
        steps: [{ tool: 'personal_info', params: { question }, reason: 'Self-profile query' }],
        reasoning: 'Keyword match: self question → personal_info',
        requiresSynthesis: false,
      };
    }

    // Data questions → text_to_sql
    if (/\b(how many|count|total|list|show all|get all|display|average|highest|lowest|top \d+)\b/i.test(q)) {
      return {
        steps: [{ tool: 'text_to_sql', params: { question }, reason: 'Data query detected' }],
        reasoning: 'Keyword match: data question → text_to_sql',
        requiresSynthesis: false,
      };
    }

    // Person lookup
    if (/\b(tell me about|find|search for|who is|look up)\b/i.test(q) && this.extractNameFromQuestion(question)) {
      return {
        steps: [{ tool: 'person_lookup', params: { name: this.extractNameFromQuestion(question) }, reason: 'Person query detected' }],
        reasoning: 'Keyword match: person query → person_lookup',
        requiresSynthesis: false,
      };
    }

    // Career report
    if ((/\breport\b/i.test(q) && !!this.extractNameFromQuestion(question)) || /\b(generate|create|show)\b.*\breport\b/i.test(q)) {
      return {
        steps: [{ tool: 'career_report', params: { name: this.extractNameFromQuestion(question) || question }, reason: 'Report request' }],
        reasoning: 'Keyword match: report request → career_report',
        requiresSynthesis: false,
      };
    }

    // Career/skill advice
    if (/\b(career|skill|how to become|eligible|suitable|fit for|advice|guidance|path|roadmap)\b/i.test(q)) {
      return {
        steps: [{ tool: 'knowledge_ai', params: { question }, reason: 'Career guidance query' }],
        reasoning: 'Keyword match: career/skill question → knowledge_ai',
        requiresSynthesis: false,
      };
    }

    // One-word or short ambiguous queries should avoid text_to_sql fallback.
    const tokenCount = q.split(/\s+/).filter(Boolean).length;
    if (tokenCount <= 2 && !/\b(list|show|get|count|total|how many|average|top|lowest|highest)\b/i.test(q)) {
      return {
        steps: [{ tool: 'knowledge_ai', params: { question }, reason: 'Short ambiguous query' }],
        reasoning: 'Short non-data query → knowledge_ai',
        requiresSynthesis: false,
      };
    }

    // Default: try text_to_sql first (it's the most versatile)
    return {
      steps: [{ tool: 'text_to_sql', params: { question }, reason: 'Default tool' }],
      reasoning: 'No specific pattern matched — using text_to_sql as default',
      requiresSynthesis: false,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: EXECUTOR — Run selected tools (parallel where possible)
  // ═══════════════════════════════════════════════════════════════════════════
  private async execute(
    plan: ExecutionPlan,
    question: string,
    user: UserContext,
    conversationId: number,
    conversationHistory: string,
  ): Promise<ToolResult[]> {
    // If conversation_context is one of the tools, run it first to resolve context,
    // then pass the resolved info to other tools
    const contextStep = plan.steps.find(s => s.tool === 'conversation_context');
    const otherSteps = plan.steps.filter(s => s.tool !== 'conversation_context');

    let resolvedContext = conversationHistory;
    let contextResult: ToolResult | null = null;
    if (contextStep) {
      contextResult = await this.executeConversationContext(
        question, user, conversationId, conversationHistory,
      );
      if (contextResult.success && contextResult.data?.resolvedQuestion) {
        // Use resolved question for subsequent tools
        question = contextResult.data.resolvedQuestion;
      }
      resolvedContext = contextResult.data?.enrichedHistory || conversationHistory;
    }

    // If planner selected only context, auto-expand with a concrete tool.
    if (otherSteps.length === 0) {
      const autoPlan = this.getFallbackPlan(question, user);
      const autoSteps = autoPlan.steps.filter(s => s.tool !== 'conversation_context');
      if (autoSteps.length > 0) {
        otherSteps.push(...autoSteps);
        this.logger.log(`🔁 Auto-expanded context-only plan → ${autoSteps.map(s => s.tool).join(' + ')}`);
      }
    }

    // Execute remaining tools in parallel
    const toolPromises = otherSteps.map(step =>
      this.executeTool(step, question, user, conversationId, resolvedContext),
    );

    const results = await Promise.allSettled(toolPromises);
    const toolResults: ToolResult[] = [];

    // Include context result if it was run
    if (contextResult) {
      toolResults.push(contextResult);
    }

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        toolResults.push(result.value);
      } else {
        this.logger.warn(`Tool ${otherSteps[i].tool} failed: ${result.reason}`);
        toolResults.push({
          toolName: otherSteps[i].tool,
          success: false,
          data: null,
          summary: `Tool failed: ${result.reason?.message || 'Unknown error'}`,
          confidence: 0,
        });
      }
    }

    return toolResults;
  }

  /**
   * Execute a single tool
   */
  private async executeTool(
    step: ToolCall,
    question: string,
    user: UserContext,
    conversationId: number,
    conversationHistory: string,
  ): Promise<ToolResult> {
    const startTime = Date.now();

    switch (step.tool) {
      case 'text_to_sql':
        return await this.executeTextToSql(step.params.question || question, user, conversationHistory);

      case 'semantic_search':
        return await this.executeSemanticSearch(step.params.query || question, step.params.category, step.params.limit);

      case 'person_lookup':
        return await this.executePersonLookup(step.params.name, user);

      case 'career_report':
        return await this.executeCareerReport(step.params.name, user);

      case 'knowledge_ai':
        return await this.executeKnowledgeAI(step.params.question || question, user, conversationHistory);

      case 'conversation_context':
        return await this.executeConversationContext(question, user, conversationId, conversationHistory);

      case 'personal_info':
        return await this.executePersonalInfo(step.params.question || question, user);

      default:
        return {
          toolName: step.tool,
          success: false,
          data: null,
          summary: `Unknown tool: ${step.tool}`,
          confidence: 0,
        };
    }
  }

  // ─────────────── Tool Implementations ───────────────

  private async executePersonalInfo(
    question: string,
    user: UserContext,
  ): Promise<ToolResult> {
    try {
      const userId = user?.id || 0;
      const userEmail = user?.email || '';
      const userProfile = await this.oriIntelligence.getUserProfile(userId, userEmail);

      const answer = this.oriIntelligence.answerPersonalQuestion(question, userProfile);

      if (answer) {
        return {
          toolName: 'personal_info',
          success: true,
          data: { answer },
          summary: answer,
          confidence: 1.0,
        };
      }

      return {
        toolName: 'personal_info',
        success: false,
        data: null,
        summary: "Could not find a personal answer profile match.",
        confidence: 0,
      };
    } catch (error) {
      this.logger.warn(`personal_info tool failed: ${error.message}`);
      return {
        toolName: 'personal_info',
        success: false,
        data: null,
        summary: `Could not retrieve personal info: ${error.message}`,
        confidence: 0,
      };
    }
  }

  private async executeTextToSql(
    question: string,
    user: UserContext,
    conversationHistory: string,
  ): Promise<ToolResult> {
    try {
      const result = await this.textToSqlService.answerQuestion(question, user, conversationHistory);
      return {
        toolName: 'text_to_sql',
        success: result.confidence > 0.3,
        data: {
          answer: result.answer,
          rawData: result.rawData?.slice(0, 30),
          rowCount: result.rowCount,
          sql: result.sql,
        },
        summary: result.answer,
        confidence: result.confidence,
        metadata: {
          rowCount: result.rowCount,
          executionTimeMs: result.executionTimeMs,
          warnings: result.warnings,
        },
      };
    } catch (error) {
      this.logger.warn(`text_to_sql tool failed: ${error.message}`);
      return {
        toolName: 'text_to_sql',
        success: false,
        data: null,
        summary: 'I could not process that request right now.',
        confidence: 0,
      };
    }
  }

  private async executeSemanticSearch(
    query: string,
    category?: string,
    limit: number = 5,
  ): Promise<ToolResult> {
    try {
      const semanticProfile = this.inferSemanticHybridProfile(query);
      const requestedCategories = category
        ? [category, ...semanticProfile.categories]
        : semanticProfile.categories;

      const results = await this.embeddingsService.semanticSearch(
        query,
        limit,
        requestedCategories,
        0.3,
        {
          hybridWeights: { vector: 1.08, lexical: 1.0 },
          categoryWeights: semanticProfile.categoryWeights,
          sourceWeights: semanticProfile.sourceWeights,
          allowCrossCategoryFallback: true,
        },
      );
      if (!results || results.length === 0) {
        return {
          toolName: 'semantic_search',
          success: false,
          data: [],
          summary: 'No relevant documents found in the knowledge base.',
          confidence: 0.3,
        };
      }

      const contextChunks = results.map((doc: any, i: number) =>
        `[${i + 1}] ${doc.content}`,
      ).join('\n---\n');

      return {
        toolName: 'semantic_search',
        success: true,
        data: { documents: results, contextChunks },
        summary: `Found ${results.length} relevant knowledge base documents.`,
        confidence: 0.7,
        metadata: {
          documentCount: results.length,
          categories: requestedCategories,
        },
      };
    } catch (error) {
      this.logger.warn(`semantic_search tool failed: ${error.message}`);
      return {
        toolName: 'semantic_search',
        success: false,
        data: [],
        summary: `Knowledge base search failed: ${error.message}`,
        confidence: 0,
      };
    }
  }

  private inferSemanticHybridProfile(query: string): {
    categories: string[];
    categoryWeights: Record<string, number>;
    sourceWeights: Record<string, number>;
  } {
    const q = String(query || '').toLowerCase();
    const categories = new Set<string>();
    const categoryWeights: Record<string, number> = {};

    const addCategory = (name: string, weight: number) => {
      categories.add(name);
      categoryWeights[name] = Math.max(categoryWeights[name] || 1, weight);
    };

    if (/\b(department|degree|academic|college|campus|program|specialization|specialisation|branch)\b/.test(q)) {
      addCategory('education', 1.25);
      addCategory('department', 1.1);
    }
    if (/\b(course|certification|curriculum|training|learning path|syllabus)\b/.test(q)) {
      addCategory('course', 1.22);
      addCategory('education', 1.08);
    }
    if (/\b(tool|tools|software|platform|tech stack|technology|framework|library)\b/.test(q)) {
      addCategory('tool', 1.2);
    }
    if (/\b(personality|trait|traits|disc|behavioral|behavioural|aptitude style)\b/.test(q)) {
      addCategory('personality', 1.24);
      addCategory('career', 1.08);
    }
    if (/\b(career|role|job|path|opportunity|future role|position)\b/.test(q)) {
      addCategory('career', 1.2);
    }

    if (categories.size === 0) {
      addCategory('career', 1.12);
      addCategory('education', 1.08);
    }

    return {
      categories: Array.from(categories),
      categoryWeights,
      sourceWeights: {
        career_roles: 1.18,
        department_degrees: 1.18,
        courses: 1.12,
        personality_traits: 1.1,
        career_role_tools: 1.08,
        programs: 1.05,
      },
    };
  }

  private async executePersonLookup(
    name: string,
    user: UserContext,
  ): Promise<ToolResult> {
    if (!name) {
      return {
        toolName: 'person_lookup',
        success: false,
        data: null,
        summary: 'No person name provided to search for.',
        confidence: 0,
      };
    }

    try {
      const cleanName = this.normalizeLookupName(name);
      if (!cleanName) {
        return {
          toolName: 'person_lookup',
          success: false,
          data: null,
          summary: 'Please provide a valid person name to search for.',
          confidence: 0,
        };
      }

      const userRole = (user?.role || 'STUDENT').toUpperCase();
      const corporateId = (user as any)?.corporateId;
      const shortName = cleanName.length <= 3;

      // Build RBAC-scoped query
      let filter = '';
      const params: any[] = [
        `%${cleanName.toLowerCase()}%`,
        cleanName.toLowerCase(),
        `${cleanName.toLowerCase()}%`,
        `% ${cleanName.toLowerCase()}%`,
      ];
      if (userRole === 'CORPORATE' && corporateId) {
        filter = ' AND r.corporate_account_id = $5';
        params.push(corporateId);
      }

      const results = await this.dataSource.query(`
        SELECT r.id, r.full_name, r.gender, r.status,
               u.email,
               aa.total_score, aa.status as assessment_status,
               pt.blended_style_name as personality_style,
               pt.blended_style_desc as personality_desc,
               p.name as program_name,
               (SELECT COUNT(*) FROM assessment_attempts aa2 WHERE aa2.registration_id = r.id AND aa2.status = 'COMPLETED') as attempt_count,
               CASE
                 WHEN LOWER(r.full_name) = $2 THEN 100
                 WHEN LOWER(r.full_name) LIKE $3 THEN 94
                 WHEN LOWER(r.full_name) LIKE $4 THEN 90
                 WHEN LOWER(split_part(r.full_name, ' ', 1)) = $2 THEN 88
                 WHEN LOWER(split_part(r.full_name, ' ', 1)) LIKE $3 THEN 84
                 WHEN LOWER(r.full_name) LIKE $1 THEN 60
                 ELSE 0
               END AS match_score
        FROM registrations r
        LEFT JOIN users u ON u.id = r.user_id
        LEFT JOIN LATERAL (
          SELECT aa1.total_score, aa1.status, aa1.dominant_trait_id, aa1.program_id
          FROM assessment_attempts aa1
          WHERE aa1.registration_id = r.id AND aa1.status = 'COMPLETED'
          ORDER BY aa1.completed_at DESC NULLS LAST, aa1.total_score DESC NULLS LAST, aa1.id DESC
          LIMIT 1
        ) aa ON true
        LEFT JOIN personality_traits pt ON aa.dominant_trait_id = pt.id
        LEFT JOIN programs p ON aa.program_id = p.id
        WHERE LOWER(r.full_name) LIKE $1 AND r.is_deleted = false${filter}
        ORDER BY match_score DESC,
                 (aa.status = 'COMPLETED') DESC,
                 aa.total_score DESC NULLS LAST,
                 r.created_at DESC
        LIMIT 8
      `, params);

      if (!results || results.length === 0) {
        return {
          toolName: 'person_lookup',
          success: false,
          data: null,
          summary: `No candidate found matching "${cleanName}"${userRole === 'CORPORATE' ? ' in your organization' : ''}.`,
          confidence: 0.5,
        };
      }

      const top = results[0];
      const second = results[1];
      const secondScore = second ? Number(second.match_score || 0) : -1;
      const topScore = Number(top.match_score || 0);
      const closeScores = second && topScore - secondScore <= 6;
      const disambiguationNeeded =
        (shortName && results.length > 1 && topScore < 95) ||
        (results.length > 1 && topScore < 90) ||
        !!closeScores;

      if (disambiguationNeeded) {
        const choices = results
          .slice(0, 5)
          .map((r: any, i: number) => {
            const attemptCount = parseInt(r.attempt_count || '0');
            const attemptLabel = attemptCount > 1
              ? ` (${attemptCount} assessments)`
              : attemptCount === 1
                ? ' (1 assessment)'
                : ' (no assessments)';
            return `${i + 1}. **${r.full_name}** — ${r.assessment_status === 'COMPLETED' ? `Score: ${r.total_score ?? 'N/A'}` : 'Not assessed'}${attemptLabel}`;
          })
          .join('\n');

        return {
          toolName: 'person_lookup',
          success: true,
          data: {
            person: null,
            allMatches: results,
            matchCount: results.length,
            disambiguationNeeded: true,
            queryName: cleanName,
          },
          summary: `I found multiple close matches for **"${cleanName}"**. Please reply with the exact full name:\n${choices}`,
          confidence: 0.55,
          metadata: { matchCount: results.length, disambiguationNeeded: true },
        };
      }

      // Format person data
      const person = top;
      const hasAssessment = person.assessment_status === 'COMPLETED';
      const summary = hasAssessment
        ? `Found **${person.full_name}** — ${person.personality_style || 'Personality not assessed'}, Score: ${person.total_score || 'N/A'}`
        : `Found **${person.full_name}** — Assessment not yet completed.`;

      // If multiple matches, include disambiguation info
      const allMatches = results.length > 1
        ? results.map((r: any, i: number) => {
            const attemptCount = parseInt(r.attempt_count || '0');
            const attemptLabel = attemptCount > 1
              ? ` (${attemptCount} assessments)`
              : attemptCount === 1
                ? ' (1 assessment)'
                : ' (no assessments)';
            return `${i + 1}. **${r.full_name}** — ${r.assessment_status === 'COMPLETED' ? `Score: ${r.total_score}` : 'Not assessed'}${attemptLabel}`;
          }).join('\n')
        : null;

      return {
        toolName: 'person_lookup',
        success: true,
        data: {
          person: results[0],
          allMatches: results,
          matchCount: results.length,
          disambiguationNeeded: false,
          formattedProfile: this.formatPersonProfile(person),
        },
        summary: allMatches
          ? `Found ${results.length} candidates matching "${cleanName}":\n${allMatches}`
          : summary,
        confidence: results.length === 1 ? 0.95 : 0.8,
        metadata: { matchCount: results.length },
      };
    } catch (error) {
      this.logger.warn(`person_lookup tool failed: ${error.message}`);
      return {
        toolName: 'person_lookup',
        success: false,
        data: null,
        summary: `Person search failed: ${error.message}`,
        confidence: 0,
      };
    }
  }

  private formatPersonProfile(person: any): string {
    const lines = [`## ${person.full_name}`];
    if (person.email) lines.push(`- **Email**: ${person.email}`);
    if (person.gender) lines.push(`- **Gender**: ${person.gender}`);
    if (person.personality_style) {
      lines.push(`- **Personality**: ${person.personality_style}`);
      if (person.personality_desc) lines.push(`  ${person.personality_desc}`);
    }
    if (person.total_score != null) lines.push(`- **Assessment Score**: ${person.total_score}`);
    if (person.assessment_status) lines.push(`- **Assessment Status**: ${person.assessment_status}`);
    if (person.program_name) lines.push(`- **Program**: ${person.program_name}`);
    return lines.join('\n');
  }

  private async executeCareerReport(
    name: string,
    user: UserContext,
  ): Promise<ToolResult> {
    try {
      // First find the person
      const personResult = await this.executePersonLookup(name, user);
      if (personResult.data?.disambiguationNeeded) {
        return {
          toolName: 'career_report',
          success: false,
          data: null,
          summary: personResult.summary,
          confidence: 0.4,
        };
      }

      if (!personResult.success || !personResult.data?.person) {
        return {
          toolName: 'career_report',
          success: false,
          data: null,
          summary: `Cannot generate report: ${personResult.summary}`,
          confidence: 0.3,
        };
      }

      const person = personResult.data.person;
      if (person.assessment_status !== 'COMPLETED') {
        return {
          toolName: 'career_report',
          success: false,
          data: null,
          summary: `Cannot generate career report for **${person.full_name}** — their assessment is not yet completed.`,
          confidence: 0.5,
        };
      }

      // Build ProfileInput from person data
      const profileInput = {
        name: person.full_name || name,
        currentRole: person.program_name ? `Student — ${person.program_name}` : 'Student',
        currentJobDescription: person.personality_desc || 'Assessment candidate',
        yearsOfExperience: 0,
        relevantExperience: 'N/A',
        currentIndustry: 'Education / Career Development',
        expectedFutureRole: 'Based on assessment analysis',
        behavioralStyle: person.personality_style,
        behavioralDescription: person.personality_desc,
        totalScore: person.total_score ? parseFloat(person.total_score) : undefined,
        programName: person.program_name,
        gender: person.gender,
      };

      // Generate the report using FutureRoleReportService
      const report = await this.futureRoleReportService.generateReport(profileInput);

      return {
        toolName: 'career_report',
        success: true,
        data: { report, person },
        summary: `Career report generated for **${person.full_name}** (${person.personality_style || 'N/A'}).`,
        confidence: 0.95,
        metadata: { personId: person.id, reportGenerated: true },
      };
    } catch (error) {
      this.logger.warn(`career_report tool failed: ${error.message}`);
      return {
        toolName: 'career_report',
        success: false,
        data: null,
        summary: `Report generation failed: ${error.message}`,
        confidence: 0,
      };
    }
  }

  private async executeKnowledgeAI(
    question: string,
    user: UserContext,
    conversationHistory: string,
  ): Promise<ToolResult> {
    try {
      const userId = user?.id || 0;
      const userEmail = user?.email || '';
      const userProfile = await this.oriIntelligence.getUserProfile(userId, userEmail);

      const answer = await this.oriIntelligence.answerAnyQuestion(
        question, userProfile, conversationHistory, user?.role || 'STUDENT',
      );

      return {
        toolName: 'knowledge_ai',
        success: true,
        data: { answer, hasProfile: !!userProfile },
        summary: answer,
        confidence: 0.9,
      };
    } catch (error) {
      this.logger.warn(`knowledge_ai tool failed: ${error.message}`);
      return {
        toolName: 'knowledge_ai',
        success: false,
        data: null,
        summary: `AI knowledge system temporarily unavailable: ${error.message}`,
        confidence: 0,
      };
    }
  }

  private async executeConversationContext(
    question: string,
    user: UserContext,
    conversationId: number,
    conversationHistory: string,
  ): Promise<ToolResult> {
    try {
      const sessionId = conversationId > 0 ? `conv_${conversationId}` : `user_${user?.id || 0}`;
      const session = this.conversationService.getSession(sessionId);
      const ctx = session.currentContext;

      let resolvedQuestion = question;
      const isFollowUp = this.conversationService.isFollowUp(sessionId, question);
      if (isFollowUp) {
        resolvedQuestion = this.conversationService.resolveReferences(sessionId, question);
      }

      // Enrich history from DB if needed
      let enrichedHistory = conversationHistory;
      if (conversationId > 0 && !conversationHistory) {
        try {
          enrichedHistory = await this.chatMemory.buildLlmHistory(conversationId);
        } catch { /* non-blocking */ }
      }

      // Add entity context
      if (ctx.lastPersonMentioned || ctx.entitiesDiscussed?.length > 0) {
        let entityContext = '--- ENTITY CONTEXT ---\n';
        if (ctx.lastPersonMentioned) {
          entityContext += `Last person discussed: ${ctx.lastPersonMentioned}\n`;
        }
        if (ctx.entitiesDiscussed?.length > 0) {
          entityContext += `People mentioned: ${ctx.entitiesDiscussed.join(', ')}\n`;
        }
        if (ctx.lastIntent) {
          entityContext += `Last topic: ${ctx.lastIntent}\n`;
        }
        entityContext += '---\n';
        enrichedHistory = entityContext + enrichedHistory;
      }

      return {
        toolName: 'conversation_context',
        success: true,
        data: {
          resolvedQuestion,
          enrichedHistory,
          isFollowUp,
          lastPerson: ctx.lastPersonMentioned,
          lastIntent: ctx.lastIntent,
        },
        summary: isFollowUp
          ? `Resolved follow-up: "${question}" → "${resolvedQuestion}"`
          : 'Conversation context loaded.',
        confidence: 0.8,
      };
    } catch (error) {
      return {
        toolName: 'conversation_context',
        success: false,
        data: { resolvedQuestion: question, enrichedHistory: conversationHistory },
        summary: 'Context resolution failed, using original question.',
        confidence: 0.3,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: SYNTHESIZER — Combine results from multiple tools
  // ═══════════════════════════════════════════════════════════════════════════
  private async synthesize(
    question: string,
    plan: ExecutionPlan,
    results: ToolResult[],
    user: UserContext,
  ): Promise<string> {
    // Filter to successful results only
    const successfulResults = results.filter(r => r.success && r.toolName !== 'conversation_context');

    if (successfulResults.length === 0) {
      // All tools failed — return the best failure message
      const bestFailure = results.reduce((best, curr) =>
        curr.confidence > best.confidence ? curr : best,
        results[0],
      );
      return bestFailure?.summary || 'I was unable to process your request. Please try rephrasing your question.';
    }

    // Single tool → return its answer directly (no synthesis LLM call needed)
    if (successfulResults.length === 1 || !plan.requiresSynthesis) {
      // Find the primary result (non-context, non-search)
      const primary = successfulResults.find(r =>
        r.toolName !== 'conversation_context' && r.toolName !== 'semantic_search',
      ) || successfulResults[0];

      // If we have semantic search alongside, enrich the answer
      const semanticResult = successfulResults.find(r => r.toolName === 'semantic_search');
      if (semanticResult && primary.toolName === 'knowledge_ai' && semanticResult.data?.contextChunks) {
        // Re-run knowledge_ai with enriched context
        try {
          const enrichedAnswer = await this.oriIntelligence.answerAnyQuestion(
            question,
            await this.oriIntelligence.getUserProfile(user.id, user.email),
            semanticResult.data.contextChunks,
            user?.role || 'STUDENT',
          );
          return enrichedAnswer;
        } catch { /* fall through to primary answer */ }
      }

      // For text_to_sql, return the formatted answer directly
      if (primary.toolName === 'text_to_sql' && primary.data?.answer) {
        return primary.data.answer;
      }

      // For knowledge_ai, return the answer directly
      if (primary.toolName === 'knowledge_ai' && primary.data?.answer) {
        return primary.data.answer;
      }

      // For person_lookup, return the formatted profile
      if (primary.toolName === 'person_lookup' && primary.data?.formattedProfile) {
        return primary.data.formattedProfile;
      }

      // For semantic_search-only flows, synthesize a direct answer from retrieved context
      // instead of returning generic "Found N documents" summaries.
      if (primary.toolName === 'semantic_search' && primary.data?.contextChunks) {
        try {
          const semanticAnswer = await this.oriIntelligence.answerAnyQuestion(
            question,
            await this.oriIntelligence.getUserProfile(user.id, user.email),
            primary.data.contextChunks,
            user?.role || 'STUDENT',
          );
          if (semanticAnswer?.trim()) {
            return semanticAnswer;
          }
        } catch {
          // fall through to summary fallback
        }
      }

      return primary.summary;
    }

    // Multiple tools → use Synthesizer LLM to combine
    return await this.synthesizeWithLlm(question, successfulResults, user);
  }

  /**
   * Use the Synthesizer LLM to combine results from multiple tools into one answer
   */
  private async synthesizeWithLlm(
    question: string,
    results: ToolResult[],
    user: UserContext,
  ): Promise<string> {
    const role = (user?.role || 'STUDENT').toUpperCase();
    const isStudent = ['STUDENT', 'INDIVIDUAL', 'COUNSELLOR', 'COUNSELOR'].includes(role);
    const isCorporate = role === 'CORPORATE';

    const roleRules = isStudent
      ? `STUDENT RULES:
- Answer what was asked — nothing more, nothing less.
- Simple factual questions → 1-2 sentences. Complex guidance → structured sections.
- Use encouraging, supportive tone. Bold key terms.
- Skip salary/company comparisons unless explicitly asked.
- End with ONE actionable suggestion relevant to their question.`
      : isCorporate
        ? `CORPORATE RULES:
- Executive, data-first format. Lead with the metric/number.
- Use tables for comparisons. Bold key KPIs.
- End with 1 strategic recommendation or next action.
- Prioritize: metrics → trends → actions.`
        : `ADMIN RULES:
- Be precise and complete. Use tables for multi-row data.
- Bold key values and counts.
- For person lookups: structured profile with key data points.
- End with 1 practical next step.`;

    const toolOutputs = results.map(r => {
      const detailSlice = r.data?.answer ? r.data.answer.slice(0, 500) : '';
      return `── ${r.toolName.toUpperCase()} (confidence: ${r.confidence || 'N/A'}) ──
${r.summary || 'No summary'}
${detailSlice ? `\nDetails:\n${detailSlice}` : ''}`;
    }).join('\n\n');

    const synthesisPrompt = `You are Ask BI, an advanced data intelligence assistant. Synthesize the tool outputs below into a polished, professional response.

USER ROLE: ${role}
${roleRules}

FORMATTING RULES:
1) Use ONLY facts from tool outputs. NEVER fabricate data, names, or numbers.
2) Start with a direct answer in the first line — no preamble like "Based on the data...".
3) Use markdown formatting:
   - **Bold** for key numbers, names, and metrics
   - Tables (| col | col |) for multi-row data
   - Bullet points for lists of 3+ items
   - Numbered lists for step-by-step guidance
4) For multi-part questions, address each part with a clear section header.
5) Keep wording tight — no repetition, no filler phrases.
6) If tools returned no data, say specifically what wasn't found and suggest 1 alternative query.
7) If tools conflict, note briefly and use the highest-confidence result.
8) Structure complex responses as:
   **Quick Answer** → Key data/table → Brief insight → Suggested next step
9) Maximum 1 emoji per section header for visual scanning (📊 🎯 💡 ✅).
10) NEVER repeat the question back. NEVER say "Here is" or "I found". Just give the answer.

USER QUESTION:
"${question}"

TOOL OUTPUTS:
${toolOutputs}

FINAL RESPONSE:`;

    try {
      const response = await invokeWithFallback({
        logger: this.logger,
        context: 'Agent synthesizer',
        invokePrimary: () => this.getSynthesizerLlm().invoke([
          new SystemMessage(synthesisPrompt),
          new HumanMessage('Provide the final professional answer now.'),
        ]),
        invokeFallback: () =>
          this.getSynthesizerFallbackLlm().invoke([
            new SystemMessage(synthesisPrompt),
            new HumanMessage('Provide the final professional answer now.'),
          ]),
      });
      return response.content.toString().trim();
    } catch (error) {
      this.logger.warn(`Synthesis LLM failed: ${error.message} — concatenating tool outputs`);
      // Fallback: just concatenate the best answers
      return results
        .filter(r => r.summary)
        .map(r => r.summary)
        .join('\n\n---\n\n');
    }
  }

  // ─────────────── Helpers ───────────────

  /**
   * Extract a person's name from a question using simple heuristics
   */
  private extractNameFromQuestion(question: string): string {
    // Pattern 0: "[name] report" (supports lowercase names like "jai report")
    let match = question.match(/^\s*([a-z][a-z\s.'-]{1,60}?)\s*(?:'s\s+)?(?:report|profile|details?|results?)\b/i);
    if (match) return match[1].trim();

    // Pattern 1: "about [Name]"
    match = question.match(/\babout\s+([a-z][a-z\s.'-]{1,60})/i);
    if (match) return match[1];

    // Pattern 2: "for [Name]"
    match = question.match(/\bfor\s+([a-z][a-z\s.'-]{1,60}?)(?:\s*(?:report|profile|details?|results?)\b|$)/i);
    if (match) return match[1];

    // Pattern 3: "find [Name]" / "search [Name]" / "lookup [Name]"
    match = question.match(/\b(?:find|search|lookup|look up)\s+([a-z][a-z\s.'-]{1,60})/i);
    if (match) return match[1];

    // Pattern 4: "[Name]'s report" / "[Name] report"
    match = question.match(/\b([a-z][a-z\s.'-]{1,60})\s*(?:'s\s+)?(?:report|profile|details?|results?)/i);
    if (match) return match[1];

    // Pattern 5: "who is [Name]"
    match = question.match(/\bwho\s+is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    if (match) return match[1];

    // Pattern 6: Any capitalized name-like sequence (last resort)
    match = question.match(/\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})+)\b/);
    if (match) return match[1];

    return '';
  }

  private normalizeLookupName(name: string): string {
    if (!name) return '';
    return name
      .replace(/\b(?:generate|create|show|give|get|for|about|report|profile|details?|results?)\b/gi, ' ')
      .replace(/[^a-zA-Z\s.'-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract source metadata from tool results
   */
  private extractSources(results: ToolResult[]): Record<string, any> {
    const sources: Record<string, any> = {};
    for (const r of results) {
      if (r.success && r.metadata) {
        sources[r.toolName] = r.metadata;
      }
    }
    return sources;
  }

  private buildEvidence(
    results: ToolResult[],
    toolsUsed: string[],
    planningTimeMs: number,
    executionTimeMs: number,
  ): Record<string, any> {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
      plan: {
        toolsUsed,
        planningTimeMs,
        executionTimeMs,
      },
      quality: {
        successfulTools: successful.length,
        failedTools: failed.map(r => r.toolName),
        avgToolConfidence: successful.length
          ? Math.round((successful.reduce((sum, r) => sum + (r.confidence || 0), 0) / successful.length) * 100) / 100
          : 0,
      },
      toolConfidence: results.map(r => ({
        tool: r.toolName,
        confidence: r.confidence,
        success: r.success,
      })),
    };
  }

  private postProcessAnswer(answer: string): string {
    if (!answer) return answer;

    let processed = answer
      // Remove LLM preamble artifacts
      .replace(/^(Here is|Here's|Based on|According to|I found|Let me)\s[^.\n]{0,80}[.:]/i, '')
      // Fix double-bold: ****text**** → **text**
      .replace(/\*{3,}([^*]+)\*{3,}/g, '**$1**')
      // Fix broken markdown headers with extra spaces
      .replace(/^(#{1,3})\s{2,}/gm, '$1 ')
      // Remove trailing colons on headers
      .replace(/^(#{1,3}\s.+):$/gm, '$1')
      // Clean up excessive blank lines
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const lines = processed
      .split('\n')
      .map(l => l.trimEnd());

    // Deduplicate consecutive identical lines
    const deduped: string[] = [];
    let prevNorm = '';
    for (const line of lines) {
      const norm = line.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!norm) {
        // Keep blank lines for spacing but deduplicate consecutive blanks
        if (prevNorm !== '') deduped.push(line);
        prevNorm = norm;
        continue;
      }
      if (norm !== prevNorm) {
        deduped.push(line);
      }
      prevNorm = norm;
    }

    const merged = deduped.join('\n').trim();

    // Catch empty-state generic responses
    if (/^(conversation context loaded|no (relevant |)data (found|available))\.?$/i.test(merged)) {
      return 'No matching data found. Try rephrasing your question or ask about a specific candidate, batch, or metric.';
    }

    // Remove trailing "Let me know if you need anything else" type closings
    return merged.replace(/\n*(?:Let me know|Feel free|Don't hesitate|Please let me know)[^\n]*$/i, '').trim();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUERY COMPLEXITY ANALYZER — Scores question difficulty (1-10)
  // ═══════════════════════════════════════════════════════════════════════════
  private analyzeQueryComplexity(question: string): ComplexityAssessment {
    const q = question.toLowerCase();
    let score = 1;
    let isMultiPart = false;
    let needsData = false;
    let needsAnalysis = false;
    let needsPersonLookup = false;

    // Data indicators
    const dataPatterns = /\b(how many|count|total|list|show all|average|highest|lowest|top \d+|get all|display|number of|percentage|compare)\b/i;
    if (dataPatterns.test(q)) {
      needsData = true;
      score += 2;
    }

    // Analysis/advice indicators
    const analysisPatterns = /\b(suggest|recommend|advise|career|skill|eligible|suitable|fit for|guidance|help|explain|why|how to become|what should|roadmap|improve|develop|strength|weakness)\b/i;
    if (analysisPatterns.test(q)) {
      needsAnalysis = true;
      score += 2;
    }

    // Person lookup indicators
    const personPatterns = /\b(tell me about|find|search|who is|look up|profile|about [A-Z])\b/i;
    if (personPatterns.test(q)) {
      needsPersonLookup = true;
      score += 1;
    }

    // Multi-part detection — "and", "also", "then", multiple question marks
    if (/\band\b.*\b(also|then|additionally)\b/i.test(q) || (q.match(/\?/g) || []).length > 1) {
      isMultiPart = true;
      score += 2;
    }

    // Conjunctions joining different request types
    if (/\b(and|also|then|plus)\b/i.test(q) && needsData && needsAnalysis) {
      isMultiPart = true;
      score += 1;
    }

    // Long queries tend to be more complex
    const wordCount = q.split(/\s+/).length;
    if (wordCount > 15) score += 1;
    if (wordCount > 30) score += 1;

    // Cap at 10
    score = Math.min(10, score);

    // Suggest tool count based on complexity
    let suggestedToolCount = 1;
    if (isMultiPart || (needsData && needsAnalysis)) suggestedToolCount = 2;
    if (needsData && needsAnalysis && needsPersonLookup) suggestedToolCount = 3;

    return { score, isMultiPart, needsData, needsAnalysis, needsPersonLookup, suggestedToolCount };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ReAct SELF-REFLECTION — Evaluates answer quality and suggests improvements
  // ═══════════════════════════════════════════════════════════════════════════
  private async reflectOnAnswer(
    question: string,
    answer: string,
    results: ToolResult[],
  ): Promise<{ needsImprovement: boolean; reason: string; improvedAnswer?: string }> {
    try {
      const toolSummaries = results
        .filter(r => r.success)
        .map(r => `${r.toolName}: confidence=${r.confidence} summary="${r.summary?.slice(0, 200)}"`)
        .join('\n');

      const reflectionPrompt = `You are a quality evaluator for an AI assistant called Ask BI. Evaluate the response below.

═══ USER'S QUESTION ═══
"${question}"

═══ GENERATED ANSWER (to evaluate) ═══
${answer.slice(0, 1500)}

═══ TOOL OUTPUTS USED ═══
${toolSummaries}

═══ EVALUATION CRITERIA ═══
1. COMPLETENESS: Does the answer address ALL parts of the question?
2. ACCURACY: Does the answer match the tool outputs? No fabricated data?
3. CLARITY: Is it well-structured with markdown formatting?
4. RELEVANCE: Does it answer what was asked, not something else?

═══ OUTPUT (JSON only, no markdown fences) ═══
{
  "needsImprovement": true/false,
  "reason": "brief reason",
  "improvedAnswer": "if needsImprovement=true, provide a corrected/enhanced version"
}

IMPORTANT: Set needsImprovement=false for MOST responses. Only set true if there is a CLEAR problem (missing data, fabrication, wrong question answered, very poor formatting). Minor issues are NOT worth the overhead.`;

      const response = await invokeWithFallback({
        logger: this.logger,
        context: 'Agent reflector',
        invokePrimary: () => this.getReflectorLlm().invoke([
          new SystemMessage(reflectionPrompt),
          new HumanMessage('Return evaluation JSON now.'),
        ]),
        invokeFallback: () =>
          this.getReflectorFallbackLlm().invoke([
            new SystemMessage(reflectionPrompt),
            new HumanMessage('Return evaluation JSON now.'),
          ]),
      });

      const raw = response.content.toString().trim();
      // Parse JSON
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { needsImprovement: false, reason: 'Reflection parse failed' };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        needsImprovement: parsed.needsImprovement === true,
        reason: parsed.reason || '',
        improvedAnswer: parsed.improvedAnswer || undefined,
      };
    } catch (err) {
      this.logger.debug(`ReAct reflection failed (non-critical): ${err.message}`);
      return { needsImprovement: false, reason: 'Reflection error' };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TELEMETRY — Circular buffer for execution observability
  // ═══════════════════════════════════════════════════════════════════════════
  private recordTelemetry(question: string, tools: ToolTelemetry[], totalMs: number): void {
    this.telemetryBuffer.push({
      question: question.slice(0, 100),
      tools,
      totalMs,
      timestamp: new Date(),
    });
    // Keep buffer bounded
    if (this.telemetryBuffer.length > this.MAX_TELEMETRY) {
      this.telemetryBuffer.shift();
    }
  }

  /**
   * Public: Get recent telemetry data for monitoring/debugging.
   * Can be exposed via a controller endpoint.
   */
  getTelemetry(limit: number = 20): {
    recentQueries: Array<{
      question: string;
      tools: ToolTelemetry[];
      totalMs: number;
      timestamp: Date;
    }>;
    stats: {
      totalQueries: number;
      avgTotalMs: number;
      toolUsageDistribution: Record<string, number>;
      chainedCount: number;
      avgConfidence: number;
    };
  } {
    const recent = this.telemetryBuffer.slice(-limit);

    // Compute aggregate stats
    const allEntries = this.telemetryBuffer;
    const totalQueries = allEntries.length;
    const avgTotalMs = totalQueries > 0
      ? Math.round(allEntries.reduce((sum, e) => sum + e.totalMs, 0) / totalQueries)
      : 0;

    const toolUsageDistribution: Record<string, number> = {};
    let chainedCount = 0;
    let totalConfidence = 0;
    let confidenceCount = 0;

    for (const entry of allEntries) {
      for (const tool of entry.tools) {
        toolUsageDistribution[tool.toolName] = (toolUsageDistribution[tool.toolName] || 0) + 1;
        if (tool.chained) chainedCount++;
        if (tool.confidence > 0) {
          totalConfidence += tool.confidence;
          confidenceCount++;
        }
      }
    }

    return {
      recentQueries: recent,
      stats: {
        totalQueries,
        avgTotalMs,
        toolUsageDistribution,
        chainedCount,
        avgConfidence: confidenceCount > 0 ? parseFloat((totalConfidence / confidenceCount).toFixed(2)) : 0,
      },
    };
  }
}
