import { Logger } from "../logger";

export enum PluginEvent {
    UsageAddRecord = "usage:add_record",
    UsageUpdateRecord = "usage:update_record",
    UsageRemoveRecord = "usage:remove_record",
    ErrorAddRecord = "error:add_record",
    ErrorRemoveRecord = "error:remove_record",
    BudgetAddRule = "budget:add_rule",
    BudgetUpdateRule = "budget:update_rule",
    BudgetRemoveRule = "budget:remove_rule",
    GlobalInit = "global:init",
    LanguageChange = "language:change",
    PriceUpdate = "price:update",
    ProviderRename = "provider:rename",
}

type EventHandler<T = any> = (data: T) => void;

export class EventManager {
    private static listeners: Map<PluginEvent, Set<EventHandler>> = new Map();

    public static on<T = any>(event: PluginEvent, handler: EventHandler<T>): void {
        if (!EventManager.listeners.has(event)) {
            EventManager.listeners.set(event, new Set());
        }
        EventManager.listeners.get(event)!.add(handler);
    }

    public static off<T = any>(event: PluginEvent, handler: EventHandler<T>): void {
        const handlers = EventManager.listeners.get(event);
        if (handlers) {
            handlers.delete(handler);
        }
    }

    public static emit<T = any>(event: PluginEvent, data?: T): void {
        const handlers = EventManager.listeners.get(event);
        if (handlers) {
            handlers.forEach((handler) => {
                try {
                    handler(data);
                } catch (error) {
                    Logger.error(`Error handling event ${event}:`, error);
                }
            });
        }
    }
}
