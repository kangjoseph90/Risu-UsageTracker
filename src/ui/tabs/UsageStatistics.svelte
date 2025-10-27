<script lang="ts">
    export let stats: {
        totalCost: number;
        totalRequests: number;
        totalInputTokens: number;
        totalCachedInputTokens: number;
        totalOutputTokens: number;
    };
</script>

<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <div class="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
        <div class="text-xs text-zinc-300 mb-1">총 비용</div>
        <div class="text-xl font-bold text-white">${stats.totalCost.toFixed(4)}</div>
    </div>
    <div class="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
        <div class="text-xs text-zinc-300 mb-1">총 요청</div>
        <div class="text-xl font-bold text-white">{stats.totalRequests.toLocaleString()}</div>
    </div>
    <div class="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
        <div class="text-xs text-zinc-300 mb-1">입력 토큰</div>
        <div class="text-xl font-bold text-white">{stats.totalInputTokens.toLocaleString()}</div>
    </div>
    <div class="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
        <div class="text-xs text-zinc-300 mb-1">출력 토큰</div>
        <div class="text-xl font-bold text-white">{stats.totalOutputTokens.toLocaleString()}</div>
    </div>
</div>
