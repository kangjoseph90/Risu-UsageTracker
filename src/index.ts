import { Logger } from "./logger";
import { UsageTracker } from "./tracker/usage";
import { RisuAPI } from "./risuAPI";

const usageTracker = new UsageTracker();

RisuAPI.onUnload(() => {
    usageTracker.destroy();
});