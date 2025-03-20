<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
    import { convertOperator2Factor } from '../../utils';
	import { onMount } from 'svelte';
	
	let {eventdata} = $props();
	
	let first = $derived(eventdata.filters.first);
	let age = $derived(convertOperator2Factor(eventdata.filters.age));
	let gender = $derived(eventdata.filters.gender);
	let date = $derived(convertOperator2Factor(eventdata.filters.date));
	let specimenType = $derived(convertOperator2Factor(eventdata.filters.specimenType));
	let quantity = $derived(convertOperator2Factor(eventdata.filters.quantity));
	let unitType = $derived(convertOperator2Factor(eventdata.filters.unitType));
	let anatomicSiteType = $derived(convertOperator2Factor(eventdata.filters.anatomicSiteType));
	let diseaseStatus = $derived(convertOperator2Factor(eventdata.filters.diseaseStatus));
</script>

<div class="flex w-full flex-col">
	{#if first}
	<p>
		<button class="underline decoration-zinc-800 underline-offset-2"
			>First specimen record of the patient</button
		>
	</p>
	{/if}

	<div class="flex gap-2">
		<p>Age at specimen collection:</p>
		<NumberOperator readonly={true} operator={age.operator} startNumber={age.start} endNumber={age.end} />
	</div>

	<div class="flex gap-2">
		<p>Gender:</p>
		<button class="underline decoration-zinc-800 underline-offset-2">{gender}</button>
	</div>

	<div class="flex gap-2">
		<p>Collection date:</p>
		<DateOperator readonly={true} operator={date.operator} startDate={date.start} endDate={date.end} />
	</div>

	<div class="flex gap-2">
		<p>Specimen Type:</p>
		<NumberOperator readonly={true} operator={specimenType.operator} startNumber={specimenType.start} endNumber={specimenType.end} />
	</div>

	<div class="flex gap-2">
		<p>Quantity:</p>
		<NumberOperator readonly={true} operator={quantity.operator} startNumber={quantity.start} endNumber={quantity.end} />
	</div>

	<div class="flex gap-2">
		<p>Unit Type:</p>
		<NumberOperator readonly={true} operator={unitType.operator} startNumber={unitType.start} endNumber={unitType.end} />
	</div>

	<div class="flex gap-2">
		<p>Anatomic Site Type:</p>
		<NumberOperator readonly={true} operator={anatomicSiteType.operator} startNumber={anatomicSiteType.start} endNumber={anatomicSiteType.end} />
	</div>

	<div class="flex gap-2">
		<p>Disease Status:</p>
		<NumberOperator readonly={true} operator={diseaseStatus.operator} startNumber={diseaseStatus.start} endNumber={diseaseStatus.end} />
	</div>
</div> 