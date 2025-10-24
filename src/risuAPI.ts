import { PLUGIN_NAME } from './consts'
import { RISU_ARGS } from './consts/args';
import { ReplacerFunction, ReplacerType, RisuArg, RisuArgType } from './types'

const rawAPI = {
    //@ts-ignore
    addRisuReplacer,
    //@ts-ignore
    removeRisuReplacer,
    //@ts-ignore
    onUnload,
    //@ts-ignore
    setArg,
    //@ts-ignore
    getArg,
}

function getFullName(name: string) {
    return `${PLUGIN_NAME}::${name}`
}

/**
 * setArg,
 * getArg,
 * addRisuReplacer,
 * removeRisuReplacer,
 * onUnload
 */
export class RisuAPI {
    static setArg(name: string, value: string | number) {
        if(RISU_ARGS[name] === undefined) return;
        switch(RISU_ARGS[name]) {
            case RisuArgType.Int:
                rawAPI.setArg(getFullName(name), Number(value));
                break;
            case RisuArgType.String:
                rawAPI.setArg(getFullName(name), String(value));
                break;
        }
    }
    
    static getArg(name: string) {
        if(RISU_ARGS[name] === undefined) return;
        switch(RISU_ARGS[name]) {
            case RisuArgType.Int:
                return Number(rawAPI.getArg(getFullName(name)));
            case RisuArgType.String:
                return String(rawAPI.getArg(getFullName(name)));
        }
    }

    static addRisuReplacer(name: ReplacerType, func: ReplacerFunction) {
        rawAPI.addRisuReplacer(name as string, func)
    }

    static removeRisuReplacer(name: ReplacerType, func: ReplacerFunction) {
        rawAPI.removeRisuReplacer(name as string, func)
    }

    static onUnload(func: () => void | Promise<void>) {
        rawAPI.onUnload(func)
    }
}

