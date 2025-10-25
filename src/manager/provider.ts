import { PROVIDER_MAP_ARG } from "../consts";
import { DEFAULT_PROVIDER } from "../consts/provider";
import { RisuAPI } from "../risuAPI";
import { ProviderMap } from "../types";

function initProviderMap() {
    setProviderMap({})
}

function getProviderMap(): ProviderMap {
    try {
        const map: ProviderMap = JSON.parse(RisuAPI.getArg(PROVIDER_MAP_ARG) as string);
        return map;
    } catch (e) {
        initProviderMap();
        const map: ProviderMap = JSON.parse(RisuAPI.getArg(PROVIDER_MAP_ARG) as string);
        return map;
    }
}

function setProviderMap(map: ProviderMap) {
    RisuAPI.setArg(PROVIDER_MAP_ARG, JSON.stringify(map))
}

/**
 * getProvider
 * setProvider
 * removeProvider
 * getAllProviders
 */
export class ProviderManager {
    static getProvider(url: string): string {
        // 저장된 매핑에서 조회
        const map = getProviderMap();
        if (url in map) {
            return map[url];
        }

        // 디폴트 매핑 조회
        if (url in DEFAULT_PROVIDER) {
            const provider = DEFAULT_PROVIDER[url];
            // 디폴트 매핑 저장
            this.setProvider(url, provider);
            return provider;
        }

        // url -> url 매핑으로 초기화
        this.setProvider(url, url);
        return url;
    }

    static setProvider(url: string, providerName: string): void {
        const map = getProviderMap();
        map[url] = providerName;
        setProviderMap(map);
    }

    static removeProvider(url: string): boolean {
        const map = getProviderMap();
        if (url in map) {
            delete map[url];
            setProviderMap(map);
            return true;
        }
        return false;
    }

    static getAllProviders(): ProviderMap {
        return getProviderMap();
    }

    static clearAll(): void {
        initProviderMap();
    }

    static renameProvider(oldName: string, newName: string): number {
        const map = getProviderMap();
        let count = 0;
        
        for (const [url, providerName] of Object.entries(map)) {
            if (providerName === oldName) {
                map[url] = newName;
                count++;
            }
        }
        
        if (count > 0) {
            setProviderMap(map);
        }
        
        return count;
    }
}
