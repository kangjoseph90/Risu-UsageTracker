<script lang="ts">
	import { onMount } from 'svelte';
	import { UsageManager } from '../../manager/usage';
	import { ProviderManager } from '../../manager/provider';
	import type { UsageRecord } from '../../types';
	import { formatString, type LanguageType } from '../../lang';

	export let key: number = 0;
	export let language: LanguageType;

	let records: UsageRecord[] = [];
	let providerMap: Record<string, string> = {};
	let selectedRecords = new Set<UsageRecord>();

	let filterProvider = '';
	let filterModel = '';

	$: uniqueProviders = getUniqueProviders(records, providerMap);
	$: uniqueModels = getUniqueModels(records);
	$: selectedCount = selectedRecords.size;

	onMount(() => {
		refreshData();
	});

	$: if (key) {
		refreshData();
	}

	function refreshData() {
		records = UsageManager.getRecords([]);
		providerMap = ProviderManager.getAllProviders();
	}

	function clearSelection() {
		selectedRecords = new Set<UsageRecord>();
	}

	function toggleRecord(record: UsageRecord, checked: boolean) {
	const next = new Set<UsageRecord>(selectedRecords);
		if (checked) {
			next.add(record);
		} else {
			next.delete(record);
		}
		selectedRecords = next;
	}

	function deleteRecord(record: UsageRecord) {
		const confirmed = confirm(language.deleteRecordConfirm);
		if (!confirmed) return;

		const success = UsageManager.removeRecord(record);
		if (success) {
			clearSelection();
			refreshData();
		} else {
			alert(language.failToDelete);
		}
	}

	function deleteSelectedRecords() {
		if (selectedCount === 0) return;

		const confirmText = formatString(language.deleteSelectedRecordsConfirm, { count: selectedCount });
		const confirmed = confirm(confirmText);
		if (!confirmed) return;

		let deletedCount = 0;
		selectedRecords.forEach(record => {
			if (UsageManager.removeRecord(record)) {
				deletedCount++;
			}
		});

		const deletedText = formatString(language.deletedRecords, { count: deletedCount });
		alert(deletedText);
		clearSelection();
		refreshData();
	}

	function deleteAllRecords() {
		const allRecords = UsageManager.getRecords([]);
		const confirmText = formatString(language.deleteAllRecordsConfirm, { count: allRecords.length });
		const confirmed = confirm(confirmText);
		if (!confirmed) return;

		let deletedCount = 0;
		allRecords.forEach(record => {
			if (UsageManager.removeRecord(record)) {
				deletedCount++;
			}
		});

		const deletedText = formatString(language.deletedRecords, { count: deletedCount });
		alert(deletedText);
		clearSelection();
		refreshData();
	}

	function applyFilter() {
		if (!filterProvider && !filterModel) {
			alert(language.selectFilterToDelete);
			return;
		}

		const filtered = records.filter(record => {
			const providerName = providerMap[record.url] || record.url;
			const matchesProvider = !filterProvider || providerName === filterProvider;
			const matchesModel = !filterModel || record.model === filterModel;
			return matchesProvider && matchesModel;
		});

		if (filtered.length === 0) {
			alert(language.noRecordsForFilter);
			return;
		}

		const confirmText = formatString(language.filterRecordsDeleteConfirm, {
			count: filtered.length,
			provider: filterProvider || language.all,
			model: filterModel || language.all
		});
		const confirmed = confirm(confirmText);
		if (!confirmed) return;

		let deletedCount = 0;
		filtered.forEach(record => {
			if (UsageManager.removeRecord(record)) {
				deletedCount++;
			}
		});

		const deletedText = formatString(language.deletedRecords, { count: deletedCount });
		alert(deletedText);
		clearSelection();
		refreshData();
	}

	function getUniqueProviders(items: UsageRecord[], providers: Record<string, string>): string[] {
		const unique = new Set<string>();
		items.forEach(record => {
			const providerName = providers[record.url] || record.url;
			unique.add(providerName);
		});
		return Array.from(unique).sort();
	}

	function getUniqueModels(items: UsageRecord[]): string[] {
		const unique = new Set<string>();
		items.forEach(record => {
			unique.add(record.model);
		});
		return Array.from(unique).sort();
	}

	function handleCheckboxChange(record: UsageRecord, event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		toggleRecord(record, target.checked);
	}

	function formatProvider(record: UsageRecord): string {
		return providerMap[record.url] || record.url;
	}

	function formatCost(value?: number): string {
		return (value ?? 0).toFixed(4);
	}
</script>

<div class="space-y-4 px-3">
	<div class="sticky top-0 bg-zinc-900 flex justify-between items-center">
		<h3 class="text-xl font-semibold text-zinc-100">{language.recordManagement}</h3>
		<div class="flex gap-2">
			<button
				class="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				on:click={deleteSelectedRecords}
				disabled={selectedCount === 0}
			>
				{formatString(language.deleteSelectedCount, { count: selectedCount })}
			</button>
			<button
				class="px-3 py-1.5 rounded bg-red-700 hover:bg-red-800 text-white text-sm transition-colors"
				on:click={deleteAllRecords}
			>
				{language.deleteAll}
			</button>
		</div>
	</div>

	<div class="p-3 bg-zinc-800 rounded-lg space-y-2">
		<h4 class="text-sm font-semibold text-zinc-200">{language.filter}</h4>
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
			<select bind:value={filterProvider} class="px-2 py-1 bg-zinc-700 text-zinc-200 rounded text-sm">
				<option value="">{language.allProviders}</option>
				{#each uniqueProviders as provider}
					<option value={provider}>{provider}</option>
				{/each}
			</select>
			<select bind:value={filterModel} class="px-2 py-1 bg-zinc-700 text-zinc-200 rounded text-sm">
				<option value="">{language.allModels}</option>
				{#each uniqueModels as model}
					<option value={model}>{model}</option>
				{/each}
			</select>
			<button
				class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
				on:click={applyFilter}
			>
				{language.applyFilter}
			</button>
		</div>
	</div>

	<div class="space-y-2 overflow-y-auto">
		{#if records.length === 0}
			<div class="text-center text-zinc-500 py-8">
				{language.noRecordsFound}
			</div>
		{:else}
			{#each records as record, index (record.timestamp + record.model + record.url + index)}
				{@const inputText = formatString(language.inputWithCache, {
					input: (record.inputTokens ?? 0).toLocaleString(),
					cached: (record.cachedInputTokens ?? 0).toLocaleString(),
					output: (record.outputTokens ?? 0).toLocaleString()
				})}
				{@const costText = formatString(language.costBreakdown, {
					totalCost: formatCost(record.totalCost),
					inputCost: formatCost(record.inputCost),
					outputCost: formatCost(record.outputCost)
				})}
				<div class="recordItem flex items-start gap-2 p-3 bg-zinc-800 rounded-lg hover:bg-zinc-750 transition-colors">
					<input
						type="checkbox"
						class="recordCheckbox mt-1 w-4 h-4 cursor-pointer"
						checked={selectedRecords.has(record)}
						on:change={(event) => handleCheckboxChange(record, event)}
					/>
					<div class="flex-1 min-w-0 text-xs">
						<div class="flex justify-between items-start mb-1">
							<div class="font-semibold text-zinc-200">{formatProvider(record)} - {record.model}</div>
							<div class="text-zinc-400">{new Date(record.timestamp).toLocaleString()}</div>
						</div>
						<div class="text-zinc-400 space-y-0.5">
							<div>{inputText}</div>
							<div>{costText}</div>
						</div>
					</div>
					<button
						class="deleteRecordButton px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
						on:click={() => deleteRecord(record)}
						title="Delete Record"
					>
						{language.delete}
					</button>
				</div>
			{/each}
		{/if}
	</div>
</div>