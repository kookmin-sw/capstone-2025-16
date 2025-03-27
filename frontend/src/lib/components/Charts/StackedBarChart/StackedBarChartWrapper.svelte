<script>
  import StackedBarChart from './StackedBarChart.svelte';
  import DataTable from '$lib/components/DataTable.svelte';
  export let data = [];
  export let cohortColorMap = {};
  export let cohortTotalCounts = {};
   
  $: domainKey = data.domainKey;
  $: viewType = data.viewType;
  $: transformedData = data.transformedData;
  $: top10ItemNames = data.top10ItemNames;
  $: orderedCohorts = data.orderedCohorts;

  let tooltipVisible = false;
  let tooltipX = 0;
  let tooltipY = 0;
  let tooltipContent = '';
  let tooltipElement;
  let chartContainer;

  function handleMouseOver(event, d, cohort) {
    const value = d[1] - d[0];
    const total = cohortTotalCounts[cohort];
    const percentage = ((value / total) * 100).toFixed(2);
    const itemName = d.data[domainKey];

    const rect = event.target.getBoundingClientRect();
    const containerRect = chartContainer.getBoundingClientRect();
    const tooltipHeight = tooltipElement?.offsetHeight || 40;
    const spaceBelow = containerRect.bottom - event.clientY;

    tooltipX = rect.right - containerRect.left;
    tooltipY = spaceBelow < tooltipHeight
      ? event.clientY - containerRect.top - tooltipHeight
      : event.clientY - containerRect.top;

    tooltipContent = `
      <div class="p-1">
        <div class="text-[10px] font-semibold mb-0.5">${itemName}</div>
        <div class="text-[9px] text-gray-600">
          ${cohort}:
          <span class="ml-0.5 font-medium">${value.toLocaleString()}</span><br/>
          <span class="text-gray-400 ml-0.5">
            (${value}/${total} ${percentage}%)
          </span>
        </div>
      </div>
    `;

    tooltipVisible = true;
  }

  function handleMouseOut() {
    tooltipVisible = false;
  }

</script>

<div class="relative w-full h-full">
    <div class="relative w-full h-full chart-container" bind:this={chartContainer}>
      <StackedBarChart
        stackData={transformedData}
        itemNames={top10ItemNames}
        cohortColorMap={cohortColorMap}
        orderedCohorts={orderedCohorts}
        domainKey={domainKey}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      />
    </div>

  <!-- 툴팁 -->
  {#if tooltipVisible}
    <div bind:this={tooltipElement}
    class="absolute bg-white/95 shadow-sm rounded-md border border-gray-100 z-50 pointer-events-none transition-all duration-75 backdrop-blur-sm"
    style="left: {tooltipX}px; top: {tooltipY}px;"
    >
      {@html tooltipContent}
    </div>
  {/if}
</div>