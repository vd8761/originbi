import { Logger } from '@nestjs/common';
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import { LLMResult } from '@langchain/core/outputs';
import { TokenUsageMonitor } from './token-usage-monitor';

/**
 * Enhanced Token Tracker with Real-time Monitoring
 * Integrates with TokenUsageMonitor to track usage against limits
 * 
 * @param context A string describing which component is using the LLM (e.g. 'Planner', 'TextToSql')
 * @param monitor Optional TokenUsageMonitor instance for real-time tracking
 * @returns A BaseCallbackHandler object that can be passed into ChatGroq/ChatGoogleGenerativeAI constructor
 */
export function getTokenTrackerCallback(
  context: string,
  monitor?: TokenUsageMonitor
): BaseCallbackHandler {
  const logger = new Logger('TokenTracker');

  return BaseCallbackHandler.fromMethods({
    handleLLMEnd(output: LLMResult) {
      if (output.llmOutput && output.llmOutput.tokenUsage) {
        const usage = output.llmOutput.tokenUsage;
        const promptTokens = usage.promptTokens || usage.prompt_tokens || 0;
        const completionTokens = usage.completionTokens || usage.completion_tokens || 0;
        const totalTokens = usage.totalTokens || usage.total_tokens || 0;

        // Log to console
        logger.log(
          `[TOKEN USAGE] ${context} | Prompt: ${promptTokens} | Completion: ${completionTokens} | Total: ${totalTokens}`
        );

        // Track in monitor if available
        if (monitor) {
          monitor.trackTokenUsage(context, promptTokens, completionTokens, totalTokens);
        }
      }
    },
  });
}
