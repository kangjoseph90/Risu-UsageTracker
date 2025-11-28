import { ERROR_DB_ARG } from "../plugin";
import { RisuAPI } from "../api";
import type { ErrorRecord, ErrorDB } from "../types";
import { debounce } from "../util";
import { EventManager, PluginEvent } from "./event";

export class ErrorManager {
    private static cachedDB: ErrorDB = {
        records: [],
        lastUpdated: new Date().toISOString()
    };
    private static readonly DEBOUNCE_WAIT = 500;
    private static initialized = false;

    static {
        EventManager.on(PluginEvent.GlobalRestore, () => ErrorManager.clear());
        EventManager.on(PluginEvent.GlobalDestroy, () => ErrorManager.clear());
    }

    private static debouncedSave = debounce(() => {
        RisuAPI.setArg(ERROR_DB_ARG, JSON.stringify(ErrorManager.cachedDB));
    }, ErrorManager.DEBOUNCE_WAIT);

    private static init() {
        if (this.initialized) {
            return;
        }
        try {
            const storedDB = RisuAPI.getArg(ERROR_DB_ARG) as string;
            if (storedDB) {
                this.cachedDB = JSON.parse(storedDB);
            }
        } catch (e) {
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
    
    static addRecord(record: ErrorRecord) {
        this.ensureInitialized();
        this.cachedDB.records.push(record);
        this.cachedDB.lastUpdated = new Date().toISOString();
        this.debouncedSave();
        EventManager.emit(PluginEvent.ErrorAddRecord, record);
    }

    static removeRecord(record: ErrorRecord): boolean {
        this.ensureInitialized();
        const index = this.cachedDB.records.findIndex(r =>
            r.timestamp === record.timestamp &&
            r.model === record.model &&
            r.url === record.url &&
            r.statusCode === record.statusCode &&
            r.requestType === record.requestType
        );

        if (index !== -1) {
            this.cachedDB.records.splice(index, 1);
            this.cachedDB.lastUpdated = new Date().toISOString();
            this.debouncedSave();
            EventManager.emit(PluginEvent.ErrorRemoveRecord, record);
            return true;
        }
        return false;
    }

    static getRecords(): ErrorRecord[] {
        this.ensureInitialized();
        return this.cachedDB.records || [];
    }

    static getLastUpdated(): string {
        this.ensureInitialized();
        return this.cachedDB.lastUpdated;
    }

    static exportToJSON(records: ErrorRecord[]): string {
        this.ensureInitialized();
        return JSON.stringify(records, null, 2);
    }

    static clear(): void {
        this.debouncedSave.cancel();
        this.initialized = false;
        this.cachedDB = {
            records: [],
            lastUpdated: new Date().toISOString()
        };
    }
}