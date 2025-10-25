import { Logger } from "../logger";
import { RequestData, UsageInfo } from "../types";
import { getRequestUrl, parseBody } from "../util";
import { BaseFormat } from "./base";

export class OpenAIFormat extends BaseFormat {
    constructor(requestData: RequestData, response: Response, data?: string) {
        super(requestData, response, data);
    }

    checkFormat(): boolean {
        try {
            // 1. 리퀘스트 바디 파싱
            const requestBody = parseBody(this.requestData.init?.body);
            if (!requestBody) return false;

            // 2. 리스폰스 바디 파싱 (이미 누적된 완전한 JSON)
            if (!this.data) return false;
            
            let responseJson: any;
            try {
                responseJson = JSON.parse(this.data);
            } catch {
                return false;
            }

            // 3. OpenAI 포맷 검증
            // 리퀘스트: messages, model 키
            const hasRequestKeys = requestBody.messages && requestBody.model;
            
            // 리스폰스: model, choices, usage.prompt_tokens, usage.completion_tokens
            const hasResponseKeys = 
                responseJson.model &&
                responseJson.choices &&
                responseJson.usage?.prompt_tokens !== undefined &&
                responseJson.usage?.completion_tokens !== undefined;

            return hasRequestKeys && hasResponseKeys;
        } catch (error) {
            Logger.debug('OpenAI format check failed:', error);
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
                    
                    if (parsed.usage) {
                        result.inputTokens = parsed.usage.prompt_tokens || 0;
                        result.cachedInputTokens = parsed.usage.prompt_tokens_details?.cached_tokens || 0;
                        result.outputTokens = parsed.usage.completion_tokens || 0;
                    }
                } catch (error) {
                    Logger.debug('Failed to parse OpenAI response data:', error);
                }
            }
            
            return result;
        } catch (error) {
            Logger.error('Error parsing OpenAI response:', error);
            return null;
        }
    }

    getModelId(): string | null {
        try {
            if (this.data) {
                try {
                    const parsed = JSON.parse(this.data);
                    if (parsed.model) {
                        return parsed.model;
                    }
                } catch (error) {
                    Logger.debug('Failed to parse OpenAI model ID:', error);
                }
            }
            
            return null;
        } catch (error) {
            Logger.error('Error extracting OpenAI model ID:', error);
            return null;
        }
    }
}
