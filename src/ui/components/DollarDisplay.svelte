<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { fade } from "svelte/transition";
    import { Loader } from "lucide-svelte";
    import { LanguageManager } from "../../manager/language";
    import { CurrencyManager, Currency } from "../../manager/currency";
    import { language, LanguageType, type Language } from "../../lang";
    import { Logger } from "../../logger";

    /**
     * Props
     */
    export let amount: number;
    export let textClass: string = "";
    export let showHint: boolean = true;

    /**
     * Get effective language
     */

    /**
     * State
     */
    let isHovering = false;
    let isLoading = false;
    let convertedAmount: number | null = null;
    let error: string | null = null;
    let tooltipTop = 0;
    let tooltipLeft = 0;
    let effectiveLanguage: LanguageType;

    /**
     * Fetch converted amount on hover
     */
    async function handleMouseEnter(event: MouseEvent): Promise<void> {
        if (isHovering) return;
        if (!showHint || effectiveLanguage == LanguageType.EN) return;

        // Calculate tooltip position
        const rect = (
            event.currentTarget as HTMLElement
        ).getBoundingClientRect();
        tooltipTop = rect.bottom + window.scrollY + 4; // 4px below the element
        tooltipLeft = rect.left + window.scrollX;

        isHovering = true;

        // If we already have the converted amount, just show it
        if (convertedAmount !== null) return;

        isLoading = true;
        error = null;

        try {
            const converted = await CurrencyManager.convertFromUSD(
                amount,
                effectiveLanguage
            );
            convertedAmount = converted;
        } catch (e) {
            error = "Failed to convert";
            Logger.error("Currency conversion failed:", e);
        } finally {
            isLoading = false;
        }
    }

    /**
     * Reset state on mouse leave
     */
    function handleMouseLeave(): void {
        isHovering = false;
    }

    /**
     * Reactive formatting - updates when amount or language changes
     */
    $: if ($language !== null && amount !== null) {
        convertedAmount = null;
        effectiveLanguage = LanguageManager.getLanguage();
    }
    $: formattedUSD = CurrencyManager.formatAmount(amount, Currency.USD);
    $: formattedConverted =
        convertedAmount !== null
            ? CurrencyManager.formatAmount(
                  convertedAmount,
                  CurrencyManager.getCurrencyForLanguage(effectiveLanguage)
              )
            : "";

    onMount(() => {
        window.addEventListener("scroll", handleMouseLeave, true);
    });

    onDestroy(() => {
        window.removeEventListener("scroll", handleMouseLeave, true);
    });
</script>

<button
    type="button"
    class="inline-block relative {textClass} appearance-none bg-transparent border-none p-0 m-0 text-left cursor-pointer focus:outline-none"
    on:mouseenter={handleMouseEnter}
    on:click={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
    aria-label="Amount in USD. Hover or click to see in {effectiveLanguage} currency"
>
    <!-- Base Display -->
    {formattedUSD}

    <!-- Tooltip Container -->
    {#if isHovering}
        <div
            class="fixed z-[9999] rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-lg whitespace-nowrap pointer-events-none"
            style="top: {tooltipTop}px; left: {tooltipLeft}px;"
            transition:fade={{ duration: 150 }}
        >
            {#if isLoading}
                <div class="flex items-center gap-1">
                    <Loader class="animate-spin" size={12} />
                    <span>Loading...</span>
                </div>
            {:else if error}
                <span class="text-red-300">{error}</span>
            {:else}
                <span>{formattedConverted}</span>
            {/if}
        </div>
    {/if}
</button>
