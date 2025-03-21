<script>
  import DonutChart from './DonutChart.svelte';
  
  export let chartsData = []; // [{data: {}, cohortName: ''}, ...]
  export let showCohortNames = true;
  
  let hoveredLabel = null;
  
  const colorMap = {
    // Gender colors
    'Male': '#3498db',     // blue
    'Female': '#F9A7B0',   // pink
    'Unknown': '#808080',  // gray
    
    // Mortality colors
    'Alive': '#4CAF50',    // green
    'Deceased': '#5E6C7F', // gray
    
    // Visit Type colors
    'Inpatient': '#FF6B6B',         // 빨간색 계열 (입원 - 중증)
    'Outpatient': '#4ECDC4',        // 청록색 (외래 - 일반)
    'Emergency Room Visit': '#FFB236', // 주황색 (응급실 - 긴급)
    'Home Visit': '#95A5A6',        // 회색빛 파랑 (재택)
    'Other Visit Type': '#BDC3C7'   // 밝은 회색 (기타)
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