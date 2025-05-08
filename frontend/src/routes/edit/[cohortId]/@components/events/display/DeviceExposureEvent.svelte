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
	let deviceType = $derived(convertOperator2Factor(eventdata.filters.deviceType));
	let visitType = $derived(convertOperator2Factor(eventdata.filters.visitType));
	let uniqueDeviceId = $derived(eventdata.filters.uniqueDeviceId);
	let quantity = $derived(convertOperator2Factor(eventdata.filters.quantity));
	let source = $derived(convertOperator2Factor(eventdata.filters.source));
	let providerSpecialty = $derived(convertOperator2Factor(eventdata.filters.providerSpecialty));
</script>

<div class="flex w-full flex-col">
	{#if first}
	<p>
		<button class="underline decoration-zinc-800 underline-offset-2"
			>First device exposure record of the patient</button
		>
	</p>
	{/if}

	<div class="flex gap-2">
		<p>Age at exposure:</p>
		<NumberOperator readonly={true} operator={age.operator} startNumber={age.start} endNumber={age.end} />
	</div>

	<div class="flex gap-2">
		<p>Gender:</p>
		<button class="underline decoration-zinc-800 underline-offset-2">{gender}</button>
	</div>

	<div class="flex gap-2">
		<p>Exposure start date:</p>
		<DateOperator readonly={true} operator={startDate.operator} startDate={startDate.start} endDate={startDate.end} />
	</div>

	<div class="flex gap-2">
		<p>Exposure end date:</p>
		<DateOperator readonly={true} operator={endDate.operator} startDate={endDate.start} endDate={endDate.end} />
	</div>

	<div class="flex gap-2">
		<p>Device Type:</p>
		<NumberOperator readonly={true} operator={deviceType.operator} startNumber={deviceType.start} endNumber={deviceType.end} />
	</div>

	<div class="flex gap-2">
		<p>Visit Type:</p>
		<NumberOperator readonly={true} operator={visitType.operator} startNumber={visitType.start} endNumber={visitType.end} />
	</div>

	{#if uniqueDeviceId && uniqueDeviceId.value}
	<div class="flex gap-2">
		<p>Unique Device ID:</p>
		<span>{uniqueDeviceId.value}</span>
	</div>
	{/if}

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