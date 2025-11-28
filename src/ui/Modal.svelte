<script lang="ts">
    import { PriceManager } from "../manager/price";
    import { PLUGIN_NAME } from "../plugin";
    import {
        TriangleAlert,
        Settings,
        X,
        Columns2,
        Database,
        Globe,
        Upload,
        Download,
        CircleDollarSign,
    } from "lucide-svelte";
    import Usage from "./tabs/Usage.svelte";
    import Price from "./tabs/Price.svelte";
    import Provider from "./tabs/Provider.svelte";
    import Record from "./tabs/Record.svelte";
    import Budget from "./tabs/Budget.svelte";
    import Error from "./tabs/Error.svelte";
    import { BackupManager } from "../manager/backup";
    import { LanguageManager } from "../manager/language";
    import { language, LanguageType, LanguageTypeLabels } from "../lang";
    import { alert, confirm } from "./popup";

    export let onClose: () => void;
    let currentTab: "usage" | "price" | "provider" | "record" | "budget" | "error" =
        "usage";
    let hasTempPrice: boolean = PriceManager.hasTemporaryPrice();
    let settingsExpanded: boolean = false;
    let settingsDropdownRef: HTMLDivElement | null = null;
    let settingsButtonRef: HTMLButtonElement | null = null;
    let fileInputRef: HTMLInputElement;

    // State for nested dropdowns
    let languagesExpanded: boolean = false;
    let backupOptionsExpanded: boolean = false;
    let restoreOptionsExpanded: boolean = false;

    // Close settings dropdown when clicking outside
    function handleDocumentClick(event: MouseEvent) {
        if (
            settingsExpanded &&
            settingsDropdownRef &&
            !settingsDropdownRef.contains(event.target as Node) &&
            !settingsButtonRef?.contains(event.target as Node)
        ) {
            settingsExpanded = false;
            languagesExpanded = false;
            backupOptionsExpanded = false;
            restoreOptionsExpanded = false;
        }
    }

    $: if (settingsExpanded) {
        document.addEventListener("mousedown", handleDocumentClick);
    } else {
        document.removeEventListener("mousedown", handleDocumentClick);
    }

    let currentLanguage: LanguageType = LanguageManager.getLanguage();

    function refreshTempIndicator() {
        hasTempPrice = PriceManager.hasTemporaryPrice();
    }

    function changeLanguage(lang: LanguageType) {
        LanguageManager.setLanguage(lang);
        currentLanguage = lang;
    }

    async function backupToBrowser() {
        const confirmed = await confirm($language.backupConfirm);
        if (confirmed) {
            const success = await BackupManager.backup();
            if (success) {
                await alert($language.backupSuccess);
            } else {
                await alert($language.backupFail);
            }
        }
    }
    async function restoreFromBrowser() {
        const confirmed = await confirm($language.restoreConfirm);
        if (confirmed) {
            const success = await BackupManager.restore();
            if (success) {
                await alert($language.restoreSuccess);
                currentLanguage = LanguageManager.getLanguage();
                refreshTempIndicator();
            } else {
                await alert($language.restoreFail);
            }
        }
    }

    async function backupToFile() {
        const success = await BackupManager.exportBackupToFile();
        if (!success) {
            await alert($language.exportFail);
        }
    }

    function restoreFromFile() {
        fileInputRef.click();
    }

    async function handleFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) {
            return;
        }
        const file = input.files[0];

        const confirmed = await confirm($language.restoreConfirm);
        if (confirmed) {
            const success = await BackupManager.importBackupFromFile(file);
            if (success) {
                await alert($language.restoreSuccess);
                currentLanguage = LanguageManager.getLanguage();
                refreshTempIndicator();
            } else {
                await alert($language.restoreFail);
            }
        }
        // Reset file input to allow selecting the same file again
        input.value = "";
    }

    function toggleBackupOptions() {
        backupOptionsExpanded = !backupOptionsExpanded;
        restoreOptionsExpanded = false;
        languagesExpanded = false;
    }

    function toggleRestoreOptions() {
        restoreOptionsExpanded = !restoreOptionsExpanded;
        backupOptionsExpanded = false;
        languagesExpanded = false;
    }

    function toggleLanguageOptions() {
        languagesExpanded = !languagesExpanded;
        backupOptionsExpanded = false;
        restoreOptionsExpanded = false;
    }
</script>

<input
    type="file"
    class="hidden"
    bind:this={fileInputRef}
    on:change={handleFileSelected}
    accept=".json"
/>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
    class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
    on:click={onClose}
    on:keydown={(e) => e.key === "Escape" && onClose()}
    role="button"
    tabindex="0"
>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="flex justify-center w-full h-full">
        <div
            class="flex flex-col p-3 sm:p-6 rounded-lg bg-zinc-900 w-full max-w-4xl h-full cursor-default"
            on:click|stopPropagation
            role="dialog"
            aria-modal="true"
        >
            <!-- Header -->
            <div
                class="flex justify-between items-center w-full mb-2 flex-shrink-0 gap-2 flex-wrap"
            >
                <h2 class="text-lg sm:text-2xl font-semibold text-zinc-100">
                    {PLUGIN_NAME}
                </h2>
                <div class="flex items-center gap-2 flex-wrap">
                    <button
                        class="px-3 py-2 rounded-lg text-sm whitespace-nowrap {currentTab ===
                        'usage'
                            ? 'bg-zinc-700'
                            : 'bg-zinc-800'} text-zinc-200 transition-colors font-medium hover:bg-zinc-700"
                        title={$language.usageTab}
                        on:click={() => (currentTab = "usage")}
                        disabled={currentTab === "usage"}
                    >
                        <span>{$language.usage}</span>
                    </button>

                    <button
                        class="px-3 py-2 rounded-lg text-sm whitespace-nowrap {currentTab ===
                        'budget'
                            ? 'bg-zinc-700'
                            : 'bg-zinc-800'} text-zinc-200 transition-colors font-medium hover:bg-zinc-700"
                        title={$language.budget}
                        on:click={() => (currentTab = "budget")}
                        disabled={currentTab === "budget"}
                    >
                        <span>{$language.budget}</span>
                    </button>

                    <button
                        class="px-3 py-2 rounded-lg text-sm whitespace-nowrap {currentTab ===
                        'price'
                            ? 'bg-zinc-700'
                            : 'bg-zinc-800'} text-zinc-200 transition-colors font-medium hover:text-zinc-100 hover:bg-zinc-700 flex items-center gap-1"
                        title={$language.priceTab}
                        on:click={() => (currentTab = "price")}
                        disabled={currentTab === "price"}
                    >
                        <span>{$language.price}</span>
                        <span
                            class="price-warning-icon {hasTempPrice
                                ? 'block'
                                : 'hidden'} text-yellow-400"
                        >
                            <TriangleAlert size={16} />
                        </span>
                    </button>

                    <!-- Settings Button and Dropdown Wrapper -->
                    <div class="relative">
                        <button
                            bind:this={settingsButtonRef}
                            class="p-2 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
                            title={$language.settings}
                            on:click={() => {
                                settingsExpanded = !settingsExpanded;
                                languagesExpanded = false;
                                backupOptionsExpanded = false;
                                restoreOptionsExpanded = false;
                            }}
                        >
                            <Settings size={20} />
                        </button>

                        <!-- Settings Section (Collapsible) -->
                        {#if settingsExpanded}
                            <div
                                bind:this={settingsDropdownRef}
                                class="absolute right-0 top-full mt-2 p-2 w-56 bg-zinc-800 rounded-lg shadow-xl flex flex-col gap-1 text-zinc-100 border border-zinc-700/60 z-50"
                            >
                                <button
                                    class="flex items-center gap-2 px-3 py-2 rounded-lg {currentTab ===
                                    'provider'
                                        ? 'bg-zinc-700'
                                        : ''} hover:bg-zinc-700 text-zinc-200 transition-colors text-sm w-full justify-start"
                                    on:click={() => (currentTab = "provider")}
                                    disabled={currentTab === "provider"}
                                >
                                    <Columns2 size={16} />
                                    <span>{$language.provider}</span>
                                </button>
                                <button
                                    class="flex items-center gap-2 px-3 py-2 rounded-lg {currentTab ===
                                    'record'
                                        ? 'bg-zinc-700'
                                        : ''} hover:bg-zinc-700 text-zinc-200 transition-colors text-sm w-full justify-start"
                                    on:click={() => (currentTab = "record")}
                                    disabled={currentTab === "record"}
                                >
                                    <Database size={16} />
                                    <span>{$language.record}</span>
                                </button>
                                <button
                                    class="flex items-center gap-2 px-3 py-2 rounded-lg {currentTab ===
                                    'error'
                                        ? 'bg-zinc-700'
                                        : ''} hover:bg-zinc-700 text-zinc-200 transition-colors text-sm w-full justify-start"
                                    on:click={() => (currentTab = "error")}
                                    disabled={currentTab === "error"}
                                >
                                    <TriangleAlert size={16} />
                                    <span>{$language.errorTab}</span>
                                </button>

                                <div
                                    class="border-t border-zinc-700/60 my-1"
                                ></div>

                                <!-- Backup -->
                                <button
                                    class="flex items-center gap-2 px-3 py-2 rounded-lg {backupOptionsExpanded
                                        ? 'bg-zinc-700'
                                        : ''} hover:bg-zinc-700 text-zinc-200 transition-colors text-sm w-full justify-start"
                                    on:click={toggleBackupOptions}
                                >
                                    <Upload size={16} />
                                    <span>{$language.backup}</span>
                                </button>
                                {#if backupOptionsExpanded}
                                    <div class="space-y-1 pl-4">
                                        <button
                                            class="w-full text-left px-2 py-1.5 rounded text-xs transition-colors text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                                            on:click={backupToBrowser}
                                            >{$language.backupToBrowser}</button
                                        >
                                        <button
                                            class="w-full text-left px-2 py-1.5 rounded text-xs transition-colors text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                                            on:click={backupToFile}
                                            >{$language.exportToFile}</button
                                        >
                                    </div>
                                {/if}

                                <!-- Restore -->
                                <button
                                    class="flex items-center gap-2 px-3 py-2 rounded-lg {restoreOptionsExpanded
                                        ? 'bg-zinc-700'
                                        : ''} hover:bg-zinc-700 text-zinc-200 transition-colors text-sm w-full justify-start"
                                    on:click={toggleRestoreOptions}
                                >
                                    <Download size={16} />
                                    <span>{$language.restore}</span>
                                </button>
                                {#if restoreOptionsExpanded}
                                    <div class="space-y-1 pl-4">
                                        <button
                                            class="w-full text-left px-2 py-1.5 rounded text-xs transition-colors text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                                            on:click={restoreFromBrowser}
                                            >{$language.restoreFromBrowser}</button
                                        >
                                        <button
                                            class="w-full text-left px-2 py-1.5 rounded text-xs transition-colors text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                                            on:click={restoreFromFile}
                                            >{$language.importFromFile}</button
                                        >
                                    </div>
                                {/if}

                                <!-- Language Selection -->
                                <button
                                    class="flex items-center gap-2 px-3 py-2 rounded-lg {languagesExpanded
                                        ? 'bg-zinc-700'
                                        : ''} hover:bg-zinc-700 text-zinc-200 transition-colors text-sm w-full justify-start"
                                    on:click={toggleLanguageOptions}
                                >
                                    <Globe size={16} />
                                    <span>{$language.language}</span>
                                </button>
                                {#if languagesExpanded}
                                    <div class="space-y-1 pl-4">
                                        {#each Object.values(LanguageType) as lang}
                                            <button
                                                class="w-full text-left px-2 py-1.5 rounded text-xs transition-colors {currentLanguage ===
                                                lang
                                                    ? 'bg-zinc-700 text-zinc-100'
                                                    : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'}"
                                                on:click={() =>
                                                    changeLanguage(lang)}
                                            >
                                                {LanguageTypeLabels[lang]}
                                            </button>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>

                    <button
                        class="p-2 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
                        title={$language.close}
                        on:click={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            <!-- Body Container -->
            <div class="flex-1 overflow-y-auto min-h-0 pt-2">
                {#if currentTab === "usage"}
                    <Usage />
                {:else if currentTab === "price"}
                    <Price on:change={refreshTempIndicator} />
                {:else if currentTab === "provider"}
                    <Provider />
                {:else if currentTab === "record"}
                    <Record />
                {:else if currentTab === "budget"}
                    <Budget />
                {:else if currentTab === "error"}
                    <Error />
                {/if}
            </div>
        </div>
    </div>
</div>
