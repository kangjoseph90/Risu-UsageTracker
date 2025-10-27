//@ts-ignore
import './style.css';
import { UsageTracker } from "./tracker/usage";
import { RisuAPI } from "./api";
import { UI } from "./ui/UI";

const usageTracker = new UsageTracker();
const ui = new UI();

RisuAPI.onUnload(() => {
    usageTracker.destroy();
    ui.destroy();
});
