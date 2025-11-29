import OpenButton from './OpenButton.svelte';
import { Popup } from './popup';
import { WarningIcon } from './warning';

export class UI {
    private readonly OPEN_BUTTON_ID = 'usage-tracker-openbutton';
    private readonly CONTAINER_ID = 'usage-tracker-container';
    private readonly TARGET_SELECTOR = 'div.rs-setting-cont-3';

    private openButtonComponent: OpenButton | null = null;
    private container: HTMLDivElement | null = null;
    private popupComponent: Popup | null = null;
    private warningIconComponent: WarningIcon | null = null;
    private observer: MutationObserver | null = null;


    constructor() {
        this.initialize();
        this.addContainer();
    }

    addContainer() {
        this.container = document.createElement('div');
        this.container.id = this.CONTAINER_ID;
        document.body.appendChild(this.container);
        
        // Add Popup component
        this.popupComponent = new Popup({
            target: this.container,
        });
        
        // Add WarningIcon component
        this.warningIconComponent = new WarningIcon({
            target: this.container,
        });
    }

    removeContainer() {
        if (this.popupComponent) {
            this.popupComponent.$destroy();
            this.popupComponent = null;
        }
        if (this.warningIconComponent) {
            this.warningIconComponent.$destroy();
            this.warningIconComponent = null;
        }
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }

    initialize() {
        this.dispose();
        this.setupObserver();
        
        // 이미 존재하는 요소 처리
        const existingContainer = document.querySelector(this.TARGET_SELECTOR);
        if (existingContainer) {
            this.tryAddOpenButton(existingContainer);
        }
    }

    private setupObserver() {
        this.observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;
                    const element = node as Element;
                    
                    // setting-bg가 추가되면 그 안에서 타겟 검색
                    if (element.classList.contains('setting-bg')) {
                        const target = element.querySelector(this.TARGET_SELECTOR);
                        if (target) {
                            this.tryAddOpenButton(target);
                        }
                    }
                }
            }
        });

        // main의 직접 자식만 observe (subtree: false)
        const observeTarget = document.querySelector('main') || document.getElementById('app');
        if (observeTarget) {
            this.observer.observe(observeTarget, {
                childList: true,
                subtree: false
            });
        }
    }

    private tryAddOpenButton(buttonContainer: Element) {
        const openButton = document.getElementById(this.OPEN_BUTTON_ID);
        if (!openButton) {
            this.addOpenButton(buttonContainer);
        }
    }

    dispose() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    addOpenButton(buttonContainer: Element) {
        this.openButtonComponent = new OpenButton({
            target: buttonContainer,
            props: {
                id: this.OPEN_BUTTON_ID,
            }
        })
    }

    removeOpenButton() {
        if (this.openButtonComponent) {
            this.openButtonComponent.$destroy();
            this.openButtonComponent = null;
        }
        const openButton = document.getElementById(this.OPEN_BUTTON_ID);
        if (openButton) {
            openButton.remove();
        }
    }

    destroy() {
        this.dispose();
        this.removeOpenButton();
        this.removeContainer();
    }
}
