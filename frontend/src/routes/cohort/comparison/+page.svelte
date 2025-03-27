<script>
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import ChartCard from "$lib/components/ChartCard.svelte";
  import BarChartHorizontal from "$lib/components/Charts/BarChart_horizontal.svelte";
  import BarChartVertical from "$lib/components/Charts/BarChart_vertical.svelte";
	import GroupDonutChartWrapper from "$lib/components/Charts/DonutChart/GroupDonutChartWrapper.svelte";
  import { tick } from "svelte";
  import { slide } from 'svelte/transition';
  import * as d3 from 'd3';
  import cohortStats from '$lib/data/cohortStats.json';
  import DataTable from '$lib/components/DataTable.svelte';
  import LineChart from "$lib/components/Charts/LineChart.svelte";
  import { transformLineChartToTableData } from "$lib/utils/dataTransformers/lineChartTransformer.js";
  import { transformDonutChartToTableData } from "$lib/utils/dataTransformers/donutChartTransformer.js";
  import { transformTopTenData } from "$lib/components/Charts/StackedBarChart/utils/topTenChartTransformer.js";
  import StackedBarChartWrapper from "$lib/components/Charts/StackedBarChart/StackedBarChartWrapper.svelte";
  import StackedBarChartTableView from "$lib/components/Charts/StackedBarChart/StackedBarChartTableView.svelte";
  
  // 코호트 데이터
  let selectedCohorts = []; // 선택된 코호트들 ID 배열
  let cohortData = []; // 코호트 데이터
  let expandedStates = []; // 코호트 목록 toggle 펼치거나 접기 위한 상태 배열
  let selectedForDeletion = {}; // 삭제할 코호트를 체크박스로 선택할 때 상태 관리
  
  // 탭 관련
  let activeTab = 'default'; // 탭 활성화 상태 관리
  let selectItems = [ // default 차트에서 차트 선택 박스
    {id: 0, name: 'Gender Ratio', checked: true},
    {id: 1, name: 'Mortality', checked: true},
    {id: 2, name: 'Visit Type Ratio', checked: true},
    {id: 3, name: 'Distribution of First Occurrence Age', checked: true},
    {id: 4, name: 'Distribution of Visit Count', checked: true},
    {id: 5, name: 'Top 10 Conditions', checked: true},
    {id: 6, name: 'Top 10 Procedures', checked: true},
    {id: 7, name: 'Top 10 Procedures', checked: true},
    {id: 8, name: 'Top 10 Measurements', checked: true},
  ]

  let isSelectChartOpen = false; // 차트 선택 드롭다운 메뉴 상태 관리
  let selectChartRef; // 드롭다운 메뉴의 참조를 저장할 변수
  
  // 차트 데이터
  let genderChartData = [];
  let mortalityChartData = [];
  let visitTypeChartData = [];
  let ageDistributionChartData = [];
  let visitCountChartData = [];
  let stackedDrugsData = [];
  let stackedConditionsData = [];
  let stackedMeasurementsData = [];
  let stackedProceduresData = [];

  let topTenDrugViewType = 'combined';
  let topTenConditionViewType = 'combined';
  let topTenProcedureViewType = 'combined';
  let topTenMeasurementViewType = 'combined';

  let cohortTotalCounts = {};
  
  let selectedCohortStates = {
    drugs: '',
    conditions: '',
    procedures: '',
    measurements: '',
  };

  let chartData = {
    drugs: [],
    conditions: [],
    procedures: [],
    measurements: []
  }

  $: if(selectedCohorts.length > 0){
    stackedDrugsData = prepareStackedDomainData('drug');
    stackedConditionsData = prepareStackedDomainData('condition');
    stackedMeasurementsData = prepareStackedDomainData('measurement');
    stackedProceduresData = prepareStackedDomainData('procedure');
  }

  $: cohortTotalCounts = Object.fromEntries(
    selectedCohorts.map(cohortId => [
      cohortStats[cohortId].basicInfo.name,
      cohortStats[cohortId].totalPatients
    ])
  );

  // DonutChart와 동일한 색상 매핑 사용
  const color = d3
    .scaleOrdinal()
    .domain(["Male", "Female", "Unknown"])
    .range(["#3498db", "#F9A7B0", "#808080"]);

  const drugTableHeaders = [
    {key: 'rank', label: 'Rank'},
    {key: 'name', label: 'Name'},
    {key: 'count', label: 'Count'}
  ]

  const COHORT_COLORS = [
    "#2977b7",
    "#eda946",
    "#d45836",
    "#fac2ad",
    "#77722e",
  ]

  let cohortColorMap = {};

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

  onMount(async () => {
    const cohortIds = $page.url.searchParams.get('cohorts')?.split(',') || [];
    selectedCohorts = cohortIds;
    expandedStates = new Array(cohortIds.length).fill(false);

    try {
      cohortData = loadCohortListData(cohortStats, cohortIds);

      if (selectedCohorts.length > 0) {
        // 코호트별 색상 매핑 초기화
        cohortColorMap = Object.fromEntries(
          selectedCohorts.map((cohortId, index) => [
            cohortStats[cohortId].basicInfo.name,
            COHORT_COLORS[index % COHORT_COLORS.length]
          ])
        );

        genderChartData = await loadGenderData();
        mortalityChartData = await loadMortalityData();
        visitTypeChartData = await loadVisitTypeData();
        ageDistributionChartData = await loadAgeDistributionData();
        visitCountChartData = await loadVisitCountData();

        // 각 차트별로 초기 코호트 선택 설정
        Object.keys(selectedCohortStates).forEach(chartType => {
          if (!selectedCohortStates[chartType]) {
            selectedCohortStates[chartType] = selectedCohorts[0];
          }
        });

        // 각 차트별 데이터 초기화
        chartData.drugs = selectedCohorts.map(cohortId => ({
          cohortName: cohortStats[cohortId].basicInfo.name,
          drugs: Object.entries(cohortStats[cohortId].statistics.topTenDrugs)
            .map(([name, count], index) => ({
              rank: index + 1,
              name,
              count
            }))
        }));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  });

  function loadCohortListData(cohortStats, selectedCohortIds) {
    return selectedCohortIds.map(id => ({
      id: id,
      name: cohortStats[id].basicInfo.name,
      description: cohortStats[id].basicInfo.description,
      author: cohortStats[id].basicInfo.author.name,
      createdAt: cohortStats[id].basicInfo.createdAt,
      updatedAt: cohortStats[id].basicInfo.updatedAt,
      totalPatients: cohortStats[id].totalPatients
    }))
  }

  async function toggleExpand(index) { // 코호트 목록 toggle 펼치거나 접기 위한 함수
    await tick();
    expandedStates[index] = !expandedStates[index];
    expandedStates = [...expandedStates];
  }

  function handleDelete() { // 체크박스 선택한 코호트 삭제 함수
    const newCohortData = cohortData.filter(cohort => !selectedForDeletion[cohort.id]);
    cohortData = newCohortData;
    selectedForDeletion = {};
  }

  function switchTab(tab) { // 탭을 바꿀 때 활성 탭 상태 변경 함수
    activeTab = tab;
  }

  function toggleSelectChart() { // Select Chart 드롭다운 메뉴의 상태(열림/닫힘) 변경 함수
    isSelectChartOpen = !isSelectChartOpen;
  }
  
  function handleChartClose(event) { // 차트를 끌 때 Select Chart 드롭다운 메뉴의 체크박스 상태도 해제
    const chartId = event.detail.id;
    selectItems = selectItems.map(item => {
      if (item.id === chartId) {
        return { ...item, checked: false };
      }
      return item;
    });
  }

  function handleCheckboxChange(item) { // Select Chart 드롭다운 메뉴에서 체크박스 상태 변경 함수
    item.checked = !item.checked;
    selectItems = selectItems; // Svelte 반응성을 위한 재할당
  }

  function handleClickOutside(event) { // Select Chart 드롭다운 메뉴 바깥 클릭 시 메뉴 닫히도록 하는 함수
    if (isSelectChartOpen && selectChartRef && !selectChartRef.contains(event.target)) {
      isSelectChartOpen = false;
    }
  }

  async function loadGenderData() {
    try {
      const data = selectedCohorts.map((cohortId) => ({
            data: cohortStats[cohortId].statistics.gender,
            cohortName: cohortStats[cohortId].basicInfo.name,
            totalPatients: cohortStats[cohortId].totalPatients
        }));
        return data;
    } catch (error) {
      console.error('Error loading gender data:', error);
      return [];
    }
  }

  async function loadMortalityData() {
  try {
    const mortalityData = selectedCohorts.map((cohortId) => ({
      data: cohortStats[cohortId].statistics.mortality,
      cohortName: cohortStats[cohortId].basicInfo.name,
      totalPatients: cohortStats[cohortId].totalPatients
    }));
    return mortalityData;
  } catch (error) {
      console.error('Error loading mortality data:', error);
      return [];
    }
  }

  async function loadVisitTypeData() {
  try {
    const visitData = selectedCohorts.map((cohortId) => ({
      data: cohortStats[cohortId].statistics.visitType,
      cohortName: cohortStats[cohortId].basicInfo.name,
      totalPatients: cohortStats[cohortId].totalPatients
    }));
    return visitData;
  } catch (error) {
      console.error('Error loading visit type data:', error);
      return [];
    }
  }

  async function loadAgeDistributionData() {
  try {
    const ageData = [];
    const ageGroups = [
      "0-9", "10-19", "20-29", "30-39", "40-49", 
      "50-59", "60-69", "70-79", "80-89", "90-99",
      "100-109", "110-119", "120+"
    ];
    
    selectedCohorts.forEach((cohortId) => {
      const cohortName = cohortStats[cohortId].basicInfo.name;
      ageGroups.forEach(ageGroup => {
        ageData.push({
          label: ageGroup,
          value: cohortStats[cohortId].statistics.age[ageGroup],
          series: cohortName
        });
      });
    });
    
    return ageData;
  } catch (error) {
      console.error('Error loading age distribution data:', error);
      return [];
    }
  }

  async function loadVisitCountData() {
  try {
    const visitData = [];
    selectedCohorts.forEach((cohortId) => {
      const cohortName = cohortStats[cohortId].basicInfo.name;
      Object.entries(cohortStats[cohortId].statistics.visitCount).forEach(([count, value]) => {
        visitData.push({
          label: count,
          value: value,
          series: cohortName
        });
      });
    });
    return visitData;
  } catch (error) {
      console.error('Error loading visit count data:', error);
      return [];
    }
  }

  function prepareStackedDomainData(domainKey) {
    const result = [];
    const statsFieldMap = {
      'condition': 'topTenConditions',
      'drug': 'topTenDrugs',
      'procedure': 'topTenProcedures',
      'measurement': 'topTenMeasurements'
    };
    const statsField = statsFieldMap[domainKey];

    selectedCohorts.forEach(cohortId => {
      const cohortName = cohortStats[cohortId].basicInfo.name;

      Object.entries(cohortStats[cohortId].statistics[statsField])
        .forEach(([domainName, count]) => {
          result.push({
            cohort: cohortName,
            [domainKey]: domainName,
            count: count
          });
        });
    });

    return result;
  }

  function getViewOptions(domainKey) {
    // 기본 Combined View 옵션
    const options = [
      { id: 'combined', name: 'Combined Cohorts View' }
    ];
    
    // 각 코호트별 Anchor View 옵션 추가
    selectedCohorts.forEach(cohortId => {
      const cohortName = cohortStats[cohortId].basicInfo.name;
      options.push({
        id: cohortName,
        name: `${cohortName} View`
      });
    });
    
    return options;
  }

  function handleViewTypeChange(event) {
  const { chartId, optionId } = event.detail;
  
  switch (chartId) {
    case 5:  // Top 10 Drugs
      topTenDrugViewType = optionId;
      break;
    case 6:  // Top 10 Conditions
      topTenConditionViewType = optionId;
      break;
    case 7:  // Top 10 Procedures
      topTenProcedureViewType = optionId;
      break;
    case 8:  // Top 10 Measurements
      topTenMeasurementViewType = optionId;
      break;
  }
}

</script>

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

<div class="flex flex-col items-center w-full max-w-10xl mx-auto py-10 px-4">
  <!-- 제목 섹션 -->
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-center">Cohort Comparison Analysis</h1>
    <p class="text-gray-600 text-center mt-2">
      Selected cohorts are analyzed and compared based on various metrics.
    </p>
  </div>

  <!-- Selected Cohorts 섹션 -->
  <div class="w-full mb-8">
    <div class="flex items-center justify-between gap-2">
        <h3 class="text-2xl font-bold mb-4">Selected Cohorts</h3>
    
        <div class="flex items-right justify-end gap-2">
            <button class="px-4 py-2 text-sm font-medium text-white bg-green-500 bg-opacity-80 hover:bg-green-600 bg-opacity-100 rounded-md transition-colors mb-4"
            on:click={() => { } }>Add</button>
            <button class="px-4 py-2 text-sm font-medium text-white bg-red-500 bg-opacity-80 hover:bg-red-600 bg-opacity-100 rounded-md transition-colors mb-4"
            on:click={handleDelete}>Delete</button>
        </div>
    </div>

    <div class="space-y-3">
      {#each cohortData as cohort, index}
        <div class="border rounded-lg overflow-hidden">
          <button 
            class="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            on:click={() => toggleExpand(index)}
          >
            <div class="flex items-center gap-6">
              <svg 
                class="w-5 h-5 transform transition-transform {expandedStates[index] ? 'rotate-180' : ''}" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
              <div class="flex items-center gap-4">
                <div class="font-medium">
                  <span class="text-sm text-gray-400">ID  </span>
                  <span class="text-sm text-black-500">{cohort.id}</span>
                </div>
                
                <div class="text-blue-600 font-medium">{cohort.name}</div>
                <span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">{cohort.totalPatients}</span>
                <span class="text-sm text-gray-500">Updated: {cohort.updatedAt}</span>
              </div>
            </div>
            
            <input
              type="checkbox"
              class="w-4 h-4 cursor-pointer"
              bind:checked={selectedForDeletion[cohort.id]}
              on:click|stopPropagation
            />
          </button>
          
          {#if expandedStates[index]}
            <div class="p-4 border-t" transition:slide>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-gray-500">ID</p>
                  <p class="font-medium">{cohort.id}</p>
                </div>
                <div>
                  <p class="text-gray-500">Author</p>
                  <p class="font-medium">{cohort.author}</p>
                </div>
                <div>
                  <p class="text-gray-500">Created at</p>
                  <p class="font-medium">{cohort.createdAt}</p>
                </div>
                <div>
                  <p class="text-gray-500">Updated at</p>
                  <p class="font-medium">{cohort.updatedAt}</p>
                </div>
                <div class="col-span-2">
                  <p class="text-gray-500">Description</p>
                  <p class="font-medium">{cohort.description}</p>
                </div>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
  
  
  <div class="w-full mt-8">
    <div class="flex items-center justify-between gap-2">
        <h3 class="text-2xl font-bold mb-4">Charts</h3>
    </div>
  </div>

  <!-- Charts 섹션 -->
  <div class="w-full">
    <!-- 탭 메뉴 -->
    <div class="w-full mb-5 border-b border-gray-300">
      <div class="flex">
        <button 
          class="tab {activeTab === 'default' ? 'active' : ''}"
          on:click={() => switchTab('default')}
        >
          Default
        </button>
        <button 
          class="tab {activeTab === 'customizable' ? 'active' : ''}"
          on:click={() => switchTab('customizable')}
        >
          Customizable
        </button>
      </div>
    </div>

    <!-- 차트 컨텐츠 -->
    {#if activeTab === 'default'}
      <div class="w-full">
        <!-- Select Chart 토글 버튼과 드롭다운 -->
        <div class="relative flex justify-end mb-4">
          <div bind:this={selectChartRef}>
            <button 
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              on:click|stopPropagation={toggleSelectChart}
            >
              <span>{isSelectChartOpen ? '▲' : '▼'} Select Chart</span>
            </button>
            
            {#if isSelectChartOpen}
              <div class="absolute right-0 top-full z-50 min-w-[250px] bg-white border border-gray-300 rounded-lg shadow-md p-4" transition:slide>
                <div class="flex flex-col gap-3">
                  {#each selectItems as item}
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        on:change={() => handleCheckboxChange(item)}
                        class="w-4 h-4 text-blue-600 rounded border-gray-300"
                      />
                      <span class="text-sm text-gray-700">{item.name}</span>
                    </label>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- 차트 컨텐츠 -->
        <div class="grid grid-cols-2 gap-4">
          {#if selectItems[0].checked}
            <ChartCard 
              title="Gender Ratio" 
              description="The ratio of genders within the cohort."
              chartId={0}
              type="full"
              hasTableView={true}
              isTableView={isTableView.genderRatio}
              on:toggleView={({detail}) => isTableView.genderRatio = detail}
              on:close={handleChartClose}
            >
              <GroupDonutChartWrapper chartsData={genderChartData}/>
              <div slot="table" class="w-full h-full flex flex-col p-4">
                {#if genderChartData.length > 0}
                  <div class="flex-1 overflow-x-auto overflow-y-auto">
                    <DataTable
                      data={transformDonutChartToTableData(genderChartData)}
                    />
                  </div>
                {/if}
              </div>
            </ChartCard>
          {/if}          

          {#if selectItems[1].checked}
            <ChartCard 
              title="Mortality" 
              description="The percentage of patients within the cohort who have died."
              chartId={1}
              type="full"
              hasTableView={true}
              isTableView={isTableView.mortality}
              on:toggleView={({detail}) => isTableView.mortality = detail}
              on:close={handleChartClose}
            >
            <div class="w-full h-full flex flex-col">
              <div class="flex-grow flex items-center justify-center">
                {#if mortalityChartData && mortalityChartData.length > 0}
                  <GroupDonutChartWrapper chartsData={mortalityChartData}/>
                {/if}
              </div>
            </div>
            <div slot="table" class="w-full h-full flex flex-col p-4">
              {#if mortalityChartData.length > 0}
                <div class="flex-1 overflow-x-auto overflow-y-auto">
                  <DataTable
                    data={transformDonutChartToTableData(mortalityChartData)}
                  />
              </div>
              {/if}
            </div>
            </ChartCard>
          {/if}

          {#if selectItems[2].checked}
            <ChartCard 
              title="Visit Type Ratio"
              description="The proportion of different types of medical visits (outpatient, inpatient, emergency room, etc.) that occurred during the cohort period."
              chartId={2}
              type="full"
              hasTableView={true}
              isTableView={isTableView.visitTypeRatio}
              on:toggleView={({detail}) => isTableView.visitTypeRatio = detail}
              on:close={handleChartClose}
            >
            <div class="w-full h-full flex flex-col">
              <div class="flex-grow flex items-center justify-center">
                {#if visitTypeChartData && visitTypeChartData.length > 0}
                  <GroupDonutChartWrapper chartsData={visitTypeChartData}/>
                {/if}
              </div>
            </div>
            <div slot="table" class="w-full h-full flex flex-col p-4">
              {#if visitTypeChartData.length > 0}
                <div class="flex-1 overflow-x-auto overflow-y-auto">
                  <DataTable
                    data={transformDonutChartToTableData(visitTypeChartData)}
                  />
                  </div>
                {/if}
            </div>
            </ChartCard>
          {/if}

          {#if selectItems[3].checked}
            <ChartCard 
              title="Distribution of First Occurrence Age"
              description="The age distribution of patients at the time of their first medical visit during the cohort period."
              chartId={3}
              type="full"
              hasTableView={true}
              isTableView={isTableView.firstOccurrenceAge}
              on:toggleView={({detail}) => isTableView.firstOccurrenceAge = detail}
              on:close={handleChartClose}
            >
              <div class="w-full h-full flex flex-col">
                {#if ageDistributionChartData.length > 0}
                  <div class="flex-1 overflow-x-auto overflow-y-auto">
                    <LineChart
                      data={ageDistributionChartData}
                      cohortColorMap={cohortColorMap}
                    />
                  </div>
                {/if}
              </div>

              <div slot="table" class="w-full h-full flex flex-col p-4">
                {#if ageDistributionChartData.length > 0}
                  <div class="flex-1 overflow-x-auto overflow-y-auto">
                    <DataTable
                      data={transformLineChartToTableData(ageDistributionChartData)}
                    />
                  </div>
                {/if}
              </div>
            </ChartCard>
          {/if}
          
          {#if selectItems[4].checked}
            <ChartCard 
              title="Distribution of Visit Count"
              description="The distribution of the total number of medical visits made by patients during the cohort period."
              chartId={4}
              type="full"
              hasTableView={true}
              isTableView={isTableView.visitCount}
              on:toggleView={({detail}) => isTableView.visitCount = detail}
              on:close={handleChartClose}
            >
              <div class="w-full h-full flex flex-col">
                {#if visitCountChartData.length > 0}
                  <div class="flex-1 overflow-x-auto overflow-y-auto">
                    <LineChart
                      data={visitCountChartData}
                      cohortColorMap={cohortColorMap}
                    />
                  </div>
                {/if}
              </div>

              <div slot="table" class="w-full h-full flex flex-col p-4">
                {#if visitCountChartData.length > 0}
                  <div class="flex-1 overflow-x-auto overflow-y-auto">
                    <DataTable
                      data={transformLineChartToTableData(visitCountChartData)}
                    />
                  </div>
                {/if}
              </div>
            </ChartCard>
          {/if}

          {#if selectItems[5].checked}
            <ChartCard 
              title="Top 10 Drugs"
              description="The list of the top 10 most frequently prescribed medications for patients in the cohort."
              chartId={5}
              type="half"
              showSelector={true}
              options={getViewOptions('drug')}
              selectedOption={topTenDrugViewType}
              hasTableView={true}
              isTableView={isTableView.topTenDrugs}
              on:toggleView={({detail}) => isTableView.topTenDrugs = detail}
              on:optionSelect={handleViewTypeChange}
              on:close={handleChartClose}
            >
              <div class="w-full h-full flex flex-col p-4">
                {#if stackedDrugsData.length > 0}
                <div class="flex-1 overflow-x-auto overflow-y-auto">
                  <StackedBarChartWrapper
                    data={transformTopTenData(
                      stackedDrugsData,
                      'drug',
                      topTenDrugViewType
                    )}
                    cohortColorMap={cohortColorMap}
                    cohortTotalCounts={cohortTotalCounts}
                  />
                </div>
                {/if}
              </div>
              <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
                <div class="flex-1 overflow-x-auto overflow-y-auto">
                  {#if stackedDrugsData.length > 0}
                    <StackedBarChartTableView
                      data={transformTopTenData(stackedDrugsData, 'drug', topTenDrugViewType).transformedData}
                      domainKey="drug"
                      orderedCohorts={transformTopTenData(stackedDrugsData, 'drug', topTenDrugViewType).orderedCohorts}
                      cohortTotalCounts={cohortTotalCounts}
                      cohortColorMap={cohortColorMap}
                    />
                  {/if}
                </div>
              </div>
            </ChartCard>
          {/if}

          {#if selectItems[6].checked}
              <ChartCard 
                title="Top 10 Conditions"
                description="The list of the top 10 most frequently diagnosed medical conditions among patients in the cohort."
                chartId={6}
                type="half"
                showSelector={true}
                options={getViewOptions('condition')}
                selectedOption={topTenConditionViewType}
                hasTableView={true}
                isTableView={isTableView.topTenConditions}
                on:toggleView={({detail}) => isTableView.topTenConditions = detail}
                on:optionSelect={handleViewTypeChange}
                on:close={handleChartClose}
              >
              <div class = "w-full h-full flex flex-col p-2">
                {#if stackedConditionsData.length > 0}
                  <div class="flex-1 overflow-x-auto overflow-y-auto">
                    <StackedBarChartWrapper
                    data={transformTopTenData(
                      stackedConditionsData,
                      'condition',
                      topTenConditionViewType
                    )}
                    cohortColorMap={cohortColorMap}
                    cohortTotalCounts={cohortTotalCounts}
                  />
                  </div>
                {/if}
              </div>

              <!-- 테이블 뷰 -->
              <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
                {#if stackedConditionsData.length > 0}
                  <div class="flex-1 overflow-x-auto overflow-y-auto">
                    <StackedBarChartTableView
                      data={transformTopTenData(stackedConditionsData, 'condition', topTenConditionViewType).transformedData}
                      domainKey="condition"
                      orderedCohorts={transformTopTenData(stackedConditionsData, 'condition', topTenConditionViewType).orderedCohorts}
                      cohortTotalCounts={cohortTotalCounts}
                      cohortColorMap={cohortColorMap}
                    />
                  </div>
                {/if}
              </div>
              </ChartCard>
          {/if}

          {#if selectItems[7].checked}
            <ChartCard 
              title="Top 10 Procedures"
              description="The list of the top 10 most frequently performed procedures and medical tests on patients in the cohort."
              chartId={7}
              type="half"
              showSelector={true}
              options={getViewOptions('procedure')}
              selectedOption={topTenProcedureViewType}
              hasTableView={true}
              isTableView={isTableView.topTenProcedures}
              on:toggleView={({detail}) => isTableView.topTenProcedures = detail}
              on:optionSelect={handleViewTypeChange}
              on:close={handleChartClose}
            >
            <div class = "w-full h-full flex flex-col p-2">
              {#if stackedProceduresData.length > 0}
                <div class="flex-1 overflow-x-auto overflow-y-auto">
                  <StackedBarChartWrapper
                    data={transformTopTenData(
                      stackedProceduresData,
                      'procedure',
                      topTenProcedureViewType
                    )}
                    cohortColorMap={cohortColorMap}
                    cohortTotalCounts={cohortTotalCounts}
                  />
                </div>
              {/if}
            </div>

            <!-- 테이블 뷰 -->
            <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
              {#if stackedProceduresData.length > 0}
                <div class="flex-1 overflow-x-auto overflow-y-auto">
                  <StackedBarChartTableView
                    data={transformTopTenData(stackedProceduresData, 'procedure', topTenProcedureViewType).transformedData}
                    domainKey="procedure"
                    orderedCohorts={transformTopTenData(stackedProceduresData, 'procedure', topTenProcedureViewType).orderedCohorts}
                    cohortTotalCounts={cohortTotalCounts}
                    cohortColorMap={cohortColorMap}
                  />
                </div>
              {/if}
            </div>
            </ChartCard>
          {/if}

          {#if selectItems[8].checked}
            <ChartCard 
              title="Top 10 Measurements"
              description="The list of the top 10 most frequently recorded clinical measurements within the cohort."
              chartId={8}
              type="half"
              showSelector={true}
              options={getViewOptions('measurement')}
              selectedOption={topTenMeasurementViewType}
              hasTableView={true}
              isTableView={isTableView.topTenMeasurements}
              on:toggleView={({detail}) => isTableView.topTenMeasurements = detail}
              on:optionSelect={handleViewTypeChange}
              on:close={handleChartClose}
            >
            <div class = "w-full h-full flex flex-col p-2">
              {#if stackedMeasurementsData.length > 0}
                <div class="flex-1 overflow-x-auto overflow-y-auto">
                  <StackedBarChartWrapper
                    data={transformTopTenData(
                      stackedMeasurementsData,
                      'measurement',
                      topTenMeasurementViewType
                    )}
                    cohortColorMap={cohortColorMap}
                    cohortTotalCounts={cohortTotalCounts}
                  />
                </div>
              {/if}
            </div>

            <!-- 테이블 뷰 -->
            <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
              {#if stackedMeasurementsData.length > 0}
                <div class="flex-1 overflow-x-auto overflow-y-auto">
                  <StackedBarChartTableView
                    data={transformTopTenData(stackedMeasurementsData, 'measurement', topTenMeasurementViewType).transformedData}
                    domainKey="measurement"
                    orderedCohorts={transformTopTenData(stackedMeasurementsData, 'measurement', topTenMeasurementViewType).orderedCohorts}
                    cohortTotalCounts={cohortTotalCounts}
                    cohortColorMap={cohortColorMap}
                  />
                </div>
              {/if}
            </div>
            </ChartCard>
          {/if}
        </div>
      </div>
    {:else if activeTab === 'customizable'}
      <!-- <div class="w-full space-y-6">
        <ChartCard
          title="Top 10 Prescribed Medications Comparison"
          description="Comparison of top prescribed medications across selected cohorts">
          {#if topTenDrugData.length > 0}
            <BarChartHorizontal data={topTenDrugData} />
          {:else}
            <p>Loading chart...</p>
          {/if}
        </ChartCard>
      </div> -->
    {/if}
  </div> 
</div> 

<svelte:window on:click={handleClickOutside} /> 