import { RequestData, UsageInfo } from "../types";

/**
 * checkRequestFormat,
 * getUsageInfo,
 * getModelId,
 */
export interface BaseFormat {
    checkRequestFormat(requestData: RequestData): boolean;
    getUsageInfo(response: Response, data?: string): UsageInfo | null;
    getModelId(response: Response, data?: string): string | null;
}
