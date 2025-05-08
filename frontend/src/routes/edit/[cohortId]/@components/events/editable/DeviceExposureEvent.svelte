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
	let endDate = $state({});
	let deviceType = $state({});
	let visitType = $state({});
	let uniqueDeviceId = $state({ value: '' });
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
			type: 'device_exposure',
			filters: {
				first,
				age,
				gender,
				startDate,
				endDate,
				deviceType,
				visitType,
				uniqueDeviceId,
				quantity,
				source,
				providerSpecialty
			}
		});
	});
</script>

<div class="flex flex-col w-full gap-y-8">
	<!-- First Exposure -->
	<div class="flex flex-col gap-y-2 w-full">
		<span class="text-left">First device exposure record of the patient</span>
		{#if first}
			<button on:click={() => (first = false)} class="rounded-full bg-blue-200 px-2 py-1 text-xs text-blue-500 w-fit"> Enabled </button>
		{:else}
			<button on:click={() => (first = true)} class="rounded-full bg-pink-200 px-2 py-1 text-xs text-pink-500 w-fit"> Disabled </button>
		{/if}
	</div>

	<!-- Age at Exposure -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Age at exposure:</p>
		<NumberOperator id="age-at-exposure" on:value={({ detail }) => (age = detail)} />
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
		<p>Exposure start date:</p>
		<DateOperator id="start-date" on:value={({ detail }) => (startDate = detail)} />
	</div>

	<!-- End Date -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Exposure end date:</p>
		<DateOperator id="end-date" on:value={({ detail }) => (endDate = detail)} />
	</div>

	<!-- Device Type -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Device Type:</p>
		<NumberOperator id="device-type" on:value={({ detail }) => (deviceType = detail)} />
	</div>

	<!-- Visit Type -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Visit Type:</p>
		<NumberOperator id="visit-type" on:value={({ detail }) => (visitType = detail)} />
	</div>

	<!-- Unique Device ID -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Unique Device ID:</p>
		<input 
			type="text" 
			class="w-full p-2 border rounded"
			bind:value={uniqueDeviceId.value} 
			placeholder="Enter Unique Device ID"
		/>
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