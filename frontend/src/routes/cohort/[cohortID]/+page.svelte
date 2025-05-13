<script>
    import analysisData from '$lib/data/singleCohortAnalysisTest.json';
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
    let featureData = $state({
        cohort_id: "",
        status: "",
        features: {
            features: [],
            total: 0,
            page: 0,
            limit: 100
        }
    });
    let analysisError = $state(null);
    let cohortID = $derived($page.params.cohortID); // URL에서 cohortID 추출
    
    // 로컬 스토리지 키
    const STORAGE_KEY = `cohort-${cohortID}-feature-analysis`;
    
    // 이전 분석 결과 로드
    let hasPreviousAnalysis = $state(false);
    let previousAnalysisTime = $state('');

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
            console.error("Failed to save analysis result to local storage:", e);
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
            console.error("Failed to load previous analysis from local storage:", e);
            hasPreviousAnalysis = false;
        }
    }

    function exportToCSV(data, filename) {
        if (!data || data.length === 0) {
            alert("No data to export.");
            return;
        }

        const headers = Object.keys(data[0]);
        const rows = data.map(row =>
            headers.map(field => `"${(row[field] ?? '').toString().replace(/"/g, '""')}"`).join(',')
        );

        const csvContent = [headers.join(','), ...rows].join('\r\n');

        // BOM 추가 (엑셀 한글 깨짐 방지)
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
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
            console.error("Failed to check previous analysis:", e);
        }
    });

    // SHAP 분석 시작 함수 (백엔드 연동 필요)
    async function startAnalysis() {
        analysisStarted = true;
        isLoading = true;
        featureData = {
            cohort_id: "",
            status: "",
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
            analysisError = "Comparison group size must be a positive integer greater than or equal to 1.";
            isLoading = false;
            return;
        }

        try {
            // 임시 비동기 처리 및 더미 데이터 설정
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 딜레이 시뮬레이션
            
            // 테스트 데이터 설정
            featureData = {
                cohort_id: "0196815f-1e2d-7db9-b630-a747f8393a2d",
                status: "completed",
                features: {
                    features: [
                        {
                            cohort_id: "0196815f-1e2d-7db9-b630-a747f8393a2d",
                            multiple: "30",
                            domain_name: "Condition",
                            rank: "1",
                            concept_id: "197320",
                            concept_name: "Acute kidney injury",
                            influence: 59.25,
                            execution_time: "2024-03-20 12:00:00",
                            avg_f1_score: 0.7245
                        },
                        {
                            cohort_id: "0196815f-1e2d-7db9-b630-a747f8393a2d",
                            multiple: "30",
                            domain_name: "Procedure",
                            rank: "1",
                            concept_id: "433753",
                            concept_name: "Arteriosclerosis",
                            influence: 18.26,
                            execution_time: "2024-03-20 12:00:00",
                            avg_f1_score: 0.7245
                        },
                        {
                            cohort_id: "0196815f-1e2d-7db9-b630-a747f8393a2d",
                            multiple: "30",
                            domain_name: "Condition",
                            rank: "2",
                            concept_id: "433753",
                            concept_name: "Arteriosclerosis",
                            influence: 18.26,
                            execution_time: "2024-03-20 12:00:00",
                            avg_f1_score: 0.7245
                        },
                        
                        {
                            cohort_id: "0196815f-1e2d-7db9-b630-a747f8393a2d",
                            multiple: "30",
                            domain_name: "Procedure",
                            rank: "2",
                            concept_id: "4021323",
                            concept_name: "Initial observation care, per day, for the evaluation and management of a patient which requires these 3 key components: A detailed or comprehensive history; A detailed or comprehensive examination; and Medical decision making that is straightforward or standard",
                            influence: 56.74,
                            execution_time: "2024-03-20 12:00:00",
                            avg_f1_score: 0.8245
                        },
                        {
                            cohort_id: "0196815f-1e2d-7db9-b630-a747f8393a2d",
                            multiple: "30",
                            domain_name: "Procedure",
                            rank: "3",
                            concept_id: "2514402",
                            concept_name: "Initial observation care, per day, for the evaluation and management of a patient which requires these 3 key components: A detailed or comprehensive history; A detailed or comprehensive examination; and Medical decision making that is straightforward or standard",
                            influence: 22.34,
                            execution_time: "2024-03-20 12:00:00",
                            avg_f1_score: 0.8245
                        }
                    ],
                    total: 150,
                    page: 0,
                    limit: 100
                }
            };
            
            // 분석 결과 저장
            saveAnalysisResult(featureData);
            hasPreviousAnalysis = true;
            previousAnalysisTime = formatDateTime(new Date().getTime());

        } catch (error) {
            console.error("SHAP analysis error:", error);
            analysisError = error.message || "An unexpected error occurred while running SHAP analysis. Please try again later.";
            featureData = {
                cohort_id: "",
                status: "",
                features: {
                    features: [],
                    total: 0,
                    page: 0,
                    limit: 100
                }
            }; // 에러 발생 시 기존 결과 초기화
        } finally {
            isLoading = false;
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
                    <span class="text-sm text-black-500">{analysisData.basicInfo.id}</span>
                </div>
                <div class="text-blue-600 font-medium">{analysisData.basicInfo.name}</div>
                <span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                    {analysisData.totalPatients}
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
                    <p class="font-medium">{analysisData.basicInfo.author.name} ({analysisData.basicInfo.author.department})</p>
                </div>
                <div>
                    <p class="text-gray-500">Created at</p>
                    <p class="font-medium">{new Date(analysisData.basicInfo.createdAt).toLocaleString()}</p>
                </div>
                <div class="col-span-2">
                    <p class="text-gray-500">Description</p>
                    <p class="font-medium">{analysisData.basicInfo.description}</p>
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
                
                {#if hasPreviousAnalysis && !analysisStarted}
                    <button
                        onclick={loadPreviousAnalysis}
                        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-sm flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Load Previous Analysis
                    </button>
                {/if}
            </div>
            
            {#if hasPreviousAnalysis && !analysisStarted}
                <div class="mt-2">
                    <p class="text-xs text-gray-500">Previous analysis available from {previousAnalysisTime}</p>
                </div>
            {/if}

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

            {#if !isLoading && !analysisError && featureData.features.features.length > 0}
                <div class="mt-8">
                    <div class="flex justify-between items-center mb-1">
                        {#if featureData.features.features[0].multiple > 0}
                          <span class="text-sm text-gray-600">
                            <span class="text-gray-500">Comparison Size (people): </span>
                            <span class="text-zinc-700 font-medium">{analysisData.totalPatients * featureData.features.features[0].multiple}</span>
                            <span class="text-zinc-700 font-medium"> ({featureData.features.features[0].multiple} x {analysisData.totalPatients})</span>
                          </span>
                        {:else}
                          <span></span>
                        {/if}
                      
                        {#if featureData.features.features[0].execution_time}
                          <span class="text-sm text-gray-500">
                            <span class="text-gray-500">Execution Time: </span>
                            <span class="text-zinc-700 font-medium">{featureData.features.features[0].execution_time}</span>
                          </span>
                        {/if}
                    </div>
                      
                    <div class="flex justify-start items-center mb-5 gap-3">
                        {#if featureData.features.features.find(f => f.domain_name === 'Condition')}
                            <span class="text-sm text-gray-600">
                                <span class="text-gray-500">Condition Model F1 Score: </span>
                                <span class="text-zinc-700 font-medium">{featureData.features.features.find(f => f.domain_name === 'Condition').avg_f1_score}</span>
                            </span>
                        {/if}
                        {#if featureData.features.features.find(f => f.domain_name === 'Procedure')}
                            <span class="text-sm text-gray-500">|</span>
                            <span class="text-sm text-gray-600">
                                <span class="text-gray-500">Procedure Model F1 Score: </span>
                                <span class="text-zinc-700 font-medium">{featureData.features.features.find(f => f.domain_name === 'Procedure').avg_f1_score}</span>
                            </span>
                        {/if}
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Procedure Column -->
                        <div>
                            <div class="flex justify-between items-center mb-2">
                                <h4 class="text-sm font-semibold text-gray-700">Procedure</h4>
                                <button 
                                    title="Download CSV"
                                    aria-label="export csv"
                                    class="p-1.5 rounded-full hover:bg-green-50 text-gray-400 hover:text-green-500 transition-colors"
                                    onclick={() => exportToCSV(featureData.features.features.filter(f => f.domain_name === 'Procedure'), 'procedure_features.csv')}
                                >
                                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                </button>
                            </div>
                            {#if featureData.features.features.filter(f => f.domain_name === 'Procedure').length > 0}
                                <div class="border rounded-lg overflow-hidden shadow-sm">
                                    <table class="min-w-full divide-y divide-gray-200 text-xs">
                                        <thead class="bg-gray-50 sticky top-0 z-10">
                                            <tr>
                                                <th scope="col" class="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                                <th scope="col" class="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Concept Id</th>
                                                <th scope="col" class="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Concept Name</th>
                                                <th scope="col" class="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Influence</th>
                                            </tr>
                                        </thead>
                                        <tbody class="bg-white divide-y divide-gray-200">
                                            {#each featureData.features.features.filter(f => f.domain_name === 'Procedure') as feature}
                                                <tr>
                                                    <td class="px-3 py-1.5 whitespace-nowrap text-gray-500">{feature.rank}</td>
                                                    <td class="px-3 py-1.5 whitespace-nowrap text-gray-500">{feature.concept_id}</td>
                                                    <td class="px-3 py-1.5 text-gray-700 font-medium truncate max-w-[200px]" title={feature.concept_name}>
                                                        {feature.concept_name}
                                                    </td>  
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
                            <div class="flex justify-between items-center mb-2">
                                <h4 class="text-sm font-semibold text-gray-700">Condition</h4>
                                <button 
                                    title="Download CSV"
                                    aria-label="export csv"
                                    class="p-1.5 rounded-full hover:bg-green-50 text-gray-400 hover:text-green-500 transition-colors"
                                    onclick={() => exportToCSV(featureData.features.features.filter(f => f.domain_name === 'Condition'), 'condition_features.csv')}
                                >
                                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                </button>
                            </div>
                            {#if featureData.features.features.filter(f => f.domain_name === 'Condition').length > 0}
                                <div class="border rounded-lg overflow-hidden shadow-sm">
                                    <table class="min-w-full divide-y divide-gray-200 text-xs">
                                        <thead class="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th scope="col" class="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                            <th scope="col" class="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Concept Id</th>
                                            <th scope="col" class="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Concept Name</th>
                                            <th scope="col" class="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Influence</th>
                                        </tr>
                                        </thead>
                                        <tbody class="bg-white divide-y divide-gray-200">
                                            {#each featureData.features.features.filter(f => f.domain_name === 'Condition') as feature}
                                                <tr>
                                                    <td class="px-3 py-1.5 whitespace-nowrap text-gray-500">{feature.rank}</td>
                                                    <td class="px-3 py-1.5 whitespace-nowrap text-gray-500">{feature.concept_id}</td>
                                                    <td class="px-3 py-1.5 text-gray-700 font-medium truncate max-w-[200px]" title={feature.concept_name}>
                                                        {feature.concept_name}
                                                    </td>                                                    
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
                    <SingleDonutChartWrapper data={analysisData.statistics.gender} />

                    <div slot="table" class="w-full h-full flex flex-col pt-2">
                        <DataTable data={transformDonutChartToTableData({
                            cohortName: analysisData.basicInfo.name,
                            data: analysisData.statistics.gender,
                            totalPatients: analysisData.totalPatients
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
                    <SingleDonutChartWrapper data={analysisData.statistics.mortality} />

                    <div slot="table" class="w-full h-full flex flex-col pt-2">
                        <DataTable
                        data={transformDonutChartToTableData({
                            cohortName: analysisData.basicInfo.name,
                            data: analysisData.statistics.mortality,
                            totalPatients: analysisData.totalPatients
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
                    <SingleDonutChartWrapper data={analysisData.statistics.visitType} />

                    <div slot="table" class="w-full h-full flex flex-col pt-2">
                        <DataTable
                        data={transformDonutChartToTableData({
                            cohortName: analysisData.basicInfo.name,
                            data: analysisData.statistics.visitType,
                            totalPatients: analysisData.totalPatients
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
                        data={AGE_GROUPS.map(label => ({
                            label,
                            value: analysisData.statistics.age[label] ?? 0,
                            series: analysisData.basicInfo.name
                        }))}
                        cohortColorMap={{ [analysisData.basicInfo.name]: SINGLE_DATA_COLOR }}
                        showLegend={false}
                    />

                    <div slot="table" class="w-full h-full flex flex-col p-4">
                        <DataTable
                        data={transformLineChartToTableData(
                            AGE_GROUPS.map(label => ({
                            label,
                            value: analysisData.statistics.age[label] ?? 0,
                            series: analysisData.basicInfo.name
                            }))
                        )}
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
                        data={Object.entries(analysisData.statistics.visitCount).map(([count, value]) => ({
                        label: count,
                        value: value,
                        series: analysisData.basicInfo.name
                        }))}
                        cohortColorMap={{ [analysisData.basicInfo.name]: SINGLE_DATA_COLOR }}
                        showLegend={false}
                    />

                    <div slot="table" class="w-full h-full flex flex-col p-4">
                        <DataTable
                            data={transformLineChartToTableData(
                                Object.entries(analysisData.statistics.visitCount).map(([count, value]) => ({
                                label: count,
                                value: value,
                                series: analysisData.basicInfo.name
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
                    data={Object.entries(analysisData.statistics.topTenDrugs).map(([name, count]) => ({ name, count }))}
                    cohortName={analysisData.basicInfo.name}
                    cohortTotalCount={analysisData.totalPatients}
                    />

                    <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
                        <BarChartTableView
                            data={Object.entries(analysisData.statistics.topTenDrugs).map(([name, count]) => ({ name, count }))}
                            domainKey="drug"
                            cohortName={analysisData.basicInfo.name}
                            cohortTotalCount={analysisData.totalPatients}
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
                    data={Object.entries(analysisData.statistics.topTenConditions).map(([name, count]) => ({ name, count }))}
                    cohortName={analysisData.basicInfo.name}
                    cohortTotalCount={analysisData.totalPatients}
                    />
                
                    <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
                        <BarChartTableView
                            data={Object.entries(analysisData.statistics.topTenConditions).map(([name, count]) => ({ name, count }))}
                            domainKey="condition"
                            cohortName={analysisData.basicInfo.name}
                            cohortTotalCount={analysisData.totalPatients}
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
                        data={Object.entries(analysisData.statistics.topTenProcedures).map(([name, count]) => ({ name, count }))}
                        cohortName={analysisData.basicInfo.name}
                        cohortTotalCount={analysisData.totalPatients}
                    />

                    <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
                        <BarChartTableView
                            data={Object.entries(analysisData.statistics.topTenProcedures).map(([name, count]) => ({ name, count }))}
                            domainKey="procedure"
                            cohortName={analysisData.basicInfo.name}
                            cohortTotalCount={analysisData.totalPatients}
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
                        data={Object.entries(analysisData.statistics.topTenMeasurements).map(([name, count]) => ({ name, count }))}
                        cohortName={analysisData.basicInfo.name}
                        cohortTotalCount={analysisData.totalPatients}
                    />

                    <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
                        <BarChartTableView
                            data={Object.entries(analysisData.statistics.topTenMeasurements).map(([name, count]) => ({ name, count }))}
                            domainKey="measurement"
                            cohortName={analysisData.basicInfo.name}
                            cohortTotalCount={analysisData.totalPatients}
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