<script>
	import { createEventDispatcher } from 'svelte';

	let {
		readonly = false,
		operator = 'eq',
		startDate = new Date(),
		endDate = new Date()
	} = $props();
    
	const dispatch = createEventDispatcher();
	if (!readonly)
		$effect(() => {
			dispatch('value', getPackagedOutput());
		});

	function getPackagedOutput() {
		switch (operator) {
			case '!bt':
				return {
					lt: startDate,
					gt: endDate
				};
			case 'bt':
				return {
					gte: startDate,
					lte: endDate
				};
			case 'eq':
				return {
					eq: startDate
				};
			case 'gt':
				return {
					gt: startDate
				};
			case 'gte':
				return {
					gte: startDate
				};
			case 'lt':
				return {
					lt: startDate
				};
			case 'lte':
				return {
					lte: startDate
				};
		}
	}
</script>

<div class="flex gap-x-2">
	{#if !readonly}
		<select
			bind:value={operator}
			class="w-fit rounded-md rounded-none border border-zinc-200 px-0 px-2 py-0 text-xs"
		>
			<option value="lt">더 작은</option>
			<option value="lte">작거나 같음</option>
			<option value="eq">같음</option>
			<option value="gt">더 큰</option>
			<option value="gte">크거나 같음</option>
			<option value="bt">사이에</option>
			<option value="!bt">사이에 없는</option>
		</select>
		{#if operator === '!bt' || operator === 'bt'}
			<input
				type="date"
				bind:value={startDate}
				class="w-fit rounded-md rounded-none border border-zinc-200 px-0 px-2 py-0 text-xs"
			/>
			<p>~</p>
			<input
				type="date"
				bind:value={endDate}
				class="w-fit rounded-md rounded-none border border-zinc-200 px-0 px-2 py-0 text-xs"
			/>
		{:else}
			<input
				type="date"
				bind:value={startDate}
				class="w-fit rounded-md rounded-none border border-zinc-200 px-0 px-2 py-0 text-xs"
			/>
		{/if}
	{:else}
		{#if operator === '!bt' || operator === 'bt'}
			<p>{operator === 'bt' ? 'dates between' : 'dates not between'} {startDate} and {endDate}</p>
		{:else if operator === 'lt'}
			<p>before {startDate}</p>
		{:else if operator === 'lte'}
			<p>on or before {startDate}</p>
		{:else if operator === 'eq'}
			<p>on {startDate}</p>
		{:else if operator === 'gt'}
			<p>after {startDate}</p>
		{:else if operator === 'gte'}
			<p>on or after {startDate}</p>
		{/if}
	{/if}
</div>
