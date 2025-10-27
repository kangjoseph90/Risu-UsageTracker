import { PLUGIN_TITLE, getAllArgNames, RISU_ARGS } from "../plugin";
import { Logger } from "../logger";
import { RisuAPI } from "../api";

interface BackupData {
    version: string;
    timestamp: string;
    data: {
        [key: string]: string;
    };
}

/**
 * BackupManager
 * 모든 RisuAPI 데이터를 브라우저 IndexedDB에 백업/복구하는 기능 제공
 * args.ts의 RISU_ARGS에 등록된 모든 arg를 자동으로 처리
 * 
 * 사용 예시:
 * - BackupManager.backup() → 현재 모든 데이터 브라우저 DB에 저장
 * - BackupManager.restore() → 브라우저 DB에서 복구
 */
export class BackupManager {
    private static readonly DB_NAME = PLUGIN_TITLE;
    private static readonly STORE_NAME = 'backups';
    private static readonly BACKUP_KEY = 'latest_backup';
    private static readonly VERSION = '1.0';

    /**
     * 현재 모든 RisuAPI 데이터를 브라우저 IndexedDB에 백업
     */
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

    /**
     * 브라우저 IndexedDB에서 백업 데이터를 복구
     */
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

            return true;
        } catch (e) {
            Logger.error('Restore failed:', e);
            return false;
        }
    }

    /**
     * 브라우저에 백업 데이터가 존재하는지 확인
     */
    static async hasBackup(): Promise<boolean> {
        try {
            const backupData = await this.loadFromIndexedDB();
            return backupData !== null;
        } catch (e) {
            return false;
        }
    }

    /**
     * 백업 데이터의 타임스탐프를 조회
     */
    static async getBackupTimestamp(): Promise<string | null> {
        try {
            const backupData = await this.loadFromIndexedDB();
            return backupData?.timestamp || null;
        } catch (e) {
            return null;
        }
    }



    /**
     * IndexedDB에 백업 데이터 저장
     */
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

    /**
     * IndexedDB에서 백업 데이터 로드
     */
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

    /**
     * arg 이름이 등록된 것인지 검증
     */
    private static isValidArgName(argName: string): boolean {
        return argName in RISU_ARGS;
    }

    /**
     * 백업 데이터 삭제
     */
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