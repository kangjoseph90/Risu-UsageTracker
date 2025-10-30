import type { RequestData, UsageInfo } from "../types"
import { AnthropicFormat } from "./anthropic"
import { GoogleFormat } from "./google"
import { OpenAIFormat } from "./openai"

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


const formats = [
    AnthropicFormat,
    OpenAIFormat,
    GoogleFormat,
]

export function getFormat(requestData: RequestData, response: Response, data?: string): BaseFormat | null {
    for(const FormatClass of formats) {
        const formatInstance = new FormatClass(requestData, response, data);
        if(formatInstance.checkFormat()) {
            return formatInstance;
        }
    }
    return null;
}
