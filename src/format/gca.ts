import { Logger } from "../logger";
import type { RequestData, UsageInfo } from "../types";
import { parseBody } from "../util";
import { BaseFormat } from "./base";

// Gemini Code Assist Format
export class GCAFormat extends BaseFormat {
    constructor(requestData: RequestData, response: Response, data?: string) {
        super(requestData, response, data);
    }

    checkFormat(): boolean {
        try {
            // 1. 리퀘스트 바디 파싱
            const requestBody = parseBody(this.requestData.init?.body);
            if (!requestBody) return false;

            // 2. 리스폰스 바디 파싱
            if (!this.data) return false;
            
            let responseJson: any;
            try {
                responseJson = JSON.parse(this.data);
            } catch {
                return false;
            }

            // 3. Gemini Code Assist 포맷 검증
            // 리퀘스트: contents 키
            const hasRequestKeys = requestBody.request?.contents !== undefined;
            
            // 리스폰스: modelVersion, candidates, usageMetadata.promptTokenCount, usageMetadata.candidatesTokenCount || usageMetadata.thoughtsTokenCount 
            const hasResponseKeys = 
                responseJson.response?.candidates &&
                responseJson.response?.usageMetadata?.promptTokenCount !== undefined &&
                (responseJson.response?.usageMetadata?.candidatesTokenCount !== undefined ||
                 responseJson.response?.usageMetadata?.thoughtsTokenCount !== undefined) &&
                responseJson.response?.modelVersion !== undefined;

            return hasRequestKeys && hasResponseKeys;
        } catch (error) {
            Logger.debug('Google format check failed:', error);
            return false;
        }
    }

    getUsageInfo(): UsageInfo | null {
        try {
            const result: UsageInfo = {
                inputTokens: 0,
                cachedInputTokens: 0,
                outputTokens: 0,
            };
            
            if (this.data) {
                try {
                    const parsed = JSON.parse(this.data);
                    
                    if (parsed.response?.usageMetadata) {
                        result.inputTokens = parsed.response.usageMetadata.promptTokenCount || 0;
                        result.cachedInputTokens = parsed.response.usageMetadata.cachedContentTokenCount || 0;
                        result.outputTokens = 
                            (parsed.response.usageMetadata.candidatesTokenCount || 0) + 
                            (parsed.response.usageMetadata.thoughtsTokenCount || 0);
                    }
                } catch (error) {
                    Logger.debug('Failed to parse Google response data:', error);
                }
            }
            
            return result;
        } catch (error) {
            Logger.error('Error parsing Google response:', error);
            return null;
        }
    }

    getModelId(): string | null {
        try {
            if (this.data) {
                try {
                    const parsed = JSON.parse(this.data);
                    
                    if (parsed.response?.modelVersion) {
                        return parsed.response.modelVersion;
                    }
                } catch (error) {
                    Logger.debug('Failed to parse Google model ID:', error);
                }
            }
            
            return null;
        } catch (error) {
            Logger.error('Error extracting Google model ID:', error);
            return null;
        }
    }
}

