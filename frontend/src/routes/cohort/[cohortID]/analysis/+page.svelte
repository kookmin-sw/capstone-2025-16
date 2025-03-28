<script>
    import analysisData from '$lib/data/singleCohortAnalysisTest.json';
    import ChartCard from '$lib/components/ChartCard.svelte';
    import DataTable from '$lib/components/DataTable.svelte';
    import { AGE_GROUPS, SINGLE_DATA_COLOR } from '$lib/constants.js';
    import DonutChart from '$lib/components/Charts/DonutChart/DonutChart.svelte';
    import SingleDonutChartWrapper from '$lib/components/Charts/DonutChart/SingleDonutChartWrapper.svelte';
    import { transformDonutChartToTableData } from '$lib/components/Charts/DonutChart/donutChartTransformer.js';
    import LineChart from '$lib/components/Charts/LineChart/LineChart.svelte';
    import { transformLineChartToTableData } from "$lib/components/Charts/LineChart/lineChartTransformer.js";
    import BarChart from "$lib/components/Charts/BarChart/BarChart.svelte"
    import BarChartWrapper from "$lib/components/Charts/BarChart/BarChartWrapper.svelte"
    import BarChartTableView from '$lib/components/Charts/BarChart/BarChartTableView.svelte';

    let activeTab = 'default'; // 탭 활성화 상태 관리

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
                <ChartCard
                    title="Gender Ratio"
                    description="The ratio of genders within the cohort."
                    type="half"
                    hasTableView={true}
                    isTableView={isTableView.gender}
                    on:toggleView={({ detail }) => isTableView.gender = detail}
                >
                    <SingleDonutChartWrapper data={analysisData.statistics.gender} />

                    <div slot="table" class="w-full h-full flex flex-col p-4">
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
                    type="half"
                    hasTableView={true}
                    isTableView={isTableView.mortality}
                    on:toggleView={({ detail }) => isTableView.mortality = detail}
                >
                    <SingleDonutChartWrapper data={analysisData.statistics.mortality} />

                    <div slot="table" class="w-full h-full flex flex-col p-4">
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
                    type="half"
                    hasTableView={true}
                    isTableView={isTableView.visitType}
                    on:toggleView={({ detail }) => isTableView.visitType = detail}
                >
                    <SingleDonutChartWrapper data={analysisData.statistics.visitType} />

                    <div slot="table" class="w-full h-full flex flex-col p-4">
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
                    type="full"
                    hasTableView={true}
                    isTableView={isTableView.age}
                    on:toggleView={({ detail }) => isTableView.age = detail}
                >
                    <LineChart
                        data={AGE_GROUPS.map(label => ({
                            label,
                            value: analysisData.statistics.age[label] ?? 0,
                            series: analysisData.basicInfo.name
                        }))}
                        cohortColorMap={{ [analysisData.basicInfo.name]: SINGLE_DATA_COLOR }}
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
                    type="full"
                    hasTableView={true}
                    isTableView={isTableView.visitCount}
                    on:toggleView={({ detail }) => isTableView.visitCount = detail}
                >
                    <LineChart
                        data={Object.entries(analysisData.statistics.visitCount).map(([count, value]) => ({
                        label: count,
                        value: value,
                        series: analysisData.basicInfo.name
                        }))}
                        cohortColorMap={{ [analysisData.basicInfo.name]: SINGLE_DATA_COLOR }}
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