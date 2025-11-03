<script lang="ts">
    import type { Language } from "../../lang";
    import DollarDisplay from "./DollarDisplay.svelte";

    export let data: Array<{
        name: string;
        requests: number;
        tokens: number;
        cost: number;
        value: number;
        percentage: number;
    }>;
    export let measureBy: 'tokens' | 'cost' | 'requests';
    export let language: Language;

    const size = 200;
    const center = size / 2;
    const radius = 70;
    const innerRadius = 45;
    const colors = ['#3b82f6', '#8b5cf6', '#f97316', '#10b981', '#ef4444', '#eab308', '#ec4899', '#06b6d4'];

    $: topData = data.slice(0, 8);

    function createSegmentPath(startAngle: number, angle: number, index: number): string {
        if (angle >= 359.9) {
            const midAngle = startAngle + 180;
            const startRad = startAngle * Math.PI / 180;
            const midRad = midAngle * Math.PI / 180;
            const endRad = (startAngle + 360) * Math.PI / 180;

            const x1 = center + radius * Math.cos(startRad);
            const y1 = center + radius * Math.sin(startRad);
            const x2 = center + radius * Math.cos(midRad);
            const y2 = center + radius * Math.sin(midRad);
            const x3 = center + innerRadius * Math.cos(midRad);
            const y3 = center + innerRadius * Math.sin(midRad);
            const x4 = center + innerRadius * Math.cos(startRad);
            const y4 = center + innerRadius * Math.sin(startRad);

            const path1 = `M ${x1} ${y1} A ${radius} ${radius} 0 1 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 1 0 ${x4} ${y4} Z`;

            const x5 = center + radius * Math.cos(midRad);
            const y5 = center + radius * Math.sin(midRad);
            const x6 = center + radius * Math.cos(endRad);
            const y6 = center + radius * Math.sin(endRad);
            const x7 = center + innerRadius * Math.cos(endRad);
            const y7 = center + innerRadius * Math.sin(endRad);
            const x8 = center + innerRadius * Math.cos(midRad);
            const y8 = center + innerRadius * Math.sin(midRad);

            const path2 = `M ${x5} ${y5} A ${radius} ${radius} 0 1 1 ${x6} ${y6} L ${x7} ${y7} A ${innerRadius} ${innerRadius} 0 1 0 ${x8} ${y8} Z`;

            return path1 + ' ' + path2;
        }

        const startRad = startAngle * Math.PI / 180;
        const endRad = (startAngle + angle) * Math.PI / 180;

        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);
        const x3 = center + innerRadius * Math.cos(endRad);
        const y3 = center + innerRadius * Math.sin(endRad);
        const x4 = center + innerRadius * Math.cos(startRad);
        const y4 = center + innerRadius * Math.sin(startRad);

        const largeArc = angle > 180 ? 1 : 0;

        return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
    }
</script>

{#if data.length === 0}
    <div class="text-center text-zinc-500 py-8">{language.noRecordsFound}</div>
{:else}
    <div class="flex gap-8 items-center flex-wrap">
        <!-- Donut Chart -->
        <div class="flex justify-center flex-shrink-0">
            <svg width={size} height={size}>
                {#each topData as item, index}
                    {@const angle = (item.percentage / 100) * 360}
                    {@const startAngle = topData.slice(0, index).reduce((sum, d) => sum + (d.percentage / 100) * 360, -90)}
                    <path 
                        d={createSegmentPath(startAngle, angle, index)} 
                        fill={colors[index % colors.length]} 
                        opacity="0.9"
                    />
                {/each}
            </svg>
        </div>

        <!-- Legend -->
        <div class="flex flex-col gap-2 flex-1 min-w-[200px]">
            {#each topData as item, index}
                <div class="flex items-center gap-3 text-sm">
                    <span class="w-3 h-3 rounded" style="background-color: {colors[index % colors.length]}; flex-shrink: 0;"></span>
                    <span class="text-zinc-300 flex-1 overflow-hidden text-ellipsis whitespace-nowrap min-w-0" title={item.name}>
                        {item.name}
                    </span>
                    <div class="flex gap-2 items-center flex-shrink-0">
                        <span class="text-zinc-500">{item.percentage.toFixed(1)}%</span>
                        {#if measureBy === 'cost'}
                            <DollarDisplay 
                                amount={item.value} 
                                language={language}
                                textClass="text-white font-medium" />
                        {:else if measureBy === 'tokens'}
                            <span class="text-white font-medium">{(item.value / 1000).toFixed(1)}K</span>
                        {:else}
                            <span class="text-white font-medium">{item.value}</span>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>
{/if}
