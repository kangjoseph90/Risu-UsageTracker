<script lang="ts">
    import { PriceManager } from "../manager/price";
    import { PLUGIN_NAME } from "../plugin";
    import { TriangleAlert, Settings, X, Upload, Download, Columns2, Database } from 'lucide-svelte';
    import Usage from "./tabs/Usage.svelte";
    import Price from "./tabs/Price.svelte";
    import Provider from "./tabs/Provider.svelte";
    import Record from "./tabs/Record.svelte";
    import { BackupManager } from "../manager/backup";
    import { LanguageManager } from "../manager/language";
    import type { Language } from '../lang';
    import { LanguageType, LanguageTypeLabels } from '../lang';
    import { Globe } from 'lucide-svelte';
    import { createEventDispatcher } from "svelte";
    
    export let onClose: () => void;
    export let language: Language;
    let currentTab: 'usage' | 'price' | 'provider' | 'record' = 'usage';
    let hasTempPrice: boolean = PriceManager.hasTemporaryPrice();
    let settingsExpanded: boolean = false;
    let settingsDropdownRef: HTMLDivElement | null = null;
    let settingsButtonRef: HTMLButtonElement | null = null;

    // Close settings dropdown when clicking outside
    function handleDocumentClick(event: MouseEvent) {
        if (settingsExpanded && settingsDropdownRef && !settingsDropdownRef.contains(event.target as Node) && !settingsButtonRef?.contains(event.target as Node)) {
            settingsExpanded = false;
            languagesExpanded = false;
        }
    }

    $: if (settingsExpanded) {
        document.addEventListener('mousedown', handleDocumentClick);
    } else {
        document.removeEventListener('mousedown', handleDocumentClick);
    }

    let languagesExpanded: boolean = false;
    let refreshKey: number = 0;
    let currentLanguage: LanguageType = LanguageManager.getLanguage();

    const dispatch = createEventDispatcher();
    
    function refreshTempIndicator() {
        hasTempPrice = PriceManager.hasTemporaryPrice();
    }

    function forceRefresh() {
        refreshTempIndicator();
        refreshKey++;
    }

    function changeLanguage(lang: LanguageType) {
        LanguageManager.setLanguage(lang);
        currentLanguage = lang;
        dispatch('change', { language: lang });
    }

    async function backup() {
        const confirmed = confirm(language.backupConfirm);
        if (confirmed) {
            const success = await BackupManager.backup();
            if (success) {
                alert(language.backupSuccess);
            } else {
                alert(language.backupFail);
            }
        }
    }
    async function restore() {
        const confirmed = confirm(language.restoreConfirm);
        if (confirmed) {
            const success = await BackupManager.restore();
            if (success) {
                alert(language.restoreSuccess);

                // Refresh language
                currentLanguage = LanguageManager.getLanguage();
                dispatch('change', { language: currentLanguage });

                // Refresh modal
                forceRefresh();
            } else {
                alert(language.restoreFail);
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
        <div class="flex flex-col p-3 sm:p-6 rounded-lg bg-zinc-900 w-full max-w-4xl h-full cursor-default" on:click|stopPropagation role="dialog" aria-modal="true">
            <!-- Header -->
            <div class="flex justify-between items-center w-full mb-2 flex-shrink-0 gap-2 flex-wrap">
                <h2 class="text-lg sm:text-2xl font-semibold text-zinc-100">{PLUGIN_NAME}</h2>
                <div class="flex items-center gap-2 flex-wrap">
                    <button class="px-3 py-2 rounded-lg text-sm whitespace-nowrap {currentTab === 'usage' ? 'bg-zinc-700' : 'bg-zinc-800'} text-zinc-200 transition-colors font-medium hover:bg-zinc-700" title="Usage Statistics" on:click={() => currentTab = 'usage'} disabled={currentTab === 'usage'}>
                        <span>{language.usage}</span>
                    </button>

                    <button class="px-3 py-2 rounded-lg text-sm whitespace-nowrap {currentTab === 'price' ? 'bg-zinc-700' : 'bg-zinc-800'} text-zinc-200 transition-colors font-medium hover:text-zinc-100 hover:bg-zinc-700 flex items-center gap-1" title="Price Information" on:click={() => currentTab = 'price'} disabled={currentTab === 'price'}>
                        <span>{language.price}</span>
                        <span class="price-warning-icon {hasTempPrice ? 'block' : 'hidden'} text-yellow-400">
                            <TriangleAlert size={16} />
                        </span>
                    </button>

                    <!-- Settings Button and Dropdown Wrapper -->
                    <div class="relative">
                        <button bind:this={settingsButtonRef} class="p-2 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors" title="Settings" on:click={() => {settingsExpanded = !settingsExpanded; languagesExpanded = false;}}>
                            <Settings size={20} />
                        </button>
                        
                        <!-- Settings Section (Collapsible) -->
                        {#if settingsExpanded}
                            <div bind:this={settingsDropdownRef} class="absolute right-0 top-full mt-2 p-2 w-48 bg-zinc-800 rounded-lg shadow-xl flex flex-col gap-1 text-zinc-100 border border-zinc-700/60 z-50">
                                <button class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-700 text-zinc-200 transition-colors text-sm w-full justify-start" on:click={backup}>
                                    <Upload size={16} />
                                    <span>{language.backup}</span>
                                </button>
                                <button class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-700 text-zinc-200 transition-colors text-sm w-full justify-start" on:click={restore}>
                                    <Download size={16} />
                                    <span>{language.restore}</span>
                                </button>
                                <button class="flex items-center gap-2 px-3 py-2 rounded-lg {currentTab === 'provider' ? 'bg-zinc-700' : ''} hover:bg-zinc-700 text-zinc-200 transition-colors text-sm w-full justify-start" on:click={() => currentTab = 'provider'} disabled={currentTab === 'provider'}>
                                    <Columns2 size={16} />
                                    <span>{language.provider}</span>
                                </button>
                                <button class="flex items-center gap-2 px-3 py-2 rounded-lg {currentTab === 'record' ? 'bg-zinc-700' : ''} hover:bg-zinc-700 text-zinc-200 transition-colors text-sm w-full justify-start" on:click={() => currentTab = 'record'} disabled={currentTab === 'record'}>
                                    <Database size={16} />
                                    <span>{language.record}</span>
                                </button>

                                <!-- Language Selection -->
                                <button class="flex items-center gap-2 px-3 py-2 rounded-lg {languagesExpanded ? 'bg-zinc-700' : '' } hover:bg-zinc-700 text-zinc-200 transition-colors text-sm w-full justify-start" on:click={() => languagesExpanded = !languagesExpanded}>
                                    <Globe size={16} />
                                    <span>{language.language}</span>
                                </button>
                                {#if languagesExpanded}
                                    <div class="space-y-1 pl-4">
                                        {#each Object.values(LanguageType) as lang}
                                            <button
                                                class="w-full text-left px-2 py-1.5 rounded text-xs transition-colors {currentLanguage === lang ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'}"
                                                on:click={() => changeLanguage(lang)}
                                            >
                                                {LanguageTypeLabels[lang]}
                                            </button>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>

                    <button class="p-2 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors" title="Close" on:click={onClose}>
                        <X size={20} />
                    </button>
                </div>
            </div>
            
            <!-- Body Container -->
            <div class="flex-1 overflow-y-auto min-h-0 pt-2">
                {#if currentTab === 'usage'}
                    <Usage key={refreshKey} {language} />
                {:else if currentTab === 'price'}
                    <Price key={refreshKey} {language} on:change={refreshTempIndicator} />
                {:else if currentTab === 'provider'}
                    <Provider key={refreshKey} {language} />
                {:else if currentTab === 'record'}
                    <Record key={refreshKey} {language} />
                {/if}
            </div>
        </div>
    </div>
</div>