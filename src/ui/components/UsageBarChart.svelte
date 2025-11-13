<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { fade } from 'svelte/transition';
    import type { Language } from "../../lang";
    import DollarDisplay from "./DollarDisplay.svelte";

    export let data: Array<{
        timestamp: string;
        requests: number;
        cachedInputTokens: number;
        inputTokens: number;
        outputTokens: number;
        inputCost: number;
        outputCost: number;
        totalCost: number;
    }>;
    export let measureBy: 'tokens' | 'cost' | 'requests';
    export let timeRange: string;
    export let language: Language;
    
    let scrollContainer: HTMLDivElement;
    let tooltipData: typeof data[0] | null = null;
    let tooltipX = 0;
    let tooltipY = 0;
    let hoveredIndex: number | null = null;

    $: maxValue = calculateMaxValue(data, measureBy);
    $: yGridLines = calculateGridLines(maxValue);

    const chartHeight = 200;
    const barWidth = 40;
    const spacing = 8;
    const yAxisWidth = 45;
    const rightPadding = 20;

    $: chartWidth = data.length * (barWidth + spacing) + spacing;

    function calculateMaxValue(buckets: typeof data, yAxis: typeof measureBy): number {
        let max = 0;
        buckets.forEach(bucket => {
            let value = 0;
            switch (yAxis) {
                case 'tokens':
                    value = bucket.cachedInputTokens + bucket.inputTokens + bucket.outputTokens;
                    break;
                case 'cost':
                    value = bucket.totalCost;
                    break;
                case 'requests':
                    value = bucket.requests;
                    break;
            }
            max = Math.max(max, value);
        });
        return max * 1.05;
    }

    function calculateGridLines(maxVal: number): number[] {
        if (maxVal === 0) return [0];

        const exponent = Math.floor(Math.log10(maxVal));
        const mantissa = maxVal / Math.pow(10, exponent);

        let interval: number;
        if (mantissa <= 2) {
            interval = Math.pow(10, exponent);
        } else if (mantissa <= 5) {
            interval = 2 * Math.pow(10, exponent);
        } else {
            interval = 5 * Math.pow(10, exponent);
        }

        const lines: number[] = [];
        let count = 1;
        while (true) {
            const value = interval * count;
            if (value >= maxVal) break;
            lines.push(Math.round(value * 1e10) / 1e10);
            count++;
        }

        if (lines.length < 2) {
            lines.length = 0;
            count = 1;
            while (true) {
                const value = (interval / 2) * count;
                if (value >= maxVal) break;
                lines.push(Math.round(value * 1e10) / 1e10);
                count++;
            }
        }

        return lines;
    }

    function formatBucketLabel(timestamp: string, range: string): string {
        if (range === 'month') {
            return timestamp.substring(5, 7) + '월';
        } else if (range === 'week') {
            return timestamp.substring(5).replace('-', '/');
        } else if (range === 'day') {
            return timestamp.substring(5).replace('-', '/');
        } else if (range === '1hour' || range === '4hour') {
            return timestamp.substring(11, 16);
        } else {
            return timestamp.substring(11, 16);
        }
    }

    function scrollToEnd() {
        if (scrollContainer) {
            // 다음 프레임에서 스크롤 실행
            requestAnimationFrame(() => {
                if (scrollContainer) {
                    scrollContainer.scrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
                }
            });
        }
    }


    $: if (data && data.length > 0) {
        setTimeout(() => {
            scrollToEnd();
        }, 0);
    }

    function handleBarInteraction(event: MouseEvent | TouchEvent, bucket: typeof data[0], index: number) {
        const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
        const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
        
        tooltipData = bucket;
        tooltipX = clientX;
        tooltipY = clientY;
        hoveredIndex = index;
    }

    function handleBarMove(event: MouseEvent) {
        if (tooltipData) {
            tooltipX = event.clientX;
            tooltipY = event.clientY;
        }
    }

    function handleBarLeave() {
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

{#if maxValue === 0 || data.length === 0}
    <div class="text-center text-zinc-500 py-8">{language.noRecordsFound}</div>
{:else}
    <div class="flex border border-zinc-700/80 rounded-md overflow-hidden">
        <!-- Y-axis -->
        <div class="w-[45px] flex-shrink-0 bg-zinc-900 border-r border-zinc-700/80">
            <svg width={yAxisWidth} height={chartHeight + 30} class="block">
                {#each yGridLines as gridValue}
                    {@const y = chartHeight - (gridValue / maxValue) * chartHeight}
                    {@const label = gridValue >= 1000 ? (gridValue / 1000).toFixed(0) + 'K' : gridValue.toString()}
                    <text x={yAxisWidth - 10} y={y + 3} fill="#a1a1aa" font-size="10" text-anchor="end">{label}</text>
                {/each}
            </svg>
        </div>

        <!-- Chart area -->
        <div bind:this={scrollContainer} class="overflow-x-auto flex-1">
            <svg width={chartWidth + rightPadding} height={chartHeight + 30} class="block">
                <!-- Grid lines -->
                {#each yGridLines as gridValue}
                    {@const y = chartHeight - (gridValue / maxValue) * chartHeight}
                    <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="#505050" stroke-width="1" stroke-dasharray="2,2"/>
                {/each}

                <!-- Zero line -->
                <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#505050" stroke-width="1.5"/>

                <!-- Bars -->
                {#each data as bucket, index}
                    {@const x = spacing + index * (barWidth + spacing)}
                    {#if measureBy === 'tokens'}
                        {@const cachedHeight = (bucket.cachedInputTokens / maxValue) * chartHeight}
                        {@const inputHeight = (bucket.inputTokens / maxValue) * chartHeight}
                        {@const outputHeight = (bucket.outputTokens / maxValue) * chartHeight}
                        {@const cachedY = chartHeight - cachedHeight}
                        {@const inputY = cachedY - inputHeight}
                        {@const outputY = inputY - outputHeight}

                        <g 
                            on:mouseenter={(e) => handleBarInteraction(e, bucket, index)}
                            on:mousemove={handleBarMove}
                            on:mouseleave={handleBarLeave}
                            on:touchstart={(e) => handleBarInteraction(e, bucket, index)}
                            on:touchend={handleBarLeave}
                            style="cursor: pointer;"
                        >
                            {#if outputHeight > 0}
                                <rect x={x} y={outputY} width={barWidth} height={outputHeight} fill="#f97316" rx="2" opacity={hoveredIndex === index ? 1 : 0.9} style="transition: opacity 150ms;"/>
                            {/if}
                            {#if inputHeight > 0}
                                <rect x={x} y={inputY} width={barWidth} height={inputHeight} fill="#8b5cf6" rx="2" opacity={hoveredIndex === index ? 1 : 0.9} style="transition: opacity 150ms;"/>
                            {/if}
                            {#if cachedHeight > 0}
                                <rect x={x} y={cachedY} width={barWidth} height={cachedHeight} fill="#3b82f6" rx="2" opacity={hoveredIndex === index ? 1 : 0.9} style="transition: opacity 150ms;"/>
                            {/if}
                            <rect x={x} y={0} width={barWidth} height={chartHeight} fill="transparent"/>
                        </g>
                    {:else if measureBy === 'cost'}
                        {@const outputCostHeight = (bucket.outputCost / maxValue) * chartHeight}
                        {@const inputCostHeight = (bucket.inputCost / maxValue) * chartHeight}
                        {@const inputY = chartHeight - inputCostHeight}
                        {@const outputY = inputY - outputCostHeight}
                        
                        <g 
                            on:mouseenter={(e) => handleBarInteraction(e, bucket, index)}
                            on:mousemove={handleBarMove}
                            on:mouseleave={handleBarLeave}
                            on:touchstart={(e) => handleBarInteraction(e, bucket, index)}
                            on:touchend={handleBarLeave}
                            style="cursor: pointer;"
                        >
                            {#if outputCostHeight > 0}
                                <rect x={x} y={outputY} width={barWidth} height={outputCostHeight} fill="#f97316" rx="2" opacity={hoveredIndex === index ? 1 : 0.9} style="transition: opacity 150ms;"/>
                            {/if}
                            {#if inputCostHeight > 0}
                                <rect x={x} y={inputY} width={barWidth} height={inputCostHeight} fill="#8b5cf6" rx="2" opacity={hoveredIndex === index ? 1 : 0.9} style="transition: opacity 150ms;"/>
                            {/if}
                            <rect x={x} y={0} width={barWidth} height={chartHeight} fill="transparent"/>
                        </g>
                    {:else}
                        {@const height = (bucket.requests / maxValue) * chartHeight}
                        {@const y = chartHeight - height}
                        <g 
                            on:mouseenter={(e) => handleBarInteraction(e, bucket, index)}
                            on:mousemove={handleBarMove}
                            on:mouseleave={handleBarLeave}
                            on:touchstart={(e) => handleBarInteraction(e, bucket, index)}
                            on:touchend={handleBarLeave}
                            style="cursor: pointer;"
                        >
                            {#if height > 0}
                                <rect x={x} y={y} width={barWidth} height={height} fill="#3b82f6" rx="2" opacity={hoveredIndex === index ? 1 : 0.9} style="transition: opacity 150ms;"/>
                            {/if}
                            <rect x={x} y={0} width={barWidth} height={chartHeight} fill="transparent"/>
                        </g>
                    {/if}

                    <!-- Label -->
                    <text x={x + barWidth/2} y={chartHeight + 15} fill="#a1a1aa" font-size="11" text-anchor="middle">
                        {formatBucketLabel(bucket.timestamp, timeRange)}
                    </text>
                {/each}
            </svg>
        </div>
    </div>

    <!-- Legend -->
    <div class="flex gap-4 text-xs text-zinc-300 mt-2">
        {#if measureBy === 'tokens'}
            <div class="flex items-center gap-1">
                <span class="w-3 h-3 bg-blue-500 rounded"></span>
                <span>{language.cachedTokens}</span>
            </div>
            <div class="flex items-center gap-1">
                <span class="w-3 h-3 bg-purple-500 rounded"></span>
                <span>{language.inputTokens}</span>
            </div>
            <div class="flex items-center gap-1">
                <span class="w-3 h-3 bg-orange-500 rounded"></span>
                <span>{language.outputTokens}</span>
            </div>
        {:else if measureBy === 'cost'}
            <div class="flex items-center gap-1">
                <span class="w-3 h-3 bg-purple-500 rounded"></span>
                <span>{language.inputCostLabel}</span>
            </div>
            <div class="flex items-center gap-1">
                <span class="w-3 h-3 bg-orange-500 rounded"></span>
                <span>{language.outputCostLabel}</span>
            </div>
        {:else}
            <div class="flex items-center gap-1">
                <span class="w-3 h-3 bg-blue-500 rounded"></span>
                <span>{language.requests}</span>
            </div>
        {/if}
    </div>

    <!-- Tooltip -->
    {#if tooltipData}
        <div
            class="fixed z-[9999] rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-lg pointer-events-none"
            style="top: {tooltipY}px; left: {tooltipX}px; transform: translate(12px, -50%);"
            transition:fade={{ duration: 150 }}
        >
            <div class="font-semibold mb-1 text-zinc-100">{tooltipData.timestamp}</div>
            <div class="space-y-0.5 text-zinc-300">
                <div>{language.cachedTokens}: {formatNumber(tooltipData.cachedInputTokens)}</div>
                <div>{language.inputTokens}: {formatNumber(tooltipData.inputTokens)}</div>
                <div>{language.outputTokens}: {formatNumber(tooltipData.outputTokens)}</div>
                <div class="flex items-center gap-1">
                    <span>{language.inputCostLabel}:</span>
                    <DollarDisplay amount={tooltipData.inputCost} {language} textClass="text-zinc-300" showHint={false} />
                </div>
                <div class="flex items-center gap-1">
                    <span>{language.outputCostLabel}:</span>
                    <DollarDisplay amount={tooltipData.outputCost} {language} textClass="text-zinc-300" showHint={false} />
                </div>
                <div>{language.requests}: {tooltipData.requests}</div>
            </div>
        </div>
    {/if}
{/if}
