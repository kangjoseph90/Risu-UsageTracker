import { Logger } from "../logger";
import { RisuAPI } from "../risuAPI";
import { ReplacerFunction, ReplacerType, RequestType } from "../types";
import { parseRequestType } from "../util";

/**
 * getCurrentMode,
 */
export class ModeTracker {
    private lastMode = RequestType.Unknown
    private replacer: ReplacerFunction

    constructor() {
        this.replacer = (content: any[], type: string) => {
            this.lastMode = parseRequestType(type);
            return content;
        };
        RisuAPI.addRisuReplacer(ReplacerType.BeforeRequest, this.replacer);
    }

    getCurrentMode(): RequestType {
        const mode = this.lastMode;
        this.lastMode = RequestType.Unknown;
        return mode;
    }

    destroy() {
        RisuAPI.removeRisuReplacer(ReplacerType.BeforeRequest, this.replacer);
    }
}