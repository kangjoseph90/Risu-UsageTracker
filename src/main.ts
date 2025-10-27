//@ts-ignore
import './style.css';
import MyPopup from './MyPopup.svelte';
import { UsageTracker } from "./tracker/usage";
import { RisuAPI } from "./api";
import { RootUI } from "./ui/root";

const usageTracker = new UsageTracker();
const rootUI = new RootUI();

RisuAPI.onUnload(() => {
    usageTracker.destroy();
    rootUI.destroy()
});
