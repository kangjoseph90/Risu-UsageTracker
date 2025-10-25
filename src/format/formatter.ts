import { Logger } from "../logger"
import { RequestData } from "../types"
import { isLLMRequest } from "../util"
import { AnthropicFormat } from "./anthropic"
import { BaseFormat } from "./base"
import { GoogleFormat } from "./google"
import { OpenAIFormat } from "./openai"

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
