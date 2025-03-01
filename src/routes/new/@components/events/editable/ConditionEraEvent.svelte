<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

	$effect(() => {
            dispatch('add', {
                type: "condition_era",
                filters: {
                    firstDiagnosis: firstDiagnosis,
                    startDate: startDate,
                    endDate: endDate,
                    eraStartAge: eraStartAge,
                    eraEndAge: eraEndAge,
                    eraConditionCount: eraConditionCount,
                    eraLength: eraLength,
                },
            });
	})

	let firstDiagnosis = $state(false);
	let startDate = $state({});
	let endDate = $state({});
	let eraStartAge = $state({});
	let eraEndAge = $state({});
	let eraConditionCount = $state({});
	let eraLength = $state({});
</script>

<div class="flex flex-col w-full gap-y-8">
	<p>
		<button class="underline decoration-zinc-800 underline-offset-2"
			>환자의 병원 기록상 가장 처음으로</button
		>
	</p>
	<div class="flex flex-col gap-y-2 w-full">
		<p>기간 시작:</p>
		<DateOperator id="start-date" on:value={({ detail }) => (startDate = detail)} />
	</div>
	<div class="flex flex-col gap-y-2 w-full">
		<p>기간 종료:</p>
		<DateOperator id="end-date" on:value={({ detail }) => (endDate = detail)} />
	</div>
	<div class="flex flex-col gap-y-2 w-full">
		<p>발생(occurrence) 횟수:</p>
		<NumberOperator id="occurrence-count" on:value={({ detail }) => (eraConditionCount = detail)} />
	</div>
	<div class="flex flex-col gap-y-2 w-full">
		<p>기간(era length):</p>
		<NumberOperator id="era-length" on:value={({ detail }) => (eraLength = detail)} />
	</div>
	<div class="flex flex-col gap-y-2 w-full">
		<p>기간(era)의 시작시 나이:</p>
		<NumberOperator id="era-start-age" on:value={({ detail }) => (eraStartAge = detail)} />
	</div>
	<div class="flex flex-col gap-y-2 w-full">
		<p>기간(era)이 종료시 나이:</p>
		<NumberOperator id="era-end-age" on:value={({ detail }) => (eraEndAge = detail)} />
	</div>
	<div class="flex flex-col gap-y-2 w-full">
		<p>성별:</p>
		<button class="underline decoration-zinc-800 underline-offset-2 w-full">남성</button>
	</div>
</div>
