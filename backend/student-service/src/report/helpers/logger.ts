/**
 * Logger Utility
 * --------------
 * Provides a centralised logging mechanism controlled by the DEBUG_LOGS environment variable.
 * Usage:
 * import { logger } from "./helpers/logger";
 * logger.info("Message");
 * logger.error("Error message");
 */

export class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  public info(message: string, ...args: any[]): void {
    console.log(
      `[Report service] [INFO] ${this.getTimestamp()} - ${message}`,
      ...args,
    );
  }

  public warn(message: string, ...args: any[]): void {
    console.warn(
      `[Report service] [WARN] ${this.getTimestamp()} - ${message}`,
      ...args,
    );
  }

  public error(message: string, ...args: any[]): void {
    console.error(
      `[Report service] [ERROR] ${this.getTimestamp()} - ${message}`,
      ...args,
    );
  }

  public debug(message: string, ...args: any[]): void {
    console.debug(
      `[Report service] [DEBUG] ${this.getTimestamp()} - ${message}`,
      ...args,
    );
  }
}

export const logger = new Logger();
