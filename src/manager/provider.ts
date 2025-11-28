import { PROVIDER_MAP_ARG } from "../plugin";
import { getDefaultProvider } from "../consts/provider";
import { RisuAPI } from "../api";
import type { ProviderMap } from "../types";
import { debounce } from "../util";
import { EventManager, PluginEvent } from "./event";

export class ProviderManager {
    private static cachedMap: ProviderMap = {};
    private static readonly DEBOUNCE_WAIT = 500;

    private static debouncedSave = debounce(() => {
        RisuAPI.setArg(PROVIDER_MAP_ARG, JSON.stringify(ProviderManager.cachedMap));
    }, ProviderManager.DEBOUNCE_WAIT);

    static init() {
        try {
            const storedMap = RisuAPI.getArg(PROVIDER_MAP_ARG) as string;
            this.cachedMap = storedMap ? JSON.parse(storedMap) : {};
        } catch (e) {
            this.cachedMap = {};
        }

        EventManager.on(PluginEvent.ProviderRename, (data: { oldName: string, newName: string }) => {
            ProviderManager.renameProvider(data.oldName, data.newName);
        });
    }

    static getProvider(url: string): string {
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
        this.cachedMap[url] = providerName;
        this.debouncedSave();
    }

    static removeProvider(url: string): boolean {
        if (url in this.cachedMap) {
            delete this.cachedMap[url];
            this.debouncedSave();
            return true;
        }
        return false;
    }

    static getAllProviders(): ProviderMap {
        return this.cachedMap;
    }

    static clearAll(): void {
        this.cachedMap = {};
        this.debouncedSave();
    }

    static renameProvider(oldName: string, newName: string): number {
        let count = 0;
        for (const url in this.cachedMap) {
            if (this.cachedMap[url] === oldName) {
                this.cachedMap[url] = newName;
                count++;
            }
        }
        
        if (count > 0) {
            this.debouncedSave();
        }
        
        return count;
    }
}
