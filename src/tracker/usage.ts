import { Logger } from "../logger";
import { BaseFormat } from "../format/base";
import { getFormat } from "../format/formatter";
import { PriceManager } from "../manager/pricing";
import { UsageManager } from "../manager/usage";
import { CostInfo, OnRequestCallback, OnResponseCallback, PriceInfo, RequestData, RequestType, UsageInfo, UsageRecord } from "../types";
import { FetchWrapper } from "./fetch";
import { ModeTracker } from "./mode";
import { getRequestUrl } from "../util";

function getUsageRecord(type: RequestType, modelId: string, url: string, usageInfo: UsageInfo, priceInfo: PriceInfo): UsageRecord {
    const costInfo: CostInfo = calculateCost(usageInfo, priceInfo);
    const record: UsageRecord = {
        timestamp: new Date().toISOString(),
        model: modelId,
        url: url,
        requestType: type,
        ...usageInfo,
        ...costInfo,
    };
    return record;
}

function calculateCost(usage: UsageInfo, price: PriceInfo): CostInfo {
    const inputCost = (usage.inputTokens / 1_000_000) * price.inputCost;
    const outputCost = (usage.outputTokens / 1_000_000) * price.outputCost;
    const totalCost = inputCost + outputCost;
    return {
        inputCost,
        outputCost,
        totalCost,
    };
}

export class UsageTracker {
    private modeTracker: ModeTracker = new ModeTracker();
    private fetchWrapper: FetchWrapper = new FetchWrapper();
    private requestInfoMap: Map<RequestData, RequestType> = new Map();
    private onRequest: OnRequestCallback;
    private onResponse: OnResponseCallback;

    constructor() {
        this.onRequest = this.trackRequest.bind(this);
        this.onResponse = this.processResponse.bind(this);
        this.fetchWrapper.addOnRequest(this.onRequest);
        this.fetchWrapper.addOnResponse(this.onResponse);
    }

    private trackRequest: OnRequestCallback = (requestData: RequestData) => {
        const type = this.modeTracker.getCurrentMode();
        this.requestInfoMap.set(requestData, type);
    }

    private processResponse: OnResponseCallback = (requestData: RequestData, response: Response, data?: string) => {
        const type = this.requestInfoMap.get(requestData);
        if(!type) return;
        
        this.requestInfoMap.delete(requestData);

        const url = getRequestUrl(requestData);
        if (!url) return;

        const format = getFormat(requestData, response, data);
        if(!format) return;
        
        Logger.log('UsageTracker: Detected format.', format.constructor.name);
        const modelId: string | null = format.getModelId();
        const usageInfo: UsageInfo | null = format.getUsageInfo();
        Logger.log('UsageTracker: Extracted modelId and usageInfo.', modelId, usageInfo);

        if(!modelId || !usageInfo) return;

        const priceInfo: PriceInfo = PriceManager.getModelPrice(modelId, url);
        const record: UsageRecord = getUsageRecord(type, modelId, url, usageInfo, priceInfo);

        UsageManager.addRecord(record);

        this.requestInfoMap.delete(requestData);
    }

    destroy() {
        this.fetchWrapper.removeOnRequest(this.onRequest);
        this.fetchWrapper.removeOnResponse(this.onResponse);
        this.fetchWrapper.destroy();
        this.modeTracker.destroy();
        this.requestInfoMap.clear();
    }
}