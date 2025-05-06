<script>
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import ChartCard from "$lib/components/ChartCard.svelte";
	import GroupDonutChartWrapper from "$lib/components/Charts/DonutChart/GroupDonutChartWrapper.svelte";
  import { tick } from "svelte";
  import { slide } from 'svelte/transition';
  import * as d3 from 'd3';
  import DataTable from '$lib/components/DataTable.svelte';
  import LineChart from "$lib/components/Charts/LineChart/LineChart.svelte";
  import { transformLineChartToTableData } from "$lib/components/Charts/LineChart/lineChartTransformer.js";
  import { transformDonutChartToTableData } from "$lib/components/Charts/DonutChart/donutChartTransformer.js";
  import { transformTopTenData } from "$lib/components/Charts/StackedBarChart/topTenChartTransformer.js";
  import StackedBarChartWrapper from "$lib/components/Charts/StackedBarChart/StackedBarChartWrapper.svelte";
  import StackedBarChartTableView from "$lib/components/Charts/StackedBarChart/StackedBarChartTableView.svelte";
  import Footer from '$lib/components/Footer.svelte';

  export let data;

  // 코호트 데이터
  const cohortStats = data.cohortList;
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
      cohortStats[cohortId].name,
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

  // 사이드바 상태 관리
  let isSidebarCollapsed = false;
  
  function toggleSidebar() {
    isSidebarCollapsed = !isSidebarCollapsed;
  }

  onMount(async () => {
    const cohortIds = $page.url.searchParams.get('cohorts')?.split(',') || [];
    selectedCohorts = cohortIds;
    expandedStates = new Array(cohortIds.length).fill(false);
    console.log("Debug----");
    try {
      cohortData = loadCohortListData(cohortStats, cohortIds);
      console.log(cohortData);
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
      author: cohortStats[id].basicInfo.author,
      createdAt: cohortStats[id].basicInfo.created_at,
      updatedAt: cohortStats[id].basicInfo.updated_at,
      totalPatients: cohortStats[id].basicInfo.count
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
            totalPatients: cohortStats[cohortId].basicInfo.count
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
      totalPatients: cohortStats[cohortId].basicInfo.count
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
      totalPatients: cohortStats[cohortId].basicInfo.count
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
      for(const [key, value] of Object.entries(cohortStats[cohortId].statistics.age)){
        ageData.push({
          label: key,
          value: value,
          series: cohortName
        });
      }
    });
    console.log(ageData);
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
      { id: 'combined', name: 'Combined View' }
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

  .sidebar-transition {
    transition: width 0.3s ease-in-out;
  }

  .toggle-icon {
    transition: transform 0.3s ease;
  }

  .toggle-icon.collapsed {
    transform: rotate(180deg);
  }
</style>

<div class="flex h-[calc(100vh-60px)] bg-gray-50">
  <!-- 좌측 사이드바 -->
  <div class="bg-white border-r border-gray-200 flex flex-col h-full sidebar-transition {isSidebarCollapsed ? 'w-[40px]' : 'w-[250px]'}">
    <div class="pl-4 pr-4 pt-4 flex items-center justify-between flex-shrink-0">
      {#if !isSidebarCollapsed}
        <div class="flex items-center justify-between w-full">
          <h3 class="text-lg font-semibold">Selected Cohorts</h3>
          <button aria-label="Toggle Sidebar"
            class="p-1 hover:bg-gray-100 rounded-md transition-colors"
            on:click={toggleSidebar}
          >
            <svg 
              class="w-5 h-5 text-gray-600 toggle-icon" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      {:else}
        <div class="flex items-center justify-center w-full">
          <button aria-label="Toggle Sidebar"
            class="p-1 hover:bg-gray-100 rounded-md transition-colors"
            on:click={toggleSidebar}
          >
            <svg 
              class="w-5 h-5 text-gray-600 toggle-icon collapsed" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      {/if}
    </div>
    
    {#if !isSidebarCollapsed}
      <div class="h-[calc(100%-4rem)] overflow-y-auto px-4 sidebar-scroll">
        <div class="space-y-2 py-4">
          {#each cohortData as cohort, index}
            <div class="border rounded-lg overflow-hidden bg-white">
              <button 
                class="w-full flex items-center justify-between p-2 hover:bg-gray-50 transition-colors"
                on:click={() => toggleExpand(index)}
              >
                <div class="flex items-start gap-2 flex-1 min-w-0">
                  <svg 
                    class="w-3 h-3 flex-shrink-0 transform transition-transform {expandedStates[index] ? 'rotate-180' : ''}" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1">
                      <span class="text-[10px] font-medium text-gray-400 truncate">{cohort.id}</span>
                    </div>
                    <div class="flex items-center gap-1">
                    <div class="text-xs font-medium text-blue-600 break-words whitespace-normal">{cohort.name}</div>
                    </div>
                    <div class="flex items-center gap-1 mt-0.5">
                    </div>
                  </div>
                </div>
              </button>
              
              {#if expandedStates[index]}
                <div class="p-2 border-t text-xs" transition:slide>
                  <div class="space-y-1">
                    <div>
                      <span class="text-gray-500">Author:</span>
                      <span class="font-regular">{cohort.author}</span>
                    </div>
                    <div>
                      <span class="text-gray-500">Total Patients:</span>
                      <span class="font-regular">{cohort.totalPatients}</span>
                    </div>
                    <div>
                      <span class="text-gray-500">Description:</span>
                      <span class="font-regular">{cohort.description}</span>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- 메인 컨텐츠 영역 -->
  <div class="flex-1 h-full overflow-hidden flex flex-col">
    <!-- 헤더 -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold">Cohort Comparison Analysis</h1>
          <p class="text-gray-600 text-sm mt-1">
            Selected cohorts are analyzed and compared based on various metrics.
          </p>
        </div>
        
        <!-- Select Chart 드롭다운 -->
        <div class="relative" bind:this={selectChartRef}>
          <button 
            class="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            on:click|stopPropagation={toggleSelectChart}
          >
            <span>{isSelectChartOpen ? '▲' : '▼'} Select Chart</span>
          </button>
          
          {#if isSelectChartOpen}
            <div class="absolute right-0 top-full mt-1 z-50 min-w-[250px] bg-white border border-gray-200 rounded-lg shadow-lg p-4" transition:slide>
              <div class="flex flex-col gap-3">
                {#each selectItems as item}
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      on:change={() => handleCheckboxChange(item)}
                      class="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span class="text-xs text-gray-700">{item.name}</span>
                  </label>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- 차트 그리드 및 Footer -->
    <div class="flex-1 overflow-y-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 p-6">
        {#if selectItems[0].checked}
          <ChartCard 
            title="Gender Ratio" 
            description="The ratio of genders within the cohort."
            chartId={0}
            type={selectedCohorts.length <= 3 ? 'half' : 'full'}
            hasTableView={true}
            isTableView={isTableView.genderRatio}
            on:toggleView={({detail}) => isTableView.genderRatio = detail}
            on:close={handleChartClose}
          >
            <div class="w-full h-full flex flex-col">
              <div class="flex-grow flex items-center justify-center">
                {#if genderChartData.length > 0}
                  <GroupDonutChartWrapper data={genderChartData}/>
                {/if}
              </div>
            </div>
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
            type={selectedCohorts.length <= 3 ? 'half' : 'full'}
            hasTableView={true}
            isTableView={isTableView.mortality}
            on:toggleView={({detail}) => isTableView.mortality = detail}
            on:close={handleChartClose}
          >
            <div class="w-full h-full flex flex-col">
              <div class="flex-grow flex items-center justify-center">
                {#if mortalityChartData && mortalityChartData.length > 0}
                  <GroupDonutChartWrapper data={mortalityChartData}/>
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
            type={selectedCohorts.length <= 3 ? 'half' : 'full'}
            hasTableView={true}
            isTableView={isTableView.visitTypeRatio}
            on:toggleView={({detail}) => isTableView.visitTypeRatio = detail}
            on:close={handleChartClose}
          >
            <div class="w-full h-full flex flex-col">
              <div class="flex-grow flex items-center justify-center">
                {#if visitTypeChartData && visitTypeChartData.length > 0}
                  <GroupDonutChartWrapper data={visitTypeChartData}/>
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
              <div class="flex-1 overflow-x-auto overflow-y-auto">
                <LineChart
                  data={ageDistributionChartData}
                  cohortColorMap={cohortColorMap}
                />
              </div>
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
              <div class="flex-1 overflow-x-auto overflow-y-auto">
                <LineChart
                  data={visitCountChartData}
                  cohortColorMap={cohortColorMap}
                />
              </div>
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
            <div class="w-full h-full flex flex-col p-2">
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
            <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
              {#if stackedConditionsData.length > 0}
                <div class="flex-1 overflow-x-auto overflow-y-auto">
                  <StackedBarChartTableView
                    data={transformTopTenData(stackedConditionsData, 'condition', topTenConditionViewType).transformedData}
                    domainKey="condition"
                    orderedCohorts={transformTopTenData(stackedConditionsData, 'condition', topTenConditionViewType).orderedCohorts}
                    cohortTotalCounts={cohortTotalCounts}
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
            <div class="w-full h-full flex flex-col p-2">
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
            <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
              {#if stackedProceduresData.length > 0}
                <div class="flex-1 overflow-x-auto overflow-y-auto">
                  <StackedBarChartTableView
                    data={transformTopTenData(stackedProceduresData, 'procedure', topTenProcedureViewType).transformedData}
                    domainKey="procedure"
                    orderedCohorts={transformTopTenData(stackedProceduresData, 'procedure', topTenProcedureViewType).orderedCohorts}
                    cohortTotalCounts={cohortTotalCounts}
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
            <div class="w-full h-full flex flex-col p-2">
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
            <div slot="table" class="w-full h-full flex flex-col p-4 overflow-auto">
              {#if stackedMeasurementsData.length > 0}
                <div class="flex-1 overflow-x-auto overflow-y-auto">
                  <StackedBarChartTableView
                    data={transformTopTenData(stackedMeasurementsData, 'measurement', topTenMeasurementViewType).transformedData}
                    domainKey="measurement"
                    orderedCohorts={transformTopTenData(stackedMeasurementsData, 'measurement', topTenMeasurementViewType).orderedCohorts}
                    cohortTotalCounts={cohortTotalCounts}
                  />
                </div>
              {/if}
            </div>
          </ChartCard>
        {/if}
      </div>
      <Footer />
    </div>
  </div>
</div>
<svelte:window on:click={handleClickOutside} /> 