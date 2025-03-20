<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// 필터 상태 변수들
	let first = $state(false);
	let age = $state({});
	let gender = $state({});
	let date = $state({});
	let measurementType = $state({});
	let visitType = $state({});
	let operatorType = $state({});
	let valueAsNumber = $state({});
	let valueAsConcept = $state({});
	let unitType = $state({});
	let abnormal = $state(false);
	let rangeLow = $state({});
	let rangeHigh = $state({});
	let providerSpecialty = $state({});
	let source = $state({});

	// 툴팁 표시 상태
	let showTooltip = $state({});

	// 툴팁 표시/숨김 함수
	function toggleTooltip(key) {
		showTooltip[key] = !showTooltip[key];
	}

	$effect(() => {
		dispatch('add', {
			type: 'measurement',
			filters: {
				first,
				age,
				gender,
				date,
				measurementType,
				visitType,
				operatorType,
				valueAsNumber,
				valueAsConcept,
				unitType,
				abnormal,
				rangeLow,
				rangeHigh,
				providerSpecialty,
				source
			}
		});
	});
</script>

<div class="flex flex-col w-full gap-y-8">
	<!-- First Measurement -->
	<div class="flex flex-col gap-y-2 w-full">
		<span class="text-left">First measurement record of the patient</span>
		{#if first}
			<button on:click={() => (first = false)} class="rounded-full bg-blue-200 px-2 py-1 text-xs text-blue-500 w-fit"> Enabled </button>
		{:else}
			<button on:click={() => (first = true)} class="rounded-full bg-pink-200 px-2 py-1 text-xs text-pink-500 w-fit"> Disabled </button>
		{/if}
	</div>

	<!-- Age at Measurement -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Age at measurement:</p>
		<NumberOperator id="age-at-measurement" on:value={({ detail }) => (age = detail)} />
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

	<!-- Date -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Measurement date:</p>
		<DateOperator id="measurement-date" on:value={({ detail }) => (date = detail)} />
	</div>

	<!-- Measurement Type -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Measurement Type:</p>
		<NumberOperator id="measurement-type" on:value={({ detail }) => (measurementType = detail)} />
	</div>

	<!-- Visit Type -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Visit Type:</p>
		<NumberOperator id="visit-type" on:value={({ detail }) => (visitType = detail)} />
	</div>

	<!-- Operator Type -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Operator Type:</p>
		<NumberOperator id="operator-type" on:value={({ detail }) => (operatorType = detail)} />
	</div>

	<!-- Value As Number -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Value As Number:</p>
		<NumberOperator id="value-as-number" on:value={({ detail }) => (valueAsNumber = detail)} />
	</div>

	<!-- Value As Concept -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Value As Concept:</p>
		<NumberOperator id="value-as-concept" on:value={({ detail }) => (valueAsConcept = detail)} />
	</div>

	<!-- Unit Type -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Unit Type:</p>
		<NumberOperator id="unit-type" on:value={({ detail }) => (unitType = detail)} />
	</div>

	<!-- Abnormal -->
	<div class="flex flex-col gap-y-2 w-full">
		<span class="text-left">Abnormal result</span>
		{#if abnormal}
			<button on:click={() => (abnormal = false)} class="rounded-full bg-blue-200 px-2 py-1 text-xs text-blue-500 w-fit"> Enabled </button>
		{:else}
			<button on:click={() => (abnormal = true)} class="rounded-full bg-pink-200 px-2 py-1 text-xs text-pink-500 w-fit"> Disabled </button>
		{/if}
	</div>

	<!-- Range Low -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Range Low:</p>
		<NumberOperator id="range-low" on:value={({ detail }) => (rangeLow = detail)} />
	</div>

	<!-- Range High -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Range High:</p>
		<NumberOperator id="range-high" on:value={({ detail }) => (rangeHigh = detail)} />
	</div>

	<!-- Provider Specialty -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Provider Specialty:</p>
		<NumberOperator id="provider-specialty" on:value={({ detail }) => (providerSpecialty = detail)} />
	</div>

	<!-- Source -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Source:</p>
		<NumberOperator id="source" on:value={({ detail }) => (source = detail)} />
	</div>
</div> 