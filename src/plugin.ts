export { 
    PLUGIN_TITLE, 
    PLUGIN_VERSION,
    PLUGIN_NAME, 
    RISU_ARGS, 
    DB_ARG, 
    ERROR_DB_ARG,
    PRICE_ARG,
    PRICE_TEMP_ARG,
    PROVIDER_MAP_ARG,
    LANGUAGE_ARG,
    BUDGET_RULE_ARG,
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
const PLUGIN_VERSION = '0.5.1' 
const PLUGIN_NAME = `${PLUGIN_TITLE} v${PLUGIN_VERSION}`

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
        latency?: number;
    }[];
    lastUpdated: string;
}
 */
const DB_ARG = 'usage_db'

/*
{
    records: {
        timestamp: string;
        model: string;
        provider: string;
        statusCode: number;
        statusText: string;
        url: string;
    }[];
}
*/
const ERROR_DB_ARG = 'error_db'

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
{
    id: string,
    name: string,
    period: 'daily' | 'weekly' | 'monthly',
    limit: number,
}[]
*/
const BUDGET_RULE_ARG = 'budget_rules'

/*
LanguageType // 'en' | 'ko'
*/
const LANGUAGE_ARG = 'language'

const RISU_ARGS: RisuArgs = {
    [DB_ARG]: RisuArgType.String,
    [ERROR_DB_ARG]: RisuArgType.String,
    [PRICE_ARG]: RisuArgType.String,
    [PRICE_TEMP_ARG]: RisuArgType.String,
    [PROVIDER_MAP_ARG]: RisuArgType.String,
    [BUDGET_RULE_ARG]: RisuArgType.String,
    [LANGUAGE_ARG]: RisuArgType.String,
}

/**
 * 등록된 모든 Risu Arg 이름을 배열로 반환
 */
export function getAllArgNames(): string[] {
    return Object.keys(RISU_ARGS);
}