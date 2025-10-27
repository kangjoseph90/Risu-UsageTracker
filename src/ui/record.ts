import { UsageManager } from "../manager/usage";
import { UsageRecord } from "../types";
import { ProviderManager } from "../manager/provider";

/**
 * RecordUI: Usage Record 관리 UI
 */
export class RecordUI {
    private container: HTMLElement;
    private selectedRecords: Set<UsageRecord> = new Set();

    constructor(container: HTMLElement) {
        this.container = container;
    }

    render() {
        const allRecords = UsageManager.getRecords([]);
        const providerMap = ProviderManager.getAllProviders();

        this.container.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h3 class="text-xl font-semibold text-zinc-100">Usage Records 관리</h3>
                    <div class="flex gap-2">
                        <button id="deleteSelectedButton" class="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                            선택 삭제 (<span id="selectedCount">0</span>)
                        </button>
                        <button id="deleteAllButton" class="px-3 py-1.5 rounded bg-red-700 hover:bg-red-800 text-white text-sm transition-colors">
                            전체 삭제
                        </button>
                    </div>
                </div>

                <div class="text-sm text-zinc-400">
                    <p>총 <strong class="text-zinc-200">${allRecords.length}</strong>개의 레코드가 있습니다.</p>
                    <p>개별 레코드를 선택하여 삭제하거나, 필터를 적용하여 일괄 삭제할 수 있습니다.</p>
                </div>

                <!-- 필터 섹션 -->
                <div class="p-3 bg-zinc-800 rounded-lg space-y-2">
                    <h4 class="text-sm font-semibold text-zinc-200">필터</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <select id="filterProvider" class="px-2 py-1 bg-zinc-700 text-zinc-200 rounded text-sm">
                            <option value="">모든 프로바이더</option>
                            ${this.getUniqueProviders(allRecords, providerMap).map(p => `
                                <option value="${p}">${p}</option>
                            `).join('')}
                        </select>
                        <select id="filterModel" class="px-2 py-1 bg-zinc-700 text-zinc-200 rounded text-sm">
                            <option value="">모든 모델</option>
                            ${this.getUniqueModels(allRecords).map(m => `
                                <option value="${m}">${m}</option>
                            `).join('')}
                        </select>
                        <button id="applyFilterButton" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors">
                            필터 적용
                        </button>
                    </div>
                </div>

                <!-- 레코드 목록 -->
                <div class="space-y-2 max-h-96 overflow-y-auto">
                    ${allRecords.length === 0 ? `
                        <div class="text-center text-zinc-500 py-8">
                            레코드가 없습니다.
                        </div>
                    ` : allRecords.map((record, index) => {
                        const provider = providerMap[record.url] || record.url;
                        return `
                            <div class="recordItem flex items-start gap-2 p-3 bg-zinc-800 rounded-lg hover:bg-zinc-750 transition-colors" data-index="${index}">
                                <input type="checkbox" class="recordCheckbox mt-1 w-4 h-4 cursor-pointer" data-index="${index}">
                                <div class="flex-1 min-w-0 text-xs">
                                    <div class="flex justify-between items-start mb-1">
                                        <div class="font-semibold text-zinc-200">${provider} - ${record.model}</div>
                                        <div class="text-zinc-400">${new Date(record.timestamp).toLocaleString()}</div>
                                    </div>
                                    <div class="text-zinc-400 space-y-0.5">
                                        <div>입력: ${record.inputTokens.toLocaleString()} (캐시: ${record.cachedInputTokens.toLocaleString()}) | 출력: ${record.outputTokens.toLocaleString()}</div>
                                        <div>비용: $${record.totalCost.toFixed(4)} (입력: $${record.inputCost.toFixed(4)}, 출력: $${record.outputCost.toFixed(4)})</div>
                                    </div>
                                </div>
                                <button class="deleteRecordButton px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors" data-index="${index}">
                                    삭제
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        this.bindEvents(allRecords);
    }

    private getUniqueProviders(records: UsageRecord[], providerMap: Record<string, string>): string[] {
        const providers = new Set<string>();
        records.forEach(record => {
            const provider = providerMap[record.url] || record.url;
            providers.add(provider);
        });
        return Array.from(providers).sort();
    }

    private getUniqueModels(records: UsageRecord[]): string[] {
        const models = new Set<string>();
        records.forEach(record => {
            models.add(record.model);
        });
        return Array.from(models).sort();
    }

    private bindEvents(allRecords: UsageRecord[]) {
        // 체크박스 선택
        const checkboxes = this.container.querySelectorAll('.recordCheckbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                const index = parseInt(target.getAttribute('data-index') || '0');
                const record = allRecords[index];
                
                if (target.checked) {
                    this.selectedRecords.add(record);
                } else {
                    this.selectedRecords.delete(record);
                }

                this.updateSelectedCount();
            });
        });

        // 개별 삭제 버튼
        const deleteButtons = this.container.querySelectorAll('.deleteRecordButton');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const index = parseInt(target.getAttribute('data-index') || '0');
                const record = allRecords[index];
                this.deleteRecord(record);
            });
        });

        // 선택 삭제 버튼
        const deleteSelectedButton = this.container.querySelector('#deleteSelectedButton');
        deleteSelectedButton?.addEventListener('click', () => {
            this.deleteSelectedRecords();
        });

        // 전체 삭제 버튼
        const deleteAllButton = this.container.querySelector('#deleteAllButton');
        deleteAllButton?.addEventListener('click', () => {
            this.deleteAllRecords();
        });

        // 필터 적용 버튼
        const applyFilterButton = this.container.querySelector('#applyFilterButton');
        applyFilterButton?.addEventListener('click', () => {
            this.applyFilter();
        });
    }

    private updateSelectedCount() {
        const countSpan = this.container.querySelector('#selectedCount');
        const deleteButton = this.container.querySelector('#deleteSelectedButton') as HTMLButtonElement;
        
        if (countSpan) {
            countSpan.textContent = this.selectedRecords.size.toString();
        }

        if (deleteButton) {
            deleteButton.disabled = this.selectedRecords.size === 0;
        }
    }

    private deleteRecord(record: UsageRecord) {
        const confirmed = confirm('이 레코드를 삭제하시겠습니까?');
        if (!confirmed) return;

        const success = UsageManager.removeRecord(record);
        if (success) {
            this.selectedRecords.clear();
            this.render();
        } else {
            alert('삭제에 실패했습니다.');
        }
    }

    private deleteSelectedRecords() {
        const confirmed = confirm(`선택한 ${this.selectedRecords.size}개의 레코드를 삭제하시겠습니까?`);
        if (!confirmed) return;

        let deletedCount = 0;
        this.selectedRecords.forEach(record => {
            const success = UsageManager.removeRecord(record);
            if (success) deletedCount++;
        });

        alert(`${deletedCount}개의 레코드가 삭제되었습니다.`);
        this.selectedRecords.clear();
        this.render();
    }

    private deleteAllRecords() {
        const allRecords = UsageManager.getRecords([]);
        const confirmed = confirm(`정말로 모든 레코드(${allRecords.length}개)를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`);
        if (!confirmed) return;

        let deletedCount = 0;
        allRecords.forEach(record => {
            const success = UsageManager.removeRecord(record);
            if (success) deletedCount++;
        });

        alert(`${deletedCount}개의 레코드가 삭제되었습니다.`);
        this.selectedRecords.clear();
        this.render();
    }

    private applyFilter() {
        const providerSelect = this.container.querySelector('#filterProvider') as HTMLSelectElement;
        const modelSelect = this.container.querySelector('#filterModel') as HTMLSelectElement;

        const selectedProvider = providerSelect?.value || '';
        const selectedModel = modelSelect?.value || '';

        if (!selectedProvider && !selectedModel) {
            alert('삭제할 필터를 선택해주세요.');
            return;
        }

        const allRecords = UsageManager.getRecords([]);
        const providerMap = ProviderManager.getAllProviders();

        const filteredRecords = allRecords.filter(record => {
            const provider = providerMap[record.url] || record.url;
            const matchProvider = !selectedProvider || provider === selectedProvider;
            const matchModel = !selectedModel || record.model === selectedModel;
            return matchProvider && matchModel;
        });

        if (filteredRecords.length === 0) {
            alert('필터에 해당하는 레코드가 없습니다.');
            return;
        }

        const confirmed = confirm(`필터에 해당하는 ${filteredRecords.length}개의 레코드를 삭제하시겠습니까?\n프로바이더: ${selectedProvider || '전체'}\n모델: ${selectedModel || '전체'}`);
        if (!confirmed) return;

        let deletedCount = 0;
        filteredRecords.forEach(record => {
            const success = UsageManager.removeRecord(record);
            if (success) deletedCount++;
        });

        alert(`${deletedCount}개의 레코드가 삭제되었습니다.`);
        this.render();
    }
}
