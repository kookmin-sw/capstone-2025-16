<script>
	import '../../app.css';
	import { page } from '$app/state';

	let pathname = $state(page.url.pathname);

	const events = [
		'Condition Era',
		'Condition Occurrence',
		'Death',
		'Device Exposure',
		'Dose Era',
		'Drug Era',
		'Drug Exposure',
		'Measurement',
		'Observation',
		'Observation Period',
		'Payer Plan Period',
		'Procedure Occurrence',
		'Specimen',
		'Visit',
		'Visit detail',
		'From Reusable'
	];

	const descriptions = {
		'Condition Era': '특정 진단 기간을 가진 환자를 찾습니다.',
		'Condition Occurrence': '특정 진단을 가진 환자를 찾습니다.',
		Death: 'Death를 기반으로 환자를 찾습니다.',
		'Device Exposure': 'Device exposure에 따라 환자를 찾습니다.',
		'Dose Era': 'Dose Era에 따라 환자를 찾습니다.',
		'Drug Era': '시간이 지남에 따라 약물에 노출된 환자를 찾습니다.',
		'Drug Exposure': '특정 Drug나 약 종류에 노출된 환자를 찾습니다.',
		Measurement: 'Measurement을 기반으로 환자를 찾습니다.',
		Observation: 'Lab tests 또는 다른 observation을 기반으로 환자를 찾습니다.',
		'Observation Period': 'Observation Period를 기반으로 환자를 찾습니다.',
		'Payer Plan Period': 'Payer Plan Period에 따라 환자를 찾습니다.',
		'Procedure Occurrence': '특정 procedure를 경험한 환자를 찾습니다.',
		Specimen: 'Specimen을 기반으로 환자를 찾습니다.',
		Visit: 'Visit 정보를 기반으로 환자를 찾습니다.',
		'Visit detail': 'Find patients based on visit detail information.',
		'From Reusable': 'Add criteria from list of reusables'
	};

	const added_events = $state([]);
	let expandedEvent = $state(null);
</script>

<header class="fixed left-0 top-0 z-10 flex h-10 w-full border-b border-zinc-200 bg-zinc-100">
	<p
		class="flex w-[200px] items-center justify-center border-r border-zinc-200 text-center text-lg font-bold text-zinc-800"
	>
		Bento
	</p>
	<div class="flex items-center gap-4 pl-4 text-sm">
		<a
			href="/cohort"
			class="w-fit text-center {pathname === '/cohort'
				? 'font-semibold text-zinc-800'
				: 'text-zinc-700'}">코호트 정의</a
		>
		<a
			href="/inference"
			class="w-fit text-center {pathname === '/inference'
				? 'font-semibold text-zinc-800'
				: 'text-zinc-700'}">모델 인퍼런스</a
		>
	</div>
</header>
<div
	class="fixed left-0 top-10 flex h-full w-[200px] flex-col overflow-y-scroll border-r border-zinc-200"
>
	<div class=" flex w-full flex-col border-b border-zinc-200 px-2 py-2">
		<p class="mb-4 text-sm font-bold">코호트 진입</p>
		<p class="mb-4 ml-2 text-xs leading-4">
			- 진단발생: OMOPUveitis<br />
			o 환자의 병원 기록상 처음<br />
			o 관찰기록<br /> <span class="ml-2 text-xs"> 2022-01-01 ~ 2022-12-31</span><br />
			o 약물 기간<br /> <span class="ml-2 text-xs"> 2022-01-01 ~ 2022-12-31</span><br />
			- Toggle 사용<br />
			- 관찰기록<br /><span class="ml-2 text-xs"> 2022-01-01 ~ 2022-12-31</span>
		</p>
	</div>
	<div class=" flex w-full flex-col border-b border-zinc-200 px-2 py-2">
		<p class="mb-4 text-sm font-bold">포함 기준</p>
		<p class="mb-4 ml-2 text-xs leading-4">
			- 진단발생: OMOPUveitis<br />
			- 관찰기록<br /> <span class="ml-2 text-xs"> 2022-01-01 ~ 2022-12-31</span><br />
			- 약물 기간<br /> <span class="ml-2 text-xs"> 2022-01-01 ~ 2022-12-31</span><br />
		</p>
	</div>
	<div class=" flex w-full flex-col border-b border-zinc-200 px-2 py-2">
		<p class="mb-4 text-sm font-bold">코호트 종료 기준</p>
		<p class="mb-4 ml-2 text-xs leading-4">
			- 진단발생: OMOPUveitis<br />
			- 관찰기록<br /> <span class="ml-2 text-xs"> 2022-01-01 ~ 2022-12-31</span><br />
			- 약물 기간<br /> <span class="ml-2 text-xs"> 2022-01-01 ~ 2022-12-31</span><br />
		</p>
	</div>
</div>
<div class="fixed left-[200px] top-10 h-[calc(100vh-30px)] w-[calc(100vw-200px)]">
	<div class="flex h-full w-full">
		<div class="flex w-full flex-col overflow-y-scroll p-8 text-lg">
			<p class="mb-4 text-2xl font-bold">코호트 진입</p>
			<p class="mb-4 ml-2">- 진단발생: OMOPUveitis</p>
			<p class="mb-4 ml-2">
				{#each added_events as event}
					<p>{event}</p>
					<div class="flex flex-col gap-1 text-lg text-zinc-700 *:before:content-['-']">
						<p>날짜 조정: 시작일 2023-01-01 + 30일, 종료일 2023-12-31 + 60일</p>
						<p>환자의 병원 기록상 가장 처음으로</p>
						<p>기간 시작: 2023-06-15</p>
						<p>기간 종료: 2023-12-31</p>
						<p>발생(occurrence) 횟수: 5</p>
						<p>기간(era length): 90일</p>
						<p>기간(era)의 시작시 나이: 35</p>
						<p>기간(era)이 종료시 나이: 45</p>
						<p>성별: 남성</p>
					</div>
				{/each}
			</p>
		</div>
		<div
			class="flex h-full w-[700px] flex-col items-center overflow-y-scroll border-l border-zinc-200 py-3"
		>
			{#if expandedEvent === null}
				<p class="text-lg font-bold">진입 이벤트 목록</p>
				<p class="mb-3 text-sm text-zinc-700">추가할 이벤트를 클릭하여 주세요.</p>
				<div class="flex w-full flex-col gap-4 p-4">
					{#each events as event}
						<button
							on:click={() => (expandedEvent = expandedEvent === event ? null : event)}
							class="flex w-full flex-col justify-between rounded-md border border-zinc-200 p-2 text-left text-sm text-zinc-700 shadow-sm transition-all duration-300 ease-in-out hover:bg-zinc-100"
						>
							<div class="flex w-full justify-between">
								<p class="text-sm text-zinc-700">+ {event} Event</p>
								<p class="groups relative text-xs font-bold text-zinc-500">
									<span
										class="absolute bottom-full left-1/2 hidden -translate-x-full whitespace-nowrap rounded bg-zinc-400 bg-opacity-20 px-2 py-1 text-xs font-normal text-zinc-800 backdrop-blur-sm group-hover:block"
										>{descriptions[event]}</span
									>
									?
								</p>
							</div>
						</button>
					{/each}
				</div>
			{:else}
				<div class="flex w-full items-center justify-between px-2 text-lg font-bold text-zinc-800">
					<button
						on:click={() => {
							expandedEvent = null;
						}}
						class="text-xl text-zinc-500 hover:text-zinc-700"
					>
						←
					</button>
					<p class="text-2xl font-bold">{expandedEvent} Event 추가</p>
					<div />
				</div>

				<div class="text-normal mt-2 text-zinc-700" on:click={(e) => e.stopPropagation()}>
					<p>with continuous observation of at least</p>
					<input type="number" class="w-16 rounded-md border border-zinc-200 px-2 text-sm" />
					<p>days before and</p>
					<input type="number" class="w-16 rounded-md border border-zinc-200 px-2 text-sm" />
					<p>days after event index date Limit initial events to:</p>
					<select class=" rounded-md border border-zinc-200 px-2 text-sm">
						<option value="earliest">all event</option>
						<option value="earliest">earliest event</option>
						<option value="latest">latest event</option>
					</select>
					<p>per person.</p>

					<p class="mt-4 text-lg font-bold">Addtional attributes</p>
					<div class="flex flex-col gap-4 text-sm">
						<div class="flex items-center gap-2">
							<button class="text-zinc-500 hover:text-zinc-700"> - </button>
							<div class="flex items-center gap-2">
								<span>날짜 조정:</span>
								<div class="flex items-center gap-2">
									<span>시작:</span>
									<select class="rounded-md border border-zinc-200 px-2 text-sm">
										<option value="START_DATE">시작일</option>
										<option value="END_DATE">종료일</option>
									</select>
									<span>+</span>
									<input
										type="number"
										class="w-16 rounded-md border border-zinc-200 px-2 text-sm"
									/>
									<span>일</span>
								</div>
								<div class="flex items-center gap-2">
									<span>종료:</span>
									<select class="rounded-md border border-zinc-200 px-2 text-sm">
										<option value="START_DATE">시작일</option>
										<option value="END_DATE">종료일</option>
									</select>
									<span>+</span>
									<input
										type="number"
										class="w-16 rounded-md border border-zinc-200 px-2 text-sm"
									/>
									<span>일</span>
								</div>
							</div>
						</div>

						<div class="flex items-center gap-2">
							<button class="text-zinc-500 hover:text-zinc-700"> - </button>
							<span>환자의 병원 기록상 가장 처음으로</span>
						</div>

						<div class="flex items-center gap-2">
							<button class="text-zinc-500 hover:text-zinc-700"> - </button>
							<div class="flex items-center gap-2">
								<span>기간 시작:</span>
								<select class="rounded-md border border-zinc-200 px-2 text-sm">
									<option value="lt">전에</option>
									<option value="lte">이전에</option>
									<option value="eq">~에</option>
									<option value="gt">다음</option>
									<option value="gte">이후</option>
									<option value="bt">사이에</option>
									<option value="!bt">사이에 없는</option>
								</select>
								<input type="date" class="rounded-md border border-zinc-200 px-2 text-sm" />
							</div>
						</div>

						<div class="flex items-center gap-2">
							<button class="text-zinc-500 hover:text-zinc-700"> - </button>
							<div class="flex items-center gap-2">
								<span>기간 종료:</span>
								<select class="rounded-md border border-zinc-200 px-2 text-sm">
									<option value="lt">전에</option>
									<option value="lte">이전에</option>
									<option value="eq">~에</option>
									<option value="gt">다음</option>
									<option value="gte">이후</option>
									<option value="bt">사이에</option>
									<option value="!bt">사이에 없는</option>
								</select>
								<input type="date" class="rounded-md border border-zinc-200 px-2 text-sm" />
							</div>
						</div>

						<div class="flex items-center gap-2">
							<button class="text-zinc-500 hover:text-zinc-700"> - </button>
							<div class="flex items-center gap-2">
								<span>발생(occurrence) 횟수</span>
								<select class="rounded-md border border-zinc-200 px-2 text-sm">
									<option value="lt">더 작은</option>
									<option value="lte">작거나 같음</option>
									<option value="eq">같음</option>
									<option value="gt">더 큰</option>
									<option value="gte">크거나 같음</option>
									<option value="bt">사이에</option>
									<option value="!bt">사이에 없는</option>
								</select>
								<input type="number" class="w-16 rounded-md border border-zinc-200 px-2 text-sm" />
							</div>
						</div>

						<div class="flex items-center gap-2">
							<button class="text-zinc-500 hover:text-zinc-700"> - </button>
							<div class="flex items-center gap-2">
								<span>기간(era length)</span>
								<select class="rounded-md border border-zinc-200 px-2 text-sm">
									<option value="lt">더 작은</option>
									<option value="lte">작거나 같음</option>
									<option value="eq">같음</option>
									<option value="gt">더 큰</option>
									<option value="gte">크거나 같음</option>
									<option value="bt">사이에</option>
									<option value="!bt">사이에 없는</option>
								</select>
								<input type="number" class="w-16 rounded-md border border-zinc-200 px-2 text-sm" />
								<span>일</span>
							</div>
						</div>

						<div class="flex items-center gap-2">
							<button class="text-zinc-500 hover:text-zinc-700"> - </button>
							<div class="flex items-center gap-2">
								<span>기간(era)의 시작시 나이</span>
								<select class="rounded-md border border-zinc-200 px-2 text-sm">
									<option value="lt">더 작은</option>
									<option value="lte">작거나 같음</option>
									<option value="eq">같음</option>
									<option value="gt">더 큰</option>
									<option value="gte">크거나 같음</option>
									<option value="bt">사이에</option>
									<option value="!bt">사이에 없는</option>
								</select>
								<input type="number" class="w-16 rounded-md border border-zinc-200 px-2 text-sm" />
							</div>
						</div>

						<div class="flex items-center gap-2">
							<button class="text-zinc-500 hover:text-zinc-700"> - </button>
							<div class="flex items-center gap-2">
								<span>기간(era)이 종료시 나이</span>
								<select class="rounded-md border border-zinc-200 px-2 text-sm">
									<option value="lt">더 작은</option>
									<option value="lte">작거나 같음</option>
									<option value="eq">같음</option>
									<option value="gt">더 큰</option>
									<option value="gte">크거나 같음</option>
									<option value="bt">사이에</option>
									<option value="!bt">사이에 없는</option>
								</select>
								<input type="number" class="w-16 rounded-md border border-zinc-200 px-2 text-sm" />
							</div>
						</div>

						<div class="flex items-center gap-2">
							<button class="text-zinc-500 hover:text-zinc-700"> - </button>
							<div class="flex items-center gap-2">
								<span>성별:</span>
								<button class="rounded-md border border-zinc-200 px-2 py-1 text-sm">추가</button>
								<button class="rounded-md border border-zinc-200 px-2 py-1 text-sm">불러오기</button
								>
							</div>
						</div>
					</div>
					<div class="flex w-full justify-center">
						<button
							on:click={() => {
								added_events.push(expandedEvent);
								expandedEvent = null;
							}}
							class="mt-4 rounded-md border border-zinc-200 px-4 py-2 text-sm text-zinc-700"
						>
							추가
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
