<script lang="ts">
	import { Search } from 'lucide-svelte';
	import type { Language } from '../../lang';

	/**
	 * Props
	 */
	export let language: Language;
	export let filterTimeRange: string = '';
	export let filterModel: string = '';
	export let filterProvider: string = '';
	export let filterRequestType: string = '';
	export let uniqueModels: string[] = [];
	export let uniqueProviders: string[] = [];
	export let uniqueRequestTypes: string[] = [];

	/**
	 * Events
	 */
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	/**
	 * Handle filter apply
	 */
	function handleApplyFilters() {
		dispatch('apply', {
			timeRange: filterTimeRange,
			model: filterModel,
			provider: filterProvider,
			requestType: filterRequestType
		});
	}
</script>

<div class="flex items-center gap-2 text-xs flex-wrap">
	<span class="text-zinc-400 hidden md:inline">{language.filter}:</span>
	<select
		bind:value={filterTimeRange}
		class="bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs max-w-[120px]"
	>
		<option value="">{language.allTimeRange}</option>
		<option value="1h">{language.oneHourRange}</option>
		<option value="24h">{language.oneDayRange}</option>
		<option value="7d">{language.sevenDaysRange}</option>
		<option value="30d">{language.thirtyDaysRange}</option>
	</select>
	<select
		bind:value={filterModel}
		class="bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs max-w-[120px] truncate"
	>
		<option value="">{language.allModels}</option>
		{#each uniqueModels as model}
			<option value={model}>{model}</option>
		{/each}
	</select>
	<select
		bind:value={filterProvider}
		class="bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs max-w-[120px] truncate"
	>
		<option value="">{language.allProviders}</option>
		{#each uniqueProviders as provider}
			<option value={provider}>{provider}</option>
		{/each}
	</select>
	<select
		bind:value={filterRequestType}
		class="bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded px-2 py-1 text-xs max-w-[120px]"
	>
		<option value="">{language.allTypes}</option>
		{#each uniqueRequestTypes as type}
			<option value={type}>{type}</option>
		{/each}
	</select>
	<button
		class="px-1.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded text-xs flex items-center gap-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-blue-500"
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
