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
	let observationType = $derived(convertOperator2Factor(eventdata.filters.observationType));
	let visitType = $derived(convertOperator2Factor(eventdata.filters.visitType));
	let valueAsNumber = $derived(convertOperator2Factor(eventdata.filters.valueAsNumber));
	let valueAsString = $derived(eventdata.filters.valueAsString);
	let valueAsConcept = $derived(convertOperator2Factor(eventdata.filters.valueAsConcept));
	let qualifierType = $derived(convertOperator2Factor(eventdata.filters.qualifierType));
	let unitType = $derived(convertOperator2Factor(eventdata.filters.unitType));
	let source = $derived(convertOperator2Factor(eventdata.filters.source));
	let providerSpecialty = $derived(convertOperator2Factor(eventdata.filters.providerSpecialty));
</script>

<div class="flex w-full flex-col">
	{#if first}
	<p>
		<button class="underline decoration-zinc-800 underline-offset-2"
			>First observation record of the patient</button
		>
	</p>
	{/if}

	<div class="flex gap-2">
		<p>Age at observation:</p>
		<NumberOperator readonly={true} operator={age.operator} startNumber={age.start} endNumber={age.end} />
	</div>

	<div class="flex gap-2">
		<p>Gender:</p>
		<button class="underline decoration-zinc-800 underline-offset-2">{gender}</button>
	</div>

	<div class="flex gap-2">
		<p>Observation date:</p>
		<DateOperator readonly={true} operator={date.operator} startDate={date.start} endDate={date.end} />
	</div>

	<div class="flex gap-2">
		<p>Observation Type:</p>
		<NumberOperator readonly={true} operator={observationType.operator} startNumber={observationType.start} endNumber={observationType.end} />
	</div>

	<div class="flex gap-2">
		<p>Visit Type:</p>
		<NumberOperator readonly={true} operator={visitType.operator} startNumber={visitType.start} endNumber={visitType.end} />
	</div>

	<div class="flex gap-2">
		<p>Value As Number:</p>
		<NumberOperator readonly={true} operator={valueAsNumber.operator} startNumber={valueAsNumber.start} endNumber={valueAsNumber.end} />
	</div>

	{#if valueAsString && valueAsString.value}
	<div class="flex gap-2">
		<p>Value As String:</p>
		<span>{valueAsString.value}</span>
	</div>
	{/if}

	<div class="flex gap-2">
		<p>Value As Concept:</p>
		<NumberOperator readonly={true} operator={valueAsConcept.operator} startNumber={valueAsConcept.start} endNumber={valueAsConcept.end} />
	</div>

	<div class="flex gap-2">
		<p>Qualifier Type:</p>
		<NumberOperator readonly={true} operator={qualifierType.operator} startNumber={qualifierType.start} endNumber={qualifierType.end} />
	</div>

	<div class="flex gap-2">
		<p>Unit Type:</p>
		<NumberOperator readonly={true} operator={unitType.operator} startNumber={unitType.start} endNumber={unitType.end} />
	</div>

	<div class="flex gap-2">
		<p>Source:</p>
		<NumberOperator readonly={true} operator={source.operator} startNumber={source.start} endNumber={source.end} />
	</div>

	<div class="flex gap-2">
		<p>Provider Specialty:</p>
		<NumberOperator readonly={true} operator={providerSpecialty.operator} startNumber={providerSpecialty.start} endNumber={providerSpecialty.end} />
	</div>
</div> 