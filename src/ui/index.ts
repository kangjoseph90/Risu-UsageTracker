import OpenButton from './OpenButton.svelte';
import { Popup } from './popup';
import BudgetAlert from './components/BudgetAlert.svelte';

export class UI {
    private readonly OPEN_BUTTON_ID = 'usage-tracker-openbutton';

    private timeout: NodeJS.Timeout | null = null;
    private openButtonComponent: OpenButton | null = null;
    private popupContainer: HTMLDivElement | null = null;
    private popupComponent: Popup | null = null;
    private budgetAlertComponent: BudgetAlert | null = null;


    constructor() {
        this.initialize();
        this.addPopup();
    }

    addPopup() {
        this.popupContainer = document.createElement('div');
        this.popupContainer.id = 'usage-tracker-container';
        document.body.appendChild(this.popupContainer);
        this.popupComponent = new Popup({
            target: this.popupContainer,
        });
        this.budgetAlertComponent = new BudgetAlert({
            target: this.popupContainer,
        });
    }

    removePopup() {
        if (this.popupComponent) {
            this.popupComponent.$destroy();
            this.popupComponent = null;
        }
        if (this.budgetAlertComponent) {
            this.budgetAlertComponent.$destroy();
            this.budgetAlertComponent = null;
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
