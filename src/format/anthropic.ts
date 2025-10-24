import { Logger } from "../logger";
import { RequestData, UsageInfo } from "../types";
import { getRequestUrl } from "../util";
import { BaseFormat } from "./base";

export class AnthropicFormat implements BaseFormat {
    checkRequestFormat(requestData: RequestData): boolean {
        const url = getRequestUrl(requestData);
        if (!url) return false;
        return url.includes('anthropic.com') || url.includes('claude');
    }

    getUsageInfo(response: Response, data?: string): UsageInfo | null {
        try {
            const result: UsageInfo = {
                inputTokens: 0,
                cachedInputTokens: 0,
                outputTokens: 0,
            };
            
            if (data) {
                try {
                    const lines = data.split('\n');
                    const lastEventLine = lines
                        .filter(line => line.startsWith('data: '))
                        .pop();
                    
                    if (lastEventLine) {
                        const jsonStr = lastEventLine.replace('data: ', '');
                        const parsed = JSON.parse(jsonStr);
                        
                        // Anthropic 응답에서 usage 정보 추출
                        if (parsed.usage) {
                            result.inputTokens = parsed.usage.input_tokens || 0;
                            result.outputTokens = parsed.usage.output_tokens || 0;
                        }
                    }
                } catch (error) {
                    Logger.debug('Failed to parse Anthropic response data:', error);
                }
            }
            
            return result;
        } catch (error) {
            Logger.error('Error parsing Anthropic response:', error);
            return null;
        }
    }

    getModelId(response: Response, data?: string): string | null {
        try {
            if (data) {
                try {
                    const lines = data.split('\n');
                    const lastEventLine = lines
                        .filter(line => line.startsWith('data: '))
                        .pop();
                    
                    if (lastEventLine) {
                        const jsonStr = lastEventLine.replace('data: ', '');
                        const parsed = JSON.parse(jsonStr);
                        
                        // Anthropic 응답에서 모델 정보 추출
                        if (parsed.model) {
                            return parsed.model;
                        }
                    }
                } catch (error) {
                    Logger.debug('Failed to parse Anthropic model ID:', error);
                }
            }
            
            return null;
        } catch (error) {
            Logger.error('Error extracting Anthropic model ID:', error);
            return null;
        }
    }
}

