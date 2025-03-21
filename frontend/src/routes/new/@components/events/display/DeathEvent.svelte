<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
    import { convertOperator2Factor } from '../../utils';
	import { onMount } from 'svelte';
	
	let {eventdata} = $props();
	let age = $derived(convertOperator2Factor(eventdata.filters.age));
	let gender = $derived(eventdata.filters.gender);
	let date = $derived(convertOperator2Factor(eventdata.filters.date));
	let deathType = $derived(convertOperator2Factor(eventdata.filters.deathType));
	let cause = $derived(convertOperator2Factor(eventdata.filters.cause));
</script>

<div class="flex w-full flex-col">
	<div class="flex gap-2">
		<p>사망 날짜:</p>
		<DateOperator readonly={true} operator={date.operator} startDate={date.start} endDate={date.end} />
	</div>
	<div class="flex gap-2">
		<p>사망 시 나이:</p>
		<NumberOperator readonly={true} operator={age.operator} startNumber={age.start} endNumber={age.end} />
	</div>
	<div class="flex gap-2">
		<p>성별:</p>
		<button class="underline decoration-zinc-800 underline-offset-2">{gender}</button>
	</div>
	<div class="flex gap-2">
		<p>사망 유형:</p>
		<NumberOperator readonly={true} operator={deathType.operator} startNumber={deathType.start} endNumber={deathType.end} />
	</div>
	<div class="flex gap-2">
		<p>사망 원인:</p>
		<NumberOperator readonly={true} operator={cause.operator} startNumber={cause.start} endNumber={cause.end} />
	</div>
</div>