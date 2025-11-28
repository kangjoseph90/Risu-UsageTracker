import type { BudgetSettings } from '../../types';
import { RisuAPI } from '../../api';
import { BUDGET_SETTINGS_ARG } from '../../plugin';
import { debounce } from '../../util';
import { EventManager, PluginEvent } from '../event';

const DEFAULT_SETTINGS: BudgetSettings = {
    warningEnabled: false,
    threshold: 80,
};

export class BudgetSettingsManager {
    private static settings: BudgetSettings = { ...DEFAULT_SETTINGS };
    private static readonly DEBOUNCE_WAIT = 500;
    private static initialized = false;

    static {
        EventManager.on(PluginEvent.GlobalRestore, () => BudgetSettingsManager.clear());
        EventManager.on(PluginEvent.GlobalDestroy, () => BudgetSettingsManager.clear());
    }

    private static debouncedSave = debounce(() => {
        RisuAPI.setArg(BUDGET_SETTINGS_ARG, JSON.stringify(BudgetSettingsManager.settings));
    }, BudgetSettingsManager.DEBOUNCE_WAIT);

    private static init() {
        if (this.initialized) {
            return;
        }
        try {
            const stored = RisuAPI.getArg(BUDGET_SETTINGS_ARG) as string;
            this.settings = stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : { ...DEFAULT_SETTINGS };
        } catch (e) {
            this.settings = { ...DEFAULT_SETTINGS };
        }
        this.initialized = true;
    }

    private static ensureInitialized() {
        if (!this.initialized) {
            this.init();
        }
    }

    static getSettings(): BudgetSettings {
        this.ensureInitialized();
        return { ...this.settings };
    }

    static isWarningEnabled(): boolean {
        this.ensureInitialized();
        return this.settings.warningEnabled;
    }

    static getThreshold(): number {
        this.ensureInitialized();
        return this.settings.threshold;
    }

    static setWarningEnabled(enabled: boolean): void {
        this.ensureInitialized();
        this.settings.warningEnabled = enabled;
        this.debouncedSave();
        EventManager.emit(PluginEvent.BudgetSettingsChange, this.settings);
    }

    static setThreshold(threshold: number): void {
        this.ensureInitialized();
        this.settings.threshold = Math.max(0, Math.min(100, threshold));
        this.debouncedSave();
        EventManager.emit(PluginEvent.BudgetSettingsChange, this.settings);
    }

    static updateSettings(settings: Partial<BudgetSettings>): void {
        this.ensureInitialized();
        if (settings.warningEnabled !== undefined) {
            this.settings.warningEnabled = settings.warningEnabled;
        }
        if (settings.threshold !== undefined) {
            this.settings.threshold = Math.max(0, Math.min(100, settings.threshold));
        }
        this.debouncedSave();
        EventManager.emit(PluginEvent.BudgetSettingsChange, this.settings);
    }

    static clear(): void {
        this.debouncedSave.cancel();
        this.initialized = false;
        this.settings = { ...DEFAULT_SETTINGS };
    }
}
