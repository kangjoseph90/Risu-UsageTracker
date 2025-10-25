import { ModelPrice, PriceInfo, ProviderMap } from "../types";

export const DEFAULT_PROVIDER: ProviderMap = {
    // OpenRouter
    "https://openrouter.ai/api/v1/chat/completions": "Openrouter",

    // OpenAI
    "https://api.openai.com/v1/chat/completions": "OpenAI",

    // Anthropic
    "https://api.anthropic.com/v1/chat/completions": "Anthropic",

    // GitHub Copilot
    "https://api.githubcopilot.com/chat/completions": "GitHubCopilot",

    // AkashChat
    "https://chatapi.akash.network/api/v1/chat/completions": "AkashChat",

    // Cerebras
    "https://api.cerebras.ai/v1/chat/completions": "Cerebras",

    // ZAI
    "https://api.z.ai/api/coding/paas/v4/chat/completions": "ZAI",
    "https://api.z.ai/api/anthropic/v1/messages": "ZAI",

    // Mistral
    "https://api.mistral.ai/v1/chat/completions": "Mistral",

    // GoogleAI
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent": "GoogleAI",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent": "GoogleAI",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent": "GoogleAI",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent": "GoogleAI",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-09-2025:generateContent": "GoogleAI",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent": "GoogleAI",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent": "GoogleAI",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent": "GoogleAI",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent": "GoogleAI",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent": "GoogleAI",

    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:streamGenerateContent": "GoogleAI",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent": "GoogleAI",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:streamGenerateContent": "GoogleAI",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:streamGenerateContent": "GoogleAI",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-09-2025:streamGenerateContent": "GoogleAI",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:streamGenerateContent": "GoogleAI",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:streamGenerateContent": "GoogleAI",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:streamGenerateContent": "GoogleAI",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent": "GoogleAI",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:streamGenerateContent": "GoogleAI",

}