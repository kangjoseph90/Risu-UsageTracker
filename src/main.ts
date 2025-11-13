//@ts-ignore
import './style.css';
import { UsageTracker } from "./tracker/usage";
import { RisuAPI } from "./api";
import { UI } from "./ui";
import { LanguageManager } from './manager/language';
import { ProviderManager } from './manager/provider';
import { PriceManager } from './manager/price';
import { UsageManager } from './manager/usage';
import { PLUGIN_TITLE } from './plugin';

//@ts-ignore
const isTauri = !!window.__TAURI_INTERNALS__

if (isTauri) {
    alert(`${PLUGIN_TITLE} is not supported in Tauri environment.`);;
} else {
    // Initialize all managers
    LanguageManager.init();
    ProviderManager.init();
    PriceManager.init();
    UsageManager.init();
    
    const usageTracker = new UsageTracker();
    const ui = new UI();
    
    RisuAPI.onUnload(() => {
        usageTracker.destroy();
        ui.destroy();
    });
}

