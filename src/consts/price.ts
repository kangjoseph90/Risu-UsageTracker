import { ProviderPrice } from "../types";

/**
 * 기본 가격 정보 (1M 토큰 기준)
 */
export const DEFAULT_PRICE: ProviderPrice = {
    "openai.com": {
        "gpt-4": { inputCost: 30, cachedInputCost: 15, outputCost: 60 },
        "gpt-4-turbo": { inputCost: 10, cachedInputCost: 5, outputCost: 30 },
        "gpt-3.5-turbo": { inputCost: 0.5, cachedInputCost: 0.25, outputCost: 1.5 },
    },
    "anthropic.com": {
        "claude-3-opus": { inputCost: 15, cachedInputCost: 7.5, outputCost: 75 },
        "claude-3-sonnet": { inputCost: 3, cachedInputCost: 1.5, outputCost: 15 },
        "claude-3-haiku": { inputCost: 0.25, cachedInputCost: 0.125, outputCost: 1.25 },
    },
    "googleapis.com": {
        "gemini-pro": { inputCost: 0.125, cachedInputCost: 0.0625, outputCost: 0.375 },
        "gemini-1.5-pro": { inputCost: 3.5, cachedInputCost: 1.75, outputCost: 10.5 },
    }
};
