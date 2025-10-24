import { DB_ARG } from "../consts";
import { RisuAPI } from "../risuAPI";
import { UsageRecord, UsageDB, UsageFilter } from "../types";

function initDB() {
    setDB({
        records: [],
        lastUpdated: new Date().toISOString()
    })
}

function getDB(): UsageDB {
    try {
        const db: UsageDB = JSON.parse(RisuAPI.getArg(DB_ARG) as string);
        return db;
    } catch (e) {
        initDB();
        const db: UsageDB = JSON.parse(RisuAPI.getArg(DB_ARG) as string);
        return db;
    }
}

function setDB(db: UsageDB) {
    RisuAPI.setArg(DB_ARG, JSON.stringify(db))
}

/**
 * addRecord,
 * removeRecord,
 * getRecords,
 */
export class UsageManager {
    static addRecord(record: UsageRecord) {
        const db = getDB();
        db.records.push(record);
        setDB(db);
    }

    static removeRecord(record: UsageRecord): boolean {
        const db = getDB();
        const index = db.records.findIndex(r =>
            r.timestamp === record.timestamp &&
            r.model === record.model &&
            r.url === record.url &&
            r.requestType === record.requestType &&
            r.inputTokens === record.inputTokens &&
            r.cachedInputTokens === record.cachedInputTokens &&
            r.outputTokens === record.outputTokens &&
            r.inputCost === record.inputCost &&
            r.outputCost === record.outputCost &&
            r.totalCost === record.totalCost
        );
        if (index !== -1) {
            db.records.splice(index, 1);
            setDB(db);
            return true;
        }
        return false;
    }

    static getRecords(filter: UsageFilter[]): UsageRecord[] {
        const db = getDB();
        const filtered = db.records.filter((record: UsageRecord) =>
            filter.every(fn => fn(record))
        );
        return filtered;
    }

}