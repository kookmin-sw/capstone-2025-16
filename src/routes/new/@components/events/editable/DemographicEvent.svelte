<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	// 필터 상태 변수들
	let age = $state({});
	let gender = $state({});
	let startDate = $state({});
	let endDate = $state({});
	let raceType = $state({});
	let ethnicityType = $state({});

	// 툴팁 표시 상태
	let showTooltip = $state({});

	// 툴팁 표시/숨김 함수
	function toggleTooltip(key) {
		showTooltip[key] = !showTooltip[key];
	}

	$effect(() => {
		dispatch('add', {
			type: 'demographic',
			filters: {
				age,
				gender,
				startDate,
				endDate,
				raceType,
				ethnicityType
			}
		});
	});
</script>

<div class="flex flex-col w-full gap-y-8">
	<!-- Age -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Age:</p>
		<NumberOperator id="age" on:value={({ detail }) => (age = detail)} />
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
		<p>Start date:</p>
		<DateOperator id="start-date" on:value={({ detail }) => (startDate = detail)} />
	</div>

	<!-- End Date -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>End date:</p>
		<DateOperator id="end-date" on:value={({ detail }) => (endDate = detail)} />
	</div>

	<!-- Race Type -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Race Type:</p>
		<NumberOperator id="race-type" on:value={({ detail }) => (raceType = detail)} />
	</div>

	<!-- Ethnicity Type -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Ethnicity Type:</p>
		<NumberOperator id="ethnicity-type" on:value={({ detail }) => (ethnicityType = detail)} />
	</div>
</div> 