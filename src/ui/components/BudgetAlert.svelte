<script lang="ts">
    import { BudgetMonitor } from "../../manager/budget_monitor";
    import type { AlertState } from "../../manager/budget_monitor";
    import { AlertTriangle, AlertOctagon } from "lucide-svelte";
    import { fade, fly } from "svelte/transition";
    import DollarDisplay from "../components/DollarDisplay.svelte";
    import { onMount } from "svelte";

    let alerts: AlertState[] = [];
    let showTooltip = false;
    let container: HTMLDivElement;

    onMount(() => {
        const unsubscribe = BudgetMonitor.alerts.subscribe((value) => {
            alerts = value;
        });
        return unsubscribe;
    });

    $: maxLevel = alerts.length > 0
        ? alerts.some((a) => a.level === "critical")
            ? "critical"
            : alerts.some((a) => a.level === "danger")
              ? "danger"
              : "warning"
        : null;

    $: colorClass =
        maxLevel === "critical"
            ? "text-red-500 bg-red-500/10 border-red-500/50"
            : maxLevel === "danger"
              ? "text-orange-500 bg-orange-500/10 border-orange-500/50"
              : "text-yellow-500 bg-yellow-500/10 border-yellow-500/50";
</script>

{#if alerts.length > 0}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <div
        class="fixed top-4 right-20 z-[9999]"
        bind:this={container}
        on:mouseenter={() => (showTooltip = true)}
        on:mouseleave={() => (showTooltip = false)}
        transition:fade
    >
        <div
            class="p-2 rounded-full border backdrop-blur-sm shadow-lg cursor-pointer transition-colors duration-300 {colorClass} hover:bg-zinc-800"
        >
            {#if maxLevel === "critical" || maxLevel === "danger"}
                <AlertOctagon size={24} />
            {:else}
                <AlertTriangle size={24} />
            {/if}

            <!-- Badge count -->
            {#if alerts.length > 1}
                <div class="absolute -top-1 -right-1 bg-zinc-800 text-zinc-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-zinc-600">
                    {alerts.length}
                </div>
            {/if}
        </div>

        {#if showTooltip}
            <div
                class="absolute top-full right-0 mt-2 w-72 bg-zinc-900 border border-zinc-700/80 rounded-lg shadow-xl overflow-hidden backdrop-blur-md"
                transition:fly={{ y: 10, duration: 200 }}
            >
                <div class="px-4 py-2 bg-zinc-800/80 border-b border-zinc-700/60">
                    <h3 class="text-sm font-semibold text-zinc-200">Budget Alerts</h3>
                </div>
                <div class="max-h-60 overflow-y-auto divide-y divide-zinc-700/40">
                    {#each alerts as alert}
                        <div class="px-4 py-3 hover:bg-zinc-800/30 transition-colors">
                            <div class="flex justify-between items-start mb-1">
                                <span class="text-sm font-medium text-zinc-300 truncate pr-2" title={alert.ruleName}>
                                    {alert.ruleName}
                                </span>
                                <span class="text-xs font-mono {
                                    alert.level === 'critical' ? 'text-red-400' :
                                    alert.level === 'danger' ? 'text-orange-400' : 'text-yellow-400'
                                }">
                                    {alert.percentage.toFixed(1)}%
                                </span>
                            </div>

                            <div class="w-full bg-zinc-800 rounded-full h-1.5 mb-2 overflow-hidden">
                                <div
                                    class="h-full rounded-full transition-all duration-500 {
                                        alert.level === 'critical' ? 'bg-red-500' :
                                        alert.level === 'danger' ? 'bg-orange-500' : 'bg-yellow-500'
                                    }"
                                    style="width: {Math.min(alert.percentage, 100)}%"
                                ></div>
                            </div>

                            <div class="flex justify-between items-center text-xs text-zinc-500">
                                <div class="flex gap-1">
                                    <DollarDisplay amount={alert.currentCost} />
                                    <span>/</span>
                                    <DollarDisplay amount={alert.limit} />
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
{/if}
