<script lang="ts">
    import { onMount } from 'svelte';
    import { ProviderManager } from '../../manager/provider';
    import { formatString, type LanguageType } from '../../lang';

    export let key: number = 0;
    export let language: LanguageType;

    let providerMap: Record<string, string> = {};
    let entries: [string, string][] = [];

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

    function showEditMappingDialog(url: string, currentProvider: string) {
        const promptText = formatString(language.mappingEditProviderPrompt, { provider: currentProvider });
        const newProvider = prompt(promptText, currentProvider);
        if (!newProvider || newProvider === currentProvider) return;

        ProviderManager.setProvider(url, newProvider);
        refreshData();
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
</script>

<div class="space-y-4 px-3">
    <div class="flex justify-between items-center">
        <h3 class="text-xl font-semibold text-zinc-100">{language.urlToProvider}</h3>
        <button
            class="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
            on:click={showAddMappingDialog}
        >
            + {language.addMapping}
        </button>
    </div>

    <div class="text-sm text-zinc-400">
        <p>{language.providerDescription1}</p>
        <p>{language.providerDescription2}</p>
    </div>

    <div class="space-y-2 max-h-96 overflow-y-auto">
        {#if entries.length === 0}
            <div class="text-center text-zinc-500 py-8">
                {language.noMappings}
            </div>
        {:else}
            {#each entries as [url, provider] (url)}
                <div class="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg">
                    <div class="flex-1 min-w-0">
                        <div class="text-xs text-zinc-400 truncate" title={url}>{language.url}: {url}</div>
                        <div class="text-sm text-zinc-200 font-medium">{language.provider}: {provider}</div>
                    </div>
                    <button
                        class="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded transition-colors"
                        on:click={() => showEditMappingDialog(url, provider)}
                        title="Edit Mapping"
                    >
                        {language.edit}
                    </button>
                    <button
                        class="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                        on:click={() => deleteMapping(url)}
                        title="Delete Mapping"
                    >
                        {language.delete}
                    </button>
                </div>
            {/each}
        {/if}
    </div>
</div>