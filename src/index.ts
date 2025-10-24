import { Logger } from "./logger";
import { UsageTracker } from "./tracker/usage";

const usageTracker = new UsageTracker();
Logger.log('UsageTracker initialized.');