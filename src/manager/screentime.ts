import { SCREEN_TIME_DB_ARG } from "../plugin";
import { RisuAPI } from "../api";
import type { ScreenTimeDB, ScreenTimeRecord } from "../types";
import { debounce } from "../util";

export class ScreenTimeManager {
    private static cachedDB: ScreenTimeDB = {
        records: {},
        lastUpdated: new Date().toISOString()
    };

    private static readonly IDLE_THRESHOLD_MS = 60 * 1000; // 1 minute
    private static readonly SAVE_INTERVAL_MS = 60 * 1000; // 1 minute
    private static readonly TICK_INTERVAL_MS = 1000; // 1 second

    private static lastActivityTime = Date.now();
    private static isActive = true;
    private static intervalId: any = null;
    private static saveIntervalId: any = null;
    private static isInitialized = false;

    // Use a separate debounce for immediate saves if needed, though we rely on periodic save for screen time
    private static debouncedSave = debounce(() => {
        ScreenTimeManager.save();
    }, 1000);

    static init() {
        if (this.isInitialized) return;

        try {
            const storedDB = RisuAPI.getArg(SCREEN_TIME_DB_ARG) as string;
            if (storedDB) {
                this.cachedDB = JSON.parse(storedDB);
                // Ensure records is an object
                if (Array.isArray(this.cachedDB.records)) {
                     // Migration from array if needed (though we started with object)
                     // For now, reset if invalid structure
                     this.cachedDB.records = {};
                }
            }
        } catch (e) {
            console.error("Failed to load screen time DB", e);
            this.cachedDB = {
                records: {},
                lastUpdated: new Date().toISOString()
            };
        }

        this.setupListeners();
        this.startTracking();
        this.isInitialized = true;
    }

    static destroy() {
        if (this.intervalId) clearInterval(this.intervalId);
        if (this.saveIntervalId) clearInterval(this.saveIntervalId);
        this.removeListeners();
        this.save(); // Force save on destroy
        this.isInitialized = false;
    }

    private static setupListeners() {
        if (typeof window === 'undefined') return;

        ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            window.addEventListener(event, this.handleActivity, true);
        });

        document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    private static removeListeners() {
        if (typeof window === 'undefined') return;

        ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            window.removeEventListener(event, this.handleActivity, true);
        });

        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    private static handleActivity = () => {
        ScreenTimeManager.lastActivityTime = Date.now();
        if (!ScreenTimeManager.isActive) {
            ScreenTimeManager.isActive = true;
        }
    };

    private static handleVisibilityChange = () => {
        if (document.hidden) {
            ScreenTimeManager.save(); // Save when hidden
        } else {
            ScreenTimeManager.lastActivityTime = Date.now();
        }
    };

    private static startTracking() {
        // Tick every second to update local counters
        this.intervalId = setInterval(() => {
            this.tick();
        }, this.TICK_INTERVAL_MS);

        // Periodically save to persistent storage
        this.saveIntervalId = setInterval(() => {
            this.save();
        }, this.SAVE_INTERVAL_MS);
    }

    private static tick() {
        if (typeof document !== 'undefined' && document.hidden) return;

        const now = Date.now();
        const timeSinceLastActivity = now - this.lastActivityTime;

        // Determine if user is idle
        if (timeSinceLastActivity > this.IDLE_THRESHOLD_MS) {
            this.isActive = false;
        }

        const todayKey = this.getDateKey(new Date());

        if (!this.cachedDB.records[todayKey]) {
            this.cachedDB.records[todayKey] = {
                date: todayKey,
                activeSeconds: 0,
                idleSeconds: 0
            };
        }

        if (this.isActive) {
            this.cachedDB.records[todayKey].activeSeconds++;
        } else {
            this.cachedDB.records[todayKey].idleSeconds++;
        }
    }

    private static save() {
        this.cachedDB.lastUpdated = new Date().toISOString();
        RisuAPI.setArg(SCREEN_TIME_DB_ARG, JSON.stringify(this.cachedDB));
    }

    private static getDateKey(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    static getRecords(): ScreenTimeRecord[] {
        return Object.values(this.cachedDB.records);
    }

    static getRecord(date: Date): ScreenTimeRecord | undefined {
        return this.cachedDB.records[this.getDateKey(date)];
    }
}
