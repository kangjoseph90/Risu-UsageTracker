import { PLUGIN_NAME } from "../consts";
import { UsageUI } from "./usage";
import { PriceUI } from "./price";
import { PriceManager } from "../manager/price";

export class RootUI {
    private ROOT_ID = 'UsageTracker-RootUI';
    private MODAL_ID = `${this.ROOT_ID}-modal`;
    private OPEN_BUTTON_ID = `${this.ROOT_ID}-openButton`;
    private USAGE_BUTTON_ID = `${this.ROOT_ID}-usageButton`;
    private PRICE_BUTTON_ID = `${this.ROOT_ID}-priceButton`;
    private CLOSE_BUTTON_ID = `${this.ROOT_ID}-closeButton`;
    private BODY_CONTAINER_ID = `${this.ROOT_ID}-bodyContainer`;

    private timeout: NodeJS.Timeout | null = null;
    private currentTab: 'usage' | 'price' = 'usage';

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
                                사용량 통계
                            </button>
                            <button id="${this.PRICE_BUTTON_ID}" class="px-3 py-2 rounded-lg text-zinc-200 transition-colors text-sm font-medium hover:text-zinc-100 flex items-center gap-1" title="가격 정보">
                                <span>가격 정보</span>
                                <span class="price-warning-icon hidden text-yellow-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                                        <line x1="12" y1="9" x2="12" y2="13"/>
                                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                                    </svg>
                                </span>
                            </button>
                            <button id="${this.CLOSE_BUTTON_ID}" class="p-2 text-zinc-200 hover:text-white transition-colors" title="닫기">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
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
        usageButton?.classList.add('hover:bg-zinc-700');
        
        priceButton?.classList.remove('bg-zinc-800');
        priceButton?.classList.remove('hover:bg-zinc-700');
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
        priceButton?.classList.add('hover:bg-zinc-700');
        
        usageButton?.classList.remove('bg-zinc-800');
        usageButton?.classList.remove('hover:bg-zinc-700');
        usageButton?.classList.add('hover:text-zinc-100');

        // PriceUI 렌더링
        const priceUI = new PriceUI(bodyContainer, () => {
            // PriceUI에서 가격 변경 시 경고 아이콘 업데이트
            this.updatePriceWarningIcon(modal);
        });
        priceUI.render();
    }

    /**
     * 이벤트 바인딩
     */
    private bindEvents(modal: HTMLElement) {
        const closeButton = modal.querySelector(`#${this.CLOSE_BUTTON_ID}`);
        const usageButton = modal.querySelector(`#${this.USAGE_BUTTON_ID}`);
        const priceButton = modal.querySelector(`#${this.PRICE_BUTTON_ID}`);

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