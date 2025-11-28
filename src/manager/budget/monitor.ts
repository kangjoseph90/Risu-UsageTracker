import type { BudgetRule, UsageRecord } from '../../types';
import { BudgetPeriod } from '../../types';
import { EventManager, PluginEvent } from '../event';
import { UsageManager } from '../usage';
import { BudgetManager } from './rule';
import { BudgetSettingsManager } from './settings';
import { ProviderManager } from '../provider';
import { Logger } from '../../logger';

interface RuleState {
    ruleId: string;
    records: UsageRecord[];  // sorted by timestamp ascending (oldest first)
    currentUsage: number;    // current total cost in the time window
    timer: number | null;    // timer ID for the next dequeue
}

export interface ExceededRuleInfo {
    rule: BudgetRule;
    usage: number;
    percentage: number;
}

export class BudgetMonitor {
    private static ruleStates: Map<string, RuleState> = new Map();
    private static initialized = false;

    static {
        // Initialize on GlobalInit or GlobalRestore
        EventManager.on(PluginEvent.GlobalInit, () => BudgetMonitor.initialize());
        EventManager.on(PluginEvent.GlobalRestore, () => BudgetMonitor.initialize());
        EventManager.on(PluginEvent.GlobalDestroy, () => BudgetMonitor.clear());

        // React to usage events
        EventManager.on(PluginEvent.UsageAddRecord, (record: UsageRecord) => BudgetMonitor.onUsageAdd(record));
        EventManager.on(PluginEvent.UsageUpdateRecord, () => BudgetMonitor.onUsageUpdate());
        EventManager.on(PluginEvent.UsageRemoveRecord, (record: UsageRecord) => BudgetMonitor.onUsageRemove(record));

        // React to budget rule events
        EventManager.on(PluginEvent.BudgetAddRule, (rule: BudgetRule) => BudgetMonitor.onRuleAdd(rule));
        EventManager.on(PluginEvent.BudgetUpdateRule, (rule: BudgetRule) => BudgetMonitor.onRuleUpdate(rule));
        EventManager.on(PluginEvent.BudgetRemoveRule, (ruleId: string) => BudgetMonitor.onRuleRemove(ruleId));
    }

    /**
     * Initialize the monitor by loading all rules and their corresponding records
     */
    public static initialize(): void {
        this.clearInternal();
        
        const rules = BudgetManager.getRules();
        for (const rule of rules) {
            this.initializeRuleState(rule);
        }
        
        this.initialized = true;
        Logger.debug('BudgetMonitor initialized with', rules.length, 'rules');
    }

    /**
     * Ensure initialized before accessing data
     */
    private static ensureInitialized(): void {
        if (!this.initialized) {
            this.initialize();
        }
    }

    /**
     * Get the current usage for a specific rule
     */
    public static getUsage(ruleId: string): number {
        const state = this.ruleStates.get(ruleId);
        return state ? state.currentUsage : 0;
    }

    /**
     * Get the usage percentage for a specific rule (0-100+)
     */
    public static getUsagePercentage(ruleId: string): number {
        const rules = BudgetManager.getRules();
        const rule = rules.find(r => r.id === ruleId);
        if (!rule) return 0;
        
        const usage = this.getUsage(ruleId);
        return (usage / rule.limit) * 100;
    }

    /**
     * Check if a rule has exceeded its budget
     */
    public static isOverBudget(ruleId: string): boolean {
        return this.getUsagePercentage(ruleId) >= 100;
    }

    /**
     * Get all rule states (for UI display)
     */
    public static getAllStates(): Map<string, { currentUsage: number; recordCount: number }> {
        const result = new Map<string, { currentUsage: number; recordCount: number }>();
        this.ruleStates.forEach((state, ruleId) => {
            result.set(ruleId, {
                currentUsage: state.currentUsage,
                recordCount: state.records.length
            });
        });
        return result;
    }

    /**
     * Get rules that exceed the given threshold percentage
     */
    public static getExceededRules(threshold?: number): ExceededRuleInfo[] {
        this.ensureInitialized();
        
        const effectiveThreshold = threshold ?? BudgetSettingsManager.getThreshold();
        const rules = BudgetManager.getRules();
        const exceededRules: ExceededRuleInfo[] = [];

        for (const rule of rules) {
            const usage = this.getUsage(rule.id);
            const percentage = (usage / rule.limit) * 100;

            if (percentage >= effectiveThreshold) {
                exceededRules.push({
                    rule,
                    usage,
                    percentage,
                });
            }
        }

        // Sort by percentage descending (highest first)
        return exceededRules.sort((a, b) => b.percentage - a.percentage);
    }

    /**
     * Get all rules with their current usage
     */
    public static getAllRulesWithUsage(): ExceededRuleInfo[] {
        this.ensureInitialized();
        
        const rules = BudgetManager.getRules();
        const result: ExceededRuleInfo[] = [];

        for (const rule of rules) {
            const usage = this.getUsage(rule.id);
            const percentage = (usage / rule.limit) * 100;
            result.push({ rule, usage, percentage });
        }

        return result;
    }

    /**
     * Emit state change event (called when usage changes)
     */
    private static emitStateChange(): void {
        EventManager.emit(PluginEvent.BudgetStateChange);
    }

    /**
     * Initialize state for a single rule
     */
    private static initializeRuleState(rule: BudgetRule): void {
        const timeRange = this.getTimeRange(rule.period);
        const records = this.getMatchingRecords(rule, timeRange);
        
        // Sort records by timestamp ascending (oldest first)
        records.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        // Calculate current usage
        const currentUsage = records.reduce((sum, r) => sum + r.totalCost, 0);
        
        const state: RuleState = {
            ruleId: rule.id,
            records,
            currentUsage,
            timer: null
        };
        
        this.ruleStates.set(rule.id, state);
        
        // Set up timer for the oldest record
        this.scheduleNextDequeue(rule.id, rule.period);
        
        Logger.debug(`Rule "${rule.name}" initialized: ${records.length} records, $${currentUsage.toFixed(4)} usage`);
    }

    /**
     * Get the time range for a budget period
     */
    private static getTimeRange(period: BudgetPeriod): { start: Date; end: Date } {
        const now = new Date();
        const start = new Date(now);
        
        switch (period) {
            case BudgetPeriod.Daily:
                start.setTime(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case BudgetPeriod.Weekly:
                start.setTime(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case BudgetPeriod.Monthly:
                start.setTime(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
        }
        
        return { start, end: now };
    }

    /**
     * Get the period duration in milliseconds
     */
    private static getPeriodMs(period: BudgetPeriod): number {
        switch (period) {
            case BudgetPeriod.Daily:
                return 24 * 60 * 60 * 1000;
            case BudgetPeriod.Weekly:
                return 7 * 24 * 60 * 60 * 1000;
            case BudgetPeriod.Monthly:
                return 30 * 24 * 60 * 60 * 1000;
        }
    }

    /**
     * Get records matching a rule's filters within a time range
     */
    private static getMatchingRecords(rule: BudgetRule, timeRange: { start: Date; end: Date }): UsageRecord[] {
        const filters = this.buildFilters(rule, timeRange);
        return UsageManager.getRecords(filters);
    }

    /**
     * Build filter functions for a rule
     */
    private static buildFilters(rule: BudgetRule, timeRange: { start: Date; end: Date }): ((record: UsageRecord) => boolean)[] {
        const filters: ((record: UsageRecord) => boolean)[] = [];
        
        // Time range filter
        filters.push((record) => {
            const recordTime = new Date(record.timestamp).getTime();
            return recordTime >= timeRange.start.getTime() && recordTime <= timeRange.end.getTime();
        });
        
        // Model filter
        if (rule.model) {
            filters.push((record) => record.model === rule.model);
        }
        
        // Provider filter
        if (rule.provider) {
            filters.push((record) => ProviderManager.getProvider(record.url) === rule.provider);
        }
        
        // Request type filter
        if (rule.requestType) {
            filters.push((record) => record.requestType === rule.requestType);
        }
        
        return filters;
    }

    /**
     * Check if a record matches a rule's filters (without time range)
     */
    private static recordMatchesRule(record: UsageRecord, rule: BudgetRule): boolean {
        if (rule.model && record.model !== rule.model) {
            return false;
        }
        if (rule.provider && ProviderManager.getProvider(record.url) !== rule.provider) {
            return false;
        }
        if (rule.requestType && record.requestType !== rule.requestType) {
            return false;
        }
        return true;
    }

    /**
     * Schedule the next dequeue operation for a rule
     */
    private static scheduleNextDequeue(ruleId: string, period: BudgetPeriod): void {
        const state = this.ruleStates.get(ruleId);
        if (!state) return;
        
        // Clear existing timer
        if (state.timer !== null) {
            clearTimeout(state.timer);
            state.timer = null;
        }
        
        // If no records, nothing to schedule
        if (state.records.length === 0) return;
        
        // Get the oldest record
        const oldestRecord = state.records[0];
        const recordTime = new Date(oldestRecord.timestamp).getTime();
        const periodMs = this.getPeriodMs(period);
        
        // Calculate when this record should be dequeued
        // Record should be dequeued when: now - recordTime >= periodMs
        // So dequeue at: recordTime + periodMs
        const dequeueTime = recordTime + periodMs;
        const now = Date.now();
        const delay = Math.max(0, dequeueTime - now);
        
        // Set up timer
        state.timer = window.setTimeout(() => {
            this.dequeueOldestRecord(ruleId, period);
        }, delay);
        
        Logger.debug(`Scheduled dequeue for rule ${ruleId} in ${Math.round(delay / 1000)}s`);
    }

    /**
     * Dequeue the oldest record from a rule's queue
     */
    private static dequeueOldestRecord(ruleId: string, period: BudgetPeriod): void {
        const state = this.ruleStates.get(ruleId);
        if (!state || state.records.length === 0) return;
        
        const now = Date.now();
        const periodMs = this.getPeriodMs(period);
        
        // Dequeue all records that are now outside the time window
        while (state.records.length > 0) {
            const oldestRecord = state.records[0];
            const recordTime = new Date(oldestRecord.timestamp).getTime();
            
            if (now - recordTime >= periodMs) {
                // This record is outside the window, remove it
                state.records.shift();
                state.currentUsage -= oldestRecord.totalCost;
                Logger.debug(`Dequeued record from rule ${ruleId}, new usage: $${state.currentUsage.toFixed(4)}`);
            } else {
                // This record is still within the window
                break;
            }
        }
        
        // Ensure usage doesn't go negative due to floating point errors
        if (state.currentUsage < 0) {
            state.currentUsage = 0;
        }
        
        // Emit state change
        this.emitStateChange();
        
        // Schedule next dequeue
        this.scheduleNextDequeue(ruleId, period);
    }

    /**
     * Handle UsageAddRecord event
     */
    private static onUsageAdd(record: UsageRecord): void {
        if (!this.initialized) return;
        
        const rules = BudgetManager.getRules();
        
        for (const rule of rules) {
            // Check if record matches rule filters
            if (!this.recordMatchesRule(record, rule)) {
                continue;
            }
            
            // Check if record is within time range
            const timeRange = this.getTimeRange(rule.period);
            const recordTime = new Date(record.timestamp).getTime();
            if (recordTime < timeRange.start.getTime() || recordTime > timeRange.end.getTime()) {
                continue;
            }
            
            const state = this.ruleStates.get(rule.id);
            if (!state) continue;
            
            // Insert record in sorted order (by timestamp ascending)
            const insertIndex = state.records.findIndex(
                r => new Date(r.timestamp).getTime() > recordTime
            );
            
            if (insertIndex === -1) {
                state.records.push(record);
            } else {
                state.records.splice(insertIndex, 0, record);
            }
            
            state.currentUsage += record.totalCost;
            
            Logger.debug(`Added record to rule "${rule.name}", new usage: $${state.currentUsage.toFixed(4)}`);
            
            // Reschedule timer if this is now the oldest record
            if (insertIndex === 0 || state.records.length === 1) {
                this.scheduleNextDequeue(rule.id, rule.period);
            }
        }
        
        // Emit state change
        this.emitStateChange();
    }

    /**
     * Handle UsageUpdateRecord event (prices changed, need to recalculate)
     */
    private static onUsageUpdate(): void {
        if (!this.initialized) return;
        
        // Reinitialize all rule states since costs may have changed
        this.initialize();
        
        // Emit state change
        this.emitStateChange();
    }

    /**
     * Handle UsageRemoveRecord event
     */
    private static onUsageRemove(record: UsageRecord): void {
        if (!this.initialized) return;
        
        const rules = BudgetManager.getRules();
        
        for (const rule of rules) {
            const state = this.ruleStates.get(rule.id);
            if (!state) continue;
            
            // Find and remove the record
            const index = state.records.findIndex(r =>
                r.timestamp === record.timestamp &&
                r.model === record.model &&
                r.url === record.url
            );
            
            if (index !== -1) {
                const removedRecord = state.records.splice(index, 1)[0];
                state.currentUsage -= removedRecord.totalCost;
                
                // Ensure usage doesn't go negative
                if (state.currentUsage < 0) {
                    state.currentUsage = 0;
                }
                
                Logger.debug(`Removed record from rule "${rule.name}", new usage: $${state.currentUsage.toFixed(4)}`);
                
                // Reschedule timer if the oldest record was removed
                if (index === 0) {
                    this.scheduleNextDequeue(rule.id, rule.period);
                }
            }
        }
        
        // Emit state change
        this.emitStateChange();
    }

    /**
     * Handle BudgetAddRule event
     */
    private static onRuleAdd(rule: BudgetRule): void {
        if (!this.initialized) return;
        
        this.initializeRuleState(rule);
        
        // Emit state change
        this.emitStateChange();
    }

    /**
     * Handle BudgetUpdateRule event
     */
    private static onRuleUpdate(rule: BudgetRule): void {
        if (!this.initialized) return;
        
        // Remove old state
        this.onRuleRemove(rule.id);
        
        // Reinitialize with new rule settings
        this.initializeRuleState(rule);
        
        // Emit state change
        this.emitStateChange();
    }

    /**
     * Handle BudgetRemoveRule event
     */
    private static onRuleRemove(ruleId: string): void {
        const state = this.ruleStates.get(ruleId);
        if (state) {
            if (state.timer !== null) {
                clearTimeout(state.timer);
            }
            this.ruleStates.delete(ruleId);
            Logger.debug(`Removed rule state for ${ruleId}`);
        }
        
        // Emit state change
        this.emitStateChange();
    }

    /**
     * Clear all states and timers
     */
    public static clear(): void {
        this.clearInternal();
        Logger.debug('BudgetMonitor cleared');
    }
    
    /**
     * Internal clear without logging (used during reinitialization)
     */
    private static clearInternal(): void {
        // Clear all timers
        this.ruleStates.forEach((state) => {
            if (state.timer !== null) {
                clearTimeout(state.timer);
            }
        });
        
        this.ruleStates.clear();
        this.initialized = false;
    }
}
