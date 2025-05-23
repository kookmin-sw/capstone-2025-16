<script>
    import * as d3 from "d3";
    import { onMount, onDestroy, tick } from "svelte";
    import { SINGLE_DATA_COLOR } from '$lib/constants.js';
    import { browser } from "$app/environment";
  
    export let data = [];
    export let onMouseOver = () => {};
    export let onMouseOut = () => {};
    
    let chartContainer;
    let width;
    let height;
    const margin = { top: 30, right: 80, bottom: 10, left: 140 };
    let tooltip;

    $: if (chartContainer && data.length > 0 && width && height) {
        drawChart();
    }

    $: total = data?.reduce((sum, d) => sum + (d?.count || 0), 0) || 0;
    
    function handleResize() {
      if (chartContainer) {
        const containerRect = chartContainer.getBoundingClientRect();
        width = containerRect.width;
        height = containerRect.height;
        drawChart();
      }
    }

    function drawChart() {
      if (!chartContainer || !width || !height || data.length === 0) return;

      const innerWidth = Math.max(0, width - margin.left - margin.right);
      d3.select(chartContainer).selectAll("*").remove();
  
      const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => isNaN(+d.count) ? 0 : +d.count)])
        .range([0, innerWidth]);

  
      const yScale = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range([0, height - margin.bottom - margin.top])
        .padding(0.4);
  
      const svg = d3.select(chartContainer)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height]);
  
      // X축
      svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .call(d3.axisTop(xScale).ticks(5).tickFormat(d3.format(",.0f")))
        .call(g => g.selectAll(".domain").remove());
  
      // Y축
      svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .call(g => {
          const axis = d3.axisLeft(yScale);
          g.call(axis);
          g.selectAll(".domain").remove();

          const maxLength = 20;
          g.selectAll("text")
            .text(function (d) {
              return d.length > maxLength ? d.slice(0, maxLength - 1) + "…" : d;
            })
        });

  
      // Bar
      svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", 0)
        .attr("y", d => yScale(d.name))
        .attr("width", d => Math.max(xScale(d.count)))
        .attr("height", yScale.bandwidth())
        .attr("fill", SINGLE_DATA_COLOR)
        .on("mouseover", function (event, d) {
          onMouseOver(event, d);
          d3.select(this)
            .style("stroke", "#666")
            .style("stroke-width", "2px");

          tooltip
            .style("display", "block")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px")
            .html(`
              <div class="font-semibold">${d.name}</div>
              <div class="text-gray-600">
                ${d.groupLabel ? `${d.groupLabel}: ${d.count}` : `${d.count}`}
              </div>
            `);
        })
        .on("mousemove", function (event) {
          // 툴팁 위치 계속 업데이트 (스크롤 대응)
          tooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function (event) {
          onMouseOut(event);
          d3.select(this)
            .style("stroke", "none");

          tooltip.style("display", "none");
        });
    }
  
    onMount(async () => {
      if (browser) {
        handleResize();
        await tick();
        drawChart();
        window.addEventListener("resize", handleResize);

        tooltip = d3.select("body")
          .append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "white")
          .style("border", "1px solid #eee")
          .style("border-radius", "4px")
          .style("padding", "4px 6px")
          .style("display", "none")
          .style("pointer-events", "none")
          .style("z-index", "1000")
          .style("box-shadow", "0 2px 6px rgba(0,0,0,0.1)")
          .style("backdrop-filter", "blur(4px)")
          .style("font-size", "11px");
      }

    });
  
    onDestroy(() => {
      if (browser) {
        window.removeEventListener("resize", handleResize);
        if (tooltip) tooltip.remove();
      }
    });
  
    $: if (chartContainer && data.length > 0 && width && height && total > 0) {
      drawChart();
    }
</script>
  
<div class="relative w-full h-full">
  {#if !data || data.length === 0 || total === 0}
    <div class="absolute inset-0 flex items-center justify-center">
      <p class="text-xs text-gray-500 text-center">Currently, no data is available for display.</p>
    </div>
  {/if}

  <div bind:this={chartContainer} class="w-full h-full"></div>
</div>