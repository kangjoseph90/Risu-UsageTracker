export { 
    PLUGIN_TITLE, 
    PLUGIN_VERSION,
    PLUGIN_NAME, 
    RISU_ARGS, 
    DB_ARG, 
    PRICE_ARG,
    PRICE_TEMP_ARG,
    PROVIDER_MAP_ARG,
    LANGUAGE_ARG,
    RisuArgType
};

enum RisuArgType {
    String = 'string',
    Int = 'int',
}

interface RisuArgs {
    [key: string]: RisuArgType;
}

const PLUGIN_TITLE = 'UsageTracker'
const PLUGIN_VERSION = 'v0.1.1' 
const PLUGIN_NAME = `${PLUGIN_TITLE}-${PLUGIN_VERSION}`

/*
{
    records: {
        timestamp: string;
        model: string;
        url: string;
        requestType: RequestType;
        inputTokens: number;
        cachedInputTokens: number;
        outputTokens: number;
        inputCost: number;
        outputCost: number;
        totalCost: number;
    }[];
    lastUpdated: string;
}
 */
const DB_ARG = 'usage_db'

/*
{
    [provider: string]: {
        [modelId: string]: {
            inputPrice: number;        // per 1M tokens
            cachedInputPrice?: number;  
            outputPrice: number;       
        }
    }
*/
const PRICE_ARG = 'price_info'
const PRICE_TEMP_ARG = 'price_temp_info'

/*
{
    [url: string]: string; // url -> provider mapping
}
*/
const PROVIDER_MAP_ARG = 'provider_map'

/*
SupportedLanguage // 'en' | 'ko'
*/
const LANGUAGE_ARG = 'language'

const RISU_ARGS: RisuArgs = {
    [DB_ARG]: RisuArgType.String,
    [PRICE_ARG]: RisuArgType.String,
    [PRICE_TEMP_ARG]: RisuArgType.String,
    [PROVIDER_MAP_ARG]: RisuArgType.String,
    [LANGUAGE_ARG]: RisuArgType.String,
}

/**
 * 등록된 모든 Risu Arg 이름을 배열로 반환
 */
export function getAllArgNames(): string[] {
    return Object.keys(RISU_ARGS);
}