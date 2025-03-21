<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	$effect(() => {
		dispatch('add', {
			type: 'death',
			filters: {
				age: age,
				gender: gender,
				date: date,
				deathType: deathType,
				cause: cause
			}
		});
	});

	let age = $state({});
	let gender = $state("");
	let date = $state({});
	let deathType = $state({});
	let cause = $state({});
</script>

<div class="flex w-full flex-col gap-y-4">
	<div class="flex w-full flex-col gap-y-2">
		<p>사망 날짜</p>
		<DateOperator id="death-date" on:value={({ detail }) => (date = detail)} />
	</div>
	<div class="flex w-full flex-col gap-y-2">
		<p>사망 시 나이</p>
		<NumberOperator id="death-age" on:value={({ detail }) => (age = detail)} />
	</div>
	<div class="flex w-full flex-col gap-y-2">
		<p>성별</p>
		<button class="w-full text-left"
			>성별 선택 <span class="rounded-full bg-blue-200 px-2 py-1 text-xs text-blue-500">change</span
			></button
		>
	</div>
	<div class="flex w-full flex-col gap-y-2">
		<p>사망 유형</p>
		<NumberOperator id="death-type" on:value={({ detail }) => (deathType = detail)} />
	</div>
	<div class="flex w-full flex-col gap-y-2">
		<p>사망 원인</p>
		<NumberOperator id="death-cause" on:value={({ detail }) => (cause = detail)} />
	</div>
</div>

