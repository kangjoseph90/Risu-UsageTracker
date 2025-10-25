import { Logger } from "./logger";
import { RequestData, RequestType } from "./types";

export {
    parseRequestType,
    getRequestUrl,
    isLLMRequest,
    parseBody,
}

function parseRequestType(mode: string): RequestType {
    switch(mode) {
        case 'model': return RequestType.Chat;
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
            console.error('Failed to decode Uint8Array:', error);
            return null;
        }
    } else if (body instanceof ArrayBuffer) {
        try {
            bodyStr = new TextDecoder().decode(new Uint8Array(body));
        } catch (error) {
            console.error('Failed to decode ArrayBuffer:', error);
            return null;
        }
    } else {
        // Blob, FormData, URLSearchParams 등
        try {
            bodyStr = body.toString();
        } catch (error) {
            console.error('Failed to convert body to string:', error);
            return null;
        }
    }

    // JSON 파싱
    try {
        return JSON.parse(bodyStr);
    } catch (error) {
        console.error('Failed to parse body as JSON:', error);
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
    const body = requestData.init?.body;
    if (!body) return false;

    // parseBody로 JSON 파싱
    const bodyJson = parseBody(body);
    if (!bodyJson) return false;

    // 조건 1: body에 model 키가 있거나 url에 models가 있어야 함
    const hasModelKey = 'model' in bodyJson;
    
    const url = getRequestUrl(requestData);
    const hasModelsInUrl = url ? url.includes("models") : false;

    const hasModel = hasModelKey || hasModelsInUrl;
    
    // 조건 2: body에 contents, messages, prompt 키 중 하나가 있어야 함
    const contentKeywords = ["contents", "messages", "prompt"];
    const hasContent = contentKeywords.some(keyword => keyword in bodyJson);

    return hasModel && hasContent;
}