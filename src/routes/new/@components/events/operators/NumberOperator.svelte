<script>
	import { createEventDispatcher } from 'svelte';

	let { readonly = false, operator = 'eq', startNumber = 0, endNumber = 0 } = $props();
	const dispatch = createEventDispatcher();


	if (!readonly)
		$effect(() => {
			dispatch('value', getPackagedOutput());
		});

	function getPackagedOutput() {
		switch (operator) {
			case '!bt':
				return {
					lt: startNumber,
					gt: endNumber
				};
			case 'bt':
				return {
					gte: startNumber,
					lte: endNumber
				};
			case 'eq':
				return {
					eq: startNumber
				};
			case 'gt':
				return {
					gt: startNumber
				};
			case 'gte':
				return {
					gte: startNumber
				};
			case 'lt':
				return {
					lt: startNumber
				};
			case 'lte':
				return {
					lte: startNumber
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
				type="number"
				bind:value={startNumber}
				class="w-fit rounded-md rounded-none border border-zinc-200 px-0 px-2 py-0 text-xs"
			/>
			<p>~</p>
			<input
				type="number"
				bind:value={endNumber}
				class="w-fit rounded-md rounded-none border border-zinc-200 px-0 px-2 py-0 text-xs"
			/>
		{:else}
			<input
				type="number"
				bind:value={startNumber}
				class="w-12 rounded-md rounded-none border border-zinc-200 px-0 px-2 py-0 text-right text-xs"
			/>
		{/if}
	{:else}
        {#if operator === '!bt' || operator === 'bt'}
            <p>{operator === 'bt' ? 'between' : 'not between'} {startNumber} and {endNumber}</p>
        {:else if operator === 'lt'}
            <p>less than {startNumber}</p>
        {:else if operator === 'lte'}
            <p>less than or equal to {startNumber}</p>
        {:else if operator === 'eq'}
            <p>equal to {startNumber}</p>
        {:else if operator === 'gt'}
            <p>greater than {startNumber}</p>
        {:else if operator === 'gte'}
            <p>greater than or equal to {startNumber}</p>
        {/if}
	{/if}
</div>
