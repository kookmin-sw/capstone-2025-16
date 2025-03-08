<script>
  import DonutChart from './DonutChart.svelte';
  
  export let chartsData = []; // [{data: {}, cohortName: ''}, ...]
  export let showCohortNames = true;
  
  let hoveredLabel = null;
  
  // 모든 차트에서 사용할 공통 색상 매핑
  const colorMap = {
    'Male': '#3498db',     // blue
    'Female': '#F9A7B0',   // pink
    'Unknown': '#808080',  // gray
    'Alive': '#4CAF50',    // green
    'Deceased': '#5E6C7F' // gray
  };
</script>

<div class="flex flex-col md:flex-row items-center w-full gap-4">
  <div class="flex flex-wrap justify-center items-center flex-1 gap-8">
    {#each chartsData as {data, cohortName}, i}
      <div class="flex flex-col items-center gap-2">
        <DonutChart 
          {data}
          {hoveredLabel}
          {colorMap}
          on:labelHover={(e) => hoveredLabel = e.detail}
          showCohortNames={false}
          size={200}
        />
        <span class="text-sm font-medium text-gray-600">{cohortName}</span>
      </div>
    {/each}
  </div>

  {#if showCohortNames && chartsData.length > 0}
    <div class="flex flex-row md:flex-col gap-3 mt-4 md:mt-0">
      {#each Object.entries(chartsData[0].data) as [label, _]}
        <div 
          class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer"
          role="button"
          tabindex="0"
          on:mouseenter={() => hoveredLabel = label}
          on:mouseleave={() => hoveredLabel = null}
        >
          <div 
            class="w-3 h-3 rounded-full" 
            style:background-color={colorMap[label]}
          ></div>
          <span class="font-medium">{label}</span>
        </div>
      {/each}
    </div>
  {/if}
</div> 