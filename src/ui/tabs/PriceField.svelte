<script lang="ts">
    import type { PriceInfo } from '../../types';
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
    export let language: LanguageType;

    import { createEventDispatcher } from 'svelte';
    import type { LanguageType } from '../../lang';
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
        <div class="flex items-center gap-1 min-w-0">
            <span class="text-zinc-500">{language.cacheNotSupported}</span>
            <button
                class="text-zinc-400 hover:text-zinc-200 add-cached-price-btn text-xs flex-shrink-0"
                on:click={() => addCachedPrice(provider, modelId, mode)}
                title="Add Cached Price"
            >
                <Plus size={12} />
            </button>
        </div>
    {/if}
{:else if isEditing}
    <div class="flex items-center gap-1 min-w-0">
        <span class="flex-shrink-0">{fieldLabels[field]}:</span>
        <input
            type="number"
            step="0.0001"
            value={editPriceInput}
            on:input={handleInputChange}
            on:keydown={(e) => handlePriceInputKeydown(e, provider, modelId, mode, field)}
            class="price-edit-input bg-zinc-700 text-zinc-100 px-1 py-0.5 rounded text-xs w-20"
        />
        <button
            class="text-green-600 hover:text-green-500 confirm-price-btn text-xs flex-shrink-0"
            on:click={() => confirmPriceEdit(provider, modelId, mode, field)}
            title="Confirm Price Edit"
        >
            <Check size={12} />
        </button>
        <button
            class="text-zinc-400 hover:text-zinc-200 cancel-edit-btn text-xs flex-shrink-0"
            on:click={cancelEdit}
            title="Cancel Price Edit"
        >
            <X size={12} />
        </button>
    </div>
{:else}
    <div class="flex items-center gap-1 min-w-0">
        <span class="truncate">{fieldLabels[field]}: ${value.toFixed(4)}/M</span>
        <button
            class="text-zinc-400 hover:text-zinc-200 edit-price-btn flex-shrink-0"
            on:click={() => startEditingPrice(provider, modelId, mode, field)}
            title="Edit Price"
        >
            <Pencil size={12} />
        </button>
        {#if showDisableBtn}
            <button
                class="text-zinc-400 hover:text-zinc-200 remove-cached-price-btn text-xs flex-shrink-0"
                on:click={() => removeCachedPrice(provider, modelId, mode)}
                title={language.disable}
            >
                <Trash size={12} />
            </button>
        {/if}
    </div>
{/if}
