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
    private mainObserver: MutationObserver | null = null;
    private settingBgObserver: MutationObserver | null = null;


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
        
        // 이미 존재하는 setting-bg 처리
        const existingSettingBg = document.querySelector('.setting-bg');
        if (existingSettingBg) {
            this.onSettingBgAdded(existingSettingBg);
        }
    }

    private setupObserver() {
        this.mainObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                // 추가된 노드 처리
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;
                    const element = node as Element;
                    if (element.classList.contains('setting-bg')) {
                        this.onSettingBgAdded(element);
                    }
                }
                // 삭제된 노드 처리
                for (const node of mutation.removedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;
                    const element = node as Element;
                    
                    if (element.classList.contains('setting-bg')) {
                        this.onSettingBgRemoved();
                    }
                }
            }
        });

        // main의 직접 자식만 관찰 (subtree: false)
        const main = document.querySelector('main');
        if (main) {
            this.mainObserver.observe(main, { childList: true });
        }
    }

    private onSettingBgAdded(settingBg: Element) {
        // 이미 타겟이 있으면 바로 추가
        const target = settingBg.querySelector(this.TARGET_SELECTOR);
        if (target) {
            this.tryAddOpenButton(target);
        }

        // setting-bg 내부 관찰 (타겟이 사라졌다 다시 생길 수 있으므로 항상 관찰)
        this.settingBgObserver = new MutationObserver(() => {
            const target = settingBg.querySelector(this.TARGET_SELECTOR);
            const buttonExists = document.getElementById(this.OPEN_BUTTON_ID);
            
            if (target && !buttonExists) {
                this.addOpenButton(target);
            } else if (!target && this.openButtonComponent) {
                // 타겟이 사라지면 버튼 컴포넌트 정리
                this.openButtonComponent.$destroy();
                this.openButtonComponent = null;
            }
        }); 
        
        this.settingBgObserver.observe(settingBg, { 
            childList: true, 
            subtree: true
        });
    }

    private onSettingBgRemoved() {
        // setting-bg observer 정리
        this.settingBgObserver?.disconnect();
        this.settingBgObserver = null;
        
        // 버튼 컴포넌트 정리
        if (this.openButtonComponent) {
            this.openButtonComponent.$destroy();
            this.openButtonComponent = null;
        }
    }

    private tryAddOpenButton(buttonContainer: Element) {
        const openButton = document.getElementById(this.OPEN_BUTTON_ID);
        if (!openButton) {
            this.addOpenButton(buttonContainer);
        }
    }

    dispose() {
        if (this.mainObserver) {
            this.mainObserver.disconnect();
            this.mainObserver = null;
        }
        if (this.settingBgObserver) {
            this.settingBgObserver.disconnect();
            this.settingBgObserver = null;
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
