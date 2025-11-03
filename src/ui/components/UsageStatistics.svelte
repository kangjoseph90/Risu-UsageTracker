<script lang="ts">
    import type { Language } from "../../lang";
    import DollarDisplay from "./DollarDisplay.svelte";

    export let stats: {
        totalCost: number;
        totalRequests: number;
        totalInputTokens: number;
        totalCachedInputTokens: number;
        totalOutputTokens: number;
    };
    export let language: Language;
</script>

<div class="ut-grid ut-grid-cols-2 sm:ut-grid-cols-4 ut-gap-3">
    <div class="ut-p-3 ut-rounded-lg ut-bg-zinc-800 ut-border ut-border-zinc-700/60 hover:ut-border-zinc-600/60 ut-transition-colors">
        <div class="ut-text-xs ut-text-zinc-300 ut-mb-1">{language.totalCost}</div>
        <DollarDisplay
            amount={stats.totalCost}
            language={language}
            textClass="ut-text-xl ut-font-bold ut-text-white"
            showHint={true} />
    </div>
    <div class="ut-p-3 ut-rounded-lg ut-bg-zinc-800 ut-border ut-border-zinc-700/60 hover:ut-border-zinc-600/60 ut-transition-colors">
        <div class="ut-text-xs ut-text-zinc-300 ut-mb-1">{language.totalRequests}</div>
        <div class="ut-text-xl ut-font-bold ut-text-white">{stats.totalRequests.toLocaleString()}</div>
    </div>
    <div class="ut-p-3 ut-rounded-lg ut-bg-zinc-800 ut-border ut-border-zinc-700/60 hover:ut-border-zinc-600/60 ut-transition-colors">
        <div class="ut-text-xs ut-text-zinc-300 ut-mb-1">{language.inputTokens}</div>
        <div class="ut-text-xl ut-font-bold ut-text-white">{stats.totalInputTokens.toLocaleString()}</div>
    </div>
    <div class="ut-p-3 ut-rounded-lg ut-bg-zinc-800 ut-border ut-border-zinc-700/60 hover:ut-border-zinc-600/60 ut-transition-colors">
        <div class="ut-text-xs ut-text-zinc-300 ut-mb-1">{language.outputTokens}</div>
        <div class="ut-text-xl ut-font-bold ut-text-white">{stats.totalOutputTokens.toLocaleString()}</div>
    </div>
</div>