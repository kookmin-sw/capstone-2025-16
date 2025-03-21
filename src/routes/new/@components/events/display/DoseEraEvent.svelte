<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
    import { convertOperator2Factor } from '../../utils';
	import { onMount } from 'svelte';
	
	let {eventdata} = $props();
	
	let first = $derived(eventdata.filters.first);
	let startAge = $derived(convertOperator2Factor(eventdata.filters.startAge));
	let endAge = $derived(convertOperator2Factor(eventdata.filters.endAge));
	let gender = $derived(eventdata.filters.gender);
	let startDate = $derived(convertOperator2Factor(eventdata.filters.startDate));
	let endDate = $derived(convertOperator2Factor(eventdata.filters.endDate));
	let doseUnit = $derived(convertOperator2Factor(eventdata.filters.doseUnit));
	let length = $derived(convertOperator2Factor(eventdata.filters.length));
	let doseValue = $derived(convertOperator2Factor(eventdata.filters.doseValue));
</script>

<div class="flex w-full flex-col">
	{#if first}
	<p>
		<button class="underline decoration-zinc-800 underline-offset-2"
			>First dose era record of the patient</button
		>
	</p>
	{/if}

	<div class="flex gap-2">
		<p>Age at dose era start:</p>
		<NumberOperator readonly={true} operator={startAge.operator} startNumber={startAge.start} endNumber={startAge.end} />
	</div>

	<div class="flex gap-2">
		<p>Age at dose era end:</p>
		<NumberOperator readonly={true} operator={endAge.operator} startNumber={endAge.start} endNumber={endAge.end} />
	</div>

	<div class="flex gap-2">
		<p>Gender:</p>
		<button class="underline decoration-zinc-800 underline-offset-2">{gender}</button>
	</div>

	<div class="flex gap-2">
		<p>Dose era start date:</p>
		<DateOperator readonly={true} operator={startDate.operator} startDate={startDate.start} endDate={startDate.end} />
	</div>

	<div class="flex gap-2">
		<p>Dose era end date:</p>
		<DateOperator readonly={true} operator={endDate.operator} startDate={endDate.start} endDate={endDate.end} />
	</div>

	<div class="flex gap-2">
		<p>Dose Unit:</p>
		<NumberOperator readonly={true} operator={doseUnit.operator} startNumber={doseUnit.start} endNumber={doseUnit.end} />
	</div>

	<div class="flex gap-2">
		<p>Era Length:</p>
		<NumberOperator readonly={true} operator={length.operator} startNumber={length.start} endNumber={length.end} />
	</div>

	<div class="flex gap-2">
		<p>Dose Value:</p>
		<NumberOperator readonly={true} operator={doseValue.operator} startNumber={doseValue.start} endNumber={doseValue.end} />
	</div>
</div> 