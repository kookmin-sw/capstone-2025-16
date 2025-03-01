<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
    
	let {eventdata} = $props();
	let firstDiagnosis = $state(false);
	let startDate = $state(new Date());
	let endDate = $state(new Date());
	let eraStartAge = $state(0);
	let eraEndAge = $state(0);
	let eraConditionCount = $state(0);
	let eraLength = $state(0);
</script>

<div class="flex w-full">
	<p>
		<button class="underline decoration-zinc-800 underline-offset-2"
			>환자의 병원 기록상 가장 처음으로</button
		>
	</p>
	<div class="flex gap-2">
		<p>기간 시작:</p>
		<DateOperator id="start-date" readonly={true} operator="eq" startDate={startDate} endDate={endDate} />
	</div>
	<div class="flex gap-2">
		<p>기간 종료:</p>
		<DateOperator id="end-date" readonly={true} />
	</div>
	<div class="flex gap-2">
		<p>발생(occurrence) 횟수:</p>
		<NumberOperator id="occurrence-count" readonly={true} />
	</div>
	<div class="flex gap-2">
		<p>기간(era length):</p>
		<NumberOperator id="era-length" readonly={true} />
	</div>
	<div class="flex gap-2">
		<p>기간(era)의 시작시 나이:</p>
		<NumberOperator id="era-start-age" readonly={true} />
	</div>
	<div class="flex gap-2">
		<p>기간(era)이 종료시 나이:</p>
		<NumberOperator id="era-end-age" readonly={true} />
	</div>
	<div class="flex gap-2">
		<p>성별:</p>
		<button class="underline decoration-zinc-800 underline-offset-2">남성</button>
	</div>
</div>
