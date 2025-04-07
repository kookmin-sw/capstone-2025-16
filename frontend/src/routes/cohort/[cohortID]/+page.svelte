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

    let activeTab = $state('definition');
    const tabs = [
		{ key: 'definition', label: 'Definition' },
		{ key: 'features', label: 'Features' },
		{ key: 'default', label: 'Default Chart' },
		{ key: 'customizable', label: 'Customizable Chart' },
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

    // cohort features 임시 데이터
    const procedureData = [
        { ID: "1000023", Name: "Hyperlidemia", Influence: 0.687 },
        { ID: "1000023", Name: "Hyperlidemia", Influence: 0.687 },
        { ID: "1000023", Name: "Hyperlidemia", Influence: 0.687 },
        { ID: "1000024", Name: "Hypertension", Influence: 0.512 },
        { ID: "1000025", Name: "Diabetes", Influence: 0.478 },
        { ID: "1000026", Name: "Asthma", Influence: 0.432 },
        { ID: "1000027", Name: "Arthritis", Influence: 0.421 }
    ];

    const conditionData = [
        { ID: "1000024", Name: "Delirium", Influence: 0.547 },
        { ID: "1000123", Name: "Hyperlidemia", Influence: 0.533 },
        { ID: "1000023", Name: "Hyperlidemia", Influence: 0.445 },
        { ID: "1000026", Name: "Asthma", Influence: 0.432 },
        { ID: "1000027", Name: "Arthritis", Influence: 0.421 },
        { ID: "1000028", Name: "Depression", Influence: 0.398 },
        { ID: "1000029", Name: "Anxiety", Influence: 0.376 }
    ];

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

    onMount(() => {
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
        <div class="border rounded-lg bg-white shadow-sm h-[300px] flex flex-col">
            <div class="p-4 border-b">
                <h2 class="text-base text-gray-700">Cohort Characteristics(Procedure, Condition)</h2>
            </div>
            <div class="p-4 flex-1">
                <div class="grid grid-cols-2 gap-4 h-full">
                    <div class="h-full">
                        <h3 class="text-xs text-gray-500 mb-2">Procedure</h3>
                        <div class="overflow-y-auto h-[170px] border rounded">
                            <table class="min-w-full divide-y divide-gray-200 text-xs">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th scope="col" class="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th scope="col" class="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th scope="col" class="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Influence</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    {#each procedureData as { ID, Name, Influence }}
                                        <tr>
                                            <td class="px-3 py-1.5 whitespace-nowrap text-gray-500">{ID}</td>
                                            <td class="px-3 py-1.5 whitespace-nowrap text-gray-500">{Name}</td>
                                            <td class="px-3 py-1.5 whitespace-nowrap text-gray-500">{Influence}</td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="h-full">
                        <h3 class="text-xs text-gray-500 mb-2">Condition</h3>
                        <div class="overflow-y-auto h-[170px] border rounded">
                            <table class="min-w-full divide-y divide-gray-200 text-xs">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th scope="col" class="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th scope="col" class="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th scope="col" class="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Influence</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    {#each conditionData as { ID, Name, Influence }}
                                        <tr>
                                            <td class="px-3 py-1.5 whitespace-nowrap text-gray-500">{ID}</td>
                                            <td class="px-3 py-1.5 whitespace-nowrap text-gray-500">{Name}</td>
                                            <td class="px-3 py-1.5 whitespace-nowrap text-gray-500">{Influence}</td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}


    {#if activeTab == 'default'}
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

    {#if activeTab == 'customizable'}
        <div class="p-6">
            customizable tab 화면
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