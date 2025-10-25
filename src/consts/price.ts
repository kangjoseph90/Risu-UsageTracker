import { ProviderPrice } from "../types";

/**
 * 기본 가격 정보 (1M 토큰 기준)
 */
export const DEFAULT_PRICE: ProviderPrice = {
    "OpenAI": {
        "gpt-5": { inputPrice: 1.25, cachedInputPrice: 0.125, outputPrice: 10.0 },
        "gpt-5-mini": { inputPrice: 0.25, cachedInputPrice: 0.025, outputPrice: 2.0 },
        "gpt-5-nano": { inputPrice: 0.05, cachedInputPrice: 0.005, outputPrice: 0.4 },
        "gpt-5-chat-latest": { inputPrice: 1.25, cachedInputPrice: 0.125, outputPrice: 10.0 },
        "gpt-5-codex": { inputPrice: 1.25, cachedInputPrice: 0.125, outputPrice: 10.0 },
        "gpt-5-pro": { inputPrice: 15.0, outputPrice: 120.0 },
        "gpt-4.1": { inputPrice: 2.0, cachedInputPrice: 0.5, outputPrice: 8.0 },
        "gpt-4.1-mini": { inputPrice: 0.4, cachedInputPrice: 0.1, outputPrice: 1.6 },
        "gpt-4.1-nano": { inputPrice: 0.1, cachedInputPrice: 0.025, outputPrice: 0.4 },
        "gpt-4o": { inputPrice: 2.5, cachedInputPrice: 1.25, outputPrice: 10.0 },
        "gpt-4o-2024-05-13": { inputPrice: 5.0, outputPrice: 15.0 },
        "gpt-4o-mini": { inputPrice: 0.15, cachedInputPrice: 0.075, outputPrice: 0.6 },
        "chatgpt-4o-latest": { inputPrice: 5.0, outputPrice: 15.0 },
    },
    "Anthropic": {
        "claude-sonnet-4-5-20250929": { inputPrice: 3, cachedInputPrice: 0.3, outputPrice: 15 },
        "claude-sonnet-4-5": { inputPrice: 3, cachedInputPrice: 0.3, outputPrice: 15 },
        "claude-sonnet-4-20250514": { inputPrice: 3, cachedInputPrice: 0.3, outputPrice: 15 },
        "claude-sonnet-4-0": { inputPrice: 3, cachedInputPrice: 0.3, outputPrice: 15 },
        "claude-3-7-sonnet-20250219": { inputPrice: 3, cachedInputPrice: 0.3, outputPrice: 15 },
        "claude-3-7-sonnet-latest": { inputPrice: 3, cachedInputPrice: 0.3, outputPrice: 15 },
        "claude-haiku-4-5-20251001": { inputPrice: 1, cachedInputPrice: 0.1, outputPrice: 5 },
        "claude-haiku-4-5": { inputPrice: 1, cachedInputPrice: 0.1, outputPrice: 5 },
        "claude-3-5-haiku-20241022": { inputPrice: 1, cachedInputPrice: 0.1, outputPrice: 5 },
        "claude-3-5-haiku-latest": { inputPrice: 1, cachedInputPrice: 0.1, outputPrice: 5 },
        "claude-3-haiku-20240307": { inputPrice: 1, cachedInputPrice: 0.1, outputPrice: 5 },
        "claude-opus-4-1-20250805": { inputPrice: 15, cachedInputPrice: 1.5, outputPrice: 75 },
        "claude-opus-4-1": { inputPrice: 15, cachedInputPrice: 1.5, outputPrice: 75 },
        "claude-opus-4-20250514": { inputPrice: 15, cachedInputPrice: 1.5, outputPrice: 75 },
        "claude-opus-4-0": { inputPrice: 15, cachedInputPrice: 1.5, outputPrice: 75 },
    },
    "GoogleAI": {
        "gemini-2.5-pro": { inputPrice: 1.25, cachedInputPrice: 0.125, outputPrice: 10.0 },
        "gemini-2.5-flash": { inputPrice: 0.3, cachedInputPrice: 0.03, outputPrice: 2.5 },
        "gemini-2.5-flash-preview-09-2025": { inputPrice: 0.3, cachedInputPrice: 0.03, outputPrice: 2.5 },
        "gemini-2.5-flash-lite": { inputPrice: 0.1, cachedInputPrice: 0.01, outputPrice: 0.4 },
        "gemini-2.5-flash-lite-preview-09-2025": { inputPrice: 0.1, cachedInputPrice: 0.01, outputPrice: 0.4 },
        "gemini-pro-latest": { inputPrice: 1.25, cachedInputPrice: 0.125, outputPrice: 10.0 },
        "gemini-flash-latest": { inputPrice: 0.3, cachedInputPrice: 0.03, outputPrice: 2.5 },
        "gemini-flash-lite-latest": { inputPrice: 0.1, cachedInputPrice: 0.01, outputPrice: 0.4 },
        "gemini-2.0-flash": { inputPrice: 0.1, cachedInputPrice: 0.025, outputPrice: 0.4 },
        "gemini-2.0-flash-lite": { inputPrice: 0.075, outputPrice: 0.3 },
    }
};
