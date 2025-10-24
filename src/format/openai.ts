import { Logger } from "../logger";
import { RequestData, UsageInfo } from "../types";
import { getRequestUrl } from "../util";
import { BaseFormat } from "./base";

export class OpenAIFormat implements BaseFormat {
    checkRequestFormat(requestData: RequestData): boolean {
        const url = getRequestUrl(requestData);
        if (!url) return false;
        return url.includes('openai.com') || url.includes('/v1/');
    }

    getUsageInfo(response: Response, data?: string): UsageInfo | null {
        try {
            const result: UsageInfo = {
                inputTokens: 0,
                cachedInputTokens: 0,
                outputTokens: 0,
            };

            // 응답 데이터 파싱
            if (data) {
                try {
                    // SSE 형식인 경우 마지막 메시지 파싱
                    const lines = data.split('\n');
                    const lastEventLine = lines
                        .filter(line => line.startsWith('data: '))
                        .pop();
                    
                    if (lastEventLine) {
                        const jsonStr = lastEventLine.replace('data: ', '');
                        // "[DONE]" 메시지인 경우 스킵
                        if (jsonStr.trim() !== '[DONE]') {
                            const parsed = JSON.parse(jsonStr);
                            
                            // OpenAI 응답에서 usage 정보 추출
                            if (parsed.usage) {
                                result.inputTokens = parsed.usage.prompt_tokens || 0;
                                result.outputTokens = parsed.usage.completion_tokens || 0;
                            }
                        }
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

    getModelId(response: Response, data?: string): string | null {
        try {
            if (data) {
                try {
                    // SSE 형식인 경우 마지막 메시지 파싱
                    const lines = data.split('\n');
                    const lastEventLine = lines
                        .filter(line => line.startsWith('data: '))
                        .pop();
                    
                    if (lastEventLine) {
                        const jsonStr = lastEventLine.replace('data: ', '');
                        if (jsonStr.trim() !== '[DONE]') {
                            const parsed = JSON.parse(jsonStr);
                            if (parsed.model) {
                                return parsed.model;
                            }
                        }
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
