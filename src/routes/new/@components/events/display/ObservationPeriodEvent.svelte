<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
    import { convertOperator2Factor } from '../../utils';
	import { onMount } from 'svelte';
	
	let {eventdata} = $props();
	
	let first = $derived(eventdata.filters.first);
	let startAge = $derived(convertOperator2Factor(eventdata.filters.startAge));
	let endAge = $derived(convertOperator2Factor(eventdata.filters.endAge));
	let startDate = $derived(convertOperator2Factor(eventdata.filters.startDate));
	let endDate = $derived(convertOperator2Factor(eventdata.filters.endDate));
	let length = $derived(convertOperator2Factor(eventdata.filters.length));
</script>

<div class="flex w-full flex-col">
	{#if first}
	<p>
		<button class="underline decoration-zinc-800 underline-offset-2"
			>First observation period of the patient</button
		>
	</p>
	{/if}

	<div class="flex gap-2">
		<p>Age at period start:</p>
		<NumberOperator readonly={true} operator={startAge.operator} startNumber={startAge.start} endNumber={startAge.end} />
	</div>

	<div class="flex gap-2">
		<p>Age at period end:</p>
		<NumberOperator readonly={true} operator={endAge.operator} startNumber={endAge.start} endNumber={endAge.end} />
	</div>

	<div class="flex gap-2">
		<p>Period start date:</p>
		<DateOperator readonly={true} operator={startDate.operator} startDate={startDate.start} endDate={startDate.end} />
	</div>

	<div class="flex gap-2">
		<p>Period end date:</p>
		<DateOperator readonly={true} operator={endDate.operator} startDate={endDate.start} endDate={endDate.end} />
	</div>

	<div class="flex gap-2">
		<p>Period Length (days):</p>
		<NumberOperator readonly={true} operator={length.operator} startNumber={length.start} endNumber={length.end} />
	</div>
</div> 