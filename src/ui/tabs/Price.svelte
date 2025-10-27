<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { PriceManager } from '../../manager/price';
    import { ProviderManager } from '../../manager/provider';
    import type { ProviderPrice, PriceInfo } from '../../types';
    import PriceField from './PriceField.svelte';
    import { Check, Trash, Pencil, X, TriangleAlert } from 'lucide-svelte';

    export let key: number = 0;

    const dispatch = createEventDispatcher();

    let confirmedPrices: ProviderPrice = {};
    let tempPrices: ProviderPrice = {};
    let allProviders: string[] = [];

    let editingState: {
        type: 'provider' | 'model' | 'price';
        provider?: string;
        modelId?: string;
        mode?: 'temp' | 'confirmed';
        field?: 'inputPrice' | 'cachedInputPrice' | 'outputPrice';
    } | null = null;

    let editProviderInput = '';
    let editPriceInput = '';

    onMount(() => {
        refreshData();
    });

    $: if (key) {
        refreshData();
    }

    function refreshData() {
        confirmedPrices = PriceManager.getConfirmedPrice();
        tempPrices = PriceManager.getTemporaryPrice();
        const providerSet = new Set([...Object.keys(confirmedPrices), ...Object.keys(tempPrices)]);
        allProviders = Array.from(providerSet).sort();
    }

    function getProviderModels(provider: string) {
        const confirmedModels = confirmedPrices[provider] || {};
        const tempModels = tempPrices[provider] || {};
        const modelSet = new Set([...Object.keys(confirmedModels), ...Object.keys(tempModels)]);
        return Array.from(modelSet).sort();
    }

    function startEditingProvider(provider: string) {
        editProviderInput = provider;
        editingState = { type: 'provider', provider };
    }

    function confirmProviderEdit(oldProvider: string) {
        const newProvider = editProviderInput.trim();
        if (newProvider && newProvider !== oldProvider) {
            PriceManager.renameProvider(oldProvider, newProvider);
            ProviderManager.renameProvider(oldProvider, newProvider);
        }
        editingState = null;
        editProviderInput = '';
        refreshData();
        dispatch('change');
    }

    function cancelEdit() {
        editingState = null;
        editProviderInput = '';
        editPriceInput = '';
    }

    function startEditingPrice(provider: string, modelId: string, mode: 'temp' | 'confirmed', field: 'inputPrice' | 'cachedInputPrice' | 'outputPrice') {
        const prices = mode === 'temp' ? tempPrices : confirmedPrices;
        const value = prices[provider]?.[modelId]?.[field];
        editPriceInput = value?.toString() || '0';
        editingState = { type: 'price', provider, modelId, mode, field };
    }

    function confirmPriceEdit(provider: string, modelId: string, mode: 'temp' | 'confirmed', field: 'inputPrice' | 'cachedInputPrice' | 'outputPrice') {
        const newValue = parseFloat(editPriceInput);
        if (!isNaN(newValue)) {
            const prices = mode === 'temp' ? tempPrices : confirmedPrices;
            const currentPrice = prices[provider]?.[modelId];
            if (currentPrice) {
                const updatedPrice = { ...currentPrice, [field]: newValue };
                if (mode === 'temp') {
                    PriceManager.setTemporaryPrice(modelId, provider, updatedPrice);
                } else {
                    PriceManager.setConfirmedPrice(modelId, provider, updatedPrice);
                }
            }
        }
        editingState = null;
        editPriceInput = '';
        refreshData();
        dispatch('change');
    }

    function confirmModel(provider: string, modelId: string) {
        const tempPrice = tempPrices[provider]?.[modelId];
        if (tempPrice) {
            PriceManager.setConfirmedPrice(modelId, provider, tempPrice);
            PriceManager.removeTemporaryModel(modelId, provider);
            refreshData();
            dispatch('change');
        }
    }

    function deleteModel(provider: string, modelId: string, mode: 'temp' | 'confirmed') {
        if (mode === 'temp') {
            PriceManager.removeTemporaryModel(modelId, provider);
        } else {
            PriceManager.removeConfirmedModel(modelId, provider);
        }
        refreshData();
        dispatch('change');
    }

    function addCachedPrice(provider: string, modelId: string, mode: 'temp' | 'confirmed') {
        const prices = mode === 'temp' ? tempPrices : confirmedPrices;
        const currentPrice = prices[provider]?.[modelId];
        if (currentPrice) {
            const updatedPrice = {
                ...currentPrice,
                cachedInputPrice: currentPrice.inputPrice * 0.1,
            };
            if (mode === 'temp') {
                PriceManager.setTemporaryPrice(modelId, provider, updatedPrice);
            } else {
                PriceManager.setConfirmedPrice(modelId, provider, updatedPrice);
            }
            refreshData();
            dispatch('change');
        }
    }

    function removeCachedPrice(provider: string, modelId: string, mode: 'temp' | 'confirmed') {
        const prices = mode === 'temp' ? tempPrices : confirmedPrices;
        const currentPrice = prices[provider]?.[modelId];
        if (currentPrice) {
            const updatedPrice = {
                inputPrice: currentPrice.inputPrice,
                outputPrice: currentPrice.outputPrice,
            };
            if (mode === 'temp') {
                PriceManager.setTemporaryPrice(modelId, provider, updatedPrice);
            } else {
                PriceManager.setConfirmedPrice(modelId, provider, updatedPrice);
            }
            refreshData();
            dispatch('change');
        }
    }

    function handleProviderInputKeydown(e: KeyboardEvent, oldProvider: string) {
        if (e.key === 'Enter') {
            confirmProviderEdit(oldProvider);
        }
    }

    function handlePriceInputKeydown(e: KeyboardEvent, provider: string, modelId: string, mode: 'temp' | 'confirmed', field: 'inputPrice' | 'cachedInputPrice' | 'outputPrice') {
        if (e.key === 'Enter') {
            confirmPriceEdit(provider, modelId, mode, field);
        }
    }

    function escapeHTML(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
</script>

<div class="space-y-2">
    {#if allProviders.length === 0}
        <div class="text-center text-zinc-400 py-8">
            설정된 가격 정보가 없습니다
        </div>
    {:else}
        {#each allProviders as provider (provider)}
            {@const confirmedModels = confirmedPrices[provider] || {}}
            {@const tempModels = tempPrices[provider] || {}}
            {@const models = getProviderModels(provider)}
            {@const isEditingProvider = editingState?.type === 'provider' && editingState?.provider === provider}

            <div class="bg-zinc-800 rounded-lg px-4 pt-2 pb-4 space-y-3">
                <div class="flex items-center justify-between pb-2 min-w-0">
                    <div class="flex items-center gap-2 min-w-0">
                        {#if isEditingProvider}
                            <input
                                type="text"
                                bind:value={editProviderInput}
                                class="provider-edit-input bg-zinc-700 text-zinc-100 px-2 py-1 rounded text-sm"
                                on:keydown={(e) => handleProviderInputKeydown(e, provider)}
                            />
                            <button
                                class="text-green-600 hover:text-green-500 confirm-provider-btn flex-shrink-0"
                                on:click={() => confirmProviderEdit(provider)}
                                title="확정"
                            >
                                <Check size={16} />
                            </button>
                            <button
                                class="text-zinc-400 hover:text-zinc-200 cancel-edit-btn flex-shrink-0"
                                on:click={cancelEdit}
                                title="취소"
                            >
                                <X size={16} />
                            </button>
                        {:else}
                            <h4 class="text-base font-semibold text-zinc-100 truncate">{escapeHTML(provider)}</h4>
                            <button
                                class="text-zinc-400 hover:text-zinc-200 edit-provider-btn flex-shrink-0"
                                on:click={() => startEditingProvider(provider)}
                                title="수정"
                            >
                                <Pencil size={16} />
                            </button>
                        {/if}
                    </div>
                </div>

                <div class="space-y-2">
                    <div class="border-t border-zinc-700"></div>

                    {#each models as modelId, idx (modelId)}
                        {@const confirmedPrice = confirmedModels[modelId]}
                        {@const tempPrice = tempModels[modelId]}
                        {@const isEditingPrice = editingState?.type === 'price' && editingState?.provider === provider && editingState?.modelId === modelId}

                        {#if idx > 0}
                            {@const prevModelId = models[idx - 1]}
                            {@const prevIsTemp = !!tempModels[prevModelId]}
                            {@const currIsTemp = !!tempPrice}
                            {#if !prevIsTemp && !currIsTemp}
                                <div class="border-t border-zinc-700 mx-2"></div>
                            {/if}
                        {/if}

                        {#if tempPrice}
                            <div class="flex items-center justify-between bg-yellow-900/20 border border-yellow-700/30 px-3 py-2 rounded text-sm min-w-0">
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 mb-2 min-w-0">
                                        <span class="text-yellow-400 font-medium truncate">{escapeHTML(modelId)}</span>
                                        <TriangleAlert size={16} />
                                    </div>
                                    <div class="text-xs text-zinc-400 space-y-1 min-w-0">
                                        <PriceField
                                            {provider}
                                            {modelId}
                                            price={tempPrice}
                                            mode="temp"
                                            field="inputPrice"
                                            isEditing={isEditingPrice && editingState?.field === 'inputPrice'}
                                            {handlePriceInputKeydown}
                                            {startEditingPrice}
                                            {confirmPriceEdit}
                                            {cancelEdit}
                                            {addCachedPrice}
                                            {removeCachedPrice}
                                            {editPriceInput}
                                            on:updateEditPrice={(e) => editPriceInput = e.detail}
                                        />
                                        <PriceField
                                            {provider}
                                            {modelId}
                                            price={tempPrice}
                                            mode="temp"
                                            field="cachedInputPrice"
                                            isEditing={isEditingPrice && editingState?.field === 'cachedInputPrice'}
                                            {handlePriceInputKeydown}
                                            {startEditingPrice}
                                            {confirmPriceEdit}
                                            {cancelEdit}
                                            {addCachedPrice}
                                            {removeCachedPrice}
                                            {editPriceInput}
                                            on:updateEditPrice={(e) => editPriceInput = e.detail}
                                        />
                                        <PriceField
                                            {provider}
                                            {modelId}
                                            price={tempPrice}
                                            mode="temp"
                                            field="outputPrice"
                                            isEditing={isEditingPrice && editingState?.field === 'outputPrice'}
                                            {handlePriceInputKeydown}
                                            {startEditingPrice}
                                            {confirmPriceEdit}
                                            {cancelEdit}
                                            {addCachedPrice}
                                            {removeCachedPrice}
                                            {editPriceInput}
                                            on:updateEditPrice={(e) => editPriceInput = e.detail}
                                        />
                                    </div>
                                </div>
                                <div class="flex gap-1 items-center flex-shrink-0">
                                    <button
                                        class="text-green-600 hover:text-green-500 confirm-model-btn flex-shrink-0"
                                        on:click={() => confirmModel(provider, modelId)}
                                        title="확정"
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button
                                        class="text-red-700 hover:text-red-500 delete-model-btn flex-shrink-0"
                                        on:click={() => deleteModel(provider, modelId, 'temp')}
                                        title="삭제"
                                    >
                                        <Trash size={18} />
                                    </button>
                                </div>
                            </div>
                        {/if}

                        {#if confirmedPrice && !tempPrice}
                            <div class="flex items-center justify-between bg-zinc-700/30 px-3 rounded text-sm min-w-0">
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 mb-2 min-w-0">
                                        <span class="text-zinc-200 font-medium truncate">{escapeHTML(modelId)}</span>
                                    </div>
                                    <div class="text-xs text-zinc-400 space-y-1 min-w-0">
                                        <PriceField
                                            {provider}
                                            {modelId}
                                            price={confirmedPrice}
                                            mode="confirmed"
                                            field="inputPrice"
                                            isEditing={isEditingPrice && editingState?.field === 'inputPrice'}
                                            {handlePriceInputKeydown}
                                            {startEditingPrice}
                                            {confirmPriceEdit}
                                            {cancelEdit}
                                            {addCachedPrice}
                                            {removeCachedPrice}
                                            {editPriceInput}
                                            on:updateEditPrice={(e) => editPriceInput = e.detail}
                                        />
                                        <PriceField
                                            {provider}
                                            {modelId}
                                            price={confirmedPrice}
                                            mode="confirmed"
                                            field="cachedInputPrice"
                                            isEditing={isEditingPrice && editingState?.field === 'cachedInputPrice'}
                                            {handlePriceInputKeydown}
                                            {startEditingPrice}
                                            {confirmPriceEdit}
                                            {cancelEdit}
                                            {addCachedPrice}
                                            {removeCachedPrice}
                                            {editPriceInput}
                                            on:updateEditPrice={(e) => editPriceInput = e.detail}
                                        />
                                        <PriceField
                                            {provider}
                                            {modelId}
                                            price={confirmedPrice}
                                            mode="confirmed"
                                            field="outputPrice"
                                            isEditing={isEditingPrice && editingState?.field === 'outputPrice'}
                                            {handlePriceInputKeydown}
                                            {startEditingPrice}
                                            {confirmPriceEdit}
                                            {cancelEdit}
                                            {addCachedPrice}
                                            {removeCachedPrice}
                                            {editPriceInput}
                                            on:updateEditPrice={(e) => editPriceInput = e.detail}
                                        />
                                    </div>
                                </div>
                                <div class="flex gap-1 items-center flex-shrink-0">
                                    <button
                                        class="text-red-700 hover:text-red-500 delete-model-btn flex-shrink-0"
                                        on:click={() => deleteModel(provider, modelId, 'confirmed')}
                                        title="삭제"
                                    >
                                        <Trash size={18} />
                                    </button>
                                </div>
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
        {/each}
    {/if}
</div>