<script>
    // import analysisData from '$lib/data/singleCohortAnalysisTest.json';
    import ChartCard from "$lib/components/ChartCard.svelte";
    import DataTable from "$lib/components/DataTable.svelte";
    import { AGE_GROUPS, SINGLE_DATA_COLOR } from '$lib/constants.js';
    import DonutChart from '$lib/components/Charts/DonutChart/DonutChart.svelte';
    import SingleDonutChartWrapper from '$lib/components/Charts/DonutChart/SingleDonutChartWrapper.svelte';
    import { transformDonutChartToTableData } from '$lib/components/Charts/DonutChart/donutChartTransformer.js';
    import LineChart from '$lib/components/Charts/LineChart/LineChart.svelte';
    import { transformLineChartToTableData } from "$lib/components/Charts/LineChart/lineChartTransformer.js";
    import BarChart from "$lib/components/Charts/BarChart/BarChart.svelte"
    import BarChartWrapper from "$lib/components/Charts/BarChart/BarChartWrapper.svelte"
    import BarChartTableView from '$lib/components/Charts/BarChart/BarChartTableView.svelte';
    import Footer from '$lib/components/Footer.svelte';
    import { onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';

    let { data } = $props();
    console.log(data);
    let activeTab = $state('definition');
    const tabs = [
		{ key: 'definition', label: 'Definition' },
		{ key: 'features', label: 'Features' },
		{ key: 'charts', label: 'Charts' },
	];

    let isTableView = $state({
        genderRatio: false,
        mortality: false,
        visitTypeRatio: false,
        firstOccurrenceAge: false,
        visitCount: false,
        topTenDrugs: false,
        topTenConditions: false,
        topTenProcedures: false,
        topTenMeasurements: false
    });

    let tabElements = $state(Array(tabs.length).fill(null));
    let indicatorStyle = $state('');
    let resizeObserver;

    // SHAP 분석 관련 상태 변수 추가
    let comparisonGroupSize = $state('');
    let isLoading = $state(false);
    let analysisStarted = $state(false);
    let shapFeatures = $state([]);

    // 통계관련
    let analysisError = $state(null);
    let cohortID = $derived($page.params.cohortID); // URL에서 cohortID 추출
    let cohortInfo = $state(data.cohortinfo);
    let analysisData = $state(data.cohortStatistics);
    let ageDistributionChartData = $state([]);

    // SHAP 분석 시작 함수 (백엔드 연동 필요)
    async function startAnalysis() {
        analysisStarted = true;
        isLoading = true;
        shapFeatures = [];
        analysisError = null;

        // 입력 값 유효성 검사 (양의 정수)
        const size = parseInt(comparisonGroupSize);
        if (isNaN(size) || size <= 0) {
            analysisError = "Comparison group size must be a positive integer greater than or equal to 1.";
            isLoading = false;
            return;
        }

        try {
            // TODO: 실제 백엔드 API 호출 로직 구현
            // 예시: const response = await fetch(`/api/cohort/${cohortID}/shap-analysis?comparisonSize=${size}`);
            // if (!response.ok) throw new Error('분석 중 오류가 발생했습니다.');
            // const data = await response.json();
            // shapFeatures = data.features; // 백엔드 응답에 domain 필드가 포함되어야 함

            // 임시 비동기 처리 및 더미 데이터 설정 (domain 추가)
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 딜레이 시뮬레이션
            // 성공 시 더미 데이터 (확장 및 influence 조정)
            shapFeatures = [
                // Procedure (11개) - Top 10 Sum: 78.4
                { name: 'Coronary Angiography', influence: 40, domain: 'Procedure' },
                { name: 'Appendectomy', influence: 20, domain: 'Procedure' },
                { name: 'Colonoscopy', influence: 10, domain: 'Procedure' },
                { name: 'Hip Replacement', influence: 1.5, domain: 'Procedure' },
                { name: 'Knee Arthroscopy', influence: 1.4, domain: 'Procedure' },
                { name: 'Cholecystectomy', influence: 1.3, domain: 'Procedure' },
                { name: 'Cardiac Catheterization', influence: 1.2, domain: 'Procedure' },
                { name: 'Tonsillectomy', influence: 1.1, domain: 'Procedure' },
                { name: 'Hernia Repair', influence: 1.0, domain: 'Procedure' },
                { name: 'Cataract Surgery', influence: 0.9, domain: 'Procedure' },
                { name: 'Physical Therapy Session', influence: 0.08, domain: 'Procedure' }, 

                // Condition (12개) - Top 10 Sum: 74.5
                { name: 'History of Hypertension', influence: 25, domain: 'Condition' },
                { name: 'Diabetes Mellitus Type 2', influence: 15, domain: 'Condition' },
                { name: 'Chronic Kidney Disease Stage 3', influence: 10, domain: 'Condition' },
                { name: 'Asthma, persistent', influence: 8, domain: 'Condition' },
                { name: 'Atrial Fibrillation', influence: 6, domain: 'Condition' },
                { name: 'Hyperlipidemia', influence: 4, domain: 'Condition' },
                { name: 'Osteoarthritis of Knee', influence: 3, domain: 'Condition' },
                { name: 'Major Depressive Disorder', influence: 2, domain: 'Condition' },
                { name: 'Gastroesophageal Reflux Disease', influence: 1, domain: 'Condition' },
                { name: 'Obstructive Sleep Apnea', influence: 0.5, domain: 'Condition' },
                { name: 'Anemia, unspecified', influence: 0.20, domain: 'Condition' },
                { name: 'Hypothyroidism', influence: 0.19, domain: 'Condition' },
            ];

            // TODO: 실제 데이터에서는 더 많은 도메인과 특성이 있을 수 있음
            // 실제 백엔드 응답에 맞게 domain 필드를 처리해야 합니다.

            // 만약 실제 API 호출에서 에러가 발생했다면 아래처럼 처리
            // throw new Error("백엔드 처리 중 심각한 오류 발생");

        } catch (error) {
            console.error("SHAP analysis error:", error);
            analysisError = error.message || "An unexpected error occurred while running SHAP analysis. Please try again later.";
            shapFeatures = []; // 에러 발생 시 기존 결과 초기화
        } finally {
            isLoading = false;
        }
    }

    async function loadAgeDistributionData() {
        try {
            const ageData = [];
            
            const cohortName = cohortInfo.name;
            for(const [key, value] of Object.entries(analysisData.age)){
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
        const activeElement = tabElements.find(el => el?.dataset.key === activeTab);
        if (!activeElement) return;
        
        const containerLeft = tabElements[0].parentElement.getBoundingClientRect().left;
        const activeLeft = activeElement.getBoundingClientRect().left;
        const relativeLeft = activeLeft - containerLeft;
        
        indicatorStyle = `left: ${relativeLeft}px; width: ${activeElement.offsetWidth}px`;
    }

    function switchTab(tab) {
        activeTab = tab;
        updateIndicator();
    }

    onMount(async() => {
        updateIndicator();
        
        resizeObserver = new ResizeObserver(() => {
            updateIndicator();
        });

        const tabContainer = tabElements[0]?.parentElement;
        if (tabContainer) {
            resizeObserver.observe(tabContainer);
        }

        ageDistributionChartData = await loadAgeDistributionData();
    });

    onDestroy(() => {
        if (resizeObserver) {
            resizeObserver.disconnect();
        }
    });

    $effect(() => {
        if (activeTab) {
            updateIndicator();
        }
    });
</script>

<div class="pl-4 pr-4">
    <div class="border rounded-lg overflow-hidden mb-8 mt-3">
        <!-- 상단 정보 -->
        <div class="w-full flex items-center justify-between p-3 bg-gray-50">
            <div class="flex items-center gap-4">
                <div class="font-medium">
                    <span class="text-sm text-gray-400">ID  </span>
                    <span class="text-sm text-black-500">{cohortInfo.cohort_id}</span>
                </div>
                <div class="text-blue-600 font-medium">{cohortInfo.name}</div>
                <span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                    {cohortInfo.count}
                </span>
            </div>

            <div class="flex items-center gap-4">
                <!-- 코호트 수정 버튼 -->
                <button class="flex items-center justify-center relative group">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-7 text-blue-600 hover:text-blue-800">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232a3 3 0 00-4.464 0L3 12.5V17h4.5l7.768-7.768a3 3 0 000-4.464z" />
                    </svg>
                    <span class="absolute left-1/2 top-full mt-2 transform -translate-x-1/2 bg-white text-xs text-gray-700 rounded shadow-md p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Edit
                    </span>
                </button>

                <!-- 코호트 복제 버튼 -->
                <button class="flex items-center justify-center relative group">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="#4CAF50" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 hover:text-green-800">
                        <g fill="none" fill-rule="evenodd">
                            <path d="m16.5 10.5v-8c0-1.1045695-.8954305-2-2-2h-8c-1.1045695 0-2 .8954305-2 2v8c0 1.1045695.8954305 2 2 2h8c1.1045695 0 2-.8954305 2-2z"/>
                            <path d="m4.5 4.50345827h-2c-1.1045695 0-2 .8954305-2 2v7.99654173c0 1.1045695.8954305 2 2 2h.00345528l8.00000002-.0138241c1.1032187-.001906 1.9965447-.8967767 1.9965447-1.9999971v-1.9827205"/>
                            <path d="m10.5 3.5v6"/>
                            <path d="m10.5 3.5v6" transform="matrix(0 1 -1 0 17 -4)"/>
                        </g>
                    </svg>
                    <span class="absolute left-1/2 top-full mt-2 transform -translate-x-1/2 bg-white text-xs text-gray-700 rounded shadow-md p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Duplicate
                    </span>
                </button>

                <!-- 코호트 삭제 버튼 -->
                <button class="flex items-center justify-center relative group">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-red-600 hover:text-red-800">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span class="absolute left-1/2 top-full mt-2 transform -translate-x-1/2 bg-white text-xs text-gray-700 rounded shadow-md p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Delete
                    </span>
                </button>
            </div>
        </div>
        
        <!-- 상세 정보 -->
        <div class="p-4 border-t">
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p class="text-gray-500">Author</p>
                    <p class="font-medium">{cohortInfo.author} </p> <!--  ({analysisData.basicInfo.author.department}) -->
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

<div class="w-full mb-5 border-b border-gray-300">
	<div class="flex relative">
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
        <div class="p-6">
            코호트 구성 탭 화면
        </div>
    {/if}

    {#if activeTab === 'features'}
        <div class="p-6 space-y-6">
            <h2 class="text-xl font-semibold text-gray-800">Cohort Feature Importance Analysis (SHAP)</h2>
            <p class="text-sm text-gray-600">
                Enter the size of the comparison group to analyze the top features influencing this cohort using the SHAP algorithm.
            </p>

            <div class="flex items-end space-x-4">
                <div class="flex-grow max-w-xs">
                    <label for="comparisonSize" class="block text-sm font-medium text-gray-700 mb-1">Comparison Group Size Multiplier:</label> 
                    <input
                        type="number"
                        id="comparisonSize"
                        bind:value={comparisonGroupSize}
                        placeholder="e.g., 2" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        min="1"
                        disabled={isLoading}
                    />
                </div>
                <button
                    onclick={startAnalysis}
                    disabled={isLoading || !comparisonGroupSize || parseInt(comparisonGroupSize) <= 0}
                    class="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                    {#if isLoading}
                        Analyzing...
                    {:else}
                        Start Analysis
                    {/if}
                </button>
            </div>

            {#if isLoading}
                <div class="mt-6 flex justify-center items-center space-x-2 text-gray-600">
                    <svg class="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Running SHAP analysis. Please wait...</span>
                </div>
            {/if}

            {#if analysisError && !isLoading}
                <div class="mt-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-md text-sm">
                    <p><strong class="font-medium">Error:</strong> {analysisError}</p>
                </div>
            {/if}

            {#if !isLoading && !analysisError && shapFeatures.length > 0}
                {@const procedureFeatures = shapFeatures.filter(f => f.domain === 'Procedure').sort((a, b) => b.influence - a.influence).slice(0, 10)}
                {@const conditionFeatures = shapFeatures.filter(f => f.domain === 'Condition').sort((a, b) => b.influence - a.influence).slice(0, 10)}
                
                <div class="mt-8">
                    <!-- <h3 class="text-lg font-medium text-gray-800 mb-4">Top 10 Influential Features by Domain</h3> -->
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <!-- Procedure Column -->
                        <div>
                            <h4 class="text-sm font-semibold text-gray-700 mb-2">Procedure</h4>
                            {#if procedureFeatures.length > 0}
                                <div class="border rounded-lg overflow-hidden shadow-sm">
                                    <table class="min-w-full divide-y divide-gray-200 text-xs">
                                        <thead class="bg-gray-50 sticky top-0 z-10">
                                            <tr>
                                                <th scope="col" class="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                                <th scope="col" class="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Feature Name</th>
                                                <th scope="col" class="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Influence</th>
                                            </tr>
                                        </thead>
                                        <tbody class="bg-white divide-y divide-gray-200">
                                            {#each procedureFeatures as feature, index}
                                                <tr>
                                                    <td class="px-3 py-1.5 whitespace-nowrap text-gray-500">{index + 1}</td>
                                                    <td class="px-3 py-1.5 whitespace-nowrap text-gray-700 font-medium">{feature.name}</td>
                                                    <td class="px-3 py-1.5 whitespace-nowrap text-gray-500">{feature.influence}%</td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            {:else}
                                <div class="border rounded-lg shadow-sm flex items-center justify-center p-4 text-center text-gray-500 text-xs h-[250px]">
                                    No significant procedure features found.
                                </div>
                            {/if}
                        </div>

                        <!-- Condition Column -->
                        <div>
                            <h4 class="text-sm font-semibold text-gray-700 mb-2">Condition</h4>
                            {#if conditionFeatures.length > 0}
                                <div class="border rounded-lg overflow-hidden shadow-sm">
                                        <table class="min-w-full divide-y divide-gray-200 text-xs">
                                            <thead class="bg-gray-50 sticky top-0 z-10">
                                            <tr>
                                                <th scope="col" class="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                                <th scope="col" class="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Feature Name</th>
                                                <th scope="col" class="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Influence</th>
                                            </tr>
                                            </thead>
                                            <tbody class="bg-white divide-y divide-gray-200">
                                                {#each conditionFeatures as feature, index}
                                                    <tr>
                                                        <td class="px-3 py-1.5 whitespace-nowrap text-gray-500">{index + 1}</td>
                                                        <td class="px-3 py-1.5 whitespace-nowrap text-gray-700 font-medium">{feature.name}</td>
                                                        <td class="px-3 py-1.5 whitespace-nowrap text-gray-500">{feature.influence}%</td>
                                                    </tr>
                                                {/each}
                                            </tbody>
                                        </table>
                                </div>
                            {:else}
                                <div class="border rounded-lg shadow-sm flex items-center justify-center p-4 text-center text-gray-500 text-xs h-[250px]">
                                    No significant condition features found.
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    {/if}

    {#if activeTab == 'charts'}
        <div class="w-full">
            <div class="grid grid-cols-6 gap-4">
                <ChartCard
                    title="Gender Ratio"
                    description="The ratio of genders within the cohort."
                    type="third"
                    hasTableView={true}
                    isTableView={isTableView.gender}
                    hasXButton={false}
                    on:toggleView={({ detail }) => isTableView.gender = detail}
                >
                    <SingleDonutChartWrapper data={analysisData.gender} />

                    <div slot="table" class="w-full h-full flex flex-col pt-2">
                        <DataTable data={transformDonutChartToTableData({
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
                    on:toggleView={({ detail }) => isTableView.mortality = detail}
                >
                    <SingleDonutChartWrapper data={analysisData.mortality} />

                    <div slot="table" class="w-full h-full flex flex-col pt-2">
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
                    on:toggleView={({ detail }) => isTableView.visitTypeRatio = detail}
                >
                    <SingleDonutChartWrapper data={analysisData.visitType} />

                    <div slot="table" class="w-full h-full flex flex-col pt-2">
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
                    on:toggleView={({ detail }) => isTableView.age = detail}
                >
                    <LineChart
                        data={ageDistributionChartData}
                        cohortColorMap={{ [cohortInfo.name]: SINGLE_DATA_COLOR }}
                        showLegend={false}
                        
                    />

                    <div slot="table" class="w-full h-full flex flex-col p-4">
                        <DataTable
                        data={transformLineChartToTableData(ageDistributionChartData)}
                        />
                    </div>
                </ChartCard>

                <ChartCard
                    title="Distribution of Visit Count"
                    description="The distribution of the total number of medical visits made by patients during the cohort period."
                    type="half"
                    hasTableView={true}
                    isTableView={isTableView.visitCount}
                    hasXButton={false}
                    on:toggleView={({ detail }) => isTableView.visitCount = detail}
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

                    <div slot="table" class="w-full h-full flex flex-col p-4">
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
                    description= "The list of the top 10 most frequently prescribed medications for patients in the cohort."
                    type="half"
                    hasTableView={true}
                    isTableView={isTableView.topTenDrugs}
                    hasXButton={false}
                    on:toggleView={({ detail }) => isTableView.topTenDrugs = detail}
                >
                    <BarChartWrapper
                    data={Object.entries(analysisData.topTenDrug).map(([name, count]) => ({ name, count }))}
                    cohortName={cohortInfo.name}
                    cohortTotalCount={cohortInfo.count}
                    />

                    <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
                        <BarChartTableView
                            data={Object.entries(analysisData.topTenDrug).map(([name, count]) => ({ name, count }))}
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
                    on:toggleView={({ detail }) => isTableView.topTenConditions = detail}
                >
                    <BarChartWrapper
                    data={Object.entries(analysisData.topTenCondition).map(([name, count]) => ({ name, count }))}
                    cohortName={cohortInfo.name}
                    cohortTotalCount={cohortInfo.count}
                    />
                
                    <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
                        <BarChartTableView
                            data={Object.entries(analysisData.topTenCondition).map(([name, count]) => ({ name, count }))}
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
                    on:toggleView={({ detail }) => isTableView.topTenProcedures = detail}
                >
                    <BarChartWrapper
                        data={Object.entries(analysisData.topTenProcedure).map(([name, count]) => ({ name, count }))}
                        cohortName={cohortInfo.name}
                        cohortTotalCount={cohortInfo.count}
                    />

                    <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
                        <BarChartTableView
                            data={Object.entries(analysisData.topTenProcedure).map(([name, count]) => ({ name, count }))}
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
                    on:toggleView={({ detail }) => isTableView.topTenMeasurements = detail}
                >
                    <BarChartWrapper
                        data={Object.entries(analysisData.topTenMeasurement).map(([name, count]) => ({ name, count }))}
                        cohortName={cohortInfo.name}
                        cohortTotalCount={cohortInfo.count}
                    />

                    <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
                        <BarChartTableView
                            data={Object.entries(analysisData.topTenMeasurement).map(([name, count]) => ({ name, count }))}
                            domainKey="measurement"
                            cohortName={cohortInfo.name}
                            cohortTotalCount={cohortInfo.count}
                        />
                    </div>
                </ChartCard>
            </div>
        </div>
    {/if}

</div>

<Footer />

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