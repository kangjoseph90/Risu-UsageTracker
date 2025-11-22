<script lang="ts">
    import type { PriceInfo } from "../../types";
    import DollarDisplay from "./DollarDisplay.svelte";
    import { Plus, Trash } from "lucide-svelte";

    export let provider: string;
    export let modelId: string;
    export let price: PriceInfo;
    export let mode: "temp" | "confirmed";
    export let field: "inputPrice" | "cachedInputPrice" | "outputPrice";
    export let isEditingModel: boolean;
    export let addCachedPrice: (
        provider: string,
        modelId: string,
        mode: "temp" | "confirmed"
    ) => void;
    export let removeCachedPrice: (
        provider: string,
        modelId: string,
        mode: "temp" | "confirmed"
    ) => void;

    import { createEventDispatcher } from "svelte";
    import { language, type Language } from "../../lang";
    const dispatch = createEventDispatcher();

    const fieldLabels = {
        inputPrice: $language.inputPrice,
        cachedInputPrice: $language.cachedInputPrice,
        outputPrice: $language.outputPrice,
    };

    $: value = price[field];
    $: showDisableBtn = field === "cachedInputPrice" && value !== undefined;

    function handleInputChange(e: Event) {
        const target = e.currentTarget as HTMLInputElement;
        dispatch("updatePrice", { field, value: target.value });
    }
</script>

{#if value === undefined}
    {#if field === "cachedInputPrice"}
        <div class="flex items-center gap-1 min-w-0">
            <span class="text-zinc-500">{$language.cacheNotSupported}</span>
            {#if isEditingModel}
                <button
                    class="text-zinc-400 hover:text-zinc-200 add-cached-price-btn text-xs flex-shrink-0"
                    on:click={() => addCachedPrice(provider, modelId, mode)}
                    title={$language.addCachedPrice}
                >
                    <Plus size={12} />
                </button>
            {/if}
        </div>
    {/if}
{:else if isEditingModel}
    <div class="flex items-center gap-1 min-w-0">
        <span class="flex-shrink-0">{fieldLabels[field]}:</span>
        <input
            type="number"
            step="0.0001"
            {value}
            on:input={handleInputChange}
            class="price-edit-input bg-zinc-700 text-zinc-100 px-1 py-0.5 rounded text-xs w-20"
        />
        {#if showDisableBtn}
            <button
                class="text-zinc-400 hover:text-zinc-200 remove-cached-price-btn text-xs flex-shrink-0"
                on:click={() => removeCachedPrice(provider, modelId, mode)}
                title={$language.disable}
            >
                <Trash size={12} />
            </button>
        {/if}
    </div>
{:else}
    <div class="flex items-center gap-1 min-w-0">
        <span class="truncate">
            {fieldLabels[field]}: <DollarDisplay
                amount={value}
                textClass="text-xs"
                showHint={true}
            />/M
        </span>
    </div>
{/if}
