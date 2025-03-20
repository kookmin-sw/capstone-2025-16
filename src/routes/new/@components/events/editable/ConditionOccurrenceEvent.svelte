<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// 필터 상태 변수들
	let firstDiagnosis = $state(false);
	let ageAtOccurrence = $state({});
	let gender = $state({});
	let conditionStatus = $state({});
	let startDate = $state({});
	let endDate = $state({});
	let conditionType = $state({});
	let visit = $state({});
	let stopReason = $state({});
	let sourceConcept = $state({});
	let providerSpecialty = $state({});

	// 툴팁 표시 상태
	let showTooltip = $state({});

	// 툴팁 표시/숨김 함수
	function toggleTooltip(key) {
		showTooltip[key] = !showTooltip[key];
	}

	$effect(() => {
		dispatch('add', {
			type: 'condition_occurrence',
			filters: {
				firstDiagnosis,
				ageAtOccurrence,
				gender,
				conditionStatus,
				startDate,
				endDate,
				conditionType,
				visit,
				stopReason,
				sourceConcept,
				providerSpecialty
			}
		});
	});
</script>

<div class="flex flex-col w-full gap-y-8">
	<!-- First Diagnosis -->
	<div class="flex flex-col gap-y-2 w-full">
		<span class="text-left">First diagnosis record of the patient</span>
		{#if firstDiagnosis}
			<button on:click={() => (firstDiagnosis = false)} class="rounded-full bg-blue-200 px-2 py-1 text-xs text-blue-500 w-fit"> Enabled </button>
		{:else}
			<button on:click={() => (firstDiagnosis = true)} class="rounded-full bg-pink-200 px-2 py-1 text-xs text-pink-500 w-fit"> Disabled </button>
		{/if}
	</div>

	<!-- Age at Occurrence -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Age at diagnosis:</p>
		<NumberOperator id="age-at-occurrence" on:value={({ detail }) => (ageAtOccurrence = detail)} />
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

	<!-- Condition Status -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Condition Status:</p>
		<NumberOperator id="condition-status" on:value={({ detail }) => (conditionStatus = detail)} />
	</div>

	<!-- Start Date -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Period start:</p>
		<DateOperator id="start-date" on:value={({ detail }) => (startDate = detail)} />
	</div>

	<!-- End Date -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Period end:</p>
		<DateOperator id="end-date" on:value={({ detail }) => (endDate = detail)} />
	</div>

	<!-- Condition Type -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Condition Type:</p>
		<NumberOperator id="condition-type" on:value={({ detail }) => (conditionType = detail)} />
	</div>

	<!-- Visit -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Visit:</p>
		<NumberOperator id="visit" on:value={({ detail }) => (visit = detail)} />
	</div>

	<!-- Stop Reason -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Stop Reason:</p>
		<input 
			type="text" 
			class="w-full p-2 border rounded"
			bind:value={stopReason.value} 
			placeholder="Enter Stop Reason"
		/>
	</div>

	<!-- Condition Source Concept -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Condition Source Concept:</p>
		<NumberOperator id="source-concept" on:value={({ detail }) => (sourceConcept = detail)} />
	</div>

	<!-- Provider Specialty -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Provider Specialty:</p>
		<NumberOperator id="provider-specialty" on:value={({ detail }) => (providerSpecialty = detail)} />
	</div>
</div>

