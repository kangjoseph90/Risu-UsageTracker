import { Logger } from "../logger";
import { OnRequestCallback, OnResponseCallback, RequestData } from "../types";

/**
 * addOnRequest,
 * removeOnRequest,
 * addOnResponse,
 * removeOnResponse,
 */
export class FetchWrapper {
    private originalFetch: typeof fetch;
    private onRequest: Set<OnRequestCallback> = new Set();
    private onResponse: Set<OnResponseCallback> = new Set();

    constructor() {
        this.originalFetch = window.fetch.bind(window);
        window.fetch = this.wrappedFetch.bind(this);
    }

    private async wrappedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        let modifiedInput: RequestInfo | URL = input;
        let modifiedInit: RequestInit | undefined = init;

        // onRequest 콜백 실행
        try {
            for (const callback of this.onRequest) {
                callback({ input: modifiedInput, init: modifiedInit });
            }
        } catch (error) {
            Logger.error('Error in onRequest callback:', error);
        }

        // request 데이터 저장
        const requestData: RequestData = {
            input: modifiedInput,
            init: modifiedInit,
        };

        try {
            // 원본 fetch 실행
            const response = await this.originalFetch(modifiedInput, modifiedInit);

            const contentType = response.headers.get("content-type") || "";
            const isStream = contentType.includes("text/event-stream") || 
                           contentType.includes("stream");

            if (isStream && response.body) {
                // 스트림 응답: 원본 response는 그대로 반환하되, 데이터를 동시에 모니터링
                const originalBody = response.body;
                const teePromises = this.teeStream(originalBody, response, requestData);
                
                // 비동기로 스트림 모니터링 (프론트엔드 데이터 수신을 차단하지 않음)
                teePromises.catch(error => {
                    console.error('Error monitoring stream:', error);
                });

                return response;
            } else {
                // 일반 응답: clone으로 처리
                const clonedResponse = response.clone();
                
                // 비동기로 response 콜백 실행
                this.handleNonStreamResponse(clonedResponse, requestData).catch(error => {
                    Logger.error('Error handling response:', error);
                });

                return response;
            }
        } catch (error) {
            // fetch 에러도 콜백에 전달 (선택적)
            Logger.error('Fetch error:', error);
            throw error;
        }
    }

    private async teeStream(body: ReadableStream<Uint8Array>, response: Response, requestData: RequestData): Promise<void> {
        try {
            const reader = body.getReader();
            const decoder = new TextDecoder();
            let accumulatedData = "";

            try {
                while (true) {
                    const { value, done } = await reader.read();
                    
                    if (done) break;
                    
                    if (value) {
                        const chunk = decoder.decode(value, { stream: true });
                        accumulatedData += chunk;
                    }
                }

                // 스트림 전체 수신 후 콜백 실행
                for (const callback of this.onResponse) {
                    callback(requestData, response, accumulatedData);
                }
            } finally {
                reader.releaseLock();
            }
        } catch (error) {
            Logger.error('Error in teeStream:', error);
            throw error;
        }
    }

    private async handleNonStreamResponse(response: Response, requestData: RequestData): Promise<void> {
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
                Logger.debug('Could not read response body:', error);
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
        window.fetch = this.originalFetch;
        this.onRequest.clear();
        this.onResponse.clear();
    }
}