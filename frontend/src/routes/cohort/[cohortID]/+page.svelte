<script>
	import ChartCard from '$lib/components/ChartCard.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import { AGE_GROUPS, SINGLE_DATA_COLOR } from '$lib/constants.js';
	import DonutChart from '$lib/components/Charts/DonutChart/DonutChart.svelte';
	import SingleDonutChartWrapper from '$lib/components/Charts/DonutChart/SingleDonutChartWrapper.svelte';
	import { transformDonutChartToTableData } from '$lib/components/Charts/DonutChart/donutChartTransformer.js';
	import LineChart from '$lib/components/Charts/LineChart/LineChart.svelte';
	import { transformLineChartToTableData } from '$lib/components/Charts/LineChart/lineChartTransformer.js';
	import BarChart from '$lib/components/Charts/BarChart/BarChart.svelte';
	import BarChartWrapper from '$lib/components/Charts/BarChart/BarChartWrapper.svelte';
	import BarChartTableView from '$lib/components/Charts/BarChart/BarChartTableView.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { onMount, onDestroy, tick } from 'svelte';
	import { page } from '$app/stores';
	import LoadingComponent from '$lib/components/LoadingComponent.svelte';
	import { goto } from '$app/navigation';

	let worker;
	let chartLoading = true;
	let loadingMessage = 'Loading chart data...';

	let isLoading = true;
	let isShapLoading = false;
	let cohortInfo = [];
	let cohortID = $page.params.cohortID;

	let activeTab = 'definition';
	const tabs = [
		{ key: 'definition', label: 'Definition' },
		{ key: 'features', label: 'Features' },
		{ key: 'charts', label: 'Charts' }
	];

	let isTableView = {
		genderRatio: false,
		mortality: false,
		visitTypeRatio: false,
		firstOccurrenceAge: false,
		visitCount: false,
		topTenDrugs: false,
		topTenConditions: false,
		topTenProcedures: false,
		topTenMeasurements: false
	};

	let tabElements = Array(tabs.length).fill(null);
	let indicatorStyle = '';
	let resizeObserver;

	// SHAP 분석 관련 상태 변수 추가
	let comparisonGroupSize = '';
	let analysisStarted = false;
	let featureData = {
		cohort_id: '',
		status: '',
		features: {
			features: [],
			total: 0,
			page: 0,
			limit: 100
		}
	};
	let analysisError = null;

	// 로컬 스토리지 키
	const STORAGE_KEY = `cohort-${cohortID}-feature-analysis`;

	// 이전 분석 결과 로드
	let hasPreviousAnalysis = false;
	let previousAnalysisTime = '';

	// 초 단위 시간을 시간, 분, 초 형식으로 변환
	function formatExecutionTime(seconds) {
		if (!seconds) return '0s';

		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);

		const hDisplay = h > 0 ? h + 'h ' : '';
		const mDisplay = m > 0 ? m + 'm ' : '';
		const sDisplay = s > 0 ? s + 's' : '';

		return hDisplay + mDisplay + sDisplay;
	}

	// 날짜와 시간을 포맷팅하는 함수
	function formatDateTime(timestamp) {
		const date = new Date(timestamp);
		return date.toLocaleString();
	}

	// 이전 분석 결과 저장 함수
	function saveAnalysisResult(data) {
		try {
			const storageData = {
				data: data,
				timestamp: new Date().getTime()
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
		} catch (e) {
			console.error('Failed to save analysis result to local storage:', e);
		}
	}

	// 이전 분석 결과 불러오기 함수
	function loadPreviousAnalysis() {
		try {
			const storedData = localStorage.getItem(STORAGE_KEY);
			if (storedData) {
				const parsedData = JSON.parse(storedData);
				featureData = parsedData.data;
				previousAnalysisTime = formatDateTime(parsedData.timestamp);
				hasPreviousAnalysis = true;
				analysisStarted = true;
				analysisError = null;
			}
		} catch (e) {
			console.error('Failed to load previous analysis from local storage:', e);
			hasPreviousAnalysis = false;
		}
	}

	function exportToCSV(data, filename) {
		if (!data || data.length === 0) {
			alert('No data to export.');
			return;
		}

		const headers = Object.keys(data[0]);
		const rows = data.map((row) =>
			headers.map((field) => `"${(row[field] ?? '').toString().replace(/"/g, '""')}"`).join(',')
		);

		const csvContent = [headers.join(','), ...rows].join('\r\n');

		// BOM 추가 (엑셀 한글 깨짐 방지)
		const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);

		const link = document.createElement('a');
		link.href = url;
		link.setAttribute('download', filename);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	// 페이지 로드 시 이전 분석 결과 확인
	onMount(() => {
		updateIndicator();

		resizeObserver = new ResizeObserver(() => {
			updateIndicator();
		});

		const tabContainer = tabElements[0]?.parentElement;
		if (tabContainer) {
			resizeObserver.observe(tabContainer);
		}

		// 이전 분석 결과 확인
		try {
			const storedData = localStorage.getItem(STORAGE_KEY);
			if (storedData) {
				const parsedData = JSON.parse(storedData);
				previousAnalysisTime = formatDateTime(parsedData.timestamp);
				hasPreviousAnalysis = true;
			}
		} catch (e) {
			console.error('Failed to check previous analysis:', e);
		}
	});

	let shapFeatures = [];

	// 통계관련
	let analysisData = [];
	let ageDistributionChartData = [];

	// SHAP 분석 시작 함수 (백엔드 연동 필요)
	async function startAnalysis() {
		analysisStarted = true;
		isShapLoading = true;
		featureData = {
			cohort_id: '',
			status: '',
			features: {
				features: [],
				total: 0,
				page: 0,
				limit: 100
			}
		};
		analysisError = null;

		// 입력 값 유효성 검사 (양의 정수)
		const size = parseInt(comparisonGroupSize);
		if (isNaN(size) || size <= 0) {
			analysisError =
				'Comparison group size must be a positive integer greater than or equal to 1.';
			isShapLoading = false;
			return;
		}

		try {
			const res = await fetch(`/api/feature/${cohortID}/`, {
				method: 'POST',
				body: JSON.stringify({
					k: size
				})
			});

			if (!res.ok) {
				throw new Error('Failed to fetch SHAP analysis data');
			}

		} catch (error) {
			console.error('SHAP analysis error:', error);
			analysisError =
				error.message ||
				'An unexpected error occurred while running SHAP analysis. Please try again later.';
			featureData = {
				cohort_id: '',
				status: '',
				features: {
					features: [],
					total: 0,
					page: 0,
					limit: 100
				}
			}; // 에러 발생 시 기존 결과 초기화
		}
	}

	async function loadFeatureData() {
		try {
			const res = await fetch(`/api/feature/${cohortID}`);
			if (!res.ok) {
				throw new Error('Failed to fetch feature data');
			}
			const data = await res.json();
			if (data.status === 'completed' && data.features.features.length > 0) {
				featureData = data;
				shapFeatures = data.features.features;
				saveAnalysisResult(data);
				isShapLoading = false;
			} else if(data.status === 'completed' && data.features.features.length === 0) {
				shapFeatures = [];
				isShapLoading = false;
			} else if (data.status === 'running') {
				isShapLoading = true;
			} else if (data.status === 'pending'){
				analysisError = 'Analysis is still pending. Please check back later.';
			}

		} catch (error) {
			console.error('Error loading feature data:', error);
		}
	}

	async function loadAgeDistributionData() {
		try {
			const ageData = [];

			const cohortName = cohortInfo.name;
			for (const [key, value] of Object.entries(analysisData.age)) {
				ageData.push({
					label: key,
					value: value,
					series: cohortName
				});
			}

			return ageData;
		} catch (error) {
			console.error('Error loading age distribution data:', error);
			return [];
		}
	}

	function updateIndicator() {
		if (!tabElements || tabElements.length === 0) return;
		const activeElement = tabElements.find((el) => el?.dataset.key === activeTab);
		if (!activeElement) return;

		const containerLeft = tabElements[0].parentElement.getBoundingClientRect().left;
		const activeLeft = activeElement.getBoundingClientRect().left;
		const relativeLeft = activeLeft - containerLeft;

		indicatorStyle = `left: ${relativeLeft}px; width: ${activeElement.offsetWidth}px`;
	}

	function switchTab(tab) {
		if(tab === 'features' && isShapLoading) {
			loadFeatureData();
		}
		activeTab = tab;
		updateIndicator();
	}

	function startWorker(){
		worker = new Worker('/src/lib/fetchCohortStatistics.js', {
			type: 'module'
		});
        worker.onmessage = async (event) => {
            const { success, data } = event.data;
            if (success) {
                analysisData = data;
                ageDistributionChartData = await loadAgeDistributionData();
                chartLoading = false;
            } else {
                console.error('Worker error:', data);
            }
        };

        worker.postMessage({ cohortID });
    }

	onMount(async () => {
		loadFeatureData();
		try {
			startWorker();

			const res2 = await fetch(`/api/cohortinfo/${cohortID}`);
			if (!res2.ok) {
				throw new Error('Failed to fetch data');
			}
			const data2 = await res2.json();

			if (data2.length !== 0) {
				cohortInfo = data2;
			}
		} catch (error) {
			console.error('Error fetching data:', error);
		} finally {
			isLoading = false;
		}

		await tick();
		updateIndicator();

		resizeObserver = new ResizeObserver(() => {
			updateIndicator();
		});

		const tabContainer = tabElements[0]?.parentElement;
		if (tabContainer) {
			resizeObserver.observe(tabContainer);
		}
	});

	onDestroy(() => {
		if (resizeObserver) {
			resizeObserver.disconnect();
		}
		if(worker){
			worker.terminate();
		}
	});

	$: {
		if (activeTab) {
			updateIndicator();
		}
	}
</script>

{#if isLoading}
	<LoadingComponent message="Loading cohort data..." />
{:else}
	<div class="pl-4 pr-4">
		<div class="mb-8 mt-3 overflow-hidden rounded-lg border">
			<!-- 상단 정보 -->
			<div class="flex w-full items-center justify-between bg-gray-50 p-3">
				<div class="flex items-center gap-4">
					<div class="font-medium">
						<span class="text-sm text-gray-400">ID </span>
						<span class="text-black-500 text-sm">{cohortInfo.cohort_id}</span>
					</div>
					<div class="font-medium text-blue-600">{cohortInfo.name}</div>
					<span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
						{cohortInfo.count}
					</span>
				</div>

				<div class="flex items-center gap-4">
					<!-- 코호트 수정 버튼 -->
					<button
						onclick={() => {
							goto(`/edit/${cohortID}`);
						}}
						class="group relative flex items-center justify-center"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="h-7 w-6 text-blue-600 hover:text-blue-800"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15.232 5.232a3 3 0 00-4.464 0L3 12.5V17h4.5l7.768-7.768a3 3 0 000-4.464z"
							/>
						</svg>
						<span
							class="absolute left-1/2 top-full mt-2 -translate-x-1/2 transform rounded bg-white p-1 text-xs text-gray-700 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
						>
							Edit
						</span>
					</button>

					<!-- 코호트 복제 버튼 -->
					<button
						onclick={async () => {
							await fetch('https://bento.kookm.in/api/cohort', {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json'
								},
								body: JSON.stringify({
									name: cohortInfo.name + ' Copy',
									description: cohortInfo.description,
									cohortDefinition: JSON.parse(cohortInfo.cohort_definition),
									temporary: false
								})
							})
								.then((res) => res.json())
								.then((data) => {
									goto(`/edit/${data.cohort_id}`);
								});
						}}
						class="group relative flex items-center justify-center"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 20 20"
							fill="none"
							stroke="#4CAF50"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="h-5 w-5 hover:text-green-800"
						>
							<g fill="none" fill-rule="evenodd">
								<path
									d="m16.5 10.5v-8c0-1.1045695-.8954305-2-2-2h-8c-1.1045695 0-2 .8954305-2 2v8c0 1.1045695.8954305 2 2 2h8c1.1045695 0 2-.8954305 2-2z"
								/>
								<path
									d="m4.5 4.50345827h-2c-1.1045695 0-2 .8954305-2 2v7.99654173c0 1.1045695.8954305 2 2 2h.00345528l8.00000002-.0138241c1.1032187-.001906 1.9965447-.8967767 1.9965447-1.9999971v-1.9827205"
								/>
								<path d="m10.5 3.5v6" />
								<path d="m10.5 3.5v6" transform="matrix(0 1 -1 0 17 -4)" />
							</g>
						</svg>
						<span
							class="absolute left-1/2 top-full mt-2 -translate-x-1/2 transform rounded bg-white p-1 text-xs text-gray-700 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
						>
							Duplicate
						</span>
					</button>

					<!-- 코호트 삭제 버튼 -->
					<button
						onclick={async () => {
							await fetch(`https://bento.kookm.in/api/cohort/${cohortID}`, {
								method: 'DELETE'
							})
								.then(() => {
									goto('/cohort');
								})
								.catch((error) => {
									console.error('Error deleting cohort:', error);
								});
						}}
						class="group relative flex items-center justify-center"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="h-5 w-5 text-red-600 hover:text-red-800"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
						<span
							class="absolute left-1/2 top-full mt-2 -translate-x-1/2 transform rounded bg-white p-1 text-xs text-gray-700 opacity-0 shadow-md transition-opacity group-hover:opacity-100"
						>
							Delete
						</span>
					</button>
				</div>
			</div>

			<!-- 상세 정보 -->
			<div class="border-t p-4">
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<p class="text-gray-500">Author</p>
						<p class="font-medium">{cohortInfo.author}</p>
						<!--  ({analysisData.basicInfo.author.department}) -->
					</div>
					<div>
						<p class="text-gray-500">Created at</p>
						<p class="font-medium">{new Date(cohortInfo.created_at).toLocaleString()}</p>
					</div>
					<div class="col-span-2">
						<p class="text-gray-500">Description</p>
						<p class="font-medium">{cohortInfo.description}</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="mb-5 w-full border-b border-gray-300">
		<div class="relative flex">
			{#each tabs as tab, i}
				<button
					class="tab"
					class:active={activeTab === tab.key}
					onclick={() => switchTab(tab.key)}
					bind:this={tabElements[i]}
					data-key={tab.key}
				>
					{tab.label}
				</button>
			{/each}
			<div
				class="absolute bottom-0 h-0.5 bg-black transition-all duration-300 ease-in-out"
				style={indicatorStyle}
			></div>
		</div>
	</div>

	<div class="pb-10">
		{#if activeTab === 'definition'}
			<div class="p-3">
				<!-- Cohort JSON display (for debugging) -->
				<div class="rounded-lg border border-gray-200 p-4">
					<h3 class="mb-2 text-lg font-semibold text-gray-800">Cohort Definition JSON</h3>
					<pre class="rounded-md bg-gray-100 p-2 text-xs">{JSON.stringify(
							JSON.parse(cohortInfo.cohort_definition),
							null,
							2
						)}</pre>
				</div>
			</div>
		{/if}

		{#if activeTab === 'features'}
			<div class="space-y-6 p-6">
				<h2 class="text-xl font-semibold text-gray-800">
					Cohort Feature Importance Analysis (SHAP)
				</h2>
				<p class="text-sm text-gray-600">
					Enter the size of the comparison group to analyze the top features influencing this cohort
					using the SHAP algorithm.
				</p>

				<div class="flex items-end space-x-4">
					<div class="max-w-xs flex-grow">
						<label for="comparisonSize" class="mb-1 block text-sm font-medium text-gray-700"
							>Comparison Group Size Multiplier:</label
						>
						<input
							type="number"
							id="comparisonSize"
							bind:value={comparisonGroupSize}
							placeholder="e.g., 2"
							class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
							min="1"
							disabled={isLoading}
						/>
					</div>
					<button
						onclick={startAnalysis}
						disabled={isShapLoading || !comparisonGroupSize || parseInt(comparisonGroupSize) <= 0}
						class="rounded-md bg-blue-600 px-4 py-2 text-sm text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isShapLoading}
							Analyzing...
						{:else}
							Start Analysis
						{/if}
					</button>

					{#if hasPreviousAnalysis && !analysisStarted}
						<button
							onclick={loadPreviousAnalysis}
							class="flex items-center rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="mr-1 h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
							Load Previous Analysis
						</button>
					{/if}
				</div>
				{#if hasPreviousAnalysis && !analysisStarted}
					<div class="mt-2">
						<p class="text-xs text-gray-500">
							Previous analysis available from {previousAnalysisTime}
						</p>
					</div>
				{/if}
				{#if isShapLoading}
					<div class="mt-6 flex items-center justify-center space-x-2 text-gray-600">
						<svg
							class="h-5 w-5 animate-spin text-blue-600"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						<span>Running SHAP analysis. Please wait...</span>
					</div>
				{/if}

				{#if analysisError && !isShapLoading}
					<div class="mt-6 rounded-md border border-red-300 bg-red-100 p-4 text-sm text-red-800">
						<p><strong class="font-medium">Error:</strong> {analysisError}</p>
					</div>
				{/if}

				{#if !isShapLoading && !analysisError && shapFeatures.length > 0}
					{@const procedureFeatures = shapFeatures
						.filter((f) => f.domain === 'procedure')
						.sort((a, b) => b.influence - a.influence)
						.slice(0, 10)}
					{@const conditionFeatures = shapFeatures
						.filter((f) => f.domain === 'condition')
						.sort((a, b) => b.influence - a.influence)
						.slice(0, 10)}

					<div class="mt-8">
						<div class="mb-1 flex items-center justify-between">
							{#if featureData.features.features[0].multiple > 0}
								<span class="text-sm text-gray-600">
									<span class="text-gray-500">Comparison Size (people): </span>
									<span class="font-medium text-zinc-700"
										>{cohortInfo.count * featureData.features.features[0].multiple}</span
									>
									<span class="font-medium text-zinc-700">
										({featureData.features.features[0].multiple} x {cohortInfo.count})</span
									>
								</span>
							{:else}
								<span></span>
							{/if}

							{#if featureData.features.features[0].execution_time}
								<span class="text-sm text-gray-500">
									<span class="text-gray-500">Execution Time: </span>
									<span class="font-medium text-zinc-700"
										>{formatExecutionTime(featureData.features.features[0].execution_time)}</span
									>
								</span>
							{/if}
						</div>

						<div class="mb-5 flex items-center justify-start gap-3">
							{#if featureData.features.features.find((f) => f.domain_name === 'condition')}
								<span class="text-sm text-gray-600">
									<span class="text-gray-500">Condition Model F1 Score: </span>
									<span class="font-medium text-zinc-700"
										>{featureData.features.features.find((f) => f.domain_name === 'condition')
											.avg_f1_score}</span
									>
								</span>
							{/if}
							{#if featureData.features.features.find((f) => f.domain_name === 'procedure')}
								<span class="text-sm text-gray-500">|</span>
								<span class="text-sm text-gray-600">
									<span class="text-gray-500">Procedure Model F1 Score: </span>
									<span class="font-medium text-zinc-700"
										>{featureData.features.features.find((f) => f.domain_name === 'procedure')
											.avg_f1_score}</span
									>
								</span>
							{/if}
						</div>

						<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
							<!-- Condition Column -->
							<div>
								<div class="mb-2 flex items-center justify-between">
									<h4 class="text-sm font-semibold text-gray-700">Condition</h4>
									<button
										title="Download CSV"
										aria-label="export csv"
										class="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-500"
										onclick={() =>
											exportToCSV(
												featureData.features.features.filter((f) => f.domain_name === 'condition'),
												'condition_features.csv'
											)}
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
								</div>
								{#if featureData.features.features.filter((f) => f.domain_name === 'condition').length > 0}
									<div class="overflow-hidden rounded-lg border shadow-sm">
										<table class="min-w-full divide-y divide-gray-200 text-xs">
											<thead class="sticky top-0 z-10 bg-gray-50">
												<tr>
													<th
														scope="col"
														class="px-3 py-2 text-left font-medium uppercase tracking-wider text-gray-500"
														>Rank</th
													>
													<th
														scope="col"
														class="px-3 py-2 text-left font-medium uppercase tracking-wider text-gray-500"
														>Concept Id</th
													>
													<th
														scope="col"
														class="px-3 py-2 text-left font-medium uppercase tracking-wider text-gray-500"
														>Concept Name</th
													>
													<th
														scope="col"
														class="px-3 py-2 text-left font-medium uppercase tracking-wider text-gray-500"
														>Influence</th
													>
												</tr>
											</thead>
											<tbody class="divide-y divide-gray-200 bg-white">
												{#each featureData.features.features.filter((f) => f.domain_name === 'condition') as feature}
													<tr>
														<td class="whitespace-nowrap px-3 py-1.5 text-gray-500"
															>{feature.rank}</td
														>
														<td class="whitespace-nowrap px-3 py-1.5 text-gray-500"
															>{feature.concept_id}</td
														>
														<td
															class="max-w-[200px] truncate px-3 py-1.5 font-medium text-gray-700"
															title={feature.concept_name}
														>
															{feature.concept_name}
														</td>
														<td class="whitespace-nowrap px-3 py-1.5 text-gray-500"
															>{feature.influence}%</td
														>
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
								{:else}
									<div
										class="flex h-[250px] items-center justify-center rounded-lg border p-4 text-center text-xs text-gray-500 shadow-sm"
									>
										No significant condition features found.
									</div>
								{/if}
							</div>
							<!-- Procedure Column -->
							<div>
								<div class="mb-2 flex items-center justify-between">
									<h4 class="text-sm font-semibold text-gray-700">Procedure</h4>
									<button
										title="Download CSV"
										aria-label="export csv"
										class="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-500"
										onclick={() =>
											exportToCSV(
												featureData.features.features.filter((f) => f.domain_name === 'procedure'),
												'procedure_features.csv'
											)}
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
								</div>
								{#if featureData.features.features.filter((f) => f.domain_name === 'procedure').length > 0}
									<div class="overflow-hidden rounded-lg border shadow-sm">
										<table class="min-w-full divide-y divide-gray-200 text-xs">
											<thead class="sticky top-0 z-10 bg-gray-50">
												<tr>
													<th
														scope="col"
														class="px-3 py-2 text-left font-medium uppercase tracking-wider text-gray-500"
														>Rank</th
													>
													<th
														scope="col"
														class="px-3 py-2 text-left font-medium uppercase tracking-wider text-gray-500"
														>Concept Id</th
													>
													<th
														scope="col"
														class="px-3 py-2 text-left font-medium uppercase tracking-wider text-gray-500"
														>Concept Name</th
													>
													<th
														scope="col"
														class="px-3 py-2 text-left font-medium uppercase tracking-wider text-gray-500"
														>Influence</th
													>
												</tr>
											</thead>
											<tbody class="divide-y divide-gray-200 bg-white">
												{#each featureData.features.features.filter((f) => f.domain_name === 'procedure') as feature}
													<tr>
														<td class="whitespace-nowrap px-3 py-1.5 text-gray-500"
															>{feature.rank}</td
														>
														<td class="whitespace-nowrap px-3 py-1.5 text-gray-500"
															>{feature.concept_id}</td
														>
														<td
															class="max-w-[200px] truncate px-3 py-1.5 font-medium text-gray-700"
															title={feature.concept_name}
														>
															{feature.concept_name}
														</td>
														<td class="whitespace-nowrap px-3 py-1.5 text-gray-500"
															>{feature.influence}%</td
														>
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
								{:else}
									<div
										class="flex h-[250px] items-center justify-center rounded-lg border p-4 text-center text-xs text-gray-500 shadow-sm"
									>
										No significant procedure features found.
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		{#if activeTab == 'charts'}
			{#if !chartLoading}
				<div class="w-full">
					<div class="grid grid-cols-6 gap-4">
						<ChartCard
							title="Gender Ratio"
							description="The ratio of genders within the cohort."
							type="third"
							hasTableView={true}
							isTableView={isTableView.gender}
							hasXButton={false}
							on:toggleView={({ detail }) => (isTableView.gender = detail)}
						>
							<SingleDonutChartWrapper data={analysisData.gender} />

							<div slot="table" class="flex h-full w-full flex-col pt-2">
								<DataTable
									data={transformDonutChartToTableData({
										cohortName: cohortInfo.name,
										data: analysisData.gender,
										totalPatients: cohortInfo.count
									})}
								/>
							</div>
						</ChartCard>

						<ChartCard
							title="Mortality"
							description="The percentage of patients within the cohort who have died."
							type="third"
							hasTableView={true}
							isTableView={isTableView.mortality}
							hasXButton={false}
							on:toggleView={({ detail }) => (isTableView.mortality = detail)}
						>
							<SingleDonutChartWrapper data={analysisData.mortality} />

							<div slot="table" class="flex h-full w-full flex-col pt-2">
								<DataTable
									data={transformDonutChartToTableData({
										cohortName: cohortInfo.name,
										data: analysisData.mortality,
										totalPatients: cohortInfo.count
									})}
								/>
							</div>
						</ChartCard>

						<ChartCard
							title="Visit Type Ratio"
							description="The proportion of different types of medical visits (outpatient, inpatient, emergency room, etc.) that occurred during the cohort period."
							type="third"
							hasTableView={true}
							isTableView={isTableView.visitTypeRatio}
							hasXButton={false}
							on:toggleView={({ detail }) => (isTableView.visitTypeRatio = detail)}
						>
							<SingleDonutChartWrapper data={analysisData.visitType} />

							<div slot="table" class="flex h-full w-full flex-col pt-2">
								<DataTable
									data={transformDonutChartToTableData({
										cohortName: cohortInfo.name,
										data: analysisData.visitType,
										totalPatients: cohortInfo.count
									})}
								/>
							</div>
						</ChartCard>

						<ChartCard
							title="Distribution of First Occurrence Age"
							description="The age distribution of patients at the time of their first medical visit during the cohort period."
							type="half"
							hasTableView={true}
							isTableView={isTableView.age}
							hasXButton={false}
							on:toggleView={({ detail }) => (isTableView.age = detail)}
						>
							<LineChart
								data={ageDistributionChartData}
								cohortColorMap={{ [cohortInfo.name]: SINGLE_DATA_COLOR }}
								showLegend={false}
							/>

							<div slot="table" class="flex h-full w-full flex-col p-4">
								<DataTable data={transformLineChartToTableData(ageDistributionChartData)} />
							</div>
						</ChartCard>

						<ChartCard
							title="Distribution of Visit Count"
							description="The distribution of the total number of medical visits made by patients during the cohort period."
							type="half"
							hasTableView={true}
							isTableView={isTableView.visitCount}
							hasXButton={false}
							on:toggleView={({ detail }) => (isTableView.visitCount = detail)}
						>
							<LineChart
								data={Object.entries(analysisData.visitCount).map(([count, value]) => ({
									label: count,
									value: value,
									series: cohortInfo.name
								}))}
								cohortColorMap={{ [cohortInfo.name]: SINGLE_DATA_COLOR }}
								showLegend={false}
							/>

							<div slot="table" class="flex h-full w-full flex-col p-4">
								<DataTable
									data={transformLineChartToTableData(
										Object.entries(analysisData.visitCount).map(([count, value]) => ({
											label: count,
											value: value,
											series: cohortInfo.name
										}))
									)}
								/>
							</div>
						</ChartCard>

						<ChartCard
							title="Top 10 Drugs"
							description="The list of the top 10 most frequently prescribed medications for patients in the cohort."
							type="half"
							hasTableView={true}
							isTableView={isTableView.topTenDrugs}
							hasXButton={false}
							on:toggleView={({ detail }) => (isTableView.topTenDrugs = detail)}
						>
							<BarChartWrapper
								data={Object.entries(analysisData.topTenDrug).map(([name, count]) => ({
									name,
									count
								}))}
								cohortName={cohortInfo.name}
								cohortTotalCount={cohortInfo.count}
							/>

							<div slot="table" class="flex h-full w-full flex-col overflow-auto p-4">
								<BarChartTableView
									data={Object.entries(analysisData.topTenDrug).map(([name, count]) => ({
										name,
										count
									}))}
									domainKey="drug"
									cohortName={cohortInfo.name}
									cohortTotalCount={cohortInfo.count}
								/>
							</div>
						</ChartCard>

						<ChartCard
							title="Top 10 Conditions"
							description="The list of the top 10 most frequently diagnosed medical conditions among patients in the cohort."
							type="half"
							hasTableView={true}
							isTableView={isTableView.topTenConditions}
							hasXButton={false}
							on:toggleView={({ detail }) => (isTableView.topTenConditions = detail)}
						>
							<BarChartWrapper
								data={Object.entries(analysisData.topTenCondition).map(([name, count]) => ({
									name,
									count
								}))}
								cohortName={cohortInfo.name}
								cohortTotalCount={cohortInfo.count}
							/>

							<div slot="table" class="flex h-full w-full flex-col overflow-auto p-4">
								<BarChartTableView
									data={Object.entries(analysisData.topTenCondition).map(([name, count]) => ({
										name,
										count
									}))}
									domainKey="condition"
									cohortName={cohortInfo.name}
									cohortTotalCount={cohortInfo.count}
								/>
							</div>
						</ChartCard>

						<ChartCard
							title="Top 10 Procedures"
							description="The list of the top 10 most frequently performed procedures and medical tests on patients in the cohort."
							type="half"
							hasTableView={true}
							isTableView={isTableView.topTenProcedures}
							hasXButton={false}
							on:toggleView={({ detail }) => (isTableView.topTenProcedures = detail)}
						>
							<BarChartWrapper
								data={Object.entries(analysisData.topTenProcedure).map(([name, count]) => ({
									name,
									count
								}))}
								cohortName={cohortInfo.name}
								cohortTotalCount={cohortInfo.count}
							/>

							<div slot="table" class="flex h-full w-full flex-col overflow-auto p-4">
								<BarChartTableView
									data={Object.entries(analysisData.topTenProcedure).map(([name, count]) => ({
										name,
										count
									}))}
									domainKey="procedure"
									cohortName={cohortInfo.name}
									cohortTotalCount={cohortInfo.count}
								/>
							</div>
						</ChartCard>

						<ChartCard
							title="Top 10 Measurements"
							description="The list of the top 10 most frequently recorded clinical measurements within the cohort."
							type="half"
							hasTableView={true}
							isTableView={isTableView.topTenMeasurements}
							hasXButton={false}
							on:toggleView={({ detail }) => (isTableView.topTenMeasurements = detail)}
						>
							<BarChartWrapper
								data={Object.entries(analysisData.topTenMeasurement).map(([name, count]) => ({
									name,
									count
								}))}
								cohortName={cohortInfo.name}
								cohortTotalCount={cohortInfo.count}
							/>

							<div slot="table" class="flex h-full w-full flex-col overflow-auto p-4">
								<BarChartTableView
									data={Object.entries(analysisData.topTenMeasurement).map(([name, count]) => ({
										name,
										count
									}))}
									domainKey="measurement"
									cohortName={cohortInfo.name}
									cohortTotalCount={cohortInfo.count}
								/>
							</div>
						</ChartCard>
					</div>
				</div>
			{:else}
				Please wait...
			{/if}
		{/if}
	</div>

	<Footer />
{/if}

<style>
	.tab {
		padding: 0.75rem 1.5rem;
		margin-right: 1rem;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		position: relative;
	}

	.tab.active {
		font-weight: 500;
	}
</style>
