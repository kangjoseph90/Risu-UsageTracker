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
    private requestInfoMap: Map<RequestData, { type: RequestType, format: BaseFormat }> = new Map();
    private onRequest: OnRequestCallback;
    private onResponse: OnResponseCallback;

    constructor() {
        this.onRequest = this.trackRequest.bind(this);
        this.onResponse = this.processResponse.bind(this);
        
        this.fetchWrapper.addOnRequest(this.onRequest);
        this.fetchWrapper.addOnResponse(this.onResponse);
    }

    private trackRequest: OnRequestCallback = (data: RequestData) => {
        const type = this.modeTracker.getCurrentMode();
        const format = getFormat(data);
        if(!format) return;
        this.requestInfoMap.set(data, { type, format });
    }

    private processResponse: OnResponseCallback = (requestData: RequestData, response: Response, data?: string) => {
        const info = this.requestInfoMap.get(requestData);

        if(!info) return;

        const { type, format } = info;
        const url = getRequestUrl(requestData);
        
        if (!url) return;

        const modelId: string | null = format.getModelId(response, data);
        const usageInfo: UsageInfo | null = format.getUsageInfo(response, data);

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
        Logger.log('UsageTracker destroyed.');
    }
}