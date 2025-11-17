import { Logger } from "./logger";
import type { CostInfo, PriceInfo, RequestData, UsageInfo } from "./types";
import { RequestType } from "./types";

export {
    debounce,
    parseRequestType,
    getRequestUrl,
    isLLMRequest,
    parseBody,
    calculateCost,
    formatNumber,
    downloadFile,
    readFileAsText
}

/**
 * Triggers a browser download for the given content.
 * @param content The string content to download.
 * @param fileName The name of the file.
 * @param mimeType The MIME type of the file.
 */
function downloadFile(content: string, fileName: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Reads the content of a File object as a text string.
 * @param file The File object to read.
 * @returns A Promise that resolves with the file's text content.
 */
function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result as string);
        };
        reader.onerror = () => {
            reject(reader.error);
        };
        reader.readAsText(file);
    });
}

function debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: number | undefined;

    return function(this: ThisParameterType<T>, ...args: Parameters<T>): void {
        const context = this;
        clearTimeout(timeout);
        timeout = window.setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

function parseRequestType(mode: string): RequestType {
    switch(mode) {
        case 'model': return RequestType.Chat;
        case 'memory': return RequestType.Memory;
        case 'emotion': return RequestType.Emotion;
        case 'translate': return RequestType.Translate;
        case 'otherAx':
        case 'submodel': return RequestType.Other;
        default: return RequestType.Unknown;
    }
}

function parseBody(body: BodyInit | null | undefined): any | null {
    if (!body) return null;
    
    let bodyStr: string;
    
    if (typeof body === 'string') {
        bodyStr = body;
    } else if (body instanceof Uint8Array) {
        try {
            bodyStr = new TextDecoder().decode(body);
        } catch (error) {
            Logger.error('Failed to decode Uint8Array:', error);
            return null;
        }
    } else if (body instanceof ArrayBuffer) {
        try {
            bodyStr = new TextDecoder().decode(new Uint8Array(body));
        } catch (error) {
            Logger.error('Failed to decode ArrayBuffer:', error);
            return null;
        }
    } else {
        // Blob, FormData, URLSearchParams 등
        try {
            bodyStr = body.toString();
        } catch (error) {
            Logger.error('Failed to convert body to string:', error);
            return null;
        }
    }

    // JSON 파싱
    try {
        return JSON.parse(bodyStr);
    } catch (error) {
        Logger.debug('Failed to parse body as JSON:', error);
        return null;
    }
}

function isProxyRequest(requestData: RequestData): boolean {
    const init = requestData.init;
    if (!init || !init.headers) {
        return false;
    }
    
    const headers = init.headers;
    if (headers instanceof Headers) {
        return headers.has('risu-url');
    } else if (Array.isArray(headers)) {
        return headers.some(([key]) => key.toLowerCase() === 'risu-url');
    } else {
        return 'risu-url' in headers;
    }
}

function extractRealUrl(requestData: RequestData): string | null {
    const init = requestData.init;
    if (!init || !init.headers) {
        return null;
    }
    
    const headers = init.headers;
    let risuUrl: string | null = null;
    
    if (headers instanceof Headers) {
        risuUrl = headers.get('risu-url');
    } else if (Array.isArray(headers)) {
        const found = headers.find(([key]) => key.toLowerCase() === 'risu-url');
        risuUrl = found ? found[1] : null;
    } else {
        risuUrl = (headers as Record<string, string>)['risu-url'] || null;
    }
    
    if (!risuUrl) {
        return null;
    }
    
    try {
        return decodeURIComponent(risuUrl);
    } catch (e) {
        return null;
    }
}

function parseURL(input: RequestInfo | URL): string | null {
    if (typeof input === 'string') {
        return input;
    } else if (input instanceof URL) {
        return input.toString();
    } else if (input instanceof Request) {
        return input.url;
    }
    return null;
}

function getRequestUrl(requestData: RequestData): string | null {
    let url: string | null = null;
    
    if (!isProxyRequest(requestData)) {
        const input = requestData.input;
        url = parseURL(input);
    } else {
        url = extractRealUrl(requestData);
    }
    
    if (!url) return null;
    
    // URL에서 쿼리 파라미터 제거 (API 키 등 민감 정보 제거)
    try {
        const urlObj = new URL(url);
        return urlObj.origin + urlObj.pathname;
    } catch (e) {
        // URL 파싱 실패 시 원본 반환
        const queryIndex = url.indexOf('?');
        return queryIndex > -1 ? url.substring(0, queryIndex) : url;
    }
}

function isLLMRequest(requestData: RequestData): boolean {
    // globalFetch, fetchNative 만 추적하므로 헤더 검증은 생략
    /*
    const init = requestData.init;
    
    // 헤더가 없는 요청은 LLM 요청이 아님
    if (!init || !init.headers) {
        return false;
    }

    // LLM 요청은 content-type이 application/json이어야 함
    let contentType: string | null = null;
    const headers = init.headers;
    
    if (headers instanceof Headers) {
        contentType = headers.get('content-type');
    } else if (Array.isArray(headers)) {
        const found = headers.find(([key]) => key.toLowerCase() === 'content-type');
        contentType = found ? found[1] : null;
    } else {
        const headersRecord = headers as Record<string, string>;
        const contentTypeKey = Object.keys(headersRecord)
                                     .find(key => key.toLowerCase() === 'content-type');
        contentType = contentTypeKey ? headersRecord[contentTypeKey] : null;
    }
    
    // content-type이 없거나 application/json이 아니면 제외
    if (!contentType || !contentType.toLowerCase().includes('application/json')) {
        return false;
    }
    */

    const body = requestData.init?.body;
    if (!body) return false;

    // parseBody로 JSON 파싱
    const bodyJson = parseBody(body);
    if (!bodyJson) return false;
    
    // 조건 1: body에 model 키가 있거나 url에 models, model이 있어야 함
    const hasModelKey = 'model' in bodyJson;
    
    const url = getRequestUrl(requestData);
    const hasModelsInUrl = url ? url.includes("models") || url.includes("model") : false;

    const hasModel = hasModelKey || hasModelsInUrl;
    
    // 조건 2: body에 contents, messages 키 중 하나가 있어야 함
    const contentKeywords = ["contents", "messages"];
    const hasContent = contentKeywords.some(keyword => keyword in bodyJson);
    return hasModel && hasContent;
}

function calculateCost(usage: UsageInfo, price: PriceInfo): CostInfo {
    // cachedInputPrice가 정의되지 않으면 inputPrice 사용
    const cachedPrice = price.cachedInputPrice ?? price.inputPrice;

    const inputCost = ((usage.inputTokens - usage.cachedInputTokens) / 1_000_000) * price.inputPrice;
    const cachedInputCost = (usage.cachedInputTokens / 1_000_000) * cachedPrice;
    const outputCost = (usage.outputTokens / 1_000_000) * price.outputPrice;
    const totalCost = inputCost + cachedInputCost + outputCost;
    
    return {
        inputCost: inputCost + cachedInputCost,
        outputCost,
        totalCost,
    };
}

function formatNumber(num: number): string {
    if (num >= 1_000_000_000) {
        return (num / 1_000_000_000).toFixed(1) + 'B';
    } else if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(1) + 'M';
    } else if (num >= 1_000) {
        return (num / 1_000).toFixed(1) + 'K';
    }
    return num.toString();
}