import { BudgetManager } from "./budget";
import { ErrorManager } from "./error";
import { EventManager, PluginEvent } from "./event";
import { LanguageManager } from "./language";
import { PriceManager } from "./price";
import { ProviderManager } from "./provider";
import { UsageManager } from "./usage";


EventManager.on(PluginEvent.GlobalInit, initManagers); 

export function initManagers() {
    LanguageManager.init();
    ProviderManager.init();
    PriceManager.init();
    UsageManager.init();
    BudgetManager.init();
    ErrorManager.init();
}