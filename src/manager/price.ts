import { PRICE_ARG, PRICE_TEMP_ARG } from "../plugin";
import { DEFAULT_PRICE } from "../consts/price";
import { RisuAPI } from "../api";
import type { PriceInfo, ProviderPrice } from "../types";
import { UsageManager } from "./usage";
import { debounce } from "../util";

export class PriceManager {
    private static cachedConfirmed: ProviderPrice = {};
    private static cachedTemporary: ProviderPrice = {};
    private static readonly DEBOUNCE_WAIT = 500;

    private static debouncedSaveConfirmed = debounce(() => {
        RisuAPI.setArg(PRICE_ARG, JSON.stringify(PriceManager.cachedConfirmed));
    }, PriceManager.DEBOUNCE_WAIT);

    private static debouncedSaveTemporary = debounce(() => {
        RisuAPI.setArg(PRICE_TEMP_ARG, JSON.stringify(PriceManager.cachedTemporary));
    }, PriceManager.DEBOUNCE_WAIT);

    static init() {
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
    }

    static getModelPrice(modelId: string, provider: string): PriceInfo {
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
        this.setTemporaryPriceWithRetroactive(modelId, provider, priceInfo, true);
    }

    static setTemporaryPriceWithRetroactive(modelId: string, provider: string, priceInfo: PriceInfo, applyRetroactive: boolean): void {
        if (!this.cachedTemporary[provider]) {
            this.cachedTemporary[provider] = {};
        }
        this.cachedTemporary[provider][modelId] = priceInfo;
        this.debouncedSaveTemporary();
        if (applyRetroactive) {
            UsageManager.updateCostsForModel(provider, modelId, priceInfo);
        }
    }

    static setConfirmedPrice(modelId: string, provider: string, priceInfo: PriceInfo): void {
        this.setConfirmedPriceWithRetroactive(modelId, provider, priceInfo, true);
    }

    static setConfirmedPriceWithRetroactive(modelId: string, provider: string, priceInfo: PriceInfo, applyRetroactive: boolean): void {
        if (!this.cachedConfirmed[provider]) {
            this.cachedConfirmed[provider] = {};
        }
        this.cachedConfirmed[provider][modelId] = priceInfo;
        this.debouncedSaveConfirmed();
        if (applyRetroactive) {
            UsageManager.updateCostsForModel(provider, modelId, priceInfo);
        }
    }

    static removeTemporaryModel(modelId: string, provider: string): boolean {
        if (this.cachedTemporary[provider] && this.cachedTemporary[provider][modelId]) {
            delete this.cachedTemporary[provider][modelId];
            if (Object.keys(this.cachedTemporary[provider]).length === 0) {
                delete this.cachedTemporary[provider];
            }
            this.debouncedSaveTemporary();
            return true;
        }
        return false;
    }

    static removeConfirmedModel(modelId: string, provider: string): boolean {
        if (this.cachedConfirmed[provider] && this.cachedConfirmed[provider][modelId]) {
            delete this.cachedConfirmed[provider][modelId];
            if (Object.keys(this.cachedConfirmed[provider]).length === 0) {
                delete this.cachedConfirmed[provider];
            }
            this.debouncedSaveConfirmed();
            return true;
        }
        return false;
    }

    static hasTemporaryPrice(): boolean {
        return Object.keys(this.cachedTemporary).length > 0;
    }

    static getTemporaryPrice(): ProviderPrice {
        return this.cachedTemporary;
    }

    static getConfirmedPrice(): ProviderPrice {
        return this.cachedConfirmed;
    }

    static renameProvider(oldKey: string, newKey: string): void {
        if (this.cachedConfirmed[oldKey]) {
            this.cachedConfirmed[newKey] = this.cachedConfirmed[oldKey];
            delete this.cachedConfirmed[oldKey];
            this.debouncedSaveConfirmed();
        }

        if (this.cachedTemporary[oldKey]) {
            this.cachedTemporary[newKey] = this.cachedTemporary[oldKey];
            delete this.cachedTemporary[oldKey];
            this.debouncedSaveTemporary();
        }
    }
}
