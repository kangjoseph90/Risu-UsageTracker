import OpenButton from './OpenButton.svelte';
import { Popup } from './popup';

// Mock UI for dev mode
export class UI {
    private readonly OPEN_BUTTON_ID = 'usage-tracker-openbutton';

    private timeout: NodeJS.Timeout | null = null;
    private openButtonComponent: OpenButton | null = null;
    private popupContainer: HTMLDivElement | null = null;
    private popupComponent: Popup | null = null;


    constructor() {
        // Check if dev mode
        if (typeof (globalThis as any).risuFetch === 'undefined') {
            this.initDevMode();
        } else {
            this.initialize();
            this.addPopup();
        }
    }

    // Direct initialization for development environment without RisuAI UI structure
    initDevMode() {
        const app = document.querySelector('#app');
        if (app) {
            // In dev mode, mount the Popup directly to #app and ensure it's open
            this.popupContainer = document.createElement('div');
            this.popupContainer.id = 'usage-tracker-container';
            app.appendChild(this.popupContainer);
            this.popupComponent = new Popup({
                target: this.popupContainer,
            });
            // Force open the popup in dev mode
            // We might need to expose a method in Popup to open it,
            // or trigger the event.
            // Looking at Popup implementation might help.
        }
    }

    addPopup() {
        this.popupContainer = document.createElement('div');
        this.popupContainer.id = 'usage-tracker-container';
        document.body.appendChild(this.popupContainer);
        this.popupComponent = new Popup({
            target: this.popupContainer,
        });
    }

    removePopup() {
        if (this.popupComponent) {
            this.popupComponent.$destroy();
            this.popupComponent = null;
        }
        if (this.popupContainer) {
            this.popupContainer.remove();
            this.popupContainer = null;
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
        this.removePopup();
    }
}
