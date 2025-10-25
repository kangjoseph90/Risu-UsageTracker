export {
    PLUGIN_NAME,
    DB_ARG,
    PRICE_ARG,
    PRICE_TEMP_ARG,
    PROVIDER_MAP_ARG,
}

const PLUGIN_TITLE = 'UsageTracker'
const PLUGIN_VERSION = 'v0.0.1' 
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