import { PRICE_ARG, PRICE_TEMP_ARG } from "../plugin";
import { DEFAULT_PRICE } from "../consts/price";
import { RisuAPI } from "../api";
import type { PriceInfo, ProviderPrice } from "../types";
import { debounce } from "../util";
import { EventManager, PluginEvent } from "./event";

export class PriceManager {
    private static cachedConfirmed: ProviderPrice = {};
    private static cachedTemporary: ProviderPrice = {};
    private static readonly DEBOUNCE_WAIT = 500;
    private static initialized = false;

    static {
        EventManager.on(PluginEvent.GlobalRestore, () => PriceManager.clear());
        EventManager.on(PluginEvent.GlobalDestroy, () => PriceManager.clear());
    }

    private static debouncedSaveConfirmed = debounce(() => {
        RisuAPI.setArg(PRICE_ARG, JSON.stringify(PriceManager.cachedConfirmed));
    }, PriceManager.DEBOUNCE_WAIT);

    private static debouncedSaveTemporary = debounce(() => {
        RisuAPI.setArg(PRICE_TEMP_ARG, JSON.stringify(PriceManager.cachedTemporary));
    }, PriceManager.DEBOUNCE_WAIT);

    private static init() {
        if (this.initialized) {
            return;
        }
        try {
            const confirmed = RisuAPI.getArg(PRICE_ARG) as string;
            this.cachedConfirmed = confirmed ? JSON.parse(confirmed) : {};
        } catch (e) {
            this.cachedConfirmed = {};
        }
        try {
            const temporary = RisuAPI.getArg(PRICE_TEMP_ARG) as string;
            this.cachedTemporary = temporary ? JSON.parse(temporary) : {};
        } catch (e) {
            this.cachedTemporary = {};
        }

        this.initialized = true;
    }

    private static ensureInitialized() {
        if (!this.initialized) {
            this.init();
        }
    }

    static getModelPrice(modelId: string, provider: string): PriceInfo {
        this.ensureInitialized();
        const priceData = { ...this.cachedConfirmed, ...this.cachedTemporary };

        const savedPrice = priceData[provider];
        if (savedPrice && savedPrice[modelId]) {
            return savedPrice[modelId];
        }

        const defaultPrice = DEFAULT_PRICE[provider];
        if (defaultPrice && defaultPrice[modelId]) {
            this.setConfirmedPrice(modelId, provider, defaultPrice[modelId]);
            return defaultPrice[modelId];
        }

        const newTempPrice: PriceInfo = {
            inputPrice: 0,
            outputPrice: 0,
        };

        this.setTemporaryPrice(modelId, provider, newTempPrice);
        return newTempPrice;
    }

    static setTemporaryPrice(modelId: string, provider: string, priceInfo: PriceInfo): void {
        this.ensureInitialized();
        this.setTemporaryPriceWithRetroactive(modelId, provider, priceInfo, true);
    }

    static setTemporaryPriceWithRetroactive(modelId: string, provider: string, priceInfo: PriceInfo, applyRetroactive: boolean): void {
        this.ensureInitialized();
        if (!this.cachedTemporary[provider]) {
            this.cachedTemporary[provider] = {};
        }
        this.cachedTemporary[provider][modelId] = priceInfo;
        this.debouncedSaveTemporary();
        if (applyRetroactive) {
            EventManager.emit(PluginEvent.PriceUpdate, { provider, modelId, priceInfo });
        }
    }

    static setConfirmedPrice(modelId: string, provider: string, priceInfo: PriceInfo): void {
        this.ensureInitialized();
        this.setConfirmedPriceWithRetroactive(modelId, provider, priceInfo, true);
    }

    static setConfirmedPriceWithRetroactive(modelId: string, provider: string, priceInfo: PriceInfo, applyRetroactive: boolean): void {
        this.ensureInitialized();
        if (!this.cachedConfirmed[provider]) {
            this.cachedConfirmed[provider] = {};
        }
        this.cachedConfirmed[provider][modelId] = priceInfo;
        this.debouncedSaveConfirmed();
        if (applyRetroactive) {
            EventManager.emit(PluginEvent.PriceUpdate, { provider, modelId, priceInfo });
        }
    }

    static removeTemporaryModel(modelId: string, provider: string): boolean {
        this.ensureInitialized();
        if (this.cachedTemporary[provider] && this.cachedTemporary[provider][modelId]) {
            delete this.cachedTemporary[provider][modelId];
            if (Object.keys(this.cachedTemporary[provider]).length === 0) {
                delete this.cachedTemporary[provider];
            }
            this.debouncedSaveTemporary();
            EventManager.emit(PluginEvent.PriceUpdate, { provider, modelId, priceInfo: null });
            return true;
        }
        return false;
    }

    static removeConfirmedModel(modelId: string, provider: string): boolean {
        this.ensureInitialized();
        if (this.cachedConfirmed[provider] && this.cachedConfirmed[provider][modelId]) {
            delete this.cachedConfirmed[provider][modelId];
            if (Object.keys(this.cachedConfirmed[provider]).length === 0) {
                delete this.cachedConfirmed[provider];
            }
            this.debouncedSaveConfirmed();
            EventManager.emit(PluginEvent.PriceUpdate, { provider, modelId, priceInfo: null });
            return true;
        }
        return false;
    }

    static hasTemporaryPrice(): boolean {
        this.ensureInitialized();
        return Object.keys(this.cachedTemporary).length > 0;
    }

    static getTemporaryPrice(): ProviderPrice {
        this.ensureInitialized();
        return this.cachedTemporary;
    }

    static getConfirmedPrice(): ProviderPrice {
        this.ensureInitialized();
        return this.cachedConfirmed;
    }

    static renameProvider(oldKey: string, newKey: string): void {
        if (oldKey === newKey) return;
        
        this.ensureInitialized();
        let changed = false;
        
        if (this.cachedConfirmed[oldKey]) {
            this.cachedConfirmed[newKey] = {
                ...this.cachedConfirmed[newKey],
                ...this.cachedConfirmed[oldKey],
            };
            delete this.cachedConfirmed[oldKey];
            this.debouncedSaveConfirmed();
            changed = true;
        }

        if (this.cachedTemporary[oldKey]) {
            this.cachedTemporary[newKey] = {
                ...this.cachedTemporary[newKey],
                ...this.cachedTemporary[oldKey],
            };
            delete this.cachedTemporary[oldKey];
            this.debouncedSaveTemporary();
            changed = true;
        }
        
        if (changed) {
            EventManager.emit(PluginEvent.PriceUpdate, { provider: newKey, modelId: null, priceInfo: null });
        }
    }
    
    static clear(): void {
        this.debouncedSaveConfirmed.cancel();
        this.debouncedSaveTemporary.cancel();
        this.initialized = false;
        this.cachedConfirmed = {};
        this.cachedTemporary = {};
    }
}
