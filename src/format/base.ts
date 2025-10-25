import { RequestData, UsageInfo } from "../types";

export abstract class BaseFormat {
    protected requestData: RequestData;
    protected response: Response;
    protected data?: string;

    constructor(requestData: RequestData, response: Response, data?: string) {
        this.requestData = requestData;
        this.response = response;
        this.data = data;
    }

    abstract checkFormat(): boolean;
    abstract getUsageInfo(): UsageInfo | null;
    abstract getModelId(): string | null;
}
