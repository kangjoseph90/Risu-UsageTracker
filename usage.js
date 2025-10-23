//@name usage
//@display-name usage

const RisuAPI = {
    addRisuReplacer,
    removeRisuReplacer,
    onUnload,
    setArg,
    getArg,
};

class Logger {
    static log(...message) {
        console.log("[Usage][Log]", ...message);
    }
    static error(...message) {
        console.error("[Usage][Error]", ...message);
    }   
    static warn(...message) {
        console.warn("[Usage][Warning]", ...message);
    }
    static info(...message) {
        console.info("[Usage][Info]", ...message);
    }
}

class SettingManager {

}

class UsageManager {

}

class FetchWrapper {
    constructor() {
        this.originalFetch = window.fetch;
        this.init();
    }
}

class ModeTracker {

}

class UsageTracker {

}









class SettingUI {

}

class UsageUI {

}

class UI {

}