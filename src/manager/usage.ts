import { DB_ARG } from "../plugin";
import { RisuAPI } from "../api";
import type { UsageRecord, UsageDB, UsageFilter, PriceInfo, CostInfo } from "../types";
import { calculateCost, debounce } from "../util";
import { ProviderManager } from "./provider";
import { BudgetMonitor } from "./budget_monitor";

export class UsageManager {
    private static cachedDB: UsageDB = {
        records: [],
        lastUpdated: new Date().toISOString()
    };
    private static readonly DEBOUNCE_WAIT = 500;

    private static debouncedSave = debounce(() => {
        RisuAPI.setArg(DB_ARG, JSON.stringify(UsageManager.cachedDB));
    }, UsageManager.DEBOUNCE_WAIT);

    static init() {
        try {
            const storedDB = RisuAPI.getArg(DB_ARG) as string;
            if (storedDB) {
                this.cachedDB = JSON.parse(storedDB);
            }
        } catch (e) {
            // Keep default empty DB if parsing fails
            this.cachedDB = {
                records: [],
                lastUpdated: new Date().toISOString()
            };
        }
    }

    static addRecord(record: UsageRecord) {
        this.cachedDB.records.push(record);
        this.cachedDB.lastUpdated = new Date().toISOString();
        this.debouncedSave();
        BudgetMonitor.processRecord(record);
    }

    static removeRecord(record: UsageRecord): boolean {
        const index = this.cachedDB.records.findIndex(r =>
            r.timestamp === record.timestamp &&
            r.model === record.model &&
            r.url === record.url
        );

        if (index !== -1) {
            this.cachedDB.records.splice(index, 1);
            this.cachedDB.lastUpdated = new Date().toISOString();
            this.debouncedSave();
            return true;
        }
        return false;
    }

    static getRecords(filter: UsageFilter[]): UsageRecord[] {
        if (!this.cachedDB.records) return [];
        const filtered = this.cachedDB.records.filter((record: UsageRecord) =>
            filter.every(fn => fn(record))
        );
        return filtered;
    }

    static getLastUpdated(): string {
        return this.cachedDB.lastUpdated;
    }

    static updateCostsForModel(provider: string, modelId: string, newPrice: PriceInfo): number {
        let updatedCount = 0;

        this.cachedDB.records.forEach(record => {
            const recordProvider = ProviderManager.getProvider(record.url);
            
            if (recordProvider === provider && record.model === modelId) {
                const newCost: CostInfo = calculateCost(
                    {
                        inputTokens: record.inputTokens,
                        cachedInputTokens: record.cachedInputTokens,
                        outputTokens: record.outputTokens
                    },
                    newPrice
                );
                Object.assign(record, newCost);
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            this.cachedDB.lastUpdated = new Date().toISOString();
            this.debouncedSave();
        }

        return updatedCount;
    }

    static exportToJSON(records: UsageRecord[]): string {
        return JSON.stringify(records, null, 2);
    }

    static exportToCSV(records: UsageRecord[]): string {
        if (records.length === 0) {
            return '';
        }

        const headers = [
            'timestamp',
            'model',
            'requestType',
            'url',
            'inputTokens',
            'cachedInputTokens',
            'outputTokens',
            'inputCost',
            'outputCost',
            'totalCost'
        ];

        const csvRows = [headers.join(',')];

        for (const record of records) {
            const values = headers.map(header => {
                const key = header as keyof UsageRecord;
                let value = record[key];

                if (typeof value === 'string') {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\\n');
    }
}