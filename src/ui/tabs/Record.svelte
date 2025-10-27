<script lang="ts">
	import { onMount } from 'svelte';
	import { UsageManager } from '../../manager/usage';
	import { ProviderManager } from '../../manager/provider';
	import type { UsageRecord } from '../../types';

	export let key: number = 0;

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
		const confirmed = confirm('이 레코드를 삭제하시겠습니까?');
		if (!confirmed) return;

		const success = UsageManager.removeRecord(record);
		if (success) {
			clearSelection();
			refreshData();
		} else {
			alert('삭제에 실패했습니다.');
		}
	}

	function deleteSelectedRecords() {
		if (selectedCount === 0) return;

		const confirmed = confirm(`선택한 ${selectedCount}개의 레코드를 삭제하시겠습니까?`);
		if (!confirmed) return;

		let deletedCount = 0;
		selectedRecords.forEach(record => {
			if (UsageManager.removeRecord(record)) {
				deletedCount++;
			}
		});

		alert(`${deletedCount}개의 레코드가 삭제되었습니다.`);
		clearSelection();
		refreshData();
	}

	function deleteAllRecords() {
		const allRecords = UsageManager.getRecords([]);
		const confirmed = confirm(`정말로 모든 레코드(${allRecords.length}개)를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`);
		if (!confirmed) return;

		let deletedCount = 0;
		allRecords.forEach(record => {
			if (UsageManager.removeRecord(record)) {
				deletedCount++;
			}
		});

		alert(`${deletedCount}개의 레코드가 삭제되었습니다.`);
		clearSelection();
		refreshData();
	}

	function applyFilter() {
		if (!filterProvider && !filterModel) {
			alert('삭제할 필터를 선택해주세요.');
			return;
		}

		const filtered = records.filter(record => {
			const providerName = providerMap[record.url] || record.url;
			const matchesProvider = !filterProvider || providerName === filterProvider;
			const matchesModel = !filterModel || record.model === filterModel;
			return matchesProvider && matchesModel;
		});

		if (filtered.length === 0) {
			alert('필터에 해당하는 레코드가 없습니다.');
			return;
		}

		const confirmed = confirm(`필터에 해당하는 ${filtered.length}개의 레코드를 삭제하시겠습니까?\n프로바이더: ${filterProvider || '전체'}\n모델: ${filterModel || '전체'}`);
		if (!confirmed) return;

		let deletedCount = 0;
		filtered.forEach(record => {
			if (UsageManager.removeRecord(record)) {
				deletedCount++;
			}
		});

		alert(`${deletedCount}개의 레코드가 삭제되었습니다.`);
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

<div class="space-y-4">
	<div class="flex justify-between items-center">
		<h3 class="text-xl font-semibold text-zinc-100">Usage Records 관리</h3>
		<div class="flex gap-2">
			<button
				class="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				on:click={deleteSelectedRecords}
				disabled={selectedCount === 0}
			>
				선택 삭제 (<span>{selectedCount}</span>)
			</button>
			<button
				class="px-3 py-1.5 rounded bg-red-700 hover:bg-red-800 text-white text-sm transition-colors"
				on:click={deleteAllRecords}
			>
				전체 삭제
			</button>
		</div>
	</div>

	<div class="text-sm text-zinc-400">
		<p>
			총 <strong class="text-zinc-200">{records.length}</strong>개의 레코드가 있습니다.
		</p>
		<p>개별 레코드를 선택하여 삭제하거나, 필터를 적용하여 일괄 삭제할 수 있습니다.</p>
	</div>

	<div class="p-3 bg-zinc-800 rounded-lg space-y-2">
		<h4 class="text-sm font-semibold text-zinc-200">필터</h4>
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
			<select bind:value={filterProvider} class="px-2 py-1 bg-zinc-700 text-zinc-200 rounded text-sm">
				<option value="">모든 프로바이더</option>
				{#each uniqueProviders as provider}
					<option value={provider}>{provider}</option>
				{/each}
			</select>
			<select bind:value={filterModel} class="px-2 py-1 bg-zinc-700 text-zinc-200 rounded text-sm">
				<option value="">모든 모델</option>
				{#each uniqueModels as model}
					<option value={model}>{model}</option>
				{/each}
			</select>
			<button
				class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
				on:click={applyFilter}
			>
				필터 적용
			</button>
		</div>
	</div>

	<div class="space-y-2 max-h-96 overflow-y-auto">
		{#if records.length === 0}
			<div class="text-center text-zinc-500 py-8">
				레코드가 없습니다.
			</div>
		{:else}
			{#each records as record, index (record.timestamp + record.model + record.url + index)}
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
							<div>
								입력: {(record.inputTokens ?? 0).toLocaleString()} (캐시: {(record.cachedInputTokens ?? 0).toLocaleString()}) |
								출력: {(record.outputTokens ?? 0).toLocaleString()}
							</div>
							<div>
								비용: ${formatCost(record.totalCost)} (입력: ${formatCost(record.inputCost)}, 출력: ${formatCost(record.outputCost)})
							</div>
						</div>
					</div>
					<button
						class="deleteRecordButton px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
						on:click={() => deleteRecord(record)}
					>
						삭제
					</button>
				</div>
			{/each}
		{/if}
	</div>
</div>