import { Logger } from "./logger";
import { UsageTracker } from "./tracker/usage";
import { RisuAPI } from "./risuAPI";
import { RootUI } from "./ui/root";

const usageTracker = new UsageTracker();
const rootUI = new RootUI();

RisuAPI.onUnload(() => {
    usageTracker.destroy();
    rootUI.destroy()
});