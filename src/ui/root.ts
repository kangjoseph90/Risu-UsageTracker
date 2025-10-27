import { PLUGIN_NAME } from "../plugin";
import { UsageUI } from "./usage";
import { PriceUI } from "./price";
import { ProviderUI } from "./provider";
import { RecordUI } from "./record";
import { PriceManager } from "../manager/price";
import { BackupManager } from "../manager/backup";

export class RootUI {
    private ROOT_ID = 'UsageTracker-RootUI';
    private MODAL_ID = `${this.ROOT_ID}-modal`;
    private OPEN_BUTTON_ID = `${this.ROOT_ID}-openButton`;
    private USAGE_BUTTON_ID = `${this.ROOT_ID}-usageButton`;
    private PRICE_BUTTON_ID = `${this.ROOT_ID}-priceButton`;
    private SETTINGS_BUTTON_ID = `${this.ROOT_ID}-settingsButton`;
    private SETTINGS_SECTION_ID = `${this.ROOT_ID}-settingsSection`;
    private BACKUP_BUTTON_ID = `${this.ROOT_ID}-backupButton`;
    private RESTORE_BUTTON_ID = `${this.ROOT_ID}-restoreButton`;
    private PROVIDER_MAP_BUTTON_ID = `${this.ROOT_ID}-providerMapButton`;
    private RECORD_MANAGE_BUTTON_ID = `${this.ROOT_ID}-recordManageButton`;
    private CLOSE_BUTTON_ID = `${this.ROOT_ID}-closeButton`;
    private BODY_CONTAINER_ID = `${this.ROOT_ID}-bodyContainer`;

    private timeout: NodeJS.Timeout | null = null;
    private currentTab: 'usage' | 'price' | 'provider' | 'record' = 'usage';
    private settingsExpanded: boolean = false;

    constructor() {
        this.initialize();
    }

    /**
     * RootUI 초기화: open 버튼을 DOM에 추가하고 이벤트 바인딩
     */
    initialize() {
        this.dispose();
        const checkAndAdd = () => {
            const lastButton = document.querySelector(
                "div.rs-setting-cont-3 > button:last-child"
            );
            if (!lastButton) {
                this.timeout = window.setTimeout(checkAndAdd, 1000) as any;
                return;
            }

            const openButton = document.getElementById(this.OPEN_BUTTON_ID);
            if (!openButton) {
                this.addOpenButton(lastButton);
            }

            this.timeout = window.setTimeout(checkAndAdd, 1000) as any;
        };

        this.timeout = window.setTimeout(checkAndAdd, 1000) as any;
    }

    /**
     * RootUI 정리
     */
    dispose() {
        if (this.timeout) {
            window.clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    /**
     * Open 버튼을 rs-setting-cont-3의 마지막 원소로 추가
     */
    private addOpenButton(lastButton: Element) {
        const button = document.createElement('button');
        button.id = this.OPEN_BUTTON_ID;
        button.className = 'flex gap-2 items-center hover:text-textcolor text-textcolor2';

        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon lucide lucide-bar-chart-3">
                <path d="M3 3v18h18"/><rect x="7" y="10" width="2" height="11" fill="currentColor"/><rect x="13" y="4" width="2" height="17" fill="currentColor"/><rect x="19" y="8" width="2" height="13" fill="currentColor"/>
            </svg>
            <span>사용량</span>
        `;

        button.addEventListener('click', () => {
            this.showModal();
        });

        lastButton.parentNode?.insertBefore(button, lastButton.nextSibling);
    }

    /**
     * 임시 가격이 존재하는지 확인
     */
    private checkHasTempPrice(): boolean {
        const tempPrices = PriceManager.getTemporaryPrice();
        return Object.keys(tempPrices).length > 0;
    }

    /**
     * open 버튼을 DOM에서 제거
     */
    removeOpenButton() {
        const openButton = document.getElementById(this.OPEN_BUTTON_ID);
        if (openButton && openButton.parentNode) {
            openButton.parentNode.removeChild(openButton);
        }
    }

    /**
     * 메인 모달 표시
     */
    showModal() {
        const modal = document.createElement('div');
        modal.id = this.MODAL_ID;
        modal.className = 'fixed inset-0 z-50 p-1 sm:p-2 bg-black/50';
        modal.tabIndex = -1;

        modal.innerHTML = `
            <div class="flex justify-center w-full h-full">
                <div class="flex flex-col p-3 sm:p-6 rounded-lg bg-zinc-900 w-full max-w-4xl h-full">
                    <!-- Header -->
                    <div class="flex justify-between items-center w-full mb-4 flex-shrink-0">
                        <h2 class="text-lg sm:text-2xl font-semibold text-zinc-100">${PLUGIN_NAME}</h2>
                        <div class="flex items-center gap-2">
                            <button id="${this.USAGE_BUTTON_ID}" class="px-3 py-2 rounded-lg bg-zinc-800 text-zinc-200 transition-colors text-sm font-medium hover:bg-zinc-700" title="사용량 통계">
                                사용량
                            </button>
                            <button id="${this.PRICE_BUTTON_ID}" class="px-3 py-2 rounded-lg text-zinc-200 transition-colors text-sm font-medium hover:text-zinc-100 hover:bg-zinc-700 flex items-center gap-1" title="가격 정보">
                                <span>가격</span>
                                <span class="price-warning-icon hidden text-yellow-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                                        <line x1="12" y1="9" x2="12" y2="13"/>
                                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                                    </svg>
                                </span>
                            </button>
                            <button id="${this.SETTINGS_BUTTON_ID}" class="p-2 text-zinc-200 hover:text-white transition-colors" title="설정">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            </button>
                            <button id="${this.CLOSE_BUTTON_ID}" class="p-2 text-zinc-200 hover:text-white transition-colors" title="닫기">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Settings Section (Collapsible) -->
                    <div id="${this.SETTINGS_SECTION_ID}" class="flex-shrink-0 overflow-hidden transition-all duration-300" style="max-height: 0;">
                        <div class="px-4 pb-4">
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <button id="${this.BACKUP_BUTTON_ID}" class="flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition-colors text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                    <span>백업</span>
                                </button>
                                <button id="${this.RESTORE_BUTTON_ID}" class="flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition-colors text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                    <span>복구</span>
                                </button>
                                <button id="${this.PROVIDER_MAP_BUTTON_ID}" class="flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition-colors text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/><path d="M12 3v18"/>
                                    </svg>
                                    <span>매핑</span>
                                </button>
                                <button id="${this.RECORD_MANAGE_BUTTON_ID}" class="flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition-colors text-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>
                                    </svg>
                                    <span>레코드</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Body Container -->
                    <div id="${this.BODY_CONTAINER_ID}" class="flex-1 overflow-y-auto min-h-0">
                        <div class="text-center text-zinc-400 py-8">
                            로딩 중...
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents(modal);
        document.body.appendChild(modal);

        // 임시 가격 경고 아이콘 표시
        this.updatePriceWarningIcon(modal);

        // 기본으로 사용량 통계 표시
        this.showUsageUI();
    }

    /**
     * 가격 정보 버튼의 경고 아이콘 업데이트
     */
    private updatePriceWarningIcon(modal: HTMLElement) {
        const warningIcon = modal.querySelector('.price-warning-icon');
        if (warningIcon) {
            if (this.checkHasTempPrice()) {
                warningIcon.classList.remove('hidden');
            } else {
                warningIcon.classList.add('hidden');
            }
        }
    }

    /**
     * UsageUI 표시
     */
    private showUsageUI() {
        const modal = document.getElementById(this.MODAL_ID);
        if (!modal) return;

        const usageButton = modal.querySelector(`#${this.USAGE_BUTTON_ID}`) as HTMLButtonElement;
        const priceButton = modal.querySelector(`#${this.PRICE_BUTTON_ID}`) as HTMLButtonElement;
        const bodyContainer = modal.querySelector(`#${this.BODY_CONTAINER_ID}`) as HTMLElement;

        if (!bodyContainer) return;

        this.currentTab = 'usage';

        // 버튼 상태 업데이트
        usageButton?.classList.add('bg-zinc-800');
        usageButton?.classList.remove('hover:text-zinc-100');
        
        priceButton?.classList.remove('bg-zinc-800');
        priceButton?.classList.add('hover:text-zinc-100');

        // UsageUI 렌더링
        const usageUI = new UsageUI(bodyContainer);
        usageUI.render();
    }

    /**
     * PriceUI 표시
     */
    private showPriceUI() {
        const modal = document.getElementById(this.MODAL_ID);
        if (!modal) return;

        const usageButton = modal.querySelector(`#${this.USAGE_BUTTON_ID}`) as HTMLButtonElement;
        const priceButton = modal.querySelector(`#${this.PRICE_BUTTON_ID}`) as HTMLButtonElement;
        const bodyContainer = modal.querySelector(`#${this.BODY_CONTAINER_ID}`) as HTMLElement;

        if (!bodyContainer) return;

        this.currentTab = 'price';

        // 버튼 상태 업데이트
        priceButton?.classList.add('bg-zinc-800');
        priceButton?.classList.remove('hover:text-zinc-100');
        
        usageButton?.classList.remove('bg-zinc-800');
        usageButton?.classList.add('hover:text-zinc-100');

        // PriceUI 렌더링
        const priceUI = new PriceUI(bodyContainer, () => {
            // PriceUI에서 가격 변경 시 경고 아이콘 업데이트
            this.updatePriceWarningIcon(modal);
        });
        priceUI.render();
    }

    /**
     * ProviderUI 표시
     */
    private showProviderUI() {
        const modal = document.getElementById(this.MODAL_ID);
        if (!modal) return;

        const usageButton = modal.querySelector(`#${this.USAGE_BUTTON_ID}`) as HTMLButtonElement;
        const priceButton = modal.querySelector(`#${this.PRICE_BUTTON_ID}`) as HTMLButtonElement;
        const bodyContainer = modal.querySelector(`#${this.BODY_CONTAINER_ID}`) as HTMLElement;
        if (!bodyContainer) return;

        this.currentTab = 'provider';

        usageButton?.classList.remove('bg-zinc-800');
        priceButton?.classList.remove('bg-zinc-800');

        // ProviderUI 렌더링
        const providerUI = new ProviderUI(bodyContainer);
        providerUI.render();
    }

    /**
     * RecordUI 표시
     */
    private showRecordUI() {
        const modal = document.getElementById(this.MODAL_ID);
        if (!modal) return;

        const usageButton = modal.querySelector(`#${this.USAGE_BUTTON_ID}`) as HTMLButtonElement;
        const priceButton = modal.querySelector(`#${this.PRICE_BUTTON_ID}`) as HTMLButtonElement;
        const bodyContainer = modal.querySelector(`#${this.BODY_CONTAINER_ID}`) as HTMLElement;
        if (!bodyContainer) return;

        this.currentTab = 'record';

        usageButton?.classList.remove('bg-zinc-800');
        priceButton?.classList.remove('bg-zinc-800');

        // RecordUI 렌더링
        const recordUI = new RecordUI(bodyContainer);
        recordUI.render();
    }

    /**
     * 이벤트 바인딩
     */
    private bindEvents(modal: HTMLElement) {
        const closeButton = modal.querySelector(`#${this.CLOSE_BUTTON_ID}`);
        const usageButton = modal.querySelector(`#${this.USAGE_BUTTON_ID}`);
        const priceButton = modal.querySelector(`#${this.PRICE_BUTTON_ID}`);
        const settingsButton = modal.querySelector(`#${this.SETTINGS_BUTTON_ID}`);
        const backupButton = modal.querySelector(`#${this.BACKUP_BUTTON_ID}`);
        const restoreButton = modal.querySelector(`#${this.RESTORE_BUTTON_ID}`);
        const providerMapButton = modal.querySelector(`#${this.PROVIDER_MAP_BUTTON_ID}`);
        const recordManageButton = modal.querySelector(`#${this.RECORD_MANAGE_BUTTON_ID}`);

        // ESC 키로 닫기
        modal.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });

        // 닫기 버튼
        closeButton?.addEventListener('click', () => {
            modal.remove();
        });

        // 배경 클릭으로 닫기
        modal.addEventListener('click', (e: MouseEvent) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // 사용량 버튼
        usageButton?.addEventListener('click', () => {
            this.showUsageUI();
        });

        // 가격 버튼
        priceButton?.addEventListener('click', () => {
            this.showPriceUI();
        });

        // 설정 버튼 (토글)
        settingsButton?.addEventListener('click', () => {
            this.toggleSettings();
        });

        // 백업 버튼
        backupButton?.addEventListener('click', async () => {
            const confirmed = confirm('현재 모든 데이터를 백업하시겠습니까?');
            if (confirmed) {
                const success = await BackupManager.backup();
                if (success) {
                    alert('백업이 완료되었습니다.');
                } else {
                    alert('백업에 실패했습니다.');
                }
            }
        });

        // 복구 버튼
        restoreButton?.addEventListener('click', async () => {
            const confirmed = confirm('백업된 데이터로 복구하시겠습니까?\n현재 데이터가 덮어씌워집니다.');
            if (confirmed) {
                const success = await BackupManager.restore();
                if (success) {
                    alert('복구가 완료되었습니다.');
                    // RootUI 새로고침
                    this.refreshModal();
                } else {
                    alert('복구된 백업 데이터가 없습니다.');
                }
            }
        });

        // 프로바이더 매핑 버튼
        providerMapButton?.addEventListener('click', () => {
            this.showProviderUI();
        });

        // 레코드 관리 버튼
        recordManageButton?.addEventListener('click', () => {
            this.showRecordUI();
        });
    }

    /**
     * 설정 섹션 토글
     */
    private toggleSettings() {
        const settingsSection = document.getElementById(this.SETTINGS_SECTION_ID);
        if (!settingsSection) return;

        this.settingsExpanded = !this.settingsExpanded;

        if (this.settingsExpanded) {
            settingsSection.style.maxHeight = '200px';
        } else {
            settingsSection.style.maxHeight = '0';
        }
    }

    /**
     * 모달 새로고침
     */
    private refreshModal() {
        this.closeModal();
        this.showModal();
    }

    /**
     * 모달 닫기
     */
    closeModal() {
        const modal = document.getElementById(this.MODAL_ID);
        if (modal) {
            modal.remove();
        }
    }

    destroy() {
        this.closeModal();
        this.dispose();
        this.removeOpenButton();
    }
}