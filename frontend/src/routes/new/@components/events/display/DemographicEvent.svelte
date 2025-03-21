<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
    import { convertOperator2Factor } from '../../utils';
	import { onMount } from 'svelte';
	
	let {eventdata} = $props();
	
	let age = $derived(convertOperator2Factor(eventdata.filters.age));
	let gender = $derived(eventdata.filters.gender);
	let startDate = $derived(convertOperator2Factor(eventdata.filters.startDate));
	let endDate = $derived(convertOperator2Factor(eventdata.filters.endDate));
	let raceType = $derived(convertOperator2Factor(eventdata.filters.raceType));
	let ethnicityType = $derived(convertOperator2Factor(eventdata.filters.ethnicityType));
</script>

<div class="flex w-full flex-col">
	<div class="flex gap-2">
		<p>Age:</p>
		<NumberOperator readonly={true} operator={age.operator} startNumber={age.start} endNumber={age.end} />
	</div>

	<div class="flex gap-2">
		<p>Gender:</p>
		<button class="underline decoration-zinc-800 underline-offset-2">{gender}</button>
	</div>

	<div class="flex gap-2">
		<p>Start date:</p>
		<DateOperator readonly={true} operator={startDate.operator} startDate={startDate.start} endDate={startDate.end} />
	</div>

	<div class="flex gap-2">
		<p>End date:</p>
		<DateOperator readonly={true} operator={endDate.operator} startDate={endDate.start} endDate={endDate.end} />
	</div>

	<div class="flex gap-2">
		<p>Race Type:</p>
		<NumberOperator readonly={true} operator={raceType.operator} startNumber={raceType.start} endNumber={raceType.end} />
	</div>

	<div class="flex gap-2">
		<p>Ethnicity Type:</p>
		<NumberOperator readonly={true} operator={ethnicityType.operator} startNumber={ethnicityType.start} endNumber={ethnicityType.end} />
	</div>
</div> 