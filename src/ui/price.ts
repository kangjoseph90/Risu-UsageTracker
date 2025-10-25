import { PriceManager } from "../manager/price";
import { ProviderPrice, PriceInfo } from "../types";

export class PriceUI {
    private container: HTMLElement;
    private onChange: () => void;
    private editingState: {
        type: 'provider' | 'model' | 'price';
        provider?: string;
        modelId?: string;
        mode?: 'temp' | 'confirmed';
        field?: 'inputCost' | 'cachedInputCost' | 'outputCost';
    } | null = null;

    constructor(container: HTMLElement, onChange?: () => void) {
        this.container = container;
        this.onChange = onChange || (() => {});
    }

    render() {
        const confirmedPrices = PriceManager.getConfirmedPrice();
        const tempPrices = PriceManager.getTemporaryPrice();
        const allProviders = new Set([...Object.keys(confirmedPrices), ...Object.keys(tempPrices)]);

        let html = '<div class="space-y-2">';

        if (allProviders.size === 0) {
            html += `
                <div class="text-center text-zinc-400 py-8">
                    설정된 가격 정보가 없습니다
                </div>
            `;
        } else {
            const providers = Array.from(allProviders).sort();
            for (let i = 0; i < providers.length; i++) {
                const provider = providers[i];
                html += this.renderProviderGroup(provider, confirmedPrices, tempPrices);
                if (i < providers.length - 1) {
                    html += `<div class="border-t border-zinc-700"></div>`;
                }
            }
        }

        html += `</div>`;
        this.container.innerHTML = html;
        this.attachEventListeners();
    }

    private renderProviderGroup(provider: string, confirmedPrices: ProviderPrice, tempPrices: ProviderPrice): string {
        const confirmedModels = confirmedPrices[provider] || {};
        const tempModels = tempPrices[provider] || {};
        const allModels = new Set([...Object.keys(confirmedModels), ...Object.keys(tempModels)]);

        const isEditingProvider = this.editingState?.type === 'provider' && this.editingState.provider === provider;

        let html = `
            <div class="bg-zinc-800 rounded-lg px-4 pt-2 pb-4 space-y-3">
                <div class="flex items-center justify-between pb-2 min-w-0">
                    <div class="flex items-center gap-2 min-w-0">
        `;

        if (isEditingProvider) {
            html += `
                        <input type="text" value="${this.escapeHTML(provider)}" 
                               class="provider-edit-input bg-zinc-700 text-zinc-100 px-2 py-1 rounded text-sm"
                               data-provider="${this.escapeHTML(provider)}" />
                        <button class="text-green-600 hover:text-green-500 confirm-provider-btn flex-shrink-0" data-provider="${this.escapeHTML(provider)}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        </button>
                        <button class="text-zinc-400 hover:text-zinc-200 cancel-edit-btn flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
            `;
        } else {
            html += `
                        <h4 class="text-base font-semibold text-zinc-100 truncate">${this.escapeHTML(provider)}</h4>
                        <button class="text-zinc-400 hover:text-zinc-200 edit-provider-btn flex-shrink-0" data-provider="${this.escapeHTML(provider)}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                            </svg>
                        </button>
            `;
        }

        html += `
                    </div>
                </div>

                <div class="space-y-2">
        `;

        html += `<div class="border-t border-zinc-700"></div>`;

        const modelList = Array.from(allModels).sort();
        for (let i = 0; i < modelList.length; i++) {
            const modelId = modelList[i];
            const confirmedPrice = confirmedModels[modelId];
            const tempPrice = tempModels[modelId];

            if (i > 0) {
            const prevModelId = modelList[i - 1];
            const prevIsTemp = !!tempModels[prevModelId];
            const currIsTemp = !!tempPrice;
            if (!prevIsTemp && !currIsTemp) {
                html += `<div class="border-t border-zinc-700 mx-2"></div>`;
            }
            }

            if (tempPrice) {
            html += this.renderPriceRow(modelId, provider, tempPrice, 'temp');
            }

            if (confirmedPrice && !tempPrice) {
            html += this.renderPriceRow(modelId, provider, confirmedPrice, 'confirmed');
            }
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }

    private renderPriceRow(modelId: string, provider: string, price: PriceInfo, mode: 'temp' | 'confirmed'): string {
        const bgColor = mode === 'temp' ? 'bg-yellow-900/20 border border-yellow-700/30' : 'bg-zinc-700/30';
        const padding = mode === 'temp' ? 'px-3 py-2' : 'px-3';
        const modelColor = mode === 'temp' ? 'text-yellow-400' : 'text-zinc-200';
        const warningIcon = mode === 'temp' ? `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-400">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
        ` : '';

        return `
            <div class="flex items-center justify-between ${bgColor} ${padding} rounded text-sm min-w-0">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-2 min-w-0">
                        <span class="${modelColor} font-medium truncate">${this.escapeHTML(modelId)}</span>
                        ${warningIcon}
                    </div>
                    <div class="text-xs text-zinc-400 space-y-1 min-w-0">
                        ${this.renderPriceField('입력', 'inputCost', price.inputCost, modelId, provider, mode)}
                        ${this.renderPriceField('캐시 입력', 'cachedInputCost', price.cachedInputCost, modelId, provider, mode)}
                        ${this.renderPriceField('출력', 'outputCost', price.outputCost, modelId, provider, mode)}
                    </div>
                </div>
                <div class="flex gap-1 items-center flex-shrink-0">
                    ${mode === 'temp' ? `
                        <button class="text-green-600 hover:text-green-500 confirm-model-btn" data-model="${this.escapeHTML(modelId)}" data-provider="${this.escapeHTML(provider)}" title="확정">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        </button>
                    ` : ''}
                    <button class="text-red-700 hover:text-red-500 delete-model-btn" data-model="${this.escapeHTML(modelId)}" data-provider="${this.escapeHTML(provider)}" data-mode="${mode}" title="삭제">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    private renderPriceField(label: string, field: 'inputCost' | 'cachedInputCost' | 'outputCost', value: number, modelId: string, provider: string, mode: 'temp' | 'confirmed'): string {
        const isEditing = this.editingState?.type === 'price' && 
                         this.editingState.provider === provider && 
                         this.editingState.modelId === modelId && 
                         this.editingState.mode === mode &&
                         this.editingState.field === field;

        if (isEditing) {
            return `
                <div class="flex items-center gap-1 min-w-0">
                    <span class="flex-shrink-0">${label}:</span>
                    <input type="number" step="0.0001" value="${value}" 
                           class="price-edit-input bg-zinc-700 text-zinc-100 px-1 py-0.5 rounded text-xs w-20"
                           data-model="${this.escapeHTML(modelId)}" 
                           data-provider="${this.escapeHTML(provider)}" 
                           data-mode="${mode}"
                           data-field="${field}" />
                    <button class="text-green-600 hover:text-green-500 confirm-price-btn text-xs flex-shrink-0" data-model="${this.escapeHTML(modelId)}" data-provider="${this.escapeHTML(provider)}" data-mode="${mode}" data-field="${field}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </button>
                    <button class="text-zinc-400 hover:text-zinc-200 cancel-edit-btn text-xs flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
            `;
        } else {
            return `
                <div class="flex items-center gap-1 min-w-0">
                    <span class="truncate">${label}: $${value.toFixed(4)}/M</span>
                    <button class="text-zinc-400 hover:text-zinc-200 edit-price-btn flex-shrink-0" data-model="${this.escapeHTML(modelId)}" data-provider="${this.escapeHTML(provider)}" data-mode="${mode}" data-field="${field}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                        </svg>
                    </button>
                </div>
            `;
        }
    }

    private attachEventListeners() {
        // 프로바이더 수정 버튼
        this.container.querySelectorAll('.edit-provider-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const provider = (e.currentTarget as HTMLElement).getAttribute('data-provider');
                if (provider) {
                    this.editingState = { type: 'provider', provider };
                    this.render();
                }
            });
        });

        // 프로바이더 입력 필드 엔터 키
        this.container.querySelectorAll('.provider-edit-input').forEach(input => {
            (input as HTMLInputElement).addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const btn = this.container.querySelector('.confirm-provider-btn') as HTMLButtonElement;
                    btn?.click();
                }
            });
        });

        // 프로바이더 수정 확인
        this.container.querySelectorAll('.confirm-provider-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const oldProvider = (e.currentTarget as HTMLElement).getAttribute('data-provider');
                const input = this.container.querySelector('.provider-edit-input') as HTMLInputElement;
                const newProvider = input?.value.trim();
                
                if (oldProvider && newProvider && newProvider !== oldProvider) {
                    this.updateProvider(oldProvider, newProvider);
                }
                this.editingState = null;
                this.render();
                this.onChange();
            });
        });

        // 모델 확정 버튼
        this.container.querySelectorAll('.confirm-model-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modelId = (e.currentTarget as HTMLElement).getAttribute('data-model');
                const provider = (e.currentTarget as HTMLElement).getAttribute('data-provider');
                if (modelId && provider) {
                    const tempPrices = PriceManager.getTemporaryPrice();
                    if (tempPrices[provider]?.[modelId]) {
                        PriceManager.setConfirmedPrice(modelId, provider, tempPrices[provider][modelId]);
                        PriceManager.removeTemporaryModel(modelId, provider);
                        this.render();
                        this.onChange();
                    }
                }
            });
        });

        // 모델 삭제 버튼
        this.container.querySelectorAll('.delete-model-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modelId = (e.currentTarget as HTMLElement).getAttribute('data-model');
                const provider = (e.currentTarget as HTMLElement).getAttribute('data-provider');
                const mode = (e.currentTarget as HTMLElement).getAttribute('data-mode') as 'temp' | 'confirmed';
                
                if (modelId && provider) {
                    if (mode === 'temp') {
                        PriceManager.removeTemporaryModel(modelId, provider);
                    } else {
                        PriceManager.removeConfirmedModel(modelId, provider);
                    }
                    this.render();
                    this.onChange();
                }
            });
        });

        // 가격 필드 수정 버튼
        this.container.querySelectorAll('.edit-price-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modelId = (e.currentTarget as HTMLElement).getAttribute('data-model');
                const provider = (e.currentTarget as HTMLElement).getAttribute('data-provider');
                const mode = (e.currentTarget as HTMLElement).getAttribute('data-mode') as 'temp' | 'confirmed';
                const field = (e.currentTarget as HTMLElement).getAttribute('data-field') as 'inputCost' | 'cachedInputCost' | 'outputCost';
                
                if (modelId && provider && field) {
                    this.editingState = { type: 'price', provider, modelId, mode, field };
                    this.render();
                }
            });
        });

        // 가격 입력 필드 엔터 키
        this.container.querySelectorAll('.price-edit-input').forEach(input => {
            (input as HTMLInputElement).addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const btn = this.container.querySelector('.confirm-price-btn') as HTMLButtonElement;
                    btn?.click();
                }
            });
        });

        // 가격 필드 수정 확인
        this.container.querySelectorAll('.confirm-price-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modelId = (e.currentTarget as HTMLElement).getAttribute('data-model');
                const provider = (e.currentTarget as HTMLElement).getAttribute('data-provider');
                const mode = (e.currentTarget as HTMLElement).getAttribute('data-mode') as 'temp' | 'confirmed';
                const field = (e.currentTarget as HTMLElement).getAttribute('data-field') as 'inputCost' | 'cachedInputCost' | 'outputCost';
                
                const input = this.container.querySelector('.price-edit-input') as HTMLInputElement;
                const newValue = parseFloat(input?.value || '0');
                
                if (modelId && provider && field && !isNaN(newValue)) {
                    const prices = mode === 'temp' ? PriceManager.getTemporaryPrice() : PriceManager.getConfirmedPrice();
                    const currentPrice = prices[provider]?.[modelId];
                    
                    if (currentPrice) {
                        const updatedPrice = { ...currentPrice, [field]: newValue };
                        if (mode === 'temp') {
                            PriceManager.setTemporaryPrice(modelId, provider, updatedPrice);
                        } else {
                            PriceManager.setConfirmedPrice(modelId, provider, updatedPrice);
                        }
                    }
                }
                
                this.editingState = null;
                this.render();
                this.onChange();
            });
        });

        // 수정 취소 버튼들
        this.container.querySelectorAll('.cancel-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.editingState = null;
                this.render();
            });
        });
    }

    private updateProvider(oldProvider: string, newProvider: string) {
        const confirmedPrices = PriceManager.getConfirmedPrice();
        const tempPrices = PriceManager.getTemporaryPrice();

        // confirmed 가격 이동
        if (confirmedPrices[oldProvider]) {
            const models = confirmedPrices[oldProvider];
            for (const modelId in models) {
                PriceManager.setConfirmedPrice(modelId, newProvider, models[modelId]);
                PriceManager.removeConfirmedModel(modelId, oldProvider);
            }
        }

        // temporary 가격 이동
        if (tempPrices[oldProvider]) {
            const models = tempPrices[oldProvider];
            for (const modelId in models) {
                PriceManager.setTemporaryPrice(modelId, newProvider, models[modelId]);
                PriceManager.removeTemporaryModel(modelId, oldProvider);
            }
        }
    }

    private escapeHTML(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}