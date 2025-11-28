import OpenButton from './OpenButton.svelte';
import { Popup } from './popup';
import { WarningIcon } from './warning';

export class UI {
    private readonly OPEN_BUTTON_ID = 'usage-tracker-openbutton';
    private readonly CONTAINER_ID = 'usage-tracker-container';

    private timeout: NodeJS.Timeout | null = null;
    private openButtonComponent: OpenButton | null = null;
    private container: HTMLDivElement | null = null;
    private popupComponent: Popup | null = null;
    private warningIconComponent: WarningIcon | null = null;


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
        const checkAndAdd = () => {
            const buttonContainer = document.querySelector(
                "div.rs-setting-cont-3"
            );
            if (!buttonContainer) {
                this.timeout = window.setTimeout(checkAndAdd, 1000) as any;
                return;
            }

            const openButton = document.getElementById(this.OPEN_BUTTON_ID);
            if (!openButton) {
                this.addOpenButton(buttonContainer);
            }

            this.timeout = window.setTimeout(checkAndAdd, 1000) as any;
        };

        this.timeout = window.setTimeout(checkAndAdd, 1000) as any;
    }

    dispose() {
        if (this.timeout) {
            window.clearTimeout(this.timeout);
            this.timeout = null;
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
