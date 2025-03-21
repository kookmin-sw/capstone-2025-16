<script>
	import DateOperator from '../operators/DateOperator.svelte';
	import NumberOperator from '../operators/NumberOperator.svelte';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

	$effect(() => {
            dispatch('add', {
                type: "drug_era",
                filters: {
                    firstExposure: firstExposure,
                    startDate: startDate,
                    endDate: endDate,
                    eraStartAge: eraStartAge,
                    eraEndAge: eraEndAge,
                    gender: gender,
                    eraExposureCount: eraExposureCount,
                    eraLength: eraLength,
                    eventModifier: eventModifier,
                },
            });
	})

	let firstExposure = $state(false);
	let startDate = $state({});
	let endDate = $state({});
	let eraStartAge = $state({});
	let eraEndAge = $state({});
	let gender = $state("");
	let eraExposureCount = $state({});
	let eraLength = $state({});
	let eventModifier = $state({});
</script>

<div class="flex flex-col w-full gap-y-8">
	<p>
		<button class="underline decoration-zinc-800 underline-offset-2"
			>기록 내 첫 약물 노출</button
		>
	</p>
	<div class="flex flex-col gap-y-2 w-full">
		<p>Era 시작일:</p>
		<DateOperator id="start-date" on:value={({ detail }) => (startDate = detail)} />
	</div>
	<div class="flex flex-col gap-y-2 w-full">
		<p>Era 종료일:</p>
		<DateOperator id="end-date" on:value={({ detail }) => (endDate = detail)} />
	</div>
	<div class="flex flex-col gap-y-2 w-full">
		<p>약물 노출 횟수:</p>
		<NumberOperator id="exposure-count" on:value={({ detail }) => (eraExposureCount = detail)} />
	</div>
	<div class="flex flex-col gap-y-2 w-full">
		<p>Era 기간:</p>
		<NumberOperator id="era-length" on:value={({ detail }) => (eraLength = detail)} />
	</div>
	<div class="flex flex-col gap-y-2 w-full">
		<p>Era 시작 당시 나이:</p>
		<NumberOperator id="era-start-age" on:value={({ detail }) => (eraStartAge = detail)} />
	</div>
	<div class="flex flex-col gap-y-2 w-full">
		<p>Era 종료 시 나이:</p>
		<NumberOperator id="era-end-age" on:value={({ detail }) => (eraEndAge = detail)} />
	</div>
	<div class="flex flex-col gap-y-2 w-full">
		<p>성별:</p>
		<button class="underline decoration-zinc-800 underline-offset-2 w-full">성별 선택</button>
	</div>
	<!-- 
    이거 뭐지?
    <div class="flex flex-col gap-y-2 w-full">
		<p>이벤트 시작/종료 수정:</p>
		<DateOperator id="event-modifier" on:value={({ detail }) => (eventModifier = detail)} />
	</div> -->
</div>
