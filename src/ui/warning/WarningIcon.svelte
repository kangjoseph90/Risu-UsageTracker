<script lang="ts">
    import { budgetWarningStore } from './store';
    import { AlertTriangle } from 'lucide-svelte';
    import { language } from '../../lang';
    import DollarDisplay from '../components/DollarDisplay.svelte';

    let showTooltip = false;
    let tooltipHovered = false;
    let hideTimeout: ReturnType<typeof setTimeout> | null = null;
    
    // Draggable state - position stored in component state only
    let position = { x: 16, y: 16 }; // Default: top-right (offset from top-right corner)
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let positionStart = { x: 0, y: 0 };

    $: exceededRules = $budgetWarningStore.exceededRules;
    $: maxPercentage = $budgetWarningStore.maxPercentage;
    $: shouldShow = $budgetWarningStore.warningEnabled && exceededRules.length > 0;

    // Show tooltip if hovering on icon or tooltip
    $: isTooltipVisible = showTooltip || tooltipHovered;

    function handleIconEnter() {
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }
        showTooltip = true;
    }

    function handleIconLeave() {
        // Delay hiding to allow mouse to move to tooltip
        hideTimeout = setTimeout(() => {
            showTooltip = false;
        }, 150);
    }

    function handleTooltipEnter() {
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }
        tooltipHovered = true;
    }

    function handleTooltipLeave() {
        tooltipHovered = false;
    }

    // Color based on max percentage
    $: iconColor = getIconColor(maxPercentage);

    function getIconColor(percentage: number): string {
        if (percentage >= 100) return 'text-red-500';
        if (percentage >= 90) return 'text-orange-500';
        return 'text-yellow-500';
    }

    function getBgColor(percentage: number): string {
        if (percentage >= 100) return 'bg-red-500/20';
        if (percentage >= 90) return 'bg-orange-500/20';
        return 'bg-yellow-500/20';
    }

    function getProgressColor(percentage: number): string {
        if (percentage >= 100) return 'bg-red-500';
        if (percentage >= 90) return 'bg-orange-500';
        return 'bg-yellow-500';
    }

    function handleMouseDown(e: MouseEvent) {
        if (e.button !== 0) return; // Only left click
        isDragging = true;
        dragStart = { x: e.clientX, y: e.clientY };
        positionStart = { ...position };
        e.preventDefault();
    }

    function handleTouchStart(e: TouchEvent) {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        isDragging = true;
        dragStart = { x: touch.clientX, y: touch.clientY };
        positionStart = { ...position };
    }

    function handleMouseMove(e: MouseEvent) {
        if (!isDragging) return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        updatePosition(dx, dy);
    }

    function handleTouchMove(e: TouchEvent) {
        if (!isDragging || e.touches.length !== 1) return;
        const touch = e.touches[0];
        const dx = touch.clientX - dragStart.x;
        const dy = touch.clientY - dragStart.y;
        updatePosition(dx, dy);
        e.preventDefault();
    }

    function updatePosition(dx: number, dy: number) {
        // Calculate new position (from top-right corner, so x increases when moving left)
        const newX = Math.max(16, positionStart.x - dx);
        const newY = Math.max(16, positionStart.y + dy);
        
        // Limit to viewport
        const maxX = window.innerWidth - 48;
        const maxY = window.innerHeight - 48;
        
        position = {
            x: Math.min(newX, maxX),
            y: Math.min(newY, maxY)
        };
    }

    function handleMouseUp() {
        isDragging = false;
    }

    function handleTouchEnd() {
        isDragging = false;
    }
</script>

<svelte:window 
    on:mousemove={handleMouseMove} 
    on:mouseup={handleMouseUp}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
/>

{#if shouldShow}
    <div 
        class="fixed z-[9999]"
        style="top: {position.y}px; right: {position.x}px;"
        on:mouseenter={handleIconEnter}
        on:mouseleave={handleIconLeave}
        role="button"
        tabindex="0"
    >
        <!-- Warning Icon -->
        <div 
            class="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 {getBgColor(maxPercentage)} {isDragging ? 'cursor-grabbing' : 'cursor-grab'}"
            on:mousedown={handleMouseDown}
            on:touchstart={handleTouchStart}
            role="button"
            tabindex="0"
        >
            <AlertTriangle class="{iconColor}" size={18} />
        </div>

        <!-- Tooltip -->
        {#if isTooltipVisible}
            <div 
                class="absolute right-0 top-full mt-2 min-w-[280px] max-w-[350px] bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl"
                on:mouseenter={handleTooltipEnter}
                on:mouseleave={handleTooltipLeave}
                role="tooltip"
            >
                <!-- Header -->
                <div class="px-3 py-2 border-b border-zinc-700 flex items-center gap-2">
                    <AlertTriangle class="{iconColor}" size={16} />
                    <span class="text-sm font-medium text-zinc-200">
                        {$language.budgetWarning}
                    </span>
                    <span class="text-xs text-zinc-500">
                        ({exceededRules.length})
                    </span>
                </div>

                <!-- Rules List -->
                <div class="max-h-[300px] overflow-y-auto">
                    {#each exceededRules as { rule, usage, percentage }}
                        <div class="px-3 py-2 border-b border-zinc-700/50 last:border-b-0 hover:bg-zinc-700/30">
                            <div class="flex justify-between items-start mb-1">
                                <span class="text-sm text-zinc-200 font-medium truncate flex-1 mr-2" title={rule.name}>
                                    {rule.name}
                                </span>
                                <span class="text-xs {getIconColor(percentage)} whitespace-nowrap">
                                    {percentage.toFixed(1)}%
                                </span>
                            </div>
                            <div class="flex items-center gap-2 text-xs text-zinc-400 mb-1.5">
                                <DollarDisplay amount={usage} textClass="text-zinc-400" />
                                <span>/</span>
                                <DollarDisplay amount={rule.limit} textClass="text-zinc-500" />
                            </div>
                            <!-- Progress bar -->
                            <div class="w-full bg-zinc-700 rounded-full h-1">
                                <div 
                                    class="h-1 rounded-full transition-all {getProgressColor(percentage)}"
                                    style="width: {Math.min(percentage, 100)}%"
                                ></div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
{/if}
