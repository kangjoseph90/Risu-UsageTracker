import { PRICE_ARG, PRICE_TEMP_ARG } from "../consts";
import { DEFAULT_PRICE } from "../consts/price";
import { RisuAPI } from "../risuAPI";
import { PriceInfo, ProviderPrice } from "../types";

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
    static getModelPrice(modelId: string, provider: string): PriceInfo {
        const priceData = getPrice();

        // 저장된 가격 정보 조회
        const savedPrice = priceData[provider];
        if (savedPrice && savedPrice[modelId]) {
            return savedPrice[modelId];
        }

        // 디폴트 가격 정보 조회
        const defaultPrice = DEFAULT_PRICE[provider];
        if (defaultPrice && defaultPrice[modelId]) {
            // 확인된 가격 정보 저장
            this.setConfirmedPrice(modelId, provider, defaultPrice[modelId]);
            return defaultPrice[modelId];
        }

        // 가격 정보가 없으면 0으로 초기화
        const tempPrice: PriceInfo = {
            inputPrice: 0,
            outputPrice: 0,
        };

        this.setTemporaryPrice(modelId, provider, tempPrice);
        return tempPrice;
    }

    static setTemporaryPrice(modelId: string, provider: string, priceInfo: PriceInfo): void {
        const tempPrice = getTemporaryPrice();
        if(!tempPrice[provider]) {
            tempPrice[provider] = {};
        }
        tempPrice[provider][modelId] = priceInfo;
        setTemporaryPrice(tempPrice);
    }

    static setConfirmedPrice(modelId: string, provider: string, priceInfo: PriceInfo): void {
        const confirmedPrice = getConfirmedPrice();
        if(!confirmedPrice[provider]) {
            confirmedPrice[provider] = {};
        }
        confirmedPrice[provider][modelId] = priceInfo;
        setConfirmedPrice(confirmedPrice);
    }

    static removeTemporaryModel(modelId: string, provider: string): boolean {
        const tempPrice = getTemporaryPrice();
        if (tempPrice[provider] && tempPrice[provider][modelId]) {
            delete tempPrice[provider][modelId];
            if (Object.keys(tempPrice[provider]).length === 0) {
                delete tempPrice[provider];
            }
            setTemporaryPrice(tempPrice);
            return true;
        }
        return false;
    }

    static removeConfirmedModel(modelId: string, provider: string): boolean {
        const confirmedPrice = getConfirmedPrice();
        if (confirmedPrice[provider] && confirmedPrice[provider][modelId]) {
            delete confirmedPrice[provider][modelId];
            if (Object.keys(confirmedPrice[provider]).length === 0) {
                delete confirmedPrice[provider];
            }
            setConfirmedPrice(confirmedPrice);
            return true;
        }
        return false;
    }

    static hasTemporaryPrice(modelId: string, provider: string): boolean {
        const tempPrice = getTemporaryPrice();
        return !!(tempPrice[provider] && tempPrice[provider][modelId]);
    }

    static getTemporaryPrice(): ProviderPrice {
        return getTemporaryPrice();
    }

    static getConfirmedPrice(): ProviderPrice {
        return getConfirmedPrice();
    }

    static renameProvider(oldKey: string, newKey: string): void {
        // Confirmed Price 변경
        const confirmedPrice = getConfirmedPrice();
        if (confirmedPrice[oldKey]) {
            confirmedPrice[newKey] = confirmedPrice[oldKey];
            delete confirmedPrice[oldKey];
            setConfirmedPrice(confirmedPrice);
        }

        // Temporary Price 변경
        const tempPrice = getTemporaryPrice();
        if (tempPrice[oldKey]) {
            tempPrice[newKey] = tempPrice[oldKey];
            delete tempPrice[oldKey];
            setTemporaryPrice(tempPrice);
        }
    }
}
