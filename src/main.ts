//@ts-ignore
import './style.css';
import { UsageTracker } from "./tracker/usage";
import { RisuAPI } from "./api";
import { UI } from "./ui";
import { movePluginToTop, checkDuplicate } from './util';
import { UpdateManager } from './manager/update';
import { initManagers } from './manager';
import { ScreenTimeManager } from './manager/screentime';

// Initialize all managers
initManagers();

const usageTracker = new UsageTracker();
const ui = new UI();

RisuAPI.onUnload(() => {
    usageTracker.destroy();
    ui.destroy();
    ScreenTimeManager.destroy();
});


(async () => {
    if (await checkDuplicate()) return;
    if (movePluginToTop()) return;
    if (await UpdateManager.check()) return;
})()
