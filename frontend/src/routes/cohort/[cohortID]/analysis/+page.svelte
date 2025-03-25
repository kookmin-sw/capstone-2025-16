<script>
    import { slide } from 'svelte/transition';
    import analysisData from '$lib/data/singleCohortAnalysisTest.json';
    import ChartCard from '$lib/components/ChartCard.svelte';
    import DonutChart from '$lib/components/Charts/DonutChart/DonutChart.svelte';
    import SingleDonutChartWrapper from '$lib/components/Charts/DonutChart/SingleDonutChartWrapper.svelte';

    let isExpanded = false;
    let activeTab = 'default'; // 탭 활성화 상태 관리

    function switchTab(tab) { // 탭을 바꿀 때 활성 탭 상태 변경 함수
        activeTab = tab;
    }

</script>

<div class="p-4">
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

    <h1 class="text-2xl font-bold mb-4">Charts</h1>
    <div class="w-full mb-5 border-b border-gray-300">
        <div class="flex">
            <button class="tab {activeTab === 'default' ? 'active' : ''}" on:click={() => switchTab('default')}>Default</button>
            <button class="tab {activeTab === 'customizable' ? 'active' : ''}" on:click={() => switchTab('customizable')}>Customizable</button>
        </div>
    </div>

    <!-- 차트 컨텐츠 -->
    {#if activeTab === 'default'}
        <div class="w-full">
            <div class="grid grid-cols-2 gap-4">
                <ChartCard title="Gender Ratio"
                    description="The ratio of genders within the cohort."
                    type='half'>
                    <SingleDonutChartWrapper data={analysisData.statistics.gender} />
                </ChartCard>
                <ChartCard title="Mortality"
                    description="The percentage of patients within the cohort who have died."
                    type='half'>
                    <SingleDonutChartWrapper data={analysisData.statistics.mortality} />
                </ChartCard>
                <ChartCard title="Visit Type Ratio"
                    description="The proportion of different types of medical visits (outpatient, inpatient, emergency room, etc.) that occurred during the cohort period."
                    type='half'>
                    <SingleDonutChartWrapper data={analysisData.statistics.visitType} />
                </ChartCard>
            </div>
        </div>
    {/if}

    {#if activeTab === 'customizable'}
        <div class="w-full">
            <div class="grid grid-cols-2 gap-4">
                customizable tab 화면
            </div>
        </div>
    {/if}
    
</div>


<style>
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
  