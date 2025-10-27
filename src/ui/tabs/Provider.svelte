<script lang="ts">
    import { onMount } from 'svelte';
    import { ProviderManager } from '../../manager/provider';

    export let key: number = 0;

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
        const url = prompt('URL을 입력하세요:');
        if (!url) return;

        const provider = prompt('Provider 이름을 입력하세요:');
        if (!provider) return;

        ProviderManager.setProvider(url, provider);
        refreshData();
    }

    function showEditMappingDialog(url: string, currentProvider: string) {
        const newProvider = prompt(`Provider 이름을 수정하세요 (현재: ${currentProvider}):`, currentProvider);
        if (!newProvider || newProvider === currentProvider) return;

        ProviderManager.setProvider(url, newProvider);
        refreshData();
    }

    function deleteMapping(url: string) {
        const confirmed = confirm(`이 매핑을 삭제하시겠습니까?\nURL: ${url}`);
        if (!confirmed) return;

        const success = ProviderManager.removeProvider(url);
        if (success) {
            refreshData();
        } else {
            alert('삭제에 실패했습니다.');
        }
    }
</script>

<div class="space-y-4 px-3">
    <div class="flex justify-between items-center">
        <h3 class="text-xl font-semibold text-zinc-100">URL → Provider 매핑</h3>
        <button
            class="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
            on:click={showAddMappingDialog}
        >
            + 매핑 추가
        </button>
    </div>

    <div class="text-sm text-zinc-400">
        <p>각 URL에 대한 프로바이더 이름을 관리합니다.</p>
        <p>프로바이더 이름을 변경하면 해당 URL의 모든 레코드가 영향을 받습니다.</p>
    </div>

    <div class="space-y-2 max-h-96 overflow-y-auto">
        {#if entries.length === 0}
            <div class="text-center text-zinc-500 py-8">
                등록된 매핑이 없습니다.
            </div>
        {:else}
            {#each entries as [url, provider] (url)}
                <div class="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg">
                    <div class="flex-1 min-w-0">
                        <div class="text-xs text-zinc-400 truncate" title={url}>URL: {url}</div>
                        <div class="text-sm text-zinc-200 font-medium">Provider: {provider}</div>
                    </div>
                    <button
                        class="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded transition-colors"
                        on:click={() => showEditMappingDialog(url, provider)}
                    >
                        수정
                    </button>
                    <button
                        class="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                        on:click={() => deleteMapping(url)}
                    >
                        삭제
                    </button>
                </div>
            {/each}
        {/if}
    </div>
</div>