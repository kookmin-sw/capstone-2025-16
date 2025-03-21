<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// 필터 상태 변수들
	let first = $state(false);
	let startAge = $state({});
	let endAge = $state({});
	let gender = $state({});
	let startDate = $state({});
	let endDate = $state({});
	let doseUnit = $state({});
	let length = $state({});
	let doseValue = $state({});

	// 툴팁 표시 상태
	let showTooltip = $state({});

	// 툴팁 표시/숨김 함수
	function toggleTooltip(key) {
		showTooltip[key] = !showTooltip[key];
	}

	$effect(() => {
		dispatch('add', {
			type: 'dose_era',
			filters: {
				first,
				startAge,
				endAge,
				gender,
				startDate,
				endDate,
				doseUnit,
				length,
				doseValue
			}
		});
	});
</script>

<div class="flex flex-col w-full gap-y-8">
	<!-- First Exposure -->
	<div class="flex flex-col gap-y-2 w-full">
		<span class="text-left">First dose era record of the patient</span>
		{#if first}
			<button on:click={() => (first = false)} class="rounded-full bg-blue-200 px-2 py-1 text-xs text-blue-500 w-fit"> Enabled </button>
		{:else}
			<button on:click={() => (first = true)} class="rounded-full bg-pink-200 px-2 py-1 text-xs text-pink-500 w-fit"> Disabled </button>
		{/if}
	</div>

	<!-- Start Age -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Age at dose era start:</p>
		<NumberOperator id="start-age" on:value={({ detail }) => (startAge = detail)} />
	</div>

	<!-- End Age -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Age at dose era end:</p>
		<NumberOperator id="end-age" on:value={({ detail }) => (endAge = detail)} />
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
		<p>Dose era start date:</p>
		<DateOperator id="start-date" on:value={({ detail }) => (startDate = detail)} />
	</div>

	<!-- End Date -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Dose era end date:</p>
		<DateOperator id="end-date" on:value={({ detail }) => (endDate = detail)} />
	</div>

	<!-- Dose Unit -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Dose Unit:</p>
		<NumberOperator id="dose-unit" on:value={({ detail }) => (doseUnit = detail)} />
	</div>

	<!-- Era Length -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Era Length:</p>
		<NumberOperator id="era-length" on:value={({ detail }) => (length = detail)} />
	</div>

	<!-- Dose Value -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Dose Value:</p>
		<NumberOperator id="dose-value" on:value={({ detail }) => (doseValue = detail)} />
	</div>
</div> 