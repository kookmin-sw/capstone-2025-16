<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// 필터 상태 변수들
	let first = $state(false);
	let age = $state({});
	let gender = $state({});
	let startDate = $state({});
	let procedureType = $state({});
	let visitType = $state({});
	let modifierType = $state({});
	let quantity = $state({});
	let source = $state({});
	let providerSpecialty = $state({});

	// 툴팁 표시 상태
	let showTooltip = $state({});

	// 툴팁 표시/숨김 함수
	function toggleTooltip(key) {
		showTooltip[key] = !showTooltip[key];
	}

	$effect(() => {
		dispatch('add', {
			type: 'procedure_occurrence',
			filters: {
				first,
				age,
				gender,
				startDate,
				procedureType,
				visitType,
				modifierType,
				quantity,
				source,
				providerSpecialty
			}
		});
	});
</script>

<div class="flex flex-col w-full gap-y-8">
	<!-- First Procedure -->
	<div class="flex flex-col gap-y-2 w-full">
		<span class="text-left">First procedure record of the patient</span>
		{#if first}
			<button on:click={() => (first = false)} class="rounded-full bg-blue-200 px-2 py-1 text-xs text-blue-500 w-fit"> Enabled </button>
		{:else}
			<button on:click={() => (first = true)} class="rounded-full bg-pink-200 px-2 py-1 text-xs text-pink-500 w-fit"> Disabled </button>
		{/if}
	</div>

	<!-- Age at Procedure -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Age at procedure:</p>
		<NumberOperator id="age-at-procedure" on:value={({ detail }) => (age = detail)} />
	</div>

	<!-- Gender -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Gender:</p>
		<select class="w-full p-2 border rounded" bind:value={gender}>
			<option value="">Select</option>
			<option value="M">Male</option>
			<option value="F">Female</option>
		</select>
	</div>

	<!-- Start Date -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Procedure date:</p>
		<DateOperator id="procedure-date" on:value={({ detail }) => (startDate = detail)} />
	</div>

	<!-- Procedure Type -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Procedure Type:</p>
		<NumberOperator id="procedure-type" on:value={({ detail }) => (procedureType = detail)} />
	</div>

	<!-- Visit Type -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Visit Type:</p>
		<NumberOperator id="visit-type" on:value={({ detail }) => (visitType = detail)} />
	</div>

	<!-- Modifier Type -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Modifier Type:</p>
		<NumberOperator id="modifier-type" on:value={({ detail }) => (modifierType = detail)} />
	</div>

	<!-- Quantity -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Quantity:</p>
		<NumberOperator id="quantity" on:value={({ detail }) => (quantity = detail)} />
	</div>

	<!-- Source -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Source:</p>
		<NumberOperator id="source" on:value={({ detail }) => (source = detail)} />
	</div>

	<!-- Provider Specialty -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Provider Specialty:</p>
		<NumberOperator id="provider-specialty" on:value={({ detail }) => (providerSpecialty = detail)} />
	</div>
</div> 