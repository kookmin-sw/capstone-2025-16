<script>
	import { goto } from '$app/navigation';
	import { onMount, tick } from 'svelte';
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import GroupedBarChart from '$lib/components/Charts/GroupedBarChart/GroupedBarChart.svelte';
	import { dndzone } from 'svelte-dnd-action';
	import ChartCard from '$lib/components/ChartCard.svelte';
	import LoadingComponent from '$lib/components/LoadingComponent.svelte';
	import { utcDay } from 'd3';
	import TargetSetModal from './components/TargetSetModal.svelte';

	let isLoading = true;
	let statisticsID = $page.params.statisticsId;
	let isDragging = false;

	let cumtomInfo = [];
	let targetSetData = [];
	let customChartData = [];
	let expandedStates = []; // 차트 별 토글 상태
	let chartDefinitionStates = []; // 차트 내 chart definition 토글 상태

	function handleDnd({ detail }) {
		isDragging = true;
		customChartData = Array.isArray(detail.items) ? detail.items : customChartData;
		isDragging = false;
	}

	async function toggleExpand(index) {
		// 코호트 목록 toggle 펼치거나 접기 위한 함수
		await tick();
		expandedStates[index] = !expandedStates[index];
		expandedStates = [...expandedStates];
	}

	async function toggleChartDefinition(chartIndex) {
        await tick();
        chartDefinitionStates[chartIndex] = !chartDefinitionStates[chartIndex];
        chartDefinitionStates = [...chartDefinitionStates];
		console.log(chartDefinitionStates);
    }

	onMount(async () => {
		if (statisticsID !== 'new') {
			try {
				const res = await fetch(`/api/custominfo/${statisticsID}`);
				if (!res.ok) {
					throw new Error('Failed to fetch data');
				}
				const data = await res.json();
				cumtomInfo = data;
				const targetID = data.cohort_ids.split(',');
				const result = await Promise.all(
					targetID.map(async (element) => {
						const res2 = await fetch(`/api/cohortinfo/${element}`);
						if (!res2.ok) {
							throw new Error('Failed to fetch data');
						}
						return res2.json();
					})
				);

				const res3 = await fetch(`/api/customchart/${statisticsID}`);
				if (!res3.ok) {
					throw new Error('Failed to fetch data');
				}
				const data3 = await res3.json();

				customChartData = data3.charts.map((chart) => ({
					...chart,
					id: chart.chart_id
				}));
				console.log(customChartData[0].result);
				targetSetData = result;
				expandedStates = targetID.map(() => false);
				chartDefinitionStates = customChartData.map(() => false);

			} catch (error) {
				console.error('Error loading data:', error);
			} finally {
				isLoading = false;
			}
		} else {
			isLoading = false;
		}
	});
</script>

{#if isLoading}
	<LoadingComponent />
{:else}
	<div class="px-10">
		<div class="mb-3 mt-3 flex h-[200px] w-full overflow-hidden rounded-lg border">
			<!-- 좌측: Custom Target 영역 -->
			<div class="flex w-[20%] flex-col border-r">
				<div class="flex items-center justify-between border-b bg-gray-50 p-3">
					<div class="font-medium text-blue-600">Chart Target Set</div>
				</div>

				<div class="flex flex-col gap-2 overflow-y-auto p-4">
					{#each targetSetData as id, index}
						<button
							class="group flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 transition-colors hover:bg-blue-50"
							onclick={() => goto(`/cohort/${id.cohort_id}`)}
						>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-1">
									<span class="truncate text-[10px] font-medium text-gray-400">{id.cohort_id}</span>
								</div>
								<div class="flex items-center gap-1">
									<div class="whitespace-normal break-words text-xs font-medium text-blue-600">
										{id.name}
									</div>
								</div>
							</div>
							<div class="flex items-center text-gray-400 group-hover:text-blue-600">›</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- 우측: 상세 정보 영역 -->
			<div class="flex w-[80%] flex-col">
				<div class="flex items-center justify-between border-b bg-gray-50 p-3">
					<div class="flex items-center gap-4">
						<div class="font-medium">
							<span class="text-sm text-gray-400">ID</span>
							<span class="text-black-500 text-sm">{cumtomInfo.statistics_id}</span>
						</div>
						<div class="font-medium text-blue-600">Custom Target Set 1</div>
					</div>
				</div>

				<div class="overflow-y-auto p-4">
					<div class="grid grid-cols-3 gap-4 text-sm">
						<div>
							<p class="text-gray-500">Author</p>
							<p class="font-medium">{cumtomInfo.author}</p>
						</div>
						<div>
							<p class="text-gray-500">Created at</p>
							<p class="font-medium">{new Date(cumtomInfo.created_at).toLocaleString()}</p>
						</div>
						<div class="col-span-3">
							<p class="text-gray-500">Description</p>
							<p class="font-medium">{cumtomInfo.description}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div>
		<div class="flex items-center justify-between px-10 pt-4">
			<h3 class="text-lg font-semibold text-gray-800">Custom Charts</h3>
			<div class="flex items-center space-x-2">
				<div class="text-[14px] text-gray-500">Add a new chart for this target</div>
				<button
					class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-xl font-medium text-white shadow transition hover:bg-blue-700"
				>
					+
				</button>
			</div>
		</div>
	</div>

	<div
		use:dndzone={{
			items: customChartData.map((chart) => ({
				...chart,
				id: chart.chart_id // chart_id를 id로 복사
			})),
			flipDurationMs: 300,
			dropTargetStyle: {
				backgroundColor: 'transparent',
				border: 'none'
			}
		}}
		onconsider={handleDnd}
		onfinalize={handleDnd}
		class="space-y-2 px-10 py-4"
	>
		{#each customChartData as chart, index (chart.chart_id)}
			<div class="overflow-hidden rounded-lg border bg-white">
				<button
					class="flex w-full items-center justify-between p-2 transition-colors hover:bg-gray-50"
					onclick={() => toggleExpand(index)}
				>
					<div class="flex items-center gap-2">
						<svg
							class="mr-3 h-3 w-3 flex-shrink-0 transform transition-transform {expandedStates[
								index
							]
								? 'rotate-0'
								: '-rotate-90'}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-1">
								<span class="truncate text-xs font-medium text-gray-400">{chart.id}</span>
							</div>
							<div class="flex items-center gap-1">
								<div class="whitespace-normal break-words text-sm font-medium text-blue-600">
									{chart.name}
								</div>
							</div>
						</div>
					</div>
					<div class="flex flex-shrink-0 items-center gap-2 pr-2">
						<svg
							class="h-5 w-5 cursor-move text-gray-500"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<line x1="3" y1="12" x2="21" y2="12"></line>
							<line x1="3" y1="6" x2="21" y2="6"></line>
							<line x1="3" y1="18" x2="21" y2="18"></line>
						</svg>
					</div>
				</button>

				{#if expandedStates[index]}
					<div class="relative border-t p-2 text-sm" transition:slide>
						<button
							title="Delete Chart"
							aria-label="custom chart delete button"
							,
							class="absolute right-2 top-2 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
							onclick={(e) => {
								e.stopPropagation();
								if (!isDragging && confirm(`"${chart.name}" 차트를 삭제하시겠습니까?`)) {
									customChartData = [...customChartData.filter((_, i) => i !== index)];
								}
							}}
						>
							<svg
								class="h-5 w-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<polyline points="3 6 5 6 21 6"></polyline>
								<path
									d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
								></path>
							</svg>
						</button>
						<button
							title="Download Chart Image"
							aria-label="export chart image"
							class="absolute right-10 top-2 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-500"
							onclick={(e) => {
								e.stopPropagation();
								exportChartImage(chart.chart_id, 'png'); // png or 'jpeg'
							}}
						>
							<svg
								class="h-5 w-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
								<polyline points="7 10 12 15 17 10"></polyline>
								<line x1="12" y1="15" x2="12" y2="3"></line>
							</svg>
						</button>

						<div class="space-y-1">
							<div>
								<span class="text-gray-500">Author:</span>
								<span class="font-regular">{chart.author}</span>
							</div>
							<div>
								<span class="text-gray-500">Created at:</span>
								<span class="font-regular">{chart.created_at}</span>
							</div>
							<div>
								<span class="text-gray-500">Description:</span>
								<span class="font-regular">{chart.description}</span>
							</div>
							<div>
								<span class="text-gray-500">Chart Type:</span>
								<span class="font-regular">{chart.type}</span>
							</div>
						</div>
						<!-- 차트 및 설명 영역 추가 -->
						<div class="px-2 pt-4">
							<ChartCard
								title="Custom Chart"
								description="Visualize and compare data across different targets and groups"
								hasXButton={false}
								height="400px"
							>
								<div class="flex h-full w-full items-center justify-center">
									<GroupedBarChart
										data={{
										definition: JSON.parse(chart.definition),
										result: JSON.parse(chart.result)
										}}
								  />
								</div>
							</ChartCard>
						</div>
						<div class="mt-5 border-t p-4">
							<div class="flex items-center justify-start">
								<button
									aria-label="toggle chart definition"
									class="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-gray-100"
									onclick={() => toggleChartDefinition(index)}
								>
									<svg
										class="h-3 w-3 flex-shrink-0 transform transition-transform {chartDefinitionStates[
											index
										]
											? 'rotate-0'
											: '-rotate-90'}"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 9l-7 7-7-7"
										/>
									</svg>
									<div class="text-md font-medium text-gray-700">Chart Definition</div>
								</button>
							</div>
							{#if chartDefinitionStates[index]}
								<div transition:slide>
									{#each JSON.parse(chart.definition).groups as group}
										<div class="mb-4 ml-6 last:mb-0">
											<div class="mb-2 flex items-center justify-between">
												<h5 class="text-sm font-medium text-blue-600">{group.name}</h5>
												<button
													class="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-200"
													onclick={() => copyToClipboard(JSON.stringify(group.definition, null, 2))}
												>
													<svg
														class="h-3 w-3"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
														stroke-linecap="round"
														stroke-linejoin="round"
													>
														<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
														<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
														></path>
													</svg>
													Copy
												</button>
											</div>
											<pre
												class="overflow-x-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs text-gray-600">{JSON.stringify(
													group.definition,
													null,
													2
												)}</pre>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	{#if statisticsID === 'new'}
		<TargetSetModal />
	{/if}
{/if}
