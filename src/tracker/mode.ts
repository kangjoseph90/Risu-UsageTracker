import { Logger } from "../logger";
import { RisuAPI } from "../risuAPI";
import { ReplacerFunction, ReplacerType, RequestType } from "../types";
import { parseRequestType } from "../util";

/**
 * getCurrentMode,
 */
export class ModeTracker {
    private lastMode = RequestType.Unknown

    constructor() {
        const replacer: ReplacerFunction = (content: any[], type: string) => {
            this.lastMode = parseRequestType(type);
            Logger.log(`ModeTracker: Detected mode - ${this.lastMode}`);
            return content;
        }
        const unload = () => {
            RisuAPI.removeRisuReplacer(ReplacerType.BeforeRequest, replacer);
        }

        RisuAPI.addRisuReplacer(ReplacerType.BeforeRequest, replacer.bind(this));
        RisuAPI.onUnload(unload.bind(this));
    }

    getCurrentMode(): RequestType {
        return this.lastMode;
    }
}