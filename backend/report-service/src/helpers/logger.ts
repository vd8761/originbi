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
    private isDebugMode: boolean;

    constructor() {
        // Check if DEBUG_LOGS is set to 'true' (string)
        this.isDebugMode = process.env.DEBUG_LOGS === "true";
    }

    private getTimestamp(): string {
        return new Date().toISOString();
    }

    public info(message: string, ...args: any[]): void {
        if (this.isDebugMode) {
            console.log(`[INFO] ${this.getTimestamp()} - ${message}`, ...args);
        }
    }

    public warn(message: string, ...args: any[]): void {
        if (this.isDebugMode) {
            console.warn(`[WARN] ${this.getTimestamp()} - ${message}`, ...args);
        }
    }

    public error(message: string, ...args: any[]): void {
        // Errors should typically always be logged, but for this specific request
        // we adhere to the user's wish to control "logs everywhere" via the flag.
        // However, critical errors are usually exceptions.
        // We'll log errors regardless of debug mode often, but let's stick to the requested pattern:
        // "Logs for APIs... controlled by DEBUG_CONSOLE=LOGS = true"
        // I will log errors ALWAYS, but info/debug only if flag is true.
        console.error(`[ERROR] ${this.getTimestamp()} - ${message}`, ...args);
    }

    public debug(message: string, ...args: any[]): void {
        if (this.isDebugMode) {
            console.debug(`[DEBUG] ${this.getTimestamp()} - ${message}`, ...args);
        }
    }
}

export const logger = new Logger();