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
  class="ut-fixed ut-inset-0 ut-bg-black/60 ut-z-50 ut-flex ut-items-center ut-justify-center"
  on:click={onClose}
  on:keydown={(e) => e.key === 'Escape' && onClose()}
  role="button"
  tabindex="0"
>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="ut-flex ut-justify-center ut-w-full ut-h-full">
        <div class="ut-flex ut-flex-col ut-p-3 sm:ut-p-6 ut-rounded-lg ut-bg-zinc-900 ut-w-full ut-max-w-4xl ut-h-full ut-cursor-default" on:click|stopPropagation role="dialog" aria-modal="true">
            <!-- Header -->
            <div class="ut-flex ut-justify-between ut-items-center ut-w-full ut-mb-2 ut-flex-shrink-0 ut-gap-2 ut-flex-wrap">
                <h2 class="ut-text-lg sm:ut-text-2xl ut-font-semibold ut-text-zinc-100">{PLUGIN_NAME}</h2>
                <div class="ut-flex ut-items-center ut-gap-2 ut-flex-wrap">
                    <button class="ut-px-3 ut-py-2 ut-rounded-lg ut-text-sm ut-whitespace-nowrap {currentTab === 'usage' ? 'ut-bg-zinc-700' : 'ut-bg-zinc-800'} ut-text-zinc-200 ut-transition-colors ut-font-medium hover:ut-bg-zinc-700" title="Usage Statistics" on:click={() => currentTab = 'usage'} disabled={currentTab === 'usage'}>
                        <span>{language.usage}</span>
                    </button>

                    <button class="ut-px-3 ut-py-2 ut-rounded-lg ut-text-sm ut-whitespace-nowrap {currentTab === 'price' ? 'ut-bg-zinc-700' : 'ut-bg-zinc-800'} ut-text-zinc-200 ut-transition-colors ut-font-medium hover:ut-text-zinc-100 hover:ut-bg-zinc-700 ut-flex ut-items-center ut-gap-1" title="Price Information" on:click={() => currentTab = 'price'} disabled={currentTab === 'price'}>
                        <span>{language.price}</span>
                        <span class="{hasTempPrice ? 'ut-block' : 'ut-hidden'} ut-text-yellow-400">
                            <TriangleAlert size={16} />
                        </span>
                    </button>

                    <!-- Settings Button and Dropdown Wrapper -->
                    <div class="ut-relative">
                        <button bind:this={settingsButtonRef} class="ut-p-2 ut-rounded-lg ut-bg-zinc-800 ut-text-zinc-200 hover:ut-bg-zinc-700 ut-transition-colors" title="Settings" on:click={() => {settingsExpanded = !settingsExpanded; languagesExpanded = false;}}>
                            <Settings size={20} />
                        </button>
                        
                        <!-- Settings Section (Collapsible) -->
                        {#if settingsExpanded}
                            <div bind:this={settingsDropdownRef} class="ut-absolute ut-right-0 ut-top-full ut-mt-2 ut-p-2 ut-w-48 ut-bg-zinc-800 ut-rounded-lg ut-shadow-xl ut-flex ut-flex-col ut-gap-1 ut-text-zinc-100 ut-border ut-border-zinc-700/60 ut-z-50">
                                <button class="ut-flex ut-items-center ut-gap-2 ut-px-3 ut-py-2 ut-rounded-lg hover:ut-bg-zinc-700 ut-text-zinc-200 ut-transition-colors ut-text-sm ut-w-full ut-justify-start" on:click={backup}>
                                    <Upload size={16} />
                                    <span>{language.backup}</span>
                                </button>
                                <button class="ut-flex ut-items-center ut-gap-2 ut-px-3 ut-py-2 ut-rounded-lg hover:ut-bg-zinc-700 ut-text-zinc-200 ut-transition-colors ut-text-sm ut-w-full ut-justify-start" on:click={restore}>
                                    <Download size={16} />
                                    <span>{language.restore}</span>
                                </button>
                                <button class="ut-flex ut-items-center ut-gap-2 ut-px-3 ut-py-2 ut-rounded-lg {currentTab === 'provider' ? 'ut-bg-zinc-700' : ''} hover:ut-bg-zinc-700 ut-text-zinc-200 ut-transition-colors ut-text-sm ut-w-full ut-justify-start" on:click={() => currentTab = 'provider'} disabled={currentTab === 'provider'}>
                                    <Columns2 size={16} />
                                    <span>{language.provider}</span>
                                </button>
                                <button class="ut-flex ut-items-center ut-gap-2 ut-px-3 ut-py-2 ut-rounded-lg {currentTab === 'record' ? 'ut-bg-zinc-700' : ''} hover:ut-bg-zinc-700 ut-text-zinc-200 ut-transition-colors ut-text-sm ut-w-full ut-justify-start" on:click={() => currentTab = 'record'} disabled={currentTab === 'record'}>
                                    <Database size={16} />
                                    <span>{language.record}</span>
                                </button>

                                <!-- Language Selection -->
                                <button class="ut-flex ut-items-center ut-gap-2 ut-px-3 ut-py-2 ut-rounded-lg {languagesExpanded ? 'ut-bg-zinc-700' : '' } hover:ut-bg-zinc-700 ut-text-zinc-200 ut-transition-colors ut-text-sm ut-w-full ut-justify-start" on:click={() => languagesExpanded = !languagesExpanded}>
                                    <Globe size={16} />
                                    <span>{language.language}</span>
                                </button>
                                {#if languagesExpanded}
                                    <div class="ut-space-y-1 ut-pl-4">
                                        {#each Object.values(LanguageType) as lang}
                                            <button
                                                class="ut-w-full ut-text-left ut-px-2 ut-py-1.5 ut-rounded ut-text-xs ut-transition-colors {currentLanguage === lang ? 'ut-bg-zinc-700 ut-text-zinc-100' : 'ut-text-zinc-400 hover:ut-bg-zinc-700 hover:ut-text-zinc-200'}"
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

                    <button class="ut-p-2 ut-rounded-lg ut-bg-zinc-800 ut-text-zinc-200 hover:ut-bg-zinc-700 ut-transition-colors" title="Close" on:click={onClose}>
                        <X size={20} />
                    </button>
                </div>
            </div>
            
            <!-- Body Container -->
            <div class="ut-flex-1 ut-overflow-y-auto ut-min-h-0 ut-pt-2">
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