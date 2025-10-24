import { RequestData, RequestType } from "./types";

export {
    parseRequestType,
    getRequestUrl,
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

function parseURL(input: RequestData['input']): string | null {
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
    if (!isProxyRequest(requestData)) {
        const input = requestData.input;
        return parseURL(input);
    }
    
    return extractRealUrl(requestData);
}