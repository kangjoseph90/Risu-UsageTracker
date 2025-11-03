<script lang="ts">
    import { onMount } from 'svelte';
    import { ProviderManager } from '../../manager/provider';
    import { formatString, type Language } from '../../lang';
    import { Plus, Check, X, Pencil, Trash } from 'lucide-svelte';

    export let key: number = 0;
    export let language: Language;

    let providerMap: Record<string, string> = {};
    let entries: [string, string][] = [];

    let editingState: { url?: string } | null = null;
    let editProviderInput = '';
    let searchQuery = '';

    onMount(() => {
        refreshData();
    });

    $: if (key) {
        refreshData();
    }

    function refreshData() {
        providerMap = ProviderManager.getAllProviders();
        entries = Object.entries(providerMap);
    }

    function showAddMappingDialog() {
        const url = prompt(language.mappingUrlPrompt);
        if (!url) return;

        const provider = prompt(language.mappingProviderPrompt);
        if (!provider) return;

        ProviderManager.setProvider(url, provider);
        refreshData();
    }

    function startEditingProvider(url: string, currentProvider: string) {
        editProviderInput = currentProvider;
        editingState = { url };
    }

    function confirmProviderEdit(url: string) {
        const newProvider = editProviderInput.trim();
        if (newProvider && newProvider !== providerMap[url]) {
            ProviderManager.setProvider(url, newProvider);
            refreshData();
        }
        editingState = null;
        editProviderInput = '';
    }

    function cancelEdit() {
        editingState = null;
        editProviderInput = '';
    }

    function deleteMapping(url: string) {
        const confirmText = formatString(language.mappingDeleteConfirm, { url });
        const confirmed = confirm(confirmText);
        if (!confirmed) return;

        const success = ProviderManager.removeProvider(url);
        if (success) {
            refreshData();
        } else {
            alert(language.failToDeleteMapping);
        }
    }

    $: filteredEntries = (() => {
        if (!searchQuery.trim()) return entries;
        const query = searchQuery.toLowerCase();
        return entries.filter(([url, provider]) => 
            url.toLowerCase().includes(query) || provider.toLowerCase().includes(query)
        );
    })();
</script>

<div class="ut-flex ut-flex-col ut-h-full">
    <!-- Action Header -->
    <div class="ut-sticky ut-top-0 ut-z-10 ut-bg-zinc-900 ut-border-b ut-border-zinc-700/60 ut-px-3 ut-py-3 ut-flex-shrink-0 ut-shadow-[0_4px_16px_0_rgba(0,0,0,0.25)]">
        <div class="ut-flex ut-flex-wrap ut-flex-row ut-justify-between ut-items-center ut-gap-3">
            <!-- Search and Info Group -->
            <div class="ut-flex ut-items-center ut-gap-2 ut-text-xs">
                <span class="ut-text-zinc-400 ut-hidden md:ut-inline">{language.search}:</span>
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder={language.search}
                    class="ut-bg-zinc-800 ut-text-zinc-200 ut-border ut-border-zinc-700/60 ut-rounded ut-px-2 ut-py-1 ut-text-xs ut-max-w-[200px] ut-placeholder-zinc-500"
                />
                <span class="ut-text-zinc-500 ut-text-xs">
                    {filteredEntries.length} / {entries.length}
                </span>
            </div>
            
            <!-- Add Button Group -->
            <div class="ut-flex ut-justify-end">
                <button
                    class="ut-px-1.5 ut-py-1.5 ut-bg-zinc-700 hover:ut-bg-zinc-600 ut-text-zinc-200 ut-rounded ut-text-xs ut-flex ut-items-center ut-gap-2 ut-transition-colors ut-duration-200 focus:ut-outline-none focus:ut-ring-2 focus:ut-ring-offset-2 focus:ut-ring-offset-zinc-900 focus:ut-ring-blue-500"
                    on:click={showAddMappingDialog}
                >
                    <Plus size={16} />
                    <span>{language.addMapping}</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Mappings Table Area -->
    <div class="ut-flex-1 ut-overflow-y-auto ut-overflow-x-auto">
        {#if entries.length === 0}
            <div class="ut-text-center ut-text-zinc-500 ut-py-8">
                {language.noRecordsFound}
            </div>
        {:else if filteredEntries.length === 0}
            <div class="ut-text-center ut-text-zinc-500 ut-py-8">
                {language.noRecordsFound}
            </div>
        {:else}
            <table class="ut-min-w-full ut-divide-y ut-divide-zinc-700/60 ut-table-auto">
                <thead class="ut-bg-zinc-800 ut-sticky ut-top-0 ut-z-10 ut-shadow-lg">
                    <tr>
                        <th scope="col" class="ut-px-4 ut-py-2 ut-text-left ut-text-xs ut-font-medium ut-uppercase ut-tracking-wider ut-text-zinc-400">
                            {language.url}
                        </th>
                        <th scope="col" class="ut-px-4 ut-py-2 ut-text-left ut-text-xs ut-font-medium ut-uppercase ut-tracking-wider ut-text-zinc-400">
                            {language.provider}
                        </th>
                        <th scope="col" class="ut-px-4 ut-py-2 ut-text-right ut-text-xs ut-font-medium ut-uppercase ut-tracking-wider ut-text-zinc-400 ut-whitespace-nowrap">
                            {language.actions}
                        </th>
                    </tr>
                </thead>
                <tbody class="ut-divide-y ut-divide-zinc-700/60 ut-bg-zinc-900/50">
                    {#each filteredEntries as [url, provider] (url)}
                        <tr class="hover:ut-bg-zinc-800/50 ut-transition-colors">
                            <td class="ut-px-4 ut-py-2 ut-text-sm ut-text-zinc-200">
                                <div class="ut-truncate" title={url}>{url}</div>
                            </td>
                            <td class="ut-px-4 ut-py-2 ut-text-sm ut-text-zinc-200">
                                {#if editingState?.url === url}
                                    <div class="ut-flex ut-items-center ut-gap-2">
                                        <!-- svelte-ignore a11y-autofocus -->
                                        <input
                                            type="text"
                                            bind:value={editProviderInput}
                                            class="ut-bg-zinc-700 ut-text-zinc-100 ut-px-2 ut-py-1 ut-rounded ut-text-sm ut-flex-1 ut-min-w-0"
                                            on:keydown={(e) => {
                                                if (e.key === 'Enter') confirmProviderEdit(url);
                                                else if (e.key === 'Escape') cancelEdit();
                                            }}
                                            autofocus
                                        />
                                    </div>
                                {:else}
                                    <div class="ut-truncate" title={provider}>{provider}</div>
                                {/if}
                            </td>
                            <td class="ut-px-4 ut-py-2 ut-text-sm ut-whitespace-nowrap">
                                {#if editingState?.url === url}
                                    <div class="ut-flex ut-items-center ut-justify-end ut-gap-2">
                                        <button class="ut-text-green-500 hover:ut-text-green-400 ut-transition-colors" on:click={() => confirmProviderEdit(url)} title={language.confirm}>
                                            <Check size={18} />
                                        </button>
                                        <button class="ut-text-zinc-400 hover:ut-text-zinc-200 ut-transition-colors" on:click={cancelEdit} title={language.cancel}>
                                            <X size={18} />
                                        </button>
                                    </div>
                                {:else}
                                    <div class="ut-flex ut-items-center ut-justify-end ut-gap-2">
                                        <button class="ut-text-zinc-400 hover:ut-text-zinc-200 ut-transition-colors" on:click={() => startEditingProvider(url, provider)} title={language.edit}>
                                            <Pencil size={16} />
                                        </button>
                                        <button class="ut-text-red-600 hover:ut-text-red-500 ut-transition-colors" on:click={() => deleteMapping(url)} title={language.delete}>
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/if}
    </div>
</div>