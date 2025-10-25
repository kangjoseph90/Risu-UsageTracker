import { Logger } from "../logger";
import { RequestData, UsageInfo } from "../types";
import { getRequestUrl, parseBody } from "../util";
import { BaseFormat } from "./base";

export class GoogleFormat extends BaseFormat {
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

            // 3. Google 포맷 검증
            // 리퀘스트: contents 키
            const hasRequestKeys = requestBody.contents !== undefined;
            
            // 리스폰스: modelVersion, candidates, usageMetadata.promptTokenCount, usageMetadata.candidatesTokenCount 
            const hasResponseKeys = 
                responseJson.candidates &&
                responseJson.usageMetadata?.promptTokenCount !== undefined &&
                responseJson.usageMetadata?.candidatesTokenCount !== undefined &&
                responseJson.modelVersion !== undefined;

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
                    
                    if (parsed.usageMetadata) {
                        result.inputTokens = parsed.usageMetadata.promptTokenCount || 0;
                        result.cachedInputTokens = parsed.usageMetadata.cachedContentTokenCount || 0;
                        result.outputTokens = 
                            (parsed.usageMetadata.candidatesTokenCount || 0) + 
                            (parsed.usageMetadata.thoughtsTokenCount || 0);
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
                    
                    if (parsed.modelVersion) {
                        return parsed.modelVersion;
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

