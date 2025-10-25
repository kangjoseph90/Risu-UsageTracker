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

        // request 데이터 저장
        const requestData: RequestData = {
            input: modifiedInput,
            init: modifiedInit,
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
            // 원본 fetch 실행
            const response = await this.originalFetch(modifiedInput, modifiedInit);

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
            Logger.error('Fetch error:', error);
            throw error;
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
        window.fetch = this.originalFetch;
        this.onRequest.clear();
        this.onResponse.clear();
    }
}