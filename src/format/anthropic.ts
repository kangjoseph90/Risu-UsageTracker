import { Logger } from "../logger";
import type { RequestData, UsageInfo } from "../types";
import { parseBody } from "../util";
import { BaseFormat } from "./base";

export class AnthropicFormat extends BaseFormat {
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

            // 3. Anthropic 포맷 검증
            // 리퀘스트: messages, model 키
            const hasRequestKeys = requestBody.messages && requestBody.model;
            
            // 리스폰스: model, content, stop_reason, usage.input_tokens, usage.output_tokens
            // 스트림 응답의 경우 구조가 다를 수 있음 (message.model 등)

            const isNormalResponse =
                responseJson.model &&
                responseJson.content &&
                responseJson.stop_reason &&
                responseJson.usage?.input_tokens !== undefined &&
                responseJson.usage?.output_tokens !== undefined;

            const isStreamResponse =
                (responseJson.message?.model || responseJson.model) &&
                (responseJson.delta?.stop_reason || responseJson.stop_reason) &&
                responseJson.usage?.output_tokens !== undefined;

            return hasRequestKeys && (isNormalResponse || isStreamResponse);
        } catch (error) {
            Logger.debug('Anthropic format check failed:', error);
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
                    
                    // 일반 응답 및 스트림 응답 처리
                    // 스트림의 경우 input_tokens는 message.usage에, output_tokens는 최상위 usage에 있을 수 있음
                    const usage = parsed.usage || {};
                    const messageUsage = parsed.message?.usage || {};

                    result.inputTokens =
                        (usage.input_tokens || messageUsage.input_tokens || 0) +
                        (usage.cache_write_input_tokens || messageUsage.cache_write_input_tokens || 0) +
                        (usage.cache_read_input_tokens || messageUsage.cache_read_input_tokens || 0);

                    result.cachedInputTokens =
                        (usage.cache_read_input_tokens || messageUsage.cache_read_input_tokens || 0);

                    result.outputTokens =
                        (usage.output_tokens || messageUsage.output_tokens || 0);
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

    getModelId(): string | null {
        try {
            if (this.data) {
                try {
                    const parsed = JSON.parse(this.data);
                    
                    if (parsed.model) {
                        return parsed.model;
                    }
                    if (parsed.message?.model) {
                        return parsed.message.model;
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

