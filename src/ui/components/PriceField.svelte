<script lang="ts">
    import type { PriceInfo } from '../../types';
    import DollarDisplay from './DollarDisplay.svelte';
    import { Plus, Pencil, Check, X, Trash } from 'lucide-svelte';

    export let provider: string;
    export let modelId: string;
    export let price: PriceInfo;
    export let mode: 'temp' | 'confirmed';
    export let field: 'inputPrice' | 'cachedInputPrice' | 'outputPrice';
    export let isEditing: boolean;
    export let handlePriceInputKeydown: (e: KeyboardEvent, provider: string, modelId: string, mode: 'temp' | 'confirmed', field: 'inputPrice' | 'cachedInputPrice' | 'outputPrice') => void;
    export let startEditingPrice: (provider: string, modelId: string, mode: 'temp' | 'confirmed', field: 'inputPrice' | 'cachedInputPrice' | 'outputPrice') => void;
    export let confirmPriceEdit: (provider: string, modelId: string, mode: 'temp' | 'confirmed', field: 'inputPrice' | 'cachedInputPrice' | 'outputPrice') => void;
    export let cancelEdit: () => void;
    export let addCachedPrice: (provider: string, modelId: string, mode: 'temp' | 'confirmed') => void;
    export let removeCachedPrice: (provider: string, modelId: string, mode: 'temp' | 'confirmed') => void;
    export let editPriceInput: string;
    export let language: Language;

    import { createEventDispatcher } from 'svelte';
    import type { Language } from '../../lang';
    const dispatch = createEventDispatcher();

    const fieldLabels = {
        inputPrice: language.inputPrice,
        cachedInputPrice: language.cachedInputPrice,
        outputPrice: language.outputPrice,
    };

    $: value = price[field];
    $: showDisableBtn = field === 'cachedInputPrice' && value !== undefined;

    function handleInputChange(e: Event) {
        const target = e.currentTarget as HTMLInputElement;
        dispatch('updateEditPrice', target.value);
    }
</script>

{#if value === undefined}
    {#if field === 'cachedInputPrice'}
        <div class="ut-flex ut-items-center ut-gap-1 ut-min-w-0">
            <span class="ut-text-zinc-500">{language.cacheNotSupported}</span>
            <button
                class="ut-text-zinc-400 hover:ut-text-zinc-200 add-cached-price-btn ut-text-xs ut-flex-shrink-0"
                on:click={() => addCachedPrice(provider, modelId, mode)}
                title="Add Cached Price"
            >
                <Plus size={12} />
            </button>
        </div>
    {/if}
{:else if isEditing}
    <div class="ut-flex ut-items-center ut-gap-1 ut-min-w-0">
        <span class="ut-flex-shrink-0">{fieldLabels[field]}:</span>
        <!-- svelte-ignore a11y-autofocus -->
        <input
            type="number"
            step="0.0001"
            value={editPriceInput}
            on:input={handleInputChange}
            on:keydown={(e) => handlePriceInputKeydown(e, provider, modelId, mode, field)}
            class="ut-bg-zinc-700 ut-text-zinc-100 ut-px-1 ut-py-0.5 ut-rounded ut-text-xs ut-w-20"
            autofocus
        />
        <button
            class="ut-text-green-600 hover:ut-text-green-500 ut-text-xs ut-flex-shrink-0"
            on:click={() => confirmPriceEdit(provider, modelId, mode, field)}
            title="Confirm Price Edit"
        >
            <Check size={12} />
        </button>
        <button
            class="ut-text-zinc-400 hover:ut-text-zinc-200 ut-text-xs ut-flex-shrink-0"
            on:click={cancelEdit}
            title="Cancel Price Edit"
        >
            <X size={12} />
        </button>
    </div>
{:else}
    <div class="ut-flex ut-items-center ut-gap-1 ut-min-w-0">
        <span class="ut-truncate">
            {fieldLabels[field]}: <DollarDisplay
                amount={value}
                language={language}
                textClass="ut-text-xs"
                showHint={true}
            />/M
        </span>
        <button
            class="ut-text-zinc-400 hover:ut-text-zinc-200 ut-flex-shrink-0"
            on:click={() => startEditingPrice(provider, modelId, mode, field)}
            title="Edit Price"
        >
            <Pencil size={12} />
        </button>
        {#if showDisableBtn}
            <button
                class="ut-text-zinc-400 hover:ut-text-zinc-200 ut-text-xs ut-flex-shrink-0"
                on:click={() => removeCachedPrice(provider, modelId, mode)}
                title={language.disable}
            >
                <Trash size={12} />
            </button>
        {/if}
    </div>
{/if}
