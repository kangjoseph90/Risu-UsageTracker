import { PRICE_ARG, PRICE_TEMP_ARG } from "../consts";
import { RisuAPI } from "../risuAPI";
import { PriceInfo, ProviderPrice } from "../types";
import { DEFAULT_PRICE } from "../consts/price";

function getConfirmedPrice(): ProviderPrice {
    try {
        const priceData: ProviderPrice = JSON.parse(RisuAPI.getArg(PRICE_ARG) as string);
        return priceData;
    } catch (e) {
        setConfirmedPrice({});
        return {};
    }
}

function setConfirmedPrice(priceData: ProviderPrice): void {
    RisuAPI.setArg(PRICE_ARG, JSON.stringify(priceData));
}

function getTemporaryPrice(): ProviderPrice {
    try {
        const priceData: ProviderPrice = JSON.parse(RisuAPI.getArg(PRICE_TEMP_ARG) as string);
        return priceData;
    } catch (e) {
        setTemporaryPrice({});
        return {};
    }
}

function setTemporaryPrice(priceData: ProviderPrice): void {
    RisuAPI.setArg(PRICE_TEMP_ARG, JSON.stringify(priceData));
}

function getPrice(): ProviderPrice {
    const tempPrice = getTemporaryPrice();
    const confirmedPrice = getConfirmedPrice();
    return { ...confirmedPrice, ...tempPrice };
}

function getProviderKey(url: string): string | null {
    const priceData = getPrice();
    for (const key of Object.keys(priceData)) {
        if (url.includes(key)) {
            return key;
        }
    }
    
    for (const key of Object.keys(DEFAULT_PRICE)) {
        if (url.includes(key)) {
            return key;
        }
    }
    
    return null;
}

function initModelPrice(modelId: string, url: string): PriceInfo {
    const emptyPrice: PriceInfo = {
        inputCost: 0,
        cachedInputCost: 0,
        outputCost: 0,
    };
    PriceManager.setTemporaryPrice(modelId, url, emptyPrice);
    return emptyPrice;
}

/**
 * getModelPrice,
 * setTemporaryPrice,
 * setConfirmedPrice,
 * removeTemporaryModel,
 * removeConfirmedModel,
 * hasTemporaryPrice,
 * getTemporaryPrice,
 * getConfirmedPrice,
 */
export class PriceManager {
    static getModelPrice(modelId: string, url: string): PriceInfo {
        const priceData = getPrice();
        const providerKey = getProviderKey(url);

        if (!providerKey) {
            return initModelPrice(modelId, url);
        }

        const savedModelPrice = priceData[providerKey];
        if (savedModelPrice && savedModelPrice[modelId]) {
            return savedModelPrice[modelId];
        }
        
        const defaultModelPrice = DEFAULT_PRICE[providerKey];
        if (defaultModelPrice && defaultModelPrice[modelId]) {
            const price = defaultModelPrice[modelId];
            this.setConfirmedPrice(modelId, providerKey, price);
            return price;
        }
        
        return initModelPrice(modelId, url);
    }

    static setTemporaryPrice(modelId: string, url: string, priceInfo: PriceInfo): void {
        const tempPrice = getTemporaryPrice();
        if(!tempPrice[url]) {
            tempPrice[url] = {};
        }
        tempPrice[url][modelId] = priceInfo;
        setTemporaryPrice(tempPrice);
    }

    static setConfirmedPrice(modelId: string, url: string, priceInfo: PriceInfo): void {
        const confirmedPrice = getConfirmedPrice();
        if(!confirmedPrice[url]) {
            confirmedPrice[url] = {};
        }
        confirmedPrice[url][modelId] = priceInfo;
        setConfirmedPrice(confirmedPrice);
    }

    static removeTemporaryModel(modelId: string, url: string): boolean {
        const tempPrice = getTemporaryPrice();  
        if (tempPrice[url] && tempPrice[url][modelId]) {
            delete tempPrice[url][modelId];
            if (Object.keys(tempPrice[url]).length === 0) {
                delete tempPrice[url];
            }
            setTemporaryPrice(tempPrice);
            return true;
        }
        return false;
    }

    static removeConfirmedModel(modelId: string, url: string): boolean {
        const confirmedPrice = getConfirmedPrice();
        if (confirmedPrice[url] && confirmedPrice[url][modelId]) {
            delete confirmedPrice[url][modelId];
            if (Object.keys(confirmedPrice[url]).length === 0) {
                delete confirmedPrice[url];
            }
            setConfirmedPrice(confirmedPrice);
            return true;
        }
        return false;
    }

    static hasTemporaryPrice(modelId: string, url: string): boolean {
        const tempPrice = getTemporaryPrice();  
        return !!(tempPrice[url] && tempPrice[url][modelId]);
    }

    static getTemporaryPrice(): ProviderPrice {
        return getTemporaryPrice();
    }

    static getConfirmedPrice(): ProviderPrice {
        return getConfirmedPrice();
    }
}
