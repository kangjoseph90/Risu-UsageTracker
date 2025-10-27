<script lang="ts">
    import { PriceManager } from "../manager/price";
    import { PLUGIN_NAME } from "../plugin";
    import { TriangleAlert, Settings, X, Upload, Download, Columns2, Database } from 'lucide-svelte';
    import Usage from "./tabs/Usage.svelte";
    import Price from "./tabs/Price.svelte";
    import Provider from "./tabs/Provider.svelte";
    import Record from "./tabs/Record.svelte";
    import { BackupManager } from "../manager/backup";

    export let onClose: () => void;

    let currentTab: 'usage' | 'price' | 'provider' | 'record' = 'usage';
    let hasTempPrice: boolean = PriceManager.hasTemporaryPrice();
    let settingsExpanded: boolean = false;
    let refreshKey: number = 0;

    function refreshTempIndicator() {
        hasTempPrice = PriceManager.hasTemporaryPrice();
    }

    function forceRefresh() {
        refreshTempIndicator();
        refreshKey++;
    }

    async function backup() {
        const confirmed = confirm('현재 모든 데이터를 백업하시겠습니까?');
        if (confirmed) {
            const success = await BackupManager.backup();
            if (success) {
                alert('백업이 완료되었습니다.');
            } else {
                alert('백업에 실패했습니다.');
            }
        }
    }
    async function restore() {
        const confirmed = confirm('백업된 데이터로 복구하시겠습니까?\n현재 데이터가 덮어씌워집니다.');
        if (confirmed) {
            const success = await BackupManager.restore();
            if (success) {
                alert('복구가 완료되었습니다.');
                // 모달 새로고침
                forceRefresh();
            } else {
                alert('복구된 백업 데이터가 없습니다.');
            }
        }
    }
</script>


<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div 
  class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
  on:click={onClose}
  on:keydown={(e) => e.key === 'Escape' && onClose()}
  role="button"
  tabindex="0"
>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="flex justify-center w-full h-full">
        <div class="flex flex-col p-3 sm:p-6 rounded-lg bg-zinc-900 w-full max-w-4xl h-full" on:click|stopPropagation role="dialog" aria-modal="true">
            <!-- Header -->
            <div class="flex justify-between items-center w-full mb-2 flex-shrink-0">
                <h2 class="text-lg sm:text-2xl font-semibold text-zinc-100">{PLUGIN_NAME}</h2>
                <div class="flex items-center gap-2">
                    <button class="px-3 py-2 rounded-lg {currentTab === 'usage' ? 'bg-zinc-700' : 'bg-zinc-800'} text-zinc-200 transition-colors text-sm font-medium hover:bg-zinc-700" title="사용량 통계" on:click={() => currentTab = 'usage'} disabled={currentTab === 'usage'}>
                        <span>사용량<span></span>
                    </button>

                    <button class="px-3 py-2 rounded-lg {currentTab === 'price' ? 'bg-zinc-700' : 'bg-zinc-800'} text-zinc-200 transition-colors text-sm font-medium hover:text-zinc-100 hover:bg-zinc-700 flex items-center gap-1" title="가격 정보" on:click={() => currentTab = 'price'} disabled={currentTab === 'price'}>
                        <span>가격</span>
                        <span class="price-warning-icon {hasTempPrice ? 'block' : 'hidden'} text-yellow-400">
                            <TriangleAlert size={16} />
                        </span>
                    </button>

                    <button class="p-2 text-zinc-200 hover:text-white transition-colors" title="설정" on:click={() => settingsExpanded = !settingsExpanded}>
                        <Settings size={16} />
                    </button>
                    <button class="p-2 text-zinc-200 hover:text-white transition-colors" title="닫기" on:click={onClose}>
                        <X size={16} />
                    </button>
                </div>
            </div>
            <!-- Settings Section (Collapsible) -->
            <div class="flex-shrink-0 overflow-hidden transition-all duration-300" style="max-height: {settingsExpanded ? '200px' : '0'};">
                <div class="px-4 py-2">
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button class="flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition-colors text-sm" on:click={backup}>
                            <Upload size={16} />
                            <span>백업</span>
                        </button>
                        <button class="flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition-colors text-sm" on:click={restore}>
                            <Download size={16} />
                            <span>복구</span>
                        </button>
                        <button class="flex items-center justify-center gap-2 px-3 py-2 {currentTab === 'provider' ? 'bg-zinc-700' : 'bg-zinc-800'} hover:bg-zinc-700 text-zinc-200 rounded transition-colors text-sm" on:click={() => currentTab = 'provider'} disabled={currentTab === 'provider'}>
                            <Columns2 size={16} />
                            <span>프로바이더</span>
                        </button>
                        <button class="flex items-center justify-center gap-2 px-3 py-2 {currentTab === 'record' ? 'bg-zinc-700' : 'bg-zinc-800'} hover:bg-zinc-700 text-zinc-200 rounded transition-colors text-sm" on:click={() => currentTab = 'record'} disabled={currentTab === 'record'}>
                            <Database size={16} />
                            <span>레코드</span>
                        </button>
                    </div>
                </div>
            </div>
            <!-- Body Container -->
            <div class="flex-1 overflow-y-auto min-h-0 mt-2">
                {#if currentTab === 'usage'}
                    <Usage key={refreshKey} />
                {:else if currentTab === 'price'}
                    <Price key={refreshKey} on:change={refreshTempIndicator} />
                {:else if currentTab === 'provider'}
                    <Provider key={refreshKey} />
                {:else if currentTab === 'record'}
                    <Record key={refreshKey} />
                {/if}
            </div>
        </div>
    </div>
</div>
