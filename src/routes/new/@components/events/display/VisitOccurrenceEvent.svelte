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
	let endDate = $derived(convertOperator2Factor(eventdata.filters.endDate));
	let visitType = $derived(convertOperator2Factor(eventdata.filters.visitType));
	let length = $derived(convertOperator2Factor(eventdata.filters.length));
	let source = $derived(convertOperator2Factor(eventdata.filters.source));
	let providerSpecialty = $derived(convertOperator2Factor(eventdata.filters.providerSpecialty));
	let placeOfService = $derived(convertOperator2Factor(eventdata.filters.placeOfService));
</script>

<div class="flex w-full flex-col">
	{#if first}
	<p>
		<button class="underline decoration-zinc-800 underline-offset-2"
			>First visit record of the patient</button
		>
	</p>
	{/if}

	<div class="flex gap-2">
		<p>Age at visit start:</p>
		<NumberOperator readonly={true} operator={age.operator} startNumber={age.start} endNumber={age.end} />
	</div>

	<div class="flex gap-2">
		<p>Gender:</p>
		<button class="underline decoration-zinc-800 underline-offset-2">{gender}</button>
	</div>

	<div class="flex gap-2">
		<p>Visit start date:</p>
		<DateOperator readonly={true} operator={startDate.operator} startDate={startDate.start} endDate={startDate.end} />
	</div>

	<div class="flex gap-2">
		<p>Visit end date:</p>
		<DateOperator readonly={true} operator={endDate.operator} startDate={endDate.start} endDate={endDate.end} />
	</div>

	<div class="flex gap-2">
		<p>Visit Type:</p>
		<NumberOperator readonly={true} operator={visitType.operator} startNumber={visitType.start} endNumber={visitType.end} />
	</div>

	<div class="flex gap-2">
		<p>Visit Length (days):</p>
		<NumberOperator readonly={true} operator={length.operator} startNumber={length.start} endNumber={length.end} />
	</div>

	<div class="flex gap-2">
		<p>Source:</p>
		<NumberOperator readonly={true} operator={source.operator} startNumber={source.start} endNumber={source.end} />
	</div>

	<div class="flex gap-2">
		<p>Provider Specialty:</p>
		<NumberOperator readonly={true} operator={providerSpecialty.operator} startNumber={providerSpecialty.start} endNumber={providerSpecialty.end} />
	</div>

	<div class="flex gap-2">
		<p>Place of Service:</p>
		<NumberOperator readonly={true} operator={placeOfService.operator} startNumber={placeOfService.start} endNumber={placeOfService.end} />
	</div>
</div> 