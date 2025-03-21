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
	let drugType = $derived(convertOperator2Factor(eventdata.filters.drugType));
	let visitType = $derived(convertOperator2Factor(eventdata.filters.visitType));
	let stopReason = $derived(eventdata.filters.stopReason);
	let refill = $derived(convertOperator2Factor(eventdata.filters.refill));
	let quantity = $derived(convertOperator2Factor(eventdata.filters.quantity));
	let daysSupply = $derived(convertOperator2Factor(eventdata.filters.daysSupply));
	let routeType = $derived(convertOperator2Factor(eventdata.filters.routeType));
	let effectiveDose = $derived(convertOperator2Factor(eventdata.filters.effectiveDose));
	let doseUnit = $derived(convertOperator2Factor(eventdata.filters.doseUnit));
	let lotNumber = $derived(eventdata.filters.lotNumber);
	let source = $derived(convertOperator2Factor(eventdata.filters.source));
	let providerSpecialty = $derived(convertOperator2Factor(eventdata.filters.providerSpecialty));
</script>

<div class="flex w-full flex-col">
	{#if first}
	<p>
		<button class="underline decoration-zinc-800 underline-offset-2"
			>First drug exposure record of the patient</button
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
		<p>Drug Type:</p>
		<NumberOperator readonly={true} operator={drugType.operator} startNumber={drugType.start} endNumber={drugType.end} />
	</div>

	<div class="flex gap-2">
		<p>Visit Type:</p>
		<NumberOperator readonly={true} operator={visitType.operator} startNumber={visitType.start} endNumber={visitType.end} />
	</div>

	{#if stopReason && stopReason.value}
	<div class="flex gap-2">
		<p>Stop Reason:</p>
		<span>{stopReason.value}</span>
	</div>
	{/if}

	<div class="flex gap-2">
		<p>Refills:</p>
		<NumberOperator readonly={true} operator={refill.operator} startNumber={refill.start} endNumber={refill.end} />
	</div>

	<div class="flex gap-2">
		<p>Quantity:</p>
		<NumberOperator readonly={true} operator={quantity.operator} startNumber={quantity.start} endNumber={quantity.end} />
	</div>

	<div class="flex gap-2">
		<p>Days Supply:</p>
		<NumberOperator readonly={true} operator={daysSupply.operator} startNumber={daysSupply.start} endNumber={daysSupply.end} />
	</div>

	<div class="flex gap-2">
		<p>Route Type:</p>
		<NumberOperator readonly={true} operator={routeType.operator} startNumber={routeType.start} endNumber={routeType.end} />
	</div>

	<div class="flex gap-2">
		<p>Effective Dose:</p>
		<NumberOperator readonly={true} operator={effectiveDose.operator} startNumber={effectiveDose.start} endNumber={effectiveDose.end} />
	</div>

	<div class="flex gap-2">
		<p>Dose Unit:</p>
		<NumberOperator readonly={true} operator={doseUnit.operator} startNumber={doseUnit.start} endNumber={doseUnit.end} />
	</div>

	{#if lotNumber && lotNumber.value}
	<div class="flex gap-2">
		<p>Lot Number:</p>
		<span>{lotNumber.value}</span>
	</div>
	{/if}

	<div class="flex gap-2">
		<p>Source:</p>
		<NumberOperator readonly={true} operator={source.operator} startNumber={source.start} endNumber={source.end} />
	</div>

	<div class="flex gap-2">
		<p>Provider Specialty:</p>
		<NumberOperator readonly={true} operator={providerSpecialty.operator} startNumber={providerSpecialty.start} endNumber={providerSpecialty.end} />
	</div>
</div> 