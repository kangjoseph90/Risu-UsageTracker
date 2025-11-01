<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { PriceManager } from '../../manager/price';
    import { ProviderManager } from '../../manager/provider';
    import type { ProviderPrice } from '../../types';
    import PriceField from './PriceField.svelte';
    import { Check, Trash, Pencil, X, TriangleAlert, Plus } from 'lucide-svelte';
    import type { LanguageType } from '../../lang';
    import { formatString } from '../../lang';

    export let key: number = 0;
    export let language: LanguageType;

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
    let searchQuery = '';

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

    function showAddModelDialog() {
        const provider = prompt(language.addModelProviderPrompt);
        if (!provider) return;

        const modelId = prompt(language.addModelNamePrompt);
        if (!modelId) return;

        const initialPrice = {
            inputPrice: 0,
            outputPrice: 0,
        };

        PriceManager.setTemporaryPrice(modelId, provider, initialPrice);
        refreshData();
        dispatch('change');
    }

    function handleDeleteModel(provider: string, modelId: string, mode: 'temp' | 'confirmed') {
        const confirmText = formatString(language.deleteModelConfirm, { provider, modelId });
        const confirmed = confirm(confirmText);
        if (!confirmed) return;

        deleteModel(provider, modelId, mode);
    }

    $: filteredProviders = (() => {
        if (!searchQuery.trim()) return allProviders;
        const query = searchQuery.toLowerCase();
        return allProviders.filter(provider => {
            const models = getProviderModels(provider);
            // 프로바이더명 또는 모델명이 일치하면 포함
            return provider.toLowerCase().includes(query) || 
                   models.some(model => model.toLowerCase().includes(query));
        });
    })();
</script>

<div class="flex flex-col h-full">
    <!-- Header -->
    <div class="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-700/60 px-3 py-3 flex-shrink-0 shadow-[0_4px_16px_0_rgba(0,0,0,0.25)]">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <!-- Search Group -->
            <div class="flex items-center gap-2 text-xs flex-wrap">
                <span class="text-zinc-400 hidden md:inline">{language.search}:</span>
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder={language.search}
                    class="bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs max-w-[200px] placeholder-zinc-500"
                />
                <span class="text-zinc-500 text-xs">
                    {filteredProviders.length} / {allProviders.length}
                </span>
            </div>
            
            <!-- Add Button Group -->
            <div class="flex justify-end">
                <button
                    class="px-1.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded text-xs flex items-center gap-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-blue-500"
                    on:click={showAddModelDialog}
                    title="Add Model"
                >   
                    <Plus size={16} />
                    <span>{language.addModel}</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow-y-auto">
        {#if allProviders.length === 0}
            <div class="text-center text-zinc-500 py-8">
                {language.noRecordsFound}
            </div>
        {:else if filteredProviders.length === 0}
            <div class="text-center text-zinc-500 py-8">
                {language.noRecordsFound}
            </div>
        {:else}
            <div class="space-y-2 px-3 pt-3">
            {#each filteredProviders as provider (provider)}
            {@const confirmedModels = confirmedPrices[provider] || {}}
            {@const tempModels = tempPrices[provider] || {}}
            {@const models = getProviderModels(provider)}
            {@const isEditingProvider = editingState?.type === 'provider' && editingState?.provider === provider}

            <div class="bg-zinc-800 border border-zinc-700/60 rounded-lg px-4 pt-2 pb-3 space-y-2">
                <div class="flex items-center justify-between min-w-0">
                    <div class="flex items-center gap-2 min-w-0">
                        {#if isEditingProvider}
                            <!-- svelte-ignore a11y-autofocus -->
                            <input
                                type="text"
                                bind:value={editProviderInput}
                                class="provider-edit-input bg-zinc-700 text-zinc-100 px-2 py-1 rounded text-sm"
                                on:keydown={(e) => handleProviderInputKeydown(e, provider)}
                                autofocus
                            />
                            <button
                                class="text-green-600 hover:text-green-500 confirm-provider-btn flex-shrink-0"
                                on:click={() => confirmProviderEdit(provider)}
                                title="Confirm Edit"
                            >
                                <Check size={16} />
                            </button>
                            <button
                                class="text-zinc-400 hover:text-zinc-200 cancel-edit-btn flex-shrink-0"
                                on:click={cancelEdit}
                                title="Cancel Edit"
                            >
                                <X size={16} />
                            </button>
                        {:else}
                            <h4 class="text-base font-semibold text-zinc-100 truncate">{escapeHTML(provider)}</h4>
                            <button
                                class="text-zinc-400 hover:text-zinc-200 edit-provider-btn flex-shrink-0"
                                on:click={() => startEditingProvider(provider)}
                                title="Edit Provider"
                            >
                                <Pencil size={16} />
                            </button>
                        {/if}
                    </div>
                </div>
                                
                <div class="space-y-2">

                    {#each models as modelId (provider + modelId)}
                        {@const confirmedPrice = confirmedModels[modelId]}
                        {@const tempPrice = tempModels[modelId]}
                        {@const isEditingPrice = editingState?.type === 'price' && editingState?.provider === provider && editingState?.modelId === modelId}

                        {#if tempPrice}
                            <div class="flex items-center justify-between bg-yellow-900/20 border border-yellow-700/30 hover:border-yellow-600/30 px-3 py-2 rounded text-sm min-w-0">
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 mb-2 min-w-0 text-yellow-400 font-medium truncate">
                                        <span>{escapeHTML(modelId)}</span>
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
                                            {language}
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
                                            {language}
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
                                            {language}
                                            on:updateEditPrice={(e) => editPriceInput = e.detail}
                                        />
                                    </div>
                                </div>
                                <div class="flex gap-1 items-center flex-shrink-0">
                                    <button
                                        class="text-green-600 hover:text-green-500 confirm-model-btn flex-shrink-0"
                                        on:click={() => confirmModel(provider, modelId)}
                                        title="Confirm Model"
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button
                                        class="text-red-700 hover:text-red-500 delete-model-btn flex-shrink-0"
                                        on:click={() => handleDeleteModel(provider, modelId, 'temp')}
                                        title="Delete Model"
                                    >
                                        <Trash size={18} />
                                    </button>
                                </div>
                            </div>
                        {/if}

                        {#if confirmedPrice && !tempPrice}
                            <div class="flex items-center justify-between bg-zinc-700/30 border border-zinc-700/60 hover:border-zinc-600/60 px-3 py-2 rounded text-sm min-w-0">
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
                                            {language}
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
                                            {language}
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
                                            {language}
                                            on:updateEditPrice={(e) => editPriceInput = e.detail}
                                        />
                                    </div>
                                </div>
                                <div class="flex gap-1 items-center flex-shrink-0">
                                    <button
                                        class="text-red-700 hover:text-red-500 delete-model-btn flex-shrink-0"
                                        on:click={() => handleDeleteModel(provider, modelId, 'confirmed')}
                                        title="Delete Model"
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
            </div>
        {/if}
    </div>
</div>