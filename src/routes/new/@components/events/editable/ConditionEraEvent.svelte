<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	$effect(() => {
		dispatch('add', {
			type: 'condition_era',
			filters: {
				firstDiagnosis: firstDiagnosis,
				startDate: startDate,
				endDate: endDate,
				eraStartAge: eraStartAge,
				eraEndAge: eraEndAge,
				eraConditionCount: eraConditionCount,
				eraLength: eraLength
			}
		});
	});

	let firstDiagnosis = $state(false);
	let startDate = $state({});
	let endDate = $state({});
	let eraStartAge = $state({});
	let eraEndAge = $state({});
	let eraConditionCount = $state({});
	let eraLength = $state({});
</script>

<div class="flex w-full flex-col gap-y-4">
	<div class="flex w-full flex-col gap-y-2">
		<span class=" text-left">The first occurrence of the patient's hospital record</span>
		{#if firstDiagnosis}
			<button on:click={() => (firstDiagnosis = false)} class="rounded-full bg-blue-200 px-2 py-1 text-xs text-blue-500 w-fit"> Enabled </button>
		{:else}
			<button on:click={() => (firstDiagnosis = true)} class="rounded-full bg-pink-200 px-2 py-1 text-xs text-pink-500 w-fit"> Disabled </button>
		{/if}
	</div>
	<div class="flex w-full flex-col gap-y-2">
		<p>Era start date</p>
		<DateOperator id="start-date" on:value={({ detail }) => (startDate = detail)} />
	</div>
	<div class="flex w-full flex-col gap-y-2">
		<p>Era end date</p>
		<DateOperator id="end-date" on:value={({ detail }) => (endDate = detail)} />
	</div>
	<div class="flex w-full flex-col gap-y-2">
		<p>Occurrence count</p>
		<NumberOperator id="occurrence-count" on:value={({ detail }) => (eraConditionCount = detail)} />
	</div>
	<div class="flex w-full flex-col gap-y-2">
		<p>Era length</p>
		<NumberOperator id="era-length" on:value={({ detail }) => (eraLength = detail)} />
	</div>
	<div class="flex w-full flex-col gap-y-2">
		<p>Era start age</p>
		<NumberOperator id="era-start-age" on:value={({ detail }) => (eraStartAge = detail)} />
	</div>
	<div class="flex w-full flex-col gap-y-2">
		<p>Era end age</p>
		<NumberOperator id="era-end-age" on:value={({ detail }) => (eraEndAge = detail)} />
	</div>
	<div class="flex w-full flex-col gap-y-2">
		<p>Gender</p>
		<button class="w-full text-left"
			>Male 	<span class="rounded-full bg-blue-200 px-2 py-1 text-xs text-blue-500">change</span
			></button
		>
	</div>
</div>
