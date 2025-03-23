<script>
	import { onMount } from "svelte";
	import ChartCard from "$lib/components/ChartCard.svelte";
	import BarChartHorizontal from "../../lib/components/BarChart_horizontal.svelte";
	import BarChartVertical from "../../lib/components/Charts/BarChart_vertical.svelte";
    import DonutChart from "$lib/components/Charts/DonutChart.svelte";
    import { tick } from "svelte";
    import { slide } from 'svelte/transition';

	let topTenDrugData = [];
	let patientAgeData = [];
    let genderData = {};
    let deathRatioData = {};

    // 각 코호트의 열림/닫힘 상태를 추적하기 위한 배열
    let expandedStates = [false, false, false];

    let activeTab = 'overview'; // 'overview' 또는 'customized'
    
    // 토글 함수
    async function toggleExpand(index) {
        await tick();
        expandedStates[index] = !expandedStates[index];
        expandedStates = [...expandedStates];
    }

    function switchTab(tab) {
        activeTab = tab;
    }

    // API에서 데이터를 로드하는 함수
    async function loadData() {
        try {
            const [topTenDrugRes, patientAgeRes, genderRes, deathRatioRes] = await Promise.all([
                fetch("/api/chartdata/topTenDrug"),
                fetch("/api/chartdata/patientAge"),
                fetch("/api/chartdata/gender"),
                fetch("/api/chartdata/deathRatio")
            ]);

            if (!topTenDrugRes.ok || !patientAgeRes.ok || !genderRes.ok || !deathRatioRes.ok) {
                throw new Error("데이터 로드 실패");
            }

            topTenDrugData = await topTenDrugRes.json();
            patientAgeData = await patientAgeRes.json();
            genderData = await genderRes.json();
            deathRatioData = await deathRatioRes.json();
        } catch (error) {
            console.error("❌ 데이터 로딩 에러:", error);
        }
    }
    
	// 데이터 불러오기
    onMount(loadData);

</script>

<style>
	.page-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 30px;
		width: 100%; /* 부모 컨테이너가 화면 전체 너비 사용 */
        max-width: 1000px;
		padding-top: 40px;
		padding-bottom: 70px;
		margin: 0 auto; /* 중앙 정렬 */
        
	}

	.title {
		font-size: 28px;
		font-weight: bold;
		text-align: center;
		margin-bottom: 0px;
	}

	.description {
		font-size: 16px;
		color: #555;
		text-align: center;
		margin-bottom: 20px;
	}

    .chart-row {
        display: flex;
        justify-content: center;
        align-items: stretch;
        gap: 20px;
        margin: 0 auto;
        width: 100%;
        max-width: 1000px;
        flex-wrap: wrap;
    }

    /* 768px 이하일 때 적용되는 스타일 */
    @media (max-width: 768px) {
        .chart-row {
            flex-direction: column; /* 세로 방향으로 변경 */
            align-items: center;
            width: 100%;
        }

        .chart-row :global(> *) {
            width: 100% !important;
            max-width: 500px;
        }
    }

    .tab-container {
        border-bottom: 1px solid #e5e7eb;
        margin-bottom: 2rem;
    }
    
    .tab {
        padding: 0.75rem 1.5rem;
        margin-right: 1rem;
        cursor: pointer;
        border-bottom: 2px solid transparent;
    }
    
    .tab.active {
        border-bottom: 2px solid #000;
        font-weight: 500;
    }

</style>

<div class="page-container">     
<!-- 코호트 제목 -->
<div class="title">Cohort Analysis Report</div>
<!-- 설명 -->
<div class="description">
    This cohort was selected to evaluate the effectiveness of ESA (Erythropoiesis-Stimulating Agent) therapy in patients with anemia due to renal failure.
    The charts below visualize the results of cohort analysis data. Each item is generated based on the data, providing various statistics depending on the chart type.
</div>

    <!-- Available Cohorts 섹션 -->
    <div class="w-full max-w-4xl mb-8">
        <h3 class="text-lg font-semibold mb-4">Available Cohorts</h3>
        <div class="space-y-3">
            {#each [1, 2, 3] as cohortId, index}
                <div class="border rounded-lg overflow-hidden">
                    <button 
                        class="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                        on:click={() => toggleExpand(index)}
                    >
                        <div class="flex items-center gap-4">
                            <div class="text-blue-600 font-medium">Control Group {cohortId}</div>
                            <span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">150,000</span>
                            <span class="text-sm text-gray-500">Updated: 2023-12-09</span>
                        </div>
                        <svg 
                            class="w-5 h-5 transform transition-transform {expandedStates[index] ? 'rotate-180' : ''}" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    
                    {#if expandedStates[index]}
                        <div class="p-4 border-t" transition:slide>
                            <div class="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p class="text-gray-500">ID</p>
                                    <p class="font-medium">app73501_{cohortId}</p>
                                </div>
                                <div>
                                    <p class="text-gray-500">Author</p>
                                    <p class="font-medium">John Doe</p>
                                </div>
                                <div>
                                    <p class="text-gray-500">Created at</p>
                                    <p class="font-medium">2023-12-09 18:43:31</p>
                                </div>
                                <div>
                                    <p class="text-gray-500">Updated at</p>
                                    <p class="font-medium">2023-12-10 09:15:22</p>
                                </div>
                                <div class="col-span-2">
                                    <p class="text-gray-500">Description</p>
                                    <p class="font-medium">Detailed analysis of control group patients with specific characteristics and treatment patterns.</p>
                                </div>
                                <div class="col-span-2 pt-2">
                                    <div class="flex gap-4">
                                        <button class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                            View Full Analysis
                                        </button>
                                        <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                                            Export Data
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>

    <!-- 탭 메뉴 -->
    <div class="tab-container w-full max-w-4xl">
        <div class="flex">
            <button 
                class="tab {activeTab === 'overview' ? 'active' : ''}"
                on:click={() => switchTab('overview')}
            >
                overview
            </button>
            <button 
                class="tab {activeTab === 'customized' ? 'active' : ''}"
                on:click={() => switchTab('customized')}
            >
                customized
            </button>
        </div>
    </div>

    <!-- 탭 컨텐츠 -->
    {#if activeTab === 'overview'}
        <!-- Overview 탭 컨텐츠 -->
        <div class="grid grid-cols-3 gap-4 w-full max-w-4xl mb-8">
            <ChartCard
                title="Gender"
                description="The number of people in this cohort stratified by gender."
                type="third">
                <DonutChart data={genderData} />
            </ChartCard>

            <ChartCard
                title="Death Ratio"
                description="The number of people in this cohort stratified by death ratio."
                type="third">
                <DonutChart data={deathRatioData}/>
            </ChartCard>
            
            <ChartCard
                title="Visit Type"
                description="The number of people in this cohort stratified by visit type."
                type="third">
                <DonutChart data={deathRatioData}/>
            </ChartCard>
        </div>

        <ChartCard
            title="Distribution by First Occurrence Age"
            class="w-full max-w-4xl">
            {#if patientAgeData.length > 0}
                <BarChartVertical data={patientAgeData} />
            {:else}
                <p>Loading chart...</p>
            {/if}
        </ChartCard>
    {:else}
        <!-- Customized 탭 컨텐츠 -->
        <div class="w-full max-w-4xl space-y-6">
            <ChartCard
                title="Top 10 Prescribed in Target Group"
                description="The top 10 most prescribed medications within the cohort.">
                {#if topTenDrugData.length > 0}
                    <BarChartHorizontal data={topTenDrugData} />
                {:else}
                    <p>Loading chart...</p>
                {/if}
            </ChartCard>
            <ChartCard
                title="Top 10 Condition in Target Group"
                description="The top 10 conditions within the cohort.">
                {#if topTenDrugData.length > 0}
                    <BarChartHorizontal data={topTenDrugData} />
                {:else}
                    <p>Loading chart...</p>
                {/if}
            </ChartCard>
            <ChartCard
                title="Top 10 Procedure in Target Group"
                description="The top 10 procedures within the cohort.">
                {#if topTenDrugData.length > 0}
                    <BarChartHorizontal data={topTenDrugData} />
                {:else}
                    <p>Loading chart...</p>
                {/if}
            </ChartCard>
            <ChartCard
                title="Top 10 Measurement in Target Group"
                description="The top 10 measurement within the cohort.">
                {#if topTenDrugData.length > 0}
                    <BarChartHorizontal data={topTenDrugData} />
                {:else}
                    <p>Loading chart...</p>
                {/if}
            </ChartCard>
        </div>
    {/if}
</div>
    