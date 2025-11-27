import { PLUGIN_NAME, RISU_ARGS, RisuArgType } from './plugin'

export {
    ScriptMode, ReplacerType,
    RisuAPI
};
export type {
    GlobalFetchArgs,
    GlobalFetchResult,
    NativeFetchArgs,
    PluginV2ProviderArgument,
    PluginV2ProviderOptions,
    EditFunction, ReplacerFunction
};

interface GlobalFetchArgs {
  plainFetchForce?: boolean;
  plainFetchDeforce?: boolean;
  body?: any;
  headers?: { [key: string]: string };
  rawResponse?: boolean;
  method?: 'POST' | 'GET';
  abortSignal?: AbortSignal;
  useRisuToken?: boolean;
  chatId?: string;
}

interface GlobalFetchResult {
  ok: boolean;
  data: any;
  headers: { [key: string]: string };
  status: number;
}

interface NativeFetchArgs {
    body?:string|Uint8Array|ArrayBuffer,
    headers?:{[key:string]:string},
    method?:"POST"|"GET"|"PUT"|"DELETE",
    signal?:AbortSignal,
    useRisuTk?:boolean,
    chatId?:string
}

type PluginV2ProviderArgument = {
    prompt_chat: any[] // OpenAIChat[]
    frequency_penalty: number
    min_p: number
    presence_penalty: number
    repetition_penalty: number
    top_k: number
    top_p: number
    temperature: number
    mode: string
    max_tokens: number
}

type PluginV2ProviderOptions = {
    tokenizer?: string
    tokenizerFunc?: (content: string) => number[] | Promise<number[]>
}

type EditFunction = (content: string) => string | Promise<string>

enum ScriptMode {
    EditInput = 'input',
    EditOutput = 'output',
    EditProcess = 'process',
    EditDisplay = 'display'
}

type ReplacerFunction = (content: any[], type: string) => any[] | Promise<any[]>

enum ReplacerType {
    BeforeRequest = 'beforeRequest',
    AfterRequest = 'afterRequest',
}

// Mock implementation for development
const storage = typeof localStorage !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {} };

const mockAPI = {
    risuFetch: async () => ({ ok: true, data: {}, headers: {}, status: 200 }),
    nativeFetch: async () => new Response(),
    getArg: (name: string) => {
        // Remove PLUGIN_NAME:: prefix for local storage
        const key = name.split('::').pop() || name;
        return storage.getItem(key) || "";
    },
    setArg: (name: string, value: any) => {
        const key = name.split('::').pop() || name;
        storage.setItem(key, String(value));
    },
    getChar: () => ({}),
    setChar: () => {},
    addProvider: () => {},
    addRisuScriptHandler: () => {},
    removeRisuScriptHandler: () => {},
    addRisuReplacer: () => {},
    removeRisuReplacer: () => {},
    onUnload: (cb: any) => { (window as any)._onUnload = cb; },
    getDatabase: () => ({}),
    setDatabaseLite: () => {},
    loadPlugins: () => {},
}

const getRawAPI = () => {
    // Check for risuFetch on window or globalThis
    const g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : {});

    if (typeof (g as any).risuFetch !== 'undefined') {
        return {
            //@ts-ignore
            risuFetch: (g as any).risuFetch,
            //@ts-ignore
            nativeFetch: (g as any).nativeFetch,
            //@ts-ignore
            getArg: (g as any).getArg,
            //@ts-ignore
            setArg: (g as any).setArg,
            //@ts-ignore
            getChar: (g as any).getChar,
            //@ts-ignore
            setChar: (g as any).setChar,
            //@ts-ignore
            addProvider: (g as any).addProvider,
            //@ts-ignore
            addRisuScriptHandler: (g as any).addRisuScriptHandler,
            //@ts-ignore
            removeRisuScriptHandler: (g as any).removeRisuScriptHandler,
            //@ts-ignore
            addRisuReplacer: (g as any).addRisuReplacer,
            //@ts-ignore
            removeRisuReplacer: (g as any).removeRisuReplacer,
            //@ts-ignore
            onUnload: (g as any).onUnload,
            //@ts-ignore
            getDatabase: (g as any).getDatabase,
            //@ts-ignore
            setDatabaseLite: (g as any).setDatabaseLite,
            //@ts-ignore
            loadPlugins: (g as any).loadPlugins,
        };
    } else {
        return mockAPI;
    }
}

// Ensure lazy loading of API to avoid init issues
const apiProxy = new Proxy({}, {
    get: (_target, prop) => {
        return (getRawAPI() as any)[prop];
    }
});

function getFullName(name: string) {
    return `${PLUGIN_NAME}::${name}`
}

/**
 * risuFetch, 
 * nativeFetch, 
 * getArg, 
 * setArg, 
 * getChar,
 * setChar, 
 * addProvider,
 * addRisuScriptHandler,
 * removeRisuScriptHandler,
 * addRisuReplacer,
 * removeRisuReplacer,
 * onUnload
 */
class RisuAPI {
    static risuFetch(url: string, args?: GlobalFetchArgs): Promise<GlobalFetchResult> {
        return getRawAPI().risuFetch(url, args);
    }   
    static nativeFetch(url: string, args: NativeFetchArgs): Promise<Response> {
        return getRawAPI().nativeFetch(url, args);
    }
    static getArg(name: string): string | number | undefined {
        if(RISU_ARGS[name] === undefined) return;
        switch(RISU_ARGS[name]) {
            case RisuArgType.Int:
                return Number(getRawAPI().getArg(getFullName(name)));
            case RisuArgType.String:
                return String(getRawAPI().getArg(getFullName(name)));
        }
    }
    static setArg(name: string, value: string | number) {
        if(RISU_ARGS[name] === undefined) return;
        switch(RISU_ARGS[name]) {
            case RisuArgType.Int:
                getRawAPI().setArg(getFullName(name), Number(value));
                break;
            case RisuArgType.String:
                getRawAPI().setArg(getFullName(name), String(value));
                break;
        }
    }
    static getChar(): any {
        return getRawAPI().getChar();
    }
    static setChar(char: any) {
        getRawAPI().setChar(char);
    }
    static addProvider(name: string, func: (arg: PluginV2ProviderArgument, abortSignal?: AbortSignal) => Promise<{ success: boolean, content: string }>, options?: PluginV2ProviderOptions) {
        getRawAPI().addProvider(name, func, options);
    }
    static addRisuScriptHandler(mode: ScriptMode, func: EditFunction) {
        getRawAPI().addRisuScriptHandler(mode, func);
    }
    static removeRisuScriptHandler(mode: ScriptMode, func: EditFunction) {
        getRawAPI().removeRisuScriptHandler(mode, func);
    }
    static addRisuReplacer(type: ReplacerType, func: ReplacerFunction) {
        getRawAPI().addRisuReplacer(type, func);
    }
    static removeRisuReplacer(type: ReplacerType, func: ReplacerFunction) {
        getRawAPI().removeRisuReplacer(type, func);
    }
    static onUnload(callback: () => void) {
        getRawAPI().onUnload(callback);
    }
    static getDatabase() {
        return getRawAPI().getDatabase();
    }
    static setDatabaseLite(db: any) {
        getRawAPI().setDatabaseLite(db);
    }
    static loadPlugins() {
        getRawAPI().loadPlugins();
    }
}
