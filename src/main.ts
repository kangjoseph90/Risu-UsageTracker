//@ts-ignore
import './style.css';
import { UsageTracker } from "./tracker/usage";
import { RisuAPI } from "./api";
import { UI } from "./ui";
import { movePluginToTop, checkDuplicate } from './util';
import { UpdateManager } from './manager/update';
import { EventManager, PluginEvent } from './manager/event';

EventManager.emit(PluginEvent.GlobalInit);

const usageTracker = new UsageTracker();
const ui = new UI();

RisuAPI.onUnload(() => {
    usageTracker.destroy();
    ui.destroy();
    EventManager.close();
});


(async () => {
    if (await checkDuplicate()) return;
    if (movePluginToTop()) return;
    if (await UpdateManager.check()) return;
})()
