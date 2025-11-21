import type { RequestData } from "../types"
import { AnthropicFormat } from "./anthropic"
import { GoogleFormat } from "./google"
import { OpenAIFormat } from "./openai"
import { BaseFormat } from "./base"
import { GCAFormat } from "./gca"

export { BaseFormat }

const formats = [
    AnthropicFormat,
    OpenAIFormat,
    GoogleFormat,
    GCAFormat,
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
