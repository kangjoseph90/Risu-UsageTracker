import { writable, type Writable } from 'svelte/store';
import type { BudgetRule, UsageRecord } from '../types';
import { BudgetPeriod, RequestType } from '../types';
import { BudgetManager } from './budget';
import { UsageManager } from './usage';
import { ProviderManager } from './provider';
import { RisuAPI } from '../api';
import { BUDGET_ALERT_ENABLED_ARG, BUDGET_ALERT_THRESHOLD_ARG } from '../plugin';

interface MonitorState {
    rule: BudgetRule;
    currentCost: number;
    percentage: number;
    queue: { timestamp: number, cost: number }[];
    timer: NodeJS.Timeout | null;
}

export interface AlertState {
    ruleId: string;
    ruleName: string;
    percentage: number;
    limit: number;
    currentCost: number;
    level: 'warning' | 'danger' | 'critical';
}

export class BudgetMonitor {
    // Map ruleId to its monitoring state
    private static monitors: Map<string, MonitorState> = new Map();

    // Reactive store for UI
    public static alerts: Writable<AlertState[]> = writable([]);

    private static alertEnabled = false;
    private static alertThreshold = 80;

    static async init() {
        await this.loadSettings();
        // Initial build
        await this.rebuildAll();
    }

    private static async loadSettings() {
        const enabled = RisuAPI.getArg(BUDGET_ALERT_ENABLED_ARG);
        this.alertEnabled = enabled === 'true';

        const threshold = RisuAPI.getArg(BUDGET_ALERT_THRESHOLD_ARG);
        if (threshold) {
            this.alertThreshold = Number(threshold);
        }
    }

    static async getAlertEnabled(): Promise<boolean> {
        return this.alertEnabled;
    }

    static async getAlertThreshold(): Promise<number> {
        return this.alertThreshold;
    }

    static async setAlertSettings(enabled: boolean, threshold: number) {
        this.alertEnabled = enabled;
        this.alertThreshold = threshold;
        RisuAPI.setArg(BUDGET_ALERT_ENABLED_ARG, enabled ? 'true' : 'false');
        RisuAPI.setArg(BUDGET_ALERT_THRESHOLD_ARG, String(threshold));
        this.updateAlerts();
    }

    static async rebuildAll() {
        // Clear existing timers
        this.monitors.forEach(monitor => {
            if (monitor.timer) clearTimeout(monitor.timer);
        });
        this.monitors.clear();

        const rules = await BudgetManager.getRules();
        const allRecords = UsageManager.getRecords([]);

        for (const rule of rules) {
            this.initRuleMonitor(rule, allRecords);
        }

        this.updateAlerts();
    }

    private static initRuleMonitor(rule: BudgetRule, records: UsageRecord[]) {
        const now = Date.now();
        const windowSize = this.getPeriodDuration(rule.period);
        const cutoffTime = now - windowSize;

        // Filter relevant records for this rule
        const relevantRecords = records.filter(r => {
            const rTime = new Date(r.timestamp).getTime();
            if (rTime <= cutoffTime) return false;
            return this.matchesRule(rule, r);
        });

        // Sort by time just in case
        relevantRecords.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const queue = relevantRecords.map(r => ({
            timestamp: new Date(r.timestamp).getTime(),
            cost: r.totalCost
        }));

        const currentCost = queue.reduce((sum, item) => sum + item.cost, 0);

        const monitor: MonitorState = {
            rule,
            currentCost,
            percentage: (currentCost / rule.limit) * 100,
            queue,
            timer: null
        };

        this.monitors.set(rule.id, monitor);
        this.scheduleNextExpiration(rule.id);
    }

    private static getPeriodDuration(period: BudgetPeriod): number {
        switch (period) {
            case BudgetPeriod.Daily:
                return 24 * 60 * 60 * 1000;
            case BudgetPeriod.Weekly:
                return 7 * 24 * 60 * 60 * 1000;
            case BudgetPeriod.Monthly:
                return 30 * 24 * 60 * 60 * 1000;
        }
    }

    private static matchesRule(rule: BudgetRule, record: UsageRecord): boolean {
        if (rule.model && record.model !== rule.model) return false;

        if (rule.provider) {
            const recordProvider = ProviderManager.getProvider(record.url);
            if (recordProvider !== rule.provider) return false;
        }

        if (rule.requestType && (record.requestType || RequestType.Unknown) !== rule.requestType) return false;

        return true;
    }

    static processRecord(record: UsageRecord) {
        const recordTime = new Date(record.timestamp).getTime();

        this.monitors.forEach((monitor, ruleId) => {
            if (this.matchesRule(monitor.rule, record)) {
                // Add to queue
                monitor.queue.push({
                    timestamp: recordTime,
                    cost: record.totalCost
                });

                // Update cost
                monitor.currentCost += record.totalCost;
                monitor.percentage = (monitor.currentCost / monitor.rule.limit) * 100;

                // Ensure timer is running if it wasn't
                if (!monitor.timer && monitor.queue.length > 0) {
                    this.scheduleNextExpiration(ruleId);
                }
            }
        });

        this.updateAlerts();
    }

    private static scheduleNextExpiration(ruleId: string) {
        const monitor = this.monitors.get(ruleId);
        if (!monitor) return;

        if (monitor.timer) {
            clearTimeout(monitor.timer);
            monitor.timer = null;
        }

        if (monitor.queue.length === 0) return;

        const oldest = monitor.queue[0];
        const windowSize = this.getPeriodDuration(monitor.rule.period);
        const expirationTime = oldest.timestamp + windowSize;
        const now = Date.now();

        // If already expired (shouldn't happen often if logic is correct, but safe to check)
        let delay = expirationTime - now;
        if (delay < 0) delay = 0;

        // Handle setTimeout 32-bit limit (approx 24.8 days)
        // If delay is larger, we wait the max amount, then check again.
        // The expireOldRecords function will see nothing expired and reschedule.
        const MAX_DELAY = 2147483647;
        if (delay > MAX_DELAY) {
            delay = MAX_DELAY;
        }

        monitor.timer = setTimeout(() => {
            this.expireOldRecords(ruleId);
        }, delay);
    }

    private static expireOldRecords(ruleId: string) {
        const monitor = this.monitors.get(ruleId);
        if (!monitor) return;

        const now = Date.now();
        const windowSize = this.getPeriodDuration(monitor.rule.period);
        const cutoffTime = now - windowSize;

        let expiredCost = 0;

        // Remove all records that have expired
        while (monitor.queue.length > 0 && monitor.queue[0].timestamp <= cutoffTime) {
            const removed = monitor.queue.shift();
            if (removed) {
                expiredCost += removed.cost;
            }
        }

        if (expiredCost > 0) {
            monitor.currentCost -= expiredCost;
            // Prevent negative cost due to floating point errors
            if (monitor.currentCost < 0) monitor.currentCost = 0;

            monitor.percentage = (monitor.currentCost / monitor.rule.limit) * 100;
            this.updateAlerts();
        }

        // Schedule next
        this.scheduleNextExpiration(ruleId);
    }

    private static updateAlerts() {
        if (!this.alertEnabled) {
            this.alerts.set([]);
            return;
        }

        const activeAlerts: AlertState[] = [];

        this.monitors.forEach(monitor => {
            if (monitor.percentage >= this.alertThreshold) {
                let level: 'warning' | 'danger' | 'critical' = 'warning';
                if (monitor.percentage >= 100) level = 'critical';
                else if (monitor.percentage >= 90) level = 'danger';

                activeAlerts.push({
                    ruleId: monitor.rule.id,
                    ruleName: monitor.rule.name,
                    percentage: monitor.percentage,
                    limit: monitor.rule.limit,
                    currentCost: monitor.currentCost,
                    level
                });
            }
        });

        activeAlerts.sort((a, b) => b.percentage - a.percentage);
        this.alerts.set(activeAlerts);
    }

    static updateRule(rule: BudgetRule) {
        // Simply rebuild everything to be safe and easy
        // Or optimally: remove old monitor, add new one.
        // Given rules are few, rebuilding specific one is fine.

        // Cleanup old
        const oldMonitor = this.monitors.get(rule.id);
        if (oldMonitor && oldMonitor.timer) {
            clearTimeout(oldMonitor.timer);
        }

        // Re-init with current history
        const allRecords = UsageManager.getRecords([]);
        this.initRuleMonitor(rule, allRecords);
        this.updateAlerts();
    }

    static removeRule(ruleId: string) {
        const monitor = this.monitors.get(ruleId);
        if (monitor) {
            if (monitor.timer) clearTimeout(monitor.timer);
            this.monitors.delete(ruleId);
            this.updateAlerts();
        }
    }

    static onRecordRemoved(record: UsageRecord) {
        // Since we don't know which monitor has this record in its queue easily (without searching all queues),
        // and removing a record is a rare operation, we can simply rebuild the monitors.
        // Or we can iterate all monitors and try to remove the record if it exists in the queue.

        // Optimisation: Rebuild is safest to ensure consistency.
        this.rebuildAll();
    }
}
