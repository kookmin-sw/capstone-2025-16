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
	let specimenType = $state({});
	let quantity = $state({});
	let unitType = $state({});
	let anatomicSiteType = $state({});
	let diseaseStatus = $state({});

	// 툴팁 표시 상태
	let showTooltip = $state({});

	// 툴팁 표시/숨김 함수
	function toggleTooltip(key) {
		showTooltip[key] = !showTooltip[key];
	}

	$effect(() => {
		dispatch('add', {
			type: 'specimen',
			filters: {
				first,
				age,
				gender,
				date,
				specimenType,
				quantity,
				unitType,
				anatomicSiteType,
				diseaseStatus
			}
		});
	});
</script>

<div class="flex flex-col w-full gap-y-8">
	<!-- First Specimen -->
	<div class="flex flex-col gap-y-2 w-full">
		<span class="text-left">First specimen record of the patient</span>
		{#if first}
			<button on:click={() => (first = false)} class="rounded-full bg-blue-200 px-2 py-1 text-xs text-blue-500 w-fit"> Enabled </button>
		{:else}
			<button on:click={() => (first = true)} class="rounded-full bg-pink-200 px-2 py-1 text-xs text-pink-500 w-fit"> Disabled </button>
		{/if}
	</div>

	<!-- Age at Collection -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Age at specimen collection:</p>
		<NumberOperator id="age-at-collection" on:value={({ detail }) => (age = detail)} />
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

	<!-- Collection Date -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Collection date:</p>
		<DateOperator id="collection-date" on:value={({ detail }) => (date = detail)} />
	</div>

	<!-- Specimen Type -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Specimen Type:</p>
		<NumberOperator id="specimen-type" on:value={({ detail }) => (specimenType = detail)} />
	</div>

	<!-- Quantity -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Quantity:</p>
		<NumberOperator id="quantity" on:value={({ detail }) => (quantity = detail)} />
	</div>

	<!-- Unit Type -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Unit Type:</p>
		<NumberOperator id="unit-type" on:value={({ detail }) => (unitType = detail)} />
	</div>

	<!-- Anatomic Site Type -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Anatomic Site Type:</p>
		<NumberOperator id="anatomic-site-type" on:value={({ detail }) => (anatomicSiteType = detail)} />
	</div>

	<!-- Disease Status -->
	<div class="flex flex-col gap-y-2 w-full">
		<p>Disease Status:</p>
		<NumberOperator id="disease-status" on:value={({ detail }) => (diseaseStatus = detail)} />
	</div>
</div> 