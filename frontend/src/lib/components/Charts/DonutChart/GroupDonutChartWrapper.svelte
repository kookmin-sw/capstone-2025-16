<script>
    import * as d3 from 'd3';
    import DonutChart from './DonutChart.svelte';
    import Legend from './Legend.svelte';
    
    export let data = [];

    let hoveredLabel = null;

    const colorScale = d3.scaleOrdinal()
        .domain([
          "MALE", "FEMALE", "UNKNOWN",
          "alive", "deceased",
          "Inpatient Visit", "Ambulatory Surgical Center", "Emergency Room and Inpatient Visit", "Emergency Room - Hospital", "Observation Room", "Ambulatory Clinic / Center"
        ])
        .range([
          "#3498db", "#F9A7B0", "#808080",
          "#4CAF50", "#5E6C7F",
          "#4F8EF7", "#F78CA2", "#FFD166", "#06D6A0", "#9B5DE5",
          "#F46036", "#43AA8B", "#FF61A6", "#3A86FF", "#FFBE0B"
        ]);
    
    $: processedData = data?.map(cohort => ({
        name: cohort.cohortName,
        data: cohort.data
    })) || [];

    $: allUniqueData = processedData.reduce((acc, cohort) => {
        if (cohort.data && typeof cohort.data === 'object') {
            Object.entries(cohort.data).forEach(([label, value]) => {
                if (!acc.find(d => d.label === label)) {
                    acc.push({ label, value });
                }
            });
        }
        return acc;
    }, []);

    $: legendData = allUniqueData.reduce((acc, item) => {
        acc[item.label] = item.value;
        return acc;
    }, {});

</script>

<div class="flex flex-col items-center justify-center w-full">
    <div class="w-full overflow-x-auto">
        <div class="flex flex-row justify-center items-start gap-2 px-4" style="min-width: 400px">
            {#each processedData as chart}
                <div class="flex flex-col items-center w-[200px]">
                    <DonutChart 
                        data={chart.data}
                        {hoveredLabel}
                        {colorScale}
                        width={150}
                        height={150}
                    />
                    <span class="text-sm font-medium text-gray-600">{chart.name}</span>
                </div>
            {/each}
        </div>
    </div>
    {#if processedData.length > 0}
        <div class="mt-4">
            <Legend 
                data={legendData} 
                bind:hoveredLabel
            />
        </div>
    {/if}
</div>
