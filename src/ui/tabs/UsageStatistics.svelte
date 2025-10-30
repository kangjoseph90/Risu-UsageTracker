<script lang="ts">
    import type { LanguageType } from "../../lang";

    export let stats: {
        totalCost: number;
        totalRequests: number;
        totalInputTokens: number;
        totalCachedInputTokens: number;
        totalOutputTokens: number;
    };
    export let language: LanguageType;
</script>

<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <div class="p-3 rounded-lg bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600/60 transition-colors">
        <div class="text-xs text-zinc-300 mb-1">{language.totalCost}</div>
        <div class="text-xl font-bold text-white">${stats.totalCost.toFixed(4)}</div>
    </div>
    <div class="p-3 rounded-lg bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600/60 transition-colors">
        <div class="text-xs text-zinc-300 mb-1">{language.totalRequests}</div>
        <div class="text-xl font-bold text-white">{stats.totalRequests.toLocaleString()}</div>
    </div>
    <div class="p-3 rounded-lg bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600/60 transition-colors">
        <div class="text-xs text-zinc-300 mb-1">{language.inputTokens}</div>
        <div class="text-xl font-bold text-white">{stats.totalInputTokens.toLocaleString()}</div>
    </div>
    <div class="p-3 rounded-lg bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600/60 transition-colors">
        <div class="text-xs text-zinc-300 mb-1">{language.outputTokens}</div>
        <div class="text-xl font-bold text-white">{stats.totalOutputTokens.toLocaleString()}</div>
    </div>
</div>