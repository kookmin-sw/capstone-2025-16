<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// 필터 상태 변수들
	let first = $state(false);
	let startAge = $state({});
	let endAge = $state({});
	let startDate = $state({});
	let endDate = $state({});
	let length = $state({});

	// 툴팁 표시 상태
	let showTooltip = $state({});

	// 툴팁 표시/숨김 함수
	function toggleTooltip(key) {
		showTooltip[key] = !showTooltip[key];
	}

	$effect(() => {
		dispatch('add', {
			type: 'observation_period',
			filters: {
				first,
				startAge,
				endAge,
				startDate,
				endDate,
				length
			}
		});
	});
</script>

<div class="flex flex-col w-full gap-y-8">
	<!-- First Observation Period -->
	<div class="flex flex-col gap-y-2 w-full">
		<span class="text-left">First observation period of the patient</span>
		{#if first}
			<button on:click={() => (first = false)} class="rounded-full bg-blue-200 px-2 py-1 text-xs text-blue-500 w-fit"> Enabled </button>
		{:else}
			<button on:click={() => (first = true)} class="rounded-full bg-pink-200 px-2 py-1 text-xs text-pink-500 w-fit"> Disabled </button>
		{/if}
	</div>

	<!-- Start Age -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Age at period start:</p>
		<NumberOperator id="start-age" on:value={({ detail }) => (startAge = detail)} />
	</div>

	<!-- End Age -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Age at period end:</p>
		<NumberOperator id="end-age" on:value={({ detail }) => (endAge = detail)} />
	</div>

	<!-- Start Date -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Period start date:</p>
		<DateOperator id="start-date" on:value={({ detail }) => (startDate = detail)} />
	</div>

	<!-- End Date -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Period end date:</p>
		<DateOperator id="end-date" on:value={({ detail }) => (endDate = detail)} />
	</div>

	<!-- Period Length -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Period Length (days):</p>
		<NumberOperator id="period-length" on:value={({ detail }) => (length = detail)} />
	</div>
</div> 