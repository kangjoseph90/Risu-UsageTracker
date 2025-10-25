export {
    RisuArgType,
    RisuArg,
    ReplacerFunction,
    ReplacerType,
    RequestType,
    PriceInfo,
    ModelPrice,
    ProviderPrice,
    UsageInfo,
    CostInfo,
    UsageRecord,
    UsageDB,
    UsageFilter,
    OnRequestCallback,
    OnResponseCallback,
    RequestData,
    ProviderMap,
}

enum RisuArgType {
    String,
    Int
}

interface RisuArg {
    [name: string]: RisuArgType;
}

type ReplacerFunction = (content: any[], type: string) => any[] | Promise<any[]>

enum ReplacerType {
    BeforeRequest = 'beforeRequest',
    AfterRequest = 'afterRequest',
}

enum RequestType {
    Chat = 'chat',
    Emotion = 'emotion',
    Translate = 'translate',
    Other = 'other',
    Unknown = 'unknown',
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
}

interface UsageDB {
    records: UsageRecord[],
    lastUpdated: string,
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
