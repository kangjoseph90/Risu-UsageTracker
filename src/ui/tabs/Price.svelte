<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { PriceManager } from '../../manager/price';
    import { ProviderManager } from '../../manager/provider';
    import type { ProviderPrice } from '../../types';
    import PriceField from '../components/PriceField.svelte';
    import { Check, Trash, Pencil, X, TriangleAlert, Plus } from 'lucide-svelte';
    import type { Language } from '../../lang';
    import { formatString } from '../../lang';

    export let key: number = 0;
    export let language: Language;

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

<div class="ut-flex ut-flex-col ut-h-full">
    <!-- Header -->
    <div class="ut-sticky ut-top-0 ut-z-10 ut-bg-zinc-900 ut-border-b ut-border-zinc-700/60 ut-px-3 ut-py-3 ut-flex-shrink-0 ut-shadow-[0_4px_16px_0_rgba(0,0,0,0.25)]">
        <div class="ut-flex ut-flex-wrap ut-flex-row ut-justify-between ut-items-center ut-gap-3">
            <!-- Search Group -->
            <div class="ut-flex ut-items-center ut-gap-2 ut-text-xs">
                <span class="ut-text-zinc-400 ut-hidden md:ut-inline">{language.search}:</span>
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder={language.search}
                    class="ut-bg-zinc-800 ut-text-zinc-200 ut-border ut-border-zinc-700/60 ut-rounded ut-px-2 ut-py-1 ut-text-xs ut-max-w-[200px] ut-placeholder-zinc-500"
                />
                <span class="ut-text-zinc-500 ut-text-xs">
                    {filteredProviders.length} / {allProviders.length}
                </span>
            </div>
            
            <!-- Add Button Group -->
            <div class="ut-flex ut-justify-end">
                <button
                    class="ut-px-1.5 ut-py-1.5 ut-bg-zinc-700 hover:ut-bg-zinc-600 ut-text-zinc-200 ut-rounded ut-text-xs ut-flex ut-items-center ut-gap-2 ut-transition-colors ut-duration-200 focus:ut-outline-none focus:ut-ring-2 focus:ut-ring-offset-2 focus:ut-ring-offset-zinc-900 focus:ut-ring-blue-500"
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
    <div class="ut-flex-1 ut-overflow-y-auto">
        {#if allProviders.length === 0}
            <div class="ut-text-center ut-text-zinc-500 ut-py-8">
                {language.noRecordsFound}
            </div>
        {:else if filteredProviders.length === 0}
            <div class="ut-text-center ut-text-zinc-500 ut-py-8">
                {language.noRecordsFound}
            </div>
        {:else}
            <div class="ut-space-y-2 ut-px-3 ut-pt-3">
            {#each filteredProviders as provider (provider)}
            {@const confirmedModels = confirmedPrices[provider] || {}}
            {@const tempModels = tempPrices[provider] || {}}
            {@const models = getProviderModels(provider)}
            {@const isEditingProvider = editingState?.type === 'provider' && editingState?.provider === provider}

            <div class="ut-bg-zinc-800 ut-border ut-border-zinc-700/60 ut-rounded-lg ut-px-4 ut-pt-2 ut-pb-3 ut-space-y-2">
                <div class="ut-flex ut-items-center ut-justify-between ut-min-w-0">
                    <div class="ut-flex ut-items-center ut-gap-2 ut-min-w-0">
                        {#if isEditingProvider}
                            <!-- svelte-ignore a11y-autofocus -->
                            <input
                                type="text"
                                bind:value={editProviderInput}
                                class="provider-edit-input ut-bg-zinc-700 ut-text-zinc-100 ut-px-2 ut-py-1 ut-rounded ut-text-sm"
                                on:keydown={(e) => handleProviderInputKeydown(e, provider)}
                                autofocus
                            />
                            <button
                                class="ut-text-green-600 hover:ut-text-green-500 confirm-provider-btn ut-flex-shrink-0"
                                on:click={() => confirmProviderEdit(provider)}
                                title="Confirm Edit"
                            >
                                <Check size={16} />
                            </button>
                            <button
                                class="ut-text-zinc-400 hover:ut-text-zinc-200 cancel-edit-btn ut-flex-shrink-0"
                                on:click={cancelEdit}
                                title="Cancel Edit"
                            >
                                <X size={16} />
                            </button>
                        {:else}
                            <h4 class="ut-text-base ut-font-semibold ut-text-zinc-100 ut-truncate">{escapeHTML(provider)}</h4>
                            <button
                                class="ut-text-zinc-400 hover:ut-text-zinc-200 edit-provider-btn ut-flex-shrink-0"
                                on:click={() => startEditingProvider(provider)}
                                title="Edit Provider"
                            >
                                <Pencil size={16} />
                            </button>
                        {/if}
                    </div>
                </div>
                                
                <div class="ut-space-y-2">

                    {#each models as modelId (provider + modelId)}
                        {@const confirmedPrice = confirmedModels[modelId]}
                        {@const tempPrice = tempModels[modelId]}
                        {@const isEditingPrice = editingState?.type === 'price' && editingState?.provider === provider && editingState?.modelId === modelId}

                        {#if tempPrice}
                            <div class="ut-flex ut-items-center ut-justify-between ut-bg-yellow-900/20 ut-border ut-border-yellow-700/30 hover:ut-border-yellow-600/30 ut-px-3 ut-py-2 ut-rounded ut-text-sm ut-min-w-0">
                                <div class="ut-flex-1 ut-min-w-0">
                                    <div class="ut-flex ut-items-center ut-gap-2 ut-mb-2 ut-min-w-0 ut-text-yellow-400 ut-font-medium ut-truncate">
                                        <span>{escapeHTML(modelId)}</span>
                                        <TriangleAlert size={16} />
                                    </div>
                                    <div class="ut-text-xs ut-text-zinc-400 ut-space-y-1 ut-min-w-0">
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
                                <div class="ut-flex ut-gap-1 ut-items-center ut-flex-shrink-0">
                                    <button
                                        class="ut-text-green-600 hover:ut-text-green-500 confirm-model-btn ut-flex-shrink-0"
                                        on:click={() => confirmModel(provider, modelId)}
                                        title="Confirm Model"
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button
                                        class="ut-text-red-700 hover:ut-text-red-500 delete-model-btn ut-flex-shrink-0"
                                        on:click={() => handleDeleteModel(provider, modelId, 'temp')}
                                        title="Delete Model"
                                    >
                                        <Trash size={18} />
                                    </button>
                                </div>
                            </div>
                        {/if}

                        {#if confirmedPrice && !tempPrice}
                            <div class="ut-flex ut-items-center ut-justify-between ut-bg-zinc-700/30 ut-border ut-border-zinc-700/60 hover:ut-border-zinc-600/60 ut-px-3 ut-py-2 ut-rounded ut-text-sm ut-min-w-0">
                                <div class="ut-flex-1 ut-min-w-0">
                                    <div class="ut-flex ut-items-center ut-gap-2 ut-mb-2 ut-min-w-0">
                                        <span class="ut-text-zinc-200 ut-font-medium ut-truncate">{escapeHTML(modelId)}</span>
                                    </div>
                                    <div class="ut-text-xs ut-text-zinc-400 ut-space-y-1 ut-min-w-0">
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
                                <div class="ut-flex ut-gap-1 ut-items-center ut-flex-shrink-0">
                                    <button
                                        class="ut-text-red-700 hover:ut-text-red-500 delete-model-btn ut-flex-shrink-0"
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