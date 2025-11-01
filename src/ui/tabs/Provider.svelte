<script lang="ts">
    import { onMount } from 'svelte';
    import { ProviderManager } from '../../manager/provider';
    import { formatString, type LanguageType } from '../../lang';
    import { Plus, Check, X, Pencil, Trash } from 'lucide-svelte';

    export let key: number = 0;
    export let language: LanguageType;

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

<div class="flex flex-col h-full">
    <!-- Action Header -->
    <div class="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-700/60 px-3 py-3 flex-shrink-0 shadow-[0_4px_16px_0_rgba(0,0,0,0.25)]">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <!-- Search and Info Group -->
            <div class="flex items-center gap-2 text-xs flex-wrap">
                <span class="text-zinc-400 hidden md:inline">{language.search}:</span>
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder={language.search}
                    class="bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs max-w-[200px] placeholder-zinc-500"
                />
                <span class="text-zinc-500 text-xs">
                    {filteredEntries.length} / {entries.length}
                </span>
            </div>
            
            <!-- Add Button Group -->
            <div class="flex justify-end">
                <button
                    class="px-1.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded text-xs flex items-center gap-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-blue-500"
                    on:click={showAddMappingDialog}
                >
                    <Plus size={16} />
                    <span>{language.addMapping}</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Mappings Table Area -->
    <div class="flex-1 overflow-y-auto overflow-x-auto">
        {#if entries.length === 0}
            <div class="text-center text-zinc-500 py-8">
                {language.noRecordsFound}
            </div>
        {:else if filteredEntries.length === 0}
            <div class="text-center text-zinc-500 py-8">
                {language.noRecordsFound}
            </div>
        {:else}
            <table class="min-w-full divide-y divide-zinc-700/60 table-auto">
                <thead class="bg-zinc-800 sticky top-0 z-10 shadow-lg">
                    <tr>
                        <th scope="col" class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                            {language.url}
                        </th>
                        <th scope="col" class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                            {language.provider}
                        </th>
                        <th scope="col" class="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-zinc-400 whitespace-nowrap">
                            {language.actions}
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-zinc-700/60 bg-zinc-900/50">
                    {#each filteredEntries as [url, provider] (url)}
                        <tr class="hover:bg-zinc-800/50 transition-colors">
                            <td class="px-4 py-2 text-sm text-zinc-200">
                                <div class="truncate" title={url}>{url}</div>
                            </td>
                            <td class="px-4 py-2 text-sm text-zinc-200">
                                {#if editingState?.url === url}
                                    <div class="flex items-center gap-2">
                                        <!-- svelte-ignore a11y-autofocus -->
                                        <input
                                            type="text"
                                            bind:value={editProviderInput}
                                            class="bg-zinc-700 text-zinc-100 px-2 py-1 rounded text-sm flex-1 min-w-0"
                                            on:keydown={(e) => {
                                                if (e.key === 'Enter') confirmProviderEdit(url);
                                                else if (e.key === 'Escape') cancelEdit();
                                            }}
                                            autofocus
                                        />
                                    </div>
                                {:else}
                                    <div class="truncate" title={provider}>{provider}</div>
                                {/if}
                            </td>
                            <td class="px-4 py-2 text-sm whitespace-nowrap">
                                {#if editingState?.url === url}
                                    <div class="flex items-center justify-end gap-2">
                                        <button class="text-green-500 hover:text-green-400 transition-colors" on:click={() => confirmProviderEdit(url)} title={language.confirm}>
                                            <Check size={18} />
                                        </button>
                                        <button class="text-zinc-400 hover:text-zinc-200 transition-colors" on:click={cancelEdit} title={language.cancel}>
                                            <X size={18} />
                                        </button>
                                    </div>
                                {:else}
                                    <div class="flex items-center justify-end gap-2">
                                        <button class="text-zinc-400 hover:text-zinc-200 transition-colors" on:click={() => startEditingProvider(url, provider)} title={language.edit}>
                                            <Pencil size={16} />
                                        </button>
                                        <button class="text-red-600 hover:text-red-500 transition-colors" on:click={() => deleteMapping(url)} title={language.delete}>
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