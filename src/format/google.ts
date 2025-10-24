import { Logger } from "../logger";
import { RequestData, UsageInfo } from "../types";
import { getRequestUrl } from "../util";
import { BaseFormat } from "./base";

export class GoogleFormat implements BaseFormat {
    /**
     * Google API 요청인지 확인
     */
    checkRequestFormat(requestData: RequestData): boolean {
        const url = getRequestUrl(requestData);
        if (!url) return false;
        return url.includes('googleapis.com') || url.includes('generativelanguage');
    }

    /**
     * Google API 응답에서 사용 통계 파싱
     */
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
                    const parsed = JSON.parse(data);
                    
                    // Google API 응답에서 usage 정보 추출
                    if (parsed.usageMetadata) {
                        result.inputTokens = parsed.usageMetadata.promptTokenCount || 0;
                        result.outputTokens = parsed.usageMetadata.candidatesTokenCount || 0;
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

    /**
     * Google API 응답에서 모델 ID 추출
     */
    getModelId(response: Response, data?: string): string | null {
        try {
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    
                    // Google API 응답에서 모델 정보 추출
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

