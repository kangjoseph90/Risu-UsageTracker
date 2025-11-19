<script lang="ts">
    import { onMount } from 'svelte';
    import { BudgetManager } from '../../manager/budget';
    import { UsageManager } from '../../manager/usage';
    import { ProviderManager } from '../../manager/provider';
    import type { BudgetRule, UsageRecord } from '../../types';
    import { BudgetPeriod, RequestType } from '../../types';
    import DollarDisplay from '../components/DollarDisplay.svelte';
    import type { Language } from '../../lang';
    import { Plus, Check, X, Pencil, Trash } from 'lucide-svelte';
    import { confirm } from '../popup';

    export let key: number = 0;
    export let language: Language;

    let rules: BudgetRule[] = [];
    let allRecords: UsageRecord[] = [];
    
    // Filter states for new rule
    let newRuleName = '';
    let newRulePeriod = BudgetPeriod.Monthly;
    let newRuleLimit = 100;
    let newRuleModel = '';
    let newRuleProvider = '';
    let newRuleRequestType = '';

    // Edit states
    let editingRuleId: string | null = null;
    let editingRuleName = '';
    let editingRuleLimit = 0;
    let editingRulePeriod = BudgetPeriod.Monthly;
    let editingRuleModel = '';
    let editingRuleProvider = '';
    let editingRuleRequestType = '';

    // UI States
    let searchQuery = '';

    // Reactive filter options
    $: uniqueModels = getUniqueModels(allRecords);
    $: uniqueProviders = getUniqueProviders();
    $: uniqueRequestTypes = getUniqueRequestTypes(allRecords);
    $: rulesWithUsage = calculateRulesUsage(rules, allRecords);
    $: filteredRulesWithUsage = searchQuery.trim() 
        ? rulesWithUsage.filter(r => r.rule.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : rulesWithUsage;
    $: sortedRules = [...filteredRulesWithUsage].sort((a, b) => b.percentage - a.percentage);

    onMount(async () => {
        await refreshData();
    });

    $: if (key) {
        refreshData();
    }

    async function refreshData() {
        rules = await BudgetManager.getRules();
        allRecords = UsageManager.getRecords([]);
    }

    function getUniqueModels(records: UsageRecord[]): string[] {
        const unique = new Set<string>();
        records.forEach(record => unique.add(record.model));
        return Array.from(unique).sort();
    }

    function getUniqueProviders(): string[] {
        const providerMap = ProviderManager.getAllProviders();
        const unique = new Set(Object.values(providerMap));
        return Array.from(unique).sort();
    }

    function getUniqueRequestTypes(records: UsageRecord[]): string[] {
        const unique = new Set<string>();
        records.forEach(record => unique.add(record.requestType || RequestType.Unknown));
        return Array.from(unique).sort();
    }

    function calculateRuleUsage(rule: BudgetRule, records: UsageRecord[]): number {
        const now = new Date();
        let startTime: Date;

        switch (rule.period) {
            case BudgetPeriod.Daily:
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case BudgetPeriod.Weekly:
                startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case BudgetPeriod.Monthly:
                startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
        }

        return records
            .filter(r => {
                const recordTime = new Date(r.timestamp);
                if (recordTime <= startTime) return false;
                
                // Apply filters
                if (rule.model && r.model !== rule.model) return false;
                if (rule.provider) {
                    const recordProvider = ProviderManager.getProvider(r.url);
                    if (recordProvider !== rule.provider) return false;
                }
                if (rule.requestType && (r.requestType || RequestType.Unknown) !== rule.requestType) return false;
                
                return true;
            })
            .reduce((acc, r) => acc + r.totalCost, 0);
    }

    function calculateRulesUsage(rules: BudgetRule[], records: UsageRecord[]) {
        return rules.map(rule => {
            const usage = calculateRuleUsage(rule, records);
            const percentage = (usage / rule.limit) * 100;
            return { rule, usage, percentage };
        });
    }

    function getPeriodLabel(period: BudgetPeriod): string {
        switch (period) {
            case BudgetPeriod.Daily:
                return language.daily;
            case BudgetPeriod.Weekly:
                return language.weekly;
            case BudgetPeriod.Monthly:
                return language.monthly;
        }
    }

    async function handleAddRule() {
        if (!newRuleName || newRuleLimit <= 0) return;
        
        await BudgetManager.addRule({
            name: newRuleName,
            period: newRulePeriod,
            limit: newRuleLimit,
            model: newRuleModel || undefined,
            provider: newRuleProvider || undefined,
            requestType: newRuleRequestType || undefined,
        });
        
        // Reset form
        newRuleName = '';
        newRulePeriod = BudgetPeriod.Monthly;
        newRuleLimit = 100;
        newRuleModel = '';
        newRuleProvider = '';
        newRuleRequestType = '';
        
        await refreshData();
    }

    async function handleDeleteRule(ruleId: string) {
        if (await confirm(language.deleteRuleConfirm)) {
            await BudgetManager.deleteRule(ruleId);
            await refreshData();
        }
    }

    function startEditing(rule: BudgetRule) {
        editingRuleId = rule.id;
        editingRuleName = rule.name;
        editingRuleLimit = rule.limit;
        editingRulePeriod = rule.period;
        editingRuleModel = rule.model || '';
        editingRuleProvider = rule.provider || '';
        editingRuleRequestType = rule.requestType || '';
    }

    function cancelEditing() {
        editingRuleId = null;
        editingRuleName = '';
        editingRuleLimit = 0;
        editingRulePeriod = BudgetPeriod.Monthly;
        editingRuleModel = '';
        editingRuleProvider = '';
        editingRuleRequestType = '';
    }

    async function handleUpdateRule() {
        if (!editingRuleId || !editingRuleName || editingRuleLimit <= 0) return;
        const rule = rules.find(r => r.id === editingRuleId);
        if (rule) {
            await BudgetManager.updateRule({
                ...rule,
                name: editingRuleName,
                limit: editingRuleLimit,
                period: editingRulePeriod,
                model: editingRuleModel || undefined,
                provider: editingRuleProvider || undefined,
                requestType: editingRuleRequestType || undefined,
            });
            await refreshData();
        }
        cancelEditing();
    }
</script>

<div class="flex flex-col h-full">
    <!-- Add Rule Section (Top) -->
    <div class="flex-shrink-0 px-3 pt-3 pb-2">
        <div class="rounded-lg bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600/60 transition-colors px-3 pb-3 pt-2">
            <!-- Header: Title and Add Button -->
            <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-zinc-200">{language.addRule}</h3>
                <button
                    on:click={handleAddRule}
                    class="px-2.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded text-xs flex items-center justify-center gap-1.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-blue-500"
                    disabled={!newRuleName || newRuleLimit <= 0}
                    title={language.add}
                >
                    <Plus size={16} />
                    <span class="hidden sm:inline">{language.add}</span>
                </button>
            </div>

            <!-- Grid: 2x3 on PC, 3x2 on mobile -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <!-- Rule Name -->
                <div class="flex flex-col gap-1">
                    <label for="newRuleName" class="text-zinc-400 text-xs whitespace-nowrap">{language.ruleName}</label>
                    <input
                        type="text"
                        id="newRuleName"
                        bind:value={newRuleName}
                        placeholder={language.ruleNamePlaceholder}
                        class="bg-zinc-700 text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs w-full"
                    />
                </div>

                <!-- Limit -->
                <div class="flex flex-col gap-1">
                    <label for="newRuleLimit" class="text-zinc-400 text-xs whitespace-nowrap">{language.limit}</label>
                    <input
                        type="number"
                        id="newRuleLimit"
                        bind:value={newRuleLimit}
                        placeholder={language.limitPlaceholder}
                        min="0"
                        step="0.01"
                        class="bg-zinc-700 text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs w-full"
                    />
                </div>

                <!-- Period -->
                <div class="flex flex-col gap-1">
                    <label for="newRulePeriod" class="text-zinc-400 text-xs whitespace-nowrap">{language.period}</label>
                    <select
                        id="newRulePeriod"
                        bind:value={newRulePeriod}
                        class="bg-zinc-700 text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs w-full"
                    >
                        <option value={BudgetPeriod.Daily}>{language.daily}</option>
                        <option value={BudgetPeriod.Weekly}>{language.weekly}</option>
                        <option value={BudgetPeriod.Monthly}>{language.monthly}</option>
                    </select>
                </div>

                <!-- Model -->
                <div class="flex flex-col gap-1">
                    <label for="newRuleModel" class="text-zinc-400 text-xs whitespace-nowrap">{language.model}</label>
                    <select
                        id="newRuleModel"
                        bind:value={newRuleModel}
                        class="bg-zinc-700 text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs w-full"
                    >
                        <option value="">{language.allModels}</option>
                        {#each uniqueModels as model}
                            <option value={model}>{model}</option>
                        {/each}
                    </select>
                </div>

                <!-- Provider -->
                <div class="flex flex-col gap-1">
                    <label for="newRuleProvider" class="text-zinc-400 text-xs whitespace-nowrap">{language.provider}</label>
                    <select
                        id="newRuleProvider"
                        bind:value={newRuleProvider}
                        class="bg-zinc-700 text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs w-full"
                    >
                        <option value="">{language.allProviders}</option>
                        {#each uniqueProviders as provider}
                            <option value={provider}>{provider}</option>
                        {/each}
                    </select>
                </div>

                <!-- Type -->
                <div class="flex flex-col gap-1">
                    <label for="newRuleRequestType" class="text-zinc-400 text-xs whitespace-nowrap">{language.type}</label>
                    <select
                        id="newRuleRequestType"
                        bind:value={newRuleRequestType}
                        class="bg-zinc-700 text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs w-full"
                    >
                        <option value="">{language.allTypes}</option>
                        {#each uniqueRequestTypes as type}
                            <option value={type}>{type}</option>
                        {/each}
                    </select>
                </div>
            </div>
        </div>
    </div>

    <!-- Action Header -->
    <div class="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-700/60 px-3 py-3 flex-shrink-0 shadow-[0_4px_16px_0_rgba(0,0,0,0.25)]">
        <div class="flex flex-wrap flex-row justify-between items-center gap-3">
            <!-- Search and Info Group -->
            <div class="flex items-center gap-2 text-xs">
                <span class="text-zinc-400 hidden md:inline">{language.search}:</span>
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder={language.search}
                    class="bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs max-w-[200px] placeholder-zinc-500"
                />
                <span class="text-zinc-500 text-xs">
                    {sortedRules.length} / {rules.length}
                </span>
            </div>
        </div>
    </div>

    <!-- Rules Table Area -->
    <div class="flex-1 overflow-y-auto overflow-x-auto">
        {#if rules.length === 0}
            <div class="text-center text-zinc-500 py-8">
                {language.noBudgetRules}
            </div>
        {:else if sortedRules.length === 0}
            <div class="text-center text-zinc-500 py-8">
                {language.noRecordsFound}
            </div>
        {:else}
            <table class="min-w-full divide-y divide-zinc-700/60 table-auto">
                <thead class="bg-zinc-800 sticky top-0 z-10 shadow-lg">
                    <tr>
                        <th scope="col" class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                            {language.ruleName}
                        </th>
                        <th scope="col" class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                            {language.period}
                        </th>
                        <th scope="col" class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                            {language.limit}
                        </th>
                        <th scope="col" class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                            {language.filters}
                        </th>
                        <th scope="col" class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                            {language.currentUsage}
                        </th>
                        <th scope="col" class="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-zinc-400 whitespace-nowrap">
                            {language.actions}
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-zinc-700/60 bg-zinc-900/50">
                    {#each sortedRules as { rule, usage, percentage } (rule.id)}
                        <tr class="hover:bg-zinc-800/50 transition-colors">
                            <td class="px-4 py-2 text-sm text-zinc-200">
                                {#if editingRuleId === rule.id}
                                    <input
                                        type="text"
                                        bind:value={editingRuleName}
                                        class="bg-zinc-700 text-zinc-100 px-2 py-1 rounded text-sm w-full"
                                    />
                                {:else}
                                    <div class="truncate" title={rule.name}>{rule.name}</div>
                                {/if}
                            </td>
                            <td class="px-4 py-2 text-sm text-zinc-200">
                                {#if editingRuleId === rule.id}
                                    <select
                                        bind:value={editingRulePeriod}
                                        class="bg-zinc-700 text-zinc-100 px-2 py-1 rounded text-sm w-full"
                                    >
                                        <option value={BudgetPeriod.Daily}>{language.daily}</option>
                                        <option value={BudgetPeriod.Weekly}>{language.weekly}</option>
                                        <option value={BudgetPeriod.Monthly}>{language.monthly}</option>
                                    </select>
                                {:else}
                                    {getPeriodLabel(rule.period)}
                                {/if}
                            </td>
                            <td class="px-4 py-2 text-sm text-zinc-200">
                                {#if editingRuleId === rule.id}
                                    <input
                                        type="number"
                                        bind:value={editingRuleLimit}
                                        class="bg-zinc-700 text-zinc-100 px-2 py-1 rounded text-sm w-full"
                                        min="0"
                                        step="0.01"
                                    />
                                {:else}
                                    <DollarDisplay amount={rule.limit} {language} />
                                {/if}
                            </td>
                            <td class="px-4 py-2 text-sm">
                                {#if editingRuleId === rule.id}
                                    <div class="flex flex-col gap-2 min-w-[300px]">
                                        <select
                                            bind:value={editingRuleModel}
                                            class="bg-zinc-700 text-zinc-100 px-2 py-1 rounded text-xs w-full"
                                        >
                                            <option value="">{language.allModels}</option>
                                            {#each uniqueModels as model}
                                                <option value={model}>{model}</option>
                                            {/each}
                                        </select>
                                        <select
                                            bind:value={editingRuleProvider}
                                            class="bg-zinc-700 text-zinc-100 px-2 py-1 rounded text-xs w-full"
                                        >
                                            <option value="">{language.allProviders}</option>
                                            {#each uniqueProviders as provider}
                                                <option value={provider}>{provider}</option>
                                            {/each}
                                        </select>
                                        <select
                                            bind:value={editingRuleRequestType}
                                            class="bg-zinc-700 text-zinc-100 px-2 py-1 rounded text-xs w-full"
                                        >
                                            <option value="">{language.allTypes}</option>
                                            {#each uniqueRequestTypes as type}
                                                <option value={type}>{type}</option>
                                            {/each}
                                        </select>
                                    </div>
                                {:else}
                                    <div class="flex flex-col gap-1">
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs text-zinc-500 min-w-fit">{language.model}:</span>
                                            {#if rule.model}
                                                <span class="text-xs text-zinc-500">{rule.model}</span>
                                            {:else}
                                                <span class="text-xs text-zinc-500">{language.allModels}</span>
                                            {/if}
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs text-zinc-500 min-w-fit">{language.provider}:</span>
                                            {#if rule.provider}
                                                <span class="text-xs text-zinc-500">{rule.provider}</span>
                                            {:else}
                                                <span class="text-xs text-zinc-500">{language.allProviders}</span>
                                            {/if}
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs text-zinc-500 min-w-fit">{language.type}:</span>
                                            {#if rule.requestType}
                                                <span class="text-xs text-zinc-500">{rule.requestType}</span>
                                            {:else}
                                                <span class="text-xs text-zinc-500">{language.allTypes}</span>
                                            {/if}
                                        </div>
                                    </div>
                                {/if}
                            </td>
                            <td class="px-4 py-2 text-sm">
                                <div class="flex flex-col gap-1">
                                    <DollarDisplay 
                                        amount={usage} 
                                        {language}
                                        textClass={
                                            percentage <= 70 ? 'text-green-500' :
                                            percentage > 70 && percentage <= 90 ? 'text-yellow-500' :
                                            percentage > 90 && percentage <= 100 ? 'text-orange-500' :
                                            'text-red-500'
                                        }
                                    />
                                    <div class="w-full bg-zinc-700 rounded-full h-1.5">
                                        <div
                                            class="h-1.5 rounded-full transition-all"
                                            class:bg-green-500={percentage <= 70}
                                            class:bg-yellow-500={percentage > 70 && percentage <= 90}
                                            class:bg-orange-500={percentage > 90 && percentage <= 100}
                                            class:bg-red-500={percentage > 100}
                                            style="width: {Math.min(percentage, 100)}%"
                                        ></div>
                                    </div>
                                    <span class="text-xs text-zinc-400">{percentage.toFixed(1)}%</span>
                                </div>
                            </td>
                            <td class="px-4 py-2 text-sm whitespace-nowrap">
                                {#if editingRuleId === rule.id}
                                    <div class="flex items-center justify-end gap-2">
                                        <button
                                            class="text-green-500 hover:text-green-400 transition-colors"
                                            on:click={handleUpdateRule}
                                            title={language.confirm}
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            class="text-zinc-400 hover:text-zinc-200 transition-colors"
                                            on:click={cancelEditing}
                                            title={language.cancel}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                {:else}
                                    <div class="flex items-center justify-end gap-2">
                                        <button
                                            class="text-zinc-400 hover:text-zinc-200 transition-colors"
                                            on:click={() => startEditing(rule)}
                                            title={language.edit}
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            class="text-red-600 hover:text-red-500 transition-colors"
                                            on:click={() => handleDeleteRule(rule.id)}
                                            title={language.delete}
                                        >
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
