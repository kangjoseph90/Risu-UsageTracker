import { DB_ARG } from "../plugin";
import { RisuAPI } from "../api";
import type { UsageRecord, UsageDB, UsageFilter, PriceInfo, CostInfo } from "../types";
import { calculateCost, debounce } from "../util";
import { ProviderManager } from "./provider";
import { EventManager, PluginEvent } from "./event";

export class UsageManager {
    private static cachedDB: UsageDB = {
        records: [],
        lastUpdated: new Date().toISOString()
    };
    private static readonly DEBOUNCE_WAIT = 500;
    private static initialized = false;

    static {
        EventManager.on(PluginEvent.GlobalRestore, () => UsageManager.clear());
        EventManager.on(PluginEvent.GlobalDestroy, () => UsageManager.clear());
        EventManager.on(PluginEvent.PriceUpdate, (data: { provider: string, modelId: string, priceInfo: PriceInfo }) => {
            UsageManager.updateCostsForModel(data.provider, data.modelId, data.priceInfo);
        });
    }

    private static debouncedSave = debounce(() => {
        RisuAPI.setArg(DB_ARG, JSON.stringify(UsageManager.cachedDB));
    }, UsageManager.DEBOUNCE_WAIT);

    private static init() {
        if (this.initialized) {
            return;
        }
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

        this.initialized = true;
    }

    private static ensureInitialized() {
        if (!this.initialized) {
            this.init();
        }
    }

    static addRecord(record: UsageRecord) {
        this.ensureInitialized();
        this.cachedDB.records.push(record);
        this.cachedDB.lastUpdated = new Date().toISOString();
        this.debouncedSave();
        EventManager.emit(PluginEvent.UsageAddRecord, record);
    }

    static removeRecord(record: UsageRecord): boolean {
        this.ensureInitialized();
        const index = this.cachedDB.records.findIndex(r =>
            r.timestamp === record.timestamp &&
            r.model === record.model &&
            r.url === record.url
        );

        if (index !== -1) {
            this.cachedDB.records.splice(index, 1);
            this.cachedDB.lastUpdated = new Date().toISOString();
            this.debouncedSave();
            EventManager.emit(PluginEvent.UsageRemoveRecord, record);
            return true;
        }
        return false;
    }

    static getRecords(filter: UsageFilter[]): UsageRecord[] {
        this.ensureInitialized();
        if (!this.cachedDB.records) return [];
        const filtered = this.cachedDB.records.filter((record: UsageRecord) =>
            filter.every(fn => fn(record))
        );
        return filtered;
    }

    static getLastUpdated(): string {
        this.ensureInitialized();
        return this.cachedDB.lastUpdated;
    }

    static updateCostsForModel(provider: string, modelId: string, newPrice: PriceInfo): number {
        this.ensureInitialized();
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
            EventManager.emit(PluginEvent.UsageUpdateRecord, { provider, modelId, newPrice });
        }

        return updatedCount;
    }

    static exportToJSON(records: UsageRecord[]): string {
        this.ensureInitialized();
        return JSON.stringify(records, null, 2);
    }

    static exportToCSV(records: UsageRecord[]): string {
        this.ensureInitialized();
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

    static clear(): void {
        this.debouncedSave.cancel();
        this.initialized = false;
        this.cachedDB = { records: [], lastUpdated: new Date().toISOString() };
    }
}