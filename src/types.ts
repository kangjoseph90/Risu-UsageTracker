export {
    RequestType,
    BudgetPeriod
};

export type {
    PriceInfo,
    ModelPrice,
    ProviderPrice,
    UsageInfo,
    CostInfo,
    UsageRecord,
    UsageDB,
    ErrorRecord,
    ErrorDB,
    UsageFilter,
    OnRequestCallback,
    OnResponseCallback,
    RequestData,
    ProviderMap,
    BudgetRule
};

enum RequestType {
    Chat = 'chat',
    Memory = 'memory',
    Emotion = 'emotion',
    Translate = 'translate',
    Other = 'other',
    Unknown = 'unknown',
}

enum BudgetPeriod {
    Daily = 'daily',
    Weekly = 'weekly',
    Monthly = 'monthly',
}

interface PriceInfo { // per 1M tokens
    inputPrice: number, 
    cachedInputPrice?: number,
    outputPrice: number,
}

interface ModelPrice {
    [modelId: string]: PriceInfo;
}

interface ProviderPrice {
    [provider: string]: ModelPrice;  
}

interface UsageInfo {
    inputTokens: number,
    cachedInputTokens: number,
    outputTokens: number,
}

interface CostInfo {
    inputCost: number,
    outputCost: number,
    totalCost: number,
}

interface UsageRecord extends UsageInfo, CostInfo {
    timestamp: string,
    model: string,
    url: string,
    requestType: RequestType,
    latency?: number;
}

interface UsageDB {
    records: UsageRecord[],
    lastUpdated: string,
}

interface ErrorRecord {
    timestamp: string;
    provider: string;
    model: string;
    statusCode: number;
    url: string;
    requestType?: RequestType;
}

interface ErrorDB {
    records: ErrorRecord[];
    lastUpdated: string;
}

type UsageFilter = (record: UsageRecord) => boolean

interface RequestData {
    input: RequestInfo | URL;
    init?: RequestInit;
}

type OnRequestCallback = (requestData: RequestData) => void;
type OnResponseCallback = (requestData: RequestData, response: Response, data?: string) => void;

interface ProviderMap {
    [url: string]: string; // url -> providerName
}

interface BudgetRule {
    id: string,
    name: string,
    period: BudgetPeriod,
    limit: number,
    model?: string, // Optional filter for specific model
    provider?: string, // Optional filter for specific provider
    requestType?: string, // Optional filter for specific request type
}
