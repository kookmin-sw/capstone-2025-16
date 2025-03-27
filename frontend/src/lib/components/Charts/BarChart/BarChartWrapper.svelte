<script>
    import BarChart from './BarChart.svelte';
  
    export let data = [];
    export let domainKey = 'drug';
    export let cohortName = '';
    export let cohortTotalCount = 0;
  
    let tooltipVisible = false;
    let tooltipX = 0;
    let tooltipY = 0;
    let tooltipContent = '';
    let tooltipElement;
    let chartContainer;
  
    function handleMouseOver(event, d) {
      const value = d.count;
      const percentage = ((value / cohortTotalCount) * 100).toFixed(2);
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
          <div class="text-[10px] font-semibold mb-0.5">${d.name}</div>
          <div class="text-[9px] text-gray-600">
            ${cohortName}:
            <span class="ml-0.5 font-medium">${value.toLocaleString()}</span><br/>
            <span class="text-gray-400 ml-0.5">
              (${value}/${cohortTotalCount} ${percentage}%)
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
    <div class="relative w-full h-full" bind:this={chartContainer}>
        <BarChart
            data={data}
            domainKey={domainKey}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
        />
    </div>

    {#if tooltipVisible}
      <div bind:this={tooltipElement}
        class="absolute bg-white/95 shadow-sm rounded-md border border-gray-100 z-50 pointer-events-none transition-all duration-75 backdrop-blur-sm"
        style="left: {tooltipX}px; top: {tooltipY}px;">
        {@html tooltipContent}
      </div>
    {/if}
  </div>