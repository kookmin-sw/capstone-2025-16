<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
    import { convertOperator2Factor } from '../../utils';
	import { onMount } from 'svelte';
	
	let {eventdata} = $props();
	let first = $derived(eventdata.filters.first);
	let age = $derived(convertOperator2Factor(eventdata.filters.age));
	let gender = $derived(eventdata.filters.gender);
	let conditionStatus = $derived(convertOperator2Factor(eventdata.filters.conditionStatus));
	let startDate = $derived(convertOperator2Factor(eventdata.filters.startDate));
	let endDate = $derived(convertOperator2Factor(eventdata.filters.endDate));
	let conditionType = $derived(convertOperator2Factor(eventdata.filters.conditionType));
	let visitType = $derived(convertOperator2Factor(eventdata.filters.visitType));
	let source = $derived(convertOperator2Factor(eventdata.filters.source));
	let providerSpecialty = $derived(convertOperator2Factor(eventdata.filters.providerSpecialty));
</script>

<div class="flex w-full flex-col">
	{#if first}
	<p>
		<button class="underline decoration-zinc-800 underline-offset-2"
			>환자의 첫 번째 진단 기록</button
		>
	</p>
	{/if}
	<div class="flex gap-2">
		<p>진단 시작일:</p>
		<DateOperator readonly={true} operator={startDate.operator} startDate={startDate.start} endDate={startDate.end} />
	</div>
	<div class="flex gap-2">
		<p>진단 종료일:</p>
		<DateOperator readonly={true} operator={endDate.operator} startDate={endDate.start} endDate={endDate.end} />
	</div>
	<div class="flex gap-2">
		<p>진단 시 나이:</p>
		<NumberOperator readonly={true} operator={age.operator} startNumber={age.start} endNumber={age.end} />
	</div>
	<div class="flex gap-2">
		<p>성별:</p>
		<button class="underline decoration-zinc-800 underline-offset-2">{gender}</button>
	</div>
	<div class="flex gap-2">
		<p>진단 상태:</p>
		<NumberOperator readonly={true} operator={conditionStatus.operator} startNumber={conditionStatus.start} endNumber={conditionStatus.end} />
	</div>
	<div class="flex gap-2">
		<p>진단 유형:</p>
		<NumberOperator readonly={true} operator={conditionType.operator} startNumber={conditionType.start} endNumber={conditionType.end} />
	</div>
	<div class="flex gap-2">
		<p>방문 유형:</p>
		<NumberOperator readonly={true} operator={visitType.operator} startNumber={visitType.start} endNumber={visitType.end} />
	</div>
	<div class="flex gap-2">
		<p>정보 출처:</p>
		<NumberOperator readonly={true} operator={source.operator} startNumber={source.start} endNumber={source.end} />
	</div>
	<div class="flex gap-2">
		<p>제공자 전문 분야:</p>
		<NumberOperator readonly={true} operator={providerSpecialty.operator} startNumber={providerSpecialty.start} endNumber={providerSpecialty.end} />
	</div>
</div> 