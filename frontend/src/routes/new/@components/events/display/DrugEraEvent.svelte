<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
    import { convertOperator2Factor } from '../../utils';
	import { onMount } from 'svelte';
	
	let {eventdata} = $props();
	let firstExposure = $derived(convertOperator2Factor(eventdata.firstExposure));
	let startDate = $derived(convertOperator2Factor(eventdata.filters.startDate));
	let endDate = $derived(convertOperator2Factor(eventdata.filters.endDate));
	let eraStartAge = $derived(convertOperator2Factor(eventdata.filters.eraStartAge));
	let eraEndAge = $derived(convertOperator2Factor(eventdata.filters.eraEndAge));
	let gender = $derived(eventdata.filters.gender);
	let eraExposureCount = $derived(convertOperator2Factor(eventdata.filters.eraExposureCount));
	let eraLength = $derived(convertOperator2Factor(eventdata.filters.eraLength));
	let eventModifier = $derived(convertOperator2Factor(eventdata.filters.eventModifier));
</script>

<div class="flex w-full flex-col">
	<p>
		<button class="underline decoration-zinc-800 underline-offset-2"
			>기록 내 첫 약물 노출</button
		>
	</p>
	<div class="flex gap-2">
		<p>Era 시작일:</p>
		<DateOperator readonly={true} operator={startDate.operator} startDate={startDate.start} endDate={startDate.end} />
	</div>
	<div class="flex gap-2">
		<p>Era 종료일:</p>
		<DateOperator readonly={true} operator={endDate.operator} startDate={endDate.start} endDate={endDate.end} />
	</div>
	<div class="flex gap-2">
		<p>약물 노출 횟수:</p>
		<NumberOperator readonly={true} operator={eraExposureCount.operator} startNumber={eraExposureCount.start} endNumber={eraExposureCount.end} />
	</div>
	<div class="flex gap-2">
		<p>Era 기간:</p>
		<NumberOperator readonly={true} operator={eraLength.operator} startNumber={eraLength.start} endNumber={eraLength.end} />
	</div>
	<div class="flex gap-2">
		<p>Era 시작 당시 나이:</p>
		<NumberOperator readonly={true} operator={eraStartAge.operator} startNumber={eraStartAge.start} endNumber={eraStartAge.end} />
	</div>
	<div class="flex gap-2">
		<p>Era 종료 시 나이:</p>
		<NumberOperator readonly={true} operator={eraEndAge.operator} startNumber={eraEndAge.start} endNumber={eraEndAge.end} />
	</div>
	<div class="flex gap-2">
		<p>성별:</p>
		<button class="underline decoration-zinc-800 underline-offset-2">{gender}</button>
	</div>
	{#if eventModifier && (eventModifier.operator || eventModifier.start || eventModifier.end)}
	<div class="flex gap-2">
		<p>이벤트 시작/종료 수정:</p>
		<DateOperator readonly={true} operator={eventModifier.operator} startDate={eventModifier.start} endDate={eventModifier.end} />
	</div>
	{/if}
</div>
