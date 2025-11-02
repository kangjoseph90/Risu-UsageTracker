import { PLUGIN_TITLE, getAllArgNames, RISU_ARGS } from "../plugin";
import { Logger } from "../logger";
import { RisuAPI } from "../api";
import { LanguageManager } from "./language";
import { ProviderManager } from "./provider";
import { PriceManager } from "./price";
import { UsageManager } from "./usage";

interface BackupData {
    version: string;
    timestamp: string;
    data: {
        [key: string]: string;
    };
}

/**
 * backup,
 * restore,
 * hasBackup,
 * getBackupTimestamp
 */
export class BackupManager {
    private static readonly DB_NAME = PLUGIN_TITLE;
    private static readonly STORE_NAME = 'backups';
    private static readonly BACKUP_KEY = 'latest_backup';
    private static readonly VERSION = '1.0';

    static async backup(): Promise<boolean> {
        try {
            const backupData: BackupData = {
                version: this.VERSION,
                timestamp: new Date().toISOString(),
                data: {}
            };

            // 등록된 모든 arg 데이터 수집 (자동)
            const argNames = getAllArgNames();
            for (const argName of argNames) {
                const value = RisuAPI.getArg(argName);
                if (value !== undefined) {
                    backupData.data[argName] = String(value);
                }
            }

            // IndexedDB에 저장
            await this.saveToIndexedDB(backupData);
            return true;
        } catch (e) {
            Logger.error('Backup failed:', e);
            return false;
        }
    }

    static async restore(): Promise<boolean> {
        try {
            const backupData = await this.loadFromIndexedDB();
            
            if (!backupData) {
                Logger.warn('No backup found');
                return false;
            }

            // 복구된 데이터를 RisuAPI에 설정 (자동)
            for (const [argName, value] of Object.entries(backupData.data)) {
                if (this.isValidArgName(argName)) {
                    RisuAPI.setArg(argName, value);
                }
            }

            LanguageManager.init();
            ProviderManager.init();
            PriceManager.init();
            UsageManager.init();

            return true;
        } catch (e) {
            Logger.error('Restore failed:', e);
            return false;
        }
    }

    static async hasBackup(): Promise<boolean> {
        try {
            const backupData = await this.loadFromIndexedDB();
            return backupData !== null;
        } catch (e) {
            return false;
        }
    }

    static async getBackupTimestamp(): Promise<string | null> {
        try {
            const backupData = await this.loadFromIndexedDB();
            return backupData?.timestamp || null;
        } catch (e) {
            return null;
        }
    }

    private static saveToIndexedDB(backupData: BackupData): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(this.DB_NAME, 1);

                request.onerror = () => reject(request.error);

                request.onsuccess = () => {
                    const db = request.result;
                    const transaction = db.transaction([this.STORE_NAME], 'readwrite');
                    const store = transaction.objectStore(this.STORE_NAME);
                    
                    const putRequest = store.put(backupData, this.BACKUP_KEY);
                    putRequest.onerror = () => reject(putRequest.error);
                    putRequest.onsuccess = () => resolve();
                };

                request.onupgradeneeded = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                        db.createObjectStore(this.STORE_NAME);
                    }
                };
            } catch (e) {
                reject(e);
            }
        });
    }

    private static loadFromIndexedDB(): Promise<BackupData | null> {
        return new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(this.DB_NAME, 1);

                request.onerror = () => reject(request.error);

                request.onsuccess = () => {
                    const db = request.result;
                    const transaction = db.transaction([this.STORE_NAME], 'readonly');
                    const store = transaction.objectStore(this.STORE_NAME);
                    
                    const getRequest = store.get(this.BACKUP_KEY);
                    getRequest.onerror = () => reject(getRequest.error);
                    getRequest.onsuccess = () => resolve(getRequest.result || null);
                };

                request.onupgradeneeded = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                        db.createObjectStore(this.STORE_NAME);
                    }
                };
            } catch (e) {
                reject(e);
            }
        });
    }

    private static isValidArgName(argName: string): boolean {
        return argName in RISU_ARGS;
    }

    static async clearBackup(): Promise<boolean> {
        try {
            await new Promise<void>((resolve, reject) => {
                const request = indexedDB.open(this.DB_NAME, 1);

                request.onerror = () => reject(request.error);

                request.onsuccess = () => {
                    const db = request.result;
                    const transaction = db.transaction([this.STORE_NAME], 'readwrite');
                    const store = transaction.objectStore(this.STORE_NAME);
                    
                    const deleteRequest = store.delete(this.BACKUP_KEY);
                    deleteRequest.onerror = () => reject(deleteRequest.error);
                    deleteRequest.onsuccess = () => resolve();
                };

                request.onupgradeneeded = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                        db.createObjectStore(this.STORE_NAME);
                    }
                };
            });
            return true;
        } catch (e) {
            Logger.error('Clear backup failed:', e);
            return false;
        }
    }
}