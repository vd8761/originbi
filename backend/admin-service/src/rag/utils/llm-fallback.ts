import { Logger } from '@nestjs/common';

interface InvokeWithFallbackArgs<T> {
  logger: Logger;
  context: string;
  invokePrimary: () => Promise<T>;
  invokeFallback: () => Promise<T>;
}

export async function invokeWithFallback<T>(
  args: InvokeWithFallbackArgs<T>,
): Promise<T> {
  try {
    return await args.invokePrimary();
  } catch (primaryError: any) {
    args.logger.warn(
      `${args.context}: Gemini primary failed (${primaryError?.message || 'unknown error'}). Falling back to Groq.`,
    );
    return await args.invokeFallback();
  }
}
