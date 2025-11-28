import { writable, derived, type Readable } from 'svelte/store';
import type { BudgetSettings } from '../../types';
import { EventManager, PluginEvent } from '../../manager/event';
import { BudgetMonitor, type ExceededRuleInfo } from '../../manager/budget/monitor';
import { BudgetSettingsManager } from '../../manager/budget/settings';

export interface BudgetWarningState {
    exceededRules: ExceededRuleInfo[];
    maxPercentage: number;
    warningEnabled: boolean;
    threshold: number;
}

function createBudgetWarningStore() {
    const exceededRules = writable<ExceededRuleInfo[]>([]);
    const settings = writable<BudgetSettings>(BudgetSettingsManager.getSettings());

    // Update functions
    const updateExceededRules = () => {
        const currentSettings = BudgetSettingsManager.getSettings();
        if (!currentSettings.warningEnabled) {
            exceededRules.set([]);
            return;
        }
        const rules = BudgetMonitor.getExceededRules(currentSettings.threshold);
        exceededRules.set(rules);
    };

    const updateSettings = () => {
        const currentSettings = BudgetSettingsManager.getSettings();
        settings.set(currentSettings);
        // Also update exceeded rules when settings change
        updateExceededRules();
    };

    // Subscribe to events
    EventManager.on(PluginEvent.BudgetStateChange, updateExceededRules);
    EventManager.on(PluginEvent.BudgetSettingsChange, updateSettings);
    EventManager.on(PluginEvent.GlobalInit, () => {
        updateSettings();
        updateExceededRules();
    });
    EventManager.on(PluginEvent.GlobalRestore, () => {
        updateSettings();
        updateExceededRules();
    });

    // Derived store for maxPercentage
    const maxPercentage: Readable<number> = derived(exceededRules, ($exceededRules) => {
        if ($exceededRules.length === 0) return 0;
        return Math.max(...$exceededRules.map(r => r.percentage));
    });

    // Derived store for warning enabled
    const warningEnabled: Readable<boolean> = derived(settings, ($settings) => $settings.warningEnabled);

    // Derived store for threshold
    const threshold: Readable<number> = derived(settings, ($settings) => $settings.threshold);

    // Derived store for whether to show the warning icon
    const shouldShowWarning: Readable<boolean> = derived(
        [exceededRules, warningEnabled],
        ([$exceededRules, $warningEnabled]) => $warningEnabled && $exceededRules.length > 0
    );

    // Combined state store
    const state: Readable<BudgetWarningState> = derived(
        [exceededRules, maxPercentage, settings],
        ([$exceededRules, $maxPercentage, $settings]) => ({
            exceededRules: $exceededRules,
            maxPercentage: $maxPercentage,
            warningEnabled: $settings.warningEnabled,
            threshold: $settings.threshold,
        })
    );

    return {
        subscribe: state.subscribe,
        exceededRules: { subscribe: exceededRules.subscribe },
        maxPercentage: { subscribe: maxPercentage.subscribe },
        warningEnabled: { subscribe: warningEnabled.subscribe },
        threshold: { subscribe: threshold.subscribe },
        shouldShowWarning: { subscribe: shouldShowWarning.subscribe },
        refresh: updateExceededRules,
        refreshSettings: updateSettings,
    };
}

export const budgetWarningStore = createBudgetWarningStore();
