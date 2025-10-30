<script lang="ts">
	import { onMount } from 'svelte';
	import { UsageManager } from '../../manager/usage';
	import { ProviderManager } from '../../manager/provider';
	import type { UsageRecord } from '../../types';
	import { RequestType } from '../../types';
	import { formatString, type LanguageType } from '../../lang';

	export let key: number = 0;
	export let language: LanguageType;

	let allRecords: UsageRecord[] = [];
	let filteredRecords: UsageRecord[] = [];
	let providerMap: Record<string, string> = {};
	let selectedRecords = new Set<UsageRecord>();

	// Filter states
	let filterTimeRange = '';
	let filterModel = '';
	let filterProvider = '';
	let filterRequestType = '';

	// Pagination states
	let currentPage = 1;
	const recordsPerPage = 50;
	let totalPages = 1;

	// UI states
	let selectAllChecked = false;

	$: uniqueProviders = getUniqueProviders(allRecords, providerMap);
	$: uniqueModels = getUniqueModels(allRecords);
	$: uniqueRequestTypes = getUniqueRequestTypes(allRecords);
	$: selectedCount = selectedRecords.size;
	$: paginatedRecords = getPaginatedRecords();

	// Ensure filteredRecords is always in sync when allRecords changes and no filters are applied
	$: if (allRecords.length > 0 && filteredRecords.length === 0 && !filterTimeRange && !filterModel && !filterProvider && !filterRequestType) {
		filteredRecords = [...allRecords];
		totalPages = Math.max(1, Math.ceil(filteredRecords.length / recordsPerPage));
		currentPage = 1;
	}

	onMount(() => {
		refreshData();
	});

	$: if (key) {
		refreshData();
	}

	function refreshData() {
		allRecords = UsageManager.getRecords([]);
		providerMap = ProviderManager.getAllProviders();
		// Initially show all records without filters
		filteredRecords = [...allRecords];
		totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
		currentPage = 1;
		clearSelection();
	}

	function applyFilters() {
		let timeRangeMs = 0;

		switch (filterTimeRange) {
			case '1h':
				timeRangeMs = 60 * 60 * 1000;
				break;
			case '24h':
				timeRangeMs = 24 * 60 * 60 * 1000;
				break;
			case '7d':
				timeRangeMs = 7 * 24 * 60 * 60 * 1000;
				break;
			case '30d':
				timeRangeMs = 30 * 24 * 60 * 60 * 1000;
				break;
		}

		// Apply filters to allRecords
		const filtered = allRecords.filter(record => {
			// Time filter
			if (timeRangeMs > 0) {
				const cutoffTime = new Date().getTime() - timeRangeMs;
				if (new Date(record.timestamp).getTime() < cutoffTime) {
					return false;
				}
			}

			// Model filter
			if (filterModel && record.model !== filterModel) {
				return false;
			}

			// Provider filter
			if (filterProvider) {
				const providerName = providerMap[record.url] || record.url;
				if (providerName !== filterProvider) {
					return false;
				}
			}

			// Request type filter
			if (filterRequestType && (record.requestType || RequestType.Unknown) !== filterRequestType) {
				return false;
			}

			return true;
		});

		// Update filteredRecords
		filteredRecords = filtered;

		// Reset to first page and recalculate total pages
		currentPage = 1;
		totalPages = Math.max(1, Math.ceil(filteredRecords.length / recordsPerPage));

		// Clear selection when filters change
		clearSelection();
	}

	function getPaginatedRecords(): UsageRecord[] {
		const startIndex = (currentPage - 1) * recordsPerPage;
		const endIndex = startIndex + recordsPerPage;
		return filteredRecords.slice(startIndex, endIndex);
	}

	function clearSelection() {
		selectedRecords = new Set<UsageRecord>();
		selectAllChecked = false;
	}

	function toggleRecord(record: UsageRecord, checked: boolean) {
		const next = new Set<UsageRecord>(selectedRecords);
		if (checked) {
			next.add(record);
		} else {
			next.delete(record);
		}
		selectedRecords = next;

		// Update select all checkbox state
		selectAllChecked = paginatedRecords.length > 0 && paginatedRecords.every(r => selectedRecords.has(r));
	}

	function selectAllRecords() {
		if (selectAllChecked) {
			// Unselect all on current page
			paginatedRecords.forEach(record => {
				selectedRecords.delete(record);
			});
		} else {
			// Select all on current page
			paginatedRecords.forEach(record => {
				selectedRecords.add(record);
			});
		}
		selectedRecords = new Set<UsageRecord>(selectedRecords);
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
		const allRecordsToDelete = filteredRecords.length > 0 ? filteredRecords : allRecords;
		const confirmText = formatString(language.deleteAllRecordsConfirm, { count: allRecordsToDelete.length });
		const confirmed = confirm(confirmText);
		if (!confirmed) return;

		let deletedCount = 0;
		allRecordsToDelete.forEach(record => {
			if (UsageManager.removeRecord(record)) {
				deletedCount++;
			}
		});

		const deletedText = formatString(language.deletedRecords, { count: deletedCount });
		alert(deletedText);
		clearSelection();
		refreshData();
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
			clearSelection(); // Clear selection when changing pages
		}
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

	function getUniqueRequestTypes(items: UsageRecord[]): string[] {
		const unique = new Set<string>();
		items.forEach(record => {
			unique.add(record.requestType || RequestType.Unknown);
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

<div class="flex flex-col h-full">
	<!-- Header Area (Fixed Scrolling) -->
	<div class="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-700/60 px-3 py-3 flex-shrink-0 shadow-[0_4px_16px_0_rgba(0,0,0,0.25)]">
		<!-- Title and Actions -->
		<div class="flex justify-between items-center mb-3">
			<h3 class="text-xl font-semibold text-zinc-100">{language.recordManagement}</h3>
			<div class="flex items-center gap-3">
				<!-- Select All Checkbox -->
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={selectAllChecked}
						on:change={selectAllRecords}
						class="w-4 h-4 cursor-pointer"
					/>
					<span class="text-sm text-zinc-200">{language.selectAll}</span>
				</label>

				<!-- Action Buttons -->
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
		</div>

		<!-- Filters -->
		<div class="flex gap-2 text-xs flex-wrap items-center">
			<span class="text-zinc-400">{language.filter}:</span>
			<select bind:value={filterTimeRange} class="bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs max-w-[120px]">
				<option value="">{language.allTimeRange}</option>
				<option value="1h">{language.oneHourRange}</option>
				<option value="24h">{language.oneDayRange}</option>
				<option value="7d">{language.sevenDaysRange}</option>
				<option value="30d">{language.thirtyDaysRange}</option>
			</select>
			<select bind:value={filterModel} class="bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs max-w-[120px] truncate">
				<option value="">{language.allModels}</option>
				{#each uniqueModels as model}
					<option value={model}>{model}</option>
				{/each}
			</select>
			<select bind:value={filterProvider} class="bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs max-w-[120px] truncate">
				<option value="">{language.allProviders}</option>
				{#each uniqueProviders as provider}
					<option value={provider}>{provider}</option>
				{/each}
			</select>
			<select bind:value={filterRequestType} class="bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs max-w-[120px]">
				<option value="">{language.allTypes}</option>
				{#each uniqueRequestTypes as type}
					<option value={type}>{type}</option>
				{/each}
			</select>
			<button
				class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
				on:click={applyFilters}
			>
				{language.search}
			</button>
		</div>
	</div>

	<!-- Record Area (Scrollable) -->
	<div class="flex-1 overflow-y-auto px-3 py-3 space-y-2">
		{#if paginatedRecords.length === 0}
			<div class="text-center text-zinc-500 py-8">
				{language.noRecordsFound}
			</div>
		{:else}
			{#each paginatedRecords as record, index (record.timestamp + record.model + record.url + index)}
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

	<!-- Pagination Area (Fixed Scrolling) -->
	{#if totalPages > 1}
	<div class="sticky bottom-0 z-10 bg-zinc-900 border-t border-zinc-700/60 px-3 py-3 flex-shrink-0 shadow-[0_-4px_16px_0_rgba(0,0,0,0.25)]">
		<div class="flex justify-center items-center gap-2">
			<button
				class="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				on:click={() => goToPage(currentPage - 1)}
				disabled={currentPage === 1}
			>
				&lt;
			</button>

			{#each Array.from({length: Math.min(totalPages, 10)}, (_, i) => i + 1) as pageNum}
				{#if pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)}
					<button
						class="px-3 py-1 {pageNum === currentPage ? 'bg-blue-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-white'} rounded text-xs transition-colors"
						on:click={() => goToPage(pageNum)}
					>
						{pageNum}
					</button>
				{:else if pageNum === currentPage - 3 || pageNum === currentPage + 3}
					<span class="text-zinc-400 px-2">...</span>
				{/if}
			{/each}

			<button
				class="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				on:click={() => goToPage(currentPage + 1)}
				disabled={currentPage === totalPages}
			>
				&gt;
			</button>
		</div>

		<div class="text-center text-xs text-zinc-400 mt-2">
			{formatString(language.pageInfo, {
				current: currentPage,
				total: totalPages,
				count: filteredRecords.length
			})}
		</div>
	</div>
	{/if}
</div>