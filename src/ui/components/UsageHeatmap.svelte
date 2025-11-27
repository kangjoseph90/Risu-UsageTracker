<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { language, formatString } from "../../lang";
    import { formatNumber, formatLatency } from "../../util";
    import DollarDisplay from "./DollarDisplay.svelte";

    export let data: { [date: string]: number }; // date (YYYY-MM-DD) -> value
    export let measureBy: string;
    export let colorScale: "blue" | "green" | "orange" | "purple" = "blue";

    // Config
    const blockSize = 12;
    const blockSpacing = 3;
    const weekSpacing = 3;
    const fontSize = 10;
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    let container: HTMLDivElement;
    let hoveredData: { date: string; value: number } | null = null;
    let tooltipX = 0;
    let tooltipY = 0;

    // Helper to generate dates for the last year
    function generateCalendarDates() {
        const end = new Date();
        const start = new Date(end);
        start.setFullYear(start.getFullYear() - 1);
        start.setDate(start.getDate() - start.getDay()); // Start from Sunday

        const dates: Date[] = [];
        let current = new Date(start);

        while (current <= end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }

    $: calendarDates = generateCalendarDates();

    // Group dates by week
    $: weeks = groupDatesByWeeks(calendarDates);
    $: maxValue = Math.max(...Object.values(data), 1);

    function groupDatesByWeeks(dates: Date[]) {
        const weeks: Date[][] = [];
        let currentWeek: Date[] = [];

        dates.forEach(date => {
            currentWeek.push(date);
            if (date.getDay() === 6) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        });

        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }

        return weeks;
    }

    function getDateKey(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function getColor(value: number, max: number): string {
        if (value === 0) return "rgba(39, 39, 42, 1)"; // zinc-800

        const intensity = Math.max(0.2, Math.min(1, value / (max * 0.7))); // Scale non-linearly

        // Base colors
        const colors = {
            blue: [59, 130, 246],    // blue-500
            green: [16, 185, 129],   // emerald-500
            orange: [249, 115, 22],  // orange-500
            purple: [139, 92, 246]   // violet-500
        };

        const [r, g, b] = colors[colorScale] || colors.blue;
        return `rgba(${r}, ${g}, ${b}, ${intensity})`;
    }

    function handleMouseEnter(event: MouseEvent, dateStr: string, value: number) {
        hoveredData = { date: dateStr, value };
        updateTooltipPosition(event);
    }

    function handleMouseMove(event: MouseEvent) {
        updateTooltipPosition(event);
    }

    function handleMouseLeave() {
        hoveredData = null;
    }

    function updateTooltipPosition(event: MouseEvent) {
        tooltipX = event.clientX;
        tooltipY = event.clientY;
    }

    function formatTime(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }

    function formatValue(val: number, type: string) {
        if (type.includes('screenTime')) {
            return formatTime(val);
        } else if (type === 'cost') {
            return `$${val.toFixed(4)}`; // DollarDisplay logic simplified for string
        } else if (type === 'latency') {
            return formatLatency(val);
        }
        return formatNumber(val);
    }
</script>

<div class="w-full overflow-x-auto" bind:this={container}>
    <div class="min-w-[700px] text-xs">
        <div class="flex pb-2">
             <!-- Weekday Labels -->
             <div class="flex flex-col justify-between pr-2 text-zinc-500 text-[10px] h-[100px] pt-[15px]">
                <div class="h-[12px]"></div> <!-- Sun -->
                <div class="h-[12px]">Mon</div>
                <div class="h-[12px]"></div> <!-- Tue -->
                <div class="h-[12px]">Wed</div>
                <div class="h-[12px]"></div> <!-- Thu -->
                <div class="h-[12px]">Fri</div>
                <div class="h-[12px]"></div> <!-- Sat -->
             </div>

             <div class="flex flex-col gap-1">
                 <!-- Month Labels (Simplified) -->
                 <div class="flex h-[15px] relative mb-1">
                     {#each weeks as week, i}
                        {@const firstDay = week[0]}
                        {#if firstDay.getDate() <= 7}
                             <div class="absolute text-zinc-500 text-[10px]" style="left: {i * (blockSize + blockSpacing)}px">
                                 {$language[months[firstDay.getMonth()].toLowerCase()] || months[firstDay.getMonth()]}
                             </div>
                        {/if}
                     {/each}
                 </div>

                 <!-- Grid -->
                 <div class="flex" style="gap: {blockSpacing}px">
                     {#each weeks as week}
                         <div class="flex flex-col" style="gap: {blockSpacing}px">
                             {#each week as day}
                                 {@const dateStr = getDateKey(day)}
                                 {@const value = data[dateStr] || 0}
                                 <!-- svelte-ignore a11y-no-static-element-interactions -->
                                 <div
                                    class="rounded-[2px]"
                                    style="
                                        width: {blockSize}px;
                                        height: {blockSize}px;
                                        background-color: {getColor(value, maxValue)};
                                    "
                                    on:mouseenter={(e) => handleMouseEnter(e, dateStr, value)}
                                    on:mousemove={handleMouseMove}
                                    on:mouseleave={handleMouseLeave}
                                 ></div>
                             {/each}
                         </div>
                     {/each}
                 </div>
             </div>
        </div>

        <div class="flex items-center justify-end gap-2 text-[10px] text-zinc-500 mt-2">
            <span>{$language.less}</span>
            <div class="flex gap-1">
                <div class="w-3 h-3 rounded-[2px] bg-zinc-800"></div>
                <div class="w-3 h-3 rounded-[2px]" style="background-color: {getColor(maxValue * 0.25, maxValue)}"></div>
                <div class="w-3 h-3 rounded-[2px]" style="background-color: {getColor(maxValue * 0.5, maxValue)}"></div>
                <div class="w-3 h-3 rounded-[2px]" style="background-color: {getColor(maxValue * 0.75, maxValue)}"></div>
                <div class="w-3 h-3 rounded-[2px]" style="background-color: {getColor(maxValue, maxValue)}"></div>
            </div>
            <span>{$language.more}</span>
        </div>
    </div>
</div>

{#if hoveredData}
    <div
        class="fixed z-[9999] rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-lg pointer-events-none"
        style="top: {tooltipY}px; left: {tooltipX}px; transform: translate(12px, -50%);"
    >
        <div class="text-zinc-300">
            <span class="font-semibold text-zinc-100">{hoveredData.date}:</span>
            {formatValue(hoveredData.value, measureBy)}
        </div>
    </div>
{/if}
