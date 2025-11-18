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
import { PLUGIN_NAME } from './plugin';
import { Logger } from './logger';

// Ensure our plugin is at the top of the database plugins
const db: {
    plugins: {
        name: string,
    }[];
    //@ts-ignore
} = getDatabase()

const index = db.plugins.findIndex((p) => p.name === PLUGIN_NAME);

if (index > 0) {
    setTimeout(() => {
        Logger.log(`Moving ${PLUGIN_NAME} to the top of the plugins.`);
        const pluginData = db.plugins.splice(index, 1)[0];
        db.plugins.unshift(pluginData);
        //@ts-ignore
        setDatabaseLite(db);
        //@ts-ignore
        loadPlugins();
    }, 3000);
}

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


