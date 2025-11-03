<script lang="ts">
	import DollarDisplay from './DollarDisplay.svelte';
	import type { UsageRecord } from '../../types';
	import { RequestType } from '../../types';
	import type { Language } from '../../lang';

	/**
	 * Props
	 */
	export let record: UsageRecord;
	export let language: Language;
	export let isSelected: boolean = false;
	export let providerName: string;

	/**
	 * Events
	 */
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	/**
	 * Handle checkbox change
	 */
	function handleToggle() {
		dispatch('toggle', !isSelected);
	}

	/**
	 * Handle delete
	 */
	function handleDelete() {
		dispatch('delete', record);
	}

	/**
	 * Format cost value
	 */
	function formatCost(value?: number): string {
		return (value ?? 0).toFixed(4);
	}
</script>

<tr class="hover:bg-zinc-800/50 transition-colors {isSelected ? 'bg-zinc-800' : ''}">
	<td class="px-4 py-2">
		<input
			type="checkbox"
			checked={isSelected}
			on:change={handleToggle}
			class="w-3 h-3 cursor-pointer"
		/>
	</td>
	<td class="pr-4 py-2 text-sm">
		<div class="space-y-0.5">
			<div class="font-medium text-zinc-200 whitespace-nowrap">{record.model}</div>
			<div class="text-xs text-zinc-400 whitespace-nowrap">{providerName}</div>
			<div class="text-xs text-zinc-500 whitespace-nowrap">
				{record.requestType || RequestType.Unknown} • {new Date(record.timestamp).toLocaleString()}
			</div>
		</div>
	</td>
	<td class="px-4 py-2 text-sm whitespace-nowrap">
		<div class="space-y-0.5">
			<div class="flex justify-between gap-2">
				<span class="text-zinc-400 text-xs">{language.input}:</span>
				<span class="text-zinc-300 text-xs">{(record.inputTokens ?? 0).toLocaleString()}</span>
			</div>
			{#if record.cachedInputTokens > 0}
				<div class="flex justify-between gap-2">
					<span class="text-zinc-400 text-xs">{language.cached}:</span>
					<span class="text-zinc-300 text-xs">{record.cachedInputTokens.toLocaleString()}</span>
				</div>
			{/if}
			<div class="flex justify-between gap-2">
				<span class="text-zinc-400 text-xs">{language.output}:</span>
				<span class="text-zinc-300 text-xs">{(record.outputTokens ?? 0).toLocaleString()}</span>
			</div>
		</div>
	</td>
	<td class="px-4 py-2 text-sm whitespace-nowrap">
		<div class="space-y-0.5">
			<div class="flex justify-between gap-2">
				<span class="text-zinc-400 text-xs">{language.totalCost}:</span>
				<span class="text-zinc-300 text-xs">
					<DollarDisplay amount={record.totalCost} {language} />
				</span>
			</div>
			<div class="flex justify-between gap-2">
				<span class="text-zinc-400 text-xs">{language.input}:</span>
				<span class="text-zinc-300 text-xs">
					<DollarDisplay amount={record.inputCost} {language} />
				</span>
			</div>
			<div class="flex justify-between gap-2">
				<span class="text-zinc-400 text-xs">{language.output}:</span>
				<span class="text-zinc-300 text-xs">
					<DollarDisplay amount={record.outputCost} {language} />
				</span>
			</div>
		</div>
	</td>
</tr>
