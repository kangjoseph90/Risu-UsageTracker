import type { BudgetRule } from '../types';
import { RisuAPI } from '../api';
import { BUDGET_RULE_ARG } from '../plugin';
import { debounce } from '../util';
import { EventManager, PluginEvent } from './event';

export class BudgetManager {
    private static rules: BudgetRule[] = [];
    private static readonly DEBOUNCE_WAIT = 500;

    private static debouncedSave = debounce(() => {
        RisuAPI.setArg(BUDGET_RULE_ARG, JSON.stringify(BudgetManager.rules));
    }, BudgetManager.DEBOUNCE_WAIT);

    static async init() {
        try {
            const storedMap = RisuAPI.getArg(BUDGET_RULE_ARG) as string;
            this.rules = storedMap ? JSON.parse(storedMap) : [];
        } catch (e) {
            this.rules = [];
        }
    }

    static async getRules(): Promise<BudgetRule[]> {
        return this.rules;
    }

    static async addRule(rule: Omit<BudgetRule, 'id'>): Promise<BudgetRule> {
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
        const index = this.rules.findIndex(r => r.id === rule.id);
        if (index !== -1) {
            this.rules[index] = rule;
            this.debouncedSave();
            EventManager.emit(PluginEvent.BudgetUpdateRule, rule);
        }
    }

    static async deleteRule(ruleId: string): Promise<void> {
        this.rules = this.rules.filter(r => r.id !== ruleId);
        this.debouncedSave();
        EventManager.emit(PluginEvent.BudgetRemoveRule, ruleId);
    }
}

