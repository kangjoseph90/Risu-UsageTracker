interface ProviderPattern {
    [provider: string]: RegExp[];
}

const DEFAULT_PROVIDER_PATTERN: ProviderPattern = {
    "Openrouter": [
        /https:\/\/openrouter\.ai\/api\/v1\/chat\/completions/,
    ],
    "OpenAI": [
        /https:\/\/api\.openai\.com\/v1\/chat\/completions/,
    ],
    "Azure": [
        /https:\/\/[^/]+\.openai\.azure\.com\/openai\/deployments\/[^/]+\/(chat\/)?completions\?api-version=\d{4}-\d{2}-\d{2}/
    ], 
    "Anthropic": [
        /https:\/\/api\.anthropic\.com\/v1\/messages/,
    ],
    "GitHubCopilot": [
        /https:\/\/api\.githubcopilot\.com\/chat\/completions/,
    ],
    "AkashChat": [
        /https:\/\/chatapi\.akash\.network\/api\/v1\/chat\/completions/,
    ],
    "Cerebras": [
        /https:\/\/api\.cerebras\.ai\/v1\/chat\/completions/,
    ],
    "ZAI": [
        /https:\/\/api\.z\.ai\/api\/(?:coding\/)?paas\/v4\/chat\/completions/,
        /https:\/\/api\.z\.ai\/api\/anthropic\/v1\/messages/,
        /https:\/\/open\.bigmodel\.cn\/api\/(?:coding\/)?paas\/v4\/chat\/completions/
    ],
    "Mistral": [
        /https:\/\/api\.mistral\.ai\/v1\/chat\/completions/,
    ],
    "GoogleAI": [
        /https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/[\w.@:-]+:(generateContent|streamGenerateContent)/,
    ],
    "VertexAI": [
        /https:\/\/(?:[a-z]+-)?aiplatform\.googleapis\.com\/v1\/projects\/[^/]+\/locations\/[a-z-]+\/publishers\/(google|anthropic)\/models\/[\w.@:-]+:(generateContent|streamGenerateContent|predict|generateMessage)/
    ],
    "AWSBedrock" : [
        /https:\/\/bedrock-runtime\.[\w-]+\.amazonaws\.com\/model\/[\w.@:-]+\/invoke/
    ],
    "DeepInfra": [
        /https:\/\/api\.deepinfra\.com\/v1\/openai\/chat\/completions/,
    ],
    "XAI": [
        /https:\/\/api\.x\.ai\/v1\/chat\/completions/,
    ],
    "DeepSeek": [
        /https:\/\/api\.deepseek\.com\/chat\/completions/,
        /https:\/\/api\.deepseek\.com\/anthropic\/v1\/messages/
    ]
}

export function getDefaultProvider(url: string): string | null {
    for (const [provider, patterns] of Object.entries(DEFAULT_PROVIDER_PATTERN)) {
        for (const pattern of patterns) {
            if (pattern.test(url)) {
                return provider;
            }
        }
    }
    return null;
}