//@ts-ignore
import './style.css';
import { UsageTracker } from "./tracker/usage";
import { RisuAPI } from "./api";
import { UI } from "./ui";
import { LanguageManager } from './manager/language';
import { ProviderManager } from './manager/provider';
import { PriceManager } from './manager/price';
import { UsageManager } from './manager/usage';
import { BudgetManager } from './manager/budget';
import { movePluginToTop, checkDuplicate } from './util';
import { UpdateManager } from './manager/update';

// Initialize all managers
LanguageManager.init();
ProviderManager.init();
PriceManager.init();
UsageManager.init();
BudgetManager.init();

const usageTracker = new UsageTracker();
const ui = new UI();

RisuAPI.onUnload(() => {
    usageTracker.destroy();
    ui.destroy();
});


(async () => {
    if (await checkDuplicate()) return;
    if (movePluginToTop()) return;
    if (await UpdateManager.check()) return;
})()
