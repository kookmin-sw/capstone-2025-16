<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
    import { convertOperator2Factor } from '../../utils';
	import { onMount } from 'svelte';
	let {eventdata} = $props();
	onMount(() => {
		console.log(eventdata);
	});
	let firstDiagnosis = convertOperator2Factor(eventdata.firstDiagnosis);
	let startDate = convertOperator2Factor(eventdata.filters.startDate);
	let endDate = convertOperator2Factor(eventdata.filters.endDate);
	let eraStartAge = convertOperator2Factor(eventdata.filters.eraStartAge);
	let eraEndAge = convertOperator2Factor(eventdata.filters.eraEndAge);
	let eraConditionCount = convertOperator2Factor(eventdata.filters.eraConditionCount);
	let eraLength = convertOperator2Factor(eventdata.filters.eraLength);
	console.log(eventdata);
</script>

<div class="flex w-full flex-col">
	<p>
		<button class="underline decoration-zinc-800 underline-offset-2"
			>환자의 병원 기록상 가장 처음으로</button
		>
	</p>
	<div class="flex gap-2">
		<p>기간 시작:</p>
		<DateOperator readonly={true} operator={startDate.operator} startDate={startDate.start} endDate={startDate.end} />
	</div>
	<div class="flex gap-2">
		<p>기간 종료:</p>
		<DateOperator readonly={true} operator={endDate.operator} startDate={endDate.start} endDate={endDate.end} />
	</div>
	<div class="flex gap-2">
		<p>발생(occurrence) 횟수:</p>
		<NumberOperator readonly={true} operator={eraConditionCount.operator} startNumber={eraConditionCount.start} endNumber={eraConditionCount.end} />
	</div>
	<div class="flex gap-2">
		<p>기간(era length):</p>
			<NumberOperator readonly={true} operator={eraLength.operator} startNumber={eraLength.start} endNumber={eraLength.end} />
	</div>
	<div class="flex gap-2">
		<p>기간(era)의 시작시 나이:</p>
			<NumberOperator readonly={true} operator={eraStartAge.operator} startNumber={eraStartAge.start} endNumber={eraStartAge.end} />
	</div>
	<div class="flex gap-2">
		<p>기간(era)이 종료시 나이:</p>
		<NumberOperator readonly={true} operator={eraEndAge.operator} startNumber={eraEndAge.start} endNumber={eraEndAge.end} />
	</div>
	<div class="flex gap-2">
		<p>성별:</p>
		<button class="underline decoration-zinc-800 underline-offset-2">남성</button>
	</div>
</div>
