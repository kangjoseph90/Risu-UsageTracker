import { Logger } from "../logger";
import { PLUGIN_TITLE } from "../plugin";

interface CacheEntry<T> {
    value: T;
    timestamp: number;
    ttlMs: number;
}

/**
 * Browser localStorage based cache manager
 * 
 * Features:
 * - Generic type support for cached values
 * - TTL (Time To Live) support
 * - Automatic expiration checking
 * - Pattern-based deletion
 * - Error handling and logging
 */
export class CacheManager {
    private static readonly PREFIX = `${PLUGIN_TITLE}-cache-`;
    private static readonly DEFAULT_TTL_HOURS = 24;
    private static readonly DEFAULT_TTL_MS = this.DEFAULT_TTL_HOURS * 60 * 60 * 1000;

    /**
     * Get cached value
     * @param key Cache key
     * @returns Cached value or null if not found or expired
     */
    static get<T>(key: string): T | null {
        try {
            const fullKey = this.buildKey(key);
            const data = localStorage.getItem(fullKey);

            if (!data) {
                return null;
            }

            const entry: CacheEntry<T> = JSON.parse(data);

            // Check if expired
            if (this.isExpired(entry)) {
                localStorage.removeItem(fullKey);
                return null;
            }

            return entry.value;
        } catch (e) {
            Logger.warn(`Cache get failed for key "${key}":`, e);
            return null;
        }
    }

    /**
     * Set cache value
     * @param key Cache key
     * @param value Value to cache
     * @param ttlHours TTL in hours (default: 24)
     */
    static set<T>(key: string, value: T, ttlHours: number = this.DEFAULT_TTL_HOURS): boolean {
        try {
            const fullKey = this.buildKey(key);
            const entry: CacheEntry<T> = {
                value,
                timestamp: Date.now(),
                ttlMs: ttlHours * 60 * 60 * 1000
            };

            localStorage.setItem(fullKey, JSON.stringify(entry));
            return true;
        } catch (e) {
            Logger.warn(`Cache set failed for key "${key}":`, e);
            return false;
        }
    }

    /**
     * Check if cache entry exists and is not expired
     * @param key Cache key
     * @returns true if valid cache exists
     */
    static has(key: string): boolean {
        try {
            const fullKey = this.buildKey(key);
            const data = localStorage.getItem(fullKey);

            if (!data) {
                return false;
            }

            const entry: CacheEntry<unknown> = JSON.parse(data);
            return !this.isExpired(entry);
        } catch (e) {
            return false;
        }
    }

    /**
     * Remove cache entry
     * @param key Cache key
     * @returns true if removed successfully
     */
    static remove(key: string): boolean {
        try {
            const fullKey = this.buildKey(key);
            localStorage.removeItem(fullKey);
            return true;
        } catch (e) {
            Logger.warn(`Cache remove failed for key "${key}":`, e);
            return false;
        }
    }

    /**
     * Clear all cache entries matching pattern
     * @param pattern Pattern to match (optional, if not provided clears all)
     * @returns Number of entries removed
     */
    static clear(pattern?: string): number {
        try {
            let removedCount = 0;
            const keysToRemove: string[] = [];

            // Find all keys to remove
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.PREFIX)) {
                    if (!pattern || key.includes(pattern)) {
                        keysToRemove.push(key);
                    }
                }
            }

            // Remove keys
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                removedCount++;
            });

            return removedCount;
        } catch (e) {
            Logger.warn('Cache clear failed:', e);
            return 0;
        }
    }

    /**
     * Get cache statistics
     * @returns Object with cache info
     */
    static getStats(): {
        totalEntries: number;
        totalSize: string;
    } {
        try {
            let totalEntries = 0;
            let totalSize = 0;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.PREFIX)) {
                    const data = localStorage.getItem(key);
                    if (data) {
                        totalEntries++;
                        totalSize += data.length;
                    }
                }
            }

            return {
                totalEntries,
                totalSize: `${(totalSize / 1024).toFixed(2)} KB`
            };
        } catch (e) {
            Logger.warn('Cache stats failed:', e);
            return { totalEntries: 0, totalSize: '0 KB' };
        }
    }

    /**
     * Check if entry is expired
     * @param entry Cache entry
     * @returns true if expired
     */
    private static isExpired<T>(entry: CacheEntry<T>): boolean {
        const age = Date.now() - entry.timestamp;
        return age > entry.ttlMs;
    }

    /**
     * Build full cache key with prefix
     * @param key Cache key
     * @returns Full key with prefix
     */
    private static buildKey(key: string): string {
        return `${this.PREFIX}${key}`;
    }
}