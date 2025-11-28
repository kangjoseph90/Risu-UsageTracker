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

    private static debouncedSave = debounce(() => {
        RisuAPI.setArg(ERROR_DB_ARG, JSON.stringify(ErrorManager.cachedDB));
    }, ErrorManager.DEBOUNCE_WAIT);

    static init() {
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
    }

    static addRecord(record: ErrorRecord) {
        this.cachedDB.records.push(record);
        this.cachedDB.lastUpdated = new Date().toISOString();
        this.debouncedSave();
        EventManager.emit(PluginEvent.ErrorAddRecord, record);
    }

    static removeRecord(record: ErrorRecord): boolean {
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
        return this.cachedDB.records || [];
    }

    static getLastUpdated(): string {
        return this.cachedDB.lastUpdated;
    }

    static exportToJSON(records: ErrorRecord[]): string {
        return JSON.stringify(records, null, 2);
    }
}
