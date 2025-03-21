<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
    import { convertOperator2Factor } from '../../utils';
	import { onMount } from 'svelte';
	
	let {eventdata} = $props();
	
	let first = $derived(eventdata.filters.first);
	let age = $derived(convertOperator2Factor(eventdata.filters.age));
	let gender = $derived(eventdata.filters.gender);
	let startDate = $derived(convertOperator2Factor(eventdata.filters.startDate));
	let procedureType = $derived(convertOperator2Factor(eventdata.filters.procedureType));
	let visitType = $derived(convertOperator2Factor(eventdata.filters.visitType));
	let modifierType = $derived(convertOperator2Factor(eventdata.filters.modifierType));
	let quantity = $derived(convertOperator2Factor(eventdata.filters.quantity));
	let source = $derived(convertOperator2Factor(eventdata.filters.source));
	let providerSpecialty = $derived(convertOperator2Factor(eventdata.filters.providerSpecialty));
</script>

<div class="flex w-full flex-col">
	{#if first}
	<p>
		<button class="underline decoration-zinc-800 underline-offset-2"
			>First procedure record of the patient</button
		>
	</p>
	{/if}

	<div class="flex gap-2">
		<p>Age at procedure:</p>
		<NumberOperator readonly={true} operator={age.operator} startNumber={age.start} endNumber={age.end} />
	</div>

	<div class="flex gap-2">
		<p>Gender:</p>
		<button class="underline decoration-zinc-800 underline-offset-2">{gender}</button>
	</div>

	<div class="flex gap-2">
		<p>Procedure date:</p>
		<DateOperator readonly={true} operator={startDate.operator} startDate={startDate.start} endDate={startDate.end} />
	</div>

	<div class="flex gap-2">
		<p>Procedure Type:</p>
		<NumberOperator readonly={true} operator={procedureType.operator} startNumber={procedureType.start} endNumber={procedureType.end} />
	</div>

	<div class="flex gap-2">
		<p>Visit Type:</p>
		<NumberOperator readonly={true} operator={visitType.operator} startNumber={visitType.start} endNumber={visitType.end} />
	</div>

	<div class="flex gap-2">
		<p>Modifier Type:</p>
		<NumberOperator readonly={true} operator={modifierType.operator} startNumber={modifierType.start} endNumber={modifierType.end} />
	</div>

	<div class="flex gap-2">
		<p>Quantity:</p>
		<NumberOperator readonly={true} operator={quantity.operator} startNumber={quantity.start} endNumber={quantity.end} />
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