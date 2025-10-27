import { ProviderManager } from "../manager/provider";

/**
 * ProviderUI: URL → Provider 매핑 관리 UI
 */
export class ProviderUI {
    private container: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    render() {
        const providerMap = ProviderManager.getAllProviders();
        const entries = Object.entries(providerMap);

        this.container.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h3 class="text-xl font-semibold text-zinc-100">URL → Provider 매핑</h3>
                    <button id="addMappingButton" class="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors">
                        + 매핑 추가
                    </button>
                </div>

                <div class="text-sm text-zinc-400">
                    <p>각 URL에 대한 프로바이더 이름을 관리합니다.</p>
                    <p>프로바이더 이름을 변경하면 해당 URL의 모든 레코드가 영향을 받습니다.</p>
                </div>

                <div class="space-y-2 max-h-96 overflow-y-auto">
                    ${entries.length === 0 ? `
                        <div class="text-center text-zinc-500 py-8">
                            등록된 매핑이 없습니다.
                        </div>
                    ` : entries.map(([url, provider], index) => `
                        <div class="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg">
                            <div class="flex-1 min-w-0">
                                <div class="text-xs text-zinc-400 truncate" title="${url}">URL: ${url}</div>
                                <div class="text-sm text-zinc-200 font-medium">Provider: ${provider}</div>
                            </div>
                            <button class="editMappingButton px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded transition-colors" data-url="${url}" data-provider="${provider}">
                                수정
                            </button>
                            <button class="deleteMappingButton px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors" data-url="${url}">
                                삭제
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.bindEvents();
    }

    private bindEvents() {
        // 매핑 추가 버튼
        const addButton = this.container.querySelector('#addMappingButton');
        addButton?.addEventListener('click', () => {
            this.showAddMappingDialog();
        });

        // 수정 버튼들
        const editButtons = this.container.querySelectorAll('.editMappingButton');
        editButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const url = target.getAttribute('data-url');
                const provider = target.getAttribute('data-provider');
                if (url && provider) {
                    this.showEditMappingDialog(url, provider);
                }
            });
        });

        // 삭제 버튼들
        const deleteButtons = this.container.querySelectorAll('.deleteMappingButton');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const url = target.getAttribute('data-url');
                if (url) {
                    this.deleteMapping(url);
                }
            });
        });
    }

    private showAddMappingDialog() {
        const url = prompt('URL을 입력하세요:');
        if (!url) return;

        const provider = prompt('Provider 이름을 입력하세요:');
        if (!provider) return;

        ProviderManager.setProvider(url, provider);
        this.render();
    }

    private showEditMappingDialog(url: string, currentProvider: string) {
        const newProvider = prompt(`Provider 이름을 수정하세요 (현재: ${currentProvider}):`, currentProvider);
        if (!newProvider || newProvider === currentProvider) return;

        ProviderManager.setProvider(url, newProvider);
        this.render();
    }

    private deleteMapping(url: string) {
        const confirmed = confirm(`이 매핑을 삭제하시겠습니까?\nURL: ${url}`);
        if (!confirmed) return;

        const success = ProviderManager.removeProvider(url);
        if (success) {
            this.render();
        } else {
            alert('삭제에 실패했습니다.');
        }
    }
}
