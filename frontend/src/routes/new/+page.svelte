<!-- 
	TODO:
		토글 형식으로 이벤트 자세한 정보 접었다 펴기
		좌측 페이지에 바로가기 페이지 만들기

-->

<script>
	import '../../app.css';
	import { page } from '$app/state';

	import IntegrationEditor from './@components/events/editable/IntegrationEditor.svelte';
	import EventDisplayRouter from './@components/events/display/EventDisplayRouter.svelte';
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
		'Procedure Occurrence',
		'Specimen',
		'Visit Occurrence',
		'Demographic'
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
	let editedEvent = $state(null);

	let eventdata = $state({});

	let cohort = $state({
		entry: {
			and: []
		}
	});

	let mouseYCoordinate = $state(null); // pointer y coordinate within client

	let draggingItem = $state(null);
	let draggingItemId = $state(null);
	let draggingItemIndex = $state(null);

	let hoveredItemIndex = $state(null);

	// 자동 스크롤 관련 변수들
	let autoScrollInterval;
	const SCROLL_SPEED = 10; // 스크롤 속도 (px)
	const SCROLL_ZONE = 100; // 스크롤 시작되는 영역 크기 (px)

	let mouseDownTimer = $state(null);
	let longPressDelay = 200; // 0.2초

	// 자동 스크롤 함수
	function handleAutoScroll(mouseY) {
		// 이전 인터벌 제거
		if (autoScrollInterval) {
			clearInterval(autoScrollInterval);
		}

		const viewportHeight = window.innerHeight;
		const scrollContainer = document.querySelector('.main-container');

		// 상단 스크롤 영역
		if (mouseY < SCROLL_ZONE) {
			autoScrollInterval = setInterval(() => {
				scrollContainer.scrollBy(0, -SCROLL_SPEED);
			}, 16); // 약 60fps
		}
		// 하단 스크롤 영역
		else if (mouseY > viewportHeight - SCROLL_ZONE) {
			autoScrollInterval = setInterval(() => {
				scrollContainer.scrollBy(0, SCROLL_SPEED);
			}, 16);
		}
	}

	// 스크롤 정지 함수
	function stopAutoScroll() {
		if (autoScrollInterval) {
			clearInterval(autoScrollInterval);
			autoScrollInterval = null;
		}
	}

	// $effect(() => {
	// 	// prevents the ghost flickering at the top
	// 	if (mouseYCoordinate == null || mouseYCoordinate == 0) {
	// 		showGhost = false;
	// 	}
	// });

	$effect(() => {
		if (
			draggingItemIndex != null &&
			hoveredItemIndex != null &&
			draggingItemIndex != hoveredItemIndex
		) {
			// added_events 배열의 항목 순서 변경
			[added_events[draggingItemIndex], added_events[hoveredItemIndex]] = [
				added_events[hoveredItemIndex],
				added_events[draggingItemIndex]
			];

			// cohort.entry.and 배열의 항목도 같은 순서로 변경
			[cohort.entry.and[draggingItemIndex], cohort.entry.and[hoveredItemIndex]] = [
				cohort.entry.and[hoveredItemIndex],
				cohort.entry.and[draggingItemIndex]
			];

			console.log(cohort.entry.and);

			// balance
			draggingItemIndex = hoveredItemIndex;
		}
	});
</script>

<div
	class="fixed left-0 top-[70px] flex h-[calc(100vh-60px)] w-[200px] flex-col overflow-y-scroll border-r border-zinc-200"
>
	<div class=" flex w-full flex-col border-b border-zinc-200 px-2 py-2">
		<p class="mb-4 text-sm font-bold">cohort initial events</p>
		{#each cohort.entry.and as event}
			<p class=" mb-4 ml-2 rounded-md bg-blue-50 px-2 py-1 text-xs leading-4 text-blue-600">
				{event.type
					? event.type
							.replace('_', ' ')
							.split(' ')
							.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
							.join(' ') + ' Event'
					: ''}<br />
			</p>
		{/each}
		<p class=" mb-4 ml-2 rounded-md bg-blue-50 px-2 py-1 text-xs leading-4 text-blue-600">
			Condition Era Event
		</p>
		<p class=" mb-4 ml-2 rounded-md bg-blue-50 px-2 py-1 text-xs leading-4 text-blue-500">
			Occurrence Event
		</p>
	</div>
	<div class=" flex w-full flex-col border-b border-zinc-200 px-2 py-2">
		<p class="mb-4 text-sm font-bold">Inclusion Criteria</p>
		<p class="mb-4 ml-2 text-xs leading-4">
			- Diagnosis Occurrence: OMOPUveitis<br />
			- Observation Period<br /> <span class="ml-2 text-xs"> 2022-01-01 ~ 2022-12-31</span><br />
			- Drug Exposure<br /> <span class="ml-2 text-xs"> 2022-01-01 ~ 2022-12-31</span><br />
		</p>
	</div>
	<div class=" flex w-full flex-col border-b border-zinc-200 px-2 py-2">
		<p class="mb-4 text-sm font-bold">Exclusion Criteria</p>
		<p class="mb-4 ml-2 text-xs leading-4">
			- Diagnosis Occurrence: OMOPUveitis<br />
			- Observation Period<br /> <span class="ml-2 text-xs"> 2022-01-01 ~ 2022-12-31</span><br />
			- Drug Exposure<br /> <span class="ml-2 text-xs"> 2022-01-01 ~ 2022-12-31</span><br />
		</p>
	</div>
</div>

<svelte:window
	on:mousemove={(e) => {
		if (draggingItemId) {
			const eventsContainer = document.querySelector('.events-container');
			const containerRect = eventsContainer.getBoundingClientRect();
			const containerPadding = parseInt(window.getComputedStyle(eventsContainer).paddingTop);

			// events-container 영역 안에 있는지 확인 (패딩 포함)
			if (
				e.clientY >= containerRect.top + containerPadding &&
				e.clientY <= containerRect.bottom - containerPadding
			) {
				// padding 값을 포함하여 Y 좌표 계산
				mouseYCoordinate = e.target.offsetTop + e.offsetY;
				handleAutoScroll(e.clientY);
			}
		}
	}}
	on:mouseup={(e) => {
		if (draggingItemId) {
			mouseYCoordinate = e.clientY;
			draggingItemId = null;
			hoveredItemIndex = null;
			stopAutoScroll();
		}
	}}
/>
<div class="fixed left-[200px] top-[50px] h-[calc(100vh-30px)] w-[calc(100vw-200px)]">
	<div class="flex h-full w-full">
		<div class="main-container flex w-full flex-col overflow-y-scroll p-8 text-lg">
			<p class="mb-4 text-2xl font-bold text-zinc-800">Cohort Initial Events</p>
			<!-- <p class="mb-4 ml-2">Diagnosis Occurrence: <span class="inline-block px-3 py-1 rounded-full border border-blue-200 text-blue-500 px-2 text-xs bg-gradient-to-r from-blue-50 to-white">OMOPUveitis</span> 
				<span class="inline-block px-3 py-1 rounded-full border border-blue-200 text-blue-500 px-2 text-xs
				bg-gradient-to-r from-blue-50 to-white
					">change</span>
			</p> -->
			<p class="flex">
				with continuous observation of at least <input
					type="number"
					class="mx-2 w-16 rounded-md border border-zinc-200 px-2 text-sm"
				/>
				days before and
				<input type="number" class="ml-2 w-16 rounded-md border border-zinc-200 px-2 text-sm" />
			</p>
			<p class="flex">
				days after event index date Limit initial events to:
				<select class="mx-2 rounded-md border border-zinc-200 px-2 text-sm">
					<option value="earliest">all event</option>
					<option value="earliest">earliest event</option>
					<option value="latest">latest event</option>
				</select> per person.
			</p>

			<div class="events-container relative flex flex-col py-10">
				{#if mouseYCoordinate && draggingItemId}
					<div
						class="pointer-events-none absolute z-50 flex w-full flex-col rounded-md border border-zinc-200 bg-white p-4 shadow-lg"
						style="top: {mouseYCoordinate}px;"
					>
						<p class="mb-4 text-lg font-bold">
							{draggingItem.type
								? draggingItem.type
										.replace('_', ' ')
										.split(' ')
										.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
										.join(' ') + ' Event'
								: ''}
						</p>
						<div class="ml-2 flex flex-col text-sm text-zinc-700">
							<EventDisplayRouter eventdata={cohort.entry.and[draggingItemIndex]} />
						</div>
					</div>
				{/if}
				<div
					class="mb-4 ml-2 flex flex-col rounded-md border border-transparent p-4 transition-all duration-300 ease-in-out hover:border-zinc-200 hover:shadow-lg"
				>
					<p class="mb-4 text-lg font-bold">Condition Era Event</p>
					<p>
						Condition: <span class="mb-4 text-blue-500">all types of conditions</span>
					</p>
					<div class="ml-2 flex flex-col space-y-2 text-sm text-zinc-700">
						<p>Era start: before 2025-03-24</p>
						<p>Occurrence count: greater than 8</p>
						<p>Era start age: between 4 and 8</p>
					</div>
				</div>
				<div
					class="mb-4 ml-2 flex flex-col rounded-md border border-transparent p-4 transition-all duration-300 ease-in-out hover:border-zinc-200 hover:shadow-lg"
				>
					<p class="mb-4 text-lg font-bold">Observation Event</p>

					<p>
						Observation: <span class="mb-4 text-blue-500">all types of observations</span>
					</p>
					<div class="ml-2 flex flex-col space-y-2 text-sm text-zinc-700">
						<p>for the first time in the patient's hospital record</p>
						<p>
							Occurrence start: before 2025-03-10<br />
						</p>
					</div>
				</div>
				{#each cohort.entry.and as event, index}
					<div
						class="mb-4 ml-2 flex flex-col rounded-md border border-transparent p-4 transition-all duration-300 ease-in-out hover:border-zinc-200 hover:shadow-lg
						{draggingItemId === event.id ? 'opacity-40' : ''}"
						style="-webkit-user-select: none;"
						on:mouseover={(e) => {
							if (draggingItemId) {
								hoveredItemIndex = index;
							}
						}}
						on:mousedown={(e) => {
							e.stopPropagation();
							mouseDownTimer = setTimeout(() => {
								if (!draggingItemId) {
									mouseYCoordinate = e.target.offsetTop + e.offsetY;
									console.log('dragstart', mouseYCoordinate);

									draggingItem = event;
									draggingItemIndex = index;
									draggingItemId = JSON.stringify(event);
								}
							}, longPressDelay);
						}}
						on:mouseup={() => {
							if (mouseDownTimer) {
								clearTimeout(mouseDownTimer);
								mouseDownTimer = null;
							}
						}}
						on:mouseleave={() => {
							if (mouseDownTimer) {
								clearTimeout(mouseDownTimer);
								mouseDownTimer = null;
							}
						}}
					>

						<p class="mb-4 text-lg font-bold">
							{event.type
								? event.type
										.replace('_', ' ')
										.split(' ')
										.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
										.join(' ') + ' Event'
								: ''}
						</p>
						<div class="ml-2 flex flex-col text-sm text-zinc-700">
							<EventDisplayRouter eventdata={event} />
						</div>
					</div>
				{/each}
			</div>
		</div>
		<div
			class="mr-4 mt-8 flex h-full w-[700px] flex-col items-center overflow-y-scroll rounded-3xl border-2 border-blue-100 px-4 py-8 pb-16 shadow-2xl"
		>
			{#if expandedEvent === null}
				<p class="text-lg font-bold text-blue-600">Cohort Initial Events</p>
				<p class="mb-3 text-sm text-blue-700">Click the event to add to the cohort.</p>
				<div class="flex w-full flex-col gap-4 p-4">
					{#each events as event}
						<button
							on:click={() => (expandedEvent = expandedEvent === event ? null : event)}
							class="t ext-sm flex w-full flex-col justify-between rounded-md border border-blue-200 bg-blue-50
							p-2 text-left text-blue-500 shadow-sm transition-all duration-300 ease-in-out hover:bg-blue-100"
						>
							<div class="flex w-full justify-between">
								<p class="text-sm font-semibold">+ {event} Event</p>
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
				<div class="flex w-full items-center justify-between px-4 text-lg font-bold text-zinc-600">
					<p class="text-2xl font-bold">
						{expandedEvent} Event {#if editedEvent === expandedEvent}
							수정
						{:else}
							추가
						{/if}
					</p>
					<div />
				</div>

				<div
					class="text-normal mt-2 w-full px-4 py-6 text-zinc-700"
					on:click={(e) => e.stopPropagation()}
				>
					<p class="mt-4 text-lg font-bold">Addtional attributes</p>
					<div class="w-full px-4 text-sm">
						<IntegrationEditor
							on:add={({ detail }) => (eventdata = detail)}
							event_type={expandedEvent.toLowerCase().replace(' ', '_')}
						/>
					</div>
					<div class="mt-4 flex w-full justify-center space-x-4">
						<button
							on:click={() => {
								expandedEvent = null;
								editedEvent = null;
							}}
							class="rounded-xl border border-zinc-400 bg-zinc-100 px-3 py-1 text-sm font-normal text-zinc-600 hover:text-zinc-700"
						>
							Cancel
						</button>
						<button
							on:click={() => {
								if (editedEvent === expandedEvent) {
									editedEvent = null;
									expandedEvent = null;
								} else {
									cohort.entry.and.push(eventdata);
									added_events.push({
										id: crypto.randomUUID(),
										event_name: expandedEvent,
										eventdata: eventdata
									});
								}
								expandedEvent = null;
							}}
							class=" rounded-xl border border-blue-300 bg-blue-50 px-4 py-1 text-sm text-blue-600"
						>
							{#if editedEvent === expandedEvent}
								Update Event
							{:else}
								Add Event
							{/if}
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
