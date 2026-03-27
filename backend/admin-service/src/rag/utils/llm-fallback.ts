import { Logger } from '@nestjs/common';

interface InvokeWithFallbackArgs<T> {
  logger: Logger;
  context: string;
  invokePrimary: () => Promise<T>;
  invokeFallback: () => Promise<T>;
  primaryTimeoutMs?: number;
  quotaCooldownMs?: number;
  fallbackTimeoutMs?: number;
}

const quotaCooldownByContext = new Map<string, number>();

function nowMs(): number {
  return Date.now();
}

function normalizeContext(context: string): string {
  return (context || 'default').toLowerCase().trim();
}

function isQuotaOrRateLimitError(error: any): boolean {
  const msg = String(error?.message || error?.cause?.message || '').toLowerCase();
  return (
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('429') ||
    msg.includes('too many requests') ||
    msg.includes('503') ||
    msg.includes('500') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('aborted')
  );
}

async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  if (!timeoutMs || timeoutMs <= 0) {
    return await fn();
  }

  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function invokeWithFallback<T>(
  args: InvokeWithFallbackArgs<T>,
): Promise<T> {
  const primaryTimeoutMs = Number(
    args.primaryTimeoutMs || process.env.LLM_PRIMARY_TIMEOUT_MS || 8000,
  );
  const quotaCooldownMs = Number(
    args.quotaCooldownMs || process.env.LLM_QUOTA_FAST_FALLBACK_COOLDOWN_MS || 30000,
  );
  const fallbackTimeoutMs = Number(
    args.fallbackTimeoutMs || process.env.LLM_FALLBACK_TIMEOUT_MS || 15000,
  );
  const ctxKey = normalizeContext(args.context);
  const cooldownUntil = quotaCooldownByContext.get(ctxKey) || 0;

  if (cooldownUntil > nowMs()) {
    const remainingMs = cooldownUntil - nowMs();
    args.logger.warn(
      `${args.context}: Gemini fast-fallback cooldown active (${Math.ceil(
        remainingMs / 1000,
      )}s left). Using Groq directly.`,
    );
    return await withTimeout(
      async () => args.invokeFallback(),
      fallbackTimeoutMs,
      `${args.context}: Groq fallback timed out after ${fallbackTimeoutMs}ms`,
    );
  }

  try {
    return await withTimeout(
      args.invokePrimary,
      primaryTimeoutMs,
      `${args.context}: Gemini primary timed out after ${primaryTimeoutMs}ms`,
    );
  } catch (primaryError: any) {
    const errorMsg = primaryError?.message || 'unknown error';
    
    if (isQuotaOrRateLimitError(primaryError)) {
      quotaCooldownByContext.set(ctxKey, nowMs() + quotaCooldownMs);
      args.logger.warn(
        `${args.context}: Gemini quota/rate-limit detected. Fast fallback cooldown enabled for ${Math.ceil(
          quotaCooldownMs / 1000,
        )}s.`,
      );
    }

    args.logger.warn(
      `${args.context}: Gemini primary failed (${errorMsg}). Falling back to Groq.`,
    );
    
    try {
      return await withTimeout(
        async () => args.invokeFallback(),
        fallbackTimeoutMs,
        `${args.context}: Groq fallback timed out after ${fallbackTimeoutMs}ms`,
      );
    } catch (fallbackError: any) {
      args.logger.error(
        `${args.context}: Both primary and fallback failed. Primary: ${errorMsg}, Fallback: ${fallbackError?.message || 'unknown'}`,
      );
      throw fallbackError;
    }
  }
}
