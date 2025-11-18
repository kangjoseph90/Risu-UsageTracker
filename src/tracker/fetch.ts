import { Logger } from "../logger";
import type { OnRequestCallback, OnResponseCallback, RequestData } from "../types";

// globalFetch와 fetchNative의 타입 정의
interface GlobalFetchArgs {
    plainFetchForce?: boolean;
    plainFetchDeforce?: boolean;
    body?: any;
    headers?: { [key: string]: string };
    rawResponse?: boolean;
    method?: 'POST' | 'GET';
    abortSignal?: AbortSignal;
    useRisuToken?: boolean;
    chatId?: string;
}

interface GlobalFetchResult {
    ok: boolean;
    data: any;
    headers: { [key: string]: string };
    status: number;
}

type GlobalFetchFunction = (url: string, arg?: GlobalFetchArgs) => Promise<GlobalFetchResult>;

type FetchNativeFunction = (url: string, arg?: {
    body?: string | Uint8Array | ArrayBuffer;
    headers?: { [key: string]: string };
    method?: "POST" | "GET" | "PUT" | "DELETE";
    signal?: AbortSignal;
    useRisuTk?: boolean;
    chatId?: string;
}) => Promise<Response>;

/**
 * addOnRequest,
 * removeOnRequest,
 * addOnResponse,
 * removeOnResponse,
 */
export class FetchWrapper {
    private originalGlobalFetch: GlobalFetchFunction | null = null;
    private originalFetchNative: FetchNativeFunction | null = null;
    private onRequest: Set<OnRequestCallback> = new Set();
    private onResponse: Set<OnResponseCallback> = new Set();

    constructor() {
        this.patchGlobalFunctions();
    }

    private patchGlobalFunctions() {
        //@ts-ignore
        if (typeof globalFetch === 'function') {
            //@ts-ignore
            this.originalGlobalFetch = globalFetch;
            //@ts-ignore
            globalFetch = this.wrappedGlobalFetch.bind(this);
        }

        //@ts-ignore
        if (typeof globalThis.__pluginApis__.risuFetch === 'function') {
            //@ts-ignore
            this.originalGlobalFetch = globalThis.__pluginApis__.risuFetch;
            //@ts-ignore
            globalThis.__pluginApis__.risuFetch = this.wrappedGlobalFetch.bind(this);
        }

        //@ts-ignore
        if (typeof fetchNative === 'function') {
            //@ts-ignore
            this.originalFetchNative = fetchNative;
            //@ts-ignore
            fetchNative = this.wrappedFetchNative.bind(this);
        }

        //@ts-ignore
        if (typeof globalThis.__pluginApis__.nativeFetch === 'function') {
            //@ts-ignore
            this.originalFetchNative = globalThis.__pluginApis__.nativeFetch;
            //@ts-ignore
            globalThis.__pluginApis__.nativeFetch = this.wrappedFetchNative.bind(this);
        }
    }

    private async wrappedGlobalFetch(url: string, arg: GlobalFetchArgs = {}): Promise<GlobalFetchResult> {
        Logger.debug('wrappedGlobalFetch called:', url, arg);
        // body를 안전하게 변환
        let parsedBody: BodyInit | null | undefined;
        if (arg.body !== undefined && arg.body !== null) {
            if (typeof arg.body === 'string') {
                parsedBody = arg.body;
            } else if (arg.body instanceof URLSearchParams || 
                       arg.body instanceof FormData || 
                       arg.body instanceof Blob || 
                       arg.body instanceof ArrayBuffer ||
                       arg.body instanceof ReadableStream) {
                parsedBody = arg.body;
            } else {
                // 객체나 기타 타입은 JSON으로 변환
                parsedBody = JSON.stringify(arg.body);
            }
        }

        // request 데이터 저장
        const requestData: RequestData = {
            input: url,
            init: {
                method: arg.method || 'POST',
                headers: arg.headers,
                body: parsedBody,
                signal: arg.abortSignal,
            },
        };

        // onRequest 콜백 실행
        try {
            for (const callback of this.onRequest) {
                callback(requestData);
            }
        } catch (error) {
            Logger.error('Error in onRequest callback:', error);
        }

        try {
            // 원본 globalFetch 실행
            const result = await this.originalGlobalFetch!(url, arg);

            // onResponse 콜백 실행
            this.handleGlobalFetchResponse(result, requestData).catch(error => {
                Logger.error('Error handling globalFetch response:', error);
            });

            return result;
        } catch (error) {
            Logger.error('globalFetch error:', error);
            throw error;
        }
    }

    private async wrappedFetchNative(url: string, arg: {
        body?: string | Uint8Array | ArrayBuffer;
        headers?: { [key: string]: string };
        method?: "POST" | "GET" | "PUT" | "DELETE";
        signal?: AbortSignal;
        useRisuTk?: boolean;
        chatId?: string;
    } = {}): Promise<Response> {
        Logger.debug('wrappedFetchNative called:', url, arg);
        // request 데이터 저장
        const requestData: RequestData = {
            input: url,
            init: {
                method: arg.method || 'POST',
                headers: arg.headers,
                body: arg.body as BodyInit | null | undefined,
                signal: arg.signal,
            },
        };

        // onRequest 콜백 실행
        try {
            for (const callback of this.onRequest) {
                callback(requestData);
            }
        } catch (error) {
            Logger.error('Error in onRequest callback:', error);
        }

        try {
            // 원본 fetchNative 실행
            const response = await this.originalFetchNative!(url, arg);

            const contentType = response.headers.get("content-type") || "";
            const isStream = contentType.includes("text/event-stream") || 
                           contentType.includes("stream");

            if (isStream && response.body) {
                // 스트림 응답: tee()로 스트림을 복제
                const [stream1, stream2] = response.body.tee();
                
                // 복제된 스트림으로 새 response 생성
                const monitoredResponse = new Response(stream1, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                });

                // 비동기로 스트림 모니터링 (stream2 사용)
                this.handleStream(stream2, response, requestData).catch(error => {
                    Logger.error('Error monitoring stream:', error);
                });

                return monitoredResponse;
            } else {
                // 일반 응답: clone으로 처리
                const clonedResponse = response.clone();

                // 비동기로 response 콜백 실행
                this.handleResponse(clonedResponse, requestData).catch(error => {
                    Logger.error('Error handling response:', error);
                });

                return response;
            }
        } catch (error) {
            // fetch 에러도 콜백에 전달 (선택적)
            Logger.error('fetchNative error:', error);
            throw error;
        }
    }

    private async handleGlobalFetchResponse(result: GlobalFetchResult, requestData: RequestData): Promise<void> {
        try {
            let responseData: string | undefined;

            // data가 Uint8Array인 경우 (rawResponse: true)
            if (result.data instanceof Uint8Array) {
                responseData = '[Binary Data: Uint8Array]';
            }
            // data가 문자열인 경우
            else if (typeof result.data === 'string') {
                responseData = result.data;
            }
            // data가 객체인 경우 (JSON 파싱된 결과)
            else {
                responseData = JSON.stringify(result.data);
            }

            // 콜백 실행 - Response 객체 대신 가짜 Response 객체 생성
            const mockResponse = {
                status: result.status,
                ok: result.ok,
                headers: new Map(Object.entries(result.headers)),
            } as any;

            for (const callback of this.onResponse) {
                callback(requestData, mockResponse, responseData);
            }
        } catch (error) {
            Logger.error('Error in handleGlobalFetchResponse:', error);
        }
    }

    private async handleStream(body: ReadableStream<Uint8Array>, response: Response, requestData: RequestData): Promise<void> {
        try {
            const reader = body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = "";
            let accumulatedData: any = {};

            try {
                while (true) {
                    const { value, done } = await reader.read();
                    
                    if (done) break;
                    
                    if (value) {
                        const chunk = decoder.decode(value, { stream: true });
                        accumulatedText += chunk;

                        // 개행으로 구분된 라인 처리
                        const lines = accumulatedText.split('\n');
                        
                        // 마지막 라인이 불완전할 수 있으므로 보관
                        accumulatedText = lines[lines.length - 1];
                        
                        // 완전한 라인들 처리
                        for (let i = 0; i < lines.length - 1; i++) {
                            const line = lines[i];
                            
                            // "data: "로 시작하는 라인 파싱
                            if (line.startsWith('data: ')) {
                                const jsonStr = line.replace('data: ', '');
                                
                                // [DONE] 제외
                                if (jsonStr.trim() === '[DONE]') continue;
                                
                                try {
                                    const parsed = JSON.parse(jsonStr);
                                    // 누적: 가장 마지막 값으로 덮어씀
                                    accumulatedData = { ...accumulatedData, ...parsed };
                                } catch (error) {
                                    Logger.debug('Failed to parse SSE line:', error);
                                }
                            }
                        }
                    }
                }

                // 마지막 불완전한 라인 처리
                if (accumulatedText && accumulatedText.startsWith('data: ')) {
                    const jsonStr = accumulatedText.replace('data: ', '');
                    if (jsonStr.trim() !== '[DONE]') {
                        try {
                            const parsed = JSON.parse(jsonStr);
                            accumulatedData = { ...accumulatedData, ...parsed };
                        } catch (error) {
                            Logger.debug('Failed to parse final SSE line:', error);
                        }
                    }
                }

                // 누적된 완전한 데이터로 콜백 실행
                const finalData = JSON.stringify(accumulatedData);
                for (const callback of this.onResponse) {
                    callback(requestData, response, finalData);
                }
            } finally {
                reader.releaseLock();
            }
        } catch (error) {
            Logger.error('Error in handleStream:', error);
            throw error;
        }
    }

    private async handleResponse(response: Response, requestData: RequestData): Promise<void> {
        try {
            const contentType = response.headers.get("content-type") || "";
            let responseData: string | undefined;
            
            try {
                // JSON이나 텍스트 응답 읽기
                const contentTypeHeader = contentType.toLowerCase();
                if (contentTypeHeader.includes("application/json")) {
                    const json = await response.json();
                    responseData = JSON.stringify(json);
                } else if (contentTypeHeader.includes("text/")) {
                    responseData = await response.text();
                }
            } catch (error) {
                // 응답을 읽을 수 없는 경우 (이미 소비되었거나 바이너리 등)
                Logger.log('Could not read response body:', error);
            }

            // 콜백 실행
            for (const callback of this.onResponse) {
                callback(requestData, response, responseData);
            }
        } catch (error) {
            Logger.error('Error in handleNonStreamResponse:', error);
        }
    }

    public addOnRequest(callback: OnRequestCallback) {
        this.onRequest.add(callback);
    }

    public removeOnRequest(callback: OnRequestCallback) {
        this.onRequest.delete(callback);
    }

    public addOnResponse(callback: OnResponseCallback) {
        this.onResponse.add(callback);
    }

    public removeOnResponse(callback: OnResponseCallback) {
        this.onResponse.delete(callback);
    }

    public destroy() {
        // 원본 함수 복원
        if (this.originalGlobalFetch) {
            //@ts-ignore
            globalFetch = this.originalGlobalFetch;
        }
        if (this.originalFetchNative) {
            //@ts-ignore
            fetchNative = this.originalFetchNative;
        }
        
        this.onRequest.clear();
        this.onResponse.clear();
    }
}