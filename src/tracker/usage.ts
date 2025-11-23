import { Logger } from "../logger";
import { getFormat } from "../format";
import { PriceManager } from "../manager/price";
import { UsageManager } from "../manager/usage";
import type { CostInfo, OnRequestCallback, OnResponseCallback, PriceInfo, RequestData, UsageInfo, UsageRecord } from "../types";
import { RequestType } from "../types";
import { FetchWrapper } from "./fetch";
import { ModeTracker } from "./mode";
import { calculateCost, getRequestUrl, isLLMRequest } from "../util";
import { ProviderManager } from "../manager/provider";

function getUsageRecord(type: RequestType, modelId: string, url: string, usageInfo: UsageInfo, priceInfo: PriceInfo, latency?: number): UsageRecord {
    const costInfo: CostInfo = calculateCost(usageInfo, priceInfo);
    const record: UsageRecord = {
        timestamp: new Date().toISOString(),
        model: modelId,
        url: url,
        requestType: type,
        latency: latency,
        ...usageInfo,
        ...costInfo,
    };
    return record;
}

export class UsageTracker {
    private modeTracker: ModeTracker = new ModeTracker();
    private fetchWrapper: FetchWrapper = new FetchWrapper();
    private requestInfoMap: Map<RequestData, { type: RequestType, startTime: number }> = new Map();
    private onRequest: OnRequestCallback;
    private onResponse: OnResponseCallback;

    constructor() {
        this.onRequest = this.trackRequest.bind(this);
        this.onResponse = this.processResponse.bind(this);
        this.fetchWrapper.addOnRequest(this.onRequest);
        this.fetchWrapper.addOnResponse(this.onResponse);
    }

    private trackRequest: OnRequestCallback = (requestData: RequestData) => {
        // LLM 요청이 아니면 추적하지 않음
        if (!isLLMRequest(requestData)) {
            return;
        }

        const type = this.modeTracker.getCurrentMode();
        this.requestInfoMap.set(requestData, { type, startTime: Date.now() });
    }

    private processResponse: OnResponseCallback = (requestData: RequestData, response: Response, data?: string) => {
        // LLM 요청만 추적됨
        const info = this.requestInfoMap.get(requestData);
        if (!info) return;
        
        this.requestInfoMap.delete(requestData);

        const { type, startTime } = info;
        const latency = Date.now() - startTime;

        const url = getRequestUrl(requestData);
        if (!url) return;

        const format = getFormat(requestData, response, data);
        if (!format) return;
        
        const modelId: string | null = format.getModelId();
        const usageInfo: UsageInfo | null = format.getUsageInfo();

        Logger.log(`Got usage info:\n type: ${type}\n modelId: ${modelId}\n url: ${url}\n inputTokens: ${usageInfo?.inputTokens}\n cachedInputTokens: ${usageInfo?.cachedInputTokens}\n outputTokens: ${usageInfo?.outputTokens}\n latency: ${latency}ms`);

        if (!modelId || !usageInfo) return;

        const provider = ProviderManager.getProvider(url);
        const priceInfo: PriceInfo = PriceManager.getModelPrice(modelId, provider);
        const record: UsageRecord = getUsageRecord(type, modelId, url, usageInfo, priceInfo, latency);

        UsageManager.addRecord(record);
    }

    destroy() {
        this.fetchWrapper.removeOnRequest(this.onRequest);
        this.fetchWrapper.removeOnResponse(this.onResponse);
        this.fetchWrapper.destroy();
        this.modeTracker.destroy();
        this.requestInfoMap.clear();
    }
}