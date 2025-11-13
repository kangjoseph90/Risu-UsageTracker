<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
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

    let tooltipData: typeof data[0] | null = null;
    let tooltipX = 0;
    let tooltipY = 0;
    let hoveredIndex: number | null = null;

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

    function handleSegmentInteraction(event: MouseEvent | TouchEvent, item: typeof data[0], index: number) {
        const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
        const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
        
        tooltipData = item;
        tooltipX = clientX;
        tooltipY = clientY;
        hoveredIndex = index;
    }

    function handleSegmentMove(event: MouseEvent) {
        if (tooltipData) {
            tooltipX = event.clientX;
            tooltipY = event.clientY;
        }
    }

    function handleSegmentLeave() {
        tooltipData = null;
        hoveredIndex = null;
    }

    onMount(() => {
        const hideTooltip = () => tooltipData = null;
        window.addEventListener('scroll', hideTooltip, true);
        return () => window.removeEventListener('scroll', hideTooltip, true);
    });

    function formatNumber(num: number): string {
        return num >= 1000 ? (num / 1000).toFixed(1) + 'K' : num.toString();
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
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <path 
                        d={createSegmentPath(startAngle, angle, index)} 
                        fill={colors[index % colors.length]} 
                        opacity={hoveredIndex === index ? 1 : 0.9}
                        on:mouseenter={(e) => handleSegmentInteraction(e, item, index)}
                        on:mousemove={handleSegmentMove}
                        on:mouseleave={handleSegmentLeave}
                        on:touchstart={(e) => handleSegmentInteraction(e, item, index)}
                        on:touchend={handleSegmentLeave}
                        style="cursor: pointer; transition: opacity 150ms;"
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

    <!-- Tooltip -->
    {#if tooltipData}
        <div
            class="fixed z-[9999] rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-lg pointer-events-none"
            style="top: {tooltipY}px; left: {tooltipX}px; transform: translate(12px, -50%);"
            transition:fade={{ duration: 150 }}
        >
            <div class="font-semibold mb-1 text-zinc-100">{tooltipData.name}</div>
            <div class="space-y-0.5 text-zinc-300">
                <div>{language.tokens}: {formatNumber(tooltipData.tokens)}</div>
                <div class="flex items-center gap-1">
                    <span>{language.cost}:</span>
                    <DollarDisplay amount={tooltipData.cost} {language} textClass="text-zinc-300" showHint={false} />
                </div>
                <div>{language.requests}: {tooltipData.requests}</div>
            </div>
        </div>
    {/if}
{/if}
