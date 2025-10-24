/**
 * log,
 * error,
 * warn,
 * info,
 * debug
 */
export class Logger {
    static log(...message: any[]) {
        console.log("[Usage]", ...message);
    }
    static error(...message: any[]) {
        console.error("[Usage]", ...message);
    }   
    static warn(...message: any[]) {
        console.warn("[Usage]", ...message);
    }
    static info(...message: any[]) {
        console.info("[Usage]", ...message);
    }
    static debug(...message: any[]) {
        console.debug("[Usage]", ...message);
    }
}