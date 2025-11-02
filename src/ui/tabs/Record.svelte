<script lang="ts">
	import { onMount } from 'svelte';
	import { UsageManager } from '../../manager/usage';
	import { ProviderManager } from '../../manager/provider';
	import type { UsageRecord } from '../../types';
	import { RequestType } from '../../types';
	import { formatString, type Language } from '../../lang';
	import { Trash } from 'lucide-svelte';
	import RecordFilters from '../components/RecordFilters.svelte';
	import RecordRow from '../components/RecordRow.svelte';

	export let key: number = 0;
	export let language: Language;

	let allRecords: UsageRecord[] = [];
	let filteredRecords: UsageRecord[] = [];
	let providerMap: Record<string, string> = {};
	let selectedRecords = new Set<UsageRecord>();

	// Filter states
	let filterTimeRange: { start: Date | null; end: Date | null } | '' = '';
	let filterModel = '';
	let filterProvider = '';
	let filterRequestType = '';

	// Pagination states
	let currentPage = 1;
	const recordsPerPage = 50;
	let totalPages = 1;

	// UI states

	$: uniqueProviders = getUniqueProviders(allRecords, providerMap);
	$: uniqueModels = getUniqueModels(allRecords);
	$: uniqueRequestTypes = getUniqueRequestTypes(allRecords);
	$: selectedCount = selectedRecords.size;
	$: paginatedRecords = getPaginatedRecords(filteredRecords, currentPage, recordsPerPage);

	onMount(() => {
		refreshData();
	});

	$: if (key) {
		refreshData();
	}

	function refreshData() {
		allRecords = UsageManager.getRecords([]);
		// Sort records by timestamp in descending order (newest first)
		allRecords = allRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
		providerMap = ProviderManager.getAllProviders();
		// Apply filters to ensure filteredRecords is properly set
		applyFilters();
	}

	function applyFilters(event?: CustomEvent) {
		if (event) {
			const { timeRange, model, provider, requestType } = event.detail;
			filterTimeRange = timeRange;
			filterModel = model;
			filterProvider = provider;
			filterRequestType = requestType;
		}

		// Apply filters to allRecords
		const filtered = allRecords.filter(record => {
			// Time filter
			if (filterTimeRange && (filterTimeRange.start || filterTimeRange.end)) {
				const recordTime = new Date(record.timestamp).getTime();
				if (filterTimeRange.start && recordTime < filterTimeRange.start.getTime()) {
					return false;
				}
				if (filterTimeRange.end && recordTime > filterTimeRange.end.getTime()) {
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

	function getPaginatedRecords(records: UsageRecord[], page: number, perPage: number): UsageRecord[] {
		const startIndex = (page - 1) * perPage;
		const endIndex = startIndex + perPage;
		return records.slice(startIndex, endIndex);
	}

	function clearSelection() {
		selectedRecords = new Set<UsageRecord>();
		// Update select all checkbox state
		const selectAllCheckbox = document.getElementById('selectAllCheckbox') as HTMLInputElement;
		if (selectAllCheckbox) {
			selectAllCheckbox.checked = false;
		}
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
		const selectAllCheckbox = document.getElementById('selectAllCheckbox') as HTMLInputElement;
		if (selectAllCheckbox) {
			selectAllCheckbox.checked = paginatedRecords.length > 0 && paginatedRecords.every(r => selectedRecords.has(r));
		}
	}

	function selectAllRecords(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const isChecked = target.checked;
		
		if (isChecked) {
			// Select all on current page
			paginatedRecords.forEach(record => {
				selectedRecords.add(record);
			});
		} else {
			// Unselect all on current page
			paginatedRecords.forEach(record => {
				selectedRecords.delete(record);
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

	function handleRecordToggle(event: CustomEvent<boolean>, record: UsageRecord) {
		toggleRecord(record, event.detail);
	}

	function handleRecordDelete(event: CustomEvent<UsageRecord>) {
		deleteRecord(event.detail);
	}
</script>

<div class="flex flex-col h-full">
	<!-- Header Area (Fixed Scrolling) -->
	<div class="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-700/60 px-3 py-3 flex-shrink-0 shadow-[0_4px_16px_0_rgba(0,0,0,0.25)]">
		<!-- Actions -->
		<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
			<!-- Filter Group -->
			<RecordFilters
				{language}
				bind:filterModel
				bind:filterProvider
				bind:filterRequestType
				{uniqueModels}
				{uniqueProviders}
				{uniqueRequestTypes}
				on:apply={applyFilters}
			/>
			<!-- Delete Button Group -->
			<div class="flex">
				<button
					class="w-full sm:w-auto px-3 py-1.5 bg-zinc-800 hover:bg-red-600/90 text-zinc-200 hover:text-white rounded text-sm flex items-center justify-center gap-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
					on:click={deleteSelectedRecords}
					disabled={selectedCount === 0}
				>
					<Trash size={16} />
					<span>{formatString(language.deleteSelectedCount, { count: selectedCount })}</span>
				</button>
			</div>
		</div>
	</div>

	<!-- Record Area (Scrollable) -->
	<div class="flex-1 overflow-y-auto overflow-x-auto">
		{#if paginatedRecords.length === 0}
			<div class="text-center text-zinc-500 py-8">
				{language.noRecordsFound}
			</div>
		{:else}
			<table class="min-w-full divide-y divide-zinc-700/60 table-auto">
				<thead class="bg-zinc-800 sticky top-0 z-10 shadow-lg">
					<tr>
						<th scope="col" class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 w-12">
							<input
								id="selectAllCheckbox"
								type="checkbox"
								on:change={selectAllRecords}
								class="w-3 h-3 cursor-pointer"
							/>
						</th>
						<th scope="col" class="pr-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
							{language.model}
						</th>
						<th scope="col" class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 whitespace-nowrap">
							{language.tokens}
						</th>
						<th scope="col" class="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 whitespace-nowrap">
							{language.cost}
						</th>
					</tr>
				</thead>
					<tbody class="divide-y divide-zinc-700/60 bg-zinc-900/50">
						{#each paginatedRecords as record, index (record.timestamp + record.model + record.url + index)}
							<RecordRow
								{record}
								{language}
								{providerMap}
								isSelected={selectedRecords.has(record)}
								on:toggle={(event) => handleRecordToggle(event, record)}
								on:delete={handleRecordDelete}
							/>
						{/each}
					</tbody>
				</table>
		{/if}
	</div>

	<!-- Pagination Area (Fixed Scrolling) -->
	{#if totalPages > 1}
	<div class="sticky bottom-0 z-10 bg-zinc-900 border-t border-zinc-700/60 px-3 pt-3 pb-2 flex-shrink-0 shadow-[0_-4px_16px_0_rgba(0,0,0,0.25)]">
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