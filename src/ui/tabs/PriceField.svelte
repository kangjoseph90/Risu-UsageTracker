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

    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    const fieldLabels = {
        inputPrice: '입력',
        cachedInputPrice: '캐시',
        outputPrice: '출력',
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
            <span class="text-zinc-500">캐시: 지원 안 함</span>
            <button
                class="text-zinc-400 hover:text-zinc-200 add-cached-price-btn text-xs flex-shrink-0"
                on:click={() => addCachedPrice(provider, modelId, mode)}
                title="추가 입력"
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
            title="확정"
        >
            <Check size={12} />
        </button>
        <button
            class="text-zinc-400 hover:text-zinc-200 cancel-edit-btn text-xs flex-shrink-0"
            on:click={cancelEdit}
            title="취소"
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
            title="수정"
        >
            <Pencil size={12} />
        </button>
        {#if showDisableBtn}
            <button
                class="text-zinc-400 hover:text-zinc-200 remove-cached-price-btn text-xs flex-shrink-0"
                on:click={() => removeCachedPrice(provider, modelId, mode)}
                title="비활성화"
            >
                <Trash size={12} />
            </button>
        {/if}
    </div>
{/if}
