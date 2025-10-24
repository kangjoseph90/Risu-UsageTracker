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
    PriceManager.setModelPrice(modelId, url, emptyPrice);
    return emptyPrice;
}

/**
 * getModelPrice,
 * setModelPrice,
 * confirmTemporaryPrice,
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
            this.setModelPrice(modelId, url, price);
            return price;
        }
        
        return initModelPrice(modelId, url);
    }

    static setModelPrice(modelId: string, url: string, priceInfo: PriceInfo): void {
        const tempPrice = getTemporaryPrice();
        const providerKey = getProviderKey(url);
        
        if (!providerKey) {
            const urlObj = new URL(url);
            const newProviderKey = urlObj.hostname;
            tempPrice[newProviderKey] = { [modelId]: priceInfo };
        } else {
            if (!tempPrice[providerKey]) {
                tempPrice[providerKey] = {};
            }
            tempPrice[providerKey][modelId] = priceInfo;
        }

        setTemporaryPrice(tempPrice);
    }

    static confirmTemporaryPrice(modelId?: string, url?: string): void {
        const tempPrice = getTemporaryPrice();
        const confirmedPrice = getConfirmedPrice();

        if (modelId && url) {
            // 특정 모델만 이동
            const providerKey = getProviderKey(url);

            if (providerKey && tempPrice[providerKey] && tempPrice[providerKey][modelId]) {
                // confirmed로 이동
                if (!confirmedPrice[providerKey]) {
                    confirmedPrice[providerKey] = {};
                }
                confirmedPrice[providerKey][modelId] = tempPrice[providerKey][modelId];
                
                // temporary에서 삭제
                delete tempPrice[providerKey][modelId];
                
                // 빈 provider 객체 정리
                if (Object.keys(tempPrice[providerKey]).length === 0) {
                    delete tempPrice[providerKey];
                }
            }
        } else {
            // 모든 임시 가격을 확정으로 이동
            for (const providerKey of Object.keys(tempPrice)) {
                if (!confirmedPrice[providerKey]) {
                    confirmedPrice[providerKey] = {};
                }
                confirmedPrice[providerKey] = {
                    ...confirmedPrice[providerKey],
                    ...tempPrice[providerKey]
                };
            }
            // 모든 임시 가격 삭제
            setTemporaryPrice({});
        }

        setConfirmedPrice(confirmedPrice);

        if (modelId && url) {
            setTemporaryPrice(tempPrice);
        }
    }
}