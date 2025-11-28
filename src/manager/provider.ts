import { PROVIDER_MAP_ARG } from "../plugin";
import { getDefaultProvider } from "../consts/provider";
import { RisuAPI } from "../api";
import type { ProviderMap } from "../types";
import { debounce } from "../util";
import { EventManager, PluginEvent } from "./event";

export class ProviderManager {
    private static cachedMap: ProviderMap = {};
    private static readonly DEBOUNCE_WAIT = 500;
    private static initialized = false;
    
    static {
        EventManager.on(PluginEvent.GlobalRestore, () => ProviderManager.clear());
        EventManager.on(PluginEvent.GlobalDestroy, () => ProviderManager.clear());
    }

    private static debouncedSave = debounce(() => {
        RisuAPI.setArg(PROVIDER_MAP_ARG, JSON.stringify(ProviderManager.cachedMap));
    }, ProviderManager.DEBOUNCE_WAIT);

    private static init() {
        if (this.initialized) {
            return;
        }
        try {
            const storedMap = RisuAPI.getArg(PROVIDER_MAP_ARG) as string;
            this.cachedMap = storedMap ? JSON.parse(storedMap) : {};
        } catch (e) {
            this.cachedMap = {};
        }

        this.initialized = true;
    }

    private static ensureInitialized() {
        if (!this.initialized) {
            this.init();
        }
    }

    static getProvider(url: string): string {
        this.ensureInitialized();
        if (url in this.cachedMap) {
            return this.cachedMap[url];
        }

        const provider = getDefaultProvider(url);
        if (provider) {
            this.setProvider(url, provider);
            return provider;
        }

        this.setProvider(url, url);
        return url;
    }

    static setProvider(url: string, providerName: string): void {
        this.ensureInitialized();
        this.cachedMap[url] = providerName;
        this.debouncedSave();
        EventManager.emit(PluginEvent.ProviderUpdate, { url, providerName });
    }

    static removeProvider(url: string): boolean {
        this.ensureInitialized();
        if (url in this.cachedMap) {
            delete this.cachedMap[url];
            this.debouncedSave();
            EventManager.emit(PluginEvent.ProviderUpdate, { url, providerName: null });
            return true;
        }
        return false;
    }

    static getAllProviders(): ProviderMap {
        this.ensureInitialized();
        return this.cachedMap;
    }

    static clearAll(): void {
        this.ensureInitialized();
        this.cachedMap = {};
        this.debouncedSave();
    }

    static renameProvider(oldName: string, newName: string): number {
        if (oldName === newName) return 0;
        
        this.ensureInitialized();
        let count = 0;
        for (const url in this.cachedMap) {
            if (this.cachedMap[url] === oldName) {
                this.cachedMap[url] = newName;
                count++;
            }
        }
        
        if (count > 0) {
            this.debouncedSave();
            EventManager.emit(PluginEvent.ProviderRename, { oldName, newName });
        }
        
        return count;
    }

    static clear(): void {
        this.debouncedSave.cancel();
        this.initialized = false;
        this.cachedMap = {};
    }
}
