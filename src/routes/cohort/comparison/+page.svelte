<script>
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import ChartCard from "$lib/components/ChartCard.svelte";
  import BarChartHorizontal from "$lib/components/BarChart_horizontal.svelte";
  import BarChartVertical from "$lib/components/BarChart_vertical.svelte";
  import DonutChart from "$lib/components/DonutChart.svelte";
  import { tick } from "svelte";
  import { slide } from 'svelte/transition';
  import * as d3 from 'd3';
  import DonutChartGroup from '$lib/components/DonutChartGroup.svelte';
  import cohortStats from '$lib/data/cohortStats.json';


  import LineChart from "$lib/components/LineChart.svelte";
              
  let sampleData = [
    // 0-9세
    { label: "0-9", value: 150, series: "cohort1" },
    { label: "0-9", value: 120, series: "cohort2" },
    { label: "0-9", value: 180, series: "cohort3" },
    // 10-19세
    { label: "10-19", value: 220, series: "cohort1" },
    { label: "10-19", value: 280, series: "cohort2" },
    { label: "10-19", value: 190, series: "cohort3" },
    // 20-29세
    { label: "20-29", value: 350, series: "cohort1" },
    { label: "20-29", value: 320, series: "cohort2" },
    { label: "20-29", value: 420, series: "cohort3" },
    // 30-39세
    { label: "30-39", value: 480, series: "cohort1" },
    { label: "30-39", value: 450, series: "cohort2" },
    { label: "30-39", value: 380, series: "cohort3" },
    // 40-49세
    { label: "40-49", value: 420, series: "cohort1" },
    { label: "40-49", value: 520, series: "cohort2" },
    { label: "40-49", value: 480, series: "cohort3" },
    // 50-59세
    { label: "50-59", value: 380, series: "cohort1" },
    { label: "50-59", value: 450, series: "cohort2" },
    { label: "50-59", value: 520, series: "cohort3" },
    // 60-69세
    { label: "60-69", value: 420, series: "cohort1" },
    { label: "60-69", value: 350, series: "cohort2" },
    { label: "60-69", value: 380, series: "cohort3" },
    // 70-79세
    { label: "70-79", value: 280, series: "cohort1" },
    { label: "70-79", value: 320, series: "cohort2" },
    { label: "70-79", value: 250, series: "cohort3" },
    // 80-89세
    { label: "80-89", value: 180, series: "cohort1" },
    { label: "80-89", value: 150, series: "cohort2" },
    { label: "80-89", value: 220, series: "cohort3" },
    // 90-99세
    { label: "90-99", value: 120, series: "cohort1" },
    { label: "90-99", value: 85, series: "cohort2" },
    { label: "90-99", value: 95, series: "cohort3" },
    // 100-109세
    { label: "100-109", value: 40, series: "cohort1" },
    { label: "100-109", value: 25, series: "cohort2" },
    { label: "100-109", value: 35, series: "cohort3" },
    // 110-119세
    { label: "110-119", value: 10, series: "cohort1" },
    { label: "110-119", value: 15, series: "cohort2" },
    { label: "110-119", value: 8, series: "cohort3" }
  ];
            

  // 코호트 데이터
  let selectedCohorts = []; // 선택된 코호트들 ID 배열
  let cohortData = []; // 코호트 데이터
  let expandedStates = []; // 코호트 목록 toggle 펼치거나 접기 위한 상태 배열

  // 차트 데이터
  let topTenDrugData = [];
  let patientAgeData = [];
  let genderData = {};
  let deathRatioData = {};
  
  let activeTab = 'default'; // 탭 활성화 상태 관리

  let selectedForDeletion = {}; // 삭제할 코호트를 체크박스로 선택할 때 상태 관리
  let selectItems = [
    {id: 1, name: 'Gender Ratio', checked: true},
    {id: 2, name: 'Death Ratio', checked: true},
    {id: 3, name: 'Visit Type Ratio', checked: true},
    {id: 4, name: 'Distribution of First Occurrence Age', checked: true},
    {id: 5, name: 'Number of Visits during cohort period', checked: true},
    {id: 6, name: 'Top 10 Common Condition', checked: true},
    {id: 7, name: 'Top 10 Common Prescribed drug', checked: true},
    {id: 8, name: 'Top 10 Common Procedure', checked: true},
    {id: 9, name: 'Top 10 Common Measurement', checked: true},
  ]
  let isSelectChartOpen = false; // 차트 선택 드롭다운 메뉴 상태 관리
  let selectChartRef; // 드롭다운 메뉴의 참조를 저장할 변수

  let genderDataMap = {};

  let hoveredLabel = null;
  
  $: uniqueGenderLabels = Object.values(genderDataMap)
    .flatMap(data => Object.keys(data))
    .filter((value, index, self) => self.indexOf(value) === index);

  // DonutChart와 동일한 색상 매핑 사용
  const color = d3
    .scaleOrdinal()
    .domain(["Male", "Female", "Unknown"])
    .range(["#3498db", "#F9A7B0", "#808080"]);

  // const chartsData = [
  //   {
  //     data: cohortStats["10001"].statistics.gender,
  //     cohortName: cohortStats["10001"].basicInfo.name
  //   },
  //   {
  //     data: cohortStats["10002"].statistics.gender,
  //     cohortName: cohortStats["10002"].basicInfo.name
  //   },
  //   {
  //     data: cohortStats["10003"].statistics.gender,
  //     cohortName: cohortStats["10003"].basicInfo.name
  //   }
  // ];
  

  // 방문 횟수 데이터
  let visitData = [
    // cohort1의 방문 횟수 분포
    { label: 1, value: 150, series: "cohort1" },
    { label: 2, value: 120, series: "cohort1" },
    { label: 3, value: 95, series: "cohort1" },
    { label: 4, value: 85, series: "cohort1" },
    { label: 5, value: 70, series: "cohort1" },
    { label: 6, value: 55, series: "cohort1" },
    { label: 7, value: 45, series: "cohort1" },
    { label: 8, value: 35, series: "cohort1" },
    { label: 9, value: 28, series: "cohort1" },
    { label: 10, value: 20, series: "cohort1" },
    { label: 11, value: 15, series: "cohort1" },
    { label: 12, value: 10, series: "cohort1" },
    { label: 13, value: 7, series: "cohort1" },
    { label: 14, value: 5, series: "cohort1" },
    { label: 15, value: 3, series: "cohort1" },
    
    // cohort2의 방문 횟수 분포
    { label: 1, value: 140, series: "cohort2" },
    { label: 2, value: 125, series: "cohort2" },
    { label: 3, value: 105, series: "cohort2" },
    { label: 4, value: 90, series: "cohort2" },
    { label: 5, value: 80, series: "cohort2" },
    { label: 6, value: 65, series: "cohort2" },
    { label: 7, value: 52, series: "cohort2" },
    { label: 8, value: 42, series: "cohort2" },
    { label: 9, value: 33, series: "cohort2" },
    { label: 10, value: 25, series: "cohort2" },
    { label: 11, value: 18, series: "cohort2" },
    { label: 12, value: 12, series: "cohort2" },
    { label: 13, value: 8, series: "cohort2" },
    { label: 14, value: 5, series: "cohort2" },
    { label: 15, value: 3, series: "cohort2" },

    // cohort3의 방문 횟수 분포
    { label: 1, value: 160, series: "cohort3" },
    { label: 2, value: 130, series: "cohort3" },
    { label: 3, value: 100, series: "cohort3" },
    { label: 4, value: 80, series: "cohort3" },
    { label: 5, value: 65, series: "cohort3" },
    { label: 6, value: 50, series: "cohort3" },
    { label: 7, value: 40, series: "cohort3" },
    { label: 8, value: 32, series: "cohort3" },
    { label: 9, value: 25, series: "cohort3" },
    { label: 10, value: 18, series: "cohort3" },
    { label: 11, value: 13, series: "cohort3" },
    { label: 12, value: 9, series: "cohort3" },
    { label: 13, value: 6, series: "cohort3" },
    { label: 14, value: 4, series: "cohort3" },
    { label: 15, value: 2, series: "cohort3" }
  ];

  onMount(async () => {
    const cohortIds = $page.url.searchParams.get('cohorts')?.split(',') || [];
    selectedCohorts = cohortIds;
    expandedStates = new Array(cohortIds.length).fill(false);

    try {
      cohortData = loadCohortListData(cohortStats, cohortIds);
      console.log('load cohortData', cohortData);
      
      // 차트 데이터 로드
      const [topTenDrugRes, patientAgeRes, genderRes, deathRatioRes] = await Promise.all([
        fetch("/api/chartdata/topTenDrug"),
        fetch("/api/chartdata/patientAge"),
        fetch("/api/chartdata/gender"),
        fetch("/api/chartdata/deathRatio")
      ]);

      topTenDrugData = await topTenDrugRes.json();
      patientAgeData = await patientAgeRes.json();
      genderData = await genderRes.json();
      deathRatioData = await deathRatioRes.json();
    } catch (error) {
      console.error("Error loading data:", error);
    }

    // if (selectedCohorts.length > 0) {
    //   await loadGenderData();
    // }
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
      const genderData = selectedCohorts.map((cohortId) => ({
        data: cohortStats[cohortId].statistics.gender,
        cohortName: cohortStats[cohortId].basicInfo.name
      }));

      setChartsData(genderData);
    } catch (error) {
      console.error('Error loading gender data:', error);
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
        <button 
          class="tab {activeTab === 'prediction' ? 'active' : ''}"
          on:click={() => switchTab('prediction')}
        >
          Prediction
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
              description="Comparison of gender distribution across selected cohorts"
              chartId={1}
              type="full",
              
              on:close={() => {}}
            >
              <div class="w-full h-full flex flex-col">
                <div class="mt-4 flex-grow flex items-center justify-center">
                <!-- <DonutChartGroup {chartsData} showCohortNames={true} /> -->
                </div>
              </div>
            </ChartCard>
          {/if}          

          {#if selectItems[1].checked}
            <ChartCard 
              title="Death Ratio" 
              description="Comparison of death ratios across selected cohorts"
              chartId={2}
              type="full"
              on:close={handleChartClose}
            >
              <!-- <DonutChart data={deathRatioData} /> -->
            </ChartCard>
          {/if}

          {#if selectItems[2].checked}
            <ChartCard 
              title="Visit Type Ratio"
              description="Comparison of visit types across selected cohorts"
              chartId={3}
              type="full"
              on:close={handleChartClose}
            >
              <!-- <DonutChart data={deathRatioData} /> -->
            </ChartCard>
          {/if}

          {#if selectItems[3].checked}
            <ChartCard 
              title="Distribution of First Occurrence Age"
              description="Age distribution analysis"
              chartId={5}
              type="full"
              on:close={handleChartClose}
              >
            <div class="w-full h-full flex flex-col">
            <div class="mt-4 flex-grow flex items-center justify-center">
              <LineChart data={sampleData} />
            </div>
          </div>
        </ChartCard>
          {/if}
          

          {#if selectItems[4].checked}
          <ChartCard 
            title="Number of Visits during cohort period"
            description="Visit frequency analysis"
            chartId={4}
            type="full"
            on:close={handleChartClose}
          >
            <div class="w-full h-full flex flex-col">
              <div class="mt-4 flex-grow flex items-center justify-center">
                <LineChart data={visitData} />
              </div>
            </div>
          </ChartCard>
            
          {/if}

          {#if selectItems[5].checked}
            <ChartCard 
              title="Top 10 Common Condition"
              description="Most frequent medical conditions"
              chartId={6}
              type="half"
              on:close={handleChartClose}
            >
              <!-- <BarChartHorizontal data={topTenDrugData} /> -->
            </ChartCard>
          {/if}

          {#if selectItems[6].checked}
            <ChartCard 
              title="Top 10 Common Prescribed drug"
              description="Most frequently prescribed medications"
              chartId={7}
              type="half"
              on:close={handleChartClose}
            >
              <!-- <BarChartHorizontal data={topTenDrugData} /> -->
            </ChartCard>
          {/if}

          {#if selectItems[7].checked}
            <ChartCard 
              title="Top 10 Common Procedure"
              description="Most common medical procedures"
              chartId={8}
              type="half"
              on:close={handleChartClose}
            >
              <!-- <BarChartHorizontal data={topTenDrugData} /> -->
            </ChartCard>
          {/if}

          {#if selectItems[8].checked}
            <ChartCard 
              title="Top 10 Common Measurement"
              description="Most frequent measurements"
              chartId={9}
              type="half"
              on:close={handleChartClose}
            >
              <!-- <BarChartHorizontal data={topTenDrugData} /> -->
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
    {:else}
      <!-- <div class="w-full space-y-6">
        <ChartCard
          title="Prediction Analysis"
          description="AI-based prediction analysis for selected cohorts">
          <p>Prediction features coming soon...</p>
        </ChartCard>
      </div> -->
    {/if}
  </div> 
</div> 

<svelte:window on:click={handleClickOutside} /> 