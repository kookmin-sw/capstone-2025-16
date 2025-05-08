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
	let measurementType = $derived(convertOperator2Factor(eventdata.filters.measurementType));
	let visitType = $derived(convertOperator2Factor(eventdata.filters.visitType));
	let operatorType = $derived(convertOperator2Factor(eventdata.filters.operatorType));
	let valueAsNumber = $derived(convertOperator2Factor(eventdata.filters.valueAsNumber));
	let valueAsConcept = $derived(convertOperator2Factor(eventdata.filters.valueAsConcept));
	let unitType = $derived(convertOperator2Factor(eventdata.filters.unitType));
	let abnormal = $derived(eventdata.filters.abnormal);
	let rangeLow = $derived(convertOperator2Factor(eventdata.filters.rangeLow));
	let rangeHigh = $derived(convertOperator2Factor(eventdata.filters.rangeHigh));
	let providerSpecialty = $derived(convertOperator2Factor(eventdata.filters.providerSpecialty));
	let source = $derived(convertOperator2Factor(eventdata.filters.source));
</script>

<div class="flex w-full flex-col">
	{#if first}
	<p>
		<button class="underline decoration-zinc-800 underline-offset-2"
			>First measurement record of the patient</button
		>
	</p>
	{/if}

	<div class="flex gap-2">
		<p>Age at measurement:</p>
		<NumberOperator readonly={true} operator={age.operator} startNumber={age.start} endNumber={age.end} />
	</div>

	<div class="flex gap-2">
		<p>Gender:</p>
		<button class="underline decoration-zinc-800 underline-offset-2">{gender}</button>
	</div>

	<div class="flex gap-2">
		<p>Measurement date:</p>
		<DateOperator readonly={true} operator={date.operator} startDate={date.start} endDate={date.end} />
	</div>

	<div class="flex gap-2">
		<p>Measurement Type:</p>
		<NumberOperator readonly={true} operator={measurementType.operator} startNumber={measurementType.start} endNumber={measurementType.end} />
	</div>

	<div class="flex gap-2">
		<p>Visit Type:</p>
		<NumberOperator readonly={true} operator={visitType.operator} startNumber={visitType.start} endNumber={visitType.end} />
	</div>

	<div class="flex gap-2">
		<p>Operator Type:</p>
		<NumberOperator readonly={true} operator={operatorType.operator} startNumber={operatorType.start} endNumber={operatorType.end} />
	</div>

	<div class="flex gap-2">
		<p>Value As Number:</p>
		<NumberOperator readonly={true} operator={valueAsNumber.operator} startNumber={valueAsNumber.start} endNumber={valueAsNumber.end} />
	</div>

	<div class="flex gap-2">
		<p>Value As Concept:</p>
		<NumberOperator readonly={true} operator={valueAsConcept.operator} startNumber={valueAsConcept.start} endNumber={valueAsConcept.end} />
	</div>

	<div class="flex gap-2">
		<p>Unit Type:</p>
		<NumberOperator readonly={true} operator={unitType.operator} startNumber={unitType.start} endNumber={unitType.end} />
	</div>

	{#if abnormal}
	<p>
		<button class="underline decoration-zinc-800 underline-offset-2"
			>Abnormal result</button
		>
	</p>
	{/if}

	<div class="flex gap-2">
		<p>Range Low:</p>
		<NumberOperator readonly={true} operator={rangeLow.operator} startNumber={rangeLow.start} endNumber={rangeLow.end} />
	</div>

	<div class="flex gap-2">
		<p>Range High:</p>
		<NumberOperator readonly={true} operator={rangeHigh.operator} startNumber={rangeHigh.start} endNumber={rangeHigh.end} />
	</div>

	<div class="flex gap-2">
		<p>Provider Specialty:</p>
		<NumberOperator readonly={true} operator={providerSpecialty.operator} startNumber={providerSpecialty.start} endNumber={providerSpecialty.end} />
	</div>

	<div class="flex gap-2">
		<p>Source:</p>
		<NumberOperator readonly={true} operator={source.operator} startNumber={source.start} endNumber={source.end} />
	</div>
</div>