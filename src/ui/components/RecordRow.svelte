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

<tr class="hover:ut-bg-zinc-800/50 ut-transition-colors {isSelected ? 'ut-bg-zinc-800' : ''}">
	<td class="ut-px-4 ut-py-2">
		<input
			type="checkbox"
			checked={isSelected}
			on:change={handleToggle}
			class="ut-w-3 ut-h-3 ut-cursor-pointer"
		/>
	</td>
	<td class="ut-pr-4 ut-py-2 ut-text-sm">
		<div class="ut-space-y-0.5">
			<div class="ut-font-medium ut-text-zinc-200 ut-whitespace-nowrap">{record.model}</div>
			<div class="ut-text-xs ut-text-zinc-400 ut-whitespace-nowrap">{providerName}</div>
			<div class="ut-text-xs ut-text-zinc-500 ut-whitespace-nowrap">
				{record.requestType || RequestType.Unknown} • {new Date(record.timestamp).toLocaleString()}
			</div>
		</div>
	</td>
	<td class="ut-px-4 ut-py-2 ut-text-sm ut-whitespace-nowrap">
		<div class="ut-space-y-0.5">
			<div class="ut-flex ut-justify-between ut-gap-2">
				<span class="ut-text-zinc-400 ut-text-xs">{language.input}:</span>
				<span class="ut-text-zinc-300 ut-text-xs">{(record.inputTokens ?? 0).toLocaleString()}</span>
			</div>
			{#if record.cachedInputTokens > 0}
				<div class="ut-flex ut-justify-between ut-gap-2">
					<span class="ut-text-zinc-400 ut-text-xs">{language.cached}:</span>
					<span class="ut-text-zinc-300 ut-text-xs">{record.cachedInputTokens.toLocaleString()}</span>
				</div>
			{/if}
			<div class="ut-flex ut-justify-between ut-gap-2">
				<span class="ut-text-zinc-400 ut-text-xs">{language.output}:</span>
				<span class="ut-text-zinc-300 ut-text-xs">{(record.outputTokens ?? 0).toLocaleString()}</span>
			</div>
		</div>
	</td>
	<td class="ut-px-4 ut-py-2 ut-text-sm ut-whitespace-nowrap">
		<div class="ut-space-y-0.5">
			<div class="ut-flex ut-justify-between ut-gap-2">
				<span class="ut-text-zinc-400 ut-text-xs">{language.totalCost}:</span>
				<span class="ut-text-zinc-300 ut-text-xs">
					<DollarDisplay amount={record.totalCost} {language} />
				</span>
			</div>
			<div class="ut-flex ut-justify-between ut-gap-2">
				<span class="ut-text-zinc-400 ut-text-xs">{language.input}:</span>
				<span class="ut-text-zinc-300 ut-text-xs">
					<DollarDisplay amount={record.inputCost} {language} />
				</span>
			</div>
			<div class="ut-flex ut-justify-between ut-gap-2">
				<span class="ut-text-zinc-400 ut-text-xs">{language.output}:</span>
				<span class="ut-text-zinc-300 ut-text-xs">
					<DollarDisplay amount={record.outputCost} {language} />
				</span>
			</div>
		</div>
	</td>
</tr>
