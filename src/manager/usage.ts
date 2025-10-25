import { DB_ARG } from "../consts";
import { RisuAPI } from "../risuAPI";
import { UsageRecord, UsageDB, UsageFilter, PriceInfo, CostInfo } from "../types";
import { calculateCost } from "../util";
import { ProviderManager } from "./provider";

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
 * getLastUpdated,
 * recalculateCostsForModel,
 */
export class UsageManager {
    static addRecord(record: UsageRecord) {
        const db = getDB();
        db.records.push(record);
        db.lastUpdated = new Date().toISOString();
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
            db.lastUpdated = new Date().toISOString();
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

    static getLastUpdated(): string {
        const db = getDB();
        return db.lastUpdated;
    }

    static updateCostsForModel(provider: string, modelId: string, newPrice: PriceInfo): number {
        const db = getDB();
        const providerMap = ProviderManager.getAllProviders();
        let updatedCount = 0;

        db.records.forEach(record => {
            const recordProvider = providerMap[record.url];
            
            // provider와 modelId 일치 확인
            if (recordProvider === provider && record.model === modelId) {
                // 새 가격으로 비용 재계산
                const newCost: CostInfo = calculateCost(
                    {
                        inputTokens: record.inputTokens,
                        cachedInputTokens: record.cachedInputTokens,
                        outputTokens: record.outputTokens
                    },
                    newPrice
                );
                record = Object.assign(record, newCost);
                updatedCount++;
            }
        });

        // 변경사항이 있으면 저장 및 lastUpdated 갱신
        if (updatedCount > 0) {
            db.lastUpdated = new Date().toISOString();
            setDB(db);
        }

        return updatedCount;
    }

}