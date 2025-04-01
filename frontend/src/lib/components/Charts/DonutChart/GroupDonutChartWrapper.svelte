<script>
    import * as d3 from 'd3';
    import DonutChart from './DonutChart.svelte';
    import Legend from './Legend.svelte';
    
    export let data = [];

    let hoveredLabel = null;

    const colorScale = d3.scaleOrdinal()
        .domain([
          "Male", "Female", "Unknown",
          "Alive", "Deceased",
          "Inpatient", "Outpatient", "Emergency Room Visit", "Home Visit", "Other Visit Type"
        ])
        .range([
          "#3498db", "#F9A7B0", "#808080",
          "#4CAF50", "#5E6C7F",
          "#FF6B6B", "#4ECDC4", "#FFB236", "#95A5A6", "#BDC3C7"
        ]);
    
    $: processedData = data?.map(cohort => ({
        name: cohort.cohortName,
        data: cohort.data
    })) || [];
</script>

<div class="flex flex-col items-center justify-center w-full">
    <div class="w-full overflow-x-auto">
        <div class="flex flex-row justify-center items-start gap-2 px-4" style="min-width: 600px">
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
                data={processedData[0].data} 
                bind:hoveredLabel
            />
        </div>
    {/if}
</div>
