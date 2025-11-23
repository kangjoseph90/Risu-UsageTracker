import { BudgetManager } from "./budget";
import { ErrorManager } from "./error";
import { LanguageManager } from "./language";
import { PriceManager } from "./price";
import { ProviderManager } from "./provider";
import { UsageManager } from "./usage";

export function initManagers() {
    LanguageManager.init();
    ProviderManager.init();
    PriceManager.init();
    UsageManager.init();
    BudgetManager.init();
    ErrorManager.init();
}