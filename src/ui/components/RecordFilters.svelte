<script lang="ts">
	import { Search, X } from 'lucide-svelte';
	import type { Language } from '../../lang';
	import { onMount } from 'svelte';
	import flatpickr from 'flatpickr';
	import 'flatpickr/dist/flatpickr.css';

	/**
	 * Props
	 */
	export let language: Language;
	export let filterModel: string = '';
	export let filterProvider: string = '';
	export let filterRequestType: string = '';
	export let uniqueModels: string[] = [];
	export let uniqueProviders: string[] = [];
	export let uniqueRequestTypes: string[] = [];

	let startDateInput: HTMLInputElement;
	let endDateInput: HTMLInputElement;

	let fpStartDate: flatpickr.Instance | null = null;
	let fpEndDate: flatpickr.Instance | null = null;

	onMount(() => {
		fpStartDate = flatpickr(startDateInput, {
			enableTime: true,
			dateFormat: 'y-m-d H:i',
			time_24hr: true,
			defaultHour: 0,
			defaultMinute: 0,
			onChange: (selectedDates) => {
				if (fpEndDate && selectedDates[0]) {
					fpEndDate.set('minDate', selectedDates[0]);
				}
			}
		});

		fpEndDate = flatpickr(endDateInput, {
			enableTime: true,
			dateFormat: 'y-m-d H:i',
			time_24hr: true,
			defaultHour: 23,
			defaultMinute: 59,
			onChange: (selectedDates) => {
				if (fpStartDate && selectedDates[0]) {
					fpStartDate.set('maxDate', selectedDates[0]);
				}
			}
		});
	});

	/**
	 * Events
	 */
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	/**
	 * Handle filter apply
	 */
	function handleApplyFilters() {
		const start = fpStartDate?.selectedDates[0] || null;
		const end = fpEndDate?.selectedDates[0] || null;

		// Set default times if not provided
		if (start && !start.getHours() && !start.getMinutes()) {
			start.setHours(0, 0, 0, 0);
		}
		if (end && !end.getHours() && !end.getMinutes()) {
			end.setHours(23, 59, 59, 999);
		}

		dispatch('apply', {
			timeRange: {
				start,
				end
			},
			model: filterModel,
			provider: filterProvider,
			requestType: filterRequestType
		});
	}

	function clearDateFilters() {
		fpStartDate?.clear();
		fpEndDate?.clear();
		if (fpStartDate) fpStartDate.set('maxDate', undefined);
		if (fpEndDate) fpEndDate.set('minDate', undefined);
	}
</script>

<div class="ut-flex ut-items-center ut-gap-2 ut-text-xs ut-flex-wrap">
	<span class="ut-text-zinc-400 hidden md:inline">{language.filter}:</span>
	<div class="ut-flex ut-items-center ut-gap-1">
		<input
			bind:this={startDateInput}
			type="text"
			placeholder={language.startDate}
			class="ut-bg-zinc-800 ut-text-zinc-200 ut-border ut-border-zinc-700/60 ut-rounded ut-px-2 ut-py-1 ut-text-xs ut-w-[100px]"
		/>
		<input
			bind:this={endDateInput}
			type="text"
			placeholder={language.endDate}
			class="ut-bg-zinc-800 ut-text-zinc-200 ut-border ut-border-zinc-700/60 ut-rounded ut-px-2 ut-py-1 ut-text-xs ut-w-[100px]"
		/>
		<button
			class="ut-p-1.5 ut-bg-zinc-700 hover:ut-bg-zinc-600 ut-text-zinc-200 ut-rounded ut-text-xs ut-flex ut-items-center ut-transition-colors ut-duration-200 ut-focus:outline-none"
			on:click={clearDateFilters}
			title={language.clear}
		>
			<X size={14} />
		</button>
	</div>
	<div class="ut-flex ut-items-center ut-gap-1">
		<select
			bind:value={filterModel}
			class="ut-bg-zinc-800 ut-text-zinc-200 ut-border ut-border-zinc-700/60 ut-rounded ut-px-2 ut-py-1 ut-text-xs ut-max-w-[100px] ut-truncate"
		>
			<option value="">{language.allModels}</option>
			{#each uniqueModels as model}
				<option value={model}>{model}</option>
			{/each}
		</select>
		<select
			bind:value={filterProvider}
			class="ut-bg-zinc-800 ut-text-zinc-200 ut-border ut-border-zinc-700/60 ut-rounded ut-px-2 ut-py-1 ut-text-xs ut-max-w-[100px] ut-truncate"
		>
			<option value="">{language.allProviders}</option>
			{#each uniqueProviders as provider}
				<option value={provider}>{provider}</option>
			{/each}
		</select>
		<select
			bind:value={filterRequestType}
			class="ut-bg-zinc-800 ut-text-zinc-200 ut-border ut-border-zinc-700/60 ut-rounded ut-px-2 ut-py-1 ut-text-xs ut-max-w-[100px]"
		>
			<option value="">{language.allTypes}</option>
			{#each uniqueRequestTypes as type}
				<option value={type}>{type}</option>
			{/each}
		</select>
	</div>
	<button
		class="ut-px-1.5 ut-py-1.5 ut-bg-zinc-700 hover:ut-bg-zinc-600 ut-text-zinc-200 ut-rounded ut-text-xs ut-flex ut-items-center ut-gap-2 ut-transition-colors ut-duration-200 ut-focus:outline-none ut-focus:ring-2 ut-focus:ring-offset-2 ut-focus:ring-offset-zinc-900 ut-focus:ring-blue-500"
		on:click={handleApplyFilters}
	>
		<Search size={16} />
	</button>
</div>

<style>
	select {
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2371717a' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 6px center;
		padding-right: 24px;
	}
</style>
