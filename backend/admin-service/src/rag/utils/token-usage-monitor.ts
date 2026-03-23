import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

/**
 * Real-time Token Usage Monitor
 * Tracks LLM & Embeddings token consumption against rate limits
 */
@Injectable()
export class TokenUsageMonitor implements OnModuleInit {
  private readonly logger = new Logger('TokenUsageMonitor');

  // ═══════════════════════════════════════════════════════════════
  // GROQ Configuration
  // ═══════════════════════════════════════════════════════════════
  private readonly GROQ = {
    RPM_LIMIT: 14,
    TOKENS_PER_MINUTE_LIMIT: 131000,
    CONTEXT_WINDOW: 128000,
    MODEL: 'llama-3.3-70b-versatile',
  };

  // ═══════════════════════════════════════════════════════════════
  // GEMINI Configuration
  // ═══════════════════════════════════════════════════════════════
  private readonly GEMINI = {
    EMBEDDINGS_RPM_LIMIT_FREE: 15,
    EMBEDDINGS_RPM_LIMIT_PAID: 1500,
    LLM_RPM_LIMIT_PAID: 1000,
    CONTEXT_WINDOW: 1000000,
    MAX_OUTPUT_TOKENS: 8192,
    EMBEDDINGS_MODEL: 'gemini-embedding-001',
    LLM_MODEL: 'gemini-2.5-flash',
  };

  // ═══════════════════════════════════════════════════════════════
  // Usage Tracking
  // ═══════════════════════════════════════════════════════════════
  private usageWindow = new Map<string, { timestamp: number; tokens: number }[]>();
  private dailyUsage = new Map<string, { date: string; totalTokens: number }>();

  onModuleInit() {
    this.logger.log('🔍 Token Usage Monitor initialized');
    this.logCurrentLimits();
  }

  /**
   * Log all current limits to console for reference
   */
  private logCurrentLimits() {
    const isPaidGemini = process.env.USE_GEMINI_PAID === 'true';
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    📊 TOKEN USAGE LIMITS REFERENCE                           ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  🟢 GROQ (Primary LLM)                                                      ║
║     ├─ Rate Limit: ${this.GROQ.RPM_LIMIT} RPM (Requests/min)                                    ║
║     ├─ Tokens/Minute: ${this.format(this.GROQ.TOKENS_PER_MINUTE_LIMIT)} tokens/min                 ║
║     ├─ Context Window: ${this.format(this.GROQ.CONTEXT_WINDOW)} tokens                   ║
║     └─ Model: ${this.GROQ.MODEL}           ║
║                                                                              ║
║  🔵 GEMINI EMBEDDINGS                                                       ║
║     ├─ Free Tier: ${this.GEMINI.EMBEDDINGS_RPM_LIMIT_FREE} RPM                              ║
║     ├─ Paid Tier: ${this.GEMINI.EMBEDDINGS_RPM_LIMIT_PAID} RPM (100× better)                 ║
║     └─ Model: ${this.GEMINI.EMBEDDINGS_MODEL}                        ║
║                                                                              ║
║  💎 GEMINI LLM (Paid Tier)                                                  ║
║     ├─ Rate Limit: ${this.GEMINI.LLM_RPM_LIMIT_PAID} RPM (71× better than Groq)             ║
║     ├─ Context Window: ${this.format(this.GEMINI.CONTEXT_WINDOW)} tokens (8× larger)        ║
║     ├─ Max Output: ${this.GEMINI.MAX_OUTPUT_TOKENS} tokens/request                      ║
║     └─ Model: ${this.GEMINI.LLM_MODEL}                 ║
║                                                                              ║
║  ACTIVE TIER: ${isPaidGemini ? '💎 PAID GEMINI' : '🟢 FREE GROQ'}                                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
  }

  /**
   * Track token usage for a given service
   */
  public trackTokenUsage(
    service: string,
    promptTokens: number,
    completionTokens: number,
    totalTokens: number
  ) {
    const now = Date.now();
    const key = `${service}:${new Date(now).toISOString().slice(0, 13)}`; // Hour-based key

    if (!this.usageWindow.has(key)) {
      this.usageWindow.set(key, []);
    }

    this.usageWindow.get(key)!.push({ timestamp: now, tokens: totalTokens });

    // Track daily usage
    const dateKey = new Date(now).toISOString().slice(0, 10);
    if (!this.dailyUsage.has(service)) {
      this.dailyUsage.set(service, { date: dateKey, totalTokens: 0 });
    }
    const daily = this.dailyUsage.get(service)!;
    if (daily.date !== dateKey) {
      daily.date = dateKey;
      daily.totalTokens = 0;
    }
    daily.totalTokens += totalTokens;

    this.logger.debug(
      `[TOKEN] ${service} | Prompt: ${promptTokens} | Completion: ${completionTokens} | Total: ${totalTokens}`
    );
  }

  /**
   * Get real-time usage statistics
   */
  public getUsageStats() {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Calculate hourly usage
    let hourlyTokensGroq = 0;
    let hourlyRequestsGroq = 0;
    let hourlyTokensGemini = 0;
    let hourlyRequestsGemini = 0;

    this.usageWindow.forEach((records, key) => {
      const relevantRecords = records.filter((r) => r.timestamp > oneHourAgo);
      const service = key.split(':')[0];

      if (service.includes('TextToSql') || service.includes('RAG') || service.includes('OriIntelligence')) {
        hourlyTokensGroq += relevantRecords.reduce((sum, r) => sum + r.tokens, 0);
        hourlyRequestsGroq += relevantRecords.length;
      } else if (
        service.includes('Embedding') ||
        service.includes('Cohere') ||
        service.includes('Rerank')
      ) {
        hourlyTokensGemini += relevantRecords.reduce((sum, r) => sum + r.tokens, 0);
        hourlyRequestsGemini += relevantRecords.length;
      }
    });

    // Calculate daily usage
    let dailyTokensGroq = 0;
    let dailyTokensGemini = 0;

    this.dailyUsage.forEach((usage, service) => {
      if (service.includes('TextToSql') || service.includes('RAG') || service.includes('OriIntelligence')) {
        dailyTokensGroq += usage.totalTokens;
      } else {
        dailyTokensGemini += usage.totalTokens;
      }
    });

    return {
      lastUpdated: new Date(now).toISOString(),
      groq: {
        rpmLimit: this.GROQ.RPM_LIMIT,
        tokensPerMinLimit: this.GROQ.TOKENS_PER_MINUTE_LIMIT,
        hourly: {
          requests: hourlyRequestsGroq,
          tokens: hourlyTokensGroq,
          requestsPercentage: ((hourlyRequestsGroq / this.GROQ.RPM_LIMIT) * 100).toFixed(1),
          tokensPercentage: ((hourlyTokensGroq / this.GROQ.TOKENS_PER_MINUTE_LIMIT) * 100).toFixed(1),
          health:
            hourlyRequestsGroq < this.GROQ.RPM_LIMIT * 0.7
              ? '✅ GOOD'
              : hourlyRequestsGroq < this.GROQ.RPM_LIMIT * 0.9
                ? '⚠️ WARNING'
                : '🔴 CRITICAL',
        },
        daily: {
          tokens: dailyTokensGroq,
          estimatedCost: '$0.00', // Groq is free
        },
      },
      gemini: {
        embeddingsRpmLimit: process.env.USE_GEMINI_PAID === 'true' 
          ? this.GEMINI.EMBEDDINGS_RPM_LIMIT_PAID 
          : this.GEMINI.EMBEDDINGS_RPM_LIMIT_FREE,
        llmRpmLimit: this.GEMINI.LLM_RPM_LIMIT_PAID,
        hourly: {
          requests: hourlyRequestsGemini,
          tokens: hourlyTokensGemini,
          requestsPercentage: ((hourlyRequestsGemini / this.GEMINI.LLM_RPM_LIMIT_PAID) * 100).toFixed(1),
        },
        daily: {
          tokens: dailyTokensGemini,
          estimatedCost: this.estimateCost(dailyTokensGemini),
        },
      },
    };
  }

  /**
   * Print formatted usage report
   */
  public printUsageReport() {
    const stats = this.getUsageStats();

    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                  📈 REAL-TIME TOKEN USAGE REPORT                             ║
║                      ${stats.lastUpdated}                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  🟢 GROQ (Current)                                                          ║
║     ┌─ RPM Limit: ${stats.groq.rpmLimit}                                           ║
║     ├─ Last Hour:                                                           ║
║     │  ├─ Requests: ${String(stats.groq.hourly.requests).padEnd(15)} (${String(stats.groq.hourly.requestsPercentage + '%').padEnd(6)})     ║
║     │  └─ Tokens: ${this.format(stats.groq.hourly.tokens).padEnd(11)} (${String(stats.groq.hourly.tokensPercentage + '%').padEnd(6)})     ║
║     ├─ Status: ${stats.groq.hourly.health}                                      ║
║     └─ Daily Cost: ${stats.groq.daily.estimatedCost}                                ║
║                                                                              ║
║  🔵 GEMINI (Embeddings & Optional LLM)                                      ║
║     ┌─ Embeddings RPM: ${String(stats.gemini.embeddingsRpmLimit).padEnd(24)}║
║     ├─ Last Hour:                                                           ║
║     │  ├─ Requests: ${String(stats.gemini.hourly.requests).padEnd(15)} (${String(stats.gemini.hourly.requestsPercentage + '%').padEnd(6)})     ║
║     │  └─ Tokens: ${this.format(stats.gemini.hourly.tokens).padEnd(11)}                      ║
║     └─ Daily Cost: ${stats.gemini.daily.estimatedCost}                                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
  }

  /**
   * Check if usage is within safe limits
   */
  public checkHealthStatus(): {
    groqStatus: 'healthy' | 'warning' | 'critical';
    geminiStatus: 'healthy' | 'warning' | 'critical';
    recommendations: string[];
  } {
    const stats = this.getUsageStats();
    const recommendations: string[] = [];

    // Check Groq
    let groqStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    const groqReqPercent = parseFloat(stats.groq.hourly.requestsPercentage);
    if (groqReqPercent > 90) {
      groqStatus = 'critical';
      recommendations.push('🔴 GROQ: Approaching rate limit! Consider upgrading to Gemini paid.');
    } else if (groqReqPercent > 70) {
      groqStatus = 'warning';
      recommendations.push('⚠️ GROQ: High usage detected (>70%). Monitor closely.');
    }

    // Check Gemini
    let geminiStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    const geminiReqPercent = parseFloat(stats.gemini.hourly.requestsPercentage);
    if (geminiReqPercent > 90) {
      geminiStatus = 'critical';
      recommendations.push('🔴 GEMINI: Approaching rate limit!');
    } else if (geminiReqPercent > 70) {
      geminiStatus = 'warning';
      recommendations.push('⚠️ GEMINI: High usage detected (>70%).');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All services operating within safe limits.');
    }

    return { groqStatus, geminiStatus, recommendations };
  }

  /**
   * Estimate Gemini API cost
   */
  private estimateCost(tokens: number): string {
    const costPerMillionTokens = 0.1; // $0.10 per 1M input tokens (rough average)
    const cost = (tokens / 1000000) * costPerMillionTokens;
    return `$${cost.toFixed(4)}`;
  }

  /**
   * Format large numbers
   */
  private format(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }
}
