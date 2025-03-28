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

    $: if (chartContainer && data.length > 0 && width && height) {
        drawChart();
    }
    
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
        .call(d3.axisLeft(yScale))
        .call(g => g.selectAll(".domain").remove());
  
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
        })
        .on("mouseout", function (event) {
          onMouseOut(event);
          d3.select(this)
            .style("stroke", "none");
        });
    }
  
    onMount(async () => {
      if (browser) {
        handleResize();
        await tick();
        drawChart();
        window.addEventListener("resize", handleResize);
      }
    });
  
    onDestroy(() => {
      if (browser) {
        window.removeEventListener("resize", handleResize);
      }
    });
  
    $: if (chartContainer && data.length > 0 && width && height) {
      drawChart();
    }
</script>
  
<div bind:this={chartContainer} class="w-full h-full"></div>