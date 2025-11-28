import type { BudgetRule } from '../types';
import { RisuAPI } from '../api';
import { BUDGET_RULE_ARG } from '../plugin';
import { debounce } from '../util';
import { EventManager, PluginEvent } from './event';

export class BudgetManager {
    private static rules: BudgetRule[] = [];
    private static readonly DEBOUNCE_WAIT = 500;
    private static initialized = false;

    static {
        EventManager.on(PluginEvent.GlobalRestore, () => BudgetManager.clear());
        EventManager.on(PluginEvent.GlobalDestroy, () => BudgetManager.clear());
    }

    private static debouncedSave = debounce(() => {
        RisuAPI.setArg(BUDGET_RULE_ARG, JSON.stringify(BudgetManager.rules));
    }, BudgetManager.DEBOUNCE_WAIT);

    private static init() {
        if (this.initialized) {
            return;
        }
        try {
            const storedMap = RisuAPI.getArg(BUDGET_RULE_ARG) as string;
            this.rules = storedMap ? JSON.parse(storedMap) : [];
        } catch (e) {
            this.rules = [];
        }
        this.initialized = true;
    }

    private static ensureInitialized() {
        if (!this.initialized) {
            this.init();
        }
    }

    static async getRules(): Promise<BudgetRule[]> {
        this.ensureInitialized();
        return this.rules;
    }

    static async addRule(rule: Omit<BudgetRule, 'id'>): Promise<BudgetRule> {
        this.ensureInitialized();
        const newRule = { 
            ...rule, 
            id: crypto.randomUUID(),
            model: rule.model || undefined,
            provider: rule.provider || undefined,
            requestType: rule.requestType || undefined,
        };
        this.rules.push(newRule);
        this.debouncedSave();
        EventManager.emit(PluginEvent.BudgetAddRule, newRule);
        return newRule;
    }

    static async updateRule(rule: BudgetRule): Promise<void> {
        this.ensureInitialized();
        const index = this.rules.findIndex(r => r.id === rule.id);
        if (index !== -1) {
            this.rules[index] = rule;
            this.debouncedSave();
            EventManager.emit(PluginEvent.BudgetUpdateRule, rule);
        }
    }

    static async deleteRule(ruleId: string): Promise<void> {
        this.ensureInitialized();
        this.rules = this.rules.filter(r => r.id !== ruleId);
        this.debouncedSave();
        EventManager.emit(PluginEvent.BudgetRemoveRule, ruleId);
    }

    static clear(): void {
        this.debouncedSave.cancel();
        this.initialized = false;
        this.rules = [];
    }
}

