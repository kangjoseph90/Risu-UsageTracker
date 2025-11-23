<script lang="ts">
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import { language } from "../../lang";

    export let data: Array<{
        timestamp: string;
        counts: { [code: number]: number };
        total: number;
    }>;
    export let timeRange: string;

    let scrollContainer: HTMLDivElement;
    let tooltipData: (typeof data)[0] | null = null;
    let tooltipX = 0;
    let tooltipY = 0;
    let hoveredIndex: number | null = null;

    $: maxValue = calculateMaxValue(data);
    $: yGridLines = calculateGridLines(maxValue);
    $: allCodes = getAllErrorCodes(data);

    const chartHeight = 200;
    const pointSpacing = 40;
    const spacing = 8; // padding-left
    const yAxisWidth = 45;
    const rightPadding = 20;

    $: chartWidth = data.length * (pointSpacing + spacing) + spacing;

    $: hasData = data.some(bucket => Object.values(bucket.counts).some(c => c > 0));

    const colors: { [key: number]: string } = {
        400: "#f97316", // Orange
        401: "#eab308", // Yellow
        403: "#eab308", // Yellow
        404: "#71717a", // Zinc
        429: "#a855f7", // Purple
        500: "#ef4444", // Red
        502: "#ef4444", // Red
        503: "#ef4444", // Red
        504: "#ef4444", // Red
    };
    const defaultColor = "#3b82f6"; // Blue

    function getColor(code: number): string {
        if (colors[code]) return colors[code];
        if (code >= 500) return colors[500];
        if (code >= 400 && code < 500) return colors[400];
        return defaultColor;
    }

    function getAllErrorCodes(buckets: typeof data): number[] {
        const codes = new Set<number>();
        buckets.forEach((b) => {
            Object.keys(b.counts).forEach((code) => codes.add(Number(code)));
        });
        return Array.from(codes).sort();
    }

    function calculateMaxValue(buckets: typeof data): number {
        let max = 0;
        buckets.forEach((bucket) => {
            Object.values(bucket.counts).forEach((count) => {
                max = Math.max(max, count);
            });
        });
        return Math.max(5, max * 1.1); // Minimum 5
    }

    function calculateGridLines(maxVal: number): number[] {
        if (maxVal === 0) return [0];
        const interval = Math.ceil(maxVal / 5);
        const lines: number[] = [];
        for (let i = 1; i <= 5; i++) {
            lines.push(interval * i);
        }
        return lines;
    }

    function formatBucketLabel(timestamp: string, range: string): string {
        if (range === "month") {
            return timestamp.substring(5, 7) + "월";
        } else if (range === "week") {
            return timestamp.substring(5).replace("-", "/");
        } else if (range === "day") {
            return timestamp.substring(5).replace("-", "/");
        } else {
            return timestamp.substring(11, 16);
        }
    }

    function getLinePath(code: number): string {
        return data
            .map((bucket, index) => {
                const count = bucket.counts[code] || 0;
                const x = spacing + index * (pointSpacing + spacing) + pointSpacing / 2;
                const y = chartHeight - (count / maxValue) * chartHeight;
                return `${index === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ");
    }

    function scrollToEnd() {
        if (scrollContainer) {
            requestAnimationFrame(() => {
                if (scrollContainer) {
                    scrollContainer.scrollLeft =
                        scrollContainer.scrollWidth -
                        scrollContainer.clientWidth;
                }
            });
        }
    }

    $: if (data && data.length > 0) {
        setTimeout(() => {
            scrollToEnd();
        }, 0);
    }

    function handleInteraction(
        event: MouseEvent | TouchEvent,
        bucket: (typeof data)[0],
        index: number
    ) {
        const clientX =
            "touches" in event ? event.touches[0].clientX : event.clientX;
        const clientY =
            "touches" in event ? event.touches[0].clientY : event.clientY;

        tooltipData = bucket;
        tooltipX = clientX;
        tooltipY = clientY;
        hoveredIndex = index;
    }

    function handleMove(event: MouseEvent) {
        if (tooltipData) {
            tooltipX = event.clientX;
            tooltipY = event.clientY;
        }
    }

    function handleLeave() {
        tooltipData = null;
        hoveredIndex = null;
    }

    onMount(() => {
        const hideTooltip = () => (tooltipData = null);
        window.addEventListener("scroll", hideTooltip, true);
        return () => window.removeEventListener("scroll", hideTooltip, true);
    });
</script>

{#if !hasData}
    <div class="text-center text-zinc-500 py-8">{$language.noRecordsFound}</div>
{:else}
    <div class="flex border border-zinc-700/80 rounded-md overflow-hidden">
        <!-- Y-axis -->
        <div
            class="w-[45px] flex-shrink-0 bg-zinc-900 border-r border-zinc-700/80"
        >
            <svg width={yAxisWidth} height={chartHeight + 30} class="block">
                {#each yGridLines as gridValue}
                    {@const y =
                        chartHeight - (gridValue / maxValue) * chartHeight}
                    <text
                        x={yAxisWidth - 10}
                        y={y + 3}
                        fill="#a1a1aa"
                        font-size="10"
                        text-anchor="end">{gridValue}</text
                    >
                {/each}
            </svg>
        </div>

        <!-- Chart area -->
        <div bind:this={scrollContainer} class="overflow-x-auto flex-1">
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <svg
                width={chartWidth + rightPadding}
                height={chartHeight + 30}
                class="block"
                on:mousemove={handleMove}
                on:mouseleave={handleLeave}
            >
                <!-- Grid lines -->
                {#each yGridLines as gridValue}
                    {@const y =
                        chartHeight - (gridValue / maxValue) * chartHeight}
                    <line
                        x1="0"
                        y1={y}
                        x2={chartWidth}
                        y2={y}
                        stroke="#505050"
                        stroke-width="1"
                        stroke-dasharray="2,2"
                    />
                {/each}

                <!-- Zero line -->
                <line
                    x1="0"
                    y1={chartHeight}
                    x2={chartWidth}
                    y2={chartHeight}
                    stroke="#505050"
                    stroke-width="1.5"
                />

                <!-- Lines -->
                {#each allCodes as code}
                    <path
                        d={getLinePath(code)}
                        fill="none"
                        stroke={getColor(code)}
                        stroke-width="2"
                        stroke-linejoin="round"
                        stroke-linecap="round"
                    />
                {/each}

                <!-- Hover Interaction Area (Vertical Lines and Points) -->
                {#each data as bucket, index}
                    {@const x = spacing + index * (pointSpacing + spacing) + pointSpacing / 2}
                    
                    <!-- Interaction Zone -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <rect
                        x={x - pointSpacing / 2}
                        y={0}
                        width={pointSpacing}
                        height={chartHeight}
                        fill="transparent"
                        on:mouseenter={(e) => handleInteraction(e, bucket, index)}
                        on:touchstart={(e) => handleInteraction(e, bucket, index)}
                    />

                    <!-- X-axis Label -->
                    <text
                        x={x}
                        y={chartHeight + 15}
                        fill="#a1a1aa"
                        font-size="11"
                        text-anchor="middle"
                    >
                        {formatBucketLabel(bucket.timestamp, timeRange)}
                    </text>
                {/each}

                <!-- Optimized Hover Indicator -->
                {#if hoveredIndex !== null && data[hoveredIndex]}
                    {@const bucket = data[hoveredIndex]}
                    {@const x = spacing + hoveredIndex * (pointSpacing + spacing) + pointSpacing / 2}
                    
                    <line
                        x1={x}
                        y1={0}
                        x2={x}
                        y2={chartHeight}
                        stroke="#71717a"
                        stroke-width="1"
                        stroke-dasharray="4,4"
                        style="pointer-events: none;"
                    />
                    {#each allCodes as code}
                        {@const count = bucket.counts[code] || 0}
                        {#if count > 0}
                            {@const y = chartHeight - (count / maxValue) * chartHeight}
                            <circle cx={x} cy={y} r="3" fill={getColor(code)} stroke="white" stroke-width="1" style="pointer-events: none;"/>
                        {/if}
                    {/each}
                {/if}
            </svg>
        </div>
    </div>

    <!-- Legend -->
    <div class="flex gap-4 text-xs text-zinc-300 mt-2 flex-wrap">
        {#each allCodes as code}
            <div class="flex items-center gap-1">
                <span class="w-3 h-3 rounded-full" style="background-color: {getColor(code)}"></span>
                <span>{code}</span>
            </div>
        {/each}
    </div>

    <!-- Tooltip -->
    {#if tooltipData}
        <div
            class="fixed z-[9999] rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-lg pointer-events-none border border-zinc-700"
            style="top: {tooltipY}px; left: {tooltipX}px; transform: translate(12px, -50%);"
        >
            <div class="font-semibold mb-1 text-zinc-100 border-b border-zinc-700 pb-1">
                {tooltipData.timestamp}
            </div>
            <div class="space-y-0.5">
                {#each allCodes as code}
                    {@const count = tooltipData.counts[code] || 0}
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full" style="background-color: {getColor(code)}"></span>
                        <span class="text-zinc-300">{code}:</span>
                        <span class="text-white font-bold">{count}</span>
                    </div>
                {/each}
                <div class="pt-1 mt-1 border-t border-zinc-700 text-zinc-400">
                    Total: {tooltipData.total}
                </div>
            </div>
        </div>
    {/if}
{/if}
