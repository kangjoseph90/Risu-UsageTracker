import { RequestData } from "../types"
import { AnthropicFormat } from "./anthropic"
import { BaseFormat } from "./base"
import { GoogleFormat } from "./google"
import { OpenAIFormat } from "./openai"

const formats: BaseFormat[] = [
    new AnthropicFormat(), 
    new OpenAIFormat(), 
    new GoogleFormat(),
]

function isLLMRequest(requestData: RequestData): boolean {
    return true;
}

export function getFormat(requestData: RequestData): BaseFormat | null {
    if(!isLLMRequest(requestData)) {
        return null;
    }
    
    for(const format of formats) {
        if(format.checkRequestFormat(requestData)) {
            return format;
        }
    }
    return null;
}
